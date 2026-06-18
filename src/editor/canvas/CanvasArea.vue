<template>
  <div
    class="min-h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
  >
    <div v-if="!siteStore.currentSite || siteStore.currentSite.components.length === 0" class="text-center py-20 text-gray-400 text-sm">
      从左侧拖拽组件到此处
    </div>

    <VueDraggable
      v-if="siteStore.currentSite"
      v-model="rootComponents"
      :animation="200"
      handle=".drag-handle"
      ghost-class="opacity-30"
      class="space-y-3"
    >
      <div
        v-for="comp in rootComponents"
        :key="comp.id"
        class="relative group border-2 rounded-lg transition-colors"
        :class="siteStore.selectedComponentId === comp.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
        @click.stop="siteStore.selectComponent(comp.id)"
      >
        <div class="drag-handle absolute -top-3 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tag :value="getComponentLabel(comp.type)" severity="info" />
        </div>
        <div class="p-2">
          <Renderer :dsl="[comp]" />
        </div>
        <Button
          icon="pi pi-times"
          severity="danger"
          text
          rounded
          size="small"
          class="absolute -top-3 right-2 z-10 opacity-0 group-hover:opacity-100"
          @click.stop="siteStore.removeComponent(comp.id)"
        />
      </div>
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentType } from '@/shared/types/component'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Renderer from '@/renderer/core/Renderer.vue'

const siteStore = useSiteStore()

const renderKey = ref(0)
watch(
  () => siteStore.selectedComponent?.props,
  () => { renderKey.value++ },
  { deep: true },
)

const rootComponents = computed({
  get() {
    renderKey.value
    if (siteStore.currentSite) return siteStore.currentSite.components
    return []
  },
  set(val) {
    if (siteStore.currentSite) siteStore.currentSite.components = val
  },
})

function getComponentLabel(type: ComponentType): string {
  return getComponentMeta(type)?.label ?? type
}

function onDragOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes('component-type')) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('component-type') as ComponentType | undefined
  if (type) {
    siteStore.addComponent(type)
  }
}
</script>
