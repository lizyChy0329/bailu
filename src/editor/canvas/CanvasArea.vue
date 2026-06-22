<template>
  <div ref="canvasRef"
    class="min-h-[600px] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 relative select-none"
    :class="dropZone ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900'"
    @dragover.prevent="onDragOver" @drop.prevent="onDrop" @dragleave="onDragLeave">
    <div v-if="rootComponents.length===0" class="text-center py-20 text-gray-400 text-sm pointer-events-none">从左侧拖拽组件到此处</div>
    <VueDraggable v-if="siteStore.currentSite" v-model="rootComponents"
      :animation="200" handle=".drag-handle" ghost-class="opacity-30" class="space-y-3">
      <div v-for="comp in rootComponents" :key="comp.id"
        :ref="(el:any)=>setComponentRef(comp.id,el as HTMLElement)" :data-component-id="comp.id"
        class="relative group border-2 rounded-lg cursor-pointer"
        :class="siteStore.selectedComponentId===comp.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
        @click.stop="siteStore.selectComponent(comp.id)"
        @contextmenu.prevent.stop="onContextMenu(comp.id,$event)">
        <i class="drag-handle absolute -top-3 -right-3 z-20 text-blue-500 cursor-grab active:cursor-grabbing pi pi-arrows-alt opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-900 rounded-full p-0.5 shadow-sm border" />
        <Tag :value="getComponentLabel(comp.type)" severity="info"
          class="absolute -top-3 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div class="p-2 pointer-events-none"><Renderer :dsl="[comp]" /></div>
        <div v-if="comp.slots && comp.type !== 'Card'" class="px-2 pb-2 space-y-2">
          <div v-for="(children,sn) in comp.slots" :key="sn">
            <div v-if="children.length===0 && comp.slotVisibility?.[sn]"
              class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-4 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 pointer-events-none select-none">
              <i class="pi pi-folder-open mr-1"/>{{sn}} 插槽 — 从左侧拖入组件</div>
          </div>
        </div>
      </div>
    </VueDraggable>
    <div v-if="dropZone"
      class="absolute left-0 right-0 z-20 pointer-events-none flex items-center drop-indicator"
      :style="{top:dropZone.y+'px'}"><div class="h-0.5 bg-blue-500 flex-1"/><div class="w-2 h-2 bg-blue-500 rounded-full -ml-1"/></div>
  </div>
  <ContextMenu ref="contextMenuRef" :model="contextMenuItems"/>
</template>
<script setup lang="ts">
import { ref,computed,watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useSiteStore } from '@/stores/site.store'
import { getComponentMeta } from '@/editor/registry'
import type { ComponentNode,ComponentType } from '@/shared/types/component'
import Tag from 'primevue/tag'; import ContextMenu from 'primevue/contextmenu'; import Renderer from '@/renderer/core/Renderer.vue'
const siteStore=useSiteStore()
const canvasRef=ref<HTMLElement|null>(null); const componentEls=new Map<string,HTMLElement>()
const dropZone=ref<{parentId:string;slotName:string;index:number;y:number}|null>(null)
const renderKey=ref(0)
watch(()=>siteStore.selectedComponent?.props,()=>{renderKey.value++},{deep:true})
const rootComponents=computed({get:()=>{renderKey.value;return siteStore.currentSite?.components??[]},set:(v)=>{if(siteStore.currentSite)siteStore.currentSite.components=v}})
function setComponentRef(id:string,el:HTMLElement|null){if(el)componentEls.set(id,el);else componentEls.delete(id)}
function getComponentLabel(t:ComponentType):string{return getComponentMeta(t)?.label??t}
const contextMenuRef=ref<any>(null); const contextTarget=ref<string|null>(null)
const contextMenuItems=ref([{label:'删除',icon:'pi pi-trash',command:()=>{if(contextTarget.value){siteStore.removeComponent(contextTarget.value);contextTarget.value=null}}},{separator:true},{label:'复制',icon:'pi pi-copy'}])
function onContextMenu(id:string,event:MouseEvent){siteStore.selectComponent(id);contextTarget.value=id;contextMenuRef.value?.show(event)}
function locate(my:number,children:ComponentNode[],parentId?:string,sn?:string):typeof dropZone.value|null{
  const p=parentId??'root',s=sn??'default';if(!canvasRef.value)return null
  if(children.length===0)return{parentId:p,slotName:s,index:0,y:0}
  const cr=canvasRef.value.getBoundingClientRect();let ni=0,nd=Infinity,nr:DOMRect|null=null
  for(let i=0;i<children.length;i++){const el=componentEls.get(children[i].id);if(!el)continue;const r=el.getBoundingClientRect(),t=r.top-cr.top,d=Math.abs(my-(t+(r.bottom-cr.top-t))/2);if(d<nd){nd=d;ni=i;nr=r}}
  if(!nr)return null;const rt=nr.top-cr.top,rh=nr.height,rm=my-rt,af=rm>rh/2,nc=children[ni],m=getComponentMeta(nc.type)
  if(m?.slots&&m.slots.length>0&&rm>rh*0.2&&rm<rh*0.8){const ms=(m.slots.find(s=>s.name==='content'||s.name==='default')??m.slots[0]).name;return locate(my,nc.slots?.[ms]??[],nc.id,ms)}
  const idx=af?ni+1:ni;const y=af?nr.bottom-cr.top:nr.top-cr.top;return{parentId:p,slotName:s,index:idx,y}
}
function onDragOver(e:DragEvent){if(!e.dataTransfer?.types.includes('component-type')||!canvasRef.value)return;e.dataTransfer.dropEffect='copy';dropZone.value=locate(e.clientY-canvasRef.value.getBoundingClientRect().top,rootComponents.value)}
function onDragLeave(e:DragEvent){if(canvasRef.value&&!canvasRef.value.contains(e.relatedTarget as Node))dropZone.value=null}
function onDrop(e:DragEvent){const t=e.dataTransfer?.getData('component-type')as ComponentType|undefined;if(!t||!dropZone.value){dropZone.value=null;return};const{parentId,slotName,index}=dropZone.value;siteStore.addComponent(t,parentId,slotName,index);dropZone.value=null}
</script>
<style scoped>.drop-indicator{transition:top .05s ease}</style>
