import type { ComponentNode, GroupClassPreset } from './component'

export interface SiteConfig {
  id: string
  title: string
  page: ComponentNode
  createdAt: number
  updatedAt: number
  groupClassPresets: GroupClassPreset[]
}
