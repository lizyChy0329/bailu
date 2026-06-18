<template>
  <div>
    <label class="text-xs text-gray-500 block mb-2">Tailwind 类名</label>
    <Textarea
      v-model="localClass"
      rows="4"
      class="w-full text-xs font-mono"
      placeholder="例: shadow-lg rounded-xl p-4"
      @input="syncStyles"
    />
    <div class="mt-2">
      <label class="text-xs text-gray-500 block mb-1">行内样式（CSS JSON）</label>
      <Textarea
        v-model="localStyleText"
        rows="3"
        class="w-full text-xs font-mono"
        placeholder='例: { "marginTop": "20px" }'
        @input="syncStyles"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import Textarea from 'primevue/textarea'

const siteStore = useSiteStore()

const localClass = ref('')
const localStyleText = ref('')

watch(
  () => siteStore.selectedComponent,
  (comp) => {
    localClass.value = comp?.styles?.class ?? ''
    localStyleText.value = comp?.styles?.style ? JSON.stringify(comp.styles.style, null, 2) : ''
  },
  { immediate: true },
)

function syncStyles() {
  if (!siteStore.selectedComponent) return
  siteStore.selectedComponent.styles.class = localClass.value
  try {
    const parsed = JSON.parse(localStyleText.value || '{}')
    siteStore.selectedComponent.styles.style = parsed
  } catch {
    // JSON 解析错误，用户正在输入
  }
}
</script>
