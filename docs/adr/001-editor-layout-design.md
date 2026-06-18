# 编辑器布局设计

日期: 2026-06-18
状态: 已采纳

## 背景

编辑器左侧组件面板、中间画布、顶部 Header 的布局需要优化，以提升拖拽搭建体验。

## 决策

### 1. 左侧面板：分类 3 列 Grid

- 组件按功能分为三类：布局类（Card, Panel, ScrollPanel）、内容类（Image）、交互类（Button）
- 每类一个分类标题行，下方 `grid-cols-3` 排列组件图标卡片
- 面板本身 `overflow-y-auto` 支持纵向滚动

### 2. Canvas 点阵网格

- 画布背景使用 `radial-gradient` CSS 实现 10px 间距的浅灰点阵
- 点不覆盖组件区域（仅 Canvas 容器背景）
- 不随设备模式缩放，保持固定 10px 间距

### 3. 关闭按钮定位

- 选中组件的关闭按钮固定在选中边框的右上角外缘
- 使用 `top-0 right-0` + `-translate-y-1/2 translate-x-1/2` 实现精确角点定位

### 4. 设备切换居中

- Header 采用三栏 flex 布局（left / center / right）
- 设备模式 SelectButton 置于 header 正中央
- 左侧保留"返回 + 站点标题"，右侧保留"主题切换 + 保存 + 发布"

## 影响

- LeftPanel 数据结构需要引入分组映射（group -> ComponentType[]）
- CanvasArea 新增背景样式，不涉及逻辑改动
- EditorShell header 布局结构调整
- 向前兼容，现有功能不受影响
