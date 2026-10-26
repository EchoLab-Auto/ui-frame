<script setup lang="ts">
import { computed, useSlots, useAttrs } from 'vue'
import { useFormField } from '@/composables/useFormField'
import { useConfig } from '@/composables/useConfig'
import { isImeComposing } from '@/composables/useChatInput'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { FIELD_SCALE } from '@/utils/controlScales'
import NeumorphismFieldLabel from '@/components/NeumorphismField/NeumorphismFieldLabel.vue'
import NeumorphismFieldError from '@/components/NeumorphismField/NeumorphismFieldError.vue'

defineOptions({ inheritAttrs: false })

export type InputSize = 'small' | 'medium' | 'large'

export interface NeumorphismInputProps {
  modelValue?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /**
   * 尺寸——px 最小高度（数字，主几何量），或三档预设名。
   *
   * 数字即「最小高度」：字号、内距与前后缀内距按三锚点（36 / 48 / 60）
   * 分段线性插值，所以 `:size="36"` 与 `size="small"` 逐像素相同，
   * `:size="42"` 落在两者之间。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | InputSize
  maxlength?: number | string
  minlength?: number | string
  name?: string
  id?: string
  autocomplete?: string
  inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  error?: string | boolean
  label?: string
  /** Enable floating label: label starts as placeholder and floats up on focus/value */
  floatingLabel?: boolean
}

const props = withDefaults(defineProps<NeumorphismInputProps>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  autocomplete: 'off',
})

const config = useConfig()

/** 数字尺寸的语义是「最小高度」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 48

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() => {
  const raw = props.size ?? config.value.input?.size
  return typeof raw === 'number' ? normalizeNumericSize(raw, DEFAULT_SIZE_PX) : undefined
})

const resolvedSize = computed<InputSize>(() => {
  const raw = props.size ?? config.value.input?.size
  return typeof raw === 'string' ? raw : 'medium'
})

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(FIELD_SCALE, numericSize.value)
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'input', event: Event): void
  (e: 'change', event: Event): void
  (e: 'keydown', event: KeyboardEvent): void
  (e: 'enter', value: string): void
}>()

const slots = useSlots()
const attrs = useAttrs()

const inputAttrs = computed(() => {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(attrs)) {
    if (key !== 'class' && key !== 'style') {
      result[key] = attrs[key]
    }
  }
  return result
})

const { fieldId, isFocused, errorMessage, baseClassList, handleFocus, handleBlur } = useFormField(
  () => ({
    id: props.id,
    // 数字直接交给 useFormField 判 `--sized` 档；它只决定 class，几何量在内联变量里
    size: numericSize.value ?? resolvedSize.value,
    disabled: props.disabled,
    error: props.error,
    prefix: 'input',
  })
)

const hasValue = computed(() => props.modelValue.length > 0)

const classList = computed(() => [
  ...baseClassList('nm-input').value,
  {
    'nm-input--readonly': props.readonly,
    'nm-input--has-prefix': !!slots.prefix,
    'nm-input--has-suffix': !!slots.suffix,
    'nm-input--has-label': !!props.label,
    'nm-input--filled': hasValue.value,
  },
])

const isFloatingLabel = computed(() => props.floatingLabel && !!props.label)

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emit('input', event)
}

function handleChange(event: Event): void {
  emit('change', event)
}

function handleKeydown(event: KeyboardEvent): void {
  emit('keydown', event)
  if (event.key === 'Enter') {
    // IME 组合输入中（如中文输入法回车选字）不触发 enter
    if (isImeComposing(event)) return
    emit('enter', props.modelValue)
  }
}
</script>

<template>
  <div class="nm-input__wrapper" :class="attrs.class" :style="attrs.style">
    <NeumorphismFieldLabel
      v-if="!isFloatingLabel"
      :label="label"
      :required="required"
      :for-id="fieldId"
    />

    <div :class="classList" :style="sizeStyle">
      <!-- Floating label: animates from placeholder position to above the field -->
      <span
        v-if="isFloatingLabel"
        :class="[
          'nm-input__floating-label',
          { 'nm-input__floating-label--active': hasValue || isFocused },
        ]"
      >
        {{ label }}<span v-if="required" class="nm-input__floating-required"> *</span>
      </span>
      <div v-if="$slots.prefix" class="nm-input__prefix">
        <slot name="prefix" />
      </div>

      <input
        :id="fieldId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxlength"
        :minlength="minlength"
        :name="name"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :aria-invalid="!!error"
        :aria-errormessage="errorMessage ? `${fieldId}-error` : undefined"
        :aria-describedby="errorMessage ? `${fieldId}-error` : undefined"
        class="nm-input__field"
        v-bind="inputAttrs"
        @input="handleInput"
        @change="handleChange"
        @focus="(e: FocusEvent) => handleFocus(e, emit)"
        @blur="(e: FocusEvent) => handleBlur(e, emit)"
        @keydown="handleKeydown"
      />

      <div v-if="$slots.suffix" class="nm-input__suffix">
        <slot name="suffix" />
      </div>
    </div>

    <NeumorphismFieldError :id="`${fieldId}-error`" :message="errorMessage" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-input__wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  width: 100%;
}

.nm-input {
  display: flex;
  align-items: center;
  width: 100%;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  // hidden 兜底旧浏览器；clip 不创建滚动容器 —— iOS 聚焦内部 input 时
  // 不会被自动 scrollIntoView 顶出 1px 位移（圆角处露出接缝）
  overflow: hidden;
  overflow: clip;
  // iOS 上非交互元素不触发 :active（按压凹陷反馈）；cursor: text 让容器
  // 进入可点击判定，桌面光标语义也更准确
  cursor: text;
  @include nm-inset(4px, 8px);
  transition:
    box-shadow 0.35s $nm-ease-spring,
    background-color var(--nm-transition-slow),
    transform 0.3s $nm-ease-spring;

  @media (hover: hover) {
    &:not(.nm-input--disabled):not(.nm-input--focused):hover {
      box-shadow:
        inset 5px 5px 10px var(--nm-shadow-dark),
        inset -5px -5px 10px var(--nm-shadow-light);
      transform: translateY(-1px);
    }
  }

  // 按下：凹陷即时加深并落回基准（触屏也有按压反馈）
  &:active:not(.nm-input--disabled):not(.nm-input--focused) {
    box-shadow:
      inset 6px 6px 12px var(--nm-shadow-dark),
      inset -6px -6px 12px var(--nm-shadow-light);
    transform: translateY(0);
  }

  &--focused {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light),
      0 0 0 3px var(--nm-primary-color);
    transition:
      box-shadow 0.3s $nm-ease-spring,
      background-color var(--nm-transition-slow),
      transform 0.3s $nm-ease-spring;
    transform: translateY(-1px);
  }

  &--error {
    box-shadow:
      inset 4px 4px 8px var(--nm-shadow-dark),
      inset -4px -4px 8px var(--nm-shadow-light),
      0 0 0 2px var(--nm-color-error);

    &.nm-input--focused {
      box-shadow:
        inset 5px 5px 10px var(--nm-shadow-dark),
        inset -5px -5px 10px var(--nm-shadow-light),
        0 0 0 3px var(--nm-color-error);
    }
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  // Error shake animation
  &--error-shake {
    animation: nm-input-shake 0.4s $nm-ease-compress;
  }
}

@keyframes nm-input-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-input {
    transition: none;
  }
  .nm-input--error-shake {
    animation: none;
  }
}

.nm-input__field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--nm-text-primary);
  font-family: inherit;
  font-size: var(--nm-font-base);
  width: 100%;

  &::placeholder {
    color: var(--nm-text-placeholder);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

// Size variants
.nm-input--small {
  min-height: var(--nm-field-min-height-sm);
  .nm-input__field {
    padding: var(--nm-field-padding-y-sm) var(--nm-field-padding-x-sm);
    font-size: var(--nm-field-font-sm);
  }
  .nm-input__prefix,
  .nm-input__suffix {
    padding: var(--nm-field-padding-y-sm) var(--nm-field-affix-padding-x-sm);
  }
}

.nm-input--medium {
  min-height: var(--nm-field-min-height-md);
  .nm-input__field {
    padding: var(--nm-field-padding-y-md) var(--nm-field-padding-x-md);
    font-size: var(--nm-field-font-md);
  }
  .nm-input__prefix,
  .nm-input__suffix {
    padding: var(--nm-field-padding-y-md) var(--nm-field-affix-padding-x-md);
  }
}

.nm-input--large {
  min-height: var(--nm-field-min-height-lg);
  .nm-input__field {
    padding: var(--nm-field-padding-y-lg) var(--nm-field-padding-x-lg);
    font-size: var(--nm-field-font-lg);
  }
  .nm-input__prefix,
  .nm-input__suffix {
    padding: var(--nm-field-padding-y-lg) var(--nm-field-affix-padding-x-lg);
  }
}

// 数字尺寸（`:size="42"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类，所以不存在覆盖之争。
.nm-input--sized {
  min-height: var(--nm-field-sz-height);
  .nm-input__field {
    padding: var(--nm-field-sz-pad-y) var(--nm-field-sz-pad-x);
    font-size: var(--nm-field-sz-font);
  }
  .nm-input__prefix,
  .nm-input__suffix {
    padding: var(--nm-field-sz-pad-y) var(--nm-field-sz-affix-x);
  }
}

.nm-input__prefix,
.nm-input__suffix {
  display: flex;
  align-items: center;
  color: var(--nm-text-secondary);
  flex-shrink: 0;
}

.nm-input__prefix {
  padding-right: 0;
}
.nm-input__suffix {
  padding-left: 0;
}

// ---- Floating label ----
.nm-input__floating-label {
  position: absolute;
  left: var(--nm-field-padding-x-md);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: var(--nm-font-base);
  color: var(--nm-text-placeholder);
  transition:
    top 0.25s $nm-ease-spring,
    left 0.25s $nm-ease-spring,
    font-size 0.25s $nm-ease-spring,
    color 0.25s $nm-ease-spring,
    transform 0.25s $nm-ease-spring;

  &--active {
    top: 6px;
    left: var(--nm-field-padding-x-md);
    transform: translateY(0);
    font-size: var(--nm-font-xs);
    color: var(--nm-primary-color);
  }
}

.nm-input__floating-required {
  color: var(--nm-color-error);
}

.nm-input--floating {
  .nm-input__field {
    padding-top: calc(var(--nm-field-padding-y-md) + var(--nm-spacing-6));
  }
}

// Size variants for floating label
.nm-input--small .nm-input__floating-label {
  left: var(--nm-field-padding-x-sm);
  &--active {
    font-size: var(--nm-font-xs);
    top: 2px;
  }
}
.nm-input--small.nm-input--floating .nm-input__field {
  padding-top: calc(var(--nm-field-padding-y-sm) + var(--nm-spacing-xs));
}

.nm-input--large .nm-input__floating-label {
  left: var(--nm-field-padding-x-lg);
  &--active {
    top: 8px;
  }
}
.nm-input--large.nm-input--floating .nm-input__field {
  padding-top: calc(var(--nm-field-padding-y-lg) + var(--nm-spacing-sm));
}

// 数字尺寸下的浮动标签：横向起点与「标签带」留白都跟着 sz 变量走
.nm-input--sized .nm-input__floating-label {
  left: var(--nm-field-sz-pad-x);
}

// 档位里这段留白恒等于 1.5 × pad-y + 1px（6 / 10 / 14 → 10 / 16 / 22），
// 按同一关系由 sz 变量重算，锚点处与三档逐像素一致
.nm-input--sized.nm-input--floating .nm-input__field {
  padding-top: calc(var(--nm-field-sz-pad-y) * 1.5 + 1px);
}

// 上浮位置在三档上是 2 / 6 / 8，对 pad-y（6 / 10 / 14）不是一条直线（前段斜率 1、
// 后段 0.5），用两段线性取小拼出分段插值——小尺寸下标签才不会压住输入文字
.nm-input--sized .nm-input__floating-label--active {
  top: min(calc(var(--nm-field-sz-pad-y) - 4px), calc(var(--nm-field-sz-pad-y) * 0.5 + 1px));
}

.nm-input--error .nm-input__floating-label--active {
  color: var(--nm-color-error);
}

@media (prefers-reduced-motion: reduce) {
  .nm-input__floating-label {
    transition: none;
  }
}
</style>
