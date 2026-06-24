import type { ComponentMeta } from '@/shared/types/component'

export const imageMeta: ComponentMeta = {
  type: 'Image',
  label: 'Image',
  icon: 'pi pi-image',
  defaultProps: {
    src: 'https://z.wiki/placeholder/300x200+border+cross?text=300%C3%97200',
    unstyled: false,
  },
  defaultStyles: { classes: [], style: {}, groupRefs: [] },
  panelSections: [
    {
      title: 'General',
      controls: [
        { key: 'src', label: 'src', control: 'text-input' },
        { key: 'unstyled', label: 'unstyled', control: 'switch' },
      ],
    },
  ],
  ptNodes: [
    {
      name: 'root', label: 'root',
      children: [
        { name: 'image', label: 'image' },
        { name: 'previewMask', label: 'previewMask' },
      ],
    },
  ],
}
