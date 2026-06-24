<template>
  <div ref="canvasRef"
    class="min-h-[600px] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative select-none"
    :class="isDragging ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900'">
    <div v-if="rootComponents.length===0 && !isDragging" class="text-center py-20 text-gray-400 text-sm pointer-events-none">从左侧拖拽组件到此处</div>
    <div class="space-y-3">
      <div v-for="comp in rootComponents" :key="comp.id"
        :ref="(el:any)=>setComponentRef(comp.id,el as HTMLElement|null)" :data-component-id="comp.id"
        class="relative group border-2 rounded-lg cursor-pointer select-none"
        :class="siteStore.selectedComponentId===comp.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
        @click.stop="siteStore.selectComponent(comp.id)"
        @contextmenu.prevent.stop="onContextMenu(comp.id,$event)">
        <i class="drag-handle absolute -top-3 -right-3 z-20 text-blue-500 cursor-grab active:cursor-grabbing pi pi-arrows-alt opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-900 rounded-full p-0.5 shadow-sm border" />
        <Tag :value="getComponentLabel(comp.type)" severity="info"
          class="absolute -top-3 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div class="pointer-events-none"><Renderer :dsl="[comp]" /></div>
        <div v-if="comp.slots && comp.type !== 'Card'" class="px-2 pb-2 space-y-2">
          <div v-for="(children,sn) in comp.slots" :key="sn">
            <div v-if="children.length===0 && comp.slotVisibility?.[sn]"
              class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-4 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
              <i class="pi pi-folder-open mr-1"/>{{sn}} 插槽 — 从左侧拖入组件</div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="dropIndicator"
      class="absolute left-0 right-0 z-20 pointer-events-none flex items-center drop-indicator"
      :style="{top:dropIndicator.y+'px'}"><div class="h-0.5 bg-blue-500 flex-1"/><div class="w-2 h-2 bg-blue-500 rounded-full -ml-1"/></div>
  </div>
  <ContextMenu ref="contextMenuRef" :model="contextMenuItems"/>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import { useDragDrop } from '@/composables/useDragDrop'
import type { ComponentType } from '@/shared/types/component'
import Tag from 'primevue/tag'
import ContextMenu from 'primevue/contextmenu'
import Renderer from '@/renderer/core/Renderer.vue'

const siteStore = useSiteStore()
const canvasRef = ref<HTMLElement | null>(null)
const { dropIndicator, isDragging, registerDropTarget, registerDraggable, trackCleanup, replaceCleanup } = useDragDrop()
const renderKey = ref(0)

watch(() => siteStore.selectedComponent?.props, () => { renderKey.value++ }, { deep: true })
const rootComponents = computed(() => { renderKey.value; return siteStore.currentSite?.components ?? [] })

/* 右键菜单 */
const contextMenuRef = ref<any>(null)
const contextTarget = ref<string | null>(null)
const contextMenuItems = ref([
  { label: '删除', icon: 'pi pi-trash', command: () => { if (contextTarget.value) { siteStore.removeComponent(contextTarget.value); contextTarget.value = null } } },
  { separator: true },
  { label: '复制', icon: 'pi pi-copy' },
])
function onContextMenu(id: string, event: MouseEvent) {
  siteStore.selectComponent(id); contextTarget.value = id; contextMenuRef.value?.show(event)
}

function getComponentLabel(t: ComponentType): string { return getComponentMeta(t)?.label ?? t }

/* Pragmatic DnD — canvas container & each component */
onMounted(() => {
  const cv = canvasRef.value
  if (cv) {
    replaceCleanup('canvas-container', () => registerDropTarget(cv, { source: 'canvas', type: 'root', parentId: 'root', slotName: 'default' }, cv))
  }
})

const componentElCache = new Map<string, HTMLElement>()

function setComponentRef(id: string, el: HTMLElement | null) {
  const key = `canvas:${id}`
  if (!el) {
    componentElCache.delete(id)
    trackCleanup(`drag:${key}`, () => {})
    trackCleanup(`drop:${key}`, () => {})
    return
  }
  componentElCache.set(id, el)

  const data = { source: 'canvas' as const, type: 'component' as const, compKey: id, parentId: 'root', slotName: 'default' }
  replaceCleanup(`drag:${key}`, () => registerDraggable(el, data))
  replaceCleanup(`drop:${key}`, () => registerDropTarget(el, data, canvasRef.value))
}

/* 监听 slot 数据变化强制刷新 */
watch(() => rootComponents.value?.length, () => { renderKey.value++ })
</script>
<style scoped>.drop-indicator{transition:top .05s ease}</style>
