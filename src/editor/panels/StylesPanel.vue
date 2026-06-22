<template>
  <div class="space-y-3">
    <label class="text-xs text-gray-500 block">Tailwind 类名</label>
    <Textarea v-model="classText" auto-resize rows="3" placeholder="例: shadow-lg rounded-xl p-4" />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import Textarea from 'primevue/textarea'
const siteStore = useSiteStore()
const comp = computed(() => siteStore.selectedComponent)
const classText = computed({
  get: () => comp.value?.styles?.class ?? '',
  set: (val) => { if (comp.value) comp.value.styles.class = val },
})
</script>
