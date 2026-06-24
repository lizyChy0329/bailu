export type ComponentType = 'Card' | 'Image' | 'Button' | 'Panel' | 'ScrollPanel'
export interface LayoutBox { width: string; height: string }
export interface CardProps { [key: string]: unknown }
export interface ImageProps { src: string; alt: string; width: string; preview: boolean; [key: string]: unknown }
export interface ButtonProps { label: string; icon?: string; severity?: 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'contrast'; variant?: 'text' | 'outlined' | 'link'; [key: string]: unknown }
export interface PanelProps { header?: string; toggleable: boolean; collapsed: boolean; [key: string]: unknown }
export interface ScrollPanelProps { [key: string]: unknown }
export interface PropEvent { type: string; [key: string]: unknown }

// 样式接口：改为数组 + groupRefs
export interface ComponentStyles {
  classes: string[]
  style?: Record<string, string>
  groupRefs: string[]
}

// pt 节点支持 class（兼容）和 classes（新）
export interface PTNode {
  class?: string
  classes?: string[]
  style?: Record<string, string>
}

export interface ComponentNode {
  id: string
  type: ComponentType
  props: Record<string, unknown>
  styles: ComponentStyles
  pt?: Record<string, PTNode>
  events?: Record<string, PropEvent>
  slots?: Record<string, ComponentNode[]>
  slotVisibility?: Record<string, boolean>
}

export interface PropDef {
  key: string
  label: string
  control: 'text-input' | 'switch' | 'select' | 'number-input'
  options?: { label: string; value: unknown }[]
  defaultValue?: unknown
}
export interface SlotMeta{name:string;label:string;allowsChildren:boolean}
export interface PTNodeMeta{name:string;label:string;children?:PTNodeMeta[]}
export interface PanelSection{title?:string;controls:PropDef[]}

// 分组类预设
export interface GroupClassPreset {
  id: string
  name: string
  description?: string
  classes: string[]
}

export interface ComponentMeta {
  type: ComponentType
  label: string
  icon: string
  defaultProps: Record<string, unknown>
  defaultStyles: ComponentStyles
  propsPanel?: PropDef[]
  panelSections?: PanelSection[]
  slots?: SlotMeta[]
  ptNodes?: PTNodeMeta[]
  defaultChildren?: Record<string, ComponentNode[]>
}
