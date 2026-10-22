<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { glassClassNames, normalizeGlass, type GlassVariant } from '@/utils/glass'
import { squircleClipPath } from '@/utils/squircle'

export type CardVariant = 'raised' | 'pressed'
export type CardDepth = 'shallow' | 'medium' | 'deep' | 'very-deep'

/**
 * 玻璃拟态档位——与按钮等其它组件共用 `GlassVariant`（见 `@/utils/glass`）。
 *
 * 与 `elevation` 正交：玻璃只替换「表面材质」，台阶高度模型仍由 `elevation` 决定
 * （档位定阴影方向、`|elevation|` 定强度）。
 */
export type CardGlass = GlassVariant

/**
 * Card elevation — unified step-height model:
 *
 *   "台阶" (step) metaphor:
 *     - 台阶底部 (bottom) = the background surface (0)
 *     - 台阶顶部 (top)    = where the card sits
 *
 *   top > 0  → card sits above the surface (raised / convex shadow)
 *   top < 0  → card sits below the surface (pressed / concave shadow)
 *   top = 0  → flush with the surface (flat)
 *
 *   |top|    → determines shadow intensity (1–4)
 *
 *   Hover temporarily shifts `top`:
 *     bulge  → top += 2  (card pushes further out)
 *     sink   → top -= 2  (card sinks further in)
 */
export interface NeumorphismCardProps {
  /**
   * Elevation (step top) relative to the surface.
   *   positive = raised, negative = pressed, 0 = flush.
   *   Magnitude 1–4 controls shadow intensity.
   */
  elevation?: number
  /** @deprecated Use `elevation` instead. Positive = raised, negative = pressed. */
  variant?: CardVariant
  /** @deprecated Use `elevation` magnitude (1–4) instead. */
  depth?: CardDepth
  /** Border radius level */
  radius?: 'small' | 'medium' | 'large' | 'xl'
  /** Whether the card has no padding */
  noPadding?: boolean
  /**
   * Hover effect:
   *   - `true` or `'bulge'` — elevation increases (card swells outward)
   *   - `'sink'` — elevation decreases (card sinks inward)
   */
  hoverable?: boolean | 'bulge' | 'sink'
  /**
   * 玻璃拟态：磨砂玻璃 + 背景模糊。
   *   - `true` / `'float'` — 悬浮磨砂玻璃（环境投影 + 亮边；hover 抬升）
   *   - `'raised'`         — 磨砂玻璃上的凸起双阴影，强度跟随 `elevation`
   *   - `'pressed'`        — 磨砂玻璃上的凹陷内阴影，强度跟随 `|elevation|`
   *
   * 需置于有色背景 / 图片之上才能看到半透明与模糊效果。
   */
  glass?: boolean | CardGlass
  /**
   * 超椭圆圆角（可选）：`true` = 默认指数 2.5；`number` = 自定义指数。
   *
   * 关闭（`false`，默认）时卡片的角是 CSS `border-radius` 的**圆弧**；
   * 开启后改由 `clip-path: path()` 画超椭圆（连续曲率），曲线与设备屏幕角同族 ——
   * 圆弧贴超椭圆会在 45° 附近错位（实测最优半径仍差 2.3px）。
   *
   * 半径取卡片**当前生效的** `border-radius`（即 `radius` prop / 全局配置 /
   * 消费方 CSS 覆盖之后的值），所以「角形状」与「角大小」互不干扰。
   * 注意：开启后 `border-radius` 会被置 0（clip 与圆角是取交集关系，留着会把
   * 超椭圆又裁回圆角矩形）。
   */
  squircle?: boolean | number
  /**
   * 自定义轮廓（任意 `clip-path` 值，典型如 `path("…")`）。给了就以它为准，
   * `squircle` 与 `border-radius` 都让位（同样会把圆角置 0）。
   *
   * 用于「角形状无法用等半径超椭圆表达」的场景 —— 例如会话输入区要贴合设备
   * 屏幕角：下角是屏幕超椭圆的**偏移曲线**、上角取剩余高度，四角并不对称，
   * 由消费方用 `sampleCornerOffset()` 算好后传进来。
   */
  clipPath?: string
}

/**
 * 布局契约（支持而非实现）：卡片的 class/style/attrs 透传到根节点，
 * 父级容器可以经自定义类为卡片施加任意布局（flex 高度分配、网格等）。
 * 卡片自身不内置任何布局模式——布局策略属于消费方（高内聚、可插拔）。
 *
 * 例（Panel 右侧边栏卡片栈）：
 *   <NeumorphismCard glass class="rail-card" :style="{ flexGrow }" />
 *   .rail-card { display: flex; flex-direction: column; min-height: 0; }
 *   .rail-card > .nm-card__body { flex: 1; min-height: 0; overflow-y: auto; }
 */

// Map old variant+depth to unified elevation
const DEPTH_TO_MAGNITUDE: Record<CardDepth, number> = {
  shallow: 1,
  medium: 2,
  deep: 3,
  'very-deep': 4,
}

const props = withDefaults(defineProps<NeumorphismCardProps>(), {
  hoverable: undefined,
  noPadding: false,
  // 默认留 undefined，让全局配置 card.glass 有机会生效
  glass: undefined,
  squircle: false,
  clipPath: undefined,
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedRadius = computed(() => resolveProp(props.radius, config.value.card?.radius, 'large'))
/** `true` 归一为 `'float'`（旧布尔语义的等价档） */
const resolvedGlass = computed<CardGlass | false>(() =>
  normalizeGlass(resolveProp(props.glass, config.value.card?.glass, undefined))
)
const resolvedHoverable = computed(() =>
  resolveProp(props.hoverable, config.value.card?.hoverable, false)
)

const elevation = computed<number>(() => {
  if (props.elevation !== undefined) return props.elevation
  // Backward-compatible: compute from variant + depth
  const mag = DEPTH_TO_MAGNITUDE[props.depth ?? 'medium']
  return props.variant === 'pressed' ? -mag : mag
})

// ============================================================
//  超椭圆轮廓（可选）
// ============================================================

/** 卡片 `squircle: true` 时用的默认指数（iOS 屏角实测 2.42~2.54） */
const DEFAULT_SQUIRCLE_EXPONENT = 2.5

const rootRef = ref<HTMLElement | null>(null)
/** 实测盒尺寸 + 生效圆角（圆角读一次缓存住，见 measure 里的注释） */
const box = ref({ width: 0, height: 0, radius: 0 })

const squircleEnabled = computed(() => props.squircle !== false && props.squircle !== undefined)

/**
 * 量尺寸与生效圆角。
 *
 * 圆角为什么"缓存"：开启轮廓后我们会把 `border-radius` 置 0（clip 与圆角取交集，
 * 留着会把超椭圆又裁回圆角矩形），而那时 computed style 读到的就是 0 —— 若照单
 * 全收，下一次尺寸变化就会把半径算成 0、轮廓消失。所以读到的 0 视为"自己清零的"，
 * 保留上一次的非零值。
 */
function measure(): void {
  const el = rootRef.value
  if (!el || typeof window === 'undefined') return
  const rect = el.getBoundingClientRect()
  const rawRadius = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
  const radius = rawRadius > 0 ? rawRadius : box.value.radius
  if (
    box.value.width !== rect.width ||
    box.value.height !== rect.height ||
    box.value.radius !== radius
  ) {
    box.value = { width: rect.width, height: rect.height, radius }
  }
}

const clipValue = computed<string | undefined>(() => {
  if (props.clipPath) return props.clipPath
  if (!squircleEnabled.value) return undefined
  const { width, height, radius } = box.value
  if (width < 1 || height < 1 || radius < 0.5) return undefined
  const exponent =
    props.squircle === true
      ? DEFAULT_SQUIRCLE_EXPONENT
      : Number(props.squircle) || DEFAULT_SQUIRCLE_EXPONENT
  return squircleClipPath({ width, height, radius, exponent })
})

/**
 * 轮廓通过 **CSS 自定义属性** 下发（`--nm-card-clip`），而不是直接写内联
 * `clip-path`：
 * - 内联 `clip-path: path("…")` 在 jsdom 里会被 cssstyle 的值校验丢掉，
 *   组件行为就没法测；自定义属性存得住。
 * - 消费方也能在样式表里覆盖（例如换成 `polygon()` 做调试）。
 * 样式侧见 `.nm-card { clip-path: var(--nm-card-clip, none) }`。
 */
const rootStyle = computed(() =>
  clipValue.value ? { '--nm-card-clip': clipValue.value } : undefined
)

let observer: ResizeObserver | null = null

function observe(): void {
  const el = rootRef.value
  if (!el || typeof ResizeObserver === 'undefined') return
  observer?.disconnect()
  observer = new ResizeObserver(() => measure())
  observer.observe(el)
}

onMounted(() => {
  if (!squircleEnabled.value) return
  measure()
  observe()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

// 运行期开关（如响应式布局在窄/宽屏切换形状）：开则重新测量并开始观察
watch(squircleEnabled, on => {
  if (on) {
    measure()
    observe()
  } else {
    observer?.disconnect()
    observer = null
  }
})

const classList = computed(() => [
  'nm-card',
  `nm-card--elevation-${elevation.value}`,
  `nm-card--radius-${resolvedRadius.value}`,
  {
    ...Object.fromEntries(glassClassNames('nm-card', resolvedGlass.value).map(c => [c, true])),
    'nm-card--no-padding': props.noPadding,
    'nm-card--hoverable': !!resolvedHoverable.value,
    'nm-card--hover-bulge': resolvedHoverable.value === true || resolvedHoverable.value === 'bulge',
    'nm-card--hover-sink': resolvedHoverable.value === 'sink',
    'nm-card--clipped': !!clipValue.value,
  },
])
</script>

<template>
  <div ref="rootRef" :class="classList" :style="rootStyle">
    <div v-if="$slots.header" class="nm-card__header">
      <slot name="header" />
    </div>
    <div class="nm-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="nm-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use '@/styles/variables.scss' as *;

// ============================================================
//  Unified elevation shadow map
//
//  Each |elevation| level defines:
//    ambient — subtle occlusion that anchors the card
//    dark    — (offset, blur) for the directional dark shadow
//    light   — (offset, blur) for the edge highlight
// ============================================================
$elevation-shadows: (
  0: (
    ambient: none,
    dark-offset: 0,
    dark-blur: 0,
    light-offset: 0,
    light-blur: 0,
  ),
  1: (
    ambient: 0 1px 2px var(--nm-shadow-ambient-sm),
    dark-offset: 4px,
    dark-blur: 10px,
    light-offset: -2px,
    light-blur: 6px,
  ),
  2: (
    ambient: 0 2px 4px var(--nm-shadow-ambient-lg),
    dark-offset: 8px,
    dark-blur: 20px,
    light-offset: -4px,
    light-blur: 12px,
  ),
  3: (
    ambient: 0 4px 8px var(--nm-shadow-ambient-xl),
    dark-offset: 12px,
    dark-blur: 28px,
    light-offset: -6px,
    light-blur: 16px,
  ),
  4: (
    ambient: 0 6px 12px var(--nm-shadow-ambient-2xl),
    dark-offset: 16px,
    dark-blur: 36px,
    light-offset: -8px,
    light-blur: 20px,
  ),
);

/// Emit a raised (convex) shadow for the given |elevation| magnitude.
@mixin nm-card-raised($level) {
  $s: map.get($elevation-shadows, $level);
  box-shadow:
    map.get($s, ambient),
    map.get($s, dark-offset) map.get($s, dark-offset) map.get($s, dark-blur) var(--nm-shadow-dark),
    map.get($s, light-offset) map.get($s, light-offset) map.get($s, light-blur)
      var(--nm-shadow-light);
}

/// Emit a pressed (concave) shadow for the given |elevation| magnitude.
@mixin nm-card-pressed($level) {
  $s: map.get($elevation-shadows, $level);
  box-shadow:
    inset map.get($s, dark-offset) map.get($s, dark-offset) map.get($s, dark-blur)
      var(--nm-shadow-dark-deep),
    inset map.get($s, light-offset) map.get($s, light-offset) map.get($s, light-blur)
      var(--nm-shadow-light-deep);
}

// ============================================================
//  Base
// ============================================================
.nm-card {
  background-color: var(--nm-surface-color);
  /* 超椭圆轮廓（可选）：组件把 `path("…")` 写进这个自定义属性；
     未启用时 var 取兜底 none，等价于没有 clip。 */
  clip-path: var(--nm-card-clip, none);
  color: var(--nm-text-primary);
  overflow: hidden;
  @include nm-theme-transition;
}

// ---------- Radius ----------
.nm-card--radius-small {
  border-radius: var(--nm-border-radius-sm);
}
.nm-card--radius-medium {
  border-radius: var(--nm-border-radius-md);
}
.nm-card--radius-large {
  border-radius: var(--nm-border-radius-lg);
}
.nm-card--radius-xl {
  border-radius: var(--nm-border-radius-xl);
}

// ---------- 超椭圆轮廓 ----------
// clip 与 border-radius 是**取交集**关系：留着圆弧会把超椭圆又裁回圆角矩形
// （实测角部间隙 14 → 16.6px，等于白改）。故轮廓生效时圆角必须归零。
// `!important`：消费方常用更高特异性的选择器覆盖半径（如
// `.wrap .nm-card { border-radius: 24px }`），而这里必须赢。
.nm-card--clipped {
  border-radius: 0 !important;
}

// ---------- Padding ----------
// 子选择器（>）：padding 只作用于本卡片自己的 header/body/footer，
// 避免后代选择器在「卡片套卡片」时把外层卡片的 padding 泄漏给内层卡片
.nm-card:not(.nm-card--no-padding) {
  > .nm-card__header {
    padding: var(--nm-spacing-md) var(--nm-spacing-lg);
  }
  > .nm-card__body {
    padding: var(--nm-spacing-lg);
  }
  > .nm-card__footer {
    padding: var(--nm-spacing-md) var(--nm-spacing-lg);
  }
}
.nm-card--no-padding {
  > .nm-card__header,
  > .nm-card__body,
  > .nm-card__footer {
    padding: 0;
  }
}

// ---------- Header / Footer ----------
.nm-card__header {
  border-bottom: 1px solid transparent;
}
.nm-card__footer {
  border-top: 1px solid transparent;
}

// ============================================================
//  Elevation levels — raised (positive)
// ============================================================
.nm-card--elevation-1 {
  @include nm-card-raised(1);
}
.nm-card--elevation-2 {
  @include nm-card-raised(2);
}
.nm-card--elevation-3 {
  @include nm-card-raised(3);
}
.nm-card--elevation-4 {
  @include nm-card-raised(4);
}

// Raised cards get subtle header/footer dividers
.nm-card--elevation-1,
.nm-card--elevation-2,
.nm-card--elevation-3,
.nm-card--elevation-4 {
  .nm-card__header {
    border-bottom-color: var(--nm-shadow-ambient-subtle);
  }
  .nm-card__footer {
    border-top-color: var(--nm-shadow-ambient-subtle);
  }
}

// ============================================================
//  Elevation levels — pressed (negative)
// ============================================================
.nm-card--elevation--1 {
  @include nm-card-pressed(1);
  background-color: var(--nm-surface-raised);
}
.nm-card--elevation--2 {
  @include nm-card-pressed(2);
  background-color: var(--nm-surface-raised);
}
.nm-card--elevation--3 {
  @include nm-card-pressed(3);
  background-color: var(--nm-surface-raised);
}
.nm-card--elevation--4 {
  @include nm-card-pressed(4);
  background-color: var(--nm-surface-raised);
}

// ============================================================
//  Elevation 0 — flush with the background (no shadow, same color)
// ============================================================
.nm-card--elevation-0 {
  box-shadow: none;
  background-color: var(--nm-bg-color);
}

// ============================================================
//  Hover: bulge outward
//  Elevation increases, never crosses sign boundary.
// ============================================================
.nm-card--hover-bulge {
  @media (hover: hover) {
    // Raised → more raised
    &.nm-card--elevation-1:hover {
      @include nm-card-raised(3);
    }
    &.nm-card--elevation-2:hover {
      @include nm-card-raised(4);
    }
    &.nm-card--elevation-3:hover,
    &.nm-card--elevation-4:hover {
      @include nm-card-raised(4);
    }

    // Pressed → less pressed (toward surface)
    &.nm-card--elevation--4:hover {
      @include nm-card-pressed(2);
    }
    &.nm-card--elevation--3:hover {
      @include nm-card-pressed(1);
    }
    &.nm-card--elevation--2:hover,
    &.nm-card--elevation--1:hover {
      box-shadow: none;
      background-color: var(--nm-bg-color);
    }

    // Flush → raised
    &.nm-card--elevation-0:hover {
      @include nm-card-raised(2);
      background-color: var(--nm-surface-color);
    }
  }
}

// ============================================================
//  Hover: sink inward
//  Elevation decreases, never crosses sign boundary.
// ============================================================
.nm-card--hover-sink {
  @media (hover: hover) {
    // Pressed → more pressed
    &.nm-card--elevation--1:hover {
      @include nm-card-pressed(3);
    }
    &.nm-card--elevation--2:hover {
      @include nm-card-pressed(4);
    }
    &.nm-card--elevation--3:hover,
    &.nm-card--elevation--4:hover {
      @include nm-card-pressed(4);
    }

    // Raised → less raised (toward surface)
    &.nm-card--elevation-4:hover {
      @include nm-card-raised(2);
    }
    &.nm-card--elevation-3:hover {
      @include nm-card-raised(1);
    }
    &.nm-card--elevation-2:hover,
    &.nm-card--elevation-1:hover {
      box-shadow: none;
      background-color: var(--nm-bg-color);
    }

    // Flush → pressed
    &.nm-card--elevation-0:hover {
      @include nm-card-pressed(2);
      background-color: var(--nm-surface-raised);
    }
  }
}

// ============================================================
//  Hover transitions & transforms
// ============================================================
// ============================================================
//  Glass morphism
//
//  玻璃只替换「表面材质」：半透明底 + 背景模糊 + 1px 高光边；
//  阴影由档位决定，与台阶高度模型正交——
//    float   → 环境投影（悬浮感，≈ button `glass`）
//    raised  → 新拟态凸起双阴影，强度跟随 elevation（≈ button `glass-raised`）
//    pressed → 新拟态凹陷内阴影，强度跟随 |elevation|
//
//  `isolation: isolate` 让模糊只在本层发生一次：否则逐层 backdrop-filter
//  既昂贵又会把嵌套内容的边缘糊掉。
// ============================================================

/// 半透明表面上的 1px 高光边——用内描边而非 border，贴合圆角且不占布局
@function nm-card-glass-edge-content() {
  @return inset 0 0 0 1px
    color-mix(
      in srgb,
      var(--nm-shadow-light) calc(var(--nm-glass-border-opacity) * 100%),
      transparent
    );
}

/// 磨砂玻璃 + 凸起双阴影（强度 $level），高光边一并带上
@mixin nm-card-glass-raised($level) {
  $s: map.get($elevation-shadows, $level);
  box-shadow:
    nm-card-glass-edge-content(),
    map.get($s, dark-offset) map.get($s, dark-offset) map.get($s, dark-blur) var(--nm-shadow-dark),
    map.get($s, light-offset) map.get($s, light-offset) map.get($s, light-blur)
      var(--nm-shadow-light);
}

/// 磨砂玻璃 + 凹陷内阴影（强度 $level）
@mixin nm-card-glass-pressed($level) {
  $s: map.get($elevation-shadows, $level);
  box-shadow:
    inset map.get($s, dark-offset) map.get($s, dark-offset) map.get($s, dark-blur)
      var(--nm-shadow-dark-deep),
    inset map.get($s, light-offset) map.get($s, light-offset) map.get($s, light-blur)
      var(--nm-shadow-light-deep),
    nm-card-glass-edge-content();
}

/// 玻璃表面（所有档位共用）
@mixin nm-card-glass-surface {
  background: var(--nm-glass-bg);
  backdrop-filter: blur(var(--nm-glass-blur)) saturate(1.15);
  -webkit-backdrop-filter: blur(var(--nm-glass-blur)) saturate(1.15);
  border: none;
  isolation: isolate;
  // 玻璃更需要主题切换的平滑过渡（底色与环境色都在变）
  transition:
    background-color var(--nm-transition-slow),
    box-shadow var(--nm-transition-slow),
    transform var(--nm-transition-slow);
}

.nm-card--glass {
  @include nm-card-glass-surface;
  box-shadow: nm-card-glass-edge-content();
}

// 不支持 backdrop-filter 时退回近不透明表面色，保证内容可读
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .nm-card--glass {
    background: color-mix(in srgb, var(--nm-surface-color) 94%, transparent);
  }
}

// ---------- float：悬浮磨砂玻璃 ----------
.nm-card--glass-float {
  box-shadow:
    nm-card-glass-edge-content(),
    0 4px 16px var(--nm-shadow-ambient-md),
    0 2px 4px color-mix(in srgb, var(--nm-shadow-dark) 30%, transparent);
}

// ---------- raised / pressed：磨砂玻璃 + 新拟态双阴影 ----------
// 阴影「方向」由玻璃档位决定（raised = 凸起、pressed = 凹陷），
// 强度跟随 |elevation| 且不低于 1 级——elevation=0 或反号时不会塌成无阴影。
@for $level from 1 through 4 {
  .nm-card--glass-raised.nm-card--elevation-#{$level},
  .nm-card--glass-raised.nm-card--elevation--#{$level} {
    @include nm-card-glass-raised($level);
  }

  .nm-card--glass-pressed.nm-card--elevation-#{$level},
  .nm-card--glass-pressed.nm-card--elevation--#{$level} {
    @include nm-card-glass-pressed($level);
  }
}

// 平齐（elevation 0）：按 1 级呈现，避免玻璃"没有体积"
.nm-card--glass-raised.nm-card--elevation-0 {
  @include nm-card-glass-raised(1);
}

.nm-card--glass-pressed.nm-card--elevation-0 {
  @include nm-card-glass-pressed(1);
}

// ---------- 玻璃 + hoverable：抬升段落感（按钮同款观感） ----------
@media (hover: hover) {
  // 悬浮档：离开表面（translateY 抬升 + 影子变深变大）
  .nm-card--glass-float.nm-card--hoverable:hover {
    transform: translateY(-4px);
    background: color-mix(in srgb, var(--nm-surface-color) 75%, transparent);
    box-shadow:
      inset 0 0 0 1px
        color-mix(
          in srgb,
          var(--nm-shadow-light) calc(var(--nm-glass-border-opacity) * 100%),
          transparent
        ),
      0 14px 36px var(--nm-shadow-ambient-xl),
      0 4px 10px color-mix(in srgb, var(--nm-shadow-dark) 30%, transparent);
  }

  // 凸起档：双阴影加强一档（最多到 4 级），并轻微抬升
  .nm-card--glass-raised.nm-card--hoverable:hover {
    transform: translateY(-2px);
    background: color-mix(in srgb, var(--nm-surface-color) 78%, transparent);

    // 凸起档：抬升一档，封顶 4 级
    &.nm-card--elevation-0,
    &.nm-card--elevation-1,
    &.nm-card--elevation--1 {
      @include nm-card-glass-raised(3);
    }
    &.nm-card--elevation-2,
    &.nm-card--elevation-3,
    &.nm-card--elevation-4,
    &.nm-card--elevation--2,
    &.nm-card--elevation--3,
    &.nm-card--elevation--4 {
      @include nm-card-glass-raised(4);
    }
  }

  // 凹陷档：向表面浮起（内阴影减弱一档）
  .nm-card--glass-pressed.nm-card--hoverable:hover {
    background: color-mix(in srgb, var(--nm-bg-color) 70%, transparent);

    // 凹陷档：向表面浮起（内阴影减弱一档）
    &.nm-card--elevation-0,
    &.nm-card--elevation-1,
    &.nm-card--elevation--1,
    &.nm-card--elevation--2 {
      @include nm-card-glass-pressed(1);
    }
    &.nm-card--elevation-2,
    &.nm-card--elevation-3,
    &.nm-card--elevation-4,
    &.nm-card--elevation--3,
    &.nm-card--elevation--4 {
      @include nm-card-glass-pressed(2);
    }
  }
}

.nm-card--hoverable {
  transition:
    box-shadow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color var(--nm-transition-slow);
}

@media (hover: hover) {
  .nm-card--hover-bulge:hover {
    transform: scale(1.015);
  }

  .nm-card--hover-sink:hover {
    transform: scale(0.985);
    background-color: var(--nm-surface-raised);
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
