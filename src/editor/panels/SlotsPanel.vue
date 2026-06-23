<template>
  <div class="space-y-1">
    <div
      v-for="slot in slotList"
      :key="slot.name"
      class="flex items-center justify-between px-2 py-2.5 rounded-md"
      :class="hasChildren(slot.name) ? 'bg-surface-50 dark:bg-surface-800/50' : 'opacity-50'"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-folder-open text-xs text-gray-400" />
        <span class="text-sm">{{ slot.label }}</span>
      </div>
      <ToggleSwitch
        :model-value="slotVisibility[slot.name] ?? true"
        @update:model-value="setVis(slot.name, $event)"
        size="small"
      />
    </div>
    <div v-if="slotList.length === 0" class="text-xs text-gray-400 text-center py-8">此组件无可用插槽</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import ToggleSwitch from 'primevue/toggleswitch'

const siteStore = useSiteStore()

const comp = computed(() => siteStore.selectedComponent)
const meta = computed(() => comp.value ? getComponentMeta(comp.value.type) ?? null : null)

const slotList = computed(() => meta.value?.slots ?? [])

const slotVisibility = computed(() => comp.value?.slotVisibility ?? {})

function hasChildren(slotName: string): boolean {
  return (comp.value?.slots?.[slotName]?.length ?? 0) > 0
}

function setVis(name: string, v: boolean) {
  if (!comp.value) return
  if (!comp.value.slotVisibility) comp.value.slotVisibility = {}
  comp.value.slotVisibility[name] = v
}
</script>
