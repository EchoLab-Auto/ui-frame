<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useArtRenderer } from '@/composables/useArtRenderer'
import { useLocale } from '@/composables/useLocale'
import type { ArtEffectName } from './effects'

export type { ArtEffectName }

export interface NeumorphismArtProps {
  /** Experimental effect to render */
  effect?: ArtEffectName
  /** Pointer interaction (hover disturbance / attraction); auto-disabled on touch & reduced-motion */
  reactive?: boolean
  /** Playback speed multiplier */
  speed?: number
  /** Density multiplier (pixel grid / particle count / wave layers / blobs) */
  density?: number
  /** Custom palette; defaults to theme tokens */
  palette?: string[]
  /** Fixed seed for reproducible patterns */
  seed?: number
  /** Image source for image-based effects (ascii) */
  src?: string
  /** Container height (CSS value or px number) */
  height?: string | number
  /** Accessible label */
  ariaLabel?: string
}

const props = withDefaults(defineProps<NeumorphismArtProps>(), {
  speed: 1,
  density: 1,
  height: 240,
})

const emit = defineEmits<{
  (e: 'effect-change', value: ArtEffectName): void
}>()

const { config, resolveProp } = useNeumorphismSetup()
const { t } = useLocale()

const resolvedEffect = computed<ArtEffectName>(() =>
  resolveProp(props.effect, config.value.art?.effect, 'pixel-field')
)
const resolvedReactive = computed<boolean>(() =>
  resolveProp(props.reactive, config.value.art?.reactive, false)
)
const resolvedAriaLabel = computed(() => props.ariaLabel || t('artLabel'))

const canvasRef = ref<HTMLCanvasElement | null>(null)
const paletteRef = computed(() => props.palette)
const seedRef = computed(() => props.seed)

useArtRenderer({
  canvas: canvasRef,
  effect: resolvedEffect,
  reactive: resolvedReactive,
  speed: computed(() => props.speed),
  density: computed(() => props.density),
  palette: paletteRef,
  seed: seedRef,
  src: computed(() => props.src),
})

watch(resolvedEffect, val => emit('effect-change', val))

const heightStyle = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height
)
</script>

<template>
  <div class="nm-art" :style="{ height: heightStyle }">
    <canvas
      ref="canvasRef"
      class="nm-art__canvas"
      :class="{ 'nm-art__canvas--goo': resolvedEffect === 'goo' }"
      role="img"
      :aria-label="resolvedAriaLabel"
    />
    <div v-if="$slots.default" class="nm-art__overlay">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-art {
  position: relative;
  width: 100%;
  border-radius: var(--nm-border-radius-lg);
  overflow: hidden;
  background-color: var(--nm-bg-color);
  @include nm-inset(3px, 6px);
  @include nm-theme-transition;
}

.nm-art__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;

  // goo 融合：模糊 + 对比度把相邻半透明色团「粘连」为一体
  &--goo {
    filter: blur(22px) contrast(18);
  }
}

.nm-art__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: var(--nm-text-primary);
}

@media (prefers-reduced-motion: reduce) {
  .nm-art {
    transition: none;
  }
}
</style>
