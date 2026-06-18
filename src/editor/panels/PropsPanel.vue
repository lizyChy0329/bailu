<template>
  <div class="space-y-3">
    <div v-for="def in propDefs" :key="def.key" class="flex items-center justify-between">
      <label class="text-xs text-gray-500">{{ def.label }}</label>
      <InputText
        v-if="def.control === 'text-input'"
        v-model="localProps[def.key]"
        size="small"
        style="width: 9rem"
        @input="syncProps"
      />
      <ToggleSwitch
        v-if="def.control === 'switch'"
        v-model="localProps[def.key]"
        @change="syncProps"
      />
      <Select
        v-if="def.control === 'select'"
        v-model="localProps[def.key]"
        :options="def.options || []"
        option-value="value"
        option-label="label"
        scroll-height="200px"
        style="width: 9rem"
        size="small"
        @change="syncProps"
      />
    </div>
    <div v-if="propDefs.length === 0" class="text-xs text-gray-400 text-center py-4">此组件无可配置属性</div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'

const siteStore = useSiteStore()

const propDefs = computed(() => {
  if (!siteStore.selectedComponent) return []
  return getComponentMeta(siteStore.selectedComponent.type)?.propsPanel ?? []
})

const localProps = reactive<Record<string, any>>({})

watch(
  () => siteStore.selectedComponent,
  (comp) => {
    Object.assign(localProps, comp?.props ?? {})
  },
  { immediate: true, deep: true },
)

function syncProps() {
  const comp = siteStore.selectedComponent
  if (comp) {
    comp.props = { ...localProps }
  }
}
</script>
