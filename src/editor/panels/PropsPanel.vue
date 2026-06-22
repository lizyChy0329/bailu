<template>
  <div class="space-y-3">
    <Accordion :value="openKeys" multiple>
      <AccordionPanel v-for="s in titledSections" :key="s.title" :value="s.title">
        <AccordionHeader class="text-sm">{{s.title}}</AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-3 pt-2">
            <div v-for="c in s.controls" :key="c.key">
              <label class="text-xs text-gray-500 mb-1 block">{{c.label}}</label>
              <InputText v-if="c.control==='text-input'" :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key]=$event" fluid/>
              <InputNumber v-else-if="c.control==='number-input'" :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key]=$event" fluid/>
              <Select v-else-if="c.control==='select'" :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key]=$event" :options="c.options" option-label="label" option-value="value" fluid/>
              <div v-else-if="c.control==='switch'" class="flex items-center justify-between"><span class="text-xs text-gray-500">{{c.label}}</span><ToggleSwitch :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key]=$event"/></div>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="__slots">
        <AccordionHeader class="text-sm">插槽</AccordionHeader>
        <AccordionContent>
          <div v-for="s in slotList" :key="s.name" class="flex items-center justify-between pt-2">
            <span class="text-xs text-gray-500">{{s.label}}</span>
            <ToggleSwitch :model-value="comp!.slotVisibility?.[s.name]??false" @update:model-value="setSlotVis(s.name,$event)"/>
          </div>
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="__pt">
        <AccordionHeader class="text-sm">PT 覆写</AccordionHeader>
        <AccordionContent><Textarea :model-value="ptText" @update:model-value="setPT" auto-resize rows="4" placeholder='{"root":{"class":"..."}}' fluid/></AccordionContent>
      </AccordionPanel>
    </Accordion>
    <div v-if="inlineControls.length>0" class="flex flex-col gap-3">
      <div v-for="c in inlineControls" :key="c.key" class="flex items-center justify-between"><span class="text-xs text-gray-500">{{c.label}}</span><ToggleSwitch :model-value="comp!.props[c.key]" @update:model-value="comp!.props[c.key]=$event"/></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { PropDef } from '@/shared/types/component'
import InputText from 'primevue/inputtext'; import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'; import ToggleSwitch from 'primevue/toggleswitch'; import Textarea from 'primevue/textarea'
import Accordion from 'primevue/accordion'; import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'; import AccordionContent from 'primevue/accordioncontent'
const siteStore=useSiteStore()
const comp=computed(()=>siteStore.selectedComponent)
const meta=computed(()=>getComponentMeta(comp.value?.type??'')??null)
const sections=computed(()=>{if(meta.value?.panelSections)return meta.value.panelSections;if(meta.value?.propsPanel)return[{controls:meta.value.propsPanel}];return[]})
const titledSections=computed(()=>sections.value.filter(s=>s.title))
const inlineSections=computed(()=>sections.value.filter(s=>!s.title))
const openKeys=computed(()=>[...titledSections.value.map(s=>s.title!),'__slots','__pt'])
const inlineControls=computed(()=>{const r:PropDef[]=[];for(const s of inlineSections.value)r.push(...s.controls);return r})
const ptText=computed(()=>JSON.stringify(comp.value?.pt??{},null,2))
function setPT(v:string){if(comp.value){try{comp.value.pt=JSON.parse(v)}catch{}}}
const slotList=computed(()=>{
  if(!comp.value?.slots)return[]
  return Object.keys(comp.value.slots).map(n=>{const sm=meta.value?.slots?.find(s=>s.name===n);return{name:n,label:sm?.label??n}})
})
function setSlotVis(n:string,v:boolean){if(comp.value){if(!comp.value.slotVisibility)comp.value.slotVisibility={};comp.value.slotVisibility[n]=v}}
</script>
