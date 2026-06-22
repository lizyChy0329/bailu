# 右面板重构 + Splitter 替换

日期: 2026-06-22
状态: 已采纳

## 背景

编辑器右面板的通用 5 Tab 布局（属性/样式/PT/事件/插槽）与组件实际使用场景脱节。左侧面板和中间内容区的 resize 通过手动拖拽实现，代码冗长。

## 决策

### 1. 右面板：3 Tab + 组件感知分组

**Tab 结构**（去掉 PT 和 Slot 独立 Tab）：

| Tab | 内容 |
|-----|------|
| 属性 | 按功能域分组的 `panelSections`，Accordion 折叠展示 |
| 样式 | Tailwind 类名输入框 + PT JSON 编辑器（合并原 PT Tab） |
| 事件 | 保留位置，后续实现 |

**属性 Tab 的分组规则**（`panelSections`）：

按功能域而非按 PrimeVue API 章节。每个组件注册自己的 `panelSections`，每个 section 有一个 `title`（用于 Accordion 面板标题）和一列 `controls`（PropDef）。

- 无 `title` 的 section → 非折叠渲染（常用于单开关项）
- 有 `title` 的 section → Accordion 面板，默认展开

**PT 合并到样式 Tab**：
- 样式 Tab 顶部放置 PT JSON 编辑器（原 PTPanel.vue 内容）
- 下方保留 Tailwind 类名输入框

### 2. Slot 管理：从 Tab 改为画布视觉提示

不再有独立的「插槽」Tab。改为：

- 在属性 Tab 中添加一个「插槽」section，提供一个 `显示插槽` 切换开关
- 开启后，Canvas 中容器组件的 slot 区域显示为**灰色虚线框**
- 用户将组件拖入虚线框区域，即插入到该 slot 中
- Slot 开启/关闭状态存储在 `appStore.showSlots` 中

### 3. 事件 Tab：占位

保持 Tab 可见，内容为空。后续实现事件绑定 UI。

### 4. LeftPanel：Splitter 替换手动 resize

**EditorShell** 的左/中/右三栏布局使用 PrimeVue `Splitter` 替代手动 `mousedown/mousemove/mouseup`：

**LeftPanel** 内 Palette/Tree 使用嵌套 `Splitter layout="vertical"`。

删除：
- EditorShell 中 `startResize` / `onMouseMove` / `onMouseUp` / `leftPanelWidth` / `rightPanelWidth` / `resizing`
- LeftPanel 中的 `min-w-[250px]` / `min-w-[300px]`（转为 `:minSize` 百分比）

## 影响

- 删除 PTPanel.vue 和 SlotsPanel.vue 的独立 Tab，PT 合并到 StylesPanel
- 编辑器右面板从 5 Tab 减为 3 Tab
- 删除 EditorShell 中约 30 行 resize 手动逻辑
- 新增 `appStore.showSlots` 状态
- CanvasArea 新增 slot 虚线框渲染逻辑
- 向前兼容：无 panelSections 的组件自动回退到平铺列表
