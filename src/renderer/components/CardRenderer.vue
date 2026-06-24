<template>
  <Card v-bind="node.props" :class="finalClass" :style="node.styles?.style" :pt="node.pt">
    <template #header>
      <template v-if="(node?.slotVisibility?.header??true)">
        <Renderer v-if="node?.slots?.header?.length" :dsl="node.slots.header"/>
        <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 m-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
          <i class="pi pi-folder-open mr-1"/>header 插槽 — 从左侧拖入组件</div>
      </template>
    </template>
    <template #title>
      <template v-if="(node?.slotVisibility?.title??true)">
        <Renderer v-if="node?.slots?.title?.length" :dsl="node.slots.title"/>
        <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 m-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
          <i class="pi pi-folder-open mr-1"/>title 插槽 — 从左侧拖入组件</div>
      </template>
    </template>
    <template #subtitle>
      <template v-if="(node?.slotVisibility?.subtitle??true)">
        <Renderer v-if="node?.slots?.subtitle?.length" :dsl="node.slots.subtitle"/>
        <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 m-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
          <i class="pi pi-folder-open mr-1"/>subtitle 插槽 — 从左侧拖入组件</div>
      </template>
    </template>
    <template #content>
      <template v-if="(node?.slotVisibility?.content??true)">
        <Renderer v-if="node?.slots?.content?.length" :dsl="node.slots.content"/>
        <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 m-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
          <i class="pi pi-folder-open mr-1"/>content 插槽 — 从左侧拖入组件</div>
      </template>
    </template>
    <template #footer>
      <template v-if="(node?.slotVisibility?.footer??true)">
        <Renderer v-if="node?.slots?.footer?.length" :dsl="node.slots.footer"/>
        <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 m-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
          <i class="pi pi-folder-open mr-1"/>footer 插槽 — 从左侧拖入组件</div>
      </template>
    </template>
  </Card>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentNode } from '@/shared/types/component'
import Card from 'primevue/card'
import Renderer from '@/renderer/core/Renderer.vue'
import { computeFinalClasses } from '@/shared/utils/classMerger'

const props = defineProps<{ node: ComponentNode }>()
const finalClass = computed(() => computeFinalClasses(props.node))
</script>
