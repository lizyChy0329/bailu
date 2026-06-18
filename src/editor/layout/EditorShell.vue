<template>
  <div class="h-screen flex flex-col bg-white dark:bg-gray-900">
    <header class="flex items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div class="flex items-center gap-3 flex-1">
        <Button label="返回" severity="secondary" size="small" text @click="goBack" />
        <InputText v-model="siteTitle" class="w-40 text-xs" @change="handleTitleChange" />
      </div>

      <div class="flex items-center justify-center flex-1">
        <SelectButton
          v-model="appStore.deviceMode"
          :options="devices"
          option-value="mode"
          option-label="label"
          size="small"
        />
      </div>

      <div class="flex items-center gap-2 justify-end flex-1">
        <Button
          :icon="appStore.themeMode === 'light' ? 'pi pi-moon' : 'pi pi-sun'"
          severity="secondary"
          size="small"
          text
          rounded
          @click="appStore.toggleTheme"
        />
        <Button label="保存" severity="success" size="small" @click="handleSave" />
        <Button label="发布" size="small" @click="handlePublish" />
      </div>
    </header>

    <div ref="shellBody" class="flex-1 flex overflow-hidden" :class="{ 'select-none': resizing }">
      <aside
        class="overflow-y-auto bg-gray-50 dark:bg-gray-800/50 shrink-0"
        :style="{ width: leftPanelWidth, minWidth: '10rem', maxWidth: '24rem' }"
      >
        <LeftPanel />
      </aside>

      <div
        class="w-1 cursor-col-resize shrink-0 bg-transparent hover:bg-blue-500 active:bg-blue-500 transition-colors"
        @mousedown.prevent="startResize('left', $event)"
      />

      <main class="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800/30 flex justify-center py-6">
        <div
          :style="{ width: appStore.deviceWidths[appStore.deviceMode] + 'px', minWidth: appStore.deviceWidths[appStore.deviceMode] + 'px' }"
          class="transition-all duration-300"
        >
          <CanvasArea />
        </div>
      </main>

      <div
        class="w-1 cursor-col-resize shrink-0 bg-transparent hover:bg-blue-500 active:bg-blue-500 transition-colors"
        @mousedown.prevent="startResize('right', $event)"
      />

      <aside
        class="overflow-y-auto bg-gray-50 dark:bg-gray-800/50 shrink-0"
        :style="{ width: rightPanelWidth, minWidth: '14rem', maxWidth: '30rem' }"
      >
        <RightPanel />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAppStore } from '@/stores/app.store'
import { useSiteStore } from '@/stores/site.store'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import LeftPanel from './LeftPanel.vue'
import RightPanel from './RightPanel.vue'
import CanvasArea from '@/editor/canvas/CanvasArea.vue'

const router = useRouter()
const toast = useToast()
const appStore = useAppStore()
const siteStore = useSiteStore()

const devices = [
  { mode: 'mobile' as const, label: '📱' },
  { mode: 'tablet' as const, label: '📟' },
  { mode: 'desktop' as const, label: '🖥' },
]

const siteTitle = ref(siteStore.currentSite?.title ?? '未命名站点')
const shellBody = ref<HTMLElement | null>(null)

const LEFT_MIN = 160
const LEFT_MAX = 384
const RIGHT_MIN = 224
const RIGHT_MAX = 480

const leftPanelWidth = ref('250px')
const rightPanelWidth = ref('300px')
const resizing = ref<'left' | 'right' | null>(null)

function startResize(side: 'left' | 'right', e: MouseEvent) {
  resizing.value = side
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!resizing.value || !shellBody.value) return
  const rect = shellBody.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  if (resizing.value === 'left') {
    const w = Math.max(LEFT_MIN, Math.min(LEFT_MAX, x))
    leftPanelWidth.value = w + 'px'
  } else {
    const w = Math.max(RIGHT_MIN, Math.min(RIGHT_MAX, rect.width - x))
    rightPanelWidth.value = w + 'px'
  }
}

function onMouseUp() {
  resizing.value = null
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})

function goBack() {
  router.push('/')
}

function handleTitleChange() {
  if (siteStore.currentSite) {
    siteStore.currentSite.title = siteTitle.value || '未命名站点'
  }
}

async function handleSave() {
  handleTitleChange()
  await siteStore.persistCurrentSite()
  toast.add({ severity: 'success', summary: '保存成功', life: 2000 })
}

async function handlePublish() {
  await siteStore.persistCurrentSite()
  if (!siteStore.currentSite) return

  const json = JSON.stringify(siteStore.currentSite, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${siteStore.currentSite.title || 'site'}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ severity: 'success', summary: '已导出 JSON', life: 3000 })
}
</script>
