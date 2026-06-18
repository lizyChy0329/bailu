# Bailu v1 — Lowcode Engine PRD

## Problem Statement

运营团队需要快速搭建表单和营销页面（如活动推广页、用户调查表），但目前每次都要依赖研发团队从头开发。研发的人力瓶颈导致活动上线周期长、试错成本高。需要一个可供运营自行拖拽搭建页面的工具，降低对研发的依赖。

## Solution

Bailu 是一个纯前端低代码引擎，运营在一个可视化编辑器中拖拽 PrimeVue 组件（Card/Image/Button/Panel/ScrollPanel），实时预览 PC/平板/移动三端效果，通过 5 面板属性系统完成配置，最终导出 JSON 配置文件发布到线上。

v1 的核心路径：从零 → 新建 Site → 拖拽编排 → 属性配置 → 保存草稿 → JSON 导出 → 离线渲染验证。

## User Stories

1. As a 运营人员, I want to 进入后看到 Site 列表页, so that 我知道我创建了哪些页面
2. As a 运营人员, I want to 一键新建 Site 并进入编辑器, so that 我不需要填表单，直接开始搭建
3. As a 运营人员, I want to 从左侧面板拖出组件到画布, so that 页面内容可视化的组装出来
4. As a 运营人员, I want to 组件在画布上网格吸附排列, so that 页面看起来整齐不乱
5. As a 运营人员, I want to 拖拽调整组件的上下顺序, so that 我可以控制页面内容的前后关系
6. As a 运营人员, I want to 点击画布上的组件后弹出右侧属性面板, so that 我可以修改这个组件的配置
7. As a 运营人员, I want to 在 Props Tab 修改组件的文字、图片地址、开关等属性, so that 内容能按我的需求变更
8. As a 运营人员, I want to 在 Styles Tab 手写 Tailwind 类名, so that 我可以快速调整样式布局
9. As a 运营人员, I want to 在 PT Tab 用 Monaco 写 PrimeVue PT JSON, so that 我可以精确覆写组件内部节点的样式
10. As a 运营人员, I want to 在 Slots Tab 看到 Card 的可拖入插槽区域, so that 我可以把 Image/Button 放入 Card 的内容区
11. As a 运营人员, I want to 在画布上方切换手机/平板/PC 三种设备视图, so that 我确保页面在不同屏幕上都好看
12. As a 运营人员, I want to 点击保存时数据存储在本地 Dexie, so that 我下次打开可以继续编辑
13. As a 运营人员, I want to 删除不需要的组件或 Site, so that 我可以保持工作区整洁
14. As a 运营人员, I want to 点击发布后下载 JSON 配置文件, so that 我可以把文件交给部署方或保留离线
15. As a 运营人员, I want to 用 viewer.html 加载下载的 JSON 查看最终效果, so that 我发布前先确认页面渲染正确
16. As a 运营人员, I want to 切换暗色/亮色主题, so that 我在偏好暗色的开发环境下也能舒服工作
17. As a 运营人员, I want to 编辑器的 Toast 通知我保存/发布的结果, so that 我知道操作成功了
18. As a 运营人员, I want to 删除前有 ConfirmDialog 二次确认, so that 我不会误删重要的内容
19. As a 运营人员, I want to Site 的标题默认生成后可随时修改, so that 我不需要每次都填空
20. As a PRO Code 开发者, I want to 通过 ComponentMeta 的 propsPanel 配置快速注册新组件, so that 我可以扩展组件库而不改编辑器框架

## Implementation Decisions

### Domain Model
- **Site（站点）**: 一个可独立发布的单页站点。v1 只支持单页，无多页面导航。
- **Storage**: Dexie（IndexedDB）作为本地离线数据库，存储 Site 元信息、组件配置、草稿。
- **Publish**: Site JSON 文件导出到浏览器下载目录，附带一个独立的 viewer.html 离线查看。
- **Site 标题**: 新建时自动生成默认标题（如"未命名站点"），用户随时可改，无需弹窗。

### Architecture
- **Editor / Renderer / Shared 三层分离**。Editor 含拖拽编排、属性面板、Monaco。Renderer 纯组件运行时。Shared 存放类型定义和工具函数。
- **三视图**: EditView（拖拽编辑）→ PreviewView（全屏预览，复用 Renderer）→ viewer.html（独立离线渲染入口）
- **组件元信息注册表**: 每个组件静态注册一份 ComponentMeta（type, label, defaultProps, defaultStyles, propsPanel, slots, ptNodes），编辑器右侧面板据此自动生成 UI。

### Component Library
- **PrimeVue 4** + **Unstyled + Tailwind Preset** 模式。PrimeVue 组件不加载自带主题 CSS，样式层全部由 Tailwind 类名驱动。手动 import 组件。
- **v1 组件集**: Card（5 slots），Image（3 slots + preview prop），Button（props + events），Panel（toggleable prop + events），ScrollPanel（容器样式）。共 5 个。
- **5 面板 DSL**: 每个 ComponentNode 的 JSON 包含 props / styles / pt / events（v1 空壳）/ slots。

### Layout & Interaction
- **画布布局**: 流式网格吸附排列。组件左上角吸附到以 Tailwind `--spacing`（默认 4px）为步长的网格点，组件高度变化时后续组件自动下推。
- **默认画布尺寸**: 移动端优先（375px 宽度）。
- **拖拽库**: vue-draggable-plus（TypeScript 原生，支持嵌套拖拽）。
- **设备预览**: 通过画布宽度变化模拟移动端（375px）、平板（768px）、PC（1280px）。

### Theme
- **暗色模式**: `<html class="dark">` + Tailwind `dark:` 变体，与 PrimeVue Tailwind Preset 原生兼容。
- 编辑器自身 UI 和渲染组件共享同一套暗色系统。

### Editor UI Components
- **Toast**: PrimeVue Toast 组件，保存/发布/删除等操作通知。
- **ConfirmDialog**: PrimeVue ConfirmDialog 组件，删除确认。
- v1 不需要 Dialog（新建 Site 直接用默认标题）。

### Technical Stack
- Vue 3 + setup + TypeScript + Vite
- Pinia（状态管理）+ Vue Router（路由管理）
- Tailwind CSS（样式引擎）
- PrimeVue 4（组件库，手动 import）
- vue-draggable-plus（拖拽）
- Dexie（IndexedDB 封装）
- Monaco Editor（代码编辑器，PT 面板使用）
- Shiki（代码高亮，预留）
- markstream-vue（流式渲染，预留）
- 启动命令: `vp run dev`

## Testing Decisions

- **原则**: 只测外部行为，不测实现细节。第三方库（PrimeVue、Monaco、vue-draggable-plus）不测。
- **工具**: Vitest + @vue/test-utils
- **测试范围**:
  1. 核心类型校验 — 验证 ComponentNode / SiteConfig 的结构合法性
  2. Renderer 渲染输出 — 喂 JSON DSL 给 Renderer，断言 DOM 正确：Card 渲染指定标题、Image 拿到正确的 src 属性、Button 显示指定 label
- **不在 v1 中测试**: Dexie CRUD 操作（手验证）、拖拽排序逻辑（vue-draggable-plus 本身成熟）、Monaco 编辑器集成、E2E/截图对比（v2 用 Playwright）

## Out of Scope

- 后端 API / 数据库 / 用户认证系统 — v1 纯前端
- 自定义组件 / 组件开发 SDK — 预留入口但不实现
- Events Panel 的事件动作 — v1 Tab 空壳
- 动态数据绑定（{{ }} 表达式）— v2 再接后端时做
- 组件自由像素定位 / 自由大小调整 — v1 流式排列
- 多页面 / 页面路由 — Site 等于单页
- CDN 部署 / CI/CD — v1 手动导出 JSON + 手动部署
- 组件市场 / 模板市场

## Further Notes

- 术语表见 CONTEXT.md，设计决策衍生出的 ADR 见 docs/adr/（按需创建）
- 项目启动后第一个里程碑：在画布上成功渲染一个 Card 组件（DSL → Renderer 全链路跑通）
