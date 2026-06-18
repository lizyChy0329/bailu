import type { ComponentMeta } from '@/shared/types/component'

export const imageMeta: ComponentMeta = {
  type: 'Image',
  label: '图片',
  icon: 'pi pi-image',
  defaultProps: {
    src: 'https://picsum.photos/200/300',
    preview: false,
    indicatorIcon: '',
    previewIcon: '',
    zoomInDisabled: false,
    zoomOutDisabled: false,
  },
  defaultStyles: {
    class: '',
  },
  propsPanel: [
    { key: 'src', label: '图片地址', control: 'text-input' },
    { key: 'preview', label: '开启预览', control: 'switch' },
    { key: 'indicatorIcon', label: '指示图标', control: 'text-input' },
    { key: 'previewIcon', label: '预览图标', control: 'text-input' },
    { key: 'zoomInDisabled', label: '禁止放大', control: 'switch' },
    { key: 'zoomOutDisabled', label: '禁止缩小', control: 'switch' },
  ],
  slots: [
    { name: 'image', label: '缩略图模板', allowsChildren: true },
    { name: 'preview', label: '大图模板', allowsChildren: true },
    { name: 'previewicon', label: '预览图标', allowsChildren: true },
  ],
  ptNodes: [
    { name: 'root', label: '容器' },
    { name: 'previewButton', label: '预览按钮' },
  ],
}
