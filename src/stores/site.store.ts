import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { SiteConfig } from '@/shared/types/site'
import type { ComponentNode, ComponentType, GroupClassPreset } from '@/shared/types/component'
import { getComponentMeta } from '@/editor/registry'
import { loadSite, loadAllSites, saveSite, deleteSite } from '@/db'

let componentIdCounter = 0

function generateComponentId(): string {
  return `comp_${++componentIdCounter}_${Date.now()}`
}

export const useSiteStore = defineStore('site', () => {
  const sites = ref<SiteConfig[]>([])
  const currentSite = ref<SiteConfig | null>(null)
  const selectedComponentId = ref<string | null>(null)

  async function loadSites() {
    const all = await loadAllSites()
    sites.value = all ?? []
  }

  async function createSite(): Promise<string> {
    const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const site: SiteConfig = {
      id,
      title: '新建站点',
      components: [],
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
    return findComponentById(selectedComponentId.value, currentSite.value.components)
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

  function removeNode(id: string): ComponentNode | null {
    if (!currentSite.value) return null

    // Try root level
    const rootIndex = currentSite.value.components.findIndex((c) => c.id === id)
    if (rootIndex >= 0) {
      return currentSite.value.components.splice(rootIndex, 1)[0]
    }

    // Try nested slots
    for (const component of currentSite.value.components) {
      if (!component.slots) continue
      for (const children of Object.values(component.slots)) {
        const childIndex = children.findIndex((x) => x.id === id)
        if (childIndex >= 0) {
          return children.splice(childIndex, 1)[0]
        }
        // Try deeper nesting (grandchildren)
        for (const grandchild of children) {
          if (!grandchild.slots) continue
          for (const grandchildren of Object.values(grandchild.slots)) {
            const gcIndex = grandchildren.findIndex((x) => x.id === id)
            if (gcIndex >= 0) {
              return grandchildren.splice(gcIndex, 1)[0]
            }
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

    const parent = parentId ?? 'root'
    const idx = index ?? (parent === 'root' ? currentSite.value.components.length : 0)

    if (parent === 'root') {
      currentSite.value.components.splice(idx, 0, node)
      return
    }

    const parentNode = findComponentById(parent, currentSite.value.components)
    if (parentNode && parentNode.slots && parentNode.slots[slotName ?? 'default']) {
      parentNode.slots[slotName ?? 'default'].splice(idx, 0, node)
      return
    }

    currentSite.value.components.push(node)
  }

  function moveComponent(sourceId: string, targetParentId: string, targetSlot: string, targetIndex: number) {
    const source = removeNode(sourceId)
    if (!source) return

    if (targetParentId === 'root') {
      currentSite.value?.components.splice(targetIndex, 0, source)
    } else {
      const targetParent = findComponentById(targetParentId, currentSite.value?.components ?? [])
      if (targetParent && targetParent.slots && targetParent.slots[targetSlot]) {
        targetParent.slots[targetSlot].splice(targetIndex, 0, source)
      } else {
        currentSite.value?.components.push(source)
      }
    }

    selectedComponentId.value = source.id
  }

  function removeComponent(id: string) {
    if (!currentSite.value) return
    removeNode(id)
    if (selectedComponentId.value === id) {
      selectedComponentId.value = null
    }
  }

  function selectComponent(id: string | null) {
    selectedComponentId.value = id
  }

  function duplicateComponent(id: string) {
    if (!currentSite.value) return

    const source = findComponentById(id, currentSite.value.components)
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

    const parentArray = findParentArray(id, currentSite.value.components)
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

  async function loadCurrentSite(id: string) {
    const site = await loadSite(id)
    if (site) {
      currentSite.value = site
      selectedComponentId.value = null
    }
  }

  async function persistCurrentSite() {
    if (currentSite.value) {
      await saveSite(structuredClone(toRaw(currentSite.value)))
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
    persistCurrentSite,
    loadSites,
    createSite,
    deleteSiteById,
  }
})
