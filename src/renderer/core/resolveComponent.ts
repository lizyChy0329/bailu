import CardRenderer from '@/renderer/components/CardRenderer.vue'
import ImageRenderer from '@/renderer/components/ImageRenderer.vue'
import ButtonRenderer from '@/renderer/components/ButtonRenderer.vue'
import PanelRenderer from '@/renderer/components/PanelRenderer.vue'
import ScrollPanelRenderer from '@/renderer/components/ScrollPanelRenderer.vue'
import PageRenderer from '@/renderer/components/PageRenderer.vue'
import BackgroundContainerRenderer from '@/renderer/components/BackgroundContainerRenderer.vue'
import HeadingRenderer from '@/renderer/components/HeadingRenderer.vue'
import ParagraphRenderer from '@/renderer/components/ParagraphRenderer.vue'
import TextRenderer from '@/renderer/components/TextRenderer.vue'
import type { ComponentType } from '@/shared/types/component'

const componentMap: Record<ComponentType, any> = {
  Card: CardRenderer,
  Image: ImageRenderer,
  Button: ButtonRenderer,
  Panel: PanelRenderer,
  ScrollPanel: ScrollPanelRenderer,
  Page: PageRenderer,
  BackgroundContainer: BackgroundContainerRenderer,
  Heading: HeadingRenderer,
  Paragraph: ParagraphRenderer,
  Text: TextRenderer,
}

export function resolveComponent(type: ComponentType): any {
  return componentMap[type] || null
}

export default componentMap
