<template>
  <Drawer v-model:visible="dialogVisible" position="left" :header="'PT 覆写 — ' + componentLabel" class="!w-[640px]">
    <SelectButton v-model="mode" :options="modeOptions" option-value="key" option-label="label" class="mb-3" size="small" />

    <Accordion v-if="mode === 'structured'" multiple class="flex-1 overflow-y-auto" :value="openPtNodes">
      <AccordionPanel v-for="node in ptNodes" :key="node.name" :value="node.name">
        <AccordionHeader class="text-sm">{{ node.label }} ({{ node.name }})</AccordionHeader>
        <AccordionContent>
          <label class="text-xs text-gray-500 mb-1 block">class</label>
          <InputText v-model="draft[node.name]!.class" fluid />
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <div v-else class="flex-1">
      <CodeEditor v-model="monacoText" />
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
import Button from 'primevue/button'
import CodeEditor from './CodeEditor.vue'

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

const openPtNodes = computed(() =>
  ptNodes.value.filter(n => draft.value[n.name]?.class).map(n => n.name),
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
  for (const n of ptNodes.value) {
    if (!draft.value[n.name]) draft.value[n.name] = {}
    if (typeof draft.value[n.name] === 'object' && !Array.isArray(draft.value[n.name])) {
      if (!('class' in draft.value[n.name])) draft.value[n.name].class = ''
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
  if (mode.value === 'monaco') {
    try {
      emit('save', JSON.parse(monacoText.value))
    } catch {}
  } else {
    emit('save', draft.value)
  }
  emit('update:visible', false)
}
</script>
