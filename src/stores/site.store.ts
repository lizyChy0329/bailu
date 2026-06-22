import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentNode, ComponentType } from '@/shared/types/component'
let _idCounter = 0
function generateId(): string { return `comp_${++_idCounter}_${Date.now()}` }
import { loadSite as dbLoadSite, saveSite } from '@/db'
export interface Site { id: string; title: string; components: ComponentNode[]; createdAt: number; updatedAt: number }
export const useSiteStore = defineStore('site', () => {
  const currentSite = ref<Site | null>(null)
  const selectedComponentId = ref<string | null>(null)
  const selectedComponent = computed(() => {
    if (!currentSite.value || !selectedComponentId.value) return null
    return findNode(selectedComponentId.value, currentSite.value.components)
  })
  function findNode(id: string, nodes: ComponentNode[]): ComponentNode | null {
    for (const n of nodes) {
      if (n.id === id) return n
      if (n.slots) { for (const children of Object.values(n.slots)) { const f = findNode(id, children); if (f) return f } }
    }
    return null
  }
  function removeFromTree(id: string): ComponentNode | null {
    if (!currentSite.value) return null
    const idx = currentSite.value.components.findIndex(c => c.id === id)
    if (idx >= 0) return currentSite.value.components.splice(idx, 1)[0]
    for (const comp of currentSite.value.components) {
      if (!comp.slots) continue
      for (const children of Object.values(comp.slots)) {
        const idx2 = children.findIndex(c => c.id === id)
        if (idx2 >= 0) return children.splice(idx2, 1)[0]
        for (const child of children) {
          if (child.slots) { for (const grandChildren of Object.values(child.slots)) { const idx3 = grandChildren.findIndex(c => c.id === id); if (idx3 >= 0) return grandChildren.splice(idx3, 1)[0] } }
        }
      }
    }
    return null
  }
  function addComponent(type: ComponentType, parentId?: string, slotName?: string, index?: number) {
    if (!currentSite.value) return
    const meta = getComponentMeta(type); if (!meta) return
    const node: ComponentNode = { id: generateId(), type, props: { ...meta.defaultProps }, styles: { ...meta.defaultStyles } }
    if (meta.ptNodes) node.pt = {}
    if (meta.slots) { node.slots = {}; for (const slot of meta.slots) node.slots[slot.name] = [] }
    const pId = parentId ?? 'root'; const sName = slotName ?? 'default'; const idx = index ?? (pId === 'root' ? currentSite.value.components.length : 0)
    if (pId === 'root') { currentSite.value.components.splice(idx, 0, node); return }
    const parent = findNode(pId, currentSite.value.components)
    if (parent && parent.slots && parent.slots[sName]) { parent.slots[sName].splice(idx, 0, node); return }
    currentSite.value.components.push(node)
  }
  function moveComponent(sourceId: string, targetParentId: string, targetSlotName: string, targetIndex: number) {
    const source = removeFromTree(sourceId); if (!source) return
    if (targetParentId === 'root') { currentSite.value?.components.splice(targetIndex, 0, source) }
    else {
      const target = findNode(targetParentId, currentSite.value?.components ?? [])
      if (target && target.slots && target.slots[targetSlotName]) { target.slots[targetSlotName].splice(targetIndex, 0, source) }
      else { currentSite.value?.components.push(source) }
    }
    selectedComponentId.value = source.id
  }
  function removeComponent(id: string) {
    if (!currentSite.value) return
    removeFromTree(id)
    if (selectedComponentId.value === id) selectedComponentId.value = null
  }
  function selectComponent(id: string | null) { selectedComponentId.value = id }
  async function loadCurrentSite(id: string) { currentSite.value = await dbLoadSite(id); selectedComponentId.value = null }
  async function persistCurrentSite() { if (currentSite.value) await saveSite(currentSite.value) }
  return { currentSite, selectedComponentId, selectedComponent, addComponent, moveComponent, removeComponent, selectComponent, loadCurrentSite, persistCurrentSite }
})
