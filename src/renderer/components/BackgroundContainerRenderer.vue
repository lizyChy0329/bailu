<template>
  <div
    :style="{ backgroundImage: bgUrl, ...node.styles?.style }"
    :class="finalClass"
  >
    <Renderer :dsl="node.slots?.default ?? []" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentNode } from '@/shared/types/component'
import Renderer from '@/renderer/core/Renderer.vue'
import { computeFinalClasses } from '@/shared/utils/classMerger'

const props = defineProps<{ node: ComponentNode }>()
const finalClass = computed(() => computeFinalClasses(props.node))
const bgUrl = computed(() => props.node.props.backgroundImage ? `url(${props.node.props.backgroundImage})` : undefined)
</script>
