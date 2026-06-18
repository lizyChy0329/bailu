import type { ComponentNode } from './component'

export interface SiteConfig {
  id: string
  title: string
  components: ComponentNode[]
  createdAt: number
  updatedAt: number
}
