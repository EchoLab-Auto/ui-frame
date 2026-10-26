<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useNumberInput } from '@/composables/useNumberInput'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { FIELD_SCALE } from '@/utils/controlScales'
import NeumorphismFieldLabel from '@/components/NeumorphismField/NeumorphismFieldLabel.vue'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

defineOptions({ inheritAttrs: false })

export type NumberInputSize = 'small' | 'medium' | 'large'

export interface NeumorphismInputNumberProps {
  /** v-model binding — current number value */
  modelValue?: number
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value */
  max?: number
  /** Step increment for up/down */
  step?: number
  /** Decimal precision */
  precision?: number
  /** Whether the input is disabled */
  disabled?: boolean
  /**
   * 尺寸——px 最小高度（数字，主几何量），或三档预设名。
   *
   * 数字即「最小高度」：字号、内距与两侧步进按钮宽度按三锚点（36 / 48 / 60）
   * 分段线性插值，所以 `:size="36"` 与 `size="small"` 逐像素相同，
   * `:size="42"` 落在两者之间。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | NumberInputSize
  /** Placeholder text */
  placeholder?: string
  /** Show increment/decrement buttons */
  controls?: boolean
  /** Label text */
  label?: string
}

const props = withDefaults(defineProps<NeumorphismInputNumberProps>(), {
  modelValue: undefined,
  min: undefined,
  max: undefined,
  step: 1,
  precision: undefined,
  disabled: false,
  placeholder: '',
  controls: true,
  label: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'change', value: number | undefined): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}>()

const { config } = useNeumorphismSetup()

/** 数字尺寸的语义是「最小高度」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 48

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() => {
  const raw = props.size ?? config.value.inputNumber?.size
  return typeof raw === 'number' ? normalizeNumericSize(raw, DEFAULT_SIZE_PX) : undefined
})

// Resolve size via cascade: explicit prop > global config > hardcoded default
const resolvedSize = computed<NumberInputSize>(() => {
  const raw = props.size ?? config.value.inputNumber?.size
  return typeof raw === 'string' ? raw : 'medium'
})

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(FIELD_SCALE, numericSize.value)
)

// Resolve disabled
const disabledRef = computed(() => props.disabled)

// ==========================================
// Number input composable (headless logic)
// ==========================================

const modelValueRef = computed({
  get: () => props.modelValue,
  set: val => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

const { displayValue, increment, decrement, handleInput, handleKeydown, handleBlur } =
  useNumberInput({
    modelValue: modelValueRef,
    min: props.min,
    max: props.max,
    step: props.step,
    precision: props.precision,
    disabled: disabledRef,
  })

// ==========================================
// 边界禁用 —— 到达 min/max 时对应按钮呈禁用态（此前外观始终可点，
// 点击却无效果，affordance 与实际行为矛盾）。空值视为可操作
// ==========================================
const canDecrement = computed(
  () => props.modelValue === undefined || props.modelValue > (props.min ?? -Infinity)
)
const canIncrement = computed(
  () => props.modelValue === undefined || props.modelValue < (props.max ?? Infinity)
)

// ==========================================
// 长按连续步进 —— 对齐原生 spinner 与键盘长按（方向键有系统级重复）。
// pointerdown 立即步进一次，400ms 后每 80ms 步进；抬起/取消/移出即停
// ==========================================
const REPEAT_DELAY = 400
const REPEAT_INTERVAL = 80
let repeatDelayId: number | undefined
let repeatTimerId: number | undefined

function stopRepeat(): void {
  if (repeatDelayId !== undefined) {
    clearTimeout(repeatDelayId)
    repeatDelayId = undefined
  }
  if (repeatTimerId !== undefined) {
    clearInterval(repeatTimerId)
    repeatTimerId = undefined
  }
}

function startRepeat(action: () => void): void {
  stopRepeat()
  action()
  repeatDelayId = window.setTimeout(() => {
    repeatTimerId = window.setInterval(action, REPEAT_INTERVAL)
  }, REPEAT_DELAY)
}

onBeforeUnmount(stopRepeat)

// ==========================================
// CSS class list
// ==========================================

const classList = computed(() => [
  'nm-input-number',
  numericSize.value === undefined
    ? `nm-input-number--${resolvedSize.value}`
    : 'nm-input-number--sized',
  {
    'nm-input-number--disabled': props.disabled,
    'nm-input-number--has-controls': props.controls,
  },
])

// ==========================================
// Blur handler (delegate to composable + emit)
// ==========================================

function onBlur(event: FocusEvent): void {
  handleBlur()
  emit('blur', event)
}

function onFocus(event: FocusEvent): void {
  emit('focus', event)
}
</script>

<template>
  <div :class="classList" :style="sizeStyle">
    <NeumorphismFieldLabel :label="label" :for-id="undefined" />

    <div class="nm-input-number__body">
      <!-- Decrement button -->
      <button
        v-if="controls"
        type="button"
        class="nm-input-number__btn nm-input-number__btn--decrement"
        :disabled="disabled || !canDecrement"
        :aria-label="'Decrement'"
        tabindex="-1"
        @pointerdown.prevent="startRepeat(decrement)"
        @pointerup="stopRepeat"
        @pointercancel="stopRepeat"
        @pointerleave="stopRepeat"
        @dblclick.prevent
      >
        <span class="nm-input-number__btn-icon" aria-hidden="true">
          <NeumorphismIcon name="minus" size="md" />
        </span>
      </button>

      <!-- Input field -->
      <div class="nm-input-number__input-wrapper">
        <input
          type="text"
          inputmode="decimal"
          class="nm-input-number__input"
          :value="displayValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :aria-disabled="disabled || undefined"
          @input="handleInput"
          @keydown="handleKeydown"
          @blur="onBlur"
          @focus="onFocus"
        />
      </div>

      <!-- Increment button -->
      <button
        v-if="controls"
        type="button"
        class="nm-input-number__btn nm-input-number__btn--increment"
        :disabled="disabled || !canIncrement"
        :aria-label="'Increment'"
        tabindex="-1"
        @pointerdown.prevent="startRepeat(increment)"
        @pointerup="stopRepeat"
        @pointercancel="stopRepeat"
        @pointerleave="stopRepeat"
        @dblclick.prevent
      >
        <span class="nm-input-number__btn-icon" aria-hidden="true">
          <NeumorphismIcon name="plus" size="md" />
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ==========================================
// Physics Constants
// ==========================================
$number-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
$number-compress: cubic-bezier(0.4, 0, 0.2, 1);
$number-ambient: cubic-bezier(0.4, 0, 0.2, 1);

// ==========================================
// Wrapper
// ==========================================
.nm-input-number {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  width: 100%;
}

// ==========================================
// Body (input + buttons)
// ==========================================
.nm-input-number__body {
  display: flex;
  align-items: stretch;
  width: 100%;
  border-radius: var(--nm-border-radius-md);
  overflow: hidden;
  transition: box-shadow 0.3s $number-spring;

  // 焦点外环必须绘在 body 层：input-wrapper 的外阴影会被 body 的
  // overflow:hidden 裁掉上下两边（右侧还会被 + 按钮盖住），只剩左接缝
  // 一小段残影；body 自身的外阴影不受自身 overflow 影响，整圈包住控件
  &:focus-within {
    box-shadow: 0 0 0 3px var(--nm-primary-color);
  }
}

// ==========================================
// Input wrapper
// ==========================================
.nm-input-number__input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: var(--nm-surface-color);
  min-width: 0;
  @include nm-inset(4px, 8px);
  transition:
    box-shadow 0.35s $number-spring,
    background-color 0.3s $number-ambient;

  &:focus-within {
    // 仅保留凹陷加深（"预压"物理隐喻）；外发光环由 body 层承担
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light);
    transition:
      box-shadow 0.3s $number-spring,
      background-color 0.3s $number-ambient;
  }
}

// ==========================================
// Input field
// ==========================================
.nm-input-number__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--nm-text-primary);
  font-family: inherit;
  font-size: var(--nm-font-base);
  width: 100%;
  text-align: center;
  min-width: 0;

  &::placeholder {
    color: var(--nm-text-placeholder);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--nm-text-disabled);
  }
}

// ==========================================
// Buttons (increment / decrement)
// ==========================================
.nm-input-number__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  background-color: var(--nm-surface-color);
  color: var(--nm-text-primary);
  flex-shrink: 0;
  @include nm-raised(3px, 6px);
  transition:
    box-shadow 0.35s $number-spring,
    transform 0.25s $number-compress,
    background-color 0.3s $number-ambient,
    color 0.2s $number-ambient;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      color: var(--nm-primary-color);
      transform: translateY(-1px);
      box-shadow:
        4px 4px 8px var(--nm-shadow-dark),
        -4px -4px 8px var(--nm-shadow-light);
    }
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
    @include nm-inset(3px, 6px);
    transition:
      box-shadow 0.12s $number-compress,
      transform 0.12s $number-compress;
    color: var(--nm-primary-dark);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    box-shadow: none;
  }
}

.nm-input-number__btn--decrement {
  border-radius: var(--nm-border-radius-md) 0 0 var(--nm-border-radius-md);
}

.nm-input-number__btn--increment {
  border-radius: 0 var(--nm-border-radius-md) var(--nm-border-radius-md) 0;
}

.nm-input-number__btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  user-select: none;
  pointer-events: none;
}

// ==========================================
// Disabled state
// ==========================================
.nm-input-number--disabled {
  // 整体禁用：输入槽与按钮统一 0.6（此前 0.6/0.5 不一，整组发灰不均）
  .nm-input-number__input-wrapper,
  .nm-input-number__btn {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .nm-input-number__input {
    cursor: not-allowed;
  }
}

// ==========================================
// Size variants
// ==========================================
.nm-input-number--small {
  .nm-input-number__input-wrapper {
    min-height: var(--nm-field-min-height-sm);
  }

  .nm-input-number__input {
    padding: var(--nm-field-padding-y-sm) var(--nm-field-padding-x-sm);
    font-size: var(--nm-field-font-sm);
  }

  .nm-input-number__btn {
    width: var(--nm-field-min-height-sm);
  }

  .nm-input-number__btn-icon svg {
    width: var(--nm-icon-size-sm);
    height: var(--nm-icon-size-sm);
  }
}

.nm-input-number--medium {
  .nm-input-number__input-wrapper {
    min-height: var(--nm-field-min-height-md);
  }

  .nm-input-number__input {
    padding: var(--nm-field-padding-y-md) var(--nm-field-padding-x-md);
    font-size: var(--nm-field-font-md);
  }

  .nm-input-number__btn {
    width: var(--nm-field-min-height-md);
  }

  .nm-input-number__btn-icon svg {
    width: var(--nm-icon-size-md);
    height: var(--nm-icon-size-md);
  }
}

.nm-input-number--large {
  .nm-input-number__input-wrapper {
    min-height: var(--nm-field-min-height-lg);
  }

  .nm-input-number__input {
    padding: var(--nm-field-padding-y-lg) var(--nm-field-padding-x-lg);
    font-size: var(--nm-field-font-lg);
  }

  .nm-input-number__btn {
    width: var(--nm-field-min-height-lg);
  }

  .nm-input-number__btn-icon svg {
    width: var(--nm-icon-size-lg);
    height: var(--nm-icon-size-lg);
  }
}

// 数字尺寸（`:size="42"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类，所以不存在覆盖之争。
// 步进按钮内的图标没有对应的 sz 变量（不随 field 锚点走），保持基础档
.nm-input-number--sized {
  .nm-input-number__input-wrapper {
    min-height: var(--nm-field-sz-height);
  }

  .nm-input-number__input {
    padding: var(--nm-field-sz-pad-y) var(--nm-field-sz-pad-x);
    font-size: var(--nm-field-sz-font);
  }

  .nm-input-number__btn {
    width: var(--nm-field-sz-height);
  }
}

// ==========================================
// Reduced motion
// ==========================================
@media (prefers-reduced-motion: reduce) {
  .nm-input-number__input-wrapper,
  .nm-input-number__btn {
    transition: none !important;
    animation: none !important;
  }

  @media (hover: hover) {
    .nm-input-number__btn:hover:not(:disabled) {
      transform: none;
    }
  }

  .nm-input-number__btn:active:not(:disabled) {
    transform: none;
  }
}
</style>
