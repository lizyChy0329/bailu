import type { ComponentMeta } from '@/shared/types/component'
export const buttonMeta: ComponentMeta = {
  type: 'Button', label: '按钮', icon: 'pi pi-send',
  defaultProps: { label: '按钮', icon: '', severity: 'secondary', variant: 'outlined', unstyled: false },
  defaultStyles: { class: 'w-full' },
  propsPanel: [
    { key: 'label', label: '文本', control: 'text-input' },
    { key: 'icon', label: '图标类', control: 'text-input' },
    { key: 'severity', label: '类型', control: 'select', options: [{label:'次要',value:'secondary'},{label:'成功',value:'success'},{label:'信息',value:'info'},{label:'警告',value:'warning'},{label:'危险',value:'danger'},{label:'高对比',value:'contrast'}] },
    { key: 'variant', label: '变体', control: 'select', options: [{label:'描边',value:'outlined'},{label:'文本',value:'text'},{label:'链接',value:'link'}] },
    { key: 'unstyled', label: '移除默认样式', control: 'switch' },
  ],
  panelSections: [
    { title: '基本', controls: [
      { key: 'label', label: '文本', control: 'text-input' },
      { key: 'icon', label: '图标类', control: 'text-input' },
      { key: 'severity', label: '类型', control: 'select', options: [{label:'次要',value:'secondary'},{label:'成功',value:'success'},{label:'信息',value:'info'},{label:'警告',value:'warning'},{label:'危险',value:'danger'},{label:'高对比',value:'contrast'}] },
      { key: 'variant', label: '变体', control: 'select', options: [{label:'描边',value:'outlined'},{label:'文本',value:'text'},{label:'链接',value:'link'}] },
    ]},
    { controls: [{ key: 'unstyled', label: '移除默认样式', control: 'switch' }] },
  ],
  ptNodes: [
    { name: 'root', label: '容器' },
    { name: 'label', label: '标签文本' },
  ],
}
