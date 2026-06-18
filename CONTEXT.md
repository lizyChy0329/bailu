# Bailu

Bailu 是一个面向运营人员的 lowcode 引擎，用于快速搭建表单和营销页面（Site），并发布到线上。

## Language

**Site（站点/产品）**:
一个独立可发布的单页站点。运营人员在系统中创建一个 Site，通过拖拽组件搭建页面内容，发布后生成一个独立的线上 URL。
_Avoid_: 产品, 项目, 页面集合

**Storage（存储层）**:
前端浏览器端使用的本地持久化方案，选用 Dexie（基于 IndexedDB）作为离线数据库，存储 Site 元信息、组件配置、草稿等数据。
_Avoid_: lowdb, localStorage, SQLite

**Layer（分层架构）**:
Bailu 采用 Editor / Renderer 分层。Editor 负责创作（拖拽、属性编辑、Monaco）。Renderer 是纯组件运行时，被 PreviewView 壳和独立 viewer.html 共用。Shared 存放双方共用的类型定义。
_Avoid_: 单层大杂烩

**PrimeVue**:
Bailu 选用的 Vue 3 组件库底座。采用 Unstyled + Tailwind Preset 模式，组件不加载 PrimeVue 自带主题 CSS，样式层全部由 Tailwind 类名驱动。
_Avoid_: Styled Mode, Unstyled 裸模式

**DSL（组件描述结构）**:
每个组件的 JSON Schema 包含 5 个模块化区域——props（属性）、styles（Tailwind 类名）、pt（PrimeVue PT 覆写）、events（事件处理）、slots（插槽/嵌套子组件）。Editor 右侧面板对应 5 个 Tab 展示。
_Avoid_: 属性全部混在一起拍平的 JSON

**ComponentMeta（组件元信息注册表）**:
每个组件类型通过 TypeScript 静态注册一份 ComponentMeta，包含 type、label、defaultProps、defaultStyles、propsPanel、slots、ptNodes。编辑器右侧面板据此自动生成 UI。
_Avoid_: 动态从后端加载元信息（v1 不做）

**Styles Panel（样式面板）**:
采用 Tailwind CSS 优先策略。低代码用户的图形化操作底层映射为 Tailwind 类名拼接。v1 以一个大文本输入框起步，先调通全链路。
_Avoid_: 一上来做复杂的可视化样式控件

**Layout（画布布局）**:
组件在画布上采用流式网格吸附排列。组件左上角吸附到以 tailwindcss --spacing（默认 4px）为步长的网格点，组件高度变化时后续组件自动下推。通过画布宽度变化模拟 PC/平板/移动预览。
_Avoid_: 自由像素定位, 纯流式堆叠

**Theme（主题）**:
暗色模式通过 `<html class="dark">` 配合 Tailwind `dark:` 变体实现，与 PrimeVue Tailwind Preset 原生兼容。
_Avoid_: PrimeVue 自带两套 CSS 文件切换
