import { ref } from 'vue'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash'
import { useSiteStore } from '@/stores/site.store'
import type { ComponentType } from '@/shared/types/component'

export interface DragSourceData {
  source: 'palette' | 'tree' | 'canvas'
  componentType?: ComponentType
  compKey?: string
  parentId?: string
  slotName?: string
}

export interface DropTargetData {
  source?: string
  type?: string
  compKey?: string
  parentId?: string
  slotName?: string
}

export interface DropIndicatorState {
  y: number
  edge: 'top' | 'bottom' | null
}

const dropIndicator = ref<DropIndicatorState | null>(null)
const isDragging = ref(false)
let monitorCleanup: (() => void) | null = null
const cleanupMap = new Map<string, () => void>()

function clearDropIndicator() { dropIndicator.value = null }

function findComponentInTree(id: string, list: any[]): any {
  for (const n of list) {
    if (n.id === id) return n
    if (n.slots) for (const ch of Object.values(n.slots) as any[]) { const f = findComponentInTree(id, ch); if (f) return f }
  }
  return null
}

export function getCompIndex(id: string, parentId: string, slotName: string): number {
  const siteStore = useSiteStore()
  const site = siteStore.currentSite
  if (!site) return -1
  if (parentId === 'root' || parentId === '__root__' || parentId === 'page') {
    return (site.page.slots?.default ?? []).findIndex((c: any) => c.id === id)
  }
  const p = findComponentInTree(parentId, [site.page])
  if (p?.slots?.[slotName]) return p.slots[slotName].findIndex((c: any) => c.id === id)
  return -1
}

export function startMonitor() {
  if (monitorCleanup) return
  const siteStore = useSiteStore()
  monitorCleanup = monitorForElements({
    canMonitor: () => true,
    onDragStart: ({ source }) => {
      console.log('[DnD] dragStart', { source: source.data?.source ?? 'unknown' })
      isDragging.value = true
    },
    onDrop({ source, location }) {
      isDragging.value = false
      clearDropIndicator()
      const src = source.data as unknown as DragSourceData
      const target = location.current.dropTargets[0]
      if (!target) return
      const td = target.data as unknown as DropTargetData

      if (td.type === 'tree-container') {
        if (src.source === 'palette' && src.componentType) {
          siteStore.addComponent(src.componentType, 'root', 'default', 999)
        }
        return
      }

      const edge = extractClosestEdge(td as unknown as Record<string | symbol, unknown>)
      const parentId = (td.parentId === '__root__' ? 'root' : td.parentId) ?? 'root'
      const slotName = td.slotName ?? 'default'
      const targetKey = td.compKey
      let index = 999
      if (td.type === 'root' || td.type === 'slot') {
        index = edge === 'top' ? 0 : 999
      } else if (targetKey) {
        const idx = getCompIndex(targetKey, parentId, slotName)
        if (idx >= 0) index = edge === 'top' ? idx : idx + 1
      }
      if (src.source === 'palette' && src.componentType) {
        siteStore.addComponent(src.componentType, parentId, slotName, index)
      } else if (src.source === 'tree' || src.source === 'canvas') {
        const sourceId = src.compKey
        if (!sourceId || sourceId === targetKey) return
        const srcP = src.parentId ?? ''
        const srcS = src.slotName ?? ''
        let adj = index
        const sameList = (srcP === parentId || (srcP === '__root__' && parentId === 'root')) && srcS === slotName
        if (sameList) {
          const si = getCompIndex(sourceId, srcP, srcS)
          if (si >= 0 && si < adj) adj -= 1
        }
        siteStore.moveComponent(sourceId, parentId, slotName, adj)
        if (target.element) triggerPostMoveFlash(target.element as HTMLElement)
      }
    },
  })
}

export function stopMonitor() {
  monitorCleanup?.(); monitorCleanup = null
  for (const fn of cleanupMap.values()) fn()
  cleanupMap.clear()
}

export function useDragDrop() {
  function registerDraggable(el: HTMLElement, data: DragSourceData): () => void {
    return draggable({ element: el, getInitialData: () => data as unknown as Record<string, unknown> })
  }

  function registerDropTarget(
    el: HTMLElement,
    data: DropTargetData,
    containerEl: HTMLElement | null | undefined,
  ): () => void {
    return dropTargetForElements({
      element: el,
      getData: ({ input, element }) => attachClosestEdge(data as unknown as Record<string | symbol, unknown>, { input, element, allowedEdges: ['top', 'bottom'] }),
      onDrag({ location, self }) {
        if (!containerEl) return
        const input = location.current.input
        if (!input) return
        const innermost = location.current.dropTargets[0]
        if (!innermost || innermost.element !== self.element) return
        const rect = self.element.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const edge = input.clientY < midY ? 'top' : 'bottom'
        const vr = containerEl.getBoundingClientRect()
        dropIndicator.value = { y: edge === 'top' ? rect.top - vr.top : rect.bottom - vr.top, edge }
      },
      onDragLeave: () => {
        clearDropIndicator()
        console.log('[DnD] dragLeave')
      },
      onDropTargetChange({ location }) {
        if (!location.current.dropTargets.length) clearDropIndicator()
      },
    })
  }

  function trackCleanup(key: string, cleanup: () => void) {
    cleanupMap.get(key)?.()
    cleanupMap.set(key, cleanup)
  }

  function replaceCleanup(key: string, register: () => () => void) {
    cleanupMap.get(key)?.()
    const cleanup = register()
    cleanupMap.set(key, cleanup)
  }

  return { dropIndicator, isDragging, registerDraggable, registerDropTarget, trackCleanup, replaceCleanup, clearDropIndicator }
}
