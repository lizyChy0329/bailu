import type { ComponentMeta } from '@/shared/types/component'

export const paragraphMeta: ComponentMeta = {
  type: 'Paragraph',
  label: 'Paragraph',
  icon: 'pi pi-paragraph',
  defaultProps: { text: '段落内容' },
  defaultStyles: { classes: [], style: {}, groupRefs: [] },
  panelSections: [
    {
      title: 'General',
      controls: [
        {
          key: 'text',
          label: 'Text',
          control: 'text-input',
          defaultValue: '段落内容',
        },
        {
          key: 'align',
          label: 'Align',
          control: 'select',
          options: [
            { label: 'Left', value: 'text-left' },
            { label: 'Center', value: 'text-center' },
            { label: 'Right', value: 'text-right' },
          ],
          defaultValue: 'text-left',
        },
      ],
    },
  ],
}