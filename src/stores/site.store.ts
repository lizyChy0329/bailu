import { defineStore } from 'pinia'; import { ref, computed, toRaw } from 'vue'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentNode, ComponentType, GroupClassPreset } from '@/shared/types/component'
let _ic = 0
function genId(): string { return `comp_${++_ic}_${Date.now()}` }
import { loadSite as _ls, loadAllSites as _las, saveSite as _ss, deleteSite as _ds } from '@/db'
export interface Site { id: string; title: string; components: ComponentNode[]; createdAt: number; updatedAt: number; groupClassPresets: GroupClassPreset[] }
export const useSiteStore = defineStore('site', () => {
  const sites = ref<Site[]>([]); const cs = ref<Site | null>(null); const scid = ref<string | null>(null)
  async function loadSites() { sites.value = await _las() as any }
  async function createSite() { const id = `s_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; const s: Site = {id,title:'新建站点',components:[],createdAt:Date.now(),updatedAt:Date.now(),groupClassPresets:[]}; await _ss(structuredClone(toRaw(s))); sites.value.push(s as any); return id }
  async function deleteSiteById(id: string) { await _ds(id); sites.value = sites.value.filter(s => s.id !== id) }
  const selectedComponent = computed(() => { if (!cs.value || !scid.value) return null; return fn(scid.value, cs.value.components) })
  function fn(id: string, nodes: ComponentNode[]): ComponentNode | null {
    for (const n of nodes) { if (n.id === id) return n; if (n.slots) { for (const ch of Object.values(n.slots)) { const f = fn(id, ch); if (f) return f } } }; return null
  }
  function rm(id: string): ComponentNode | null {
    if (!cs.value) return null; let i = cs.value.components.findIndex(c => c.id === id); if (i >= 0) return cs.value.components.splice(i,1)[0]
    for (const c of cs.value.components) { if (!c.slots) continue; for (const ch of Object.values(c.slots)) { let i2 = ch.findIndex(x => x.id === id); if (i2 >= 0) return ch.splice(i2,1)[0]; for (const gc of ch) { if (gc.slots) { for (const gch of Object.values(gc.slots)) { let i3 = gch.findIndex(x => x.id === id); if (i3 >= 0) return gch.splice(i3,1)[0] } } } } }; return null
  }
  function addComponent(type: ComponentType, parentId?: string, slotName?: string, index?: number) {
    if (!cs.value) return; const meta = getComponentMeta(type); if (!meta) return
    const node: ComponentNode = { id: genId(), type, props: { ...meta.defaultProps }, styles: { classes: meta.defaultStyles.classes ?? [], style: meta.defaultStyles.style ?? {}, groupRefs: meta.defaultStyles.groupRefs ?? [] } }
if (meta.ptNodes) node.pt = {}; if (meta.slots) { node.slots = {}; node.slotVisibility = {}; for (const s of meta.slots) { node.slots[s.name] = []; node.slotVisibility[s.name] = true } }
    const p = parentId ?? 'root'; const idx = index ?? (p === 'root' ? cs.value.components.length : 0)
    if (p === 'root') { cs.value.components.splice(idx, 0, node); return }
    const parent = fn(p, cs.value.components)
    if (parent && parent.slots && parent.slots[slotName ?? 'default']) { parent.slots[slotName ?? 'default'].splice(idx, 0, node); return }
    cs.value.components.push(node)
  }
  function moveComponent(si: string, tp: string, ts: string, ti: number) {
    const src = rm(si); if (!src) return
    if (tp === 'root') { cs.value?.components.splice(ti, 0, src) }
    else { const t = fn(tp, cs.value?.components ?? []); if (t && t.slots && t.slots[ts]) t.slots[ts].splice(ti, 0, src); else cs.value?.components.push(src) }
    scid.value = src.id
  }
  function removeComponent(id: string) { if (!cs.value) return; rm(id); if (scid.value === id) scid.value = null }
  function selectComponent(id: string | null) { scid.value = id }

  function duplicateComponent(id: string) {
    if (!cs.value) return
    const src = fn(id, cs.value.components)
    if (!src) return
    const copy = structuredClone(toRaw(src))
    function reId(n: ComponentNode) {
      n.id = genId()
      if (n.slots) for (const ch of Object.values(n.slots)) for (const c of ch) reId(c)
    }
    reId(copy)
    const list = findList(id, cs.value.components)
    if (list) {
      const idx = list.findIndex(c => c.id === id)
      list.splice(idx + 1, 0, copy)
      scid.value = copy.id
    }
  }
  function findList(id: string, nodes: ComponentNode[]): ComponentNode[] | null {
    for (const n of nodes) {
      if (n.id === id) return nodes
      if (n.slots) for (const ch of Object.values(n.slots)) { const r = findList(id, ch); if (r) return r }
    }
    return null
  }

  async function loadCurrentSite(id: string) { cs.value = await _ls(id) as any; scid.value = null }
  async function persistCurrentSite() { if (cs.value) await _ss(structuredClone(toRaw(cs.value))) }
  return { sites, currentSite: cs, selectedComponentId: scid, selectedComponent, addComponent, moveComponent, removeComponent, duplicateComponent, selectComponent, loadCurrentSite, persistCurrentSite, loadSites, createSite, deleteSiteById }
})
