import CardRenderer from '@/renderer/components/CardRenderer.vue'
import ImageRenderer from '@/renderer/components/ImageRenderer.vue'
import ButtonRenderer from '@/renderer/components/ButtonRenderer.vue'
import PanelRenderer from '@/renderer/components/PanelRenderer.vue'
import ScrollPanelRenderer from '@/renderer/components/ScrollPanelRenderer.vue'
import type { ComponentType } from '@/shared/types/component'

const componentMap: Record<ComponentType, any> = {
  Card: CardRenderer,
  Image: ImageRenderer,
  Button: ButtonRenderer,
  Panel: PanelRenderer,
  ScrollPanel: ScrollPanelRenderer,
}

export function resolveComponent(type: ComponentType): any {
  return componentMap[type] || null
}

export default componentMap
