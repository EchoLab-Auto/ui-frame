<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useArtRenderer } from '@/composables/useArtRenderer'
import { useLocale } from '@/composables/useLocale'
import type { ArtMaskName } from '@/components/NeumorphismArt/effects'
import {
  DEFAULT_DOT_MAX,
  DEFAULT_DOT_MIN,
  DEFAULT_OCCUPANCY,
} from '@/components/NeumorphismArt/effects/masks'

/** 图片蒙版：把图片按亮度重绘成什么点阵 */
export type AsciiArtMask = ArtMaskName

/** @deprecated 旧圆角档位（字符串）——保留仅为兼容映射，新代码请传数字（px） */
export type AsciiArtRadius = 'none' | 'small' | 'medium' | 'large' | 'xl'

export interface NeumorphismAsciiArtProps {
  /** Image source to render as a luminance mask (required) */
  src: string
  /**
   * 图片蒙版：把图片按亮度重绘成什么点阵。
   * - `ascii`（默认）：字符梯度 ` .·:-=+*#%@`
   * - `dots`：波点（半调网点，直径随亮度连续变化）
   */
  mask?: AsciiArtMask
  /** 波点蒙版：暗部波点直径（px） */
  dotMin?: number
  /** 波点蒙版：亮部波点直径（px） */
  dotMax?: number
  /**
   * 波点蒙版：网格占用——最大波点直径占单元格边长的比例。
   * `1` = 最亮处波点相切；`0.5` = 只占半格（稀疏网格）。栅格步长 = `dotMax / occupancy`。
   */
  occupancy?: number
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
  /**
   * 容器圆角半径（px，直接就是像素值）。默认 24。
   *
   * @deprecated 字符串档位（`'none' | 'small' | 'medium' | 'large' | 'xl'`）已弃用，
   * 仅按 none=0 / small=8 / medium=16 / large=24 / xl=32（px）兼容映射；新代码请传数字。
   */
  radius?: number | AsciiArtRadius
  /** Accessible label */
  ariaLabel?: string
}

const props = withDefaults(defineProps<NeumorphismAsciiArtProps>(), {
  mask: 'ascii',
  dotMin: DEFAULT_DOT_MIN,
  dotMax: DEFAULT_DOT_MAX,
  occupancy: DEFAULT_OCCUPANCY,
  density: 1,
  reactive: false,
  speed: 1,
  radius: undefined,
})

/** 旧字符串档位 → px（与 `--nm-border-radius-*` 的值一致；已弃用） */
const LEGACY_RADIUS_PX: Record<AsciiArtRadius, number> = {
  none: 0,
  small: 8,
  medium: 16,
  large: 24,
  xl: 32,
}
const DEFAULT_RADIUS_PX = 24

/**
 * 圆角（px）。几何量用数字：档位只能近似表达设计稿上的值。
 *
 * 容错：非有限数退回默认；负值夹到 0（CSS 不接受负圆角）。
 */
const radiusPx = computed(() => {
  const raw = props.radius ?? DEFAULT_RADIUS_PX
  const px = typeof raw === 'number' ? raw : LEGACY_RADIUS_PX[raw]
  if (!Number.isFinite(px)) return DEFAULT_RADIUS_PX
  return Math.max(0, px)
})

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
  mask: computed(() => props.mask),
  dotMin: computed(() => props.dotMin),
  dotMax: computed(() => props.dotMax),
  occupancy: computed(() => props.occupancy),
  // 呼吸流光为低频缓动：30fps 上限于观感无差别，空闲常驻开销减半
  // （指针交互中不节流；滚动期间降到 20fps 继续走，视口外才完全停摆）
  idleFps: 30,
})

const resolvedAriaLabel = computed(
  () => props.ariaLabel || t(props.mask === 'dots' ? 'dotArtLabel' : 'asciiArtLabel')
)

function toCssLength(v: string | number): string {
  return typeof v === 'number' ? `${v}px` : v
}

/** 容器尺寸：width 默认撑满；height 显式传入即拉伸为该尺寸，
 *  留空时按图片宽高比自适应（图片未加载完成前退回 240px 占位） */
const boxStyle = computed(() => ({
  borderRadius: `${radiusPx.value}px`,
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
