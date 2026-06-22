# Bailu

## Stack
- Vue 3 + setup + TypeScript + Vite
- Pinia, Vue Router
- PrimeVue 4 (Aura theme, styled mode)
- Tailwind CSS (class dark mode)
- Dexie (IndexedDB), vue-draggable-plus

## CRITICAL — PrimeVue 组件规则
- MUST: 编写任何 PrimeVue 相关代码前，必须查阅 `docs/primevue-components.md` 找到所需组件
- MUST: 通过该文件的 [LLM] 链接（https://primevue.org/llms/components/{slug}.md）查看组件完整 API
- MUST: 组件 props 需与 PrimeVue 官方文档的 Properties 表严格对齐
- MUST: 所有编辑器 UI 按钮、输入框、开关、下拉框均使用 PrimeVue 组件
- MUST: PrimeVue 组件使用手动 import，不得使用 auto-import

## Commands
- `vp run dev` — start dev server
- `npm run build` — type check + build
- `npm run test` — vitest run
- `npm run test:watch` — vitest watch mode

## Architecture
- Editor / Renderer / Shared layers
- Editor: SitesView → EditView (EditorShell: LeftPanel + CanvasArea + RightPanel)
- Renderer: Renderer.vue → wrapper components (CardRenderer, etc.) → PrimeVue
- 5-panel DSL: props / styles / pt / events / slots

## Key Files
- `src/shared/types/component.ts` — ComponentNode, ComponentMeta
- `src/editor/registry/` — component meta registration
- `docs/primevue-components.md` — PrimeVue 组件索引与 LLM 文档链接
- `src/renderer/core/Renderer.vue` — generic DSL renderer
- `src/renderer/components/` — per-component wrapper renderers
- `src/stores/site.store.ts` — site + component state management
- `src/db/index.ts` — Dexie CRUD

## Known Traps
- `require()` is NOT available — ESM imports only
- PrimeVue components must be manually imported, NOT auto-imported
- `darkModeSelector: '.dark'` in PrimeVue config — must match Tailwind's `darkMode: 'class'`
- `toRaw()` + `structuredClone()` for Dexie saves (never pass reactive proxies directly)
- apply_patch file updates may fail — delete + recreate as workaround
- shell (`zsh`) may be intermittently unavailable in sandbox

## Agent skills

### Issue tracker

Issues 和 PRDs 以本地 markdown 文件存放在 `.scratch/` 目录下。详见 `docs/agents/issue-tracker.md`。

### Triage labels

使用默认标签（needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix）。详见 `docs/agents/triage-labels.md`。

### Domain docs

Single-context：一份 CONTEXT.md 在 repo 根目录。详见 `docs/agents/domain.md`。

## ADRs
- See `docs/adr/` directory

// 300x200, 深色背景浅色文字
'src': 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22200%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%232d3748%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23ffffff%22%20font-family%3D%22sans-serif%22%20font-size%3D%2222%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22central%22%3E300%20x%20200%3C%2Ftext%3E%3C%2Fsvg%3E'
```

## Image Placeholder

默认使用 `https://z.wiki/placeholder/` 作为测试占位图（国内服务，极速响应）。

```html
<!-- 基础占位 -->
<img src="https://z.wiki/placeholder/300x200" />

<!-- 带边框 + 叉号 + 自定义文案 -->
<img src="https://z.wiki/placeholder/300x200+border+cross?text=300%C3%97200" />

<!-- 自定义颜色 -->
<img src="https://z.wiki/placeholder/300x200?text=Demo&color=white&bgColor=%232d3748" />
```

参数：`+border` 边框 / `+cross` 叉号 / `?text=` 文案 / `&color=` 文字色 / `&bgColor=` 背景色

备用服务：`https://placeholder.com/` / `https://dummyimage.com/` / `https://fakeimg.pl/` / `https://picsum.photos/`
