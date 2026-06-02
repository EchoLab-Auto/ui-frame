<script setup lang="ts">
import { computed } from 'vue'

export type CardVariant = 'raised' | 'pressed'
export type CardDepth = 'shallow' | 'medium' | 'deep' | 'very-deep'

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
}

// Map old variant+depth to unified elevation
const DEPTH_TO_MAGNITUDE: Record<CardDepth, number> = {
  'shallow': 1,
  'medium': 2,
  'deep': 3,
  'very-deep': 4,
}

const props = withDefaults(defineProps<NeumorphismCardProps>(), {
  radius: 'large',
  noPadding: false,
  hoverable: false,
})

const elevation = computed<number>(() => {
  if (props.elevation !== undefined) return props.elevation
  // Backward-compatible: compute from variant + depth
  const mag = DEPTH_TO_MAGNITUDE[props.depth ?? 'medium']
  return props.variant === 'pressed' ? -mag : mag
})

const classList = computed(() => [
  'nm-card',
  `nm-card--elevation-${elevation.value}`,
  `nm-card--radius-${props.radius}`,
  {
    'nm-card--no-padding': props.noPadding,
    'nm-card--hoverable': !!props.hoverable,
    'nm-card--hover-bulge': props.hoverable === true || props.hoverable === 'bulge',
    'nm-card--hover-sink': props.hoverable === 'sink',
  },
])
</script>

<template>
  <div :class="classList">
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
    ambient: 0 1px 2px rgba(0, 0, 0, 0.04),
    dark-offset: 4px,
    dark-blur: 10px,
    light-offset: -2px,
    light-blur: 6px,
  ),
  2: (
    ambient: 0 2px 4px rgba(0, 0, 0, 0.07),
    dark-offset: 8px,
    dark-blur: 20px,
    light-offset: -4px,
    light-blur: 12px,
  ),
  3: (
    ambient: 0 4px 8px rgba(0, 0, 0, 0.10),
    dark-offset: 12px,
    dark-blur: 28px,
    light-offset: -6px,
    light-blur: 16px,
  ),
  4: (
    ambient: 0 6px 12px rgba(0, 0, 0, 0.14),
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
    map.get($s, light-offset) map.get($s, light-offset) map.get($s, light-blur) var(--nm-shadow-light);
}

/// Emit a pressed (concave) shadow for the given |elevation| magnitude.
@mixin nm-card-pressed($level) {
  $s: map.get($elevation-shadows, $level);
  box-shadow:
    inset map.get($s, dark-offset) map.get($s, dark-offset) map.get($s, dark-blur) var(--nm-shadow-dark-deep),
    inset map.get($s, light-offset) map.get($s, light-offset) map.get($s, light-blur) var(--nm-shadow-light-deep);
}

// ============================================================
//  Base
// ============================================================
.nm-card {
  background-color: var(--nm-surface-color);
  color: var(--nm-text-primary);
  overflow: hidden;
  @include nm-theme-transition;
}

// ---------- Radius ----------
.nm-card--radius-small  { border-radius: var(--nm-border-radius-sm); }
.nm-card--radius-medium { border-radius: var(--nm-border-radius-md); }
.nm-card--radius-large  { border-radius: var(--nm-border-radius-lg); }
.nm-card--radius-xl     { border-radius: var(--nm-border-radius-xl); }

// ---------- Padding ----------
.nm-card:not(.nm-card--no-padding) {
  .nm-card__header { padding: var(--nm-spacing-md) var(--nm-spacing-lg); }
  .nm-card__body   { padding: var(--nm-spacing-lg); }
  .nm-card__footer { padding: var(--nm-spacing-md) var(--nm-spacing-lg); }
}
.nm-card--no-padding {
  .nm-card__header, .nm-card__body, .nm-card__footer { padding: 0; }
}

// ---------- Header / Footer ----------
.nm-card__header { border-bottom: 1px solid transparent; }
.nm-card__footer { border-top:    1px solid transparent; }

// ============================================================
//  Elevation levels — raised (positive)
// ============================================================
.nm-card--elevation-1 { @include nm-card-raised(1); }
.nm-card--elevation-2 { @include nm-card-raised(2); }
.nm-card--elevation-3 { @include nm-card-raised(3); }
.nm-card--elevation-4 { @include nm-card-raised(4); }

// Raised cards get subtle header/footer dividers
.nm-card--elevation-1,
.nm-card--elevation-2,
.nm-card--elevation-3,
.nm-card--elevation-4 {
  .nm-card__header { border-bottom-color: rgba(0, 0, 0, 0.05); }
  .nm-card__footer { border-top-color:    rgba(0, 0, 0, 0.05); }
}

// ============================================================
//  Elevation levels — pressed (negative)
// ============================================================
.nm-card--elevation--1 { @include nm-card-pressed(1); background-color: var(--nm-surface-raised); }
.nm-card--elevation--2 { @include nm-card-pressed(2); background-color: var(--nm-surface-raised); }
.nm-card--elevation--3 { @include nm-card-pressed(3); background-color: var(--nm-surface-raised); }
.nm-card--elevation--4 { @include nm-card-pressed(4); background-color: var(--nm-surface-raised); }

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
  // Raised → more raised
  &.nm-card--elevation-1:hover { @include nm-card-raised(3); }
  &.nm-card--elevation-2:hover { @include nm-card-raised(4); }
  &.nm-card--elevation-3:hover,
  &.nm-card--elevation-4:hover { @include nm-card-raised(4); }

  // Pressed → less pressed (toward surface)
  &.nm-card--elevation--4:hover { @include nm-card-pressed(2); }
  &.nm-card--elevation--3:hover { @include nm-card-pressed(1); }
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

// ============================================================
//  Hover: sink inward
//  Elevation decreases, never crosses sign boundary.
// ============================================================
.nm-card--hover-sink {
  // Pressed → more pressed
  &.nm-card--elevation--1:hover { @include nm-card-pressed(3); }
  &.nm-card--elevation--2:hover { @include nm-card-pressed(4); }
  &.nm-card--elevation--3:hover,
  &.nm-card--elevation--4:hover { @include nm-card-pressed(4); }

  // Raised → less raised (toward surface)
  &.nm-card--elevation-4:hover { @include nm-card-raised(2); }
  &.nm-card--elevation-3:hover { @include nm-card-raised(1); }
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

// ============================================================
//  Hover transitions & transforms
// ============================================================
.nm-card--hoverable {
  transition:
    box-shadow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color var(--nm-transition-slow);
}

.nm-card--hover-bulge:hover {
  transform: scale(1.015);
}

.nm-card--hover-sink:hover {
  transform: scale(0.985);
  background-color: var(--nm-surface-raised);
}
</style>
