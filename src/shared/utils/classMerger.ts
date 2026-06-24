import { twMerge } from 'tailwind-merge'
import type { ComponentNode } from '@/shared/types/component'
import type { SiteConfig } from '@/shared/types/site'

export function computeFinalClasses(node: ComponentNode, site?: SiteConfig | null): string {
  const classes = node.styles?.classes ?? []
  const groupRefs = node.styles?.groupRefs ?? []

  const presetClasses = groupRefs.flatMap((id) => {
    if (!site?.groupClassPresets) return []
    const preset = site.groupClassPresets.find((p) => p.id === id)
    return preset?.classes ?? []
  })

  const all = [...classes, ...presetClasses]
  return twMerge(all.join(' '))
}
