<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useConfig } from '@/composables/useConfig'
import { useCheckable } from '@/composables/useCheckable'
import { useLocale } from '@/composables/useLocale'

export type SwitchVariant = 'default' | 'power'

export interface NeumorphismSwitchProps {
  /** v-model binding */
  modelValue?: boolean
  /** Whether the switch is disabled */
  disabled?: boolean
  /** Active/Checked text label */
  activeText?: string
  /** Inactive/Unchecked text label */
  inactiveText?: string
  /** Active/Checked color (CSS color value) */
  activeColor?: string
  /** Inactive/Unchecked color (CSS color value) */
  inactiveColor?: string
  /** Size of the switch */
  size?: 'small' | 'medium' | 'large'
  /** 视觉变体：default（凹陷轨道 + 弹簧滑块）/ power（电力开关，整径扳动圆钮） */
  variant?: SwitchVariant
}

const props = withDefaults(defineProps<NeumorphismSwitchProps>(), {
  modelValue: false,
  disabled: false,
})

const config = useConfig()
const { t } = useLocale()
const resolvedSize = computed(() => props.size ?? config.value.switch?.size ?? 'medium')
const resolvedVariant = computed(() => props.variant ?? config.value.switch?.variant ?? 'default')
const isPowerVariant = computed(() => resolvedVariant.value === 'power')
// 双文本缺省时提供本地化的可访问名称（无障碍门槛：交互元素必须有名称）
const resolvedAriaLabel = computed(
  () => props.activeText || props.inactiveText || t('switchToggle')
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const isChecked = computed({
  get: () => props.modelValue,
  set: value => {
    emit('update:modelValue', value)
    emit('change', value)
  },
})

// power 变体：ON 刻印闪烁方向——只在用户切换后播放一次（挂载时静置，不闪烁）
const flashDirection = ref<'on' | 'off' | null>(null)
watch(
  () => props.modelValue,
  value => {
    flashDirection.value = value ? 'on' : 'off'
  }
)

const classList = useCheckable(() => ({
  prefix: 'switch',
  isChecked: isChecked.value,
  isDisabled: props.disabled,
  size: resolvedSize.value,
  extraClasses: {
    'nm-switch--power': isPowerVariant.value,
    'nm-switch--flash-on': isPowerVariant.value && flashDirection.value === 'on',
    'nm-switch--flash-off': isPowerVariant.value && flashDirection.value === 'off',
  },
})).classList

const colorVars = computed(() => {
  const style: Record<string, string> = {}
  if (props.activeColor) style['--nm-switch-active-color'] = props.activeColor
  if (props.inactiveColor) style['--nm-switch-inactive-color'] = props.inactiveColor
  return Object.keys(style).length ? style : undefined
})

function handleChange(event: Event): void {
  const target = event.target as HTMLInputElement
  isChecked.value = target.checked
}
</script>

<template>
  <label :class="classList">
    <!-- 电力变体（variant="power"）：金属外圈 + 凹陷内腔 + 整径扳动圆钮 -->
    <template v-if="isPowerVariant">
      <input
        type="checkbox"
        role="switch"
        class="nm-switch__input"
        :checked="isChecked"
        :disabled="disabled"
        :aria-checked="isChecked"
        :aria-label="resolvedAriaLabel"
        @change="handleChange"
      />

      <span class="nm-switch__state nm-switch__state--off" aria-hidden="true">
        {{ inactiveText ?? 'OFF' }}
      </span>

      <span class="nm-switch__shell" :style="colorVars">
        <span class="nm-switch__well">
          <span class="nm-switch__face" aria-hidden="true" />
          <span class="nm-switch__dot" aria-hidden="true"><span /></span>
          <span class="nm-switch__bar" aria-hidden="true" />
          <span class="nm-switch__knob" aria-hidden="true">
            <span class="nm-switch__knob-texture" />
          </span>
        </span>
      </span>

      <span class="nm-switch__state nm-switch__state--on" aria-hidden="true">
        {{ activeText ?? 'ON' }}
      </span>
    </template>

    <!-- 默认变体：凹陷轨道 + 弹簧滑块 -->
    <template v-else>
      <span v-if="inactiveText" class="nm-switch__label nm-switch__label--inactive">
        {{ inactiveText }}
      </span>

      <span class="nm-switch__wrapper">
        <input
          type="checkbox"
          role="switch"
          class="nm-switch__input"
          :checked="isChecked"
          :disabled="disabled"
          :aria-checked="isChecked"
          :aria-label="resolvedAriaLabel"
          @change="handleChange"
        />
        <span class="nm-switch__track" aria-hidden="true" :style="colorVars">
          <span class="nm-switch__thumb">
            <slot name="thumb" :checked="isChecked">
              <span class="nm-switch__thumb-dot" />
            </slot>
          </span>
        </span>
      </span>

      <span v-if="activeText" class="nm-switch__label nm-switch__label--active">
        {{ activeText }}
      </span>
    </template>
  </label>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ==========================================
// Physics Constants
// ==========================================
// Spring curve with overshoot: peak velocity → slight overshoot → settle
$switch-spring: cubic-bezier(0.34, 1.1, 0.64, 1);

// Quick compression for active state
$switch-compress: cubic-bezier(0.4, 0, 0.2, 1);

// Smooth color/shadow transition
$switch-ambient: cubic-bezier(0.4, 0, 0.2, 1);

// power 变体：原作逐帧拟合的运动曲线（擦入 / 整径扳动共用）
$switch-power-ease: cubic-bezier(0.46, 0.03, 0.52, 0.96);
$switch-power-duration: 0.35s;

.nm-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-12);
  cursor: pointer;
  user-select: none;
  // 触屏：整行命中高度 ≥44px（轨道视觉不变）
  @include nm-touch-min(null, 44px);

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.nm-switch__label {
  font-size: var(--nm-font-base);
  transition: color 0.4s $switch-ambient;
}

.nm-switch:not(.nm-switch--checked) .nm-switch__label--inactive {
  color: var(--nm-text-primary);
}

.nm-switch:not(.nm-switch--checked) .nm-switch__label--active {
  color: var(--nm-text-secondary);
}

.nm-switch--checked .nm-switch__label--active {
  color: var(--nm-text-primary);
}

.nm-switch--checked .nm-switch__label--inactive {
  color: var(--nm-text-secondary);
}

.nm-switch__wrapper {
  position: relative;
  display: inline-block;
}

// Hide native checkbox
.nm-switch__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

// ==========================================
// Track — concave surface with breathing shadow
// ==========================================
.nm-switch__track {
  position: relative;
  display: block;
  background-color: var(--nm-surface-color);
  cursor: pointer;
  transition:
    background-color 0.45s $switch-ambient,
    box-shadow 0.45s $switch-ambient;
  @include nm-inset-strong(3px, 6px);
}

// Unchecked: subtle inner glow hint on the left
.nm-switch__track::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.45s $switch-ambient;
  background: radial-gradient(
    ellipse 80% 80% at 20% 50%,
    color-mix(in srgb, var(--nm-primary-color) 0%, transparent) 0%,
    color-mix(in srgb, var(--nm-primary-color) 0%, transparent) 100%
  );
}

// Checked: deeper inset + ambient glow
.nm-switch--checked .nm-switch__track {
  background-color: var(--nm-surface-raised);
  box-shadow:
    inset 4px 4px 8px var(--nm-shadow-dark-strong),
    inset -4px -4px 8px var(--nm-shadow-light-strong);
}

.nm-switch--checked .nm-switch__track::before {
  opacity: 0.08;
  background: radial-gradient(
    ellipse 70% 90% at 80% 50%,
    color-mix(in srgb, var(--nm-primary-color) 40%, transparent) 0%,
    transparent 70%
  );
}

// ==========================================
// Thumb — physical toggle with spring physics
// ==========================================
.nm-switch__thumb {
  --nm-switch-gap: var(--nm-spacing-xs);
  --nm-switch-shift: 0px;
  --nm-switch-stretch: 0;

  position: absolute;
  top: 50%;
  left: var(--nm-switch-gap);
  // translateX gets animated; scaleX/Y adds squash-and-stretch
  transform: translateY(-50%) translateX(var(--nm-switch-shift))
    scaleX(calc(1 + var(--nm-switch-stretch))) scaleY(calc(1 - var(--nm-switch-stretch) * 0.5));
  transform-origin: center center;
  background: linear-gradient(145deg, var(--nm-bg-color) 0%, var(--nm-surface-raised) 100%);
  border-radius: var(--nm-border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.5s $switch-spring,
    background 0.4s $switch-ambient,
    box-shadow 0.4s $switch-ambient,
    width 0.25s $switch-compress,
    height 0.25s $switch-compress;
  box-shadow:
    1px 2px 4px var(--nm-shadow-ambient-2xl),
    2px 2px 6px var(--nm-shadow-dark),
    -1px -1px 4px var(--nm-shadow-light);
}

// Default thumb dot
.nm-switch__thumb-dot {
  width: 36%;
  height: 36%;
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-switch-inactive-color, var(--nm-text-placeholder));
  transition:
    background-color 0.4s $switch-ambient,
    transform 0.3s $switch-compress;
}

.nm-switch--checked .nm-switch__thumb-dot {
  background-color: var(--nm-switch-active-color, var(--nm-primary-color));
}

// ==========================================
// Active / click feedback — squash & stretch
// ==========================================

// Pressing the track (unchecked side) → thumb compresses
.nm-switch:active:not(.nm-switch--disabled):not(.nm-switch--checked) .nm-switch__thumb {
  --nm-switch-stretch: 0.18;
  transition-duration: 0.12s;
  transition-timing-function: ease-out;
}

// Pressing the track (checked side) → thumb compresses toward left
.nm-switch:active:not(.nm-switch--disabled).nm-switch--checked .nm-switch__thumb {
  --nm-switch-stretch: 0.18;
  transition-duration: 0.12s;
  transition-timing-function: ease-out;
}

// Also trigger via the hidden checkbox for keyboard users
.nm-switch__input:active + .nm-switch__track .nm-switch__thumb {
  --nm-switch-stretch: 0.18;
  transition-duration: 0.12s;
}

// ==========================================
// Checked state — glow + shadow follow
// ==========================================
.nm-switch--checked .nm-switch__thumb {
  background: linear-gradient(145deg, var(--nm-surface-raised) 0%, var(--nm-bg-color) 100%);
  box-shadow:
    2px 2px 6px var(--nm-shadow-ambient-xl),
    3px 3px 8px var(--nm-shadow-dark),
    -1px -1px 4px var(--nm-shadow-light),
    0 0 14px color-mix(in srgb, var(--nm-primary-color) 22%, transparent),
    0 0 4px color-mix(in srgb, var(--nm-primary-color) 35%, transparent);
}

// Thumb dot pulse on checked
.nm-switch--checked .nm-switch__thumb-dot {
  transform: scale(1.15);
}

// ==========================================
// Size variants
// ==========================================
.nm-switch--small {
  .nm-switch__track {
    width: 44px;
    height: var(--nm-spacing-lg);
    border-radius: calc(24px / 2);
  }

  .nm-switch__thumb {
    width: 18px;
    height: 18px;
  }

  &.nm-switch--checked .nm-switch__thumb {
    --nm-switch-shift: 18px; // track(44) - thumb(18) - 2 * gap(4)
  }
}

.nm-switch--medium {
  .nm-switch__track {
    width: 56px;
    height: 30px;
    border-radius: calc(30px / 2);
  }

  .nm-switch__thumb {
    width: var(--nm-spacing-lg);
    height: var(--nm-spacing-lg);
  }

  &.nm-switch--checked .nm-switch__thumb {
    --nm-switch-shift: var(--nm-spacing-lg); // track(56) - thumb(24) - 2 * gap(4)
  }
}

.nm-switch--large {
  .nm-switch__track {
    width: 72px;
    height: 38px;
    border-radius: calc(38px / 2);
  }

  .nm-switch__thumb {
    width: var(--nm-spacing-xl);
    height: var(--nm-spacing-xl);
  }

  &.nm-switch--checked .nm-switch__thumb {
    --nm-switch-shift: var(--nm-spacing-xl); // track(72) - thumb(32) - 2 * gap(4)
  }
}

// ==========================================
// Color overlay layer
// ==========================================
.nm-switch__track::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--nm-switch-inactive-color, transparent);
  opacity: 0.25;
  transition:
    opacity 0.45s $switch-ambient,
    background 0.45s $switch-ambient;
  pointer-events: none;
}

.nm-switch--checked .nm-switch__track::after {
  background: var(--nm-switch-active-color, transparent);
}

// ==========================================
// Focus
// ==========================================
.nm-switch:not(.nm-switch--checked) .nm-switch__input:focus-visible + .nm-switch__track {
  box-shadow:
    0 0 0 2px var(--nm-primary-color),
    inset 3px 3px 6px var(--nm-shadow-dark-strong),
    inset -3px -3px 6px var(--nm-shadow-light-strong);
}

.nm-switch--checked .nm-switch__input:focus-visible + .nm-switch__track {
  box-shadow:
    0 0 0 2px var(--nm-primary-color),
    inset 4px 4px 8px var(--nm-shadow-dark-strong),
    inset -4px -4px 8px var(--nm-shadow-light-strong);
}

// ==========================================
// Disabled
// ==========================================
.nm-switch--disabled .nm-switch__track {
  cursor: not-allowed;
}

// ==========================================
// Power variant — 电力开关（variant="power"）
// ==========================================
// 器件质感：金属外圈 + 凹陷内腔 + 带拉丝纹理的圆钮。
// 几何按设计单位 u 缩放（171u × 91u 器件稿），u 由尺寸档位 token 提供；
// 过渡曲线为原作逐帧拟合值：通电面自左擦入、圆钮整径右移、指示点/指示条换位。
.nm-switch--power {
  --nm-switch-power-u: var(--nm-switch-power-unit-md);

  position: relative;
  gap: 0;
  color: var(--nm-switch-power-label);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;

  &.nm-switch--small {
    --nm-switch-power-u: var(--nm-switch-power-unit-sm);
  }

  &.nm-switch--large {
    --nm-switch-power-u: var(--nm-switch-power-unit-lg);
  }
}

// ---- 刻印文本（OFF / ON）：随行内联，控制整体宽度自适应 ----
.nm-switch--power .nm-switch__state {
  font-size: var(--nm-font-md);
  line-height: 1;
  white-space: nowrap;
}

.nm-switch--power.nm-switch--small .nm-switch__state {
  font-size: var(--nm-font-xs);
}

.nm-switch--power.nm-switch--large .nm-switch__state {
  font-size: var(--nm-font-xl);
}

.nm-switch--power .nm-switch__state--off {
  margin-right: calc(16 * var(--nm-switch-power-u));
}

.nm-switch--power .nm-switch__state--on {
  margin-left: calc(19 * var(--nm-switch-power-u));
}

// ---- 外圈：金属渐变，同时构成命中区 ----
.nm-switch--power .nm-switch__shell {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: calc(171 * var(--nm-switch-power-u));
  height: calc(91 * var(--nm-switch-power-u));
  padding: calc(3.66 * var(--nm-switch-power-u));
  border-radius: var(--nm-border-radius-full);
  background-image: linear-gradient(
    0deg,
    var(--nm-switch-power-rind-light),
    var(--nm-switch-power-rind-dark)
  );
}

// ---- 内腔：断电时为深色塑料面（inactiveColor 可覆写）----
.nm-switch--power .nm-switch__well {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-switch-inactive-color, var(--nm-switch-power-well));
  overflow: hidden;
}

// 四向内阴影（上重、两侧中、下轻），压出凹陷的腔体
.nm-switch--power .nm-switch__well::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background-image:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--nm-switch-power-shade) 51%, transparent) 0%,
      color-mix(in srgb, var(--nm-switch-power-shade) 50%, transparent) 4%,
      color-mix(in srgb, var(--nm-switch-power-shade) 30%, transparent) 17%,
      color-mix(in srgb, var(--nm-switch-power-shade) 10%, transparent) 31%,
      transparent 47%
    ),
    linear-gradient(
      0deg,
      color-mix(in srgb, var(--nm-switch-power-shade) 10%, transparent) 0%,
      color-mix(in srgb, var(--nm-switch-power-shade) 2%, transparent) 10%,
      transparent 16%
    ),
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--nm-switch-power-shade) 33%, transparent) 0%,
      color-mix(in srgb, var(--nm-switch-power-shade) 17%, transparent) 6.5%,
      color-mix(in srgb, var(--nm-switch-power-shade) 5%, transparent) 12%,
      transparent 20%
    ),
    linear-gradient(
      270deg,
      color-mix(in srgb, var(--nm-switch-power-shade) 33%, transparent) 0%,
      color-mix(in srgb, var(--nm-switch-power-shade) 17%, transparent) 6.5%,
      color-mix(in srgb, var(--nm-switch-power-shade) 5%, transparent) 12%,
      transparent 20%
    );
}

// ---- 通电面：自左擦入（activeColor 可覆写为器件品牌色）----
.nm-switch--power .nm-switch__face {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-switch-active-color, var(--nm-switch-power-energized));
  transform: translateX(-100%);
  transition: transform $switch-power-duration $switch-power-ease;
}

.nm-switch--power.nm-switch--checked .nm-switch__face {
  transform: translateX(0);
}

// ---- 指示点（断电时可见于腔体右侧）----
.nm-switch--power .nm-switch__dot {
  position: absolute;
  top: 50%;
  right: 15%;
  z-index: 2;
  width: calc(20 * var(--nm-switch-power-u));
  height: calc(20 * var(--nm-switch-power-u));
  margin-top: calc(-10 * var(--nm-switch-power-u));
  border-radius: 50%;
  box-shadow:
    0 calc(-2 * var(--nm-switch-power-u)) calc(2 * var(--nm-switch-power-u))
      var(--nm-switch-power-dot-highlight),
    0 calc(2 * var(--nm-switch-power-u)) calc(2 * var(--nm-switch-power-u))
      var(--nm-switch-power-dot-shadow);
  transition: transform $switch-power-duration $switch-power-ease;
}

// 内圈反向阴影：与外圈一起构成「冲压圆环」的浮雕
.nm-switch--power .nm-switch__dot span {
  position: absolute;
  inset: calc(3 * var(--nm-switch-power-u));
  border-radius: 50%;
  box-shadow:
    0 calc(2 * var(--nm-switch-power-u)) calc(2 * var(--nm-switch-power-u))
      var(--nm-switch-power-dot-highlight),
    0 calc(-2 * var(--nm-switch-power-u)) calc(2 * var(--nm-switch-power-u))
      var(--nm-switch-power-dot-shadow);
}

.nm-switch--power.nm-switch--checked .nm-switch__dot {
  transform: translateX(calc(85 * var(--nm-switch-power-u)));
}

// ---- 指示条（通电时驻留在通电面上）----
.nm-switch--power .nm-switch__bar {
  position: absolute;
  top: 50%;
  left: 14%;
  z-index: 2;
  width: calc(4 * var(--nm-switch-power-u));
  height: calc(26 * var(--nm-switch-power-u));
  margin-top: calc(-13 * var(--nm-switch-power-u));
  border-radius: var(--nm-border-radius-full);
  background-image: linear-gradient(
    180deg,
    var(--nm-switch-power-bar-highlight) 0,
    transparent 15%,
    transparent 92%,
    var(--nm-switch-power-bar-shadow) 100%
  );
  box-shadow: 0 0 1px var(--nm-switch-power-dot-shadow);
  transform: translateX(calc(-85 * var(--nm-switch-power-u)));
  transition: transform $switch-power-duration $switch-power-ease;
}

.nm-switch--power.nm-switch--checked .nm-switch__bar {
  transform: translateX(0);
}

// ---- 圆钮：整径右移完成「扳动」----
.nm-switch--power .nm-switch__knob {
  --nm-switch-power-shift: 0;
  --nm-switch-power-press: 1;

  position: absolute;
  top: calc(2 * var(--nm-switch-power-u));
  left: calc(2 * var(--nm-switch-power-u));
  z-index: 4;
  width: calc(80 * var(--nm-switch-power-u));
  height: calc(80 * var(--nm-switch-power-u));
  border-radius: 50%;
  background-image: linear-gradient(
    0deg,
    var(--nm-switch-power-knob-dark),
    var(--nm-switch-power-knob-light)
  );
  box-shadow: 0 calc(8 * var(--nm-switch-power-u)) calc(12 * var(--nm-switch-power-u))
    color-mix(in srgb, var(--nm-switch-power-shade) 60%, transparent);
  transform: translateX(calc(var(--nm-switch-power-shift) * 100%))
    scale(var(--nm-switch-power-press));
  transition:
    transform $switch-power-duration $switch-power-ease,
    opacity $switch-power-duration $switch-power-ease,
    box-shadow 0.2s ease;
}

.nm-switch--power.nm-switch--checked .nm-switch__knob {
  --nm-switch-power-shift: 1;

  opacity: 0.93;
}

// 悬停：圆钮轻微「抬起」（阴影扩散），仅在指针设备生效
@media (hover: hover) {
  .nm-switch--power:not(.nm-switch--disabled):hover .nm-switch__knob {
    box-shadow: 0 calc(8 * var(--nm-switch-power-u)) calc(15 * var(--nm-switch-power-u))
      color-mix(in srgb, var(--nm-switch-power-shade) 64%, transparent);
  }
}

// 按下：圆钮压缩 3%，松开回弹（反馈发生在操作点上）
.nm-switch--power:active:not(.nm-switch--disabled) .nm-switch__knob {
  --nm-switch-power-press: 0.97;

  transition-duration: 0.12s;
  transition-timing-function: ease-out;
}

// ---- 圆钮表面纹理：内圈拉丝纹 ----
.nm-switch--power .nm-switch__knob-texture {
  position: absolute;
  inset: calc(6.5 * var(--nm-switch-power-u));
  border-radius: 50%;
  background-image:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--nm-switch-power-knob-tex-mid) 32%, transparent) 0%,
      color-mix(in srgb, var(--nm-switch-power-knob-tex-mid) 38%, transparent) 30%,
      color-mix(in srgb, var(--nm-switch-power-knob-tex-mid) 48%, transparent) 55%,
      color-mix(in srgb, var(--nm-switch-power-knob-tex-mid) 53%, transparent) 100%
    ),
    conic-gradient(
      from 0deg at 50% 50%,
      var(--nm-switch-power-knob-tex-light) 0deg 45deg,
      var(--nm-switch-power-knob-tex-mid) 45deg 135deg,
      var(--nm-switch-power-knob-tex-dark) 135deg 225deg,
      var(--nm-switch-power-knob-tex-mid) 225deg 315deg,
      var(--nm-switch-power-knob-tex-light) 315deg 360deg
    );
  background-size:
    100% 100%,
    calc(4 * var(--nm-switch-power-u)) calc(4 * var(--nm-switch-power-u));
}

// ---- 通电后 ON 刻印闪烁并定格为通电色 ----
.nm-switch--power.nm-switch--checked .nm-switch__state--on {
  color: var(--nm-switch-power-label-on);
  text-shadow: 0 0 calc(3 * var(--nm-switch-power-u)) var(--nm-switch-power-label-on-glow);
}

.nm-switch--power.nm-switch--flash-on .nm-switch__state--on {
  animation: nm-switch-power-flash-on 0.55s 0.35s both;
}

.nm-switch--power.nm-switch--flash-off .nm-switch__state--on {
  animation: nm-switch-power-flash-off 0.6s 0.1s both;
}

@keyframes nm-switch-power-flash-on {
  0% {
    color: var(--nm-switch-power-label);
    text-shadow: none;
  }

  25% {
    color: var(--nm-switch-power-label-on);
  }

  50% {
    color: var(--nm-switch-power-label);
  }

  75% {
    color: var(--nm-switch-power-label-on);
  }

  100% {
    color: var(--nm-switch-power-label-on);
    text-shadow: 0 0 calc(3 * var(--nm-switch-power-u)) var(--nm-switch-power-label-on-glow);
  }
}

@keyframes nm-switch-power-flash-off {
  0% {
    color: var(--nm-switch-power-label-on);
    text-shadow: 0 0 calc(3 * var(--nm-switch-power-u)) var(--nm-switch-power-label-on-glow);
  }

  25% {
    color: var(--nm-switch-power-label);
  }

  50% {
    color: var(--nm-switch-power-label-on);
  }

  75% {
    color: var(--nm-switch-power-label);
  }

  100% {
    color: var(--nm-switch-power-label);
    text-shadow: none;
  }
}

// ---- 焦点环：画在外圈上（真实焦点在隐藏的 input 上）----
.nm-switch--power .nm-switch__input:focus-visible ~ .nm-switch__shell {
  outline: 2px solid var(--nm-primary-color);
  outline-offset: calc(4 * var(--nm-switch-power-u));
}

// ==========================================
// Reduced motion
// ==========================================
@media (prefers-reduced-motion: reduce) {
  .nm-switch__track,
  .nm-switch__thumb,
  .nm-switch__thumb-dot,
  .nm-switch__label,
  .nm-switch__track::before {
    transition: none !important;
  }

  .nm-switch--power .nm-switch__face,
  .nm-switch--power .nm-switch__knob,
  .nm-switch--power .nm-switch__dot,
  .nm-switch--power .nm-switch__bar {
    transition: none !important;
  }

  // 与闪烁动画同特异性 + !important，保证减少动效偏好下不播放延迟闪烁
  .nm-switch--power.nm-switch--flash-on .nm-switch__state--on,
  .nm-switch--power.nm-switch--flash-off .nm-switch__state--on {
    animation: none !important;
  }
}
</style>
