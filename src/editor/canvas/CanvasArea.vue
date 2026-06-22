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
      @click.stop="siteStore.selectComponent(comp.id)"
      @mousedown="onComponentMousedown(comp.id, $event)"
    >
      <div class="w-full h-full overflow-auto bg-white dark:bg-gray-900 rounded-[4px]">
        <Renderer :dsl="[comp]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* ===================================================================
 * CanvasArea — 自由定位画布
 *
 * 职责：在固定高度(1100px)的 Canvas 上，以绝对定位渲染根级组件，
 *       通过 moveable 提供拖拽和 8 方向缩放，均吸附到 15px 网格。
 *       插槽内的子组件不受影响（保持流式堆叠 + vue-draggable-plus）。
 * =================================================================== */

import { ref, computed, onBeforeUnmount } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentType } from '@/shared/types/component'
import Moveable from 'moveable'
import Renderer from '@/renderer/core/Renderer.vue'

// ─────────────────────────────────────────────────────
// 步骤 1：状态定义
// ─────────────────────────────────────────────────────

const siteStore = useSiteStore()
const canvasRef = ref<HTMLElement | null>(null)           // Canvas 容器 DOM 引用
const componentRefs = new Map<string, HTMLElement>()      // 组件 id → DOM 元素映射
let moveable: Moveable | null = null                      // 当前激活的 moveable 实例

/** Canvas 内所有根级组件（带响应式） */
const rootComponents = computed(() => {
  if (siteStore.currentSite) return siteStore.currentSite.components
  return []
})

// ─────────────────────────────────────────────────────
// 步骤 2：组件渲染辅助
// ─────────────────────────────────────────────────────

/** 根据组件数据计算绝对定位的 style 对象 */
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

/** 模板 ref 回调：维护 componentRefs 映射 */
function setComponentRef(id: string, el: HTMLElement | null) {
  if (el) {
    componentRefs.set(id, el)
  } else {
    componentRefs.delete(id)
  }
}

/** 将 "200px" 形式的字符串转为数字 */
function px(v: string): number {
  const n = parseInt(v.replace('px', ''))
  return isNaN(n) ? 0 : n
}

// ─────────────────────────────────────────────────────
// 步骤 3：选中/取消选中
// ─────────────────────────────────────────────────────

/** 点击 Canvas 空白处 → 取消选中 + 销毁 moveable */
function deselectComponent() {
  siteStore.selectComponent(null)
  destroyMoveable()
}

// ─────────────────────────────────────────────────────
// 步骤 4：从左侧面板拖入新组件
// ─────────────────────────────────────────────────────

function onDragOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes('component-type')) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

/** 拖放新组件到 Canvas：计算落点坐标（吸附到 15px 网格）+ 使用 meta 中定义的默认尺寸 */
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

// ─────────────────────────────────────────────────────
// 步骤 5：Moveable 实例管理
// ─────────────────────────────────────────────────────

/** 销毁当前 moveable 实例 */
function destroyMoveable() {
  if (moveable) {
    moveable.destroy()
    moveable = null
  }
}

/**
 * 将 moveable 操作结束后的最终视觉位置写回 Pinia store。
 * 使用 getBoundingClientRect 而非 style.left，因为 resize 期间位移由
 * transform 驱动，style.left 并不准确。
 */
function syncFromDom(target: HTMLElement) {
  const id = target.dataset.componentId
  if (!id) return
  const comp = rootComponents.value.find((c) => c.id === id)
  if (!comp || !canvasRef.value) return

  const canvasRect = canvasRef.value.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  comp.x = Math.round((targetRect.left - canvasRect.left) / 15) * 15
  comp.y = Math.round((targetRect.top - canvasRect.top) / 15) * 15
  comp.width = px(target.style.width)
  comp.height = px(target.style.height)
}

// ─────────────────────────────────────────────────────
// 步骤 6：鼠标按下 → 创建 moveable + 立即开始拖拽
// ─────────────────────────────────────────────────────

/**
 * @mousedown 处理函数（同步触发，早于 @click）
 *
 * 1. 跳过交互性子元素（INPUT/BUTTON 等）
 * 2. 销毁旧 moveable + 选中本组件
 * 3. 构建对齐辅助线（其他组件作为 elementGuidelines）
 * 4. 创建 moveable（可拖拽 + 8 方向缩放 + 15px 网格吸附 + 边界约束）
 * 5. 注册 drag / dragEnd / resize / resizeEnd 事件
 * 6. 调用 dragStart() 让同一 mousedown 即触发拖拽
 */
function onComponentMousedown(id: string, event: MouseEvent) {
  // ── 子元素跳过 ──
  const target = event.target as HTMLElement
  if (target !== event.currentTarget) {
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA' ||
        tag === 'SELECT' || tag === 'A' || tag === 'LABEL' ||
        tag === 'IMG' || target.isContentEditable) {
      return
    }
  }

  // ── 清理旧状态 + 选中当前组件 ──
  destroyMoveable()
  siteStore.selectComponent(id)

  const el = componentRefs.get(id)
  if (!el || !canvasRef.value) return

  // ── 构建对齐辅助线 ──
  const guidelines: HTMLElement[] = []
  for (const [cid, el2] of componentRefs) {
    if (cid !== id) guidelines.push(el2)
  }

  // ── 创建 moveable ──
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

  // ── 注册拖拽事件 ──
  moveable
    .on('drag', (e: any) => {
      // 拖拽中用 left/top 直接定位，清除 transform（防止 moveable 双重变换）
      const dx = Math.round(e.left / 15) * 15
      const dy = Math.round(e.top / 15) * 15
      e.target.style.left = dx + 'px'
      e.target.style.top = dy + 'px'
      e.target.style.transform = 'none'
    })
    .on('dragEnd', (e: any) => {
      syncFromDom(e.target)
    })

  // ── 注册缩放事件 ──
  moveable
    .on('resize', (e: any) => {
      // 宽高吸附到 15px 网格
      const snapW = Math.round(e.width / 15) * 15
      const snapH = Math.round(e.height / 15) * 15
      e.target.style.width = Math.max(30, snapW) + 'px'
      e.target.style.height = Math.max(30, snapH) + 'px'

      /**
       * 关键：使用 moveable 自身计算的位移来保持对边固定。
       *
       * 拖拽左滑块时 moveable 会算出 translate(-W, 0)，
       * 应用后宽度增加 W 的同时左移 W，右边缘保持不动。
       * 拖拽上滑块同理，translate(0, -H) 保持下边缘。
       * 对角线拖拽则 translate(-W, -H) 保持对角。
       *
       * 之前写的 transform: 'none' 清掉了这个位移，导致右边缘偏移。
       */
      if (e.drag?.beforeTranslate) {
        const dx = Math.round(e.drag.beforeTranslate[0] / 15) * 15
        const dy = Math.round(e.drag.beforeTranslate[1] / 15) * 15
        e.target.style.transform = `translate(${dx}px, ${dy}px)`
      }
    })
    .on('resizeEnd', (e: any) => {
      // 读取最终视觉位置（getBoundingClientRect 包含 transform 效果）写入 store
      syncFromDom(e.target)
      // 清掉临时 transform，Vue 下次渲染会用新的 left/top 接管定位
      e.target.style.transform = 'none'
    })

  // ── 立即启动拖拽（同一 mousedown 即响应，无需第二次点击）──
  if (typeof (moveable as any).dragStart === 'function') {
    ;(moveable as any).dragStart(event)
  }
}

// ─────────────────────────────────────────────────────
// 步骤 7：组件卸载时清理
// ─────────────────────────────────────────────────────

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
