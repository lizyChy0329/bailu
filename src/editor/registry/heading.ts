import type { ComponentMeta } from '@/shared/types/component'

const alignControl = {
  key: 'align',
  label: 'Align',
  control: 'select' as const,
  options: [
    { label: 'Left', value: 'text-left' },
    { label: 'Center', value: 'text-center' },
    { label: 'Right', value: 'text-right' },
  ],
  defaultValue: 'text-center',
}

export const headingMeta: ComponentMeta = {
  type: 'Heading',
  label: 'Heading',
  icon: 'pi pi-heading',
  defaultProps: { level: 'h2', text: '标题' },
  defaultStyles: { classes: ['font-bold'], style: {}, groupRefs: [] },
  panelSections: [
    {
      title: 'General',
      controls: [
        {
          key: 'level',
          label: 'Level',
          control: 'select',
          options: [
            { label: 'H1', value: 'h1' },
            { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' },
            { label: 'H4', value: 'h4' },
            { label: 'H5', value: 'h5' },
            { label: 'H6', value: 'h6' },
          ],
          defaultValue: 'h2',
        },
        {
          key: 'text',
          label: 'Text',
          control: 'text-input',
          defaultValue: '标题',
        },
        alignControl,
      ],
    },
  ],
}