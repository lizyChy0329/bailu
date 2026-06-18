<template>
  <Button
    v-bind="node.props"
    :class="node.styles?.class"
    :style="node.styles?.style"
    :pt="node.pt"
  />
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import type { ComponentNode } from '@/shared/types/component'

defineProps<{ node: ComponentNode }>()
</script>
