import type { ComponentMeta } from '@/shared/types/component'

export const pageMeta: ComponentMeta = {
  type: 'Page',
  label: '页面',
  icon: 'pi pi-sitemap',
  defaultProps: {
    backgroundImage: '',
  },
  defaultStyles: {
    classes: ['min-h-screen', 'w-full'],
    style: {},
    groupRefs: [],
  },
  panelSections: [
    {
      title: '背景',
      controls: [
        { key: 'backgroundImage', label: '背景图片 URL', control: 'text-input' },
      ],
    },
  ],
  slots: [
    { name: 'default', label: '内容区域', allowsChildren: true },
  ],
}
