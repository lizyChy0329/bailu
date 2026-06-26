import type { ComponentMeta, ComponentType } from '@/shared/types/component'
import { cardMeta } from './card'
import { imageMeta } from './image'
import { buttonMeta } from './button'
import { panelMeta } from './panel'
import { scrollPanelMeta } from './scroll-panel'
import { pageMeta } from './page'
import { backgroundContainerMeta } from './background-container'
import { headingMeta } from './heading'
import { paragraphMeta } from './paragraph'
import { textMeta } from './text'

const registry = new Map<ComponentType, ComponentMeta>()

function register(meta: ComponentMeta) {
  registry.set(meta.type, meta)
}

register(cardMeta)
register(imageMeta)
register(buttonMeta)
register(panelMeta)
register(scrollPanelMeta)
register(pageMeta)
register(backgroundContainerMeta)
register(headingMeta)
register(paragraphMeta)
register(textMeta)

export function getComponentMeta(type: ComponentType): ComponentMeta | undefined {
  return registry.get(type)
}

const PALETTE_EXCLUDE = new Set<ComponentType>(['Page'])

export function getAllComponentMetas(): ComponentMeta[] {
  return Array.from(registry.values()).filter(m => !PALETTE_EXCLUDE.has(m.type))
}

export interface PlaceholderEntry {
  type: string
  label: string
  icon: string
}

export const placeholderComponents: PlaceholderEntry[] = [
  { type: 'RichText', label: 'RichText', icon: 'pi pi-align-left' },
  { type: 'Link', label: 'Link', icon: 'pi pi-link' },
  { type: 'List', label: 'List', icon: 'pi pi-list' },
  { type: 'Divider', label: 'Divider', icon: 'pi pi-minus' },
]

export default registry
