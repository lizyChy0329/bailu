<template>
  <EditorShell />
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSiteStore } from '@/stores/site.store'
import EditorShell from '@/editor/layout/EditorShell.vue'
const route = useRoute()
const siteStore = useSiteStore()
onMounted(async () => {
  const id = route.params.id as string
  await siteStore.loadCurrentSite(id)
})
</script>
