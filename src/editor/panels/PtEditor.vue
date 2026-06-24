<template>
  <Drawer v-model:visible="dialogVisible" position="left" :header="'PT 覆写 — ' + componentLabel" class="!w-[640px]">
    <div class="flex flex-col flex-1 min-h-0 gap-3 h-full">
      <PtDiagram v-if="rootNode" :node="rootNode" />

      <SelectButton v-model="mode" :options="modeOptions" option-value="key" option-label="label" class="shrink-0" size="small" />

      <Accordion v-if="mode === 'structured'" multiple class="flex-1 overflow-y-auto min-h-0" :value="openPtNodes">
        <AccordionPanel v-for="node in flatNodes" :key="node.name" :value="node.name">
          <AccordionHeader class="text-sm">{{ node.label }} ({{ node.name }})</AccordionHeader>
          <AccordionContent>
            <label class="text-xs text-gray-500 mb-1 block">class</label>
            <AutoComplete
              v-model="draft[node.name]!.classes"
              :suggestions="[]"
              multiple
              fluid
              placeholder="输入类名回车添加"
              @complete="() => {}"
            />
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <div v-else class="flex-1 min-h-0">
        <CodeEditor v-model="monacoText" />
      </div>
    </div>

    <template #footer>
      <Button label="取消" severity="secondary" variant="outlined" @click="cancel" />
      <Button label="保存" @click="save" />
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PTNodeMeta } from '@/shared/types/component'
import Drawer from 'primevue/drawer'
import SelectButton from 'primevue/selectbutton'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import InputText from 'primevue/inputtext'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import CodeEditor from './CodeEditor.vue'
import PtDiagram from './PtDiagram.vue'

const props = defineProps<{
  visible: boolean
  pt: Record<string, any>
  ptNodes?: PTNodeMeta[]
  componentLabel: string
}>()

const emit = defineEmits<{
  'update:visible': [v: boolean]
  save: [pt: Record<string, any>]
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

const mode = ref<'structured' | 'monaco'>('structured')
const modeOptions = [
  { key: 'structured', label: '🔧 结构化' },
  { key: 'monaco', label: '📝 原始 JSON' },
]

const ptNodes = computed(() => props.ptNodes ?? [])

const rootNode = computed(() => ptNodes.value[0])

const flatNodes = computed(() => flattenPTNodes(ptNodes.value))

function flattenPTNodes(nodes: PTNodeMeta[]): PTNodeMeta[] {
  const result: PTNodeMeta[] = []
  for (const n of nodes) {
    const { children, ...rest } = n
    result.push(rest)
    if (children) result.push(...flattenPTNodes(children))
  }
  return result
}

const openPtNodes = computed(() =>
  flatNodes.value.filter(n => draft.value[n.name]?.class).map(n => n.name),
)

const draft = ref<Record<string, any>>({})
const monacoText = ref('')

watch(() => props.visible, (v) => {
  if (v) {
    draft.value = JSON.parse(JSON.stringify(props.pt ?? {}))
    ensureAllNodes()
    monacoText.value = JSON.stringify(draft.value, null, 2)
  }
})

function ensureAllNodes() {
  for (const n of flatNodes.value) {
    if (!draft.value[n.name]) draft.value[n.name] = {}
    if (typeof draft.value[n.name] === 'object' && !Array.isArray(draft.value[n.name])) {
      // Support both class (string, backward compat) and classes (array, new)
      if (!('class' in draft.value[n.name]) && !('classes' in draft.value[n.name])) {
        draft.value[n.name].classes = []
      }
      // Convert old class string to classes array
      if (draft.value[n.name].class && !draft.value[n.name].classes) {
        draft.value[n.name].classes = (draft.value[n.name].class as string).split(' ').filter(Boolean)
      }
    }
  }
}

watch(mode, (m) => {
  if (m === 'monaco') {
    monacoText.value = JSON.stringify(draft.value, null, 2)
  } else if (m === 'structured') {
    try {
      const parsed = JSON.parse(monacoText.value)
      if (typeof parsed === 'object') {
        draft.value = parsed
        ensureAllNodes()
      }
    } catch {}
  }
})

function cancel() {
  emit('update:visible', false)
}

function save() {
  let result: Record<string, any>
  if (mode.value === 'monaco') {
    try {
      result = JSON.parse(monacoText.value)
    } catch {
      result = {}
    }
  } else {
    result = JSON.parse(JSON.stringify(draft.value))
    // Convert classes array back to class string for backward compatibility
    for (const name of Object.keys(result)) {
      if (result[name]?.classes && Array.isArray(result[name].classes)) {
        result[name].class = result[name].classes.join(' ')
        delete result[name].classes
      }
    }
  }
  emit('save', result)
  emit('update:visible', false)
}
</script>
