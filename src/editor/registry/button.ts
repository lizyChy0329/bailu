import type { ComponentMeta } from '@/shared/types/component'

export const buttonMeta: ComponentMeta = {
  type: 'Button',
  label: '按钮',
  icon: 'pi pi-send',
  defaultProps: {
    label: '按钮',
    icon: '',
    severity: 'secondary',
    variant: 'outlined',
  },
  defaultStyles: {
    class: 'w-full',
  },
  propsPanel: [
    { key: 'label', label: '文本', control: 'text-input' },
    { key: 'icon', label: '图标类', control: 'text-input' },
    {
      key: 'severity',
      label: '样式',
      control: 'select',
      options: [
        { label: '次要', value: 'secondary' },
        { label: '成功', value: 'success' },
        { label: '信息', value: 'info' },
        { label: '警告', value: 'warning' },
        { label: '危险', value: 'danger' },
      ],
    },
    {
      key: 'variant',
      label: '变体',
      control: 'select',
      options: [
        { label: '默认', value: undefined },
        { label: '文本', value: 'text' },
        { label: '轮廓', value: 'outlined' },
        { label: '链接', value: 'link' },
      ],
    },
  ],
  ptNodes: [
    { name: 'root', label: '容器' },
    { name: 'label', label: '标签文本' },
  ],
}
