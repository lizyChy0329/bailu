# 树-画布协同架构

日期: 2026-06-22
状态: 已采纳
废弃: 002-free-form-canvas.md

## 背景

编辑器框架从自由定位画布（moveable + 15px 网格）切换到流式排列画布 + 组件树控件协同模式，以降低用户操作复杂度，增强层级可视性。

## 决策

### 1. Canvas：流式排列 + 插入指示线

- 根级组件采用流式垂直排列（flex-col + vue-draggable-plus 排序）
- 删除绝对定位（left/top/width/height）、删除 moveable、删除 15px 网格吸附
- 拖入新组件时显示蓝色插入指示线，定位到具体插入位置
- 插入检测算法（Canvas Sensor.locate）：
  - 拖拽经过 Canvas 时，通过元素坐标计算最近的插入点
  - 若鼠标位于根级组件之间 → 在该位置显示水平蓝线
  - 若鼠标悬停在容器组件（Card/Panel/ScrollPanel）内部 → 进入该组件的默认 slot，边框高亮 + slot 内显示指示线
  - 若鼠标悬停在非容器组件（Button/Image）上 → 显示为"插入到此组件之后"
- 禁止从左侧面板拖入 Tree

### 2. LeftPanel：Palette + Tree 双面板

- 左侧组件面板（Palette）：保持现有设计，拖入新组件到 Canvas
- 右侧树控件（Tree）：PrimeVue Tree 组件展示当前页面结构

### 3. 组件树（Tree）设计

**树节点结构**：
```
页面 (root)
├── Card [pmJQBxx.jpg icon]
│   ├── [slot: header]
│   │   └── Image
│   └── [slot: default]
│       └── Button
└── Panel
    └── [slot: default]
```

**树节点映射规则**：
- 每个组件对应一个树节点，key = 组件 id
- 每个 slot 对应一个树节点，key = `${componentId}:${slotName}`，type = 'slot'
- 点击组件节点 → 选中该组件
- 点击 slot 节点 → 选中该 slot 中的第一个子组件；若 slot 为空，选中父组件

**树内拖拽规则**：
- 组件节点可以在树内自由拖拽排序
- 组件节点拖到另一个容器组件的 slot 子节点中 → 嵌套到该 slot
- 组件节点可以拖到 slot 之间（跨 slot 移动）
- 非容器组件（无 slot 的组件，如 Button/Image）不允许作为拖拽目标容器——向此类组件拖入时，恢复原位
- Slot 节点不可拖拽

### 4. 选中联动

- Canvas 上点击组件 → 选中 → 树高亮对应节点 + 右面板显示属性
- 树上点击节点 → 选中组件 → Canvas 高亮 + 右面板更新
- 右面板编辑属性 → Canvas 实时更新 + 树节点标签同步

### 5. 数据模型变更

**ComponentNode 删除字段**：
- `x?: number`  删除
- `y?: number`  删除
- `width?: number`  删除
- `height?: number`  删除

**ComponentMeta 删除字段**：
- `defaultWidth?: number`  删除
- `defaultHeight?: number`  删除

**addComponent 方法变更**：
- 旧签名：`addComponent(type, options?)`
- 新签名：`addComponent(type, parentId?, slotName?, index?)`

### 6. 拖入流程

```
面板 mousedown → dragStart → setData('component-type', type)
       ↓
鼠标进入 Canvas → dragover 事件
       ↓
Canvas.locate() 算法：
  1. 获取鼠标在 Canvas 内的 Y 坐标
  2. 遍历根级或 slot 内的子组件 DOM 矩形
  3. 判断鼠标在哪个组件之前/之后/之上
  4. 若在容器组件上方一定范围内 → 进入该容器的 default slot
       ↓
显示插入指示线 + 可选 slot 高亮
       ↓
鼠标松开 → drop 事件
       ↓
计算目标组件 id、slot 名称、插入 index
       ↓
调用 addComponent(type, parentId, slotName, index)
       ↓
树展开目标节点 + 高亮新组件
```

### 7. 实施步骤

1. ADR 评审通过
2. 数据模型清理（删除 x/y/w/h 字段 + addComponent 签名变更）
3. Canvas 重写（删除 moveable，恢复 vue-draggable-plus 流式布局）
4. 实现插入指示线 + Canvas 落点检测算法
5. LeftPanel 拆分（Palette + Tree 双面板）
6. 树组件实现 + slot 节点映射
7. 选中联动逻辑
8. 树内拖拽逻辑
9. 集成测试

## 影响

- 废弃 002-free-form-canvas.md ADR
- 删除 moveable 依赖
- 重写 CanvasArea.vue（约从 270 行减到 150 行）
- 重写 LeftPanel.vue（新增 Tree 面板）
- 修改 site.store.ts（addComponent + 选中同步）
- 修改 component.ts 类型定义
- 修改 5 个 registry 文件（删除 defaultWidth/Height）
- 新增 ComponentTree.vue（独立组件）
