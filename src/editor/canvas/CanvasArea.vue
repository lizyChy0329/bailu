<template>
  <div ref="canvasRef"
    class="min-h-[600px] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 relative"
    :class="dropZone ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900'"
    @dragover.prevent="onDragOver" @drop.prevent="onDrop" @dragleave="onDragLeave">
    <div v-if="rootComponents.length === 0" class="text-center py-20 text-gray-400 text-sm pointer-events-none">
      从左侧拖拽组件到此处</div>
    <VueDraggable v-if="siteStore.currentSite" v-model="rootComponents"
      :animation="200" handle=".drag-handle" ghost-class="opacity-30" class="space-y-3">
      <div v-for="comp in rootComponents" :key="comp.id"
        :ref="(el: any) => setComponentRef(comp.id, el as HTMLElement)" :data-component-id="comp.id"
        class="relative group border-2 rounded-lg transition-colors"
        :class="siteStore.selectedComponentId === comp.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
        @click.stop="siteStore.selectComponent(comp.id)"
        @contextmenu.prevent.stop="onContextMenu(comp.id, $event)">
        <Tag :value="getComponentLabel(comp.type)" severity="info"
          class="drag-handle absolute -top-3 left-2 z-10 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
        <div class="p-2"><Renderer :dsl="[comp]" /></div>
      </div>
    </VueDraggable>
    <div v-if="dropZone"
      class="absolute left-0 right-0 z-20 pointer-events-none flex items-center drop-indicator"
      :style="{ top: dropZone.y + 'px' }">
      <div class="h-0.5 bg-blue-500 flex-1" />
      <div class="w-2 h-2 bg-blue-500 rounded-full -ml-1" />
    </div>
  </div>
  <ContextMenu ref="contextMenuRef" :model="contextMenuItems" />
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentNode, ComponentType } from '@/shared/types/component'
import Tag from 'primevue/tag'
import ContextMenu from 'primevue/contextmenu'
import Renderer from '@/renderer/core/Renderer.vue'
const siteStore = useSiteStore()
const canvasRef = ref<HTMLElement | null>(null)
const componentEls = new Map<string, HTMLElement>()
const dropZone = ref<{ parentId: string; slotName: string; index: number; y: number } | null>(null)
const renderKey = ref(0)
watch(() => siteStore.selectedComponent?.props, () => { renderKey.value++ }, { deep: true })
const rootComponents = computed({
  get: () => { renderKey.value; return siteStore.currentSite?.components ?? [] },
  set: (val) => { if (siteStore.currentSite) siteStore.currentSite.components = val },
})
function setComponentRef(id: string, el: HTMLElement | null) { if (el) componentEls.set(id, el); else componentEls.delete(id) }
function getComponentLabel(type: ComponentType): string { return getComponentMeta(type)?.label ?? type }
/* ── ContextMenu ── */
const contextMenuRef = ref<any>(null)
const contextTarget = ref<string | null>(null)
const contextMenuItems = ref([
  { label: '删除', icon: 'pi pi-trash', command: () => {
    if (contextTarget.value) { siteStore.removeComponent(contextTarget.value); contextTarget.value = null }
  }},
  { separator: true },
  { label: '复制', icon: 'pi pi-copy' },
])
function onContextMenu(id: string, event: MouseEvent) {
  siteStore.selectComponent(id); contextTarget.value = id; contextMenuRef.value?.show(event)
}
/* ── 拖入定位算法 ── */
interface DropLocation { parentId: string; slotName: string; index: number; y: number }
function locate(mouseY: number, children: ComponentNode[], parentId?: string, slotName?: string): DropLocation | null {
  const pId = parentId ?? 'root'; const sName = slotName ?? 'default'
  if (!canvasRef.value) return null
  if (children.length === 0) return { parentId: pId, slotName: sName, index: 0, y: 0 }
  const canvasRect = canvasRef.value.getBoundingClientRect()
  let nearIdx = 0; let nearDist = Infinity; let nearRect: DOMRect | null = null
  for (let i = 0; i < children.length; i++) {
    const el = componentEls.get(children[i].id); if (!el) continue
    const r = el.getBoundingClientRect()
    const relTop = r.top - canvasRect.top; const relBot = r.bottom - canvasRect.top
    const dist = Math.abs(mouseY - (relTop + relBot) / 2)
    if (dist < nearDist) { nearDist = dist; nearIdx = i; nearRect = r }
  }
  if (!nearRect) return null
  const relTop = nearRect.top - canvasRect.top; const relH = nearRect.height
  const relMid = mouseY - relTop
  const after = relMid > relH / 2
  const nearChild = children[nearIdx]
  const meta = getComponentMeta(nearChild.type)
  // 若鼠标在容器组件的中间 60% 范围 → 进入 default slot
  if (meta?.slots && meta.slots.length > 0 && relMid > relH * 0.2 && relMid < relH * 0.8) {
    return locate(mouseY, nearChild.slots?.default ?? [], nearChild.id, 'default')
  }
  const index = after ? nearIdx + 1 : nearIdx
  const y = after ? nearRect.bottom - canvasRect.top : nearRect.top - canvasRect.top
  return { parentId: pId, slotName: sName, index, y }
}
function onDragOver(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('component-type') || !canvasRef.value) return
  event.dataTransfer.dropEffect = 'copy'
  dropZone.value = locate(event.clientY - canvasRef.value.getBoundingClientRect().top, rootComponents.value)
}
function onDragLeave(event: DragEvent) {
  if (canvasRef.value && !canvasRef.value.contains(event.relatedTarget as Node)) dropZone.value = null
}
function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('component-type') as ComponentType | undefined
  if (!type || !dropZone.value) { dropZone.value = null; return }
  const { parentId, slotName, index } = dropZone.value
  siteStore.addComponent(type, parentId, slotName, index)
  dropZone.value = null
}
</script>
<style scoped>
.drop-indicator { transition: top 0.05s ease; }
</style>
