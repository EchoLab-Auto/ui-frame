<script setup lang="ts">
import { computed } from 'vue'

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

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const isChecked = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    emit('change', value)
  },
})

const classList = computed(() => [
  'nm-switch',
  `nm-switch--${props.size}`,
  {
    'nm-switch--checked': isChecked.value,
    'nm-switch--disabled': props.disabled,
  },
])

const trackStyle = computed(() => {
  const color = isChecked.value ? props.activeColor : props.inactiveColor
  return color ? { backgroundColor: color } : undefined
})

function handleChange(event: Event): void {
  if (props.disabled) {
    event.preventDefault()
    return
  }
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
      >
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
  color: var(--nm-text-secondary);
  transition: color var(--nm-transition-slow);

  &--active {
    color: var(--nm-text-primary);
  }
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

// Track - inset shadow
.nm-switch__track {
  position: relative;
  display: block;
  background-color: var(--nm-surface-color);
  cursor: pointer;
  transition: background-color var(--nm-transition-slow), box-shadow var(--nm-transition-slow);
  @include nm-inset-strong(3px, 6px);
}

// Thumb — raised shadow, slides with critically-damped motion (no overshoot)
.nm-switch__thumb {
  --nm-switch-gap: 3px;
  --nm-switch-shift: 0px;

  position: absolute;
  top: 50%;
  inset-inline-start: var(--nm-switch-gap);
  transform: translateY(-50%) translateX(var(--nm-switch-shift));
  background-color: var(--nm-bg-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.35s cubic-bezier(0.4, 0.0, 0.2, 1.0),
    background-color var(--nm-transition-slow),
    box-shadow var(--nm-transition-slow);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.08),
    2px 2px 4px var(--nm-shadow-dark),
    -1px -1px 3px var(--nm-shadow-light);
}

// Default thumb dot — visible when unchecked
.nm-switch__thumb-dot {
  width: 40%;
  height: 40%;
  border-radius: 50%;
  background-color: var(--nm-text-placeholder);
  transition: background-color var(--nm-transition-slow);
}

.nm-switch--checked .nm-switch__thumb-dot {
  background-color: var(--nm-primary-color);
}

// ---------- Size variants ----------

.nm-switch--small {
  .nm-switch__track {
    width: 40px;
    height: 22px;
    border-radius: 11px;
  }

  .nm-switch__thumb {
    width: 16px;
    height: 16px;
  }

  &.nm-switch--checked .nm-switch__thumb {
    --nm-switch-shift: 18px; // track(40) - thumb(16) - 2 * gap(3)
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
    --nm-switch-shift: 26px; // track(56) - thumb(24) - 2 * gap(3)
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
    --nm-switch-shift: 34px; // track(72) - thumb(32) - 2 * gap(3)
  }
}

// ---------- Checked state ----------
.nm-switch--checked {
  .nm-switch__thumb {
    background-color: var(--nm-surface-raised);
  }
}

// ---------- Focus ----------
.nm-switch__input:focus-visible + .nm-switch__track {
  box-shadow:
    0 0 0 2px var(--nm-primary-color),
    inset 3px 3px 6px var(--nm-shadow-dark-strong),
    inset -3px -3px 6px var(--nm-shadow-light-strong);
}

// ---------- Disabled ----------
.nm-switch--disabled .nm-switch__track {
  cursor: not-allowed;
}
</style>
