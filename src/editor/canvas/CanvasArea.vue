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
      class="absolute group rounded-lg"
      :style="getComponentStyle(comp)"
      @click.stop="onComponentClick(comp.id)"
    >
      <div class="w-full h-full overflow-auto bg-white dark:bg-gray-900 rounded-[4px]">
        <Renderer :dsl="[comp]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentType } from '@/shared/types/component'
import Moveable from 'moveable'
import Renderer from '@/renderer/core/Renderer.vue'

const siteStore = useSiteStore()
const canvasRef = ref<HTMLElement | null>(null)
const componentRefs = new Map<string, HTMLElement>()
let moveable: Moveable | null = null

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
  destroyMoveable()
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

  const x = Math.max(0, Math.round((event.clientX - rect.left) / 15) * 15)
  const y = Math.max(0, Math.round((event.clientY - rect.top) / 15) * 15)

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

  comp.x = px(target.style.left)
  comp.y = px(target.style.top)
  comp.width = px(target.style.width)
  comp.height = px(target.style.height)
}

function px(v: string): number {
  const n = parseInt(v.replace('px', ''))
  return isNaN(n) ? 0 : n
}

function onComponentClick(id: string) {
  destroyMoveable()
  siteStore.selectComponent(id)

  const el = componentRefs.get(id)
  if (!el || !canvasRef.value) return

  const guidelines: HTMLElement[] = []
  for (const [cid, el2] of componentRefs) {
    if (cid !== id) guidelines.push(el2)
  }

  moveable = new Moveable(canvasRef.value, {
    target: el,
    container: canvasRef.value,
    draggable: true,
    resizable: true,
    snappable: true,
    snapGridWidth: 15,
    snapGridHeight: 15,
    elementGuidelines: guidelines,
    bounds: { element: canvasRef.value },
    throttleDrag: 15,
    throttleResize: 15,
    origin: false,
    edge: false,
    renderDirections: ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'],
  })

  moveable
    .on('drag', (e: any) => {
      const dx = Math.round(e.left / 15) * 15
      const dy = Math.round(e.top / 15) * 15
      e.target.style.left = dx + 'px'
      e.target.style.top = dy + 'px'
      e.target.style.transform = 'none'
    })
    .on('dragEnd', (e: any) => {
      syncFromDom(e.target)
    })

  moveable
    .on('resize', (e: any) => {
      const rw = Math.round(e.width / 15) * 15
      const rh = Math.round(e.height / 15) * 15
      e.target.style.width = rw + 'px'
      e.target.style.height = rh + 'px'
      const rx = Math.round(e.left / 15) * 15
      const ry = Math.round(e.top / 15) * 15
      if (rx !== (e as any).drag?.left || ry !== (e as any).drag?.top) {
        e.target.style.left = rx + 'px'
        e.target.style.top = ry + 'px'
      }
      e.target.style.transform = 'none'
    })
    .on('resizeEnd', (e: any) => {
      syncFromDom(e.target)
    })
}

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
