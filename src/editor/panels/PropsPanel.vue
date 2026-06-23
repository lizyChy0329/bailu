<template>
  <div class="space-y-3">
    <Accordion :value="openKeys" multiple>
      <AccordionPanel v-for="s in titledSections" :key="s.title" :value="s.title">
        <AccordionHeader class="text-sm">{{ s.title }}</AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-3 pt-2">
            <div v-for="c in s.controls" :key="c.key">
              <label v-if="c.control !== 'switch'" class="text-xs text-gray-500 mb-1 block">{{ c.label }}</label>
              <InputText v-if="c.control === 'text-input'" :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key] = $event" fluid />
              <InputNumber v-else-if="c.control === 'number-input'" :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key] = $event" fluid />
              <Select v-else-if="c.control === 'select'" :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key] = $event" :options="c.options" option-label="label" option-value="value" fluid />
              <div v-else-if="c.control === 'switch'" class="flex items-center justify-between">
                <span class="text-xs text-gray-500">{{ c.label }}</span>
                <ToggleSwitch :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key] = $event" />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="__pt">
        <AccordionHeader class="text-sm">
          <span class="relative">
            PT 覆写
            <span v-if="hasPtModifications" class="absolute -top-1.5 -right-2 size-1.5 rounded-full bg-red-500" />
          </span>
        </AccordionHeader>
        <AccordionContent>
          <Button label="编辑 PT 覆写" icon="pi pi-pencil" variant="outlined" size="small" fluid @click="ptDialogVisible = true" />
          <PtEditor
            v-model:visible="ptDialogVisible"
            :pt="comp?.pt ?? {}"
            :pt-nodes="meta?.ptNodes"
            :component-label="meta?.label ?? ''"
            @save="onPTSave"
          />
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="__advanced">
        <AccordionHeader class="text-sm">
          <span class="relative">
            高级
            <span v-if="hasAdvancedModifications" class="absolute -top-1.5 -right-2 w-2 h-2 rounded-full bg-red-500" />
          </span>
        </AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-3 pt-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">dt</span>
              <i class="pi pi-info-circle text-xs cursor-help text-gray-400" v-tooltip="'传入 design token 对象，自动生成 --p-* CSS 变量'" />
            </div>
            <Button label="配置 DT" icon="pi pi-code" variant="outlined" size="small" fluid @click="dtDialogVisible = true" />

            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">ptOptions</span>
              <i class="pi pi-info-circle text-xs cursor-help text-gray-400" v-tooltip="'PT 合并选项配置'" />
            </div>
            <Button label="配置 ptOptions" icon="pi pi-cog" variant="outlined" size="small" fluid @click="ptOptionsDialogVisible = true" />
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <Drawer v-model:visible="dtDialogVisible" position="left" :header="'DT 覆写 — ' + (meta?.label ?? '')" class="!w-[600px]">
      <div class="flex-1">
        <CodeEditor v-model="dtDraft" />
      </div>
      <p class="text-xs text-gray-400 mt-2">
        <i class="pi pi-info-circle mr-1" />设计 token 对象，生成 --p-* CSS 变量
      </p>
      <template #footer>
        <Button label="取消" severity="secondary" variant="outlined" @click="dtDialogVisible = false" />
        <Button label="保存" @click="saveDT" />
      </template>
    </Drawer>

    <Drawer v-model:visible="ptOptionsDialogVisible" position="left" :header="'PT 选项 — ' + (meta?.label ?? '')" class="!w-[480px]">
      <div class="flex flex-col gap-4">
        <div>
          <div class="flex items-center gap-1 mb-1">
            <label class="text-xs text-gray-500">mergeMode</label>
            <i class="pi pi-info-circle text-xs cursor-help text-gray-400" v-tooltip="'deep: 深度合并; replace: 替换式覆盖'" />
          </div>
          <Select v-model="ptOptionsDraft.mergeMode" :options="['deep', 'replace']" fluid />
        </div>
        <div>
          <div class="flex items-center gap-1 mb-1">
            <label class="text-xs text-gray-500">mergeSections</label>
            <i class="pi pi-info-circle text-xs cursor-help text-gray-400" v-tooltip="'true: 合并 sections; false: 替换'" />
          </div>
          <ToggleSwitch v-model="ptOptionsDraft.mergeSections" />
        </div>
      </div>
      <template #footer>
        <Button label="取消" severity="secondary" variant="outlined" @click="ptOptionsDialogVisible = false" />
        <Button label="保存" @click="savePTOptions" />
      </template>
    </Drawer>

    <div v-if="inlineControls.length > 0" class="flex flex-col gap-3">
      <div v-for="c in inlineControls" :key="c.key" class="flex items-center justify-between">
        <span class="text-xs text-gray-500">{{ c.label }}</span>
        <ToggleSwitch :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key] = $event" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { PropDef } from '@/shared/types/component'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import Tooltip from 'primevue/tooltip'
import CodeEditor from './CodeEditor.vue'
import PtEditor from './PtEditor.vue'

const vTooltip = Tooltip

const siteStore = useSiteStore()
const comp = computed(() => siteStore.selectedComponent)
const meta = computed(() => comp.value ? getComponentMeta(comp.value.type) ?? null : null)

const sections = computed(() => {
  if (meta.value?.panelSections) return meta.value.panelSections
  if (meta.value?.propsPanel) return [{ controls: meta.value.propsPanel }]
  return []
})
const titledSections = computed(() => sections.value.filter(s => s.title))
const inlineSections = computed(() => sections.value.filter(s => !s.title))
const openKeys = computed(() => [...titledSections.value.map(s => s.title!), '__pt'])
const inlineControls = computed(() => {
  const r: PropDef[] = []
  for (const s of inlineSections.value) r.push(...s.controls)
  return r
})

const hasPtModifications = computed(() => {
  if (!comp.value?.pt) return false
  return Object.values(comp.value.pt).some((v: any) => v?.class)
})

const hasAdvancedModifications = computed(() =>
  !!(comp.value?.props?.dt || comp.value?.props?.ptOptions),
)

const ptDialogVisible = ref(false)
function onPTSave(pt: Record<string, any>) {
  if (comp.value) comp.value.pt = pt
}

const dtDialogVisible = ref(false)
const dtDraft = ref('{}')
watch(dtDialogVisible, (v) => {
  if (v && comp.value) {
    dtDraft.value = comp.value.props?.dt ? JSON.stringify(comp.value.props.dt, null, 2) : '{}'
  }
})
function saveDT() {
  if (comp.value) {
    try { comp.value.props.dt = JSON.parse(dtDraft.value) } catch {}
  }
  dtDialogVisible.value = false
}

const ptOptionsDialogVisible = ref(false)
const ptOptionsDraft = ref<{ mergeMode?: string; mergeSections?: boolean }>({})
watch(ptOptionsDialogVisible, (v) => {
  if (v && comp.value) {
    ptOptionsDraft.value = { ...(comp.value.props?.ptOptions ?? { mergeMode: 'deep', mergeSections: true }) }
  }
})
function savePTOptions() {
  if (comp.value) comp.value.props.ptOptions = { ...ptOptionsDraft.value }
  ptOptionsDialogVisible.value = false
}
</script>
