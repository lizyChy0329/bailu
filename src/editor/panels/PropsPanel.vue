<template>
  <div class="space-y-3">
    <Accordion :value="openKeys" multiple>
      <!-- Component prop sections -->
      <AccordionPanel v-for="s in titledSections" :key="s.title" :value="s.title">
        <AccordionHeader class="text-sm">{{ s.title }}</AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-3 pt-2">
            <div v-for="c in s.controls" :key="c.key">
              <label v-if="c.control !== 'switch'" class="text-xs text-gray-500 mb-1 block">{{ c.label }}</label>
              <InputText v-if="c.control === 'text-input'" :model-value="comp!.props[c.key] as string" @update:model-value="comp!.props[c.key] = $event" fluid />
              <InputNumber v-else-if="c.control === 'number-input'" :model-value="comp!.props[c.key] as number" @update:model-value="comp!.props[c.key] = $event" fluid />
              <Select v-else-if="c.control === 'select'" :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key] = $event" :options="c.options" option-label="label" option-value="value" fluid />
              <div v-else-if="c.control === 'switch'" class="flex items-center justify-between">
                <span class="text-xs text-gray-500">{{ c.label }}</span>
                <ToggleSwitch :model-value="comp!.props[c.key] as boolean" @update:model-value="comp!.props[c.key] = $event" />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <!-- Styles section -->
      <AccordionPanel value="__styles">
        <AccordionHeader class="text-sm">样式类</AccordionHeader>
        <AccordionContent>
          <div class="space-y-3">
            <!-- Quick add input -->
            <AutoComplete
              v-model="newClassInput"
              :suggestions="[]"
              fluid
              placeholder="输入类名回车添加"
              :typeahead="false"
              @complete="() => {}"
              @keydown.enter.prevent="addClass"
            />

            <!-- Grouped class display -->
            <div v-for="(grouped, groupName) in groupedClasses" :key="groupName">
              <AccordionPanel :value="groupName">
                <AccordionHeader class="text-xs">{{ groupName }}</AccordionHeader>
                <AccordionContent>
                  <div class="flex flex-wrap gap-1">
                    <Chip
                      v-for="cls in grouped"
                      :key="cls"
                      :label="cls"
                      removable
                      @remove="removeClass(cls)"
                    />
                  </div>
                </AccordionContent>
              </AccordionPanel>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <!-- Presets section -->
      <AccordionPanel value="__presets">
        <AccordionHeader class="text-sm">预设组合</AccordionHeader>
        <AccordionContent>
          <div class="space-y-2">
            <div v-for="preset in siteStore.currentSite?.groupClassPresets" :key="preset.id"
                 class="flex items-center justify-between p-2 border rounded">
              <div class="flex items-center gap-2">
                <Checkbox v-model="stylesDraft.groupRefs" :value="preset.id" />
                <div>
                  <div class="text-sm font-medium">{{ preset.name }}</div>
                  <div class="text-xs text-gray-500">{{ preset.classes.join(' ') }}</div>
                </div>
              </div>
            </div>
            <Button label="管理预设" icon="pi pi-cog" variant="outlined" size="small" @click="presetDialogVisible = true" />
          </div>
        </AccordionContent>
      </AccordionPanel>

      <!-- PT section -->
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

      <!-- Advanced section -->
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

    <!-- DT Drawer -->
    <Drawer v-model:visible="dtDialogVisible" position="left" :header="'DT 覆写 — ' + (meta?.label ?? '')" class="!w-[600px]">
      <div class="flex flex-col flex-1 min-h-0">
        <div class="flex-1 min-h-0">
          <CodeEditor v-model="dtDraft" />
        </div>
        <p class="text-xs text-gray-400 mt-2 shrink-0">
          <i class="pi pi-info-circle mr-1" />设计 token 对象，生成 --p-* CSS 变量
        </p>
      </div>
      <template #footer>
        <Button label="取消" severity="secondary" variant="outlined" @click="dtDialogVisible = false" />
        <Button label="保存" @click="saveDT" />
      </template>
    </Drawer>

    <!-- PT Options Drawer -->
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

    <!-- Preset Management Drawer -->
    <Drawer v-model:visible="presetDialogVisible" position="right" :header="'预设组合管理'" class="!w-[500px]">
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          将常用的样式组合保存为预设，一键应用到组件上。修改预设后，所有引用该预设的组件会自动更新。
        </p>

        <Button label="新建预设" icon="pi pi-plus" @click="openNewPreset" />

        <div class="space-y-2">
          <div v-for="preset in siteStore.currentSite?.groupClassPresets" :key="preset.id"
               class="flex items-center justify-between p-3 border rounded">
            <div>
              <div class="font-medium">{{ preset.name }}</div>
              <div class="text-xs text-gray-500">{{ preset.description }}</div>
              <div class="flex flex-wrap gap-1 mt-1">
                <Chip v-for="cls in preset.classes" :key="cls" :label="cls" size="small" />
              </div>
            </div>
            <Button icon="pi pi-trash" variant="text" size="small" @click="deletePreset(preset.id)" />
          </div>
        </div>
      </div>
    </Drawer>

    <!-- New/Edit Preset Dialog -->
    <Dialog v-model:visible="presetEditVisible" :header="presetEditing?.id ? '编辑预设' : '新建预设'" modal>
      <div class="space-y-4">
        <div>
          <label class="block text-sm mb-1">名称</label>
          <InputText v-model="presetDraft.name" fluid />
        </div>
        <div>
          <label class="block text-sm mb-1">描述</label>
          <InputText v-model="presetDraft.description" fluid />
        </div>
        <div>
          <label class="block text-sm mb-1">类名</label>
          <AutoComplete
            v-model="presetDraft.classes"
            :suggestions="[]"
            multiple
            fluid
            placeholder="输入类名回车添加"
            :typeahead="false"
            @complete="() => {}"
          />
        </div>
      </div>
      <template #footer>
        <Button label="取消" variant="outlined" @click="presetEditVisible = false" />
        <Button label="保存" @click="savePreset" />
      </template>
    </Dialog>

    <!-- Inline controls -->
    <div v-if="inlineControls.length > 0" class="flex flex-col gap-3">
      <div v-for="c in inlineControls" :key="c.key" class="flex items-center justify-between">
        <span class="text-xs text-gray-500">{{ c.label }}</span>
        <ToggleSwitch :model-value="comp!.props[c.key] as boolean" @update:model-value="comp!.props[c.key] = $event" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { PropDef, GroupClassPreset } from '@/shared/types/component'
import { generateId } from '@/shared/utils/id'
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
import AutoComplete from 'primevue/autocomplete'
import Chip from 'primevue/chip'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
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
const openKeys = computed(() => [...titledSections.value.map(s => s.title!), '__styles', '__pt'])
const inlineControls = computed(() => {
  const r: PropDef[] = []
  for (const s of inlineSections.value) r.push(...s.controls)
  return r
})

// Styles draft state
const stylesDraft = ref({
  classes: [] as string[],
  groupRefs: [] as string[],
})

// New class input (single-value, not multiple)
const newClassInput = ref('')

function addClass() {
  const cls = newClassInput.value.trim()
  if (cls && !stylesDraft.value.classes.includes(cls)) {
    stylesDraft.value.classes.push(cls)
  }
  newClassInput.value = ''
}

// Initialize stylesDraft from selected component
watch(comp, (newComp) => {
  if (newComp) {
    stylesDraft.value = {
      classes: newComp.styles?.classes ?? [],
      groupRefs: newComp.styles?.groupRefs ?? [],
    }
  }
}, { immediate: true })

// Sync stylesDraft back to component
watch(stylesDraft, (newVal) => {
  if (comp.value) {
    comp.value.styles.classes = newVal.classes
    comp.value.styles.groupRefs = newVal.groupRefs
    siteStore.persistCurrentSite()
  }
}, { deep: true })

// Class grouping configuration
const classGroups: Record<string, string[]> = {
  '间距': ['p-', 'm-', 'gap-', 'space-'],
  '圆角': ['rounded-'],
  '阴影': ['shadow-'],
  '背景': ['bg-'],
  '边框': ['border-'],
  '排版': ['text-', 'font-', 'leading-', 'tracking-'],
  '布局': ['flex-', 'grid-', 'w-', 'h-', 'max-', 'min-'],
  '其他': [],
}

function groupClasses(classes: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {
    '间距': [],
    '圆角': [],
    '阴影': [],
    '背景': [],
    '边框': [],
    '排版': [],
    '布局': [],
    '其他': [],
  }
  for (const cls of classes) {
    let matched = false
    for (const [groupName, prefixes] of Object.entries(classGroups)) {
      if (groupName === '其他') continue
      if (prefixes.some(p => cls.startsWith(p))) {
        result[groupName].push(cls)
        matched = true
        break
      }
    }
    if (!matched) result['其他'].push(cls)
  }
  return result
}

const groupedClasses = computed(() => groupClasses(stylesDraft.value.classes))

function removeClass(cls: string) {
  stylesDraft.value.classes = stylesDraft.value.classes.filter(c => c !== cls)
}

// PT
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

// Preset management
const presetDialogVisible = ref(false)
const presetEditVisible = ref(false)
const presetDraft = ref<GroupClassPreset>({ id: '', name: '', classes: [] })
const presetEditing: Ref<GroupClassPreset | null> = ref(null)

function openNewPreset() {
  presetEditing.value = null
  presetDraft.value = { id: generateId(), name: '', classes: [] }
  presetEditVisible.value = true
}

function savePreset() {
  if (!siteStore.currentSite) return
  const presets = siteStore.currentSite.groupClassPresets
  const existing = presets.find(p => p.id === presetDraft.value.id)
  if (existing) {
    Object.assign(existing, presetDraft.value)
  } else {
    presets.push({ ...presetDraft.value })
  }
  siteStore.persistCurrentSite()
  presetEditVisible.value = false
}

function deletePreset(id: string) {
  if (!siteStore.currentSite) return
  siteStore.currentSite.groupClassPresets = siteStore.currentSite.groupClassPresets.filter(p => p.id !== id)
  // Remove references from selected component
  if (comp.value) {
    comp.value.styles.groupRefs = comp.value.styles.groupRefs.filter(refId => refId !== id)
    siteStore.persistCurrentSite()
  }
}
</script>
