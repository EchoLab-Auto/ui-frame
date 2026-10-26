<script setup lang="ts">
import { computed } from 'vue'
import { useSteps } from '@/composables/useSteps'
import type { StepItem, StepStatus } from '@/composables/useSteps'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { STEPS_SCALE } from '@/utils/controlScales'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

export type { StepItem, StepStatus }

/** 档位别名（字符串通道）。数字为一等公民，档位仅兼容保留 */
export type StepsSize = 'small' | 'medium' | 'large'

export interface NeumorphismStepsProps {
  /** Step definitions. */
  steps?: StepItem[]
  /** 0-based index of the current step (v-model). */
  current?: number
  /** Layout direction. */
  direction?: 'horizontal' | 'vertical'
  /**
   * 尺寸——px 序号圆直径（数字，主几何量），或三档预设名。
   *
   * 数字即「序号圆直径」：序号字号按三锚点（28 / 36 / 48）分段线性插值，
   * 所以 `:size="36"` 与 `size="medium"` 逐像素相同。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | StepsSize
  /** When true, title and description are centered below the step circle. */
  center?: boolean
}

const props = withDefaults(defineProps<NeumorphismStepsProps>(), {
  center: undefined,
  steps: () => [],
  current: 0,
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

/** 数字尺寸的语义是「序号圆直径」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 36

/** 原始 size：显式 prop > 全局配置 > medium（两个通道共用同一条级联） */
const rawSize = computed(() => resolveProp(props.size, config.value.steps?.size, 'medium' as const))

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() =>
  typeof rawSize.value === 'number'
    ? normalizeNumericSize(rawSize.value, DEFAULT_SIZE_PX)
    : undefined
)

/** 档位通道：字符串别名（数字路径下取 medium 占位，实际不挂档位类） */
const resolvedSize = computed<StepsSize>(() =>
  typeof rawSize.value === 'string' ? rawSize.value : 'medium'
)

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(STEPS_SCALE, numericSize.value)
)

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
  // 数字与档位互斥：数字走 `--sized`（变量来自内联样式），字符串走档位类
  numericSize.value === undefined ? `nm-steps--${resolvedSize.value}` : 'nm-steps--sized',
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
  <div :class="classList" :style="sizeStyle" role="list">
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
          <NeumorphismIcon
            v-else-if="showCheck(index)"
            name="check"
            class="nm-steps__icon nm-steps__icon--check"
            :stroke-width="3"
          />
          <!-- Error icon for error steps -->
          <NeumorphismIcon
            v-else-if="showError(index)"
            name="close"
            class="nm-steps__icon nm-steps__icon--error"
          />
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

  // 触屏：28/36px → 44×44 命中热区（视觉不变）
  @include nm-touch-target;

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
  @media (hover: hover) {
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      @include nm-raised(3px, 6px);
    }
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

// 数字尺寸（`:size="36"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 档位路径把字号写在 `.nm-steps--<档位> &` 的嵌套规则里（__number / __title /
// __description / __icon），数字路径没有档位类可依附，所以在 `--sized` 下**统一覆盖**
// 这两处：圆几何 + 受尺寸影响的文字/图标，三档 class 一行未改。
.nm-steps--sized .nm-steps__circle {
  width: var(--nm-steps-sz-circle);
  height: var(--nm-steps-sz-circle);
}

// 序号与标题：锚点 12 / 14 / 15 与 `--nm-steps-sz-font` 完全一致，直接接上即可
.nm-steps--sized .nm-steps__number,
.nm-steps--sized .nm-steps__title {
  font-size: var(--nm-steps-sz-font);
}

// 描述：档位取值是 font-xs/sm/md（11/12/13），spec 未为它单列锚点，因此由 sz-font
// 推导并在 11px 处夹住 —— 三个锚点上恰好还原档位值（12-2→11、14-2→12、15-2→13），
// 中间值随主几何量单调变化，不会出现「圆变大、描述字不变」的错位
.nm-steps--sized .nm-steps__description {
  font-size: max(calc(var(--nm-steps-sz-font) - 2px), 11px);
}

// 完成/错误图标：档位是 icon-size-sm/lg/xl（14/18/20）。同理取圆直径的一半并夹在 20px，
// 在 28/36/48 三个锚点上分别得到 14/18/20，与档位逐像素一致
.nm-steps--sized .nm-steps__icon {
  width: min(calc(var(--nm-steps-sz-circle) * 0.5), 20px);
  height: min(calc(var(--nm-steps-sz-circle) * 0.5), 20px);
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
    width: var(--nm-icon-size-sm);
    height: var(--nm-icon-size-sm);
  }
  .nm-steps--medium & {
    width: var(--nm-icon-size-lg);
    height: var(--nm-icon-size-lg);
  }
  .nm-steps--large & {
    width: var(--nm-icon-size-xl);
    height: var(--nm-icon-size-xl);
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
    margin: 0 var(--nm-spacing-xs);
    order: 1;
  }

  .nm-steps--vertical & {
    width: 2px;
    min-height: 20px;
    margin: var(--nm-spacing-xs) 0;
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
  gap: var(--nm-spacing-2xs);

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
