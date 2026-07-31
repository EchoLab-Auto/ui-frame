<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useProgress } from '@/composables/useProgress'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export type ProgressVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'
export type ProgressEffect = 'default' | 'pulse' | 'flow' | 'wave' | 'stripes' | 'sparkle'

export interface NeumorphismProgressProps {
  modelValue?: number
  max?: number
  variant?: ProgressVariant
  size?: 'small' | 'medium' | 'large'
  /** Progress shape: linear bar (default) or circular SVG ring */
  type?: 'line' | 'circle'
  showLabel?: boolean
  indeterminate?: boolean
  effect?: ProgressEffect
}

const props = withDefaults(defineProps<NeumorphismProgressProps>(), {
  showLabel: undefined,
  modelValue: 0,
  max: 100,
  indeterminate: false,
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedVariant = computed(() =>
  resolveProp(props.variant, config.value.progress?.variant, 'primary')
)
const resolvedSize = computed(() => resolveProp(props.size, config.value.progress?.size, 'medium'))
const resolvedShowLabel = computed(() =>
  resolveProp(props.showLabel, config.value.progress?.showLabel, false)
)

const resolvedEffect = computed<ProgressEffect>(
  () => props.effect ?? config.value.progress?.effect ?? 'default'
)

const { t } = useLocale()

const {
  percentage,
  isComplete,
  displayPercentage,
  circleSize,
  strokeWidth,
  radius,
  circumference,
  dashOffset,
} = useProgress({
  modelValue: toRef(props, 'modelValue'),
  max: toRef(props, 'max'),
  indeterminate: toRef(props, 'indeterminate'),
  size: resolvedSize,
})

const classList = computed(() => [
  'nm-progress',
  `nm-progress--${resolvedSize.value}`,
  `nm-progress--${resolvedVariant.value}`,
  `nm-progress--effect-${resolvedEffect.value}`,
  {
    'nm-progress--indeterminate': props.indeterminate,
    'nm-progress--complete': isComplete.value,
  },
])

const variantColors: Record<ProgressVariant, string> = {
  default: 'var(--nm-text-secondary)',
  primary: 'var(--nm-primary-color)',
  success: 'var(--nm-color-success)',
  warning: 'var(--nm-color-warning)',
  error: 'var(--nm-color-error)',
}

const barStyle = computed(() => ({
  width: props.indeterminate ? '40%' : `${percentage.value}%`,
  '--nm-progress-bar-color': variantColors[resolvedVariant.value],
}))

const circleStyle = computed(() => ({
  width: `${circleSize.value}px`,
  height: `${circleSize.value}px`,
  '--nm-progress-c': `${circumference.value}px`,
}))
</script>

<template>
  <div
    :class="[...classList, ...(type === 'circle' ? ['nm-progress--circle'] : [])]"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : modelValue"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-busy="indeterminate || undefined"
    :aria-valuetext="indeterminate ? t('progressIndeterminate') : undefined"
    :aria-label="
      resolvedShowLabel ? undefined : t('progressLabel', { percentage: displayPercentage })
    "
    :style="type === 'circle' ? circleStyle : undefined"
  >
    <!-- Linear bar -->
    <template v-if="type !== 'circle'">
      <div class="nm-progress__track">
        <div class="nm-progress__bar" :style="barStyle" />
      </div>
      <span v-if="resolvedShowLabel" class="nm-progress__label">{{ displayPercentage }}%</span>
    </template>

    <!-- Circular SVG ring -->
    <template v-else>
      <svg
        class="nm-progress-circle__svg"
        :width="circleSize"
        :height="circleSize"
        :viewBox="`0 0 ${circleSize} ${circleSize}`"
      >
        <circle
          :cx="circleSize / 2"
          :cy="circleSize / 2"
          :r="radius"
          fill="none"
          :stroke-width="strokeWidth"
          class="nm-progress-circle__track"
        />
        <circle
          :cx="circleSize / 2"
          :cy="circleSize / 2"
          :r="radius"
          fill="none"
          :stroke-width="strokeWidth"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
          :class="[
            'nm-progress-circle__fill',
            {
              'nm-progress-circle__fill--indeterminate': indeterminate,
              [`nm-progress-circle__fill--${resolvedVariant}`]: true,
            },
          ]"
        />
      </svg>
      <span v-if="resolvedShowLabel" class="nm-progress-circle__label"
        >{{ displayPercentage }}%</span
      >
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.nm-progress__track {
  flex: 1;
  height: var(--nm-progress-height-md, 12px);
  overflow: hidden;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-progress-border-radius, 9999px);
  @include nm-inset(3px, 6px);
}

.nm-progress__bar {
  height: 100%;
  border-radius: var(--nm-progress-border-radius, 9999px);
  background-color: var(--nm-progress-bar-color);
  transition: width 0.65s $nm-ease-spring;
  box-shadow:
    inset 0 -2px 4px var(--nm-shadow-dark),
    inset 0 2px 4px var(--nm-shadow-light-ambient-sm);
  position: relative;
  overflow: hidden;

  // Overlay layers for animated effects — kept on pseudos so motion runs on
  // the compositor (transform) instead of repainting the bar itself.
  &::before,
  &::after {
    position: absolute;
    top: 0;
    bottom: 0;
    pointer-events: none;
  }
}

// Shimmer sweep — a soft light band that crosses the bar, then rests.
// Statically invisible: visibility lives in the keyframes, so states that
// strip the animation (complete, reduced motion) hide the band instead of
// parking it at the left edge.
.nm-progress--effect-default .nm-progress__bar::before {
  content: '';
  left: 0;
  width: 45%;
  opacity: 0;
  background: linear-gradient(90deg, transparent, var(--nm-shadow-light-ambient-md), transparent);
  animation: nm-progress-shimmer 2.6s $nm-ease-ambient infinite;
}

// Pulse — an energy beam: mostly-solid body with a short tail fade and a
// white-hot tip; the comet head (core + halo + trailing sparks) breathes,
// and a slim glint crosses the bar occasionally.
// Background layer 1 is the complete-state solid fill, parked at 0% width —
// background-image can't transition, but background-size can, so entering
// the complete state wipes the fill across the beam (see below).
.nm-progress--effect-pulse .nm-progress__bar {
  background-color: transparent;
  background-image:
    linear-gradient(var(--nm-progress-bar-color), var(--nm-progress-bar-color)),
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--nm-progress-bar-color) 0%, transparent),
      color-mix(in srgb, var(--nm-progress-bar-color) 80%, transparent) 55%,
      var(--nm-progress-bar-color) 85%,
      color-mix(in srgb, var(--nm-progress-bar-color) 82%, var(--nm-progress-pulse-core)) 100%
    );
  background-repeat: no-repeat;
  background-size:
    0% 100%,
    100% 100%;
  box-shadow: none;
  transition:
    width 0.65s $nm-ease-spring,
    background-size 0.6s ease-out;
  animation: nm-progress-pulse-halo 2.4s ease-in-out infinite;
}

// Occasional glint — a slim sharp band crossing the beam, then a long rest.
// Statically invisible for the same reason as the default shimmer.
.nm-progress--effect-pulse .nm-progress__bar::before {
  content: '';
  left: 0;
  width: 10%;
  opacity: 0;
  background: linear-gradient(90deg, transparent, var(--nm-progress-pulse-core), transparent);
  animation: nm-progress-pulse-sweep 4.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

// Comet head — white-hot core + soft bloom hugging the leading edge, with two
// fading sparks trailing behind; the whole cluster breathes.
.nm-progress--effect-pulse .nm-progress__bar::after {
  content: '';
  left: 0;
  right: 0;
  transform-origin: 100% 50%;
  background-image:
    radial-gradient(
      circle 3px at calc(100% - 4px) 50%,
      var(--nm-progress-pulse-core),
      transparent 75%
    ),
    radial-gradient(
      circle 14px at 100% 50%,
      color-mix(in srgb, var(--nm-progress-pulse-core) 85%, transparent),
      color-mix(in srgb, var(--nm-progress-bar-color) 55%, transparent) 55%,
      transparent 78%
    ),
    radial-gradient(
      circle 2px at calc(100% - 18px) 34%,
      var(--nm-progress-pulse-sweep),
      transparent 75%
    ),
    radial-gradient(
      circle 1.5px at calc(100% - 30px) 66%,
      color-mix(in srgb, var(--nm-progress-pulse-sweep) 70%, transparent),
      transparent 75%
    );
  animation: nm-progress-pulse-head 2.4s ease-in-out infinite;
}

// Flow — silk-like light bands drifting slowly over the solid bar. The 200%-
// wide layer repeats its pattern every 50% of itself, so a -50% → 0 pass
// loops seamlessly.
.nm-progress--effect-flow .nm-progress__bar::before {
  content: '';
  left: 0;
  width: 200%;
  background: linear-gradient(
    90deg,
    transparent 4%,
    color-mix(in srgb, var(--nm-progress-pulse-core) 50%, transparent) 10%,
    transparent 16%,
    transparent 26%,
    var(--nm-progress-pulse-sweep) 32%,
    transparent 38%,
    transparent 50%,
    color-mix(in srgb, var(--nm-progress-pulse-core) 50%, transparent) 60%,
    transparent 66%,
    transparent 76%,
    var(--nm-progress-pulse-sweep) 82%,
    transparent 88%
  );
  animation: nm-progress-flow 4.6s linear infinite;
}

// Wave — two wide, gentle sine fills (SVG tiles) sliding across each other
// at different speeds and directions, like light on water inside the bar.
.nm-progress--effect-wave .nm-progress__bar::before {
  content: '';
  left: 0;
  width: 200%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='14' viewBox='0 0 120 14'%3E%3Cpath d='M0 7 C15 3 45 3 60 7 S105 11 120 7 V14 H0 Z' fill='rgba(255,255,255,0.22)'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-size: 120px 100%;
  background-position: 0 100%;
  animation: nm-progress-wave 6.5s linear infinite;
}

.nm-progress--effect-wave .nm-progress__bar::after {
  content: '';
  left: 0;
  width: 200%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='14' viewBox='0 0 180 14'%3E%3Cpath d='M0 7 C22 11 68 11 90 7 S158 3 180 7 V14 H0 Z' fill='rgba(255,255,255,0.14)'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-size: 180px 100%;
  background-position: 0 100%;
  animation: nm-progress-wave-reverse 9.5s linear infinite;
}

// Stripes — soft diagonal light bands drifting right (barber-pole). A -45°
// repeating gradient with a 16px axial period repeats horizontally every
// 16·√2 ≈ 22.627px, so translating by exactly that loops seamlessly.
.nm-progress--effect-stripes .nm-progress__bar::before {
  content: '';
  left: -23px;
  width: calc(100% + 23px);
  background: repeating-linear-gradient(
    -45deg,
    var(--nm-progress-pulse-sweep) 0 8px,
    transparent 8px 16px
  );
  opacity: 0.5;
  animation: nm-progress-stripes 2.6s linear infinite;
}

// Sparkle — two layers of tiny light dots drifting in opposite directions,
// each twinkling on its own clock, like a slow starfield inside the bar.
.nm-progress--effect-sparkle .nm-progress__bar::before,
.nm-progress--effect-sparkle .nm-progress__bar::after {
  content: '';
  left: 0;
  width: 200%;
  background-repeat: repeat-x;
  background-size: 96px 100%;
}

.nm-progress--effect-sparkle .nm-progress__bar::before {
  background-image:
    radial-gradient(circle 2.4px at 18px 32%, var(--nm-progress-pulse-core), transparent 75%),
    radial-gradient(circle 1.8px at 52px 62%, var(--nm-progress-pulse-sweep), transparent 75%),
    radial-gradient(circle 2.6px at 80px 45%, var(--nm-progress-pulse-core), transparent 75%);
  animation:
    nm-progress-sparkle-drift 7s linear infinite,
    nm-progress-sparkle-twinkle 2.6s ease-in-out infinite;
}

.nm-progress--effect-sparkle .nm-progress__bar::after {
  background-image:
    radial-gradient(circle 2px at 30px 68%, var(--nm-progress-pulse-sweep), transparent 75%),
    radial-gradient(circle 2.5px at 66px 28%, var(--nm-progress-pulse-core), transparent 75%);
  animation:
    nm-progress-sparkle-drift 11s linear infinite reverse,
    nm-progress-sparkle-twinkle 3.8s ease-in-out -1.2s infinite;
}

// Glow on complete (100%)
.nm-progress--complete .nm-progress__bar {
  box-shadow:
    inset 0 -2px 4px var(--nm-shadow-dark),
    inset 0 2px 4px var(--nm-shadow-light-ambient-sm),
    0 0 8px color-mix(in srgb, var(--nm-progress-bar-color) 30%, transparent);
  animation: nm-progress-complete-glow 2s ease-in-out infinite;
}

.nm-progress--complete .nm-progress__bar::before {
  animation: none;
}

// Complete + pulse — the parked solid layer wipes left-to-right across the
// bar: the fading trail is "caught up" smoothly instead of snapping to the
// variant color. Leaving the complete state reverses the wipe.
.nm-progress--complete.nm-progress--effect-pulse .nm-progress__bar {
  background-size:
    100% 100%,
    100% 100%;
}

// Indeterminate — two chunks chasing across the track with grow/shrink
// choreography (Material-style), one real bar + one pseudo trailing chunk.
.nm-progress--indeterminate .nm-progress__bar {
  // Reset the effect fills so the chasing chunks stay solid.
  background-color: var(--nm-progress-bar-color);
  background-image: none;
  transform-origin: left center;
  animation: nm-progress-indet-primary 2.4s cubic-bezier(0.3, 0, 0.2, 1) infinite;
}

.nm-progress--indeterminate .nm-progress__bar::before {
  content: none;
}

.nm-progress--indeterminate .nm-progress__bar::after {
  content: '';
  left: 0;
  right: 0;
  border-radius: inherit;
  background-color: var(--nm-progress-bar-color);
  background-image: none;
  opacity: 0.45;
  transform-origin: left center;
  animation: nm-progress-indet-secondary 2.4s cubic-bezier(0.3, 0, 0.2, 1) infinite;
}

.nm-progress__label {
  font-size: var(--nm-font-base);
  font-weight: 600;
  color: var(--nm-text-primary);
  min-width: 40px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

// Sizes
.nm-progress--small .nm-progress__track {
  height: var(--nm-progress-height-sm, 6px);
}
.nm-progress--large .nm-progress__track {
  height: var(--nm-progress-height-lg, 18px);
}

// The sweep translates its own width (45% of the bar): -120% hides it left,
// 340% parks it right of the bar — holding the end frame adds a rest between
// sweeps instead of a mechanical constant loop. Opacity is keyed too, so the
// band only ever exists mid-crossing.
@keyframes nm-progress-shimmer {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  48% {
    opacity: 1;
  }
  55% {
    transform: translateX(340%);
    opacity: 0;
  }
  100% {
    transform: translateX(340%);
    opacity: 0;
  }
}

// Breathing halo — drop-shadow follows the beam's own alpha, so the glow
// concentrates on the bright head and fades along the trail.
@keyframes nm-progress-pulse-halo {
  0%,
  100% {
    filter: drop-shadow(0 0 3px color-mix(in srgb, var(--nm-progress-bar-color) 55%, transparent));
  }
  50% {
    filter: drop-shadow(0 0 9px color-mix(in srgb, var(--nm-progress-bar-color) 90%, transparent));
  }
}

// Comet head breathing — opacity plus a subtle bloom scale from the tip.
@keyframes nm-progress-pulse-head {
  0%,
  100% {
    opacity: 0.65;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

// The band is 10% of the bar wide; -150%/1050% of its own width parks it
// fully off either end. It crosses in the first quarter of the cycle, then
// rests — an occasional glint rather than a constant loop. Opacity is keyed
// so the band only exists mid-crossing (see the default shimmer).
@keyframes nm-progress-pulse-sweep {
  0% {
    transform: translateX(-150%);
    opacity: 0;
  }
  4% {
    opacity: 1;
  }
  19% {
    opacity: 1;
  }
  22% {
    transform: translateX(1050%);
    opacity: 0;
  }
  100% {
    transform: translateX(1050%);
    opacity: 0;
  }
}

@keyframes nm-progress-flow {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0);
  }
}

// Each wave layer translates by exactly one of its own tile widths.
@keyframes nm-progress-wave {
  0% {
    transform: translateX(-120px);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes nm-progress-wave-reverse {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-180px);
  }
}

@keyframes nm-progress-stripes {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(22.627px);
  }
}

// Drift by one 96px dot tile; the second layer runs in reverse.
@keyframes nm-progress-sparkle-drift {
  0% {
    transform: translateX(-96px);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes nm-progress-sparkle-twinkle {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes nm-progress-complete-glow {
  0%,
  100% {
    box-shadow:
      inset 0 -2px 4px var(--nm-shadow-dark),
      inset 0 2px 4px var(--nm-shadow-light-ambient-sm),
      0 0 6px color-mix(in srgb, var(--nm-progress-bar-color) 20%, transparent);
  }
  50% {
    box-shadow:
      inset 0 -2px 4px var(--nm-shadow-dark),
      inset 0 2px 4px var(--nm-shadow-light-ambient-sm),
      0 0 14px color-mix(in srgb, var(--nm-progress-bar-color) 40%, transparent);
  }
}

// Bar width is 40% of the track; translateX percentages are relative to the
// bar itself, so 290% ≈ 116% of the track — fully off-screen on both ends.
@keyframes nm-progress-indet-primary {
  0% {
    transform: translateX(-110%) scaleX(0.5);
  }
  45% {
    transform: translateX(50%) scaleX(1.1);
  }
  100% {
    transform: translateX(290%) scaleX(0.5);
  }
}

@keyframes nm-progress-indet-secondary {
  0%,
  25% {
    transform: translateX(-140%) scaleX(0.3);
  }
  65% {
    transform: translateX(60%) scaleX(0.9);
  }
  100% {
    transform: translateX(290%) scaleX(0.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  // The pulse rule's own transition declaration outranks a plain
  // `.nm-progress__bar` selector, so it is listed explicitly.
  .nm-progress__bar,
  .nm-progress--effect-pulse .nm-progress__bar {
    transition: none;
  }
  .nm-progress__bar::before,
  .nm-progress__bar::after {
    animation: none;
  }
  .nm-progress--effect-pulse .nm-progress__bar,
  .nm-progress--complete .nm-progress__bar,
  .nm-progress--indeterminate .nm-progress__bar,
  .nm-progress--indeterminate .nm-progress__bar::after {
    animation: none;
  }
  .nm-progress-circle__svg,
  .nm-progress-circle__fill--indeterminate {
    animation: none;
  }
  // Static 75% arc for reduced motion instead of the pulsing dash.
  .nm-progress-circle__fill--indeterminate {
    stroke-dasharray: calc(var(--nm-progress-c) * 0.75), var(--nm-progress-c);
    stroke-dashoffset: 0;
  }
}

// ---- Circular progress ----
.nm-progress--circle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nm-progress-circle__svg {
  display: block;
  transform: rotate(-90deg);
}

.nm-progress-circle__track {
  stroke: var(--nm-surface-raised);
  transition: stroke var(--nm-transition-slow);
}

.nm-progress-circle__fill {
  stroke: var(--nm-primary-color);
  transition:
    stroke-dashoffset 0.65s cubic-bezier(0.4, 0, 0.2, 1),
    stroke var(--nm-transition-slow);

  &--primary {
    stroke: var(--nm-primary-color);
  }
  &--success {
    stroke: var(--nm-color-success);
  }
  &--warning {
    stroke: var(--nm-color-warning);
  }
  &--error {
    stroke: var(--nm-color-error);
  }
  &--default {
    stroke: var(--nm-text-secondary);
  }
}

// Indeterminate ring: the whole SVG spins (starting from the same -90° rest
// pose, so no jump) while the dash pulses between a dot and a 70% arc.
.nm-progress--indeterminate .nm-progress-circle__svg {
  animation: nm-progress-circle-rotate 1.6s linear infinite;
}

.nm-progress-circle__fill--indeterminate {
  transition: none;
  animation: nm-progress-circle-dash 1.6s ease-in-out infinite;
}

.nm-progress-circle__label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: calc(var(--nm-font-base) * 1.2);
  font-weight: var(--nm-font-weight-semibold);
  color: var(--nm-text-primary);
  font-variant-numeric: tabular-nums;
}

@keyframes nm-progress-circle-rotate {
  from {
    transform: rotate(-90deg);
  }
  to {
    transform: rotate(270deg);
  }
}

// --nm-progress-c is the ring circumference, bound inline by the component.
@keyframes nm-progress-circle-dash {
  0% {
    stroke-dasharray: calc(var(--nm-progress-c) * 0.02), var(--nm-progress-c);
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: calc(var(--nm-progress-c) * 0.7), var(--nm-progress-c);
    stroke-dashoffset: calc(var(--nm-progress-c) * -0.2);
  }
  100% {
    stroke-dasharray: calc(var(--nm-progress-c) * 0.02), var(--nm-progress-c);
    stroke-dashoffset: calc(var(--nm-progress-c) * -0.98);
  }
}
</style>
