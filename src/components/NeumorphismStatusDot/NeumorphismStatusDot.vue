<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export type StatusDotStatus = 'online' | 'offline' | 'busy' | 'connecting'
/** @deprecated 旧尺寸档位（字符串）——保留仅为兼容映射，新代码请传数字（px 直径） */
export type StatusDotSize = 'small' | 'medium' | 'large'

export interface NeumorphismStatusDotProps {
  /** 状态（默认 online） */
  status?: StatusDotStatus
  /**
   * 圆点直径（px）。默认 10。几何量就该是数字——档位只能近似表达设计稿上的值。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）已弃用，仅按
   * small=8 / medium=10 / large=12（px）兼容映射；新代码请传数字。
   */
  size?: number | StatusDotSize
  /** 连接中/忙碌时是否呼吸脉冲（默认 true） */
  pulse?: boolean
  /** 无障碍标签（默认按状态取 locale 文案） */
  label?: string
}

const props = withDefaults(defineProps<NeumorphismStatusDotProps>(), {
  status: undefined,
  size: undefined,
  pulse: undefined,
  label: '',
})

const { t } = useLocale()
const { config, resolveProp } = useNeumorphismSetup()

const resolvedStatus = computed(() =>
  resolveProp(props.status, config.value.statusDot?.status, 'online')
)
/** 旧字符串档位 → px 直径（已弃用） */
const LEGACY_DIAMETER: Record<StatusDotSize, number> = { small: 8, medium: 10, large: 12 }
const DEFAULT_DIAMETER = 10

/**
 * 直径（px）：`prop` → 全局配置 `statusDot.size` → 10。
 *
 * 容错：非有限数退回默认；负值/0 夹到 4px 下限（0 会让圆点彻底消失，
 * 通常不是调用方本意，而是配置算错了）。
 */
const resolvedDiameter = computed(() => {
  const raw = resolveProp(props.size, config.value.statusDot?.size, DEFAULT_DIAMETER)
  const px = typeof raw === 'number' ? raw : LEGACY_DIAMETER[raw as StatusDotSize]
  if (!Number.isFinite(px)) return DEFAULT_DIAMETER
  return Math.max(4, px)
})
const resolvedPulse = computed(() => resolveProp(props.pulse, config.value.statusDot?.pulse, true))

const resolvedLabel = computed(() => {
  if (props.label) return props.label
  const key =
    resolvedStatus.value === 'online'
      ? 'statusDotOnline'
      : resolvedStatus.value === 'offline'
        ? 'statusDotOffline'
        : resolvedStatus.value === 'busy'
          ? 'statusDotBusy'
          : 'statusDotConnecting'
  return t(key)
})

// 脉冲只对"过渡态"有意义：connecting / busy；online / offline 是静止事实
const showPulse = computed(
  () =>
    resolvedPulse.value &&
    (resolvedStatus.value === 'connecting' || resolvedStatus.value === 'busy')
)

const classList = computed(() => [
  'nm-status-dot',
  `nm-status-dot--${resolvedStatus.value}`,
  { 'nm-status-dot--pulse': showPulse.value },
])

/** 尺寸走内联样式（px 直径），不再切成三档 class */
const dotStyle = computed(() => ({
  width: `${resolvedDiameter.value}px`,
  height: `${resolvedDiameter.value}px`,
}))
</script>

<template>
  <span :class="classList" :style="dotStyle" role="status" :aria-label="resolvedLabel" />
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-status-dot {
  display: inline-block;
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-neutral-300);
  box-shadow:
    inset 1px 1px 2px var(--nm-shadow-dark),
    inset -1px -1px 2px var(--nm-shadow-light);

  &--online {
    background-color: var(--nm-color-success);
  }
  &--offline {
    background-color: var(--nm-neutral-300);
  }
  &--busy {
    background-color: var(--nm-color-warning);
  }
  &--connecting {
    background-color: var(--nm-color-info);
  }

  &--pulse {
    animation: nm-status-dot-pulse 1.6s $nm-ease-decelerate infinite;
  }
}

@keyframes nm-status-dot-pulse {
  0%,
  100% {
    box-shadow:
      inset 1px 1px 2px var(--nm-shadow-dark),
      0 0 0 0 color-mix(in srgb, currentColor 45%, transparent);
  }
  50% {
    box-shadow:
      inset 1px 1px 2px var(--nm-shadow-dark),
      0 0 0 4px color-mix(in srgb, currentColor 0%, transparent);
  }
}

.nm-status-dot--busy {
  color: var(--nm-color-warning);
}

.nm-status-dot--connecting {
  color: var(--nm-color-info);
}

@media (prefers-reduced-motion: reduce) {
  .nm-status-dot--pulse {
    animation: none;
  }
}
</style>
