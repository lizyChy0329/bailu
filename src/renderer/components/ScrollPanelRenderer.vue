<template>
  <ScrollPanel
    v-bind="node.props"
    :class="node.styles?.class"
    :style="node.styles?.style"
    :pt="node.pt"
  >
    <Renderer :dsl="node.slots?.default || []" />
  </ScrollPanel>
</template>

<script setup lang="ts">
import ScrollPanel from 'primevue/scrollpanel'
import type { ComponentNode } from '@/shared/types/component'
import Renderer from '@/renderer/core/Renderer.vue'

defineProps<{ node: ComponentNode }>()
</script>
