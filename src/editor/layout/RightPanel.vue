<template>
  <div class="p-3">
    <div v-if="!siteStore.selectedComponent" class="text-sm text-gray-400 text-center py-20">点击画布中的组件<br />查看属性</div>
    <div v-else>
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{{ getComponentLabel() }}</h3>
      <SelectButton v-model="activeTab" :options="tabs" option-value="key" option-label="label" class="mb-3" size="small" fluid />
      <PropsPanel v-if="activeTab === 'props'" />
      <SlotsPanel v-if="activeTab === 'slots'" />
      <StylesPanel v-if="activeTab === 'styles'" />
      <EventsPanel v-if="activeTab === 'events'" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import SelectButton from 'primevue/selectbutton'
import PropsPanel from '@/editor/panels/PropsPanel.vue'
import SlotsPanel from '@/editor/panels/SlotsPanel.vue'
import StylesPanel from '@/editor/panels/StylesPanel.vue'
import EventsPanel from '@/editor/panels/EventsPanel.vue'
const siteStore = useSiteStore()
const activeTab = ref('props')
const tabs = [
  { key: 'props', label: '属性' },
  { key: 'slots', label: '插槽' },
  { key: 'styles', label: '样式' },
  { key: 'events', label: '事件' },
]
function getComponentLabel(): string {
  if (!siteStore.selectedComponent) return ''
  return getComponentMeta(siteStore.selectedComponent.type)?.label ?? siteStore.selectedComponent.type
}
</script>
