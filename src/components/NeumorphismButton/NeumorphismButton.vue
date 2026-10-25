<script setup lang="ts">
import { computed } from 'vue'
import { useConfig } from '@/composables/useConfig'
import { glassClassNames, normalizeGlass, type GlassValue, type GlassVariant } from '@/utils/glass'

export type ButtonVariant = 'raised' | 'pressed' | 'primary' | 'glow' | 'glass' | 'glass-raised'

/** 旧玻璃变体 → 等效玻璃档位（`variant` 上的历史写法，保留兼容） */
const LEGACY_GLASS_VARIANTS: Partial<Record<ButtonVariant, GlassVariant>> = {
  glass: 'float',
  'glass-raised': 'raised',
}
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonShape = 'rounded' | 'pill' | 'circle'

export interface NeumorphismButtonProps {
  /** Button display variant */
  variant?: ButtonVariant
  /** Button size */
  size?: ButtonSize
  /** Button corner shape */
  shape?: ButtonShape
  /** Whether the button is disabled */
  disabled?: boolean
  /** Whether the button is in loading state */
  loading?: boolean
  /** Whether the button is in a pressed/toggled state (sets aria-pressed) */
  pressed?: boolean
  /** HTML button type attribute */
  type?: 'button' | 'submit' | 'reset'
  /** Native button form attribute */
  form?: string
  /** Accessible label for the button */
  ariaLabel?: string
  /**
   * 玻璃拟态档位（与 `NeumorphismCard` 同一套命名）：
   *   - `true` / `'float'` — 悬浮磨砂玻璃，hover 抬升（等价旧 `variant="glass"`）
   *   - `'raised'`         — 磨砂玻璃 + 新拟态凸起双阴影（等价旧 `variant="glass-raised"`）
   *   - `'pressed'`        — 磨砂玻璃 + 凹陷内阴影
   *
   * 与 `variant` 正交：玻璃只换「表面材质」，与 `variant` 同时给时玻璃优先。
   * 显式传入时覆盖旧 `variant` 里的玻璃语义。
   */
  glass?: GlassValue
}

const props = withDefaults(defineProps<NeumorphismButtonProps>(), {
  disabled: false,
  loading: false,
  type: 'button',
  // 显式声明默认值：`glass` 的类型含 boolean，Vue 会把「未传的布尔型 prop」
  // 强制转成 false，从而吃掉全局配置 button.glass 与旧 variant 的玻璃语义
  glass: undefined,
})

// Global config overrides defaults (explicit props still take precedence)
const config = useConfig()
const resolvedVariant = computed<ButtonVariant>(
  () => props.variant ?? config.value.button?.variant ?? 'raised'
)

/**
 * 生效的玻璃档位：显式 `glass` prop > 全局配置 `button.glass` > 旧 `variant` 的玻璃语义。
 *
 * 三条来源归一成同一套档位，因此新旧写法渲染出的类名完全一致。
 */
const resolvedGlass = computed<GlassVariant | false>(() =>
  normalizeGlass(
    props.glass ?? config.value.button?.glass ?? LEGACY_GLASS_VARIANTS[resolvedVariant.value]
  )
)

/** 材质变体：旧玻璃变体不再自带材质，改由玻璃档位决定，故回落到 `raised` */
const resolvedBaseVariant = computed<ButtonVariant>(() =>
  LEGACY_GLASS_VARIANTS[resolvedVariant.value] ? 'raised' : resolvedVariant.value
)
const resolvedSize = computed(() => props.size ?? config.value.button?.size ?? 'medium')
const resolvedShape = computed(() => props.shape ?? config.value.button?.shape ?? 'rounded')

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const isDisabled = computed(() => props.disabled || props.loading)

const classList = computed(() => [
  'nm-button',
  `nm-button--${resolvedBaseVariant.value}`,
  `nm-button--${resolvedSize.value}`,
  `nm-button--${resolvedShape.value}`,
  ...glassClassNames('nm-button', resolvedGlass.value),
  {
    'nm-button--disabled': isDisabled.value,
    'nm-button--loading': props.loading,
  },
])

function handleClick(event: MouseEvent): void {
  if (isDisabled.value) return
  emit('click', event)
}
</script>

<template>
  <button
    :class="classList"
    :type="type"
    :form="form"
    :disabled="isDisabled"
    :aria-label="ariaLabel"
    :aria-busy="loading ? true : undefined"
    :aria-pressed="pressed !== undefined ? pressed : undefined"
    :aria-disabled="isDisabled ? true : undefined"
    @click="handleClick"
  >
    <span v-if="loading" class="nm-button__spinner">
      <svg
        v-once
        class="nm-button__spinner-svg"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-dasharray="31.42"
          stroke-dashoffset="10"
        />
      </svg>
    </span>
    <span class="nm-button__content" :class="{ 'nm-button__content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-sm);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  text-decoration: none;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  background-color: var(--nm-surface-color);
  color: var(--nm-text-primary);
  @include nm-theme-transition;

  // Focus state
  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 2px var(--nm-primary-color),
      4px 4px 8px var(--nm-shadow-dark),
      -4px -4px 8px var(--nm-shadow-light);
  }

  // Disabled state
  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

// ---------- Size variants ----------
.nm-button--small {
  padding: var(--nm-button-padding-y-sm) var(--nm-button-padding-x-sm);
  font-size: var(--nm-button-font-sm);
  min-height: var(--nm-button-min-height-sm);
  // 触屏：紧凑档升为 ≥44×44
  @include nm-touch-min;
}

.nm-button--medium {
  padding: var(--nm-button-padding-y-md) var(--nm-button-padding-x-md);
  font-size: var(--nm-button-font-md);
  min-height: var(--nm-button-min-height-md);
}

.nm-button--large {
  padding: var(--nm-button-padding-y-lg) var(--nm-button-padding-x-lg);
  font-size: var(--nm-button-font-lg);
  min-height: var(--nm-button-min-height-lg);
}

// ---------- Shape variants ----------
.nm-button--rounded {
  border-radius: var(--nm-border-radius-md);
}

.nm-button--pill {
  border-radius: var(--nm-border-radius-full);
}

.nm-button--circle {
  border-radius: var(--nm-border-radius-full);
  padding: 0;
  width: var(--nm-button-min-height);
  height: var(--nm-button-min-height);
  // 触屏：圆形钮最小 44×44
  @include nm-touch-min;
}

// ---------- Style variants ----------

// Raised (default) — convex shadow, lifts toward finger on hover
.nm-button--raised {
  box-shadow:
    0 1px 2px var(--nm-shadow-ambient-md),
    4px 4px 8px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light);
  transition:
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

  @media (hover: hover) {
    &:not(.nm-button--disabled):hover {
      transform: translateY(-2px);
      box-shadow:
        0 3px 6px var(--nm-shadow-ambient-xl),
        6px 6px 14px var(--nm-shadow-dark),
        -3px -3px 10px var(--nm-shadow-light);
    }
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(1px);
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark-deep),
      inset -3px -3px 6px var(--nm-shadow-light-deep);
    transition:
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }
}

// Pressed — inset shadow, sinks deeper on press
.nm-button--pressed {
  box-shadow:
    inset 3px 3px 6px var(--nm-shadow-dark-deep),
    inset -3px -3px 6px var(--nm-shadow-light-deep);
  transition: box-shadow 0.3s ease;

  @media (hover: hover) {
    &:not(.nm-button--disabled):hover {
      box-shadow:
        inset 4px 4px 8px var(--nm-shadow-dark-deep),
        inset -4px -4px 8px var(--nm-shadow-light-deep);
    }
  }

  &:not(.nm-button--disabled):active {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark-deep),
      inset -5px -5px 10px var(--nm-shadow-light-deep);
    transition: box-shadow 0.1s ease;
  }
}

// Primary — gradient fill with semantic color
.nm-button--primary {
  background: linear-gradient(
    135deg,
    var(--nm-color-primary-400),
    var(--nm-color-primary-500),
    var(--nm-color-primary-600)
  );
  color: var(--nm-text-on-primary);
  box-shadow:
    0 2px 6px color-mix(in srgb, var(--nm-primary-color) 35%, transparent),
    -2px -2px 6px var(--nm-shadow-light);

  @media (hover: hover) {
    &:not(.nm-button--disabled):hover {
      background: linear-gradient(
        135deg,
        var(--nm-color-primary-300),
        var(--nm-color-primary-400),
        var(--nm-color-primary-500)
      );
      transform: translateY(-2px);
      box-shadow:
        0 4px 12px color-mix(in srgb, var(--nm-primary-color) 50%, transparent),
        -3px -3px 10px var(--nm-shadow-light);
    }
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(0);
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark-deep),
      inset -3px -3px 6px var(--nm-shadow-light-deep);
  }
}

// Glow — raised button with animated glow pulse
.nm-button--glow {
  box-shadow:
    0 1px 2px var(--nm-shadow-ambient-md),
    4px 4px 8px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light),
    0 0 12px color-mix(in srgb, var(--nm-primary-color) 30%, transparent);

  @media (hover: hover) {
    &:not(.nm-button--disabled):hover {
      transform: translateY(-2px);
      box-shadow:
        0 3px 6px var(--nm-shadow-ambient-xl),
        6px 6px 14px var(--nm-shadow-dark),
        -3px -3px 10px var(--nm-shadow-light),
        0 0 24px color-mix(in srgb, var(--nm-primary-color) 50%, transparent);
    }
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(1px);
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark-deep),
      inset -3px -3px 6px var(--nm-shadow-light-deep);
    transition:
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }
}

// ============================================================
//  Glass morphism
//
//  与 NeumorphismCard 共用同一套档位（`@/utils/glass` → float / raised / pressed），
//  类名同样拆成「表面 + 档位」两层：
//
//    .nm-button--glass               材质：半透明底 + 背景模糊 + 1px 高光内描边
//    .nm-button--glass-float         阴影：环境投影（悬浮感），hover 再抬升
//    .nm-button--glass-raised        阴影：新拟态凸起双阴影
//    .nm-button--glass-pressed       阴影：新拟态凹陷内阴影
//
//  旧写法无缝迁移：`variant="glass"` → float、`variant="glass-raised"` → raised，
//  两者都由 `glassClassNames()` 生成上述类名，渲染结果与旧版一致。
//
//  双类选择器（`.x--glass.x--glass-raised`，特异性 0,2,0）保证档位阴影压过
//  `.nm-button--raised` 等基础变体，不依赖样式表书写顺序。
// ============================================================

/// 磨砂玻璃表面（所有档位共用）
@mixin nm-button-glass-surface {
  background: var(--nm-glass-bg);
  backdrop-filter: blur(var(--nm-glass-blur)) saturate(1.15);
  -webkit-backdrop-filter: blur(var(--nm-glass-blur)) saturate(1.15);
  border: none;
  isolation: isolate;
  transition:
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color var(--nm-transition-slow);
}

/// 半透明表面上的 1px 高光边（内描边，贴合圆角且不占布局）
@function nm-button-glass-edge() {
  @return inset 0 0 0 1px
    color-mix(
      in srgb,
      var(--nm-shadow-light) calc(var(--nm-glass-border-opacity) * 100%),
      transparent
    );
}

.nm-button--glass {
  @include nm-button-glass-surface;
  box-shadow: nm-button-glass-edge();
}

// 不支持 backdrop-filter 时退回近不透明表面色，保证文字可读
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .nm-button--glass {
    background: color-mix(in srgb, var(--nm-surface-color) 94%, transparent);
  }
}

// ---------- float — 悬浮磨砂玻璃，hover 抬升 ----------
.nm-button--glass.nm-button--glass-float {
  box-shadow:
    nm-button-glass-edge(),
    0 8px 24px var(--nm-shadow-ambient-lg),
    0 2px 6px color-mix(in srgb, var(--nm-shadow-dark) 25%, transparent);

  @media (hover: hover) {
    &:not(.nm-button--disabled):hover {
      transform: translateY(-3px);
      background: color-mix(in srgb, var(--nm-surface-color) 75%, transparent);
      box-shadow:
        nm-button-glass-edge(),
        0 14px 36px var(--nm-shadow-ambient-xl),
        0 4px 10px color-mix(in srgb, var(--nm-shadow-dark) 30%, transparent);
    }
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(1px);
    background: color-mix(in srgb, var(--nm-surface-color) 55%, transparent);
    box-shadow:
      nm-button-glass-edge(),
      0 2px 8px var(--nm-shadow-ambient-sm),
      0 1px 3px color-mix(in srgb, var(--nm-shadow-dark) 20%, transparent);
    transition:
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }
}

// ---------- raised — 磨砂玻璃上的新拟态凸起 ----------
.nm-button--glass.nm-button--glass-raised {
  box-shadow:
    nm-button-glass-edge(),
    0 1px 2px var(--nm-shadow-ambient-md),
    4px 4px 8px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light);

  @media (hover: hover) {
    &:not(.nm-button--disabled):hover {
      transform: translateY(-2px);
      background: color-mix(in srgb, var(--nm-surface-color) 75%, transparent);
      box-shadow:
        nm-button-glass-edge(),
        0 3px 6px var(--nm-shadow-ambient-xl),
        6px 6px 14px var(--nm-shadow-dark),
        -3px -3px 10px var(--nm-shadow-light);
    }
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(1px);
    background: color-mix(in srgb, var(--nm-surface-color) 55%, transparent);
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark-deep),
      inset -3px -3px 6px var(--nm-shadow-light-deep),
      nm-button-glass-edge();
    transition:
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }
}

// ---------- pressed — 磨砂玻璃上的凹槽 ----------
.nm-button--glass.nm-button--glass-pressed {
  box-shadow:
    inset 3px 3px 6px var(--nm-shadow-dark-deep),
    inset -3px -3px 6px var(--nm-shadow-light-deep),
    nm-button-glass-edge();

  // 凹陷档不位移：底色变体的 hover/active 位移会用更高的组合特异性漏过来，
  // 这里显式归零（凹陷玻璃"越按越深"，而不是"浮起来"）
  @media (hover: hover) {
    &:not(.nm-button--disabled):hover {
      transform: none;
      box-shadow:
        inset 4px 4px 8px var(--nm-shadow-dark-deep),
        inset -4px -4px 8px var(--nm-shadow-light-deep),
        nm-button-glass-edge();
    }
  }

  &:not(.nm-button--disabled):active {
    transform: none;
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark-deep),
      inset -5px -5px 10px var(--nm-shadow-light-deep),
      nm-button-glass-edge();
    transition: box-shadow 0.1s ease;
  }
}

// 焦点环：玻璃档位的双类阴影（0,2,0）会把基础 `:focus-visible` 的 box-shadow 覆盖掉，
// 这里改用 outline 保证键盘焦点始终可见（且不受阴影重排影响）
.nm-button--glass:focus-visible {
  outline: 2px solid var(--nm-primary-color);
  outline-offset: 2px;
}

// ---------- Loading spinner ----------
.nm-button__spinner {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--nm-text-secondary);

  svg {
    width: 100%;
    height: 100%;
  }
}

.nm-button__spinner-svg {
  animation: nm-spin 1s linear infinite;
}

@keyframes nm-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.nm-button__content {
  display: inline-flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  transition: opacity var(--nm-transition-fast);

  &--hidden {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
