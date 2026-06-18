<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Bailu</h1>
      <div class="flex items-center gap-3">
        <Button
          :icon="appStore.themeMode === 'light' ? 'pi pi-moon' : 'pi pi-sun'"
          severity="secondary"
          size="small"
          text
          rounded
          @click="toggleTheme"
        />
        <Button label="新建" icon="pi pi-plus" size="small" @click="handleCreate" />
      </div>
    </div>

    <div v-if="siteStore.sites.length === 0" class="text-center py-20 text-gray-400">
      还没有站点，点击"新建"开始搭建
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="site in siteStore.sites"
        :key="site.id"
        class="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow cursor-pointer"
        @click="editSite(site.id)"
      >
        <div>
          <div class="font-medium">{{ site.title }}</div>
          <div class="text-sm text-gray-400 mt-1">
            {{ new Date(site.updatedAt).toLocaleString() }}
          </div>
        </div>
        <Button label="删除" severity="danger" size="small" text @click.stop="handleDelete(site)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useSiteStore } from '@/stores/site.store'
import { useAppStore } from '@/stores/app.store'
import Button from 'primevue/button'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const siteStore = useSiteStore()
const appStore = useAppStore()

onMounted(() => {
  siteStore.loadSites()
})

function toggleTheme() {
  appStore.toggleTheme()
}

async function handleCreate() {
  const id = await siteStore.createSite()
  router.push(`/edit/${id}`)
}

function editSite(id: string) {
  router.push(`/edit/${id}`)
}

function handleDelete(site: { id: string; title: string }) {
  confirm.require({
    message: `确定删除「${site.title}」？此操作不可撤销。`,
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '删除',
    accept: async () => {
      await siteStore.deleteSiteById(site.id)
      toast.add({ severity: 'success', summary: '已删除', life: 2000 })
    },
  })
}
</script>
