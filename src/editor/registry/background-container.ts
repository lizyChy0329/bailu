import type { ComponentMeta } from '@/shared/types/component'

export const backgroundContainerMeta: ComponentMeta = {
  type: 'BackgroundContainer',
  label: '背景容器',
  icon: 'pi pi-image',
  defaultProps: {
    backgroundImage: '',
  },
  defaultStyles: {
    classes: ['min-h-[200px]', 'w-full', 'rounded-lg'],
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
