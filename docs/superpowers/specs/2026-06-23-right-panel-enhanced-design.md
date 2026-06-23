# Right Panel Enhancement — Property Panel Layout for Slot-driven Components

## Summary

Redesign right panel to better accommodate PrimeVue's slot-driven components (Card as first citizen). Add "slots" as 4th tab, replace PT raw Textarea with a dual-mode Dialog editor (structured + Monaco), add "advanced" section for `dt` / `ptOptions` with per-field tooltips and Dialog editors.

## RightPanel — 4 tabs

| Tab | Key | Component | Content |
|-----|-----|-----------|---------|
| 属性 | `props` | `PropsPanel` | Prop sections + PT覆写 button + 高级 section |
| 插槽 | `slots` | `SlotsPanel` | Slot list + visibility toggle + filled/empty visual |
| 样式 | `styles` | `StylesPanel` | Tailwind class textarea (unchanged) |
| 事件 | `events` | `EventsPanel` | Placeholder (unchanged) |

## PropsPanel — Accordion structure

```
Accordion (multiple, all expanded)
├── basic sections           ← meta.panelSections, titled → AccordionPanel
│   ├── control per PropDef  ← text-input / select / switch
│   └── ...
│
├── PT 覆写 (hardcoded)
│   └── [📝 编辑 PT 覆写] Button
│       → opens PtEditor Dialog
│
├── 高级 (hardcoded, all components)
│   ├── dt
│   │   ├── [📝 配置 DT] Button
│   │   │   → opens Monaco Dialog (dt JSON)
│   │   └── ℹ️ Tooltip: "传入 design token 对象，生成 --p-* CSS 变量"
│   │
│   └── ptOptions
│       ├── [📝 配置 ptOptions] Button
│       │   → opens ptOptions Dialog (mergeMode select + mergeSections switch)
│       └── ℹ️ Tooltip: "PT 合并选项配置"
│
└── inline controls          ← meta.panelSections, untitled → inline below accordion
```

## PtEditor Dialog — Dual-mode PT editor

```
Dialog: "PT 覆写 — {componentLabel}"
├── SelectButton: [🔧 结构化] [📝 原始 JSON]
│
├── Structured mode
│   └── Accordion — dynamically renders meta.ptNodes[]
│       └── AccordionPanel × N
│           ├── AccordionHeader: node.label
│           └── AccordionContent:
│               └── class: [InputText]
│               ← reads/writes draft[nodeName].class
│
├── Monaco mode
│   └── CodeEditor.vue (Monaco wrapper)
│       ├── language: json
│       ├── theme: GitHub light (defineTheme)
│       ├── lineNumbers: 'on'
│       ├── minimap: false
│       ├── wordWrap: 'on'
│       ├── automaticLayout: true
│       └── scrollBeyondLastLine: false
│
└── Footer: [取消] [保存]
    ← Cancel discards draft, Save writes back to node.pt
```

### Data flow

| Action | Behavior |
|--------|----------|
| Open Dialog | `draft = structuredClone(node.pt ?? {})` |
| Structured edit | writes `draft[nodeName].class` |
| Switch → Monaco | `text = JSON.stringify(draft, null, 2)` |
| Switch → Structured | `draft = JSON.parse(text)` (with validation) |
| Cancel | discard draft, close |
| Save | `node.pt = draft`, close |

## DT Dialog — Monaco editor

```
Dialog: "DT 覆写 — {componentLabel}"
├── CodeEditor.vue (Monaco wrapper, same config)
├── ℹ️ Tooltip below editor: "设计 token 对象，生成 --p-* CSS 变量"
└── Footer: [取消] [保存]
```

## ptOptions Dialog — Form

```
Dialog: "PT 选项 — {componentLabel}"
├── mergeMode
│   ├── [Select] options: deep / replace
│   └── ℹ️ Tooltip: "deep: 深度合并; replace: 替换式覆盖"
├── mergeSections
│   ├── [ToggleSwitch]
│   └── ℹ️ Tooltip: "true: 合并 sections; false: 替换"
└── Footer: [取消] [保存]
```

## SlotsPanel — Simplified

Each slot entry:
- Icon + slot label (from `meta.slots[]`)
- Visibility ToggleSwitch (writes to `node.slotVisibility[slotName]`)
- Visual: children.length > 0 → normal color, empty → gray/50 opacity
- Strict order = `meta.slots[]` definition
- No child listing, no drag-drop, no remove

```
┌─ Slots ──────────────────────────┐
│  header                    [🔛]  │  ← normal if filled
│  title                     [🔛]  │  ← gray if empty
│  subtitle                  [🔛]  │  ← gray if empty
│  content                   [🔛]  │  ← normal if filled
│  footer                    [🔛]  │  ← gray if empty
└────────────────────────────────────┘
```

## Component changes

| File | Action |
|------|--------|
| `src/editor/panels/CodeEditor.vue` | **Create** — Monaco wrapper |
| `src/editor/panels/PtEditor.vue` | **Create** — Dual-mode PT Dialog |
| `src/editor/panels/PropsPanel.vue` | Remove `__slots` accordion, replace PT Textarea with button, add 高级 section |
| `src/editor/panels/SlotsPanel.vue` | **Rewrite** — Simple slot list + toggle |
| `src/editor/layout/RightPanel.vue` | Add 4th tab "slots", render SlotsPanel |
| `src/editor/registry/card.ts` | Upgrade `propsPanel` → `panelSections` |

## Monaco Setup

- Dynamic import via `import('monaco-editor')` — not bundled in critical path
- Custom theme "github" defined via `monaco.editor.defineTheme` matching GitHub light background
- Editor instance created in `onMounted`, disposed in `onBeforeUnmount`
- Exposes `modelValue` / `@update:modelValue` for v-model

## Tooltip

- Use PrimeVue `v-tooltip` directive
- Import: `import Tooltip from 'primevue/tooltip'`
- Register in component `directives: { tooltip: Tooltip }`
- ℹ️ icon with `v-tooltip="'help text'"` and `class="pi pi-info-circle text-xs cursor-help"`
