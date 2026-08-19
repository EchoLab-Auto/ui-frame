<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export type SpinnerSize = 'small' | 'medium' | 'large'

export interface NeumorphismSpinnerProps {
  /** 尺寸档位，或具体像素值 */
  size?: SpinnerSize | number
  /** 无障碍标签（默认取 locale spinnerLoading） */
  label?: string
}

const props = withDefaults(defineProps<NeumorphismSpinnerProps>(), {
  size: undefined,
  label: '',
})

const { t } = useLocale()
const { config, resolveProp } = useNeumorphismSetup()

const resolvedSize = computed(() =>
  resolveProp(props.size, config.value.spinner?.size, 'medium' as SpinnerSize | number)
)

const resolvedLabel = computed(() => props.label || t('spinnerLoading'))

const SIZE_MAP: Record<SpinnerSize, number> = {
  small: 14,
  medium: 20,
  large: 28,
}

const pixelSize = computed(() =>
  typeof resolvedSize.value === 'number' ? resolvedSize.value : SIZE_MAP[resolvedSize.value]
)

const styleVars = computed(() => ({ '--nm-spinner-size': `${pixelSize.value}px` }))
</script>

<template>
  <span class="nm-spinner" role="status" :aria-label="resolvedLabel" :style="styleVars">
    <svg
      class="nm-spinner__svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle class="nm-spinner__track" cx="12" cy="12" r="9" stroke-width="2.5" />
      <circle
        class="nm-spinner__arc"
        cx="12"
        cy="12"
        r="9"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    </svg>
  </span>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--nm-spinner-size);
  height: var(--nm-spinner-size);
}

.nm-spinner__svg {
  width: 100%;
  height: 100%;
  animation: nm-spinner-rotate 1s linear infinite;
}

.nm-spinner__track {
  stroke: var(--nm-neutral-200);
}

.nm-spinner__arc {
  stroke: var(--nm-primary-color);
  stroke-dasharray: 42 14;
}

@keyframes nm-spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-spinner__svg {
    animation: none;
  }
}
</style>
