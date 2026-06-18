<template>
  <div class="space-y-3">
    <div class="text-xs text-gray-400 mb-2">
      PrimeVue Pass Through 配置（JSON 格式）
    </div>
    <Textarea
      v-model="localPT"
      rows="10"
      class="w-full text-xs font-mono"
      placeholder='{ "root": { "class": "..." }, "header": { "class": "..." } }'
      @input="syncPT"
    />
    <div v-if="ptNodes.length > 0" class="text-xs text-gray-400">
      可覆写节点: {{ ptNodes.map(n => n.label).join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import Textarea from 'primevue/textarea'

const siteStore = useSiteStore()

const localPT = ref('')

const ptNodes = computed(() => {
  if (!siteStore.selectedComponent) return []
  return getComponentMeta(siteStore.selectedComponent.type)?.ptNodes ?? []
})

watch(
  () => siteStore.selectedComponent,
  (comp) => {
    localPT.value = comp?.pt ? JSON.stringify(comp.pt, null, 2) : ''
  },
  { immediate: true },
)

function syncPT() {
  if (!siteStore.selectedComponent) return
  try {
    const parsed = JSON.parse(localPT.value || '{}')
    siteStore.selectedComponent.pt = parsed
  } catch {
    // 用户正在输入
  }
}
</script>
