# 自由定位画布

日期: 2026-06-18
状态: 已采纳

## 背景

编辑器 Canvas 需要支持自由拖拽定位和缩放，取代之前的流式垂直堆叠布局。

## 决策

### 1. 根组件自由定位，插槽子组件流式排列

- Canvas 中的根级组件采用绝对定位（left/top/width/height），通过 moveable 驱动拖拽和缩放
- 插槽（slot）内的嵌套子组件保持流式垂直堆叠，使用 vue-draggable-plus 排序
- 仅根组件拥有 x/y/width/height 属性

### 2. 20px 网格吸附 + 对齐辅助线

- 拖拽和缩放均吸附到 20px 网格
- moveable 的 snappable + elementGuidelines 提供组件间对齐线

### 3. 8 控制点缩放

- 四角 + 四边中点共 8 个拖拽控制点
- 缩放同样吸附到 20px 网格

### 4. 固定画布高度

- Canvas 高度固定 1100px
- 超出部分由外层 main 区域滚动

### 5. 技术选型

- 使用 moveable（vanilla）直接操作 DOM，dragEnd/resizeEnd 时同步回 Pinia store
- throttleDrag/throttleResize: 20 实现网格吸附

## 影响

- ComponentNode 新增 x/y/width/height 可选字段
- ComponentMeta 新增 defaultWidth/defaultHeight
- CanvasArea 从 VueDraggable 改为 template ref + moveable 组合
- 插槽渲染器保持不变，仍使用 vue-draggable-plus
