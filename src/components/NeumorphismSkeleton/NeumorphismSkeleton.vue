<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export interface NeumorphismSkeletonProps {
  variant?: 'text' | 'circle' | 'rect'
  width?: string | number
  height?: string | number
  count?: number
  animation?: 'pulse' | 'wave' | 'none'
}

const props = withDefaults(defineProps<NeumorphismSkeletonProps>(), {
  count: 1,
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedVariant = computed(() =>
  resolveProp(props.variant, config.value.skeleton?.variant, 'text')
)
const resolvedAnimation = computed(() =>
  resolveProp(props.animation, config.value.skeleton?.animation, 'pulse')
)

const { t } = useLocale()

const items = computed(() => {
  const safeCount = Math.max(0, Math.floor(props.count))
  return Array.from({ length: safeCount }, (_, i) => i)
})

const classList = computed(() => [
  'nm-skeleton',
  `nm-skeleton--${resolvedVariant.value}`,
  `nm-skeleton--${resolvedAnimation.value}`,
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
    :aria-label="t('skeletonLoading')"
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
    margin-bottom: var(--nm-spacing-sm);
    border-radius: var(--nm-border-radius-xs);
  }

  &--circle {
    border-radius: var(--nm-border-radius-full);
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
  // Dual-layer shimmer for natural light reflection
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 40%,
      color-mix(in srgb, var(--nm-shadow-light) 60%, transparent) 45%,
      color-mix(in srgb, var(--nm-shadow-light) 80%, transparent) 50%,
      transparent 55%
    );
    background-size: 200% 100%;
    animation: nm-skeleton-wave-fast 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 30%,
      color-mix(in srgb, var(--nm-shadow-light) 40%, transparent) 38%,
      color-mix(in srgb, var(--nm-shadow-light) 60%, transparent) 42%,
      transparent 50%
    );
    background-size: 250% 100%;
    animation: nm-skeleton-wave-slow 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    animation-delay: 0.3s;
    width: 40%;
  }
}

@keyframes nm-skeleton-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes nm-skeleton-wave-fast {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

@keyframes nm-skeleton-wave-slow {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
