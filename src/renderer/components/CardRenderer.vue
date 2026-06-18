<template>
  <Card
    v-bind="node.props"
    :class="node.styles?.class"
    :style="node.styles?.style"
    :pt="node.pt"
  >
    <template #header>
      <Renderer :dsl="node.slots?.header || []" />
    </template>
    <template #title>
      <Renderer :dsl="node.slots?.title || []" />
    </template>
    <template #subtitle>
      <Renderer :dsl="node.slots?.subtitle || []" />
    </template>
    <template #content>
      <Renderer :dsl="node.slots?.content || []" />
    </template>
    <template #footer>
      <Renderer :dsl="node.slots?.footer || []" />
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import type { ComponentNode } from '@/shared/types/component'
import Renderer from '@/renderer/core/Renderer.vue'

defineProps<{ node: ComponentNode }>()
</script>
