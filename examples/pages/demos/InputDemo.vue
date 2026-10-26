<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

type InputSize = 'small' | 'medium' | 'large'

/**
 * 各档位在 tokens.scss 里的基准值（高度 / 上下内边距 / 左右内边距 / 字号）。
 *
 * Input 的尺寸**不是 prop 直改**，而是由 `--nm-field-*-sm|md|lg` 这一组 token 驱动；
 * 滑块要立刻生效就必须写到**当前档位**对应的那组变量上——只写 `-md`
 * （原页面的 `inputSizeVars()` 就是这么干的）在 small / large 下会静默失效。
 */
const TIER_FIELD: Record<
  InputSize,
  { suffix: string; height: number; padY: number; padX: number; font: number }
> = {
  small: { suffix: 'sm', height: 36, padY: 6, padX: 12, font: 13 },
  medium: { suffix: 'md', height: 48, padY: 10, padX: 16, font: 14 },
  large: { suffix: 'lg', height: 60, padY: 14, padX: 20, font: 16 },
}
const HEIGHT_MIN = 32
const HEIGHT_MAX = 72

// ---- 配置台状态 ----
const value = ref('')
const size = ref<InputSize>('medium')
/** 高度基准取 medium；切档时 pickSize 会把它重置成新档位的基准 */
const height = ref(TIER_FIELD.medium.height)
const label = ref('')
const placeholder = ref('请输入内容')
const errorOn = ref(false)
const errorText = ref('请输入有效的邮箱地址')
const disabled = ref(false)
const readonly = ref(false)
const affix = ref(false)

const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

/**
 * error 支持 string | boolean 两种写法：
 * 有文案 → 红框 + 文案；开关打开但文案清空 → `true`，只染色不出文案。
 * 关闭时必须传 false（而不是 undefined）——undefined 会被 `!!error` 判成无错，
 * 但显式的 false 让「用户关掉了错误」这件事在代码里也是清楚的。
 */
const errorValue = computed<string | boolean>(() => {
  if (!errorOn.value) return false
  return errorText.value || true
})

/**
 * 高度样式：按当前档位的基准值等比缩放左右内边距与字号，几何比例保持不变。
 * 键名必须带档位后缀，否则切到 small / large 时滑块会静默失效。
 */
const previewStyle = computed(() => {
  const tier = TIER_FIELD[size.value]
  const k = height.value / tier.height
  return {
    [`--nm-field-min-height-${tier.suffix}`]: `${height.value}px`,
    [`--nm-field-padding-y-${tier.suffix}`]: `${Math.round(tier.padY * k)}px`,
    [`--nm-field-padding-x-${tier.suffix}`]: `${Math.round(tier.padX * k)}px`,
    [`--nm-field-font-${tier.suffix}`]: `${Math.max(11, Math.round(tier.font * k))}px`,
  }
})

function pickSize(next: string | number) {
  size.value = next as InputSize
  // 三档基准高度不同（36 / 48 / 60），沿用旧高度会让新档位的字号被算到离谱的缩放比
  height.value = TIER_FIELD[size.value].height
}

// ---- 状态一览 ----
interface InputConfig {
  size: InputSize
  label: string
  error: boolean
  disabled: boolean
  readonly: boolean
  affix: boolean
}

function cfg(patch: Partial<InputConfig>): InputConfig {
  return {
    size: 'medium',
    label: '',
    error: false,
    disabled: false,
    readonly: false,
    affix: false,
    ...patch,
  }
}

const presetRows: { key: string; code: string; config: InputConfig }[] = [
  { key: 'small', code: 'size="small"', config: cfg({ size: 'small' }) },
  { key: 'medium', code: 'size="medium"', config: cfg({}) },
  { key: 'large', code: 'size="large"', config: cfg({ size: 'large' }) },
  { key: 'label', code: 'label="用户名"', config: cfg({ label: '用户名' }) },
  { key: 'affix', code: '#prefix / #suffix', config: cfg({ affix: true }) },
  { key: 'error', code: 'error="…"', config: cfg({ error: true }) },
  { key: 'disabled', code: 'disabled', config: cfg({ disabled: true }) },
  { key: 'readonly', code: 'readonly', config: cfg({ readonly: true }) },
]

const current = computed<InputConfig>(() => ({
  size: size.value,
  label: label.value,
  error: errorOn.value,
  disabled: disabled.value,
  readonly: readonly.value,
  affix: affix.value,
}))

const presets = computed<DemoPreset[]>(() =>
  presetRows.map(row => {
    const target = row.config
    const now = current.value
    const active =
      target.size === now.size &&
      target.label === now.label &&
      target.error === now.error &&
      target.disabled === now.disabled &&
      target.readonly === now.readonly &&
      target.affix === now.affix
    return { key: row.key, code: row.code, active }
  })
)

function rowOf(key: string) {
  return presetRows.find(row => row.key === key)!
}

function applyPreset(key: string) {
  const next = rowOf(key).config
  size.value = next.size
  height.value = TIER_FIELD[next.size].height
  label.value = next.label
  errorOn.value = next.error
  disabled.value = next.disabled
  readonly.value = next.readonly
  affix.value = next.affix
}

/** 格子里的真实输入框：v-bind 一份组件 prop（只读格给点内容，否则看不出只读态） */
function cellProps(key: string) {
  const c = rowOf(key).config
  return {
    modelValue: c.readonly ? '只读内容' : '',
    size: c.size,
    label: c.label,
    error: c.error ? errorText.value || true : false,
    disabled: c.disabled,
    readonly: c.readonly,
    placeholder: '输入内容',
  }
}

function reset() {
  value.value = ''
  size.value = 'medium'
  height.value = TIER_FIELD.medium.height
  label.value = ''
  placeholder.value = '请输入内容'
  errorOn.value = false
  errorText.value = '请输入有效的邮箱地址'
  disabled.value = false
  readonly.value = false
  affix.value = false
}

// ---- 后续演示块独立状态 ----
const name = ref('')
const search = ref('')
const tierSmall = ref('')
const tierMedium = ref('')
const tierLarge = ref('')

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="value"']
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  if (label.value) attrs.push(`label="${label.value}"`)
  if (placeholder.value !== '请输入内容') attrs.push(`placeholder="${placeholder.value}"`)
  // error 的布尔写法必须写成 :error="true"：裸写 error 时 prop 类型是 [String, Boolean]，
  // 空串会按 String 解析成 ''（假值），红框根本不会出现
  if (errorOn.value) attrs.push(errorText.value ? `error="${errorText.value}"` : ':error="true"')
  if (disabled.value) attrs.push('disabled')
  if (readonly.value) attrs.push('readonly')

  const slots: string[] = []
  if (affix.value) {
    slots.push('  <template #prefix>\n    <NeumorphismIcon name="search" />\n  </template>')
    slots.push('  <template #suffix>\n    <NeumorphismIcon name="check" />\n  </template>')
  }

  const open = `<NeumorphismInput ${attrs.join(' ')}`
  const body = slots.length ? `${open}>\n${slots.join('\n')}\n</NeumorphismInput>` : `${open} />`
  const tier = TIER_FIELD[size.value]
  const heightNote =
    height.value !== tier.height
      ? `\n<!-- 高度经 --nm-field-min-height-${tier.suffix} 等变量调整：${height.value}px -->`
      : ''
  return `${body}${heightNote}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div class="demo-form-width" style="width: 100%">
        <NeumorphismInput
          v-model="value"
          :size="size"
          :label="label"
          :placeholder="placeholder"
          :error="errorValue"
          :disabled="disabled"
          :readonly="readonly"
          :style="previewStyle"
        >
          <template v-if="affix" #prefix>
            <NeumorphismIcon name="search" />
          </template>
          <template v-if="affix" #suffix>
            <NeumorphismIcon name="check" />
          </template>
        </NeumorphismInput>
      </div>

      <template #spec>
        size=<b>{{ size }}</b> · 高度=<b>{{ height }}px</b> · error=<b>{{
          errorOn ? (errorText ? '文案' : '布尔') : '关闭'
        }}</b>
        · 插槽=<b>{{ affix ? 'prefix + suffix' : '无' }}</b>
        <template v-if="disabled"> · disabled</template>
        <template v-if="readonly"> · readonly</template>
      </template>

      <template #hint>
        高度不是 prop：Input 的尺寸完全由 <code>--nm-field-min-height / padding / font-*</code> 这组
        token 驱动，所以滑块写的是「当前档位」对应那组变量（<code>-sm</code> / <code>-md</code> /
        <code>-lg</code>），换档时高度会回到该档位的基准值。<br />
        <code>error</code> 传字符串出文案、传 <code>true</code> 只染红框。
      </template>

      <template #config>
        <DemoField label="尺寸 size">
          <NeumorphismSegmented
            :model-value="size"
            :options="sizeOptions"
            size="small"
            @update:model-value="pickSize"
          />
        </DemoField>

        <DemoField label="高度 height" :value="`${height}px`" grow>
          <NeumorphismSlider
            v-model="height"
            :min="HEIGHT_MIN"
            :max="HEIGHT_MAX"
            :step="2"
            size="small"
          />
        </DemoField>

        <DemoField label="标签 label" grow>
          <NeumorphismInput v-model="label" size="small" placeholder="留空则不渲染标签" />
        </DemoField>

        <DemoField label="占位文案" grow>
          <NeumorphismInput v-model="placeholder" size="small" placeholder="placeholder" />
        </DemoField>

        <DemoField label="错误 error">
          <NeumorphismSwitch v-model="errorOn" size="small" />
          <span class="demo-form-label">{{
            errorOn ? (errorText ? '字符串 error' : '布尔 error') : '关闭'
          }}</span>
        </DemoField>

        <DemoField label="错误文案" grow>
          <NeumorphismInput v-model="errorText" size="small" placeholder="留空 = 只染红框" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="disabled" size="small" />
              <span>disabled</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="readonly" size="small" />
              <span>readonly</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="前缀/后缀">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="affix" size="small" />
            <span>#prefix + #suffix</span>
          </label>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">标签、前缀与后缀</h4>
    <div class="demo-row demo-row--stacked demo-form-width" style="gap: 18px">
      <NeumorphismInput v-model="name" label="用户名" placeholder="请输入用户名" :required="true" />
      <NeumorphismInput v-model="search" placeholder="搜索...">
        <template #prefix>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </template>
        <template #suffix>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </template>
      </NeumorphismInput>
    </div>
    <p class="demo-hint">
      插槽里放什么都可以：上面是原始演示的内联 SVG，配置台用的是
      <code>&lt;NeumorphismIcon&gt;</code>。带 <code>required</code> 时标签后缀会渲染一个
      <code>*</code>，同时原生 input 带上 <code>required</code> 参与表单校验。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">错误、禁用与只读</h4>
    <div class="demo-row demo-row--stacked demo-form-width" style="gap: 18px">
      <NeumorphismInput placeholder="错误状态" error="请输入有效的邮箱地址" />
      <NeumorphismInput model-value="禁用的输入框" disabled />
      <NeumorphismInput model-value="只读的内容" readonly />
    </div>
    <p class="demo-hint">
      三种「不可填」是不同的语义：<code>error</code> 只换配色与提示语（仍可继续输入），
      <code>disabled</code> 不可聚焦、不参与表单提交，<code>readonly</code>
      可聚焦可复制但不接受修改——所以禁用态比只读态明显更灰。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">尺寸三档（Token 驱动）</h4>
    <div class="demo-row demo-row--stacked demo-form-width" style="gap: 18px">
      <NeumorphismInput v-model="tierSmall" size="small" label="small · 36px" />
      <NeumorphismInput v-model="tierMedium" size="medium" label="medium · 48px" />
      <NeumorphismInput v-model="tierLarge" size="large" label="large · 60px" />
    </div>
    <p class="demo-hint">
      三档的真实差异是四组 token：<code>--nm-field-min-height-*</code>、
      <code>--nm-field-padding-y-*</code>、<code>--nm-field-padding-x-*</code>、
      <code>--nm-field-font-*</code
      >。全局改某一档就覆写这组变量，单点改一个输入框就用上方配置台那种内联写法——两者走的是同一条路径。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">状态一览（点击载入到上方预览）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <!-- 格子本身是 button，内嵌输入框只作展示：吃掉指针事件，否则点一下既载入预设又抢了焦点 -->
        <NeumorphismInput v-bind="cellProps(item.key)" style="pointer-events: none">
          <template v-if="rowOf(item.key).config.affix" #prefix>
            <NeumorphismIcon name="search" />
          </template>
          <template v-if="rowOf(item.key).config.affix" #suffix>
            <NeumorphismIcon name="check" />
          </template>
        </NeumorphismInput>
      </template>
    </DemoPresets>
    <p class="demo-hint" style="margin-top: 10px">
      <code>readonly</code> 与
      <code>disabled</code> 的区别在视觉上很轻：前者保留正常底色，后者降透明度。所以业务里不要用
      <code>disabled</code> 表达「暂不可改但需要复制」——那正是 <code>readonly</code> 的场景。
    </p>
  </div>
</template>
