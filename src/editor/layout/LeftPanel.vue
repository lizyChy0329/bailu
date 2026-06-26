<template>
  <Splitter class="h-full !border-none">
    <SplitterPanel :size="40" :minSize="30">
      <div class="h-full overflow-y-auto p-3">
        <div v-for="(group, gi) in groups" :key="gi" class="mb-4 last:mb-0">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ group.name }}</h3>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="meta in group.items" :key="meta.type"
              :ref="(el) => setupDraggable(el as HTMLElement | null, meta.type)"
              class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 cursor-grab select-none hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <i :class="meta.icon" class="text-lg" />
              <span class="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ meta.label }}</span>
            </div>
            <div v-for="pl in group.placeholders" :key="pl.type"
              @click="toastNotReady"
              class="flex flex-col items-center gap-1 p-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer select-none bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors">
              <i :class="pl.icon" class="text-lg text-gray-400 dark:text-gray-500" />
              <span class="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{{ pl.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </SplitterPanel>
    <SplitterPanel :size="60" :minSize="40">
      <div class="h-full overflow-y-auto">
        <ComponentTree />
      </div>
    </SplitterPanel>
  </Splitter>
</template>
<script setup lang="ts">
import type { ComponentMeta, ComponentType } from '@/shared/types/component'
import { getComponentMeta, placeholderComponents } from '@/editor/registry'
import type { PlaceholderEntry } from '@/editor/registry'
import { useDragDrop } from '@/composables/useDragDrop'
import ComponentTree from '@/editor/tree/ComponentTree.vue'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { useToast } from 'primevue/usetoast'

const { registerDraggable, trackCleanup, replaceCleanup } = useDragDrop()
const toast = useToast()

function toastNotReady() {
  toast.add({ severity: 'warn', summary: '暂未制作', life: 2000 })
}

type ComponentGroup = { name: string; items: ComponentMeta[]; placeholders: PlaceholderEntry[] }
const groupDefs: { name: string; types: ComponentType[]; placeholders: string[] }[] = [
  { name: '布局类', types: ['Card', 'Panel', 'ScrollPanel', 'BackgroundContainer'], placeholders: [] },
  { name: '内容类', types: ['Image'], placeholders: [] },
  { name: '文案类', types: ['Heading', 'Paragraph', 'Text'], placeholders: ['RichText', 'Link', 'List', 'Divider'] },
  { name: '交互类', types: ['Button'], placeholders: [] },
]
const groups: ComponentGroup[] = groupDefs
  .map((g) => ({
    name: g.name,
    items: g.types.map((t) => getComponentMeta(t)).filter(Boolean) as ComponentMeta[],
    placeholders: g.placeholders.map((t) => placeholderComponents.find((p) => p.type === t)).filter(Boolean) as PlaceholderEntry[],
  }))
  .filter((g) => g.items.length > 0 || g.placeholders.length > 0)

function setupDraggable(el: HTMLElement | null, type: ComponentType) {
  const key = `palette:${type}`
  if (!el) { trackCleanup(key, () => {}); return }
  replaceCleanup(key, () => registerDraggable(el, { source: 'palette', componentType: type }))
}
</script>
