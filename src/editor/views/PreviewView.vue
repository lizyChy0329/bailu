<template>
  <div class="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-800">
    <div class="w-full max-w-md p-4" v-if="siteStore.currentSite">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold">{{ siteStore.currentSite.title }}</h2>
        <Button label="返回编辑" severity="secondary" size="small" text @click="$router.back()" />
      </div>
      <Renderer :dsl="[siteStore.currentSite.page]" />
    </div>
    <div v-else class="text-gray-400 mt-20">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSiteStore } from '@/stores/site.store'
import Button from 'primevue/button'
import Renderer from '@/renderer/core/Renderer.vue'

const route = useRoute()
const siteStore = useSiteStore()

onMounted(async () => {
  const id = route.params.id as string
  await siteStore.loadSite(id)
})
</script>
