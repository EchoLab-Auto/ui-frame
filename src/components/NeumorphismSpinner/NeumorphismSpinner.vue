<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'

/** @deprecated 旧尺寸档位（字符串）——保留仅为兼容映射，新代码请传数字（px 直径） */
export type SpinnerSize = 'small' | 'medium' | 'large'

export interface NeumorphismSpinnerProps {
  /**
   * 直径（px，直接就是像素值）。默认 20。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）已弃用，仅按
   * small=14 / medium=20 / large=28（px）兼容映射；新代码请传数字。
   */
  size?: number | SpinnerSize
  /** 无障碍标签（默认取 locale spinnerLoading） */
  label?: string
}

const props = withDefaults(defineProps<NeumorphismSpinnerProps>(), {
  size: undefined,
  label: '',
})

const { t } = useLocale()
const { config, resolveProp } = useNeumorphismSetup()

/** 旧字符串档位 → px 直径（已弃用） */
const SIZE_MAP: Record<SpinnerSize, number> = {
  small: 14,
  medium: 20,
  large: 28,
}
/** 默认直径（px） = 原 `'medium'` 档 */
const DEFAULT_SPINNER_PX = 20

const resolvedSize = computed(() =>
  resolveProp(props.size, config.value.spinner?.size, DEFAULT_SPINNER_PX as SpinnerSize | number)
)

const resolvedLabel = computed(() => props.label || t('spinnerLoading'))

/**
 * 直径（px）。容错：非有限数退回默认；下限 8px（再小看不清转圈）。
 */
const pixelSize = computed(() => {
  const raw = resolvedSize.value
  const px = typeof raw === 'number' ? raw : SIZE_MAP[raw as SpinnerSize]
  if (!Number.isFinite(px)) return DEFAULT_SPINNER_PX
  return Math.max(8, px)
})

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
