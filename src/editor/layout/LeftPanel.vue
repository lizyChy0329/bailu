<template>
  <div class="p-3">
    <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">组件</h3>
    <div class="space-y-2">
      <div
        v-for="meta in components"
        :key="meta.type"
        class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-grab hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      draggable="true"
      @dragstart="onDragStart($event, meta.type)"
    >
      <i :class="meta.icon" class="text-lg" />
      <span class="text-sm font-medium">{{ meta.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from '@/shared/types/component'
import { getAllComponentMetas } from '@/editor/registry'

const components = getAllComponentMetas()

function onDragStart(event: DragEvent, type: ComponentType) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('component-type', type)
    event.dataTransfer.effectAllowed = 'copy'
  }
}
</script>
