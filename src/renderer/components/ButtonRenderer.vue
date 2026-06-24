<template>
  <Button
    v-bind="node.props"
    :class="finalClass"
    :style="node.styles?.style"
    :pt="node.pt"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import type { ComponentNode } from '@/shared/types/component'
import { computeFinalClasses } from '@/shared/utils/classMerger'

const props = defineProps<{ node: ComponentNode }>()

const finalClass = computed(() => computeFinalClasses(props.node))
</script>
