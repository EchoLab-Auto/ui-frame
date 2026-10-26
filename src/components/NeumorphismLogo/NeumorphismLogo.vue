<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { usePixelLogoAnimation } from '@/composables/usePixelLogoAnimation'
import type { LogoMode as PixelLogoMode } from '@/composables/usePixelLogoAnimation'
import { generateId } from '@/utils'

export type LogoMode = PixelLogoMode
/** @deprecated 旧尺寸档位（字符串）——保留仅为兼容映射，新代码请用 `width` 或数字 */
export type LogoSize = 'small' | 'medium' | 'large'

export interface NeumorphismLogoProps {
  /** Animation mode. */
  mode?: LogoMode
  /**
   * 宽度（px，直接就是像素值）；与 `width` 同义，`width` 优先。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）已弃用，仅按
   * small=120 / medium=220 / large=360（px 宽）兼容映射；新代码请用 `width`。
   */
  size?: number | LogoSize
  /** SVG width (CSS value or number in px). */
  width?: string | number
  /** Whether the gooey filter is enabled. */
  goo?: boolean
  /** Whether to play the intro convergence animation. */
  autoplay?: boolean
  /** Whether the logo wrapper floats up and down. */
  floating?: boolean
  /** Accessible label for the animated logo. */
  ariaLabel?: string
}

const props = withDefaults(defineProps<NeumorphismLogoProps>(), {
  autoplay: undefined,
  floating: undefined,
  goo: undefined,
  ariaLabel: '动态像素 Logo',
})

const emit = defineEmits<{
  (e: 'update:mode', value: LogoMode): void
  (e: 'mode-change', value: LogoMode): void
}>()

const { config, resolveProp } = useNeumorphismSetup()

const resolvedMode = computed<LogoMode>(() =>
  resolveProp(props.mode, config.value.logo?.mode, 'pulse')
)
/** 旧字符串档位 → px 宽度（已弃用） */
const LEGACY_WIDTH_PX: Record<LogoSize, number> = { small: 120, medium: 220, large: 360 }

/** 数字 `size` 由内联宽度承载，此时不再挂档位 class（两者择一，避免打架） */
const resolvedSize = computed<LogoSize>(() => {
  const explicit = typeof props.size === 'number' ? undefined : props.size
  const fromConfig = config.value.logo?.size
  // 全局配置也接受数字（宽度）：数字路径下档位无意义，退回 medium 仅用于 class 名
  const configSize = typeof fromConfig === 'number' ? undefined : fromConfig
  return resolveProp(explicit, configSize, 'medium')
})
const sizeClass = computed(() =>
  typeof props.size === 'number' ? undefined : `nm-logo--${resolvedSize.value}`
)

/**
 * 内联宽度：`width` 优先，其次数字 `size`。
 *
 * 返回 undefined 时交给样式表（旧字符串档位 / 全局配置），行为与档位时代一致。
 */
const numericWidth = computed<number | undefined>(() => {
  const raw = props.width ?? props.size
  if (raw === undefined) return undefined
  if (typeof raw === 'string') return undefined
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : undefined
  return LEGACY_WIDTH_PX[raw as LogoSize]
})
const resolvedGoo = computed<boolean>(() => resolveProp(props.goo, config.value.logo?.goo, true))
const resolvedAutoplay = computed<boolean>(() =>
  resolveProp(props.autoplay, config.value.logo?.autoplay, true)
)
const resolvedFloating = computed<boolean>(() =>
  resolveProp(props.floating, config.value.logo?.floating, true)
)

const svgRef = ref<SVGSVGElement | null>(null)
const linksGroupRef = ref<SVGGElement | null>(null)
const pixelsGroupRef = ref<SVGGElement | null>(null)
const sparksGroupRef = ref<SVGGElement | null>(null)

const {
  mode: activeMode,
  isReducedMotion,
  setMode,
  replay,
  handlePointerMove,
  handlePointerLeave,
} = usePixelLogoAnimation({
  linksGroupRef,
  pixelsGroupRef,
  sparksGroupRef,
  svgRef,
  mode: resolvedMode.value,
  autoplay: resolvedAutoplay.value,
})

// Unique goo filter id per instance — multiple logos on one page must not
// share filter element ids, otherwise url(#goo) resolves to the first instance.
const gooFilterId = generateId('nm-logo-goo')
const gooFilterAttr = computed(() => (resolvedGoo.value ? `url(#${gooFilterId})` : undefined))

watch(resolvedMode, value => {
  setMode(value)
})

function onSetMode(value: LogoMode) {
  setMode(value)
  emit('update:mode', value)
  emit('mode-change', value)
}

const widthStyle = computed(() => {
  const px = numericWidth.value
  if (px !== undefined) return `${px}px`
  const w = props.width
  if (w === undefined) return undefined
  return typeof w === 'number' ? `${w}px` : w
})

const classList = computed(() => [
  'nm-logo',
  ...(sizeClass.value ? [sizeClass.value] : []),
  { 'nm-logo--reduced-motion': isReducedMotion.value },
  { 'nm-logo--no-float': !resolvedFloating.value },
])
</script>

<template>
  <div
    :class="classList"
    :style="{ width: widthStyle }"
    role="img"
    :aria-label="ariaLabel"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <div class="nm-logo__stage">
      <div class="nm-logo__halo" aria-hidden="true" />
      <div class="nm-logo__wrap">
        <svg
          ref="svgRef"
          class="nm-logo__svg"
          viewBox="0 0 512 512"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter :id="gooFilterId" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="b" />
              <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -9.5" />
            </filter>
          </defs>
          <!-- 品牌图形底板：深色画布（与暗色主题融合为设计意图，非主题色） -->
          <rect x="0" y="0" width="512" height="512" rx="96" fill="#000" />
          <g :filter="gooFilterAttr">
            <g ref="linksGroupRef" />
            <g ref="pixelsGroupRef" />
            <g ref="sparksGroupRef" />
          </g>
        </svg>
      </div>
    </div>

    <div v-if="$slots.default" class="nm-logo__panel">
      <slot
        :mode="activeMode"
        :set-mode="onSetMode"
        :replay="replay"
        :is-reduced-motion="isReducedMotion"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-logo {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

.nm-logo__stage {
  position: relative;
  display: grid;
  place-items: center;
}

.nm-logo__halo {
  position: absolute;
  width: 120%;
  height: 120%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--nm-primary-color) 17%, transparent) 0%,
    color-mix(in srgb, var(--nm-primary-color) 5%, transparent) 45%,
    transparent 70%
  );
  filter: blur(10px);
  animation: nm-logo-halo-pulse 4.2s ease-in-out infinite;
  pointer-events: none;
}

.nm-logo__wrap {
  position: relative;
  width: 100%;
  animation: nm-logo-float 7s ease-in-out infinite;
}

.nm-logo__svg {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 19%;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--nm-text-primary) 6%, transparent),
    0 0 42px color-mix(in srgb, var(--nm-primary-color) 10%, transparent) inset;
}

.nm-logo__panel {
  margin-top: var(--nm-spacing-md);
  text-align: center;
  z-index: 2;
}

// Sizes
.nm-logo--small {
  width: 120px;
}

.nm-logo--medium {
  width: 220px;
}

.nm-logo--large {
  width: 360px;
}

// Disable the up-and-down float (keeps internal animation + halo pulse)
.nm-logo--no-float .nm-logo__wrap {
  animation: none;
}

// Reduced motion
.nm-logo--reduced-motion {
  .nm-logo__halo,
  .nm-logo__wrap {
    animation: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-logo__halo,
  .nm-logo__wrap {
    animation: none;
  }
}

@keyframes nm-logo-halo-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.07);
    opacity: 1;
  }
}

@keyframes nm-logo-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
</style>
