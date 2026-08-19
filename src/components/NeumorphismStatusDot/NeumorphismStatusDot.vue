<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export type StatusDotStatus = 'online' | 'offline' | 'busy' | 'connecting'
export type StatusDotSize = 'small' | 'medium' | 'large'

export interface NeumorphismStatusDotProps {
  /** 状态（默认 online） */
  status?: StatusDotStatus
  size?: StatusDotSize
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
const resolvedSize = computed(() => resolveProp(props.size, config.value.statusDot?.size, 'medium'))
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
  `nm-status-dot--${resolvedSize.value}`,
  { 'nm-status-dot--pulse': showPulse.value },
])
</script>

<template>
  <span :class="classList" role="status" :aria-label="resolvedLabel" />
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

  &--small {
    width: 8px;
    height: 8px;
  }
  &--medium {
    width: 10px;
    height: 10px;
  }
  &--large {
    width: 12px;
    height: 12px;
  }

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
