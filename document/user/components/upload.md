---
id: comp-upload
title: 'NeumorphismUpload（文件上传）'
x: 2101
y: 1544
group: 使用
---

# NeumorphismUpload

> 文件上传——虚线拖拽区 / 凸起按钮两种触发器 + 三种文件列表形态，headless 逻辑由 `useUpload` 承载（类型 / 大小 / 数量校验、ObjectURL 生命周期管理）。源码：`src/components/NeumorphismUpload/`。

```vue
<NeumorphismUpload v-model="files" accept="image/*" :max-count="5" drag />
```

---

## 可配置项

### Props

| 名称             | 类型                                    | 默认值     | 说明                                                                |
| ---------------- | --------------------------------------- | ---------- | ------------------------------------------------------------------- |
| `modelValue`     | `UploadFile[]`                          | `[]`       | 绑定文件列表（v-model，双向同步）                                   |
| `accept`         | `string`                                | —          | 接受的类型，如 `"image/*,.pdf"`（MIME / 扩展名，逗号分隔）          |
| `maxSize`        | `number`                                | —          | 单文件大小上限（字节）                                              |
| `maxCount`       | `number`                                | —          | 文件数量上限（超出触发 `exceed` 事件）                              |
| `multiple`       | `boolean`                               | `false`    | 允许多选（关闭时新选择替换旧文件）                                  |
| `disabled`       | `boolean`                               | `false`    | 禁用（透明度 0.5 + 屏蔽交互）                                       |
| `drag`           | `boolean`                               | `true`     | 拖拽上传区；`false` 退化为凸起按钮，支持全局配置 `upload.drag` 级联 |
| `listType`       | `'text' \| 'picture' \| 'picture-card'` | `'text'`   | 文件列表形态，支持全局配置 `upload.listType` 级联                   |
| `showUploadList` | `boolean`                               | `true`     | 是否显示文件列表，支持全局配置 `upload.showUploadList` 级联         |
| `size`           | `'small' \| 'medium' \| 'large'`        | `'medium'` | 尺寸档位，支持全局配置 `upload.size` 级联                           |
| `autoUpload`     | `boolean`                               | `false`    | 选择后自动开始上传，支持全局配置 `upload.autoUpload` 级联           |
| `triggerText`    | `string`                                | —          | 覆盖触发器文案（缺省取 locale `uploadSelectFile`）                  |
| `dropText`       | `string`                                | —          | 覆盖拖入悬停提示（缺省取 locale `uploadDropFile`）                  |
| `removeLabel`    | `string`                                | —          | 移除按钮 aria-label（缺省取 locale `uploadRemove`）                 |
| `previewLabel`   | `string`                                | —          | 预览按钮 aria-label（缺省取 locale `uploadPreview`）                |

```ts
interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  url?: string // 图片文件的 ObjectURL 预览地址
  error?: string // 'sizeExceed' | 'typeError'
  raw?: File // 原始 File 对象
}
```

### Events / Slots

| 名称                                         | 说明                                              |
| -------------------------------------------- | ------------------------------------------------- |
| `update:modelValue(files)` / `change(files)` | 文件列表变化时同时触发（深监听）                  |
| `preview(file)`                              | 点击文件名 / 缩略图 / 卡片时触发                  |
| `remove(file)`                               | 点击移除按钮（触发后从列表移除并回收 ObjectURL）  |
| `exceed(excessCount)`                        | 选择数量超过 `maxCount` 时触发（携带超出个数）    |
| `trigger` slot                               | 自定义触发器内容，作用域 `{ dragOver, disabled }` |

---

## 列表形态

| listType       | 表现                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| `text`         | 行式列表：状态图标 + 文件名 + 大小 + 移除按钮，uploading 时底部 3px 进度条 |
| `picture`      | 行式 + 48px 缩略图，悬停缩略图浮现预览遮罩                                 |
| `picture-card` | 120px 卡片网格，悬停浮现预览 / 删除操作层，uploading 时底部进度条          |

> `picture` / `picture-card` 仅渲染有 `url` 的文件（即图片）；非图片文件请用 `text`。

```vue
<!-- 图片墙 -->
<NeumorphismUpload v-model="photos" accept="image/*" list-type="picture-card" multiple />

<!-- 自定义触发器 -->
<NeumorphismUpload v-model="files">
  <template #trigger="{ dragOver }">
    <span>{{ dragOver ? '松手上传' : '点我或拖文件进来' }}</span>
  </template>
</NeumorphismUpload>
```

全局预设：

```ts
app.use(NeumorphismUI, { upload: { drag: true, listType: 'picture-card', autoUpload: false } })
```

---

## 交互动画详解

### 校验与状态机

- `accept` 校验依次尝试 MIME（支持 `image/*` 通配）与扩展名回退；`maxSize` 超限、类型不符的文件仍会入列，但置为 `status: 'error'`（`error` 为 `'sizeExceed'` / `'typeError'`），列表项加错误描边
- `maxCount` 超限时裁剪本次选择并触发 `exceed`；`multiple: false` 时新选择先清空旧列表
- 图片文件自动生成 ObjectURL 预览；移除 / 清空 / 外部重置列表时统一回收，避免内存泄漏
- 上传进度为 `useUpload` 的模拟推进（无服务端约定），业务侧监听 `change` 后自行对接真实上传

### 触发器

- 拖拽区常态为虚线边框；hover 边框转主色；拖入悬停（dragOver）时整体下沉为凹陷槽，图标切换为「放入」并上浮 2px
- `drag: false` 时退化为凸起按钮（含 `nm-interactive` 悬停与按压缩放）
- 两种触发器均支持键盘：`Enter` / `Space` 打开文件选择器，焦点可见时绘 3px 主色环

### 列表动效

- transition-group 入场：-8px 下落 + scale 0.96→1（spring）；离场：左移 20px 淡出；重排 0.3s spring
- uploading 项整体转凹陷态，进度条主色填充并带光晕
- picture-card 悬停上浮 2px 并加深阴影

### Reduced-motion

`prefers-reduced-motion` 时：列表出入 / 重排过渡、旋转器与进度条过渡移除。

---

## 深入

- [组件总览](../components.md) — 返回全组件分类目录
- [动画效果](../animation.md) — 缓动曲线与 reduced-motion 通用约定
- [API 参考](../api.md) — 完整 Props/Events/Slots 签名与 `useUpload`
