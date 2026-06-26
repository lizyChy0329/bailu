import type { ComponentMeta } from '@/shared/types/component'

export const textMeta: ComponentMeta = {
  type: 'Text',
  label: 'Text',
  icon: 'pi pi-pencil',
  defaultProps: { text: '文字内容', tag: 'span' },
  defaultStyles: { classes: [], style: {}, groupRefs: [] },
  panelSections: [
    {
      title: 'General',
      controls: [
        {
          key: 'text',
          label: 'Text',
          control: 'text-input',
          defaultValue: '文字内容',
        },
        {
          key: 'tag',
          label: 'HTML Tag',
          control: 'select',
          options: [
            { label: 'span', value: 'span' },
            { label: 'p', value: 'p' },
            { label: 'label', value: 'label' },
          ],
          defaultValue: 'span',
        },
      ],
    },
  ],
}