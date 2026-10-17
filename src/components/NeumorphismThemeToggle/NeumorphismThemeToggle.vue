<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import type { Theme } from '@/composables/useTheme'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

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
  disableAuto: undefined,
  modelValue: 'auto',
  disabled: false,
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedSize = computed(() =>
  resolveProp(props.size, config.value.themeToggle?.size, 'medium')
)
const resolvedDisableAuto = computed(() =>
  resolveProp(props.disableAuto, config.value.themeToggle?.disableAuto, false)
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: Theme): void
  (e: 'change', value: Theme): void
}>()

const { t } = useLocale()

const options = computed<{ value: Theme; label: string }[]>(() => {
  const items = [
    { value: 'light' as Theme, label: t('themeToggleLight') },
    { value: 'auto' as Theme, label: t('themeToggleAuto') },
    { value: 'dark' as Theme, label: t('themeToggleDark') },
  ]
  if (resolvedDisableAuto.value) {
    return items.filter(i => i.value !== 'auto')
  }
  return items
})

const themeContext = useTheme()

// Sync external modelValue changes to the global theme system
watch(
  () => props.modelValue,
  value => {
    if (value !== themeContext.theme.value) {
      themeContext.setTheme(value)
    }
  },
  { immediate: true }
)

const classList = computed(() => [
  'nm-theme-toggle',
  `nm-theme-toggle--${resolvedSize.value}`,
  {
    'nm-theme-toggle--disabled': props.disabled,
  },
])

function selectTheme(value: Theme) {
  if (props.disabled) return
  if (value === props.modelValue) return
  themeContext.setTheme(value)
  emit('update:modelValue', value)
  emit('change', value)
}

/**
 * 图标尺寸档（§8 枚举）：small → 14；medium/large → 18。
 * 三态同档，保证并排按钮视觉大小一致（此前激活态 scale(1.1) 让其一档独大）。
 */
const iconSize = computed<'sm' | 'lg'>(() => (resolvedSize.value === 'small' ? 'sm' : 'lg'))

/** 主题选项 → 语义图标（三态统一线框，2026-10）。 */
const THEME_ICON: Record<string, 'sun' | 'monitor' | 'moon'> = {
  light: 'sun',
  auto: 'monitor',
  dark: 'moon',
}

function themeIconName(value: string) {
  return THEME_ICON[value] ?? 'monitor'
}
</script>

<template>
  <div :class="classList" role="radiogroup" :aria-label="t('themeToggleLabel')">
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
      <!-- 三态图标统一为线框（2026-10）：sun / monitor / moon 全部 stroke 风格，
           此前 light 是"实心圆+线框射线"、dark 是"纯实心块"，切换主题时
           实心↔线框跳变。尺寸与线宽由 NeumorphismIcon 按档自动处理。 -->
      <NeumorphismIcon
        :name="themeIconName(opt.value)"
        :size="iconSize"
        class="nm-theme-toggle__icon"
      />

      <span v-if="resolvedSize !== 'small'" class="nm-theme-toggle__label">{{ opt.label }}</span>
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
  gap: var(--nm-spacing-2xs);

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nm-theme-toggle__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-6);
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--nm-text-placeholder);
  border-radius: var(--nm-border-radius-full);
  transition:
    background-color 0.35s $nm-ease-spring,
    box-shadow 0.35s $nm-ease-spring,
    color 0.3s $nm-ease-ambient,
    transform 0.25s $nm-ease-spring;
  white-space: nowrap;
  position: relative;
  overflow: hidden;

  &:disabled {
    cursor: not-allowed;
  }

  @media (hover: hover) {
    &:hover:not(:disabled):not(.nm-theme-toggle__btn--active) {
      color: var(--nm-text-secondary);
      background-color: color-mix(in srgb, var(--nm-border-subtle) 60%, transparent);
      transform: translateY(-1px);
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
    transition: transform 0.1s $nm-ease-compress;
  }

  @include nm-focus-ring;

  &--active {
    color: var(--nm-primary-color);
    @include nm-raised-strong(2px, 4px);
    background-color: var(--nm-surface-raised);
    animation: nm-theme-toggle-activate 0.4s $nm-ease-bounce;
  }
}

// Ripple effect on active state
.nm-theme-toggle__btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--nm-primary-color) 10%, transparent) 0%,
    transparent 70%
  );
  opacity: 0;
  transform: scale(0);
  transition: none;
}

.nm-theme-toggle__btn--active::after {
  animation: nm-theme-toggle-ripple 0.5s $nm-ease-decelerate;
}

.nm-theme-toggle__icon {
  width: var(--nm-icon-size-md);
  height: var(--nm-icon-size-md);
  flex-shrink: 0;
  transition: transform 0.35s $nm-ease-spring;
}

.nm-theme-toggle__btn--active .nm-theme-toggle__icon {
  /* 只旋转、不缩放（2026-10 修复）：scale(1.1) 让 14px 图标实测渲染 18.86px，
     脱离 §8 枚举档且比相邻按钮明显更大更粗。旋转 15° 保留"激活"的可感知差异。 */
  transform: rotate(15deg);
}

.nm-theme-toggle__label {
  font-size: var(--nm-font-sm);
  font-weight: 500;
}

// ---------- Size variants ----------

.nm-theme-toggle--small {
  padding: var(--nm-spacing-2xs);

  .nm-theme-toggle__btn {
    padding: 5px var(--nm-spacing-sm);
  }

  .nm-theme-toggle__icon {
    width: var(--nm-icon-size-sm);
    height: var(--nm-icon-size-sm);
  }
}

.nm-theme-toggle--medium {
  padding: 3px;

  .nm-theme-toggle__btn {
    padding: var(--nm-spacing-6) var(--nm-spacing-12);
  }
}

.nm-theme-toggle--large {
  padding: var(--nm-spacing-xs);

  .nm-theme-toggle__btn {
    padding: var(--nm-spacing-sm) var(--nm-spacing-md);
    gap: var(--nm-spacing-sm);
  }

  .nm-theme-toggle__icon {
    width: var(--nm-icon-size-lg);
    height: var(--nm-icon-size-lg);
  }

  .nm-theme-toggle__label {
    font-size: var(--nm-font-base);
  }
}

@keyframes nm-theme-toggle-activate {
  0% {
    transform: scale(0.92);
  }
  60% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes nm-theme-toggle-ripple {
  0% {
    opacity: 0.4;
    transform: scale(0);
  }
  100% {
    opacity: 0;
    transform: scale(2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-theme-toggle__btn {
    transition: none;
  }
  .nm-theme-toggle__btn--active {
    animation: none;
  }
  .nm-theme-toggle__btn--active::after {
    animation: none;
  }
  .nm-theme-toggle__icon {
    transition: none;
  }
}
</style>
