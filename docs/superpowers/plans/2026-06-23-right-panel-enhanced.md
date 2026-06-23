# Right Panel Enhanced Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure right panel to 4 tabs (属性/插槽/样式/事件), replace PT raw Textarea with a dual-mode Dialog (structured + Monaco), add 高级 section with dt/ptOptions editors, simplify SlotsPanel.

**Architecture:** New `CodeEditor.vue` (Monaco wrapper) and `PtEditor.vue` (dual-mode PT Dialog). PropsPanel gets PT button + 高级 section. SlotsPanel rewritten as simple list. RightPanel adds 4th tab. Card meta upgraded to panelSections.

**Tech Stack:** Vue 3 + setup, PrimeVue 4, Monaco Editor 0.52.2 (already in deps), Vite 6

---

### Task 1: Update CardRenderer to use v-bind

**Files:**
- Modify: `src/renderer/components/CardRenderer.vue`

- [ ] **Replace `:unstyled` with full `v-bind` pattern**

```vue
<template>
  <Card v-bind="node.props" :class="node.styles?.class" :style="node.styles?.style" :pt="node.pt">
    <template #header>
      <template v-if="(node.slotVisibility?.header ?? true)">
        <Renderer v-if="node.slots?.header?.length" :dsl="node.slots.header" />
        <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 m-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
          <i class="pi pi-folder-open mr-1" />header 插槽 — 从左侧拖入组件</div>
      </template>
    </template>
    <template #title>
      <template v-if="(node.slotVisibility?.title ?? true)">
        <Renderer v-if="node.slots?.title?.length" :dsl="node.slots.title" />
        <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 m-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
          <i class="pi pi-folder-open mr-1" />title 插槽 — 从左侧拖入组件</div>
      </template>
    </template>
    <template #subtitle>
      <template v-if="(node.slotVisibility?.subtitle ?? true)">
        <Renderer v-if="node.slots?.subtitle?.length" :dsl="node.slots.subtitle" />
        <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 m-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
          <i class="pi pi-folder-open mr-1" />subtitle 插槽 — 从左侧拖入组件</div>
      </template>
    </template>
    <template #content>
      <template v-if="(node.slotVisibility?.content ?? true)">
        <Renderer v-if="node.slots?.content?.length" :dsl="node.slots.content" />
        <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 m-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
          <i class="pi pi-folder-open mr-1" />content 插槽 — 从左侧拖入组件</div>
      </template>
    </template>
    <template #footer>
      <template v-if="(node.slotVisibility?.footer ?? true)">
        <Renderer v-if="node.slots?.footer?.length" :dsl="node.slots.footer" />
        <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 m-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
          <i class="pi pi-folder-open mr-1" />footer 插槽 — 从左侧拖入组件</div>
      </template>
    </template>
  </Card>
</template>
<script setup lang="ts">
import type { ComponentNode } from '@/shared/types/component'
import Card from 'primevue/card'
import Renderer from '@/renderer/core/Renderer.vue'
defineProps<{ node: ComponentNode }>()
</script>
```

- [ ] **Remove unused `computed` import** — `computed` and `comp` are no longer needed since we use `node` directly.

- [ ] **Verify build**

Run: `npm run build`
Expected: no type errors

---

### Task 2: Upgrade card.ts meta to panelSections

**Files:**
- Modify: `src/editor/registry/card.ts`

- [ ] **Replace `propsPanel` with `panelSections`**

```typescript
import type { ComponentMeta } from '@/shared/types/component'
export const cardMeta: ComponentMeta = {
  type: 'Card', label: '卡片', icon: 'pi pi-id-card',
  defaultProps: { unstyled: false },
  defaultStyles: { class: '' },
  panelSections: [
    {
      title: '基本',
      controls: [
        { key: 'unstyled', label: '移除默认样式', control: 'switch' },
      ],
    },
  ],
  slots: [
    { name: 'header', label: '顶部', allowsChildren: true },
    { name: 'title', label: '标题', allowsChildren: true },
    { name: 'subtitle', label: '副标题', allowsChildren: true },
    { name: 'content', label: '主内容', allowsChildren: true },
    { name: 'footer', label: '底部', allowsChildren: true },
  ],
  ptNodes: [
    { name: 'root', label: '容器' }, { name: 'header', label: '顶部' },
    { name: 'body', label: '主体' }, { name: 'content', label: '内容' },
    { name: 'title', label: '标题' }, { name: 'subtitle', label: '副标题' },
    { name: 'footer', label: '底部' },
  ],
  defaultChildren: { header: [], title: [], subtitle: [], content: [], footer: [] },
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: no type errors

---

### Task 3: Create CodeEditor.vue — Monaco wrapper

**Files:**
- Create: `src/editor/panels/CodeEditor.vue`

- [ ] **Create CodeEditor.vue**

```vue
<template>
  <div ref="container" class="h-full min-h-[200px] border rounded overflow-hidden" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  language?: string
  theme?: string
}>(), {
  language: 'json',
  theme: 'github',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const container = ref<HTMLElement>()
let editor: any = null
let monaco: any = null

onMounted(async () => {
  const monacoMod = await import('monaco-editor')
  monaco = monacoMod

  monaco.editor.defineTheme('github', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
      { token: 'string', foreground: '0a3069' },
      { token: 'number', foreground: '0550ae' },
      { token: 'keyword', foreground: '8250df' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#24292f',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editorCursor.foreground': '#24292f',
      'editor.selectionBackground': '#c8e1ff',
      'editorLineNumber.foreground': '#6e7781',
      'editorLineNumber.activeForeground': '#24292f',
      'editorIndentGuide.background': '#d0d7de',
      'editorIndentGuide.activeBackground': '#d0d7de',
    },
  })

  editor = monaco.editor.create(container.value!, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    minimap: { enabled: false },
    lineNumbers: 'on',
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    formatOnPaste: true,
  })

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor.getValue())
  })
})

watch(() => props.modelValue, (val) => {
  if (editor && val !== editor.getValue()) {
    editor.setValue(val)
  }
})

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>
```

- [ ] **Verify build**

Run: `npm run build`
Expected: no type errors

---

### Task 4: Create PtEditor.vue — Dual-mode PT Dialog

**Files:**
- Create: `src/editor/panels/PtEditor.vue`

- [ ] **Create PtEditor.vue**

```vue
<template>
  <Dialog v-model:visible="visible" :header="'PT 覆写 — ' + componentLabel" modal :style="{ width: '800px' }" maximizable>
    <SelectButton v-model="mode" :options="modeOptions" option-value="key" option-label="label" class="mb-3" size="small" />

    <!-- Structured mode -->
    <Accordion v-if="mode === 'structured'" multiple class="max-h-[60vh] overflow-y-auto">
      <AccordionPanel v-for="node in ptNodes" :key="node.name" :value="node.name">
        <AccordionHeader class="text-sm">{{ node.label }} ({{ node.name }})</AccordionHeader>
        <AccordionContent>
          <label class="text-xs text-gray-500 mb-1 block">class</label>
          <InputText v-model="draft[node.name]!.class" fluid />
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <!-- Monaco mode -->
    <div v-else class="h-[60vh]">
      <CodeEditor v-model="monacoText" />
    </div>

    <template #footer>
      <Button label="取消" severity="secondary" variant="outlined" @click="cancel" />
      <Button label="保存" @click="save" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PTNodeMeta } from '@/shared/types/component'
import Dialog from 'primevue/dialog'
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

const mode = ref<'structured' | 'monaco'>('structured')
const modeOptions = [
  { key: 'structured', label: '🔧 结构化' },
  { key: 'monaco', label: '📝 原始 JSON' },
]

const ptNodes = computed(() => props.ptNodes ?? [])

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
```

- [ ] **Verify build**

Run: `npm run build`
Expected: no type errors

---

### Task 5: Update PropsPanel.vue

**Files:**
- Modify: `src/editor/panels/PropsPanel.vue`

Changes:
1. Remove `__slots` accordion panel and its supporting code (`slotList` computed, `setSlotVis` function)
2. Remove `'__slots'` from `openKeys`
3. Replace PT Textarea with a button opening PtEditor Dialog
4. Add `__ptAdvanced` accordion panel for dt + ptOptions with tooltips and dialogs

- [ ] **Replace PropsPanel.vue content**

```vue
<template>
  <div class="space-y-3">
    <Accordion :value="openKeys" multiple>
      <AccordionPanel v-for="s in titledSections" :key="s.title" :value="s.title">
        <AccordionHeader class="text-sm">{{ s.title }}</AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-3 pt-2">
            <div v-for="c in s.controls" :key="c.key">
              <label class="text-xs text-gray-500 mb-1 block">{{ c.label }}</label>
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

      <!-- PT 覆写 -->
      <AccordionPanel value="__pt">
        <AccordionHeader class="text-sm">PT 覆写</AccordionHeader>
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

      <!-- 高级 -->
      <AccordionPanel value="__advanced">
        <AccordionHeader class="text-sm">高级</AccordionHeader>
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

    <!-- DT Dialog -->
    <Dialog v-model:visible="dtDialogVisible" :header="'DT 覆写 — ' + (meta?.label ?? '')" modal :style="{ width: '600px' }">
      <div class="h-[40vh]">
        <CodeEditor v-model="dtDraft" />
      </div>
      <p class="text-xs text-gray-400 mt-2">
        <i class="pi pi-info-circle mr-1" />设计 token 对象，生成 --p-* CSS 变量
      </p>
      <template #footer>
        <Button label="取消" severity="secondary" variant="outlined" @click="dtDialogVisible = false" />
        <Button label="保存" @click="saveDT" />
      </template>
    </Dialog>

    <!-- ptOptions Dialog -->
    <Dialog v-model:visible="ptOptionsDialogVisible" :header="'PT 选项 — ' + (meta?.label ?? '')" modal :style="{ width: '480px' }">
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
    </Dialog>

    <div v-if="inlineControls.length > 0" class="flex flex-col gap-3">
      <div v-for="c in inlineControls" :key="c.key" class="flex items-center justify-between">
        <span class="text-xs text-gray-500">{{ c.label }}</span>
        <ToggleSwitch :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key] = $event" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { PropDef } from '@/shared/types/component'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import Tooltip from 'primevue/tooltip'
import CodeEditor from './CodeEditor.vue'
import PtEditor from './PtEditor.vue'

const siteStore = useSiteStore()
const comp = computed(() => siteStore.selectedComponent)
const meta = computed(() => getComponentMeta(comp.value?.type ?? '') ?? null)

const sections = computed(() => {
  if (meta.value?.panelSections) return meta.value.panelSections
  if (meta.value?.propsPanel) return [{ controls: meta.value.propsPanel }]
  return []
})
const titledSections = computed(() => sections.value.filter(s => s.title))
const inlineSections = computed(() => sections.value.filter(s => !s.title))
const openKeys = computed(() => [...titledSections.value.map(s => s.title!), '__pt', '__advanced'])
const inlineControls = computed(() => {
  const r: PropDef[] = []
  for (const s of inlineSections.value) r.push(...s.controls)
  return r
})

// PT Dialog
const ptDialogVisible = ref(false)
function onPTSave(pt: Record<string, any>) {
  if (comp.value) comp.value.pt = pt
}

// DT Dialog
const dtDialogVisible = ref(false)
const dtDraft = ref('{}')
function saveDT() {
  if (comp.value) {
    try { comp.value.props.dt = JSON.parse(dtDraft.value) } catch {}
  }
  dtDialogVisible.value = false
}

// ptOptions Dialog
const ptOptionsDialogVisible = ref(false)
const ptOptionsDraft = ref<{ mergeMode?: string; mergeSections?: boolean }>({})
function savePTOptions() {
  if (comp.value) comp.value.props.ptOptions = { ...ptOptionsDraft.value }
  ptOptionsDialogVisible.value = false
}
</script>
```

Note: The `v-tooltip` directive needs to be registered. Add `directives: { tooltip: Tooltip }` in the component options — but since we're using `<script setup>`, we need a different approach. In `<script setup>`, directives are registered via `vName` convention:

```typescript
const vTooltip = Tooltip
```

Add this to the script setup.

- [ ] **Add Tooltip directive registration**

Insert before `const siteStore = useSiteStore()`:

```typescript
const vTooltip = Tooltip
```

- [ ] **Verify build**

Run: `npm run build`
Expected: no type errors

---

### Task 6: Rewrite SlotsPanel.vue

**Files:**
- Modify: `src/editor/panels/SlotsPanel.vue`

- [ ] **Rewrite SlotsPanel.vue**

```vue
<template>
  <div class="space-y-1">
    <div
      v-for="slot in slotList"
      :key="slot.name"
      class="flex items-center justify-between px-2 py-2.5 rounded-md"
      :class="hasChildren(slot.name) ? 'bg-surface-50 dark:bg-surface-800/50' : 'opacity-50'"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-folder-open text-xs text-gray-400" />
        <span class="text-sm">{{ slot.label }}</span>
      </div>
      <ToggleSwitch
        :model-value="slotVisibility[slot.name] ?? true"
        @update:model-value="setVis(slot.name, $event)"
        size="small"
      />
    </div>
    <div v-if="slotList.length === 0" class="text-xs text-gray-400 text-center py-8">此组件无可用插槽</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import ToggleSwitch from 'primevue/toggleswitch'

const siteStore = useSiteStore()

const comp = computed(() => siteStore.selectedComponent)
const meta = computed(() => getComponentMeta(comp.value?.type ?? '') ?? null)

const slotList = computed(() => meta.value?.slots ?? [])

const slotVisibility = computed(() => comp.value?.slotVisibility ?? {})

function hasChildren(slotName: string): boolean {
  return (comp.value?.slots?.[slotName]?.length ?? 0) > 0
}

function setVis(name: string, v: boolean) {
  if (!comp.value) return
  if (!comp.value.slotVisibility) comp.value.slotVisibility = {}
  comp.value.slotVisibility[name] = v
}
</script>
```

- [ ] **Verify build**

Run: `npm run build`
Expected: no type errors

---

### Task 7: Update RightPanel.vue — add 4th tab

**Files:**
- Modify: `src/editor/layout/RightPanel.vue`

- [ ] **Add "插槽" tab and render SlotsPanel**

```vue
<template>
  <div class="p-3">
    <div v-if="!siteStore.selectedComponent" class="text-sm text-gray-400 text-center py-20">点击画布中的组件<br />查看属性</div>
    <div v-else>
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{{ getComponentLabel() }}</h3>
      <SelectButton v-model="activeTab" :options="tabs" option-value="key" option-label="label" class="mb-3" size="small" fluid />
      <PropsPanel v-if="activeTab === 'props'" />
      <SlotsPanel v-if="activeTab === 'slots'" />
      <StylesPanel v-if="activeTab === 'styles'" />
      <EventsPanel v-if="activeTab === 'events'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import SelectButton from 'primevue/selectbutton'
import PropsPanel from '@/editor/panels/PropsPanel.vue'
import SlotsPanel from '@/editor/panels/SlotsPanel.vue'
import StylesPanel from '@/editor/panels/StylesPanel.vue'
import EventsPanel from '@/editor/panels/EventsPanel.vue'

const siteStore = useSiteStore()
const activeTab = ref('props')
const tabs = [
  { key: 'props', label: '属性' },
  { key: 'slots', label: '插槽' },
  { key: 'styles', label: '样式' },
  { key: 'events', label: '事件' },
]

function getComponentLabel(): string {
  if (!siteStore.selectedComponent) return ''
  return getComponentMeta(siteStore.selectedComponent.type)?.label ?? siteStore.selectedComponent.type
}
</script>
```

- [ ] **Verify build**

Run: `npm run build`
Expected: no type errors

---

### Task 8: Final build check

- [ ] **Full build**

```bash
npm run build
```

Expected: clean exit, no type errors, no warnings

- [ ] **Manual smoke test**

1. Run `vp run dev`
2. Open editor, select a Card component
3. Verify 4 tabs show up (属性/插槽/样式/事件)
4. Click 插槽 tab — see 5 slots with toggle switches, empty ones gray, filled ones normal
5. Click PT 覆写 button → Dialog opens with structured mode → switch to Monaco → verify content syncs
6. Click DT / ptOptions buttons → verify dialogs open
7. Toggle a slot off → verify canvas hides that slot
8. Verify other components (Button, Panel) still work in right panel
