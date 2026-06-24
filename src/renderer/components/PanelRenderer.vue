<template>
  <Panel
    v-bind="node.props"
    :class="finalClass"
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
import { computed } from 'vue'
import Panel from 'primevue/panel'
import type { ComponentNode } from '@/shared/types/component'
import Renderer from '@/renderer/core/Renderer.vue'
import { computeFinalClasses } from '@/shared/utils/classMerger'

const props = defineProps<{ node: ComponentNode }>()
const finalClass = computed(() => computeFinalClasses(props.node))
</script>
