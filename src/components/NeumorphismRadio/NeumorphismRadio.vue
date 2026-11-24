<script setup lang="ts">
import { computed, inject, useAttrs } from 'vue'
import { useCheckable } from '@/composables/useCheckable'
import { RadioGroupKey } from '@/composables/injectionKeys'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { RADIO_SCALE } from '@/utils/controlScales'

defineOptions({ inheritAttrs: false })

export interface NeumorphismRadioProps {
  modelValue?: unknown
  value: unknown
  disabled?: boolean
  label?: string
  /**
   * 尺寸——圆圈（radio 圆点整体）直径 px（数字，主几何量）。
   *
   * 数字即「圆圈直径」：按锚点表（18 / 24 / 30）插值，内部圆点取圈的 50%，
   * 所以 `:size="24"` 即设计稿 `md` 档的实测值。
   */
  size?: number
  name?: string
  id?: string
}

const props = withDefaults(defineProps<NeumorphismRadioProps>(), {
  disabled: false,
})

const { config } = useNeumorphismSetup()

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
  (e: 'change', value: unknown): void
}>()

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

const radioGroup = inject(RadioGroupKey, null)

const isChecked = computed(() => {
  if (radioGroup) return radioGroup.modelValue.value === props.value
  return props.modelValue === props.value
})

const isDisabled = computed(() => props.disabled || radioGroup?.disabled.value || false)
/**
 * 尺寸（px）：Group 级联 > 自身 prop > 全局配置 `radio.size` > 锚点 `md`。
 *
 * 级联优先级放最前，`RadioGroup` 的 size 才能真正覆盖子项——数字也走同一条路，
 * 子项收到后自己按 `RADIO_SCALE` 插值。
 */
const numericSize = computed(() =>
  normalizeNumericSize(
    radioGroup?.size.value ?? props.size ?? config.value.radio?.size,
    RADIO_SCALE.primary.md
  )
)

/** 尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() => resolveControlScale(RADIO_SCALE, numericSize.value))

const { inputId, classList } = useCheckable(() => ({
  prefix: 'radio',
  isChecked: isChecked.value,
  isDisabled: isDisabled.value,
  extraClasses: { 'nm-radio--sized': true },
}))

function handleChange(): void {
  if (isDisabled.value) return
  if (radioGroup) {
    radioGroup.setValue(props.value)
  } else {
    emit('update:modelValue', props.value)
    emit('change', props.value)
  }
}
</script>

<template>
  <label :class="[classList, attrs.class]" :style="[attrs.style, sizeStyle]" :for="inputId">
    <span class="nm-radio__input-wrapper">
      <input
        :id="inputId"
        type="radio"
        class="nm-radio__input"
        :checked="isChecked"
        :disabled="isDisabled"
        :name="radioGroup?.name.value || name"
        :value="value"
        v-bind="inputAttrs"
        @change="handleChange"
      />
      <span class="nm-radio__circle" aria-hidden="true">
        <span class="nm-radio__dot" />
      </span>
    </span>
    <span v-if="label || $slots.default" class="nm-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/styles/_checkable.scss' as *;

@include checkable-root('radio');
@include checkable-input-wrapper('radio');
@include checkable-hidden-input('radio');
@include checkable-indicator-base('radio', 'circle');
@include checkable-label('radio');
@include checkable-focus-ring('radio', 'circle');

// Radio-specific: circle + dot
.nm-radio__circle {
  border-radius: var(--nm-border-radius-full);
  position: relative;
  overflow: hidden;
}

// Ripple burst on select
.nm-radio__circle::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--nm-primary-color) 30%, transparent) 0%,
    transparent 70%
  );
  opacity: 0;
  transform: scale(0);
  transition: none;
}

.nm-radio--checked .nm-radio__circle::after {
  animation: nm-radio-ripple 0.45s $nm-ease-decelerate;
}

.nm-radio__dot {
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-primary-color);
  transform: scale(0);
  @include nm-raised(1px, 2px);
  transition: transform 0.4s $nm-ease-bounce;
}

.nm-radio--checked .nm-radio__dot {
  transform: scale(1);
}

// Glow ring on checked
.nm-radio--checked .nm-radio__circle {
  box-shadow:
    inset 2px 2px 4px var(--nm-shadow-dark),
    inset -2px -2px 4px var(--nm-shadow-light),
    0 0 0 2px color-mix(in srgb, var(--nm-primary-color) 15%, transparent);
}

// Hover physics
@media (hover: hover) {
  .nm-radio:not(.nm-radio--disabled):hover .nm-radio__circle {
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark),
      inset -3px -3px 6px var(--nm-shadow-light);
  }
}

@media (hover: hover) {
  .nm-radio:not(.nm-radio--disabled):hover .nm-radio__dot {
    filter: brightness(1.1);
  }
}

// Active press feedback
.nm-radio:not(.nm-radio--disabled):active .nm-radio__circle {
  transform: scale(0.94);
  transition: transform 0.1s $nm-ease-compress;
}

@keyframes nm-radio-ripple {
  0% {
    opacity: 0.5;
    transform: scale(0);
  }
  100% {
    opacity: 0;
    transform: scale(2.5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-radio__dot {
    transition: none;
    transform: scale(1);
  }
  .nm-radio--checked .nm-radio__circle::after {
    animation: none;
  }
  .nm-radio:not(.nm-radio--disabled):active .nm-radio__circle {
    transform: none;
  }
}

// Sizes (with dot dimensions)
.nm-radio--small {
  .nm-radio__circle {
    width: 18px;
    height: 18px;
  }
  .nm-radio__dot {
    width: var(--nm-spacing-sm);
    height: var(--nm-spacing-sm);
  }
}
.nm-radio--medium {
  .nm-radio__circle {
    width: var(--nm-spacing-lg);
    height: var(--nm-spacing-lg);
  }
  .nm-radio__dot {
    width: 12px;
    height: 12px;
  }
}
.nm-radio--large {
  .nm-radio__circle {
    width: 30px;
    height: 30px;
  }
  .nm-radio__dot {
    width: var(--nm-spacing-md);
    height: var(--nm-spacing-md);
  }
}

// ---------- 数字尺寸（`:size="20"`）----------
// 变量由根节点内联下发（见 utils/controlScale），规则落在子选择器上：
// 圈与圆点都在内部。与三档 class 互斥，不存在覆盖之争。
.nm-radio--sized .nm-radio__circle {
  width: var(--nm-radio-sz-box);
  height: var(--nm-radio-sz-box);
}

.nm-radio--sized .nm-radio__dot {
  // 圆点有独立锚点（8 / 12 / 16，三档走 spacing token），不是圆圈的等比缩放——
  // 取 50% 会在 small / large 各差 1px，锚点等价就断了。
  width: var(--nm-radio-sz-dot);
  height: var(--nm-radio-sz-dot);
}
</style>
