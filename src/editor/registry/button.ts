import type { ComponentMeta } from '@/shared/types/component'
export const buttonMeta: ComponentMeta = {
  type: 'Button', label: 'Button', icon: 'pi pi-send',
  defaultProps: { label: '按钮', icon: '', severity: 'secondary', variant: 'outlined', unstyled: false },
  defaultStyles: { classes: ['w-full'], style: {}, groupRefs: [] },
  panelSections: [
    {
      title: 'General',
      controls: [
        { key: 'label', label: 'label', control: 'text-input' },
        { key: 'icon', label: 'icon', control: 'text-input' },
        { key: 'severity', label: 'severity', control: 'select', options: [{label:'secondary',value:'secondary'},{label:'success',value:'success'},{label:'info',value:'info'},{label:'warning',value:'warning'},{label:'danger',value:'danger'},{label:'contrast',value:'contrast'}] },
        { key: 'variant', label: 'variant', control: 'select', options: [{label:'outlined',value:'outlined'},{label:'text',value:'text'},{label:'link',value:'link'}] },
        { key: 'unstyled', label: 'unstyled', control: 'switch' },
      ],
    },
  ],
  ptNodes: [
    {
      name: 'root', label: 'root',
      children: [
        { name: 'loadingIcon', label: 'loadingIcon' },
        { name: 'icon', label: 'icon' },
        { name: 'label', label: 'label' },
        { name: 'pcBadge', label: 'pcBadge' },
      ],
    },
  ],
}
