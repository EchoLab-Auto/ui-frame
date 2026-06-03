<script setup lang="ts">
import { computed } from 'vue'
import type { Theme } from '@/composables/useTheme'

export interface NeumorphismThemeToggleProps {
  /** v-model binding: 'light' | 'dark' | 'auto' */
  modelValue?: Theme
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
  /** Whether to disable auto mode option */
  disableAuto?: boolean
  /** Whether the toggle is disabled */
  disabled?: boolean
}

const props = withDefaults(defineProps<NeumorphismThemeToggleProps>(), {
  modelValue: 'auto',
  size: 'medium',
  disableAuto: false,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Theme): void
  (e: 'change', value: Theme): void
}>()

const options = computed<{ value: Theme; label: string }[]>(() => {
  const items = [
    { value: 'light' as Theme, label: '亮色' },
    { value: 'auto' as Theme, label: '自动' },
    { value: 'dark' as Theme, label: '暗色' },
  ]
  if (props.disableAuto) {
    return items.filter((i) => i.value !== 'auto')
  }
  return items
})

const classList = computed(() => [
  'nm-theme-toggle',
  `nm-theme-toggle--${props.size}`,
  {
    'nm-theme-toggle--disabled': props.disabled,
  },
])

function selectTheme(value: Theme) {
  if (props.disabled) return
  if (value === props.modelValue) return
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <div :class="classList" role="radiogroup" :aria-label="'主题切换'">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="nm-theme-toggle__btn"
      :class="{
        'nm-theme-toggle__btn--active': modelValue === opt.value,
      }"
      :aria-pressed="modelValue === opt.value"
      :disabled="disabled"
      @click="selectTheme(opt.value)"
    >
      <!-- Light icon: sun -->
      <svg
        v-if="opt.value === 'light'"
        class="nm-theme-toggle__icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <path stroke="currentColor" stroke-width="2" stroke-linecap="round"
          d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
      </svg>

      <!-- Auto icon: monitor/sync -->
      <svg
        v-if="opt.value === 'auto'"
        class="nm-theme-toggle__icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2" />
        <path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 21h8m-4-4v4" />
        <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          d="M12 9v3l2 1.5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>

      <!-- Dark icon: moon -->
      <svg
        v-if="opt.value === 'dark'"
        class="nm-theme-toggle__icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="currentColor"
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>

      <span v-if="size !== 'small'" class="nm-theme-toggle__label">{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-theme-toggle {
  display: inline-flex;
  align-items: center;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-full);
  padding: 3px;
  @include nm-inset-strong(3px, 6px);
  @include nm-theme-transition;
  user-select: none;
  gap: 2px;

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nm-theme-toggle__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--nm-text-placeholder);
  border-radius: var(--nm-border-radius-full);
  transition:
    background-color var(--nm-transition-normal),
    box-shadow var(--nm-transition-normal),
    color var(--nm-transition-normal);
  white-space: nowrap;

  &:disabled {
    cursor: not-allowed;
  }

  &--active {
    color: var(--nm-primary-color);
    @include nm-raised-strong(2px, 4px);
    background-color: var(--nm-surface-raised);
  }
}

.nm-theme-toggle__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.nm-theme-toggle__label {
  font-size: 12px;
  font-weight: 500;
}

// ---------- Size variants ----------

.nm-theme-toggle--small {
  padding: 2px;

  .nm-theme-toggle__btn {
    padding: 5px 8px;
  }

  .nm-theme-toggle__icon {
    width: 14px;
    height: 14px;
  }
}

.nm-theme-toggle--medium {
  padding: 3px;

  .nm-theme-toggle__btn {
    padding: 6px 12px;
  }
}

.nm-theme-toggle--large {
  padding: 4px;

  .nm-theme-toggle__btn {
    padding: 8px 16px;
    gap: 8px;
  }

  .nm-theme-toggle__icon {
    width: 18px;
    height: 18px;
  }

  .nm-theme-toggle__label {
    font-size: 14px;
  }
}
</style>
