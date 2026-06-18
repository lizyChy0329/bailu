import type { ComponentMeta } from '@/shared/types/component'

export const scrollPanelMeta: ComponentMeta = {
  type: 'ScrollPanel',
  label: '滚动面板',
  icon: 'pi pi-window-maximize',
  defaultProps: {
    unstyled: false,
  },
  defaultStyles: {
    class: 'w-full h-48',
  },
  defaultWidth: 300,
  defaultHeight: 200,
  propsPanel: [
    { key: 'unstyled', label: '移除默认样式', control: 'switch' },
  ],
  ptNodes: [
    { name: 'root', label: '容器' },
    { name: 'content', label: '内容区' },
    { name: 'barX', label: '水平滚动条' },
    { name: 'barY', label: '垂直滚动条' },
  ],
}
