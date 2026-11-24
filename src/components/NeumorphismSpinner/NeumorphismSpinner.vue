<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize } from '@/utils/controlScale'

export interface NeumorphismSpinnerProps {
  /**
   * 直径（px，直接就是像素值）。默认 20。
   */
  size?: number
  /** 无障碍标签（默认取 locale spinnerLoading） */
  label?: string
}

const props = withDefaults(defineProps<NeumorphismSpinnerProps>(), {
  size: undefined,
  label: '',
})

const { t } = useLocale()
const { config, resolveProp } = useNeumorphismSetup()

/** 默认直径（px）= 原 `'medium'` 档 */
const DEFAULT_SPINNER_PX = 20

const resolvedSize = computed(() =>
  resolveProp(props.size, config.value.spinner?.size, DEFAULT_SPINNER_PX)
)

const resolvedLabel = computed(() => props.label || t('spinnerLoading'))

/**
 * 直径（px）。容错：非有限数退回默认；下限 8px（再小看不清转圈）。
 */
const pixelSize = computed(() => normalizeNumericSize(resolvedSize.value, DEFAULT_SPINNER_PX))

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
