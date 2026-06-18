import type { ComponentMeta } from '@/shared/types/component'

export const panelMeta: ComponentMeta = {
  type: 'Panel',
  label: '折叠面板',
  icon: 'pi pi-th-large',
  defaultProps: {
    header: '面板标题',
    toggleable: true,
    collapsed: false,
    unstyled: false,
  },
  defaultStyles: {
    class: 'w-full',
  },
  propsPanel: [
    { key: 'header', label: '标题', control: 'text-input' },
    { key: 'toggleable', label: '可折叠', control: 'switch' },
    { key: 'unstyled', label: '移除默认样式', control: 'switch' },
  ],
  slots: [
    { name: 'header', label: '标题区域', allowsChildren: true },
    { name: 'default', label: '内容区域', allowsChildren: true },
    { name: 'footer', label: '底部', allowsChildren: true },
    { name: 'icons', label: '图标', allowsChildren: true },
  ],
  ptNodes: [
    { name: 'root', label: '容器' },
    { name: 'header', label: '标题栏' },
    { name: 'content', label: '内容区' },
    { name: 'toggler', label: '折叠按钮' },
  ],
}
