<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useSlider, coordinateToValue } from '@/composables/useSlider'

export type SliderSize = 'small' | 'medium' | 'large'

export interface NeumorphismSliderProps {
  /** v-model binding — current slider value */
  modelValue?: number
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step increment */
  step?: number
  /** Whether the slider is disabled */
  disabled?: boolean
  /** Show a tooltip with current value while dragging */
  showTooltip?: boolean
  /** Show stop marks on the track */
  showStops?: boolean
  /** Vertical orientation */
  vertical?: boolean
  /** Slider size */
  size?: SliderSize
}

const props = withDefaults(defineProps<NeumorphismSliderProps>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  showTooltip: true,
  showStops: false,
  vertical: false,
  size: 'medium',
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedSize = computed<SliderSize>(() =>
  resolveProp(props.size, config.value.slider?.size, 'medium')
)

// Whether to show tooltip
const resolvedShowTooltip = computed<boolean>(() =>
  resolveProp(props.showTooltip, config.value.slider?.showTooltip, true)
)

// Whether to show stop marks
const resolvedShowStops = computed<boolean>(() =>
  resolveProp(props.showStops, config.value.slider?.showStops, false)
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}>()

// ==========================================
// Slider composable (headless logic)
// ==========================================

const disabledRef = computed(() => props.disabled)
const verticalRef = computed(() => props.vertical)

const { sliderValue, percentage, setValue, handleKeydown, isDragging } = useSlider({
  modelValue: computed({
    get: () => props.modelValue,
    set: val => {
      emit('update:modelValue', val)
      emit('change', val)
    },
  }),
  min: props.min,
  max: props.max,
  step: props.step,
  disabled: disabledRef,
  vertical: verticalRef,
})

// ==========================================
// Drag interaction via pointer events
// ==========================================

const railRef = ref<HTMLElement | null>(null)
const dragging = ref(false)

function getTrackRect(): DOMRect | null {
  return railRef.value?.getBoundingClientRect() ?? null
}

function updateValueFromEvent(clientX: number, clientY: number): void {
  const rect = getTrackRect()
  if (!rect) return

  const coord = props.vertical ? clientY : clientX
  const trackStart = props.vertical ? rect.top : rect.left
  const trackSize = props.vertical ? rect.height : rect.width

  const value = coordinateToValue(
    coord,
    trackStart,
    trackSize,
    props.min,
    props.max,
    props.step,
    props.vertical
  )
  setValue(value)
}

function onPointerDown(event: PointerEvent): void {
  if (props.disabled) return
  dragging.value = true
  isDragging.value = true

  // Capture pointer for smooth dragging outside the rail
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)

  updateValueFromEvent(event.clientX, event.clientY)
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging.value) return
  updateValueFromEvent(event.clientX, event.clientY)
}

function onPointerUp(event: PointerEvent): void {
  if (!dragging.value) return
  dragging.value = false
  isDragging.value = false

  const target = event.currentTarget as HTMLElement
  target.releasePointerCapture(event.pointerId)
}

// ==========================================
// Stop marks
// ==========================================

interface StopMark {
  value: number
  percentage: number
}

const stops = computed<StopMark[]>(() => {
  if (!resolvedShowStops.value) return []
  const marks: StopMark[] = []
  const range = props.max - props.min
  if (range <= 0) return marks

  for (let v = props.min; v <= props.max; v += props.step) {
    marks.push({
      value: v,
      percentage: ((v - props.min) / range) * 100,
    })
  }
  return marks
})

// ==========================================
// Aria attributes
// ==========================================

const ariaValueText = computed(() => `${sliderValue.value}`)

// ==========================================
// CSS class list
// ==========================================

const classList = computed(() => [
  'nm-slider',
  `nm-slider--${resolvedSize.value}`,
  {
    'nm-slider--disabled': props.disabled,
    'nm-slider--vertical': props.vertical,
    'nm-slider--dragging': dragging.value,
    'nm-slider--show-tooltip': resolvedShowTooltip.value && dragging.value,
  },
])
</script>

<template>
  <div :class="classList" role="group" :aria-label="'Slider'">
    <div
      ref="railRef"
      class="nm-slider__rail"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- Filled track -->
      <div
        class="nm-slider__track"
        :style="{
          [vertical ? 'height' : 'width']: `${percentage}%`,
        }"
        aria-hidden="true"
      />

      <!-- Stop marks -->
      <span
        v-for="stop in stops"
        :key="stop.value"
        class="nm-slider__stop"
        :class="{ 'nm-slider__stop--active': stop.value <= sliderValue }"
        :style="{
          [vertical ? 'top' : 'left']: `${stop.percentage}%`,
        }"
        aria-hidden="true"
      />

      <!-- Thumb -->
      <div
        class="nm-slider__thumb-wrapper"
        :style="{
          [vertical ? 'top' : 'left']: `${percentage}%`,
        }"
      >
        <div
          class="nm-slider__thumb"
          role="slider"
          :tabindex="disabled ? -1 : 0"
          :aria-valuemin="min"
          :aria-valuemax="max"
          :aria-valuenow="sliderValue"
          :aria-valuetext="ariaValueText"
          :aria-disabled="disabled || undefined"
          :aria-orientation="vertical ? 'vertical' : 'horizontal'"
          @keydown="handleKeydown"
          @pointerdown.stop="onPointerDown"
        />

        <!-- Tooltip -->
        <transition name="nm-slider-tooltip">
          <span
            v-if="resolvedShowTooltip && dragging"
            class="nm-slider__tooltip"
            aria-hidden="true"
          >
            {{ sliderValue }}
          </span>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ==========================================
// Physics Constants
// ==========================================
$slider-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
$slider-compress: cubic-bezier(0.4, 0, 0.2, 1);
$slider-ambient: cubic-bezier(0.4, 0, 0.2, 1);
$slider-thumb-spring: cubic-bezier(0.34, 1.1, 0.64, 1);

.nm-slider {
  position: relative;
  display: flex;
  align-items: center;
  user-select: none;
  touch-action: none;

  // ==========================================
  // Orientation
  // ==========================================
  &:not(.nm-slider--vertical) {
    width: 100%;
    min-width: 120px;
  }

  &--vertical {
    flex-direction: column;
    height: 200px;
    min-height: 120px;
    width: auto;
    justify-content: center;
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

// ==========================================
// Rail — concave surface (inset neumorphism)
// ==========================================
.nm-slider__rail {
  position: relative;
  background-color: var(--nm-surface-color);
  cursor: pointer;
  @include nm-theme-transition;

  .nm-slider:not(.nm-slider--vertical) & {
    width: 100%;
    height: var(--nm-slider-rail-size, 8px);
    border-radius: var(--nm-border-radius-full);
    @include nm-inset-strong(2px, 4px);
  }

  .nm-slider--vertical & {
    height: 100%;
    width: var(--nm-slider-rail-size, 8px);
    border-radius: var(--nm-border-radius-full);
    @include nm-inset-strong(2px, 4px);
  }

  .nm-slider--disabled & {
    cursor: not-allowed;
  }

  // Focus ring on thumb via rail (thumb receives keyboard focus)
  &:focus-within .nm-slider__thumb {
    box-shadow:
      0 0 0 2px var(--nm-primary-color),
      inset 2px 2px 4px var(--nm-shadow-dark),
      inset -2px -2px 4px var(--nm-shadow-light),
      0 0 10px color-mix(in srgb, var(--nm-primary-color) 25%, transparent);
  }
}

// ==========================================
// Track — filled portion
// ==========================================
.nm-slider__track {
  position: absolute;
  background: linear-gradient(
    to right,
    var(--nm-slider-track-color, var(--nm-primary-color)),
    color-mix(in srgb, var(--nm-primary-color) 85%, var(--nm-primary-light))
  );
  transition: all 0.3s $slider-ambient;

  .nm-slider:not(.nm-slider--vertical) & {
    top: 0;
    left: 0;
    height: 100%;
    border-radius: var(--nm-border-radius-full) 0 0 var(--nm-border-radius-full);
  }

  .nm-slider--vertical & {
    bottom: 0;
    left: 0;
    width: 100%;
    border-radius: 0 0 var(--nm-border-radius-full) var(--nm-border-radius-full);
  }
}

// ==========================================
// Stop marks
// ==========================================
.nm-slider__stop {
  position: absolute;
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-slider-stop-color, var(--nm-text-placeholder));
  transition:
    background-color 0.3s $slider-ambient,
    transform 0.3s $slider-spring;

  .nm-slider:not(.nm-slider--vertical) & {
    top: 50%;
    width: 4px;
    height: 50%;
    transform: translate(-50%, -50%);
  }

  .nm-slider--vertical & {
    left: 50%;
    height: 4px;
    width: 50%;
    transform: translate(-50%, 50%);
  }

  &--active {
    background-color: var(--nm-text-on-primary);
    transform: translate(-50%, -50%) scale(1.2);
  }
}

// ==========================================
// Thumb wrapper — positioned container
// ==========================================
.nm-slider__thumb-wrapper {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 1;

  .nm-slider:not(.nm-slider--vertical) & {
    top: 50%;
  }

  .nm-slider--vertical & {
    left: 50%;
  }
}

// ==========================================
// Thumb — raised convex handle
// ==========================================
.nm-slider__thumb {
  appearance: none;
  border: none;
  cursor: grab;
  background: linear-gradient(145deg, var(--nm-bg-color) 0%, var(--nm-surface-raised) 100%);
  border-radius: var(--nm-border-radius-full);
  transition:
    box-shadow 0.35s $slider-thumb-spring,
    transform 0.25s $slider-compress,
    background 0.3s $slider-ambient;
  box-shadow:
    1px 2px 4px color-mix(in srgb, black 10%, transparent),
    3px 3px 8px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light),
    0 0 0 1px color-mix(in srgb, var(--nm-primary-color) 10%, transparent);

  &:hover:not(:disabled) {
    box-shadow:
      2px 3px 6px color-mix(in srgb, black 12%, transparent),
      4px 4px 12px var(--nm-shadow-dark),
      -3px -3px 8px var(--nm-shadow-light),
      0 0 0 1px color-mix(in srgb, var(--nm-primary-color) 18%, transparent),
      0 0 14px color-mix(in srgb, var(--nm-primary-color) 15%, transparent);
    transform: scale(1.08);
  }

  &:active,
  .nm-slider--dragging & {
    cursor: grabbing;
    transform: scale(1.12);
    box-shadow:
      3px 4px 8px color-mix(in srgb, black 15%, transparent),
      6px 6px 14px var(--nm-shadow-dark),
      -4px -4px 10px var(--nm-shadow-light),
      0 0 0 2px color-mix(in srgb, var(--nm-primary-color) 25%, transparent),
      0 0 18px color-mix(in srgb, var(--nm-primary-color) 22%, transparent);
    transition:
      box-shadow 0.15s $slider-compress,
      transform 0.15s $slider-compress;
  }

  .nm-slider--disabled & {
    cursor: not-allowed;
  }
}

// ==========================================
// Tooltip
// ==========================================
.nm-slider__tooltip {
  position: absolute;
  background-color: var(--nm-surface-raised);
  color: var(--nm-text-primary);
  font-size: var(--nm-font-sm);
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--nm-border-radius-sm);
  white-space: nowrap;
  box-shadow:
    2px 2px 6px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light);
  pointer-events: none;

  .nm-slider:not(.nm-slider--vertical) & {
    top: calc(-100% - 14px);
    left: 50%;
    transform: translateX(-50%);
  }

  .nm-slider--vertical & {
    left: calc(100% + 12px);
    top: 50%;
    transform: translateY(-50%);
  }

  // Arrow
  &::after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;

    .nm-slider:not(.nm-slider--vertical) & {
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      border-top: 5px solid var(--nm-surface-raised);
    }

    .nm-slider--vertical & {
      left: -4px;
      top: 50%;
      transform: translateY(-50%);
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-right: 5px solid var(--nm-surface-raised);
    }
  }
}

// Tooltip transitions
.nm-slider-tooltip-enter-active {
  transition: all 0.25s $slider-spring;
}

.nm-slider-tooltip-leave-active {
  transition: all 0.15s $slider-ambient;
}

.nm-slider-tooltip-enter-from,
.nm-slider-tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px) scale(0.85);
}

.nm-slider--vertical .nm-slider-tooltip-enter-from,
.nm-slider--vertical .nm-slider-tooltip-leave-to {
  transform: translateY(-50%) translateX(-4px) scale(0.85);
}

// ==========================================
// Size variants
// ==========================================

.nm-slider--small {
  .nm-slider__rail {
    --nm-slider-rail-size: 6px;
  }

  .nm-slider__thumb {
    width: 16px;
    height: 16px;
  }
}

.nm-slider--medium {
  .nm-slider__rail {
    --nm-slider-rail-size: 8px;
  }

  .nm-slider__thumb {
    width: 22px;
    height: 22px;
  }
}

.nm-slider--large {
  .nm-slider__rail {
    --nm-slider-rail-size: 10px;
  }

  .nm-slider__thumb {
    width: 28px;
    height: 28px;
  }
}

// ==========================================
// Reduced motion
// ==========================================
@media (prefers-reduced-motion: reduce) {
  .nm-slider__track,
  .nm-slider__thumb,
  .nm-slider__stop,
  .nm-slider__tooltip,
  .nm-slider-tooltip-enter-active,
  .nm-slider-tooltip-leave-active {
    transition: none !important;
    animation: none !important;
  }

  .nm-slider__thumb:hover:not(:disabled) {
    transform: none;
  }

  .nm-slider__thumb:active,
  .nm-slider--dragging .nm-slider__thumb {
    transform: none;
  }
}
</style>
