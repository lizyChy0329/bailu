<template>
  <div
    ref="canvasRef"
    class="min-h-[600px] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 relative"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
    @dragleave="onDragLeave"
  >
    <div v-if="rootComponents.length === 0" class="text-center py-20 text-gray-400 text-sm">
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
        :ref="(el: any) => setComponentRef(comp.id, el as HTMLElement)"
        :data-component-id="comp.id"
        class="relative group border-2 rounded-lg transition-colors"
        :class="siteStore.selectedComponentId === comp.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
        @click.stop="siteStore.selectComponent(comp.id)"
      >
        <Tag
          :value="getComponentLabel(comp.type)"
          severity="info"
          class="drag-handle absolute -top-3 left-2 z-10 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <div class="p-2">
          <Renderer :dsl="[comp]" />
        </div>
        <Button
          icon="pi pi-times"
          severity="danger"
          text
          rounded
          size="small"
          class="absolute -top-3 -right-3 z-10 opacity-0 group-hover:opacity-100"
          @click.stop="siteStore.removeComponent(comp.id)"
        />
      </div>
    </VueDraggable>

    <!-- 拖入插入指示线 -->
    <div
      v-if="dropZone"
      class="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
      :style="{ top: dropZone.y + 'px' }"
    >
      <div class="h-0.5 bg-blue-500 flex-1" />
      <div class="w-2 h-2 bg-blue-500 rounded-full -ml-1" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentNode, ComponentType } from '@/shared/types/component'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Renderer from '@/renderer/core/Renderer.vue'

// ── 状态 ──

const siteStore = useSiteStore()
const canvasRef = ref<HTMLElement | null>(null)
const componentEls = new Map<string, HTMLElement>()

/**
 * 当前落点缓存，由 onDragOver 中的 locate() 算法持续更新。
 * y 是插入线相对于 canvas 容器的 Y 偏移（px），指示线在此位置渲染。
 */
const dropZone = ref<{
  parentId: string
  slotName: string
  index: number
  y: number
} | null>(null)

const rootComponents = computed(() => {
  if (siteStore.currentSite) return siteStore.currentSite.components
  return []
})

// ── 组件渲染辅助 ──

function setComponentRef(id: string, el: HTMLElement | null) {
  if (el) componentEls.set(id, el)
  else componentEls.delete(id)
}

function getComponentLabel(type: ComponentType): string {
  return getComponentMeta(type)?.label ?? type
}

// ── 拖入定位算法 ──

interface DropZone {
  parentId: string
  slotName: string
  index: number
  y: number   // 相对 canvas 容器的 Y 像素偏移
}

/**
 * locate() — 参考 lowcode-engine Sensor.locate() 简化实现。
 *
 * 1. 遍历当前层级所有子组件的 DOM 矩形
 * 2. 计算鼠标到每个组件中心线的垂直距离
 * 3. 找到最近邻组件，确定插入 before/after
 * 4. 返回落点位置
 */
function locate(
  mouseY: number,              // 相对于 canvas 容器的鼠标 Y
  children: ComponentNode[],
): DropZone | null {
  if (children.length === 0) {
    return { parentId: 'root', slotName: 'default', index: 0, y: 0 }
  }

  let nearIdx = 0
  let nearDist = Infinity
  let nearRect: DOMRect | null = null

  for (let i = 0; i < children.length; i++) {
    const el = componentEls.get(children[i].id)
    if (!el) continue

    const r = el.getBoundingClientRect()
    const canvasRect = canvasRef.value!.getBoundingClientRect()
    const relTop = r.top - canvasRect.top
    const relBot = r.bottom - canvasRect.top
    const centerY = (relTop + relBot) / 2
    const dist = Math.abs(mouseY - centerY)

    if (dist < nearDist) {
      nearDist = dist
      nearIdx = i
      nearRect = r
    }
  }

  if (!nearRect || !canvasRef.value) return null

  const canvasRect = canvasRef.value.getBoundingClientRect()
  const relTop = nearRect.top - canvasRect.top

  // 鼠标在组件上半部分 → 插入到之前；下半部分 → 之后
  const after = mouseY > relTop + nearRect.height / 2
  const index = after ? nearIdx + 1 : nearIdx
  const y = after
    ? nearRect.bottom - canvasRect.top    // 组件底部
    : nearRect.top - canvasRect.top        // 组件顶部

  return { parentId: 'root', slotName: 'default', index, y }
}

// ── 拖拽事件 ──

function onDragOver(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('component-type') || !canvasRef.value) return
  event.dataTransfer.dropEffect = 'copy'

  const canvasRect = canvasRef.value.getBoundingClientRect()
  const mouseY = event.clientY - canvasRect.top

  dropZone.value = locate(mouseY, rootComponents.value)
}

function onDragLeave(event: DragEvent) {
  // 只当真正离开 canvas 时才清除（避免经过子元素误清）
  if (canvasRef.value && !canvasRef.value.contains(event.relatedTarget as Node)) {
    dropZone.value = null
  }
}

function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('component-type') as ComponentType | undefined
  if (!type || !dropZone.value) {
    dropZone.value = null
    return
  }

  const { parentId, slotName, index } = dropZone.value
  siteStore.addComponent(type, index)
  dropZone.value = null
}
</script>
