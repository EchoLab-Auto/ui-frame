<script setup lang="ts">
import { computed, inject, type ComputedRef } from 'vue'

export type ColSpan = number | string
export type ColOffset = number | string

export interface NeumorphismColProps {
  /** 栅格占位格数（1-24） */
  span?: ColSpan
  /** 栅格左侧偏移格数 */
  offset?: ColOffset
  /** 响应式占位：<576px */
  xs?: ColSpan
  /** 响应式占位：≥576px */
  sm?: ColSpan
  /** 响应式占位：≥768px */
  md?: ColSpan
  /** 响应式占位：≥992px */
  lg?: ColSpan
  /** 响应式占位：≥1200px */
  xl?: ColSpan
  /** 响应式占位：≥1400px */
  xxl?: ColSpan
}

const props = withDefaults(defineProps<NeumorphismColProps>(), {
  span: 24,
})

const gutter = inject<{ x: ComputedRef<number>; y: ComputedRef<number> }>('nm-row-gutter', {
  x: computed(() => 0),
  y: computed(() => 0),
})

function colClass(prefix: string, val: ColSpan | undefined): string {
  if (val === undefined || val === '') return ''
  return `${prefix}${val}`
}

const classList = computed(() => {
  return [
    colClass('nm-col-', props.span),
    colClass('nm-col-offset-', props.offset),
    colClass('nm-col-xs-', props.xs),
    colClass('nm-col-sm-', props.sm),
    colClass('nm-col-md-', props.md),
    colClass('nm-col-lg-', props.lg),
    colClass('nm-col-xl-', props.xl),
    colClass('nm-col-xxl-', props.xxl),
    'nm-col',
  ].filter(Boolean)
})

const style = computed(() => {
  const gx = gutter.x.value
  const gy = gutter.y.value
  if (gx === 0 && gy === 0) return undefined
  return {
    paddingLeft: gx ? `${gx / 2}px` : undefined,
    paddingRight: gx ? `${gx / 2}px` : undefined,
    paddingTop: gy ? `${gy / 2}px` : undefined,
    paddingBottom: gy ? `${gy / 2}px` : undefined,
  }
})
</script>

<template>
  <div :class="classList" :style="style">
    <slot />
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';
@use '@/styles/mixins.scss' as *;

// Generate column classes
@for $i from 0 through 24 {
  .nm-col-#{$i} { flex: 0 0 math.percentage($i * 0.0416666667); max-width: math.percentage($i * 0.0416666667); }
  .nm-col-offset-#{$i} { margin-left: math.percentage($i * 0.0416666667); }
}

.nm-col {
  box-sizing: border-box;
  flex: 1 0 0%;
  max-width: 100%;
}

// Responsive columns — mobile-first
@include nm-screen-sm {
  @for $i from 0 through 24 {
    .nm-col-sm-#{$i} { flex: 0 0 math.percentage($i * 0.0416666667); max-width: math.percentage($i * 0.0416666667); }
  }
}

@include nm-screen-md {
  @for $i from 0 through 24 {
    .nm-col-md-#{$i} { flex: 0 0 math.percentage($i * 0.0416666667); max-width: math.percentage($i * 0.0416666667); }
  }
}

@include nm-screen-lg {
  @for $i from 0 through 24 {
    .nm-col-lg-#{$i} { flex: 0 0 math.percentage($i * 0.0416666667); max-width: math.percentage($i * 0.0416666667); }
  }
}

@include nm-screen-xl {
  @for $i from 0 through 24 {
    .nm-col-xl-#{$i} { flex: 0 0 math.percentage($i * 0.0416666667); max-width: math.percentage($i * 0.0416666667); }
  }
}

@include nm-screen-xxl {
  @for $i from 0 through 24 {
    .nm-col-xxl-#{$i} { flex: 0 0 math.percentage($i * 0.0416666667); max-width: math.percentage($i * 0.0416666667); }
  }
}

// Touch device — stack columns on small screens
@include nm-touch-device {
  @include nm-mobile-only {
    .nm-col:not([class*="nm-col-xs-"]) {
      flex: 0 0 100%;
      max-width: 100%;
    }
  }
}
</style>
