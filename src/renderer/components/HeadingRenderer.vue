<template>
  <component
    :is="node.props.level || 'h2'"
    :class="finalClass"
    :style="node.styles?.style"
    v-html="processedText"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentNode } from '@/shared/types/component'
import { computeFinalClasses } from '@/shared/utils/classMerger'

const props = defineProps<{ node: ComponentNode }>()

const finalClass = computed(() => computeFinalClasses(props.node))

const processedText = computed(() => {
  const text = (props.node.props.text as string) || ''
  return text.replace(/\n/g, '<br>')
})
</script>