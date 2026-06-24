import type { ComponentMeta } from '@/shared/types/component'
export const cardMeta: ComponentMeta = {
  type: 'Card', label: 'Card', icon: 'pi pi-id-card',
  defaultProps: { unstyled: false },
  defaultStyles: { classes: [], style: {}, groupRefs: [] },
  panelSections: [
    { title: 'General', controls: [
      { key: 'unstyled', label: 'unstyled', control: 'switch' },
    ]},
  ],
  slots: [
    { name: 'header', label: '顶部', allowsChildren: true },
    { name: 'title', label: '标题', allowsChildren: true },
    { name: 'subtitle', label: '副标题', allowsChildren: true },
    { name: 'content', label: '主内容', allowsChildren: true },
    { name: 'footer', label: '底部', allowsChildren: true },
  ],
  ptNodes: [
    {
      name: 'root', label: 'root',
      children: [
        { name: 'header', label: 'header' },
        {
          name: 'body', label: 'body',
          children: [
            {
              name: 'caption', label: 'caption',
              children: [
                { name: 'title', label: 'title' },
                { name: 'subtitle', label: 'subtitle' },
              ],
            },
            { name: 'content', label: 'content' },
            { name: 'footer', label: 'footer' },
          ],
        },
      ],
    },
  ],
  defaultChildren: { header: [], title: [], subtitle: [], content: [], footer: [] },
}
