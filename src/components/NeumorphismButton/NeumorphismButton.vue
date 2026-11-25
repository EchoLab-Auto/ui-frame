<script setup lang="ts">
import { computed } from 'vue'
import { useConfig } from '@/composables/useConfig'
import { glassClassNames, normalizeGlass, type GlassVariant } from '@/utils/glass'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { BUTTON_SCALE } from '@/utils/controlScales'

/**
 * 按钮的视觉预设 —— **玻璃是其中一档，不是独立开关**。
 *
 * 阴影方向只有一条轴：`raised` / `pressed` 定凸凹，玻璃三档定「材质 + 凸凹」。
 * 曾把玻璃做成与 `variant` 正交的 prop，结果是：
 *
 * 1. 能配出自相矛盾的组合（`variant="pressed" glass="raised"` = 凹陷外形 + 凸起阴影）；
 * 2. 那个「正交」本身是假的 —— 玻璃表面会覆盖 `primary` 的底色，所以
 *    `variant="primary" glass="raised"` 实际渲染的是玻璃色而非主色；
 *    「主色玻璃」只能靠改 `--nm-glass-bg` 得到。
 *
 * 因此玻璃只作为 `variant` 的一个取值存在，不再有 `glass` prop。
 */
export type ButtonVariant =
  'raised' | 'pressed' | 'ghost' | 'primary' | 'glow' | 'glass' | 'glass-raised' | 'glass-pressed'

/** 玻璃变体 → 共用档位名（`@/utils/glass` 的 `GlassVariant`） */
const GLASS_TIER_OF_VARIANT: Partial<Record<ButtonVariant, GlassVariant>> = {
  glass: 'float',
  'glass-raised': 'raised',
  'glass-pressed': 'pressed',
}

/**
 * 钮形：`rounded` / `pill` / `circle` / `square`。
 *
 * `square`（2026-11）：宽 = 高 = `size`，圆角取 `--nm-border-radius-sm`——
 * 图标钮要的形状。与 `circle` 的区别只有圆角与读取的尺寸变量（见样式段注释）。
 */
export type ButtonShape = 'rounded' | 'pill' | 'circle' | 'square'

export interface NeumorphismButtonProps {
  /**
   * 视觉预设：`raised` / `pressed` / `ghost` / `primary` / `glow` / 玻璃三档
   *
   * `ghost`（2026-11）：透明底图标钮——材质取自父级卡面，三态只表达深度。
   * 卡头 / 工具条里只有图标的小操作（刷新、折叠…）用它，配 `shape="square"`。
   */
  variant?: ButtonVariant
  /**
   * 尺寸——px 最小高度（数字，主几何量）。
   *
   * 数字即「最小高度」：字号与内距按三锚点（32 / 44 / 56）分段线性插值；
   * `md` 锚点即 `:size="32"`，`:size="40"` 落在两者之间。
   */
  size?: number
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
}

const props = withDefaults(defineProps<NeumorphismButtonProps>(), {
  disabled: false,
  loading: false,
  type: 'button',
})

// Global config overrides defaults (explicit props still take precedence)
const config = useConfig()

/** 生效变体：显式 prop > 全局配置 `button.variant` > `raised` */
const resolvedVariant = computed<ButtonVariant>(
  () => props.variant ?? config.value.button?.variant ?? 'raised'
)

/** 玻璃档位只由 `variant` 决定，没有第二条来源可供覆盖 */
const resolvedGlass = computed<GlassVariant | false>(() =>
  normalizeGlass(GLASS_TIER_OF_VARIANT[resolvedVariant.value])
)

/**
 * 类名里的「基础变体」。
 *
 * 玻璃三档统一落到 `raised`：玻璃只负责挂 `--glass`（材质）与 `--glass-<档位>`
 * （阴影），而阴影规则的组合特异性（0,2,0）本就压过基础变体规则，基础档取哪个
 * 都不影响观感——固定成 `raised` 是为了让类名序列稳定、可预测。
 */
const resolvedBaseVariant = computed<ButtonVariant>(() =>
  GLASS_TIER_OF_VARIANT[resolvedVariant.value] ? 'raised' : resolvedVariant.value
)

/** 尺寸（px）：显式 prop > 全局配置 > 锚点 `md`（语义 = 最小高度）。 */
const numericSize = computed(() =>
  normalizeNumericSize(props.size ?? config.value.button?.size, BUTTON_SCALE.primary.md)
)

/** 尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() => resolveControlScale(BUTTON_SCALE, numericSize.value))
const resolvedShape = computed(() => props.shape ?? config.value.button?.shape ?? 'rounded')

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const isDisabled = computed(() => props.disabled || props.loading)

const classList = computed(() => [
  'nm-button',
  `nm-button--${resolvedBaseVariant.value}`,
  'nm-button--sized',
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
    :style="sizeStyle"
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

// 数字尺寸（`:size="40"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类，所以不存在覆盖之争。
.nm-button--sized {
  padding: var(--nm-button-sz-pad-y) var(--nm-button-sz-pad-x);
  font-size: var(--nm-button-sz-font);
  min-height: var(--nm-button-sz-height);
  @include nm-touch-min;
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

// 方形钮（2026-11）：图标钮要的是「宽 = 高 = size」，与 circle 的区别只有圆角。
//
// 为什么读 `--nm-button-sz-height` 而不是 `--nm-button-min-height`：circle 读的是
// 三档 token（44px 恒定），数字 `size` 路径下那是另一个变量——`:size="26"` 只写
// `--nm-button-sz-height`，圆钮会拿到未定义的 `--nm-button-min-height`，退化成
// 默认几何量。fallback 链让方形钮同时兼容档位路径（class 触发的三档仍在样式表里）。
//
// `padding: 0` 也必须压：数字路径的 `pad-x` 按锚点插值（26px → 16px），图标钮会
// 被撑成胶囊，宽度不再等于高度。
.nm-button--square {
  border-radius: var(--nm-border-radius-sm);
  padding: 0;
  width: var(--nm-button-sz-height, var(--nm-button-min-height-md));
  height: var(--nm-button-sz-height, var(--nm-button-min-height-md));
  // 触屏：与 circle 同一套兜底（图标钮不能因为 26px 而点不中）
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

// Ghost — 无底色图标钮（2026-11）：卡头 / 工具条里只有图标的小操作。
//
// **材质由父级提供**：`background-color` 覆成透明，按钮不画自己的底，显示的就是
// 所在卡片/条带的底色——在数学上必然与父级相等。反过来「复制父级配方」（surface
// 实色 / 玻璃混合比例）是错的：父级换一次材质，抄来的值就漂一次。
//
// 于是三态只表达**深度**，不表达材质：
// - 静止 0：无底、无投影，只剩图标
// - 悬停 +：凸起双阴影 + `translateY(-1px)`
// - 按下 −：反向 inset，陷进卡片表面
//
// 深度整体比 `.nm-button--raised` 矮一档（2px/5px vs 4px/8px）：图标钮通常只有
// 20–30px，照搬 44px 档的深度看起来像个凸出来的方块。
//
// 基类的 `:focus-visible` 用 `box-shadow` 画环，会被这里的 `box-shadow: none`
// 一起抹掉（同为 0,2,0 特异性，本规则在后）——所以焦点环改用 `outline` 补回来：
// 它不占布局，也不与深度模型抢同一个属性。
.nm-button--ghost {
  background-color: transparent;
  box-shadow: none;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;

  @media (hover: hover) {
    &:not(.nm-button--disabled):hover {
      transform: translateY(-1px);
      box-shadow:
        2px 2px 5px var(--nm-shadow-dark),
        -2px -2px 5px var(--nm-shadow-light);
    }
  }

  &:not(.nm-button--disabled):active {
    transform: translateY(0);
    box-shadow:
      inset 2px 2px 4px var(--nm-shadow-dark-deep),
      inset -2px -2px 4px var(--nm-shadow-light-deep);
  }

  &:focus-visible {
    outline: 2px solid var(--nm-primary-color);
    outline-offset: 2px;
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
//  三个档位分别对应 `variant="glass"` / `"glass-raised"` / `"glass-pressed"`
//  三档变体（玻璃是变体的一档，不是独立 prop），类名由 `glassClassNames()` 生成。
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
