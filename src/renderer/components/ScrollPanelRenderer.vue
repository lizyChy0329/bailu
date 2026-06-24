<template>
  <ScrollPanel
    v-bind="node.props"
    :class="finalClass"
    :style="node.styles?.style"
    :pt="node.pt"
  >
    <Renderer :dsl="node.slots?.default || []" />
  </ScrollPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ScrollPanel from 'primevue/scrollpanel'
import type { ComponentNode } from '@/shared/types/component'
import Renderer from '@/renderer/core/Renderer.vue'
import { computeFinalClasses } from '@/shared/utils/classMerger'

const props = defineProps<{ node: ComponentNode }>()
const finalClass = computed(() => computeFinalClasses(props.node))
</script>
