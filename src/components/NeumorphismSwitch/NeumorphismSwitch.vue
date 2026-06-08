<script setup lang="ts">
import { computed } from 'vue'
import { useConfig } from '@/composables/useConfig'

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
}

const props = withDefaults(defineProps<NeumorphismSwitchProps>(), {
  modelValue: false,
  disabled: false,
  size: 'medium',
})

const config = useConfig()
const resolvedSize = computed(() => props.size ?? config.value.switch?.size ?? 'medium')

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

const classList = computed(() => [
  'nm-switch',
  `nm-switch--${resolvedSize.value}`,
  {
    'nm-switch--checked': isChecked.value,
    'nm-switch--disabled': props.disabled,
  },
])

const trackStyle = computed(() => {
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
    <span v-if="inactiveText" class="nm-switch__label nm-switch__label--inactive">
      {{ inactiveText }}
    </span>

    <span class="nm-switch__wrapper">
      <input
        type="checkbox"
        class="nm-switch__input"
        :checked="isChecked"
        :disabled="disabled"
        @change="handleChange"
      />
      <span class="nm-switch__track" aria-hidden="true" :style="trackStyle">
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

.nm-switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.nm-switch__label {
  font-size: 14px;
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
    rgba(108, 122, 224, 0) 0%,
    rgba(108, 122, 224, 0) 100%
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
    rgba(108, 122, 224, 0.4) 0%,
    transparent 70%
  );
}

// ==========================================
// Thumb — physical toggle with spring physics
// ==========================================
.nm-switch__thumb {
  --nm-switch-gap: 4px;
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
  border-radius: 50%;
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
    1px 2px 4px rgba(0, 0, 0, 0.12),
    2px 2px 6px var(--nm-shadow-dark),
    -1px -1px 4px var(--nm-shadow-light);
}

// Default thumb dot
.nm-switch__thumb-dot {
  width: 36%;
  height: 36%;
  border-radius: 50%;
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
    2px 2px 6px rgba(0, 0, 0, 0.1),
    3px 3px 8px var(--nm-shadow-dark),
    -1px -1px 4px var(--nm-shadow-light),
    0 0 14px rgba(108, 122, 224, 0.22),
    0 0 4px rgba(108, 122, 224, 0.35);
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
    height: 24px;
    border-radius: 12px;
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
    border-radius: 15px;
  }

  .nm-switch__thumb {
    width: 24px;
    height: 24px;
  }

  &.nm-switch--checked .nm-switch__thumb {
    --nm-switch-shift: 24px; // track(56) - thumb(24) - 2 * gap(4)
  }
}

.nm-switch--large {
  .nm-switch__track {
    width: 72px;
    height: 38px;
    border-radius: 19px;
  }

  .nm-switch__thumb {
    width: 32px;
    height: 32px;
  }

  &.nm-switch--checked .nm-switch__thumb {
    --nm-switch-shift: 32px; // track(72) - thumb(32) - 2 * gap(4)
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
}
</style>
