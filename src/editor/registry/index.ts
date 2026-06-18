import type { ComponentMeta, ComponentType } from '@/shared/types/component'
import { cardMeta } from './card'
import { imageMeta } from './image'
import { buttonMeta } from './button'
import { panelMeta } from './panel'
import { scrollPanelMeta } from './scroll-panel'

const registry = new Map<ComponentType, ComponentMeta>()

function register(meta: ComponentMeta) {
  registry.set(meta.type, meta)
}

register(cardMeta)
register(imageMeta)
register(buttonMeta)
register(panelMeta)
register(scrollPanelMeta)

export function getComponentMeta(type: ComponentType): ComponentMeta | undefined {
  return registry.get(type)
}

export function getAllComponentMetas(): ComponentMeta[] {
  return Array.from(registry.values())
}

export default registry
