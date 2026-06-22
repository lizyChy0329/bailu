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

**Component Category（组件分类）**:
编辑器左侧面板将组件按功能分为三类：布局类（Card、Panel、ScrollPanel）、内容类（Image）、交互类（Button）。每类有独立标题，下方 3 列 grid 排列。该分类仅用于编辑器 UI 组织，不影响运行时渲染。

**Dot Grid Canvas（点阵画布）**:
Canvas 背景使用 CSS `radial-gradient` 实现 10px 间距的浅灰点阵网格，模拟设计工具的"图纸"背景。点阵仅作为背景装饰，不参与交互，不随设备模式缩放。
_Avoid_: 网格线交叉的坐标系, SVG 网格覆盖层

**Free-Form Canvas（自由定位画布）**:
Canvas 中的根级组件采用绝对定位（left/top/width/height），通过 moveable 驱动拖拽和缩放。拖拽和缩放均吸附到 20px 网格，8 控制点缩放。插槽内的嵌套子组件保持流式垂直堆叠（vue-draggable-plus）。
_Avoid_: 所有组件统一自由定位, 完全像素自由无吸附

**Component Tree（组件树）**:
编辑器左侧面板右侧区域展示的 PrimeVue Tree 组件，以树形结构呈现当前页面的组件层级，包括 slot 节点。树上点击节点可选中组件，拖拽节点可调整组件层级和 slot 归属。Slot 节点以 `[slot: name]` 形式展示。

**Drop Indicator（插入指示线）**:
从组件面板拖拽新组件到 Canvas 时，Canvas 上显示的蓝色水平定位线。通过 DOM 碰撞算法（参考 lowcode-engine Sensor.locate）计算鼠标最近的组件间隙，指示线出现在该位置。插入到容器组件时，容器边框高亮提示。

## 废弃

**Dot Grid Canvas（点阵画布）** — 已废弃，Canvas 改为流式布局
**Free-Form Canvas（自由定位画布）** — 已废弃，被 003-tree-canvas-architecture ADR 取代
