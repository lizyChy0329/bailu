import type { ComponentMeta } from '@/shared/types/component'

export const panelMeta: ComponentMeta = {
  type: 'Panel',
  label: 'Panel',
  icon: 'pi pi-th-large',
  defaultProps: {
    header: '面板标题',
    toggleable: true,
    collapsed: false,
    unstyled: false,
  },
  defaultStyles: {
    classes: ['w-full'],
    style: {},
    groupRefs: [],
  },
  panelSections: [
    {
      title: 'General',
      controls: [
        { key: 'header', label: 'header', control: 'text-input' },
        { key: 'toggleable', label: 'toggleable', control: 'switch' },
        { key: 'unstyled', label: 'unstyled', control: 'switch' },
      ],
    },
  ],
  slots: [
    { name: 'header', label: '标题区域', allowsChildren: true },
    { name: 'default', label: '内容区域', allowsChildren: true },
    { name: 'footer', label: '底部', allowsChildren: true },
    { name: 'icons', label: '图标', allowsChildren: true },
  ],
  ptNodes: [
    {
      name: 'root', label: 'root',
      children: [
        {
          name: 'header', label: 'header',
          children: [
            { name: 'title', label: 'title' },
            {
              name: 'headerActions', label: 'headerActions',
              children: [
                { name: 'pcToggleButton', label: 'pcToggleButton' },
              ],
            },
          ],
        },
        {
          name: 'contentContainer', label: 'contentContainer',
          children: [
            { name: 'content', label: 'content' },
          ],
        },
        { name: 'footer', label: 'footer' },
      ],
    },
  ],
}
