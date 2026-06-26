# Fix Preset Save Bugs

## 问题

### 1. DataCloneError
`presets.push({ ...presetDraft.value })` 展开 reactive proxy 后 `classes` 数组仍含 Vue/PrimeVue 内部 proxy，
`structuredClone` 无法克隆。

### 2. AutoComplete value 未清空
`presetDraft.value.classes = []` 赋值新数组，PrimeVue 内部不重渲染。

### 3. deletePreset 过早 return
`if (!siteStore.currentSite.groupClassPresets) return` 在数据不存在时跳过整段，
但 filter 操作中 `?? []` 就能安全处理。

## 改动（PropsPanel.vue）

### ① 新增 autocompleteKey ref

```ts
const autocompleteKey = ref(0)
```

### ② AutoComplete 加 :key

```vue
<AutoComplete :key="autocompleteKey" v-model="presetDraft.classes" ... />
```

### ③ savePreset 使用深度脱敏拷贝

```ts
function savePreset() {
  if (!siteStore.currentSite) return
  if (!siteStore.currentSite.groupClassPresets) {
    siteStore.currentSite.groupClassPresets = []
  }
  const presets = siteStore.currentSite.groupClassPresets
  const existing = presets.find(p => p.id === presetDraft.value.id)
  const raw = {
    id: presetDraft.value.id,
    name: presetDraft.value.name,
    classes: [...presetDraft.value.classes],  // 新数组，断开 proxy
  }
  if (existing) {
    Object.assign(existing, raw)
  } else {
    presets.push(raw)
  }
  siteStore.persistCurrentSite()
  presetDraft.value.id = generateId()
  presetDraft.value.name = ''
  presetDraft.value.classes = []
  autocompleteKey.value++  // 强制 AutoComplete 重建
}
```

### ④ deletePreset 恢复 ?? [] 防御

```ts
function deletePreset(id: string) {
  if (!siteStore.currentSite) return
  siteStore.currentSite.groupClassPresets = (siteStore.currentSite.groupClassPresets ?? []).filter(p => p.id !== id)
  ...
}
```
