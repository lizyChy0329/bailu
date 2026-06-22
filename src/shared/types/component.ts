export type ComponentType = 'Card' | 'Image' | 'Button' | 'Panel' | 'ScrollPanel'
export interface LayoutBox { width: string; height: string }
export interface CardProps { [key: string]: any }
export interface ImageProps { src: string; alt: string; width: string; preview: boolean; [key: string]: any }
export interface ButtonProps { label: string; icon?: string; severity?: 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'contrast'; variant?: 'text' | 'outlined' | 'link'; [key: string]: any }
export interface PanelProps { header?: string; toggleable: boolean; collapsed: boolean; [key: string]: any }
export interface ScrollPanelProps { [key: string]: any }
export interface PropEvent { type: string; [key: string]: any }
export interface ComponentNode { id: string; type: ComponentType; props: Record<string, any>; styles: { class?: string; style?: Record<string, string> }; pt?: Record<string, any>; events?: Record<string, PropEvent>; slots?: Record<string, ComponentNode[]> }
export interface PropDef { key: string; label: string; control: 'text-input' | 'switch' | 'select' | 'number-input'; options?: { label: string; value: any }[]; defaultValue?: any }
export interface SlotMeta { name: string; label: string; allowsChildren: boolean }
export interface PTNodeMeta { name: string; label: string }
export interface PanelSection { title?: string; controls: PropDef[] }
export interface ComponentMeta { type: ComponentType; label: string; icon: string; defaultProps: Record<string, any>; defaultStyles: { class?: string; style?: Record<string, string> }; propsPanel?: PropDef[]; panelSections?: PanelSection[]; slots?: SlotMeta[]; ptNodes?: PTNodeMeta[]; defaultChildren?: Record<string, ComponentNode[]> }
