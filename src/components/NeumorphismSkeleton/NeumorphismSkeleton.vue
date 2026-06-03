<script setup lang="ts">
import { computed } from 'vue'

export interface NeumorphismSkeletonProps {
  variant?: 'text' | 'circle' | 'rect'
  width?: string | number
  height?: string | number
  count?: number
  animation?: 'pulse' | 'wave' | 'none'
}

const props = withDefaults(defineProps<NeumorphismSkeletonProps>(), {
  variant: 'text',
  count: 1,
  animation: 'pulse',
})

const items = computed(() => {
  const safeCount = Math.max(0, Math.floor(props.count))
  return Array.from({ length: safeCount }, (_, i) => i)
})

const classList = computed(() => [
  'nm-skeleton',
  `nm-skeleton--${props.variant}`,
  `nm-skeleton--${props.animation}`,
])

function formatSize(val?: string | number): string | undefined {
  if (val === undefined) return undefined
  return typeof val === 'number' ? `${val}px` : val
}
</script>

<template>
  <span
    v-for="i in items"
    :key="i"
    :class="classList"
    :style="{
      width: formatSize(width),
      height: formatSize(height),
    }"
    role="status"
    aria-label="加载中"
  >
    <span class="nm-skeleton__shimmer" aria-hidden="true" />
  </span>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-skeleton {
  display: block;
  position: relative;
  overflow: hidden;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-sm);
  @include nm-inset(1px, 2px);

  &--text {
    height: 14px;
    width: 100%;
    margin-bottom: 8px;
    border-radius: 4px;
  }

  &--circle {
    border-radius: 50%;
    width: 44px;
    height: 44px;
  }

  &--rect {
    border-radius: var(--nm-border-radius-md);
    width: 100%;
    height: 100px;
  }
}

.nm-skeleton__shimmer {
  position: absolute;
  inset: 0;
}

.nm-skeleton--pulse {
  animation: nm-skeleton-pulse 1.6s ease-in-out infinite;
}

.nm-skeleton--wave .nm-skeleton__shimmer {
  background: linear-gradient(
    90deg,
    transparent 25%,
    var(--nm-shadow-light) 50%,
    transparent 75%
  );
  background-size: 200% 100%;
  animation: nm-skeleton-wave 1.6s ease-in-out infinite;
}

@keyframes nm-skeleton-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes nm-skeleton-wave {
  0%   { transform: translateX(-100%); }
  50%  { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
</style>
