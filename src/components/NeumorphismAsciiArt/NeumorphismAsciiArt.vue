<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useArtRenderer } from '@/composables/useArtRenderer'
import { useLocale } from '@/composables/useLocale'

export type AsciiArtRadius = 'none' | 'small' | 'medium' | 'large' | 'xl'

export interface NeumorphismAsciiArtProps {
  /** Image source rendered as ASCII art (required) */
  src: string
  /** Density multiplier of the character grid */
  density?: number
  /** Container width (CSS value or px number); default 100% */
  width?: string | number
  /** Container height (CSS value or px number); omit to auto-fit the image aspect ratio */
  height?: string | number
  /** Pointer interaction: characters near the pointer brighten and enlarge */
  reactive?: boolean
  /** Playback speed multiplier of the shimmer */
  speed?: number
  /** Custom palette; defaults to theme tokens */
  palette?: string[]
  /** Container corner radius */
  radius?: AsciiArtRadius
  /** Accessible label */
  ariaLabel?: string
}

const props = withDefaults(defineProps<NeumorphismAsciiArtProps>(), {
  density: 1,
  reactive: false,
  speed: 1,
  radius: 'large',
})

/** 圆角档位 → token（none 为直角） */
const RADIUS_TOKENS: Record<AsciiArtRadius, string> = {
  none: '0',
  small: 'var(--nm-border-radius-sm)',
  medium: 'var(--nm-border-radius-md)',
  large: 'var(--nm-border-radius-lg)',
  xl: 'var(--nm-border-radius-xl)',
}

/** 图片自然宽高比（w/h）；height 留空时用于容器自适应 */
const imgRatio = ref(0)

watch(
  () => props.src,
  src => {
    imgRatio.value = 0
    if (!src || typeof Image === 'undefined') return
    const img = new Image()
    img.onload = () => {
      if (img.height) imgRatio.value = img.width / img.height
    }
    img.src = src
  },
  { immediate: true }
)

const { t } = useLocale()

const canvasRef = ref<HTMLCanvasElement | null>(null)

useArtRenderer({
  canvas: canvasRef,
  effect: computed(() => 'ascii'),
  reactive: computed(() => props.reactive),
  speed: computed(() => props.speed),
  density: computed(() => props.density),
  palette: computed(() => props.palette),
  seed: computed(() => undefined),
  src: computed(() => props.src),
})

const resolvedAriaLabel = computed(() => props.ariaLabel || t('asciiArtLabel'))

function toCssLength(v: string | number): string {
  return typeof v === 'number' ? `${v}px` : v
}

/** 容器尺寸：width 默认撑满；height 显式传入即拉伸为该尺寸，
 *  留空时按图片宽高比自适应（图片未加载完成前退回 240px 占位） */
const boxStyle = computed(() => ({
  borderRadius: RADIUS_TOKENS[props.radius],
  width: props.width !== undefined ? toCssLength(props.width) : '100%',
  ...(props.height !== undefined
    ? { height: toCssLength(props.height) }
    : imgRatio.value
      ? { aspectRatio: String(imgRatio.value) }
      : { height: '240px' }),
}))
</script>

<template>
  <div class="nm-ascii-art" :style="boxStyle">
    <canvas
      ref="canvasRef"
      class="nm-ascii-art__canvas"
      role="img"
      :aria-label="resolvedAriaLabel"
    />
    <div v-if="$slots.default" class="nm-ascii-art__overlay">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-ascii-art {
  position: relative;
  width: 100%;
  overflow: hidden;
  background-color: var(--nm-bg-color);
  @include nm-inset(3px, 6px);
  @include nm-theme-transition;
}

.nm-ascii-art__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.nm-ascii-art__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: var(--nm-text-primary);
}

@media (prefers-reduced-motion: reduce) {
  .nm-ascii-art {
    transition: none;
  }
}
</style>
