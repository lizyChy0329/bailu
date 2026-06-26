import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { SiteConfig } from '@/shared/types/site'
import type { ComponentNode, ComponentType } from '@/shared/types/component'
import { getComponentMeta } from '@/editor/registry'
import { loadSite, loadAllSites, saveSite, deleteSite } from '@/db'

let componentIdCounter = 0

function generateComponentId(): string {
  return `comp_${++componentIdCounter}_${Date.now()}`
}

function createDefaultPageNode(): ComponentNode {
  return {
    id: 'page',
    type: 'Page',
    props: { backgroundImage: '' },
    styles: { classes: ['min-h-screen', 'w-full'], style: {}, groupRefs: [] },
    slots: { default: [] },
    slotVisibility: { default: true },
  }
}

export const useSiteStore = defineStore('site', () => {
  const sites = ref<SiteConfig[]>([])
  const currentSite = ref<SiteConfig | null>(null)
  const selectedComponentId = ref<string | null>(null)

  async function loadSites() {
    const all = await loadAllSites()
    for (const site of (all ?? [])) {
      migrateToPageNode(site)
    }
    sites.value = all ?? []
  }

  async function createSite(): Promise<string> {
    const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const site: SiteConfig = {
      id,
      title: '新建站点',
      page: createDefaultPageNode(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      groupClassPresets: [],
    }
    await saveSite(site)
    sites.value.push(site)
    return id
  }

  async function deleteSiteById(id: string) {
    await deleteSite(id)
    sites.value = sites.value.filter((s) => s.id !== id)
  }

  const selectedComponent = computed(() => {
    if (!currentSite.value || !selectedComponentId.value) return null
    return findComponentById(selectedComponentId.value, [currentSite.value.page])
  })

  function findComponentById(id: string, nodes: ComponentNode[]): ComponentNode | null {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.slots) {
        for (const children of Object.values(node.slots)) {
          const found = findComponentById(id, children)
          if (found) return found
        }
      }
    }
    return null
  }

  function removeNode(id: string, list?: ComponentNode[]): ComponentNode | null {
    if (!currentSite.value) return null
    if (id === 'page') return null

    const arr = list ?? (currentSite.value.page.slots?.default ?? [])

    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        const removed = arr.splice(i, 1)[0]
        if (selectedComponentId.value === id) selectedComponentId.value = null
        return removed
      }
      const s = arr[i].slots
      if (s) {
        for (const children of Object.values(s)) {
          const found = removeNode(id, children)
          if (found) {
            if (selectedComponentId.value === id) selectedComponentId.value = null
            return found
          }
        }
      }
    }
    return null
  }

  function addComponent(type: ComponentType, parentId?: string, slotName?: string, index?: number) {
    if (!currentSite.value) return
    const meta = getComponentMeta(type)
    if (!meta) return

    const node: ComponentNode = {
      id: generateComponentId(),
      type,
      props: { ...meta.defaultProps },
      styles: {
        classes: meta.defaultStyles.classes ?? [],
        style: meta.defaultStyles.style ?? {},
        groupRefs: meta.defaultStyles.groupRefs ?? [],
      },
    }

    if (meta.ptNodes) node.pt = {}
    if (meta.slots) {
      node.slots = {}
      node.slotVisibility = {}
      for (const s of meta.slots) {
        node.slots[s.name] = []
        node.slotVisibility[s.name] = true
      }
    }

    const parent = parentId && parentId !== 'root' ? parentId : 'page'
    const targetSlot = slotName ?? 'default'
    const rootChildren = currentSite.value.page.slots?.default ?? []
    const idx = index ?? (parent === 'page' ? rootChildren.length : 0)

    if (parent === 'page') {
      rootChildren.splice(idx, 0, node)
      return
    }

    const parentNode = findComponentById(parent, [currentSite.value.page])
    if (parentNode && parentNode.slots && parentNode.slots[targetSlot]) {
      parentNode.slots[targetSlot].splice(idx, 0, node)
      return
    }

    rootChildren.push(node)
  }

  function moveComponent(sourceId: string, targetParentId: string, targetSlot: string, targetIndex: number) {
    const source = removeNode(sourceId)
    if (!source) return

    const parent = targetParentId === 'root' ? 'page' : targetParentId

    if (parent === 'page') {
      const rootChildren = currentSite.value?.page.slots?.default ?? []
      rootChildren.splice(targetIndex, 0, source)
    } else {
      const targetParent = findComponentById(parent, [currentSite.value?.page!])
      if (targetParent && targetParent.slots && targetParent.slots[targetSlot]) {
        targetParent.slots[targetSlot].splice(targetIndex, 0, source)
      } else {
        currentSite.value?.page.slots?.default.push(source)
      }
    }

    selectedComponentId.value = source.id
  }

  function removeComponent(id: string) {
    if (!currentSite.value) return
    if (id === 'page') return
    removeNode(id)
  }

  function selectComponent(id: string | null) {
    selectedComponentId.value = id
  }

  function duplicateComponent(id: string) {
    if (!currentSite.value) return

    const source = findComponentById(id, [currentSite.value.page])
    if (!source) return

    const copy = structuredClone(toRaw(source))

    function reId(node: ComponentNode) {
      node.id = generateComponentId()
      if (node.slots) {
        for (const children of Object.values(node.slots)) {
          for (const child of children) {
            reId(child)
          }
        }
      }
    }

    reId(copy)

    const parentArray = findParentArray(id, [currentSite.value.page])
    if (parentArray) {
      const idx = parentArray.findIndex((c) => c.id === id)
      parentArray.splice(idx + 1, 0, copy)
      selectedComponentId.value = copy.id
    }
  }

  function findParentArray(id: string, nodes: ComponentNode[]): ComponentNode[] | null {
    for (const node of nodes) {
      if (node.id === id) return nodes
      if (node.slots) {
        for (const children of Object.values(node.slots)) {
          const found = findParentArray(id, children)
          if (found) return found
        }
      }
    }
    return null
  }

  function migrateComponent(node: ComponentNode): ComponentNode {
    const styles = node.styles as any
    if (styles?.class && typeof styles.class === 'string') {
      if (!node.styles.classes) {
        node.styles.classes = styles.class.split(' ').filter(Boolean)
      }
      delete styles.class
    }

    if (node.pt) {
      for (const key of Object.keys(node.pt)) {
        const ptNode = node.pt[key] as any
        if (ptNode.class && typeof ptNode.class === 'string') {
          if (!ptNode.classes) {
            ptNode.classes = ptNode.class.split(' ').filter(Boolean)
          }
          delete ptNode.class
        }
      }
    }

    if (node.slots) {
      for (const slotName of Object.keys(node.slots)) {
        for (const child of node.slots[slotName]) {
          migrateComponent(child)
        }
      }
    }

    return node
  }

  function migrateToPageNode(site: any): asserts site is SiteConfig {
    if ('components' in site && Array.isArray(site.components)) {
      const oldComponents: ComponentNode[] = site.components
      for (const comp of oldComponents) {
        migrateComponent(comp)
      }
      const page = createDefaultPageNode()
      page.slots!.default = oldComponents
      site.page = page
      delete site.components
    } else if (site.page) {
      migrateComponent(site.page)
    }
  }

  async function loadCurrentSite(id: string) {
    const site = await loadSite(id)
    if (site) {
      migrateToPageNode(site)
      currentSite.value = site as SiteConfig
      selectedComponentId.value = null
    }
  }

  async function persistCurrentSite() {
    if (currentSite.value) {
      await saveSite(JSON.parse(JSON.stringify(currentSite.value)))
    }
  }

  return {
    sites,
    currentSite,
    selectedComponentId,
    selectedComponent,
    addComponent,
    moveComponent,
    removeComponent,
    duplicateComponent,
    selectComponent,
    loadCurrentSite,
    loadSite: loadCurrentSite,
    persistCurrentSite,
    loadSites,
    createSite,
    deleteSiteById,
  }
})
