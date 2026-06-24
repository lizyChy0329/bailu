# 样式类与预设组合系统 — 设计文档

**日期**: 2026-06-24
**状态**: 已批准
**范围**: PropsPanel UI 改造 + 数据模型扩展

---

## 1. 数据模型

### 1.1 ComponentStyles 变更

```typescript
// src/shared/types/component.ts

export interface ComponentStyles {
  classes: string[]                    // 用户管理的类名数组 ← 替代 class 字符串
  style?: Record<string, string>       // 不变
  groupRefs: string[]                  // 引用的 GroupClassPreset.id 数组
}
```

**兼容性策略**：读取旧数据时（`styles.class` 存在且为字符串），启动时自动拆分为数组写入 `classes`。

### 1.2 GroupClassPreset

```typescript
export interface GroupClassPreset {
  id: string
  name: string
  description?: string
  classes: string[]
}
```

### 1.3 SiteConfig 扩展

```typescript
// src/shared/types/site.ts
export interface SiteConfig {
  // ...原有字段...
  groupClassPresets: GroupClassPreset[]
}
```

---

## 2. PropsPanel UI 布局

### 2.1 整体结构

```
Accordion
├── [组件属性] (已有)
├── ▼ 样式类 (新增)
│   ├── 快速添加输入框 [px-4 ▾]  ← AutoComplete multiple
│   ├── ▼ 间距 [p-4] [m-2] [×]
│   ├── ▼ 圆角 [rounded-xl] [×]
│   ├── ▼ 阴影 [shadow-lg] [×]
│   └── ▼ 自定义 [p-[111px]] [×]
├── ▼ 预设组合 (新增)
│   ├── ☑ bg-preset  → rounded-xl shadow-lg ...
│   ├── ☐ card-preset → ...
│   └── [⚙ 管理预设]
├── ▼ PT 覆写 (已有)
│   ├── root: [shadow-lg] [×]
│   ├── header: [bg-blue-50] [×]
│   └── body: [p-4] [×]
└── ▼ 高级 (已有)
    ├── [配置 DT]  ← 保持 JSON 编辑
    └── [配置 ptOptions]
```

### 2.2 样式类输入 (AutoComplete multiple)

- 使用 PrimeVue `AutoComplete` + `multiple` 属性
- 输入 `px-4` 回车 → 生成 chip `[px-4] [×]`
- 点击 × 删除单个类名
- **后续**：Tailwind 补全建议（目前自由输入）
- 点击 chip 文本 → 编辑状态（后续）

### 2.3 类名分组展示

- 按 Tailwind 前缀自动分类：
  - 间距: `p-*`, `m-*`, `gap-*`, `space-*`
  - 圆角: `rounded-*`
  - 阴影: `shadow-*`
  - 背景: `bg-*`
  - 边框: `border-*`
  - 排版: `text-*`, `font-*`
  - 布局: `flex-*`, `grid-*`, `w-*`, `h-*`
  - 自定义: 不属于以上分类的类名
- 每个分类可折叠/展开
- 分类内显示 chip 形式，右侧 × 删除

### 2.4 预设组合

- Checkbox 列表，勾选 = 加入 `groupRefs`
- 显示预设名称 + 类名预览
- [管理预设] 按钮 → 弹窗

### 2.5 预设管理弹窗

**列表页**：
- 功能介绍说明
- [+ 新建预设] 按钮
- 预设列表（名称 + 描述 + 类名预览 + [×] 删除）

**新建/编辑**：
- 名称输入框
- 描述输入框
- 类名列表（AutoComplete multiple）

### 2.6 PT 覆写改造

- 每个 pt node 的 `class` 字段改为 `string[]`（chip 数组）
- 使用 AutoComplete multiple 编辑
- 点击 × 删除单个类名

---

## 3. 渲染层

### 3.1 类名合并逻辑

```typescript
// 渲染时合并：classes + 展开的预设类名
const finalClasses = [
  ...node.styles.classes,
  ...node.styles.groupRefs.flatMap(id => presets.find(p => p.id === id)?.classes ?? [])
]

// 使用 tailwind-merge 解决冲突
const mergedClass = tailwindMerge(finalClasses.join(' '))
```

### 3.2 优先级

- `classes[]` 优先级 **高于** 预设类名
- 冲突时（`px-4` vs `px-8`），`classes[]` 中的胜出
- 实现方式：`tailwindMerge(classes.join(' '), ...presetClasses)`，后者覆盖前者

### 3.3 渲染器更新

所有 renderer 的 `:class` 绑定改为：
```vue
:class="mergedClass(node)"
```

---

## 4. 迁移策略

### 4.1 旧数据兼容

读取旧 `styles.class` 字符串时，自动拆分：
```typescript
if (typeof node.styles.class === 'string') {
  node.styles.classes = node.styles.class.split(' ').filter(Boolean)
  delete node.styles.class
}
```

### 4.2 旧 PT 数据兼容

读取旧 `pt[*].class` 字符串时，自动拆分：
```typescript
if (ptNode.class && typeof ptNode.class === 'string') {
  ptNode.classes = ptNode.class.split(' ').filter(Boolean)
  delete ptNode.class
}
```

---

## 5. 依赖

- `tailwind-merge` — 用于类名冲突解决
- PrimeVue `AutoComplete` — 已有

---

## 6. 待后续

- Tailwind 类名补全建议（引入 Tailwind IntelliSense 数据）
- 点击 chip 编辑单个类名值
- 样式面板（第二 tab）拆分（可选）
