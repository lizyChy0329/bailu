<template>
  <Panel
    v-bind="node.props"
    :class="node.styles?.class"
    :style="node.styles?.style"
    :pt="node.pt"
  >
    <template #header>
      <Renderer :dsl="node.slots?.header || []" />
    </template>
    <template #default>
      <Renderer :dsl="node.slots?.default || []" />
    </template>
    <template #footer>
      <Renderer :dsl="node.slots?.footer || []" />
    </template>
    <template #icons>
      <Renderer :dsl="node.slots?.icons || []" />
    </template>
  </Panel>
</template>

<script setup lang="ts">
import Panel from 'primevue/panel'
import type { ComponentNode } from '@/shared/types/component'
import Renderer from '@/renderer/core/Renderer.vue'

defineProps<{ node: ComponentNode }>()
</script>
