<template>
  <div class="relative h-full min-h-[200px]">
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 rounded border z-10">
      <i class="pi pi-spin pi-spinner text-2xl text-gray-400" />
    </div>
    <div ref="container" class="h-full min-h-[200px] border rounded overflow-hidden" />
  </div>
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
const loading = ref(true)
let editor: any = null

onMounted(async () => {
  const editorWorker = await import('monaco-editor/esm/vs/editor/editor.worker?worker')
  const jsonWorker = await import('monaco-editor/esm/vs/language/json/json.worker?worker')

  ;(self as any).MonacoEnvironment = {
    getWorker(_: string, label: string) {
      if (label === 'json') return new jsonWorker.default()
      return new editorWorker.default()
    },
  }

  const monaco = await import('monaco-editor')

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

  loading.value = false
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
