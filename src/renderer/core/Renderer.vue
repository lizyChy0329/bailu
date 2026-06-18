<template>
  <div class="space-y-3">
    <template v-for="node in dsl" :key="node.id">
      <component
        :is="resolveComponent(node.type)"
        :node="node"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ComponentNode } from '@/shared/types/component'
import { resolveComponent } from './resolveComponent'

defineProps<{
  dsl: ComponentNode[]
}>()
</script>
