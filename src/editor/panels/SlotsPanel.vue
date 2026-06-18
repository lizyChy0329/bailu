<template>
  <div class="space-y-3">
    <div
      v-for="slot in slots"
      :key="slot.name"
      class="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-2"
    >
      <div class="text-xs font-medium text-gray-500 mb-1">{{ slot.label }} ({{ slot.name }})</div>

      <div v-if="slot.allowsChildren" class="space-y-1">
        <div
          v-for="child in getSlotChildren(slot.name)"
          :key="child.id"
          class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-between"
        >
          <span>{{ getComponentLabel(child.type) }}</span>
          <Button
            icon="pi pi-times"
            severity="danger"
            text
            rounded
            size="small"
            @click="removeFromSlot(slot.name, child.id)"
          />
        </div>
        <div
          class="text-xs text-gray-400 text-center py-2 border border-dashed border-gray-200 dark:border-gray-700 rounded"
          @dragover.prevent
          @drop.prevent="(e) => dropToSlot(e, slot.name)"
        >
          拖拽组件到此处
        </div>
      </div>

      <div v-else class="text-xs text-gray-400 italic">文本内容插槽（不可拖入子组件）</div>
    </div>
    <div v-if="slots.length === 0" class="text-xs text-gray-400 text-center py-4">此组件无可用插槽</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentType } from '@/shared/types/component'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import { generateId } from '@/shared/utils/id'
import Button from 'primevue/button'

const siteStore = useSiteStore()

const slots = computed(() => {
  if (!siteStore.selectedComponent) return []
  return getComponentMeta(siteStore.selectedComponent.type)?.slots ?? []
})

function getSlotChildren(slotName: string) {
  if (!siteStore.selectedComponent?.slots) return []
  return siteStore.selectedComponent.slots[slotName] ?? []
}

function getComponentLabel(type: ComponentType): string {
  return getComponentMeta(type)?.label ?? type
}

function dropToSlot(event: DragEvent, slotName: string) {
  const type = event.dataTransfer?.getData('component-type') as ComponentType | undefined
  if (!type || !siteStore.selectedComponent) return
  if (!siteStore.selectedComponent.slots) siteStore.selectedComponent.slots = {}
  if (!siteStore.selectedComponent.slots[slotName]) siteStore.selectedComponent.slots[slotName] = []

  const meta = getComponentMeta(type)
  if (!meta) return

  const child = {
    id: generateId(),
    type,
    props: { ...meta.defaultProps },
    styles: { ...meta.defaultStyles },
  }
  siteStore.selectedComponent.slots[slotName].push(child)
}

function removeFromSlot(slotName: string, childId: string) {
  if (!siteStore.selectedComponent?.slots) return
  siteStore.selectedComponent.slots[slotName] = siteStore.selectedComponent.slots[slotName].filter(
    (c) => c.id !== childId,
  )
}
</script>
