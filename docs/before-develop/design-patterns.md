# @echolab-auto/ui-frame 设计模式

> 本文档从源码实现中提炼本项目使用的设计模式，帮助开发者在不阅读全部组件的情况下，预判新功能该如何组织。

---

## 一、模式总览

| 模式                      | 解决的问题                                 | 典型载体                                         | 相关原则             |
| ------------------------- | ------------------------------------------ | ------------------------------------------------ | -------------------- |
| **Headless UI 分离**      | 业务逻辑与视觉表现解耦                     | `src/composables/use*.ts`                        | Headless 与 UI 解耦  |
| **级联配置**              | 同一属性支持实例级、全局级、默认值三级覆盖 | `useConfig` + `useNeumorphismSetup`              | 级联配置体系         |
| **类型化 Provide/Inject** | 跨层级组件通信，避免 prop drilling         | `injectionKeys.ts` + `provide`/`inject`          | 协议化组件通信       |
| **Plugin 注册与组件覆盖** | 一次性全局注册，支持替换/扩展组件          | `src/index.ts` `install` + `ComponentRegistry`   | Headless 与 UI 解耦  |
| **Design Token**          | 视觉参数运行时可替换、主题可切换           | `src/styles/tokens.scss`                         | Token 驱动的主题系统 |
| **Barrel Export**         | 统一入口管理，按需导出                     | 各 `index.ts`                                    | —                    |
| **策略式变体渲染**        | 同一组件通过 prop 选择不同视觉策略         | `variant` / `size` / `shape` props + 条件类名    | 物理隐喻优先         |
| **组合式行为组装**        | 复杂组件由多个独立逻辑单元组合而成         | `.vue` 中组合多个 composables                    | Headless 与 UI 解耦  |
| **Registry 扩展**         | 允许使用者替换或新增组件而不改源码         | `ComponentRegistry` + `NeumorphismPluginOptions` | Headless 与 UI 解耦  |
| **运行时主题上下文**      | 主题状态在组件树内共享并响应变化           | `createTheme` / `provideTheme` / `useTheme`      | Token 驱动的主题系统 |

---

## 二、Headless UI 分离

### 意图

把「状态怎么变、键盘怎么响应、数据怎么计算」与「长成什么样」彻底分开。逻辑层不依赖任何 DOM 结构，可以被自定义 UI 复用；UI 层只负责新拟态视觉表达。

### 示例：`useSelect`

```ts
// 纯逻辑：打开/关闭、键盘导航、选中/清空
export function useSelect(opts: UseSelectOptions): UseSelectReturn {
  const isOpen = ref(false)
  const selectedOption = computed(() => options.value.find(o => o.value === modelValue.value))
  function toggleOpen() { /* ... */ }
  function handleKeydown(event: KeyboardEvent) { /* ... */ }
  return { isOpen, selectedOption, toggleOpen, handleKeydown, ... }
}
```

组件层只调用它并绑定到模板：

```vue
<script setup lang="ts">
import { useSelect } from '@/composables/useSelect'

const selectLogic = useSelect({ modelValue, options, disabled })
</script>
```

### 新增组件时的应用

1. 先识别该组件是否有可复用的纯逻辑（分页、选择、展开/折叠等）。
2. 在 `src/composables/` 创建 `useXxx.ts` 及同名 `.test.ts`。
3. 在 `.vue` 组件中引入并只处理渲染与样式。

---

## 三、级联配置

### 意图

同一属性存在三个来源时，必须按统一优先级解析，避免组件各自实现、行为不一致。

### 优先级

```
显式 prop > 全局配置 > 硬编码默认值
```

### 实现

全局配置通过 Vue Provide 注入：

```ts
// src/composables/useConfig.ts
export const ConfigKey: InjectionKey<ComputedRef<NeumorphismGlobalConfig>> =
  Symbol('nm-global-config')

export function useConfig(): ComputedRef<NeumorphismGlobalConfig> {
  return inject(
    ConfigKey,
    computed(() => ({}))
  )
}
```

组件内解析：

```ts
// src/components/NeumorphismButton/NeumorphismButton.vue
const config = useConfig()
const resolvedSize = computed(() => props.size ?? config.value.button?.size ?? 'medium')
```

扩展工具 `useNeumorphismSetup` 把三目运算封装成 `resolveProp`：

```ts
const { resolveProp } = useNeumorphismSetup()
const size = computed(() => resolveProp(props.size, config.value.button?.size, 'medium'))
```

### 新增组件时的应用

- 所有带默认值的 prop 都必须经过级联解析。
- 在 `NeumorphismGlobalConfig` interface 中新增对应配置段（如 `myComponent?: { size?: ... }`）。

---

## 四、类型化 Provide/Inject

### 意图

复杂组合关系（Form/FormItem、RadioGroup/Radio、Row/Col）不通过层层 prop 传递，而是通过在祖先组件上 `provide`、后代组件上 `inject` 类型化契约来通信。

### 实现

契约集中定义在 `src/composables/injectionKeys.ts`：

```ts
export interface FormContext {
  model: Record<string, unknown>
  rules: Record<string, FormRule[]>
  errors: Record<string, string>
  validateField: (name: string) => boolean
  registerField: (name: string, validateFn: (value: unknown) => boolean) => void
  unregisterField: (name: string) => void
}

export const FormKey: InjectionKey<FormContext> = Symbol('nm-form')
```

提供者：

```ts
// NeumorphismForm.vue
provide(FormKey, {
  get model() {
    return props.model
  },
  get rules() {
    return props.rules
  },
  errors,
  validateField,
  registerField,
  unregisterField,
})
```

消费者：

```ts
// NeumorphismFormItem.vue
const form = inject(FormKey, null)
if (form) {
  form.registerField(props.name, validate)
}
```

### 新增组件时的应用

- 若新组件需要与父组件建立隐式协作，先定义 `InjectionKey` 与 context interface。
- 用 getter 暴露响应式 prop，避免父组件替换对象后子组件读到旧值。
- 在组件卸载时清理注册（如 `unregisterField`）。

---

## 五、Plugin 注册与组件覆盖

### 意图

库作为 Vue Plugin 被 `app.use()` 安装时，一次性注册所有组件；同时允许使用者通过 `components` 选项替换或新增组件，无需 fork 源码。

### 实现

入口导出 `install`：

```ts
// src/index.ts
export function install(app: App, options?: NeumorphismPluginOptions): void {
  const { config, components: overrides, prefix } = parseOptions(options)

  if (config)
    app.provide(
      ConfigKey,
      computed(() => config)
    )

  for (const [name, component] of Object.entries(NAME_TO_COMPONENT)) {
    app.component(`${prefix}${name}`, overrides?.[name] ?? component)
  }
}

export default { install, version: '__VERSION__' }
```

使用者：

```ts
app.use(NeumorphismUI, {
  config: { button: { size: 'large' } },
  components: { NeumorphismButton: MyCustomButton },
  prefix: 'App',
})
```

### 新增组件时的应用

- 在 `src/components/` 创建组件文件夹并导出。
- 在 `src/components/index.ts` 中注册导出。
- 在 `src/index.ts` 的 `NAME_TO_COMPONENT` 映射中加入该组件。

---

## 六、Design Token

### 意图

所有视觉参数（颜色、间距、阴影、圆角、过渡时间）通过 CSS 自定义属性暴露，运行时即可切换主题或被外部覆盖，无需重新编译。

### 实现

```scss
// src/styles/tokens.scss
:root {
  --nm-bg-color: #e0e0e0;
  --nm-shadow-dark: rgba(0, 0, 0, 0.15);
  --nm-border-radius-md: 16px;
}

[data-theme='dark'] {
  --nm-bg-color: #1c1c1c;
  --nm-shadow-dark: rgba(0, 0, 0, 0.5);
}
```

组件内使用：

```scss
.nm-button {
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
}
```

### 新增组件时的应用

- 不在 SCSS 中写死颜色/间距，统一使用 `--nm-*` 变量。
- 在 `tokens.scss` 中新增该组件的 design token 段。
- 亮色与暗色主题必须同时定义。

---

## 七、Barrel Export

### 意图

每个模块通过单一 `index.ts` 汇总对外导出，调用方只需记住一个入口。

### 实现

```ts
// src/components/NeumorphismButton/index.ts
export { default } from './NeumorphismButton.vue'
export type { NeumorphismButtonProps, ButtonVariant } from './NeumorphismButton.vue'
```

```ts
// src/components/index.ts
export { default as NeumorphismButton } from './NeumorphismButton'
export type { NeumorphismButtonProps } from './NeumorphismButton'
```

```ts
// src/index.ts
export * from './components'
```

### 新增组件时的应用

- 组件文件夹必须包含 `index.ts` 作为对外入口。
- 类型定义与组件实现同步从 barrel 导出。

---

## 八、策略式变体渲染

### 意图

通过 `variant`、`size`、`shape`、`elevation` 等 prop 在运行时选择视觉策略，保证同一组件的不同变体遵循统一的物理隐喻。

### 实现

```ts
const classList = computed(() => [
  'nm-button',
  `nm-button--${resolvedVariant.value}`,
  `nm-button--${resolvedSize.value}`,
  `nm-button--${resolvedShape.value}`,
])
```

```scss
.nm-button--raised {
  box-shadow:
    4px 4px 8px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light);
}

.nm-button--pressed {
  box-shadow: inset 3px 3px 6px var(--nm-shadow-dark-deep);
}
```

### 新增组件时的应用

- 视觉变体优先用 BEM 类名（`block--modifier`）区分。
- 变体命名必须能对应物理状态：`raised` / `flat` / `pressed` / `sunk` 等。

---

## 九、组合式行为组装

### 意图

复杂组件不是一个大类，而是由多个独立、可测试的 composables 组合而成，每个 composable 负责一个职责维度。

### 典型组合

一个表单选择组件可能同时调用：

```ts
const { config, resolveProp } = useNeumorphismSetup()
const { theme, isDark } = useTheme()
const { locale, t } = useLocale()
const selectLogic = useSelect({ modelValue, options, disabled })
```

### 新增组件时的应用

- 按职责拆分：主题、国际化、配置解析、业务逻辑、无障碍。
- 每个 composable 单独测试，组件测试聚焦渲染与事件。

---

## 十、Registry 扩展

### 意图

除了 Plugin 安装时的组件覆盖，还提供一个可独立使用的运行时组件注册表，方便更复杂的扩展场景（如动态加载、主题包）。

### 实现

```ts
// src/extensions/componentRegistry.ts
export class ComponentRegistry {
  private _map = new Map<string, Component>()

  register(name: string, component: Component): this {
    this._map.set(name, component)
    return this
  }

  install(app: App, prefix = ''): this {
    for (const [name, component] of this._map) {
      app.component(`${prefix}${name}`, component)
    }
    return this
  }
}
```

### 新增组件时的应用

- 若新增的是可被替换/扩展的通用能力，考虑通过 Registry 暴露。
- 替换组件时必须保持与原组件相同的 props/events/slots 契约。

---

## 十一、运行时主题上下文

### 意图

主题不仅是静态 CSS 文件，更是一份可在运行时切换、持久化、跟随系统的响应式上下文。

### 实现

```ts
// src/composables/useTheme.ts
export function createTheme(options: ThemeOptions = {}): ThemeContext {
  const theme = ref<Theme>(stored || defaultTheme)
  const currentTheme = computed(() => (theme.value === 'auto' ? getSystemTheme() : theme.value))
  const isDark = computed(() => currentTheme.value === 'dark')

  watch(isDark, dark => applyThemeClass(dark), { immediate: true })

  return { theme, currentTheme, isDark, setTheme, toggleTheme, dispose }
}

export function provideTheme(options: ThemeOptions = {}): ThemeContext {
  const ctx = createTheme(unref(options))
  provide(ThemeKey, ctx)
  return ctx
}

export function useTheme(): ThemeContext {
  return inject(ThemeKey, null) ?? createTheme()
}
```

### 新增组件时的应用

- 组件若需根据主题调整行为（而非仅外观），使用 `useTheme()`。
- 外观变化应优先通过 CSS 变量自动响应，不依赖组件逻辑。

---

## 十二、模式组合关系

```
┌─────────────────────────────────────────────────────────────┐
│ 使用者视角                                                   │
│  app.use(NeumorphismUI, { config, components, prefix })     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌──────────┐      ┌─────────────┐      ┌──────────────┐
  │ Plugin   │      │ 级联配置     │      │ 组件覆盖      │
  │ install  │─────▶│ Provide     │      │ Component    │
  │          │      │ ConfigKey   │      │ Registry     │
  └──────────┘      └─────────────┘      └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  ┌─────────────────────┐
                  │ 组件实例             │
                  │  ├─ 解析 prop        │
                  │  ├─ 组合 composables │
                  │  ├─ inject 协议上下文│
                  │  └─ 应用 Design Token│
                  └─────────────────────┘
```

---

## 十三、新增组件时的模式 checklist

- [ ] 该组件是否有可拆分的纯逻辑？若有，先写 `useXxx.ts` 及测试。
- [ ] 所有 prop 是否按「显式 prop > 全局配置 > 默认值」解析？
- [ ] 是否在 `NeumorphismGlobalConfig` 中注册了全局配置段？
- [ ] 是否需要与父/子组件协作？若是，定义 `InjectionKey` 与 context interface。
- [ ] 视觉参数是否全部使用 `--nm-*` CSS 变量？是否在 `tokens.scss` 中定义？
- [ ] 是否在 `src/components/index.ts` 与 `src/index.ts` 中导出？
- [ ] 是否通过 barrel `index.ts` 统一导出组件与类型？
- [ ] 变体渲染是否使用 BEM modifier 类名并符合物理隐喻？
- [ ] 无障碍属性（ARIA、焦点、触控目标）是否完整？
- [ ] 示例站点是否已展示该组件？

---

> 设计原则的一句话解释见 [project.md](./project.md)。
