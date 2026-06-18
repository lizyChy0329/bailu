export type ComponentType = 'Card' | 'Image' | 'Button' | 'Panel' | 'ScrollPanel'

export interface LayoutBox {
  width: string
  height: string
}

export interface CardProps {
  [key: string]: any
}

export interface ImageProps {
  src: string
  alt: string
  width: string
  preview: boolean
  [key: string]: any
}

export interface ButtonProps {
  label: string
  icon?: string
  severity?: 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'contrast'
  variant?: 'text' | 'outlined' | 'link'
  [key: string]: any
}

export interface PanelProps {
  header?: string
  toggleable: boolean
  collapsed: boolean
  [key: string]: any
}

export interface ScrollPanelProps {
  [key: string]: any
}

export interface PropEvent {
  type: string
  [key: string]: any
}

export interface ComponentNode {
  id: string
  type: ComponentType
  props: Record<string, any>
  styles: {
    class?: string
    style?: Record<string, string>
  }
  pt?: Record<string, any>
  events?: Record<string, PropEvent>
  slots?: Record<string, ComponentNode[]>
  /** 自由定位：根级组件的 X 坐标（px） */
  x?: number
  /** 自由定位：根级组件的 Y 坐标（px） */
  y?: number
  /** 自由定位：根级组件的宽度（px） */
  width?: number
  /** 自由定位：根级组件的高度（px） */
  height?: number
}

export interface PropDef {
  key: string
  label: string
  control: 'text-input' | 'switch' | 'select' | 'number-input'
  options?: { label: string; value: any }[]
  defaultValue?: any
}

export interface SlotMeta {
  name: string
  label: string
  allowsChildren: boolean
}

export interface PTNodeMeta {
  name: string
  label: string
}

export interface ComponentMeta {
  type: ComponentType
  label: string
  icon: string
  defaultProps: Record<string, any>
  defaultStyles: { class?: string; style?: Record<string, string> }
  propsPanel?: PropDef[]
  slots?: SlotMeta[]
  ptNodes?: PTNodeMeta[]
  defaultChildren?: Record<string, ComponentNode[]>
  /** 根级组件拖入 Canvas 时的默认宽度 */
  defaultWidth?: number
  /** 根级组件拖入 Canvas 时的默认高度 */
  defaultHeight?: number
}
