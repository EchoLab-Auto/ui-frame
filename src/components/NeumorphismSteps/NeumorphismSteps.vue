<script setup lang="ts">
import { computed } from 'vue'
import { useSteps } from '@/composables/useSteps'
import type { StepItem, StepStatus } from '@/composables/useSteps'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export type { StepItem, StepStatus }

export interface NeumorphismStepsProps {
  /** Step definitions. */
  steps?: StepItem[]
  /** 0-based index of the current step (v-model). */
  current?: number
  /** Layout direction. */
  direction?: 'horizontal' | 'vertical'
  /** Size preset for step circles and fonts. */
  size?: 'small' | 'medium' | 'large'
  /** When true, title and description are centered below the step circle. */
  center?: boolean
}

const props = withDefaults(defineProps<NeumorphismStepsProps>(), {
  steps: () => [],
  current: 0,
  direction: 'horizontal',
  size: 'medium',
  center: false,
})

const emit = defineEmits<{
  (e: 'update:current', value: number): void
  (e: 'change', value: number): void
  (e: 'stepClick', step: StepItem): void
}>()

const { config, resolveProp } = useNeumorphismSetup()

const resolvedDirection = computed(() =>
  resolveProp(props.direction, config.value.steps?.direction, 'horizontal')
)
const resolvedSize = computed(() => resolveProp(props.size, config.value.steps?.size, 'medium'))
const resolvedCenter = computed(() => resolveProp(props.center, config.value.steps?.center, false))

// Use headless steps composable for all behavioral logic
const currentIndex = computed({
  get: () => props.current,
  set: val => {
    emit('update:current', val)
    emit('change', val)
  },
})

const { setCurrent } = useSteps({
  steps: computed(() => props.steps),
  current: currentIndex,
})

/** Compute the effective status of a step at a given 0-based index. */
function stepStatus(index: number): StepStatus {
  const step = props.steps[index]
  if (!step) return 'wait'
  if (step.status) return step.status
  if (index < props.current) return 'finish'
  if (index === props.current) return 'process'
  return 'wait'
}

function onStepClick(index: number, step: StepItem) {
  setCurrent(index)
  emit('stepClick', step)
}

const classList = computed(() => [
  'nm-steps',
  `nm-steps--${resolvedDirection.value}`,
  `nm-steps--${resolvedSize.value}`,
  { 'nm-steps--center': resolvedCenter.value },
])

// Determine if a step circle should show the check icon
function showCheck(index: number): boolean {
  return stepStatus(index) === 'finish'
}

// Determine if a step circle should show the error icon
function showError(index: number): boolean {
  return stepStatus(index) === 'error'
}
</script>

<template>
  <div :class="classList" role="list">
    <template v-for="(step, index) in steps" :key="step.key">
      <!-- Step item wrapper -->
      <div
        :class="[
          'nm-steps__item',
          {
            'nm-steps__item--active': index === current,
            'nm-steps__item--clickable':
              stepStatus(index) === 'finish' || stepStatus(index) === 'wait',
          },
        ]"
        role="listitem"
      >
        <!-- Step circle -->
        <button
          :class="['nm-steps__circle', `nm-steps__circle--${stepStatus(index)}`]"
          type="button"
          :aria-current="index === current ? 'step' : undefined"
          :disabled="
            stepStatus(index) !== 'finish' && stepStatus(index) !== 'wait' && index !== current
          "
          @click="onStepClick(index, step)"
        >
          <!-- Number (default when not finished) -->
          <span v-if="!showCheck(index) && !showError(index)" class="nm-steps__number">
            {{ index + 1 }}
          </span>
          <!-- Check icon for finished steps -->
          <svg
            v-else-if="showCheck(index)"
            class="nm-steps__icon nm-steps__icon--check"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <!-- Error icon for error steps -->
          <svg
            v-else-if="showError(index)"
            class="nm-steps__icon nm-steps__icon--error"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <!-- Connector line (between steps) -->
        <div
          v-if="index < steps.length - 1"
          :class="[
            'nm-steps__connector',
            {
              'nm-steps__connector--finished': stepStatus(index) === 'finish',
              'nm-steps__connector--active': index === current,
            },
          ]"
        />

        <!-- Title + Description -->
        <div class="nm-steps__content">
          <span
            :class="[
              'nm-steps__title',
              {
                'nm-steps__title--active': index === current,
                'nm-steps__title--finished': stepStatus(index) === 'finish',
                'nm-steps__title--error': stepStatus(index) === 'error',
              },
            ]"
          >
            {{ step.title }}
          </span>
          <span v-if="step.description" class="nm-steps__description">
            {{ step.description }}
          </span>
        </div>
      </div>
    </template>

    <!-- @slot Custom rendering of each step. Bound: step, index, status, active -->
    <slot v-if="!steps.length" name="empty" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ==========================================
// Steps Container
// ==========================================

.nm-steps {
  display: flex;
  gap: var(--nm-spacing-sm);

  &--horizontal {
    flex-direction: row;
    align-items: flex-start;
  }

  &--vertical {
    flex-direction: column;
    align-items: flex-start;
  }
}

// ==========================================
// Step Item
// ==========================================

.nm-steps__item {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  position: relative;

  .nm-steps--horizontal & {
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .nm-steps--vertical & {
    flex-direction: row;
    width: 100%;
    min-height: 0;
  }

  &--clickable {
    cursor: pointer;
  }
}

// ==========================================
// Step Circle
// ==========================================

.nm-steps__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-surface-color);
  color: var(--nm-text-secondary);
  transition:
    box-shadow 0.35s $nm-ease-spring,
    transform 0.3s $nm-ease-spring,
    color 0.3s $nm-ease-ambient,
    background-color 0.3s $nm-ease-ambient;
  user-select: none;

  // ---- status: wait ----
  &--wait {
    @include nm-raised(2px, 4px);
  }

  // ---- status: process (current / active) ----
  &--process {
    color: var(--nm-text-on-primary);
    background-color: var(--nm-primary-color);
    @include nm-inset-strong(2px, 4px);
    animation: nm-step-activate 0.4s $nm-ease-bounce;
  }

  // ---- status: finish ----
  &--finish {
    color: var(--nm-text-on-primary);
    background-color: var(--nm-primary-color);
    @include nm-raised(1px, 3px);
  }

  // ---- status: error ----
  &--error {
    color: var(--nm-text-on-primary);
    background-color: var(--nm-color-error);
    @include nm-raised(1px, 3px);
    animation: nm-shake 0.4s $nm-ease-compress;
  }

  // Interactive hover (clickable steps)
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    @include nm-raised(3px, 6px);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.95);
    transition:
      transform 0.12s $nm-ease-compress,
      box-shadow 0.12s $nm-ease-compress;
  }

  &:disabled {
    cursor: default;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--nm-primary-color);
  }
}

// Sizes for step circle
.nm-steps--small .nm-steps__circle {
  width: 28px;
  height: 28px;
}
.nm-steps--medium .nm-steps__circle {
  width: 36px;
  height: 36px;
}
.nm-steps--large .nm-steps__circle {
  width: 48px;
  height: 48px;
}

// ==========================================
// Step Number / Icon
// ==========================================

.nm-steps__number {
  font-weight: 600;
  line-height: 1;

  .nm-steps--small & {
    font-size: var(--nm-font-sm);
  }
  .nm-steps--medium & {
    font-size: var(--nm-font-base);
  }
  .nm-steps--large & {
    font-size: var(--nm-font-lg);
  }
}

.nm-steps__icon {
  .nm-steps--small & {
    width: 14px;
    height: 14px;
  }
  .nm-steps--medium & {
    width: 18px;
    height: 18px;
  }
  .nm-steps--large & {
    width: 22px;
    height: 22px;
  }

  &--check {
    animation: nm-step-check 0.3s $nm-ease-decelerate;
  }
}

// ==========================================
// Connector Line
// ==========================================

.nm-steps__connector {
  background-color: var(--nm-text-disabled);
  transition: background-color 0.3s $nm-ease-ambient;

  .nm-steps--horizontal & {
    flex: 1;
    height: 2px;
    margin: 0 4px;
    order: 1;
  }

  .nm-steps--vertical & {
    width: 2px;
    min-height: 20px;
    margin: 4px 0;
    align-self: stretch;
  }

  &--finished {
    background-color: var(--nm-primary-color);
  }

  &--active {
    background: linear-gradient(
      to right,
      var(--nm-primary-color) 0%,
      var(--nm-primary-color) 50%,
      var(--nm-text-disabled) 50%,
      var(--nm-text-disabled) 100%
    );

    .nm-steps--vertical & {
      background: linear-gradient(
        to bottom,
        var(--nm-primary-color) 0%,
        var(--nm-primary-color) 50%,
        var(--nm-text-disabled) 50%,
        var(--nm-text-disabled) 100%
      );
    }
  }
}

// ==========================================
// Content (Title + Description)
// ==========================================

.nm-steps__content {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .nm-steps--center & {
    align-items: center;
    text-align: center;
  }

  .nm-steps--horizontal & {
    align-items: center;
    text-align: center;
  }

  .nm-steps--horizontal.nm-steps--center & {
    align-items: center;
    text-align: center;
  }
}

.nm-steps__title {
  font-weight: 600;
  color: var(--nm-text-primary);
  transition: color 0.3s $nm-ease-ambient;

  .nm-steps--small & {
    font-size: var(--nm-font-sm);
  }
  .nm-steps--medium & {
    font-size: var(--nm-font-base);
  }
  .nm-steps--large & {
    font-size: var(--nm-font-lg);
  }

  &--active {
    color: var(--nm-primary-color);
  }

  &--finished {
    color: var(--nm-primary-color);
  }

  &--error {
    color: var(--nm-color-error);
  }
}

.nm-steps__description {
  color: var(--nm-text-secondary);

  .nm-steps--small & {
    font-size: var(--nm-font-xs);
  }
  .nm-steps--medium & {
    font-size: var(--nm-font-sm);
  }
  .nm-steps--large & {
    font-size: var(--nm-font-md);
  }
}

// ==========================================
// Keyframe Animations
// ==========================================

@keyframes nm-step-activate {
  0% {
    transform: scale(0.9);
  }
  60% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes nm-step-check {
  from {
    opacity: 0;
    transform: scale(0.5) rotate(-30deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

// ==========================================
// Reduced Motion
// ==========================================

@media (prefers-reduced-motion: reduce) {
  .nm-steps__circle {
    transition: none;
    animation: none;
  }
  .nm-steps__connector {
    transition: none;
  }
  .nm-steps__icon--check {
    animation: none;
  }
}
</style>
