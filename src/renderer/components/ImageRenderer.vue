<template>
  <Image
    v-bind="node.props"
    :imageClass="finalClass"
    :imageStyle="node.styles?.style"
    :pt="node.pt"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Image from 'primevue/image'
import type { ComponentNode } from '@/shared/types/component'
import { computeFinalClasses } from '@/shared/utils/classMerger'

const props = defineProps<{ node: ComponentNode }>()
const finalClass = computed(() => computeFinalClasses(props.node))
</script>
