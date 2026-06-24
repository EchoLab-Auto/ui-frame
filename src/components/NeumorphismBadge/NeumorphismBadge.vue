<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export interface NeumorphismBadgeProps {
  value?: string | number
  max?: number
  dot?: boolean
  color?: string
  showZero?: boolean
}

const props = withDefaults(defineProps<NeumorphismBadgeProps>(), {
  max: 99,
  dot: false,
  showZero: false,
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedMax = computed(() => resolveProp(props.max, config.value.badge?.max, 99))
const resolvedDot = computed(() => resolveProp(props.dot, config.value.badge?.dot, false))
const resolvedShowZero = computed(() =>
  resolveProp(props.showZero, config.value.badge?.showZero, false)
)

const displayValue = computed(() => {
  if (resolvedDot.value) return ''
  const num = Number(props.value)
  if (isNaN(num)) return String(props.value || '')
  if (num <= 0 && !resolvedShowZero.value) return ''
  if (num > resolvedMax.value) return `${resolvedMax.value}+`
  return String(num)
})

const isHidden = computed(() => {
  if (resolvedDot.value) return props.value == null || props.value === ''
  const num = Number(props.value)
  return (isNaN(num) || num <= 0) && !resolvedShowZero.value
})

const { t } = useLocale()

const ariaLabel = computed(() =>
  props.dot ? t('badgeOnline') : t('badgeUnread', { count: displayValue.value })
)

const classList = computed(() => [
  'nm-badge',
  {
    'nm-badge--dot': resolvedDot.value,
    'nm-badge--hidden': isHidden.value,
  },
])
</script>

<template>
  <div :class="classList">
    <slot />
    <sup
      v-if="!isHidden"
      class="nm-badge__content"
      :class="{ 'nm-badge__content--dot': resolvedDot }"
      :style="color ? { backgroundColor: color } : undefined"
      :aria-label="ariaLabel"
    >
      <span v-if="!resolvedDot" class="nm-badge__text" aria-hidden="true">{{ displayValue }}</span>
    </sup>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-badge {
  position: relative;
  display: inline-flex;
}

.nm-badge__content {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-color-error);
  color: var(--nm-text-on-primary);
  font-size: var(--nm-font-xs);
  font-weight: 600;
  line-height: 1;
  box-shadow:
    1px 1px 3px var(--nm-shadow-dark-strong),
    -1px -1px 3px var(--nm-shadow-light-ambient-xl);
  z-index: 1;
  pointer-events: none;
  animation: nm-badge-pop 0.4s $nm-ease-bounce;

  &--dot {
    min-width: var(--nm-spacing-sm);
    height: var(--nm-spacing-sm);
    padding: 0;
    border-radius: var(--nm-border-radius-full);
    animation: nm-badge-pulse 2s ease-in-out infinite;
  }
}

@keyframes nm-badge-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  70% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes nm-badge-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.8;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-badge__content {
    animation: none;
  }
}

.nm-badge__text {
  line-height: 1;
}
</style>
