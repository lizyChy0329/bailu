<template>
  <div
    class="pt-diagram-box"
    :class="depth === 0
      ? 'border-dashed border-primary'
      : 'border-solid border-surface-300 dark:border-surface-600'"
  >
    <div class="text-center text-xs font-medium leading-tight px-1.5 py-0.5">{{ node.label }}</div>
    <div v-if="node.children?.length" class="flex flex-wrap gap-1 p-1.5">
      <PtDiagram
        v-for="child in node.children"
        :key="child.name"
        :node="child"
        :depth="(depth ?? 0) + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PTNodeMeta } from '@/shared/types/component'

defineProps<{
  node: PTNodeMeta
  depth?: number
}>()
</script>

<style scoped>
.pt-diagram-box {
  border-width: 1px;
  border-radius: 6px;
}
</style>
