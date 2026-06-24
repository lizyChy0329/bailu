import type { ComponentMeta } from '@/shared/types/component'

export const scrollPanelMeta: ComponentMeta = {
  type: 'ScrollPanel',
  label: 'ScrollPanel',
  icon: 'pi pi-window-maximize',
  defaultProps: {
    unstyled: false,
  },
  defaultStyles: {
    classes: ['w-full', 'h-48'],
    style: {},
    groupRefs: [],
  },
  panelSections: [
    {
      title: 'General',
      controls: [
        { key: 'unstyled', label: 'unstyled', control: 'switch' },
      ],
    },
  ],
  ptNodes: [
    {
      name: 'root', label: 'root',
      children: [
        {
          name: 'contentContainer', label: 'contentContainer',
          children: [
            { name: 'content', label: 'content' },
          ],
        },
        { name: 'barX', label: 'barX' },
        { name: 'barY', label: 'barY' },
      ],
    },
  ],
}
