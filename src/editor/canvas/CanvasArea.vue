<template>
  <div
    ref="canvasRef"
    class="h-[1100px] min-h-[1100px] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dot-grid relative overflow-hidden"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
    @click="deselectComponent"
  >
    <div v-if="rootComponents.length === 0" class="flex items-center justify-center h-full text-gray-400 text-sm pointer-events-none select-none">
      从左侧拖拽组件到此处
    </div>

    <div
      v-for="comp in rootComponents"
      :key="comp.id"
      :ref="(el: any) => setComponentRef(comp.id, el as HTMLElement)"
      :data-component-id="comp.id"
      class="absolute group rounded-lg border-2 transition-colors"
      :class="selectedId === comp.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
      :style="getComponentStyle(comp)"
      @click.stop="siteStore.selectComponent(comp.id)"
    >
      <div class="w-full h-full overflow-auto bg-white dark:bg-gray-900 rounded-[4px]">
        <Renderer :dsl="[comp]" />
      </div>
      <Button
        icon="pi pi-times"
        severity="danger"
        text
        rounded
        size="small"
        class="absolute -top-3 -right-3 z-20 opacity-0 group-hover:opacity-100"
        @click.stop="siteStore.removeComponent(comp.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentType } from '@/shared/types/component'
import Moveable from 'moveable'
import Button from 'primevue/button'
import Renderer from '@/renderer/core/Renderer.vue'

const siteStore = useSiteStore()
const canvasRef = ref<HTMLElement | null>(null)
const componentRefs = new Map<string, HTMLElement>()
let moveable: Moveable | null = null

const selectedId = computed(() => siteStore.selectedComponentId)

const rootComponents = computed(() => {
  if (siteStore.currentSite) return siteStore.currentSite.components
  return []
})

function getComponentStyle(comp: { type: ComponentType; x?: number; y?: number; width?: number; height?: number }) {
  const meta = getComponentMeta(comp.type)
  return {
    position: 'absolute' as const,
    left: (comp.x ?? 0) + 'px',
    top: (comp.y ?? 0) + 'px',
    width: (comp.width ?? meta?.defaultWidth ?? 300) + 'px',
    height: (comp.height ?? meta?.defaultHeight ?? 200) + 'px',
  }
}

function setComponentRef(id: string, el: HTMLElement | null) {
  if (el) {
    componentRefs.set(id, el)
  } else {
    componentRefs.delete(id)
  }
}

function deselectComponent() {
  siteStore.selectComponent(null)
}

function onDragOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes('component-type')) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('component-type') as ComponentType | undefined
  if (!type || !canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const meta = getComponentMeta(type)
  const w = meta?.defaultWidth ?? 300
  const h = meta?.defaultHeight ?? 200

  const x = Math.max(0, Math.round((event.clientX - rect.left) / 20) * 20)
  const y = Math.max(0, Math.round((event.clientY - rect.top) / 20) * 20)

  siteStore.addComponent(type, { x, y, width: w, height: h })
}

// ── Moveable ────────────────────────────────────────

function destroyMoveable() {
  if (moveable) {
    moveable.destroy()
    moveable = null
  }
}

function syncFromDom(target: HTMLElement) {
  const id = target.dataset.componentId
  if (!id) return
  const comp = rootComponents.value.find((c) => c.id === id)
  if (!comp) return

  const px = (v: string) => {
    const n = parseInt(v.replace('px', ''))
    return isNaN(n) ? 0 : n
  }
  comp.x = px(target.style.left)
  comp.y = px(target.style.top)
  comp.width = px(target.style.width)
  comp.height = px(target.style.height)
}

watch(
  () => siteStore.selectedComponentId,
  (newId) => {
    destroyMoveable()

    if (!newId || !canvasRef.value) return

    const targetEl = componentRefs.get(newId)
    if (!targetEl) return

    // Build element guidelines from other root components
    const guidelines: HTMLElement[] = []
    for (const [id, el] of componentRefs) {
      if (id !== newId) guidelines.push(el)
    }

    moveable = new Moveable(canvasRef.value, {
      target: targetEl,
      container: canvasRef.value,
      draggable: true,
      resizable: true,
      snappable: true,
      snapGridWidth: 20,
      snapGridHeight: 20,
      elementGuidelines: guidelines,
      bounds: { element: canvasRef.value },
      throttleDrag: 20,
      throttleResize: 20,
      origin: false,
      edge: false,
      renderDirections: ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'],
    })

    moveable
      .on('drag', (e: any) => {
        const left = Math.round(e.left / 20) * 20
        const top = Math.round(e.top / 20) * 20
        e.target.style.left = left + 'px'
        e.target.style.top = top + 'px'
        e.target.style.transform = 'none'
      })
      .on('dragEnd', (e: any) => {
        syncFromDom(e.target)
      })

    moveable
      .on('resize', (e: any) => {
        const w = Math.round(e.width / 20) * 20
        const h = Math.round(e.height / 20) * 20
        e.target.style.width = w + 'px'
        e.target.style.height = h + 'px'
        // Resize from NW/NE top edge moves left/top too
        const left = Math.round(e.left / 20) * 20
        const top = Math.round(e.top / 20) * 20
        if (left !== (e as any).drag?.left || top !== (e as any).drag?.top) {
          e.target.style.left = left + 'px'
          e.target.style.top = top + 'px'
        }
        e.target.style.transform = 'none'
      })
      .on('resizeEnd', (e: any) => {
        syncFromDom(e.target)
      })
  },
)

onBeforeUnmount(() => {
  destroyMoveable()
})
</script>

<style scoped>
.dot-grid {
  background-color: #fff;
  background-image: radial-gradient(circle, #e5e5e5 1px, transparent 1px);
  background-size: 10px 10px;
}
:root.dark .dot-grid {
  background-color: #111827;
  background-image: radial-gradient(circle, #374151 1px, transparent 1px);
}
</style>
