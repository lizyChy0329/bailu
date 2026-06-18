<template>
  <Image
    v-bind="node.props"
    :imageClass="node.styles?.class"
    :imageStyle="node.styles?.style"
    :pt="node.pt"
  />
</template>

<script setup lang="ts">
import Image from 'primevue/image'
import type { ComponentNode } from '@/shared/types/component'

defineProps<{ node: ComponentNode }>()
</script>
