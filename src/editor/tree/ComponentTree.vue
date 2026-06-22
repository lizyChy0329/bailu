<template>
  <div class="p-2">
    <Tree
      :value="treeNodes"
      selectionMode="single"
      v-model:selectionKeys="selectionKey"
      :expandedKeys="expandedKeys"
      draggableNodes
      droppableNodes
      :validateDrop="true"
      @nodeSelect="onNodeSelect"
      @nodeDrop="onNodeDrop"
      class="w-full !border-none"
    >
      <template #default="slotProps">
        <div class="flex items-center gap-2">
          <i :class="slotProps.node.icon" class="text-sm" />
          <span class="text-xs">{{ slotProps.node.label }}</span>
        </div>
      </template>
    </Tree>

    <div v-if="treeNodes.length === 0" class="text-xs text-gray-400 text-center py-6">
      画布中暂无组件
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentNode, ComponentType } from '@/shared/types/component'
import Tree from 'primevue/tree'

interface PrimeTreeNode {
  key: string
  label: string
  icon: string
  type: 'component' | 'slot'
  data?: ComponentNode
  children?: PrimeTreeNode[]
}

const siteStore = useSiteStore()

// ── 提取节点 id（slot 节点 key = "componentId:slotName" → id = "componentId"）──
function extractNodeId(key: string): string {
  const idx = key.indexOf(':')
  return idx >= 0 ? key.substring(0, idx) : key
}

// ── 将 ComponentNode 递归构建为 PrimeTreeNode ──
function buildTreeNodes(components: ComponentNode[]): PrimeTreeNode[] {
  return components.map((comp) => {
    const meta = getComponentMeta(comp.type)
    const children: PrimeTreeNode[] = []

    // 为每个 slot 创建子节点
    if (comp.slots) {
      for (const [slotName, slotChildren] of Object.entries(comp.slots)) {
        const slotKey = `${comp.id}:${slotName}`
        const slotChildrenNodes = buildTreeNodes(slotChildren)
        children.push({
          key: slotKey,
          label: `[slot: ${slotName}]`,
          icon: 'pi pi-folder',
          type: 'slot',
          children: slotChildrenNodes,
        })
      }
    }

    return {
      key: comp.id,
      label: meta?.label ?? comp.type,
      icon: meta?.icon ?? 'pi pi-cube',
      type: 'component',
      data: comp,
      children: children.length > 0 ? children : undefined,
    }
  })
}

// ── 从 store 实时构建树 ──
const treeNodes = computed<PrimeTreeNode[]>(() => {
  if (siteStore.currentSite) {
    return buildTreeNodes(siteStore.currentSite.components)
  }
  return []
})

// ── 选中同步 ──
const selectionKey = computed({
  get: () => siteStore.selectedComponentId,
  set: (val) => {
    // v-model 会写回，但我们在 @nodeSelect 中处理
  },
})

// ── 展开所有节点 ──
const expandedKeys = ref<Record<string, boolean>>({})

watch(treeNodes, (nodes) => {
  const keys: Record<string, boolean> = {}
  function walk(list: PrimeTreeNode[]) {
    for (const n of list) {
      keys[n.key] = true
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  expandedKeys.value = { ...keys }
}, { immediate: true })

// ── 事件处理 ──

function onNodeSelect(node: PrimeTreeNode) {
  if (node.type === 'slot') {
    // 点击 slot 节点 → 选中 slot 中第一个子组件
    const parentId = extractNodeId(node.key)
    // 先选中父组件
    siteStore.selectComponent(parentId)
  } else {
    siteStore.selectComponent(node.key)
  }
}

function onNodeDrop(event: any) {
  // event: { dragNode, dropNode, index, position }
  // PrimeVue 4 Tree internal drag-drop — 暂不处理，后续实现
}
</script>
