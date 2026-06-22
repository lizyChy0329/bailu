import type { ComponentMeta } from '@/shared/types/component'
export const cardMeta: ComponentMeta = {
  type: 'Card', label: '卡片', icon: 'pi pi-id-card',
  defaultProps: { unstyled: false },
  defaultStyles: { class: '' },
  propsPanel: [{ key: 'unstyled', label: '移除默认样式', control: 'switch' }],
  slots: [
    { name: 'header', label: '顶部', allowsChildren: true },
    { name: 'title', label: '标题', allowsChildren: true },
    { name: 'subtitle', label: '副标题', allowsChildren: true },
    { name: 'content', label: '主内容', allowsChildren: true },
    { name: 'footer', label: '底部', allowsChildren: true },
  ],
  ptNodes: [
    { name: 'root', label: '容器' }, { name: 'header', label: '顶部' },
    { name: 'body', label: '主体' }, { name: 'content', label: '内容' },
    { name: 'title', label: '标题' }, { name: 'subtitle', label: '副标题' },
    { name: 'footer', label: '底部' },
  ],
  defaultChildren: { header: [], title: [], subtitle: [], content: [], footer: [] },
}
