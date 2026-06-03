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
      <span class="nm-switch__track" aria-hidden="true">
        <span class="nm-switch__thumb">
          <svg
            class="nm-switch__icon nm-switch__icon--sun"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <path
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"
            />
          </svg>
          <svg
            class="nm-switch__icon nm-switch__icon--moon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            />
          </svg>
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
  position: absolute;
  top: 50%;
  left: 3px;
  transform: translateY(-50%);
  background-color: var(--nm-bg-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    left 0.35s cubic-bezier(0.4, 0.0, 0.2, 1.0),
    transform 0.35s cubic-bezier(0.4, 0.0, 0.2, 1.0),
    background-color var(--nm-transition-slow),
    box-shadow var(--nm-transition-slow);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.08),
    2px 2px 4px var(--nm-shadow-dark),
    -1px -1px 3px var(--nm-shadow-light);
}

// Icon inside thumb — both sun and moon are stacked and crossfade
.nm-switch__icon {
  position: absolute;
  width: 55%;
  height: 55%;
  color: var(--nm-text-secondary);
  transition: opacity 0.3s ease, color var(--nm-transition-slow);
}

// Sun — visible when unchecked (light mode)
.nm-switch__icon--sun {
  color: #f5b642;
  opacity: 1;

  .nm-switch--checked & {
    opacity: 0;
  }
}

// Moon — visible when checked (dark mode)
.nm-switch__icon--moon {
  opacity: 0;

  .nm-switch--checked & {
    opacity: 1;
    color: var(--nm-primary-color);
  }
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
    left: calc(100% - 19px);
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
    left: calc(100% - 27px);
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
    left: calc(100% - 35px);
  }
}

// ---------- Checked state ----------
.nm-switch--checked {
  .nm-switch__thumb {
    background-color: var(--nm-surface-raised);

    .nm-switch__icon--moon {
      color: var(--nm-primary-color);
    }
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
