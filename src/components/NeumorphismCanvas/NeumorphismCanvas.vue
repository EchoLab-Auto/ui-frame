<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export interface NeumorphismCanvasProps {
  /** Current zoom level (1 = 100%) */
  modelValue?: number
  /** Minimum zoom level */
  minZoom?: number
  /** Maximum zoom level */
  maxZoom?: number
  /** Zoom step for +/- buttons */
  zoomStep?: number
  /** Whether to show the grid background */
  showGrid?: boolean
  /** Grid cell size in pixels (before zoom) */
  gridSize?: number
  /** Grid pattern variant */
  gridVariant?: 'dots' | 'lines'
  /** Whether to show zoom controls */
  showControls?: boolean
  /** Whether the controls include the fit-to-screen button */
  showFit?: boolean
  /** Whether the controls include the fullscreen toggle */
  showFullscreen?: boolean
  /** Pan the canvas by dragging with the mouse (space + drag always works) */
  panOnDrag?: boolean
  /** Zoom to cursor with Ctrl/Cmd + wheel */
  wheelZoom?: boolean
  /** Canvas width (CSS value, e.g. '100%', '800px') */
  width?: string
  /** Canvas height (CSS value) */
  height?: string
}

const props = withDefaults(defineProps<NeumorphismCanvasProps>(), {
  showControls: undefined,
  showGrid: undefined,
  gridVariant: undefined,
  modelValue: 1,
  minZoom: 0.1,
  maxZoom: 5,
  zoomStep: 0.1,
  showFit: true,
  showFullscreen: true,
  panOnDrag: true,
  wheelZoom: true,
  width: '100%',
  height: '500px',
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedShowGrid = computed(() =>
  resolveProp(props.showGrid, config.value.canvas?.showGrid, true)
)
const resolvedGridSize = computed(() =>
  resolveProp(props.gridSize, config.value.canvas?.gridSize, 20)
)
const resolvedGridVariant = computed(() =>
  resolveProp(props.gridVariant, config.value.canvas?.gridVariant, 'dots')
)
const resolvedShowControls = computed(() =>
  resolveProp(props.showControls, config.value.canvas?.showControls, true)
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'zoom-change', value: number): void
}>()

const { t } = useLocale()

// ---- Zoom state (hybrid controlled: works with or without v-model) ----
const innerZoom = ref(props.modelValue)
watch(
  () => props.modelValue,
  val => {
    if (val !== innerZoom.value) innerZoom.value = clampZoom(val)
  }
)

const zoomPercent = computed(() => Math.round(innerZoom.value * 100))

function clampZoom(z: number): number {
  return Math.min(props.maxZoom, Math.max(props.minZoom, Math.round(z * 1000) / 1000))
}

// ---- Element refs & natural content size ----
const rootRef = ref<HTMLElement>()
const viewportRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const naturalWidth = ref(0)
const naturalHeight = ref(0)

interface ViewportAnchor {
  ax: number
  ay: number
  cx: number
  cy: number
}
let pendingAnchor: ViewportAnchor | null = null

/** Whether transform transitions are enabled (button zooms animate, wheel is instant) */
const smoothZoom = ref(true)

/**
 * Change zoom, keeping the given viewport-relative point stationary.
 * Without an explicit anchor the viewport center is used.
 */
function setZoom(next: number, anchor?: { x: number; y: number }, smooth = true) {
  const z = clampZoom(next)
  if (z === innerZoom.value) return
  const vp = viewportRef.value
  if (vp) {
    const ax = anchor?.x ?? vp.clientWidth / 2
    const ay = anchor?.y ?? vp.clientHeight / 2
    pendingAnchor = {
      ax,
      ay,
      cx: (vp.scrollLeft + ax) / innerZoom.value,
      cy: (vp.scrollTop + ay) / innerZoom.value,
    }
  }
  smoothZoom.value = smooth
  innerZoom.value = z
  emit('update:modelValue', z)
  emit('zoom-change', z)
  void nextTick(applyAnchor)
}

function applyAnchor() {
  const vp = viewportRef.value
  if (!vp || !pendingAnchor) return
  const { ax, ay, cx, cy } = pendingAnchor
  pendingAnchor = null
  vp.scrollLeft = cx * innerZoom.value - ax
  vp.scrollTop = cy * innerZoom.value - ay
}

function zoomIn() {
  setZoom(innerZoom.value + props.zoomStep)
}

function zoomOut() {
  setZoom(innerZoom.value - props.zoomStep)
}

function resetZoom() {
  setZoom(1)
}

/** Scale content to fit the viewport (with padding) and center it. */
function fit() {
  const vp = viewportRef.value
  if (!vp || !naturalWidth.value || !naturalHeight.value) return
  const pad = 32
  const z = Math.min(
    (vp.clientWidth - pad) / naturalWidth.value,
    (vp.clientHeight - pad) / naturalHeight.value
  )
  setZoom(z, undefined, true)
  void nextTick(() => {
    const v = viewportRef.value
    if (!v) return
    v.scrollLeft = Math.max(0, (naturalWidth.value * innerZoom.value - v.clientWidth) / 2)
    v.scrollTop = Math.max(0, (naturalHeight.value * innerZoom.value - v.clientHeight) / 2)
  })
}

// ---- Panning (mouse drag / space + drag; touch uses native scroll) ----
const isPanning = ref(false)
const spaceDown = ref(false)
const hovering = ref(false)
const canPan = computed(() => props.panOnDrag || spaceDown.value)

interface PanStart {
  pointerId: number
  x: number
  y: number
  left: number
  top: number
}
let panStart: PanStart | null = null
let panMoved = false

function onPointerDown(e: PointerEvent) {
  const vp = viewportRef.value
  if (!vp || e.button !== 0 || !canPan.value) return
  if (e.pointerType === 'touch') return // native overflow scroll handles touch
  const target = e.target as HTMLElement | null
  if (
    target?.closest('.nm-canvas__controls, button, a, input, textarea, select, [data-nm-no-pan]')
  ) {
    return
  }
  panStart = {
    pointerId: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    left: vp.scrollLeft,
    top: vp.scrollTop,
  }
  panMoved = false
  // Block text-selection start for mouse; clicks still fire when there's no movement
  e.preventDefault()
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  const vp = viewportRef.value
  if (!vp || !panStart || e.pointerId !== panStart.pointerId) return
  const dx = e.clientX - panStart.x
  const dy = e.clientY - panStart.y
  if (!panMoved && Math.hypot(dx, dy) < 4) return
  panMoved = true
  isPanning.value = true
  vp.scrollLeft = panStart.left - dx
  vp.scrollTop = panStart.top - dy
}

function onPointerUp() {
  panStart = null
  isPanning.value = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

function onWindowKeyDown(e: KeyboardEvent) {
  if (e.code !== 'Space') return
  const active = document.activeElement as HTMLElement | null
  if (
    active &&
    (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)
  ) {
    return
  }
  const inside = !!(active && rootRef.value?.contains(active))
  if (!hovering.value && !inside) return
  spaceDown.value = true
  e.preventDefault() // stop page scroll while the canvas is the interaction target
}

function onWindowKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') spaceDown.value = false
}

// ---- Wheel zoom (Ctrl/Cmd + wheel → zoom to cursor) ----
function onWheel(e: WheelEvent) {
  if (!props.wheelZoom || !(e.ctrlKey || e.metaKey)) return
  const vp = viewportRef.value
  if (!vp) return
  e.preventDefault()
  const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
  const factor = Math.exp(-delta * 0.002)
  const rect = vp.getBoundingClientRect()
  setZoom(innerZoom.value * factor, { x: e.clientX - rect.left, y: e.clientY - rect.top }, false)
}

// ---- Keyboard navigation on the viewport ----
function onViewportKeydown(e: KeyboardEvent) {
  const vp = viewportRef.value
  if (!vp) return
  const step = e.shiftKey ? 200 : 60
  switch (e.key) {
    case 'ArrowUp':
      vp.scrollTop -= step
      break
    case 'ArrowDown':
      vp.scrollTop += step
      break
    case 'ArrowLeft':
      vp.scrollLeft -= step
      break
    case 'ArrowRight':
      vp.scrollLeft += step
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
    case '_':
      zoomOut()
      break
    case '0':
      resetZoom()
      break
    default:
      return
  }
  e.preventDefault()
}

// ---- Fullscreen ----
const isFullscreen = ref(false)

function syncFullscreen() {
  isFullscreen.value = document.fullscreenElement === rootRef.value
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    void rootRef.value?.requestFullscreen?.()
  } else {
    void document.exitFullscreen?.()
  }
}

// ---- Lifecycle: size observer + global listeners ----
let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  const content = contentRef.value
  const vp = viewportRef.value
  if (content) {
    naturalWidth.value = content.offsetWidth
    naturalHeight.value = content.offsetHeight
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        const el = contentRef.value
        if (!el) return
        naturalWidth.value = el.offsetWidth
        naturalHeight.value = el.offsetHeight
      })
      resizeObserver.observe(content)
    }
  }
  vp?.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('keydown', onWindowKeyDown)
  window.addEventListener('keyup', onWindowKeyUp)
  document.addEventListener('fullscreenchange', syncFullscreen)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  viewportRef.value?.removeEventListener('wheel', onWheel)
  window.removeEventListener('keydown', onWindowKeyDown)
  window.removeEventListener('keyup', onWindowKeyUp)
  document.removeEventListener('fullscreenchange', syncFullscreen)
  onPointerUp()
})

// ---- Styles ----
const sizerStyle = computed(() => ({
  width: `${Math.ceil(naturalWidth.value * innerZoom.value)}px`,
  height: `${Math.ceil(naturalHeight.value * innerZoom.value)}px`,
}))

const gridStyle = computed(() => {
  if (!resolvedShowGrid.value) return {}
  const size = Math.max(resolvedGridSize.value * innerZoom.value, 3)
  const image =
    resolvedGridVariant.value === 'lines'
      ? `linear-gradient(to right, var(--nm-border-subtle) 1px, transparent 1px),
         linear-gradient(to bottom, var(--nm-border-subtle) 1px, transparent 1px)`
      : `radial-gradient(circle, var(--nm-canvas-grid-color) 1px, transparent 1.2px)`
  return {
    backgroundImage: image,
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: '0 0',
  }
})

const contentStyle = computed(() => ({
  transform: `scale(${innerZoom.value})`,
}))

const wrapperStyle = computed(() => ({
  width: props.width,
  height: props.height,
}))

const viewportClass = computed(() => ({
  'nm-canvas__viewport--pannable': canPan.value,
  'nm-canvas__viewport--panning': isPanning.value,
}))

const classList = computed(() => ['nm-canvas', { 'nm-canvas--fullscreen': isFullscreen.value }])

defineExpose({ zoomIn, zoomOut, resetZoom, fit, toggleFullscreen })
</script>

<template>
  <div ref="rootRef" :class="classList" :style="wrapperStyle">
    <!-- Optional top toolbar (only rendered when the slot is used) -->
    <div v-if="$slots.toolbar" class="nm-canvas__toolbar">
      <slot name="toolbar" />
    </div>

    <!-- Canvas viewport -->
    <div
      ref="viewportRef"
      class="nm-canvas__viewport"
      :class="viewportClass"
      tabindex="0"
      role="application"
      :aria-label="t('canvasLabel')"
      @pointerdown="onPointerDown"
      @pointerenter="hovering = true"
      @pointerleave="hovering = false"
      @keydown="onViewportKeydown"
    >
      <div class="nm-canvas__sizer" :style="[sizerStyle, gridStyle]">
        <div
          ref="contentRef"
          class="nm-canvas__content"
          :class="{ 'nm-canvas__content--smooth': smoothZoom }"
          :style="contentStyle"
        >
          <slot />
        </div>
      </div>
    </div>

    <!-- Floating control cluster -->
    <div v-if="resolvedShowControls" class="nm-canvas__controls">
      <button
        type="button"
        class="nm-canvas__btn"
        :aria-label="t('canvasZoomOut')"
        :disabled="innerZoom <= minZoom"
        @click="zoomOut"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
          <path
            d="M8 11h6M21 21l-4.35-4.35"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <span class="nm-canvas__zoom-text">{{ zoomPercent }}%</span>

      <button
        type="button"
        class="nm-canvas__btn"
        :aria-label="t('canvasZoomIn')"
        :disabled="innerZoom >= maxZoom"
        @click="zoomIn"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
          <path
            d="M11 8v6M8 11h6M21 21l-4.35-4.35"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <span class="nm-canvas__divider" aria-hidden="true" />

      <button
        type="button"
        class="nm-canvas__btn nm-canvas__btn--reset"
        :aria-label="t('canvasZoomReset')"
        @click="resetZoom"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M3 3v5h5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <button
        v-if="showFit"
        type="button"
        class="nm-canvas__btn"
        :aria-label="t('canvasZoomFit')"
        @click="fit"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <button
        v-if="showFullscreen"
        type="button"
        class="nm-canvas__btn"
        :aria-label="isFullscreen ? t('canvasExitFullscreen') : t('canvasFullscreen')"
        @click="toggleFullscreen"
      >
        <svg
          v-if="!isFullscreen"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-canvas {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--nm-border-radius-md);
  background-color: var(--nm-surface-color);
  @include nm-inset-deep(6px, 12px);
  @include nm-theme-transition;
  overflow: hidden;

  &:fullscreen,
  &--fullscreen {
    width: 100% !important;
    height: 100% !important;
    border-radius: 0;
  }
}

// Optional top toolbar (slot-provided)
.nm-canvas__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--nm-spacing-sm) 12px;
  border-bottom: 1px solid var(--nm-border-subtle);
  flex-shrink: 0;
}

// Viewport
.nm-canvas__viewport {
  flex: 1;
  overflow: auto;
  position: relative;
  outline: none;

  &:focus-visible {
    box-shadow: inset 0 0 0 2px var(--nm-primary-color);
  }

  &--pannable {
    cursor: grab;
  }

  &--panning {
    cursor: grabbing;
    user-select: none;
  }
}

.nm-canvas__sizer {
  position: relative;
  min-width: 100%;
  min-height: 100%;
  background-color: var(--nm-bg-color);
  transition: background-size 0.3s $nm-ease-ambient;
}

.nm-canvas__content {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;

  &--smooth {
    transition: transform 0.3s $nm-ease-spring;
  }
}

// Floating control cluster (bottom-center pill)
.nm-canvas__controls {
  position: absolute;
  left: 50%;
  bottom: var(--nm-spacing-md);
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-surface-color);
  @include nm-raised-strong(4px, 10px);
  @include nm-theme-transition;
}

.nm-canvas__divider {
  width: 1px;
  height: 18px;
  margin: 0 2px;
  background-color: var(--nm-border-subtle);
  flex-shrink: 0;
}

.nm-canvas__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--nm-border-radius-full);
  background-color: transparent;
  color: var(--nm-text-secondary);
  cursor: pointer;
  transition:
    background-color 0.25s $nm-ease-ambient,
    box-shadow 0.25s $nm-ease-spring,
    color 0.25s $nm-ease-ambient;

  svg {
    width: var(--nm-spacing-md);
    height: var(--nm-spacing-md);
    transition: transform 0.3s $nm-ease-spring;
  }

  @media (hover: hover) {
    &:hover:not(:disabled) {
      color: var(--nm-primary-color);
      background-color: var(--nm-surface-raised);
      @include nm-inset-strong(1px, 2px);
    }
  }

  &:active:not(:disabled) {
    @include nm-inset-strong(2px, 4px);
  }

  &:focus-visible {
    outline: 2px solid var(--nm-primary-color);
    outline-offset: -2px;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &--reset {
    @media (hover: hover) {
      &:hover:not(:disabled) svg {
        transform: rotate(-180deg);
      }
    }
  }
}

.nm-canvas__zoom-text {
  min-width: 48px;
  text-align: center;
  font-size: var(--nm-font-sm);
  font-weight: 600;
  color: var(--nm-text-secondary);
  user-select: none;
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .nm-canvas__content,
  .nm-canvas__sizer,
  .nm-canvas__btn,
  .nm-canvas__btn svg {
    transition: none;
  }
}
</style>
