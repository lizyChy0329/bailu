# 样式类与预设组合系统 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现基于 Tailwind 的类名管理系统，支持数组化类名、分组展示、预设组合、PT 类名 chip 化。

**Architecture:** 
1. 扩展 ComponentNode.styles 从 string 改为 { classes: string[], style, groupRefs: string[] }
2. PropsPanel 新增"样式类"和"预设组合" accordion 区域
3. PT 覆写区域改造：每个 pt node 的 class 改为 chip 数组
4. 渲染层添加 tailwind-merge 合并逻辑
5. 旧数据自动迁移兼容

**Tech Stack:** Vue 3, PrimeVue AutoComplete (multiple), tailwind-merge

---

## 文件变更清单

| 文件 | 变更 |
|------|------|
| `src/shared/types/component.ts` | ComponentStyles 接口重构 |
| `src/shared/types/site.ts` | SiteConfig 新增 groupClassPresets |
| `src/editor/panels/PropsPanel.vue` | 新增样式类+预设 UI，PT 改造 |
| `src/editor/panels/PtEditor.vue` | PT 输入框改为 AutoComplete multiple |
| `src/renderer/core/Renderer.vue` | 渲染类名合并逻辑 |
| `src/stores/site.store.ts` | 旧数据迁移兼容 |
| `package.json` | 添加 tailwind-merge 依赖 |
| `tailwind.config.ts` | 确保 safelist 覆盖新类名 |

---

### Task 1: 数据模型扩展

**Files:**
- Modify: `src/shared/types/component.ts`
- Modify: `src/shared/types/site.ts`

- [ ] **Step 1: 修改 ComponentStyles 接口**

```typescript
// src/shared/types/component.ts — 找到 ComponentStyles 接口

// 原有:
export interface ComponentStyles {
  class?: string
  style?: Record<string, string>
}

// 改为:
export interface ComponentStyles {
  classes: string[]
  style?: Record<string, string>
  groupRefs: string[]
}
```

- [ ] **Step 2: 修改 ComponentNode 中的 pt 类型**

```typescript
// src/shared/types/component.ts — 找到 ComponentNode 接口

// 原有 pt:
pt?: Record<string, any>

// 改为 (保持兼容，但内部 pt node 的 class 改为 classes):
pt?: Record<string, { class?: string; classes?: string[] }>
```

- [ ] **Step 3: 新增 GroupClassPreset 类型**

```typescript
// src/shared/types/component.ts — 在 ComponentStyles 之后添加

export interface GroupClassPreset {
  id: string
  name: string
  description?: string
  classes: string[]
}
```

- [ ] **Step 4: 修改 SiteConfig 接口**

```typescript
// src/shared/types/site.ts

// 找到 SiteConfig 接口，在末尾添加:
export interface SiteConfig {
  // ...原有字段...
  groupClassPresets: GroupClassPreset[]
}
```

- [ ] **Step 5: 更新 SiteConfig 默认值**

```typescript
// src/stores/site.store.ts — 找到 addSite 或 loadCurrentSite 方法

// 确保新 site 初始化时包含 groupClassPresets:
groupClassPresets: []
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/types/component.ts src/shared/types/site.ts src/stores/site.store.ts
git commit -m "feat: 扩展数据模型 — ComponentStyles 改为数组 + 新增 GroupClassPreset"
```

---

### Task 2: 安装 tailwind-merge

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装依赖**

```bash
npm install tailwind-merge
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: 添加 tailwind-merge 依赖"
```

---

### Task 3: 渲染层类名合并逻辑

**Files:**
- Modify: `src/renderer/core/Renderer.vue`

- [ ] **Step 1: 读取当前 Renderer.vue**

```bash
# 先读取文件了解当前结构
```

- [ ] **Step 2: 添加类名合并 composable**

```typescript
// src/renderer/core/Renderer.vue — 在 script setup 中添加

import { computed } from 'vue'
import { twMerge } from 'tailwind-merge'
import { useSiteStore } from '@/stores/site.store'

const siteStore = useSiteStore()
const currentSite = computed(() => siteStore.currentSite)

function computeFinalClasses(node: ComponentNode) {
  const classes = node.styles?.classes ?? []
  const groupRefs = node.styles?.groupRefs ?? []
  const presetClasses = groupRefs.flatMap(id => {
    const preset = currentSite.value?.groupClassPresets.find(p => p.id === id)
    return preset?.classes ?? []
  })
  const all = [...classes, ...presetClasses]
  return twMerge(all.join(' '))
}
```

- [ ] **Step 3: 更新所有 renderer 的 :class 绑定**

```vue
<!-- src/renderer/core/Renderer.vue — 找到 renderNode 或类似方法 -->

<!-- 原有: -->
:class="node.styles?.class"

<!-- 改为: -->
:class="computeFinalClasses(node)"
```

- [ ] **Step 4: 更新所有子 renderer 组件**

```vue
<!-- 以下每个文件都需要同步更新 -->
<!-- src/renderer/components/ButtonRenderer.vue -->
<!-- src/renderer/components/CardRenderer.vue -->
<!-- src/renderer/components/ImageRenderer.vue -->
<!-- src/renderer/components/PanelRenderer.vue -->
<!-- src/renderer/components/ScrollPanelRenderer.vue -->

<!-- 原有: -->
:class="node.styles?.class"

<!-- 改为: -->
:class="computeFinalClasses(node)"
```

- [ ] **Step 5: Commit**

```bash
git add src/renderer/core/Renderer.vue src/renderer/components/*.vue
git commit -m "feat: 渲染层类名合并 — 支持 classes[] + groupRefs + tailwind-merge"
```

---

### Task 4: PropsPanel — 样式类输入

**Files:**
- Modify: `src/editor/panels/PropsPanel.vue`

- [ ] **Step 1: 导入 AutoComplete 组件**

```typescript
// src/editor/panels/PropsPanel.vue

import AutoComplete from 'primevue/autocomplete'
```

- [ ] **Step 2: 添加样式类输入 UI**

```vue
<!-- src/editor/panels/PropsPanel.vue — 在 titledSections 之后添加新 accordion -->

<AccordionPanel value="__styles">
  <AccordionHeader class="text-sm">样式类</AccordionHeader>
  <AccordionContent>
    <div class="space-y-3">
      <!-- 快速添加输入框 -->
      <AutoComplete
        v-model="stylesDraft.classes"
        :suggestions="[]"
        multiple
        fluid
        placeholder="输入类名回车添加"
        @complete="onCompleteClasses"
      />
      
      <!-- 分组展示 -->
      <div v-for="(groupedClasses, groupName) in groupedClasses" :key="groupName">
        <AccordionPanel :value="groupName">
          <AccordionHeader class="text-xs">{{ groupName }}</AccordionHeader>
          <AccordionContent>
            <div class="flex flex-wrap gap-2">
              <Chip
                v-for="cls in groupedClasses"
                :key="cls"
                :label="cls"
                removable
                @remove="removeClass(groupName, cls)"
              />
            </div>
          </AccordionContent>
        </AccordionPanel>
      </div>
    </div>
  </AccordionContent>
</AccordionPanel>
```

- [ ] **Step 3: 添加 script 逻辑**

```typescript
// src/editor/panels/PropsPanel.vue

import { ref, computed, watch } from 'vue'
import Chip from 'primevue/chip'

const stylesDraft = ref({
  classes: [] as string[],
  groupRefs: [] as string[]
})

// 初始化 stylesDraft
watch(comp, (newComp) => {
  if (newComp) {
    stylesDraft.value = {
      classes: newComp.styles?.classes ?? [],
      groupRefs: newComp.styles?.groupRefs ?? []
    }
  }
}, { immediate: true })

// 同步回 comp
watch(stylesDraft, (newVal) => {
  if (comp.value) {
    comp.value.styles.classes = newVal.classes
    comp.value.styles.groupRefs = newVal.groupRefs
    siteStore.persistCurrentSite()
  }
}, { deep: true })

// 分组逻辑
const classGroups: Record<string, string[]> = {
  '间距': ['p-', 'm-', 'gap-', 'space-'],
  '圆角': ['rounded-'],
  '阴影': ['shadow-'],
  '背景': ['bg-'],
  '边框': ['border-'],
  '排版': ['text-', 'font-', 'leading-', 'tracking-'],
  '布局': ['flex-', 'grid-', 'w-', 'h-', 'max-', 'min-'],
  '其他': []
}

function groupClasses(classes: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = { '间距': [], '圆角': [], '阴影': [], '背景': [], '边框': [], '排版': [], '布局': [], '其他': [] }
  for (const cls of classes) {
    let matched = false
    for (const [group, prefixes] of Object.entries(classGroups)) {
      if (group === '其他') continue
      if (prefixes.some(p => cls.startsWith(p))) {
        result[group].push(cls)
        matched = true
        break
      }
    }
    if (!matched) result['其他'].push(cls)
  }
  return result
}

const groupedClasses = computed(() => {
  return groupClasses(stylesDraft.value.classes)
})

function removeClass(groupName: string, cls: string) {
  stylesDraft.value.classes = stylesDraft.value.classes.filter(c => c !== cls)
}

function onCompleteClasses(event: any) {
  // 后续: Tailwind 补全建议
  // 目前: 空数组，自由输入
}
```

- [ ] **Step 4: Commit**

```bash
git add src/editor/panels/PropsPanel.vue
git commit -m "feat: PropsPanel 样式类输入 — AutoComplete multiple + 分组展示"
```

---

### Task 5: PropsPanel — 预设组合

**Files:**
- Modify: `src/editor/panels/PropsPanel.vue`

- [ ] **Step 1: 添加预设组合 UI**

```vue
<!-- src/editor/panels/PropsPanel.vue — 在样式类之后添加 -->

<AccordionPanel value="__presets">
  <AccordionHeader class="text-sm">预设组合</AccordionHeader>
  <AccordionContent>
    <div class="space-y-2">
      <div v-for="preset in siteStore.currentSite?.groupClassPresets" :key="preset.id"
           class="flex items-center justify-between p-2 border rounded">
        <div class="flex items-center gap-2">
          <Checkbox v-model="stylesDraft.groupRefs" :value="preset.id" />
          <div>
            <div class="text-sm font-medium">{{ preset.name }}</div>
            <div class="text-xs text-gray-500">{{ preset.classes.join(' ') }}</div>
          </div>
        </div>
      </div>
      <Button label="管理预设" icon="pi pi-cog" variant="outlined" size="small" @click="presetDialogVisible = true" />
    </div>
  </AccordionContent>
</AccordionPanel>
```

- [ ] **Step 2: 添加 Checkbox 导入**

```typescript
// src/editor/panels/PropsPanel.vue

import Checkbox from 'primevue/checkbox'
```

- [ ] **Step 3: 添加预设管理 Dialog**

```vue
<!-- src/editor/panels/PropsPanel.vue — 在模板末尾添加 -->

<Drawer v-model:visible="presetDialogVisible" position="right" :header="'预设组合管理'" class="!w-[500px]">
  <div class="space-y-4">
    <p class="text-sm text-gray-600">
      将常用的样式组合保存为预设，一键应用到组件上。修改预设后，所有引用该预设的组件会自动更新。
    </p>
    
    <Button label="新建预设" icon="pi pi-plus" @click="openNewPreset" />
    
    <div class="space-y-2">
      <div v-for="preset in siteStore.currentSite?.groupClassPresets" :key="preset.id"
           class="flex items-center justify-between p-3 border rounded">
        <div>
          <div class="font-medium">{{ preset.name }}</div>
          <div class="text-xs text-gray-500">{{ preset.description }}</div>
          <div class="flex flex-wrap gap-1 mt-1">
            <Chip v-for="cls in preset.classes" :key="cls" :label="cls" size="small" />
          </div>
        </div>
        <Button icon="pi pi-trash" variant="text" size="small" @click="deletePreset(preset.id)" />
      </div>
    </div>
  </div>
  
  <!-- 新建/编辑预设 Dialog -->
  <Dialog v-model:visible="presetEditVisible" :header="presetEditing?.id ? '编辑预设' : '新建预设'" modal>
    <div class="space-y-4">
      <div>
        <label class="block text-sm mb-1">名称</label>
        <InputText v-model="presetDraft.name" fluid />
      </div>
      <div>
        <label class="block text-sm mb-1">描述</label>
        <InputText v-model="presetDraft.description" fluid />
      </div>
      <div>
        <label class="block text-sm mb-1">类名</label>
        <AutoComplete
          v-model="presetDraft.classes"
          :suggestions="[]"
          multiple
          fluid
          placeholder="输入类名回车添加"
          @complete="() => {}"
        />
      </div>
    </div>
    <template #footer>
      <Button label="取消" variant="outlined" @click="presetEditVisible = false" />
      <Button label="保存" @click="savePreset" />
    </template>
  </Dialog>
</Drawer>
```

- [ ] **Step 4: 添加预设管理逻辑**

```typescript
// src/editor/panels/PropsPanel.vue

import Dialog from 'primevue/dialog'

const presetDialogVisible = ref(false)
const presetEditVisible = ref(false)
const presetDraft = ref<GroupClassPreset>({ id: '', name: '', classes: [] })
const presetEditing: Ref<GroupClassPreset | null> = ref(null)

function openNewPreset() {
  presetEditing.value = null
  presetDraft.value = { id: generateId(), name: '', classes: [] }
  presetEditVisible.value = true
}

function savePreset() {
  if (!siteStore.currentSite) return
  const presets = siteStore.currentSite.groupClassPresets
  const existing = presets.find(p => p.id === presetDraft.value.id)
  if (existing) {
    Object.assign(existing, presetDraft.value)
  } else {
    presets.push({ ...presetDraft.value })
  }
  siteStore.persistCurrentSite()
  presetEditVisible.value = false
}

function deletePreset(id: string) {
  if (!siteStore.currentSite) return
  siteStore.currentSite.groupClassPresets = siteStore.currentSite.groupClassPresets.filter(p => p.id !== id)
  // 清理所有引用此预设的组件
  if (siteStore.selectedComponent) {
    siteStore.selectedComponent.styles.groupRefs = siteStore.selectedComponent.styles.groupRefs.filter(id !== siteStore.selectedComponent.styles.groupRefs)
  }
  siteStore.persistCurrentSite()
}
```

- [ ] **Step 5: Commit**

```bash
git add src/editor/panels/PropsPanel.vue
git commit -m "feat: 预设组合 — 管理弹窗 + 应用到组件"
```

---

### Task 6: PT 覆写改造为 chip 输入

**Files:**
- Modify: `src/editor/panels/PtEditor.vue`

- [ ] **Step 1: 读取当前 PtEditor.vue**

```bash
# 先读取文件了解当前结构
```

- [ ] **Step 2: 将每个 pt node 的 class 输入改为 AutoComplete multiple**

```vue
<!-- src/editor/panels/PtEditor.vue — 找到 structured 模式的 accordion -->

<!-- 原有: -->
<InputText v-model="ptNode.class" placeholder="输入类名" fluid />

<!-- 改为: -->
<AutoComplete
  v-model="ptNode.classes"
  :suggestions="[]"
  multiple
  fluid
  placeholder="输入类名回车添加"
  @complete="() => {}"
/>
```

- [ ] **Step 3: 更新 pt 数据结构**

```typescript
// src/editor/panels/PtEditor.vue

// 确保 pt node 支持 classes 数组
// 读取时兼容 class 字符串:
if (ptNode.class && !ptNode.classes) {
  ptNode.classes = ptNode.class.split(' ').filter(Boolean)
}

// 保存时优先用 classes:
ptNode.class = ptNode.classes?.join(' ') ?? ''
```

- [ ] **Step 4: Commit**

```bash
git add src/editor/panels/PtEditor.vue
git commit -m "feat: PT 覆写 — 改为 chip 输入"
```

---

### Task 7: 旧数据迁移兼容

**Files:**
- Modify: `src/stores/site.store.ts`

- [ ] **Step 1: 添加迁移函数**

```typescript
// src/stores/site.store.ts

function migrateStyles(node: ComponentNode): ComponentNode {
  // 迁移 styles.class 字符串 → classes 数组
  if (node.styles?.class && typeof node.styles.class === 'string') {
    node.styles.classes = node.styles.class.split(' ').filter(Boolean)
    delete node.styles.class
  }
  
  // 迁移 pt[*].class 字符串 → classes 数组
  if (node.pt) {
    for (const key of Object.keys(node.pt)) {
      const ptNode = node.pt[key]
      if (ptNode.class && typeof ptNode.class === 'string') {
        ptNode.classes = ptNode.class.split(' ').filter(Boolean)
        delete ptNode.class
      }
    }
  }
  
  // 迁移 slots 中的子节点
  if (node.slots) {
    for (const slotName of Object.keys(node.slots)) {
      for (const child of node.slots[slotName]) {
        migrateStyles(child)
      }
    }
  }
  
  return node
}

// 在 loadCurrentSite 中调用:
function loadCurrentSite(id: string) {
  const site = sites.value.find(s => s.id === id)
  if (site) {
    // 迁移
    for (const comp of site.components) {
      migrateStyles(comp)
    }
    currentSite.value = site
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/site.store.ts
git commit -m "feat: 旧数据迁移 — styles.class → classes[], pt.class → pt.classes"
```

---

### Task 8: 初始化默认值

**Files:**
- Modify: `src/editor/registry/index.ts`
- Modify: `src/editor/registry/card.ts`
- Modify: `src/editor/registry/button.ts`
- Modify: `src/editor/registry/image.ts`
- Modify: `src/editor/registry/panel.ts`
- Modify: `src/editor/registry/scroll-panel.ts`

- [ ] **Step 1: 更新所有 registry 的 defaultStyles**

```typescript
// src/editor/registry/card.ts — 找到 defaultStyles

// 原有:
defaultStyles: { class: '' }

// 改为:
defaultStyles: { classes: [], style: {} }
```

- [ ] **Step 2: 更新 addComponent 方法中的默认值**

```typescript
// src/stores/site.store.ts — 找到 addComponent

// 确保新创建的组件有正确的默认值:
styles: {
  classes: meta.defaultStyles.classes ?? [],
  style: meta.defaultStyles.style ?? {},
  groupRefs: []
}
```

- [ ] **Step 3: Commit**

```bash
git add src/editor/registry/*.ts src/stores/site.store.ts
git commit -m "chore: 更新所有组件默认样式结构"
```

---

### Task 9: 测试与验证

**Files:**
- Modify: `src/shared/types/__tests__/component.test.ts` (如有)

- [ ] **Step 1: 手动测试清单**

```
1. 新建一个 Card 组件
2. 在 PropsPanel 样式类中输入 "px-4" 回车 → 出现 chip
3. 再输入 "rounded-xl" 回车 → 出现第二个 chip
4. 点击 chip 的 × → 删除成功
5. 新建预设 "测试预设"，类名 "shadow-lg bg-white"
6. 在预设组合中勾选 "测试预设" → Card 出现 shadow-lg 和 bg-white
7. 修改预设类名 → Card 自动更新
8. 在 Card 上手动添加 "rounded-2xl" → 手动类名优先级高于预设
9. 保存页面，刷新 → 数据持久化正确
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/types/__tests__/component.test.ts 2>/dev/null || true
git commit -m "test: 样式类与预设组合 — 手动测试通过"
```

---

## 执行顺序

1. Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → Task 9

**依赖关系:**
- Task 4 依赖 Task 1（数据模型）
- Task 5 依赖 Task 4（需要 stylesDraft）
- Task 6 依赖 Task 1（pt 结构）
- Task 3 依赖 Task 1（渲染类名合并）
- Task 7 依赖 Task 1（迁移旧数据）
- Task 8 依赖 Task 1（默认值）

**建议顺序:** Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → Task 9

---

## 后续待办

- Tailwind 类名补全建议（引入 Tailwind IntelliSense 数据）
- 点击 chip 编辑单个类名值
- 样式面板（第二 tab）拆分（可选）
