import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ComponentNode, ComponentType } from '@/shared/types/component'
import type { SiteConfig } from '@/shared/types/site'
import { generateId } from '@/shared/utils/id'
import { getComponentMeta } from '@/editor/registry'
import { listSites, getSite, saveSite, deleteSite } from '@/db'

export const useSiteStore = defineStore('site', () => {
  const sites = ref<SiteConfig[]>([])
  const currentSite = ref<SiteConfig | null>(null)
  const selectedComponentId = ref<string | null>(null)

  const selectedComponent = computed(() => {
    if (!currentSite.value || !selectedComponentId.value) return null
    return findComponent(currentSite.value.components, selectedComponentId.value)
  })

  function findComponent(list: ComponentNode[], id: string): ComponentNode | null {
    for (const node of list) {
      if (node.id === id) return node
      if (node.slots) {
        for (const slotName of Object.keys(node.slots)) {
          const found = findComponent(node.slots[slotName], id)
          if (found) return found
        }
      }
    }
    return null
  }

  async function loadSites() {
    sites.value = await listSites()
  }

  async function createSite(): Promise<string> {
    const id = generateId()
    const now = Date.now()
    const site: SiteConfig = {
      id,
      title: '未命名站点',
      components: [],
      createdAt: now,
      updatedAt: now,
    }
    await saveSite(site)
    await loadSites()
    return id
  }

  async function loadSite(id: string) {
    const site = await getSite(id)
    if (site) currentSite.value = site
  }

  async function persistCurrentSite() {
    if (!currentSite.value) return
    await saveSite(currentSite.value)
  }

  function addComponent(type: ComponentType, options?: { x?: number; y?: number; width?: number; height?: number }) {
    if (!currentSite.value) return
    const meta = getComponentMeta(type)
    if (!meta) return
    const node: ComponentNode = {
      id: generateId(),
      type,
      props: { ...meta.defaultProps },
      styles: { ...meta.defaultStyles },
    }
    if (meta.ptNodes) node.pt = {}
    if (meta.slots) {
      node.slots = {}
      for (const slot of meta.slots) {
        node.slots[slot.name] = []
      }
    }
    if (options) {
      node.x = options.x
      node.y = options.y
      node.width = options.width
      node.height = options.height
    }
    currentSite.value.components.push(node)
  }

  function removeComponent(id: string) {
    if (!currentSite.value) return
    currentSite.value.components = currentSite.value.components.filter(c => c.id !== id)
    if (selectedComponentId.value === id) selectedComponentId.value = null
  }

  function selectComponent(id: string | null) {
    selectedComponentId.value = id
  }

  async function deleteSiteById(id: string) {
    await deleteSite(id)
    await loadSites()
  }

  return {
    sites,
    currentSite,
    selectedComponentId,
    selectedComponent,
    loadSites,
    createSite,
    loadSite,
    persistCurrentSite,
    addComponent,
    removeComponent,
    selectComponent,
    deleteSiteById,
  }
})
