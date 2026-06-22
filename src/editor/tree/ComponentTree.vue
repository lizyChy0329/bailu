<template>
  <div class="p-2">
    <Tree :value="treeNodes" selectionMode="single" v-model:selectionKeys="selectionKey"
      :expandedKeys="expandedKeys" draggableNodes droppableNodes :validateDrop="true"
      @nodeSelect="onNodeSelect" @nodeDrop="onNodeDrop"
      :pt="{ nodeIcon: { style: { display: 'none' } } }" class="w-full !border-none">
      <template #default="sp">
        <div class="flex items-center gap-2">
          <i v-if="sp.node.type === 'slot'" class="pi pi-folder text-sm text-gray-400" />
          <i v-else :class="sp.node.data?.icon || 'pi pi-cube'" class="text-sm" />
          <span class="text-xs">{{ sp.node.label }}</span>
        </div>
      </template>
    </Tree>
    <div v-if="treeNodes.length === 0" class="text-xs text-gray-400 text-center py-6">画布中暂无组件</div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentNode, ComponentType } from '@/shared/types/component'
import Tree from 'primevue/tree'
interface PrimeTreeNode { key: string; label: string; type: 'component' | 'slot'; data?: any; children?: PrimeTreeNode[] }
const siteStore = useSiteStore()
/* 构建树节点。每个 slot 节点带 parentId / slotName 信息用于拖放落点判断 */
function buildTreeNodes(components: ComponentNode[], parentId?: string, parentSlot?: string): PrimeTreeNode[] {
  return components.map((comp) => {
    const meta = getComponentMeta(comp.type)
    const children: PrimeTreeNode[] = []
    if (comp.slots) {
      for (const [slotName, slotChildren] of Object.entries(comp.slots)) {
        children.push({
          key: `${comp.id}:${slotName}`,
          label: `[slot: ${slotName}]`,
          type: 'slot',
          data: { parentId: comp.id, slotName },
          children: buildTreeNodes(slotChildren, comp.id, slotName),
        })
      }
    }
    return {
      key: comp.id,
      label: meta?.label ?? comp.type,
      type: 'component',
      data: { icon: meta?.icon, type: comp.type, parentId: parentId ?? 'root', slotName: parentSlot ?? 'default' },
      children: children.length > 0 ? children : undefined,
    }
  })
}
const treeNodes = computed<PrimeTreeNode[]>(() => {
  if (siteStore.currentSite) return buildTreeNodes(siteStore.currentSite.components)
  return []
})
/* 选中同步 */
const selectionKey = computed({
  get: () => siteStore.selectedComponentId,
  set: () => {},  // v-model 回写由 @nodeSelect 控制
})
/* 全部展开 */
const expandedKeys = ref<Record<string, boolean>>({})
watch(treeNodes, (nodes) => {
  const keys: Record<string, boolean> = {}
  function walk(list: PrimeTreeNode[]) { for (const n of list) { keys[n.key] = true; if (n.children) walk(n.children) } }
  walk(nodes)
  expandedKeys.value = { ...keys }
}, { immediate: true })
/* 事件 */
function onNodeSelect(node: PrimeTreeNode) {
  if (node.type === 'slot') { siteStore.selectComponent(node.data.parentId) }
  else { siteStore.selectComponent(node.key) }
}
function onNodeDrop(event: any) {
  const { dragNode, dropNode, position } = event
  const sourceId = dragNode.key
  if (sourceId === dropNode.key) return  // 拖到自身
  let targetParentId = 'root'
  let targetSlotName = 'default'
  let targetIndex = 0
  if (dropNode.type === 'slot') {
    targetParentId = dropNode.data.parentId
    targetSlotName = dropNode.data.slotName
    targetIndex = position === 1 ? 0 : 999  // before=开头, over/after=末尾
  } else if (position === 0) {
    const meta = getComponentMeta(dropNode.data?.type)
    if (meta?.slots && meta.slots.length > 0) { targetParentId = dropNode.key; targetSlotName = 'default'; targetIndex = 0 }
    else return  // 不允许放到无 slot 的组件上
  } else {
    targetParentId = dropNode.data.parentId
    targetSlotName = dropNode.data.slotName
    targetIndex = position === 1 ? 0 : 999
  }
  siteStore.moveComponent(sourceId, targetParentId, targetSlotName, targetIndex)
}
</script>
