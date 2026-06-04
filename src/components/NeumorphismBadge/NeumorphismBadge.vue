<script setup lang="ts">
import { computed } from 'vue'

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

const displayValue = computed(() => {
  if (props.dot) return ''
  const num = Number(props.value)
  if (isNaN(num)) return String(props.value || '')
  if (num <= 0 && !props.showZero) return ''
  if (num > props.max) return `${props.max}+`
  return String(num)
})

const isHidden = computed(() => {
  if (props.dot) return props.value == null || props.value === ''
  const num = Number(props.value)
  return (isNaN(num) || num <= 0) && !props.showZero
})

const classList = computed(() => [
  'nm-badge',
  {
    'nm-badge--dot': props.dot,
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
      :class="{ 'nm-badge__content--dot': dot }"
      :style="color ? { backgroundColor: color } : undefined"
      :aria-label="dot ? '在线' : `未读 ${displayValue}`"
    >
      <span v-if="!dot" class="nm-badge__text" aria-hidden="true">{{ displayValue }}</span>
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
  border-radius: 10px;
  background-color: var(--nm-color-error);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  box-shadow:
    1px 1px 3px rgba(0, 0, 0, 0.2),
    -1px -1px 3px rgba(255, 255, 255, 0.3);
  z-index: 1;
  pointer-events: none;

  &--dot {
    min-width: 8px;
    height: 8px;
    padding: 0;
    border-radius: 50%;
  }
}

.nm-badge__text {
  line-height: 1;
}
</style>
