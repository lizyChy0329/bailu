<template>
  <div ref="treeContainer" class="relative h-full select-none">
    <!-- 拖入接收浮层 -->
    <div v-if="isPaletteOverTree"
      class="absolute inset-0 z-10 pointer-events-none outline-2 outline-dashed outline-blue-400 -outline-offset-2 rounded-lg bg-blue-50/30 dark:bg-blue-900/10 flex items-center justify-center">
      <span class="text-sm text-blue-500 font-medium">释放以添加到页面</span>
    </div>
    <Tree v-if="siteStore.currentSite" :value="treeNodes" selectionMode="single"
      v-model:selectionKeys="selectionKey" :expandedKeys="expandedKeys"
      draggableNodes droppableNodes @node-drop="onTreeNodeDrop"
      @nodeSelect="onNodeSelect"
      :pt="{
        root: { class: '!border-none' },
        nodeIcon: { style: { display: 'none' } },
        nodeToggleButton: { class: '!w-5 !h-5' },
        nodeContent: { class: '!py-2' },
        subgroup: { class: '!pl-5' },
      }" class="w-full !border-none !text-sm">
      <template #default="sp">
        <div :ref="(el) => registerTreeNode(el as HTMLElement | null, sp.node as unknown as PrimeTreeNode)" class="flex items-center gap-2" @contextmenu.prevent="onContextMenu($event, sp.node)">
          <i v-if="sp.node.type === 'root'" class="pi pi-sitemap text-sm text-gray-500" />
          <i v-else-if="sp.node.type === 'slot'" class="pi pi-folder text-xs text-gray-400" />
          <i v-else :class="sp.node.data?.icon || 'pi pi-cube'" class="text-xs" />
          <span class="text-xs truncate"
            :class="sp.node.type === 'root' ? 'font-semibold text-gray-700 dark:text-gray-200' : ''">
            {{ sp.node.label }}
          </span>
        </div>
      </template>
    </Tree>
    <ContextMenu ref="contextMenuRef" :model="contextMenuItems" />
    <div v-if="siteStore.currentSite && treeNodes[0]?.children?.length === 0 && !isPaletteOverTree"
      class="text-xs text-gray-400 text-center py-8 pointer-events-none">从左侧拖拽组件到此处</div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import { useDragDrop, getCompIndex } from '@/composables/useDragDrop'
import type { DragSourceData } from '@/composables/useDragDrop'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { ComponentNode, ComponentType } from '@/shared/types/component'
import type { TreeNodeDropEvent } from 'primevue/tree'
import Tree from 'primevue/tree'
import ContextMenu from 'primevue/contextmenu'

interface PrimeTreeNode { key: string; label: string; type: string; data?: any; children?: PrimeTreeNode[] }

const siteStore = useSiteStore()
const treeContainer = ref<HTMLElement | null>(null)
const isPaletteOverTree = ref(false)
const { registerDraggable, trackCleanup, replaceCleanup } = useDragDrop()

/* 右键菜单 */
const contextMenuRef = ref<any>(null)
const contextTarget = ref<string | null>(null)
const contextMenuItems = ref([
  { label: '删除', icon: 'pi pi-trash', command: () => { if (contextTarget.value) siteStore.removeComponent(contextTarget.value) } },
  { separator: true },
  { label: '复制', icon: 'pi pi-copy', command: () => { if (contextTarget.value) siteStore.duplicateComponent(contextTarget.value) } },
])
function onContextMenu(e: MouseEvent, node: any) {
  if (node.type === 'root' || node.type === 'slot' || node.key === 'page') return
  contextTarget.value = node.key
  contextMenuRef.value?.show(e)
}

/* 树节点构建 */
function buildTreeNodes(components: ComponentNode[], parentId?: string, parentSlot?: string): PrimeTreeNode[] {
  return components.map((comp) => {
    const meta = getComponentMeta(comp.type)
    const children: PrimeTreeNode[] = []
    if (comp.slots) {
      for (const [slotName, slotChildren] of Object.entries(comp.slots)) {
        if (slotName === 'default') {
          children.push(...buildTreeNodes(slotChildren, comp.id, slotName))
        } else {
          children.push({
            key: `${comp.id}:${slotName}`,
            label: `[slot: ${slotName}]`,
            type: 'slot',
            data: { parentId: comp.id, slotName },
            children: buildTreeNodes(slotChildren, comp.id, slotName),
          })
        }
      }
    }
    return {
      key: comp.id,
      label: comp.id === 'page' ? (siteStore.currentSite?.title || '页面') : (meta?.label ?? comp.type),
      type: 'component',
      data: { icon: meta?.icon, type: comp.type, parentId: parentId ?? 'root', slotName: parentSlot ?? 'default' },
      children: children.length > 0 ? children : undefined,
    }
  })
}
const treeNodes = computed<PrimeTreeNode[]>(() => {
  if (!siteStore.currentSite) return []
  return buildTreeNodes([siteStore.currentSite.page], 'root', 'default')
})

/* 展开 */
const selectionKey = computed({ get: () => (siteStore.selectedComponentId ?? undefined) as any, set: () => {} })
const expandedKeys = ref<Record<string, boolean>>({})
watch(treeNodes, (nodes) => {
  const keys: Record<string, boolean> = {}
  function walk(list: PrimeTreeNode[]) { for (const n of list) { keys[n.key] = true; if (n.children) walk(n.children) } }
  walk(nodes)
  expandedKeys.value = { ...keys }
}, { immediate: true })

/* Pragmatic DnD — 树节点作为到画布的 drag 源 */
function registerTreeNode(el: HTMLElement | null, node: PrimeTreeNode) {
  const key = node.key
  if (!el) {
    trackCleanup(`drag:${key}`, () => {})
    return
  }
  const treeNodeEl = el.closest('.p-tree-node') as HTMLElement
  if (!treeNodeEl) return

  if (node.type === 'component' && node.key !== 'page') {
    const data = {
      source: 'tree' as const,
      type: 'component' as const,
      compKey: node.key,
      parentId: node.data?.parentId ?? 'root',
      slotName: node.data?.slotName ?? 'default',
    }
    replaceCleanup(`drag:${key}`, () => registerDraggable(treeNodeEl, data))
  }
}

/* 容器级 drop — palette→tree 整个容器作为接收区，默认追加到根层 */
onMounted(() => {
  const container = treeContainer.value
  if (!container) return

  replaceCleanup('tree-container', () => dropTargetForElements({
    element: container,
    getData: () => ({ type: 'tree-container' as const, source: 'tree' as const }),
    onDragStart({ source }) {
      const src = source.data as unknown as DragSourceData
      if (src.source === 'palette') isPaletteOverTree.value = true
    },
    onDrag({ source }) {
      const src = source.data as unknown as DragSourceData
      isPaletteOverTree.value = src.source === 'palette'
    },
    onDrop() {
      isPaletteOverTree.value = false
    },
    onDragLeave() {
      isPaletteOverTree.value = false
    },
    onDropTargetChange({ location }) {
      if (!location.current.dropTargets.length) isPaletteOverTree.value = false
    },
  }))
})

/* Tree 内部节点重排 — PrimeVue 原生 @node-drop */
function onTreeNodeDrop(event: TreeNodeDropEvent) {
  const sourceId = event.dragNode.key
  if (!sourceId || sourceId === 'page') return

  let parentId = 'root'
  let slotName = 'default'
  let targetIndex = event.index

  if (!event.dropNode || event.dropNode.key === 'page' || event.dropNode.key === '__root__') {
    parentId = 'root'
    slotName = 'default'
  } else if (event.dropPosition === 0) {
    if (event.dropNode.type === 'slot') {
      const [pid, sn] = event.dropNode.key.split(':')
      parentId = pid
      slotName = sn
      targetIndex = 0
    } else {
      parentId = event.dropNode.key
      const meta = getComponentMeta(event.dropNode.data?.type)
      slotName = meta?.slots?.[0]?.name ?? 'default'
      targetIndex = 0
    }
  } else if (event.dropNode.type === 'slot') {
    const [pid, sn] = event.dropNode.key.split(':')
    parentId = pid
    slotName = sn
    targetIndex = event.dropPosition === -1 ? event.index : event.index + 1
  } else {
    parentId = event.dropNode.data?.parentId ?? 'root'
    slotName = event.dropNode.data?.slotName ?? 'default'
    targetIndex = event.dropPosition === -1 ? event.index : event.index + 1
  }

  if (parentId === '__root__') parentId = 'root'

  // 同列表调整
  const srcP = event.dragNode.data?.parentId ?? ''
  const srcS = event.dragNode.data?.slotName ?? ''
  const sameList = (srcP === parentId || (srcP === '__root__' && parentId === 'root') || (srcP === 'page' && parentId === 'root')) && srcS === slotName
  if (sameList) {
    const si = getCompIndex(sourceId, srcP === '__root__' ? 'root' : srcP, srcS)
    if (si >= 0 && si < targetIndex) targetIndex -= 1
  }

  siteStore.moveComponent(sourceId, parentId, slotName, targetIndex)
}

/* 选择 */
function onNodeSelect(node: any) {
  if (node.type === 'slot') siteStore.selectComponent(node.data.parentId)
  else siteStore.selectComponent(node.key)
}

</script>
