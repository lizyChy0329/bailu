<template>
  <div class="p-3 panel-container">
    <div
      v-for="(group, gi) in groups"
      :key="gi"
      class="mb-4 last:mb-0"
    >
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ group.name }}</h3>
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="meta in group.items"
          :key="meta.type"
          class="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-grab hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          draggable="true"
          @dragstart="onDragStart($event, meta.type)"
        >
          <i :class="meta.icon" class="icon-responsive" />
          <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ meta.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentMeta, ComponentType } from '@/shared/types/component'
import { getComponentMeta } from '@/editor/registry'

type ComponentGroup = {
  name: string
  items: ComponentMeta[]
}

const groupDefs: { name: string; types: ComponentType[] }[] = [
  { name: '布局类', types: ['Card', 'Panel', 'ScrollPanel'] },
  { name: '内容类', types: ['Image'] },
  { name: '交互类', types: ['Button'] },
]

const groups: ComponentGroup[] = groupDefs
  .map((g) => ({
    name: g.name,
    items: g.types.map((t) => getComponentMeta(t)).filter(Boolean) as ComponentMeta[],
  }))
  .filter((g) => g.items.length > 0)

function onDragStart(event: DragEvent, type: ComponentType) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('component-type', type)
    event.dataTransfer.effectAllowed = 'copy'
  }
}
</script>

<style scoped>
.panel-container {
  container-type: inline-size;
}
.icon-responsive {
  font-size: clamp(1.25rem, 7cqw, 3rem);
  line-height: 1;
}
</style>
