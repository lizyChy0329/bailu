<template>
  <div class="space-y-3">
    <label class="text-xs text-gray-500 block">Tailwind 类名</label>
    <AutoComplete
      v-model="newClassInput"
      :suggestions="[]"
      fluid
      placeholder="例: shadow-lg rounded-xl p-4"
      :typeahead="false"
      @keydown="onKeyDown"
    />
    <Accordion :value="openGroups" multiple>
      <AccordionPanel v-for="(grouped, groupName) in groupedClasses" :key="groupName" :value="groupName">
        <AccordionHeader class="text-xs">{{ groupName }}</AccordionHeader>
        <AccordionContent>
          <div class="flex flex-wrap gap-1">
            <Chip v-for="cls in grouped" :key="cls" :label="cls" size="small" removable class="!text-xs !px-2 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" @remove="removeClass(cls)" />
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import AutoComplete from 'primevue/autocomplete'
import Chip from 'primevue/chip'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

const siteStore = useSiteStore()
const comp = computed(() => siteStore.selectedComponent)
const newClassInput = ref('')

const classes = computed({
  get: () => comp.value?.styles?.classes ?? [],
  set: (val) => {
    if (comp.value) {
      comp.value.styles.classes = val
      siteStore.persistCurrentSite()
    }
  },
})

function onKeyDown(e: KeyboardEvent) {
  console.log('[StylesPanel] onKeyDown', e.key, 'target:', (e.target as HTMLInputElement)?.value)
  if (e.key === 'Enter') {
    e.preventDefault()
    const cls = ((e.target as HTMLInputElement)?.value ?? '').trim()
    if (cls && !classes.value.includes(cls)) {
      classes.value = [...classes.value, cls]
    }
    newClassInput.value = ''
  }
}

function removeClass(cls: string) {
  classes.value = classes.value.filter((c: string) => c !== cls)
}

const classGroups: Record<string, string[]> = {
  '间距': ['p-', 'pt-', 'pr-', 'pb-', 'pl-', 'px-', 'py-', 'm-', 'mt-', 'mr-', 'mb-', 'ml-', 'mx-', 'my-', 'gap-', 'gap-x-', 'gap-y-', 'space-', 'space-x-', 'space-y-'],
  '圆角': ['rounded-'],
  '阴影': ['shadow-'],
  '背景': ['bg-'],
  '边框': ['border-'],
  '字体': ['text-', 'font-', 'leading-', 'tracking-'],
  '布局': ['flex-', 'grid-', 'w-', 'h-', 'size-', 'max-', 'min-'],
  '其他': [],
}

function groupClasses(classes: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {
    '间距': [], '圆角': [], '阴影': [], '背景': [],
    '边框': [], '字体': [], '布局': [], '其他': [],
  }
  for (const cls of classes) {
    let matched = false
    for (const [groupName, prefixes] of Object.entries(classGroups)) {
      if (groupName === '其他') continue
      if (prefixes.some(p => cls.startsWith(p))) {
        result[groupName].push(cls)
        matched = true
        break
      }
    }
    if (!matched) result['其他'].push(cls)
  }
  return result
}

const groupedClasses = computed(() => groupClasses(classes.value))

const openGroups = computed(() =>
  Object.entries(groupedClasses.value)
    .filter(([, cls]) => cls.length > 0)
    .map(([name]) => name),
)
</script>
