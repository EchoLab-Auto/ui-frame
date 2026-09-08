<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export interface NeumorphismCanvasBounds {
  x: number
  y: number
  w: number
  h: number
}

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
  /**
   * Infinite canvas mode: pan/zoom are unbounded virtual state applied via
   * transform, instead of native overflow scrolling. Content may live at any
   * (including negative) canvas coordinates.
   */
  infinite?: boolean
  /**
   * Content bounding box in canvas coordinates (infinite mode). Used by
   * fit()/resetView(); falls back to measuring slotted children when omitted.
   */
  contentBounds?: NeumorphismCanvasBounds
  /** Canvas width (CSS value, e.g. '100%', '800px') */
  width?: string
  /** Canvas height (CSS value) */
  height?: string
}

const props = withDefaults(defineProps<NeumorphismCanvasProps>(), {
  showControls: undefined,
  showGrid: undefined,
  gridVariant: undefined,
  infinite: undefined,
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
const resolvedInfinite = computed(() =>
  resolveProp(props.infinite, config.value.canvas?.infinite, false)
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

// ---- Infinite mode: unbounded virtual pan state (viewport px, post-zoom) ----
const panX = ref(0)
const panY = ref(0)

/**
 * Change zoom, keeping the given viewport-relative point stationary.
 * Without an explicit anchor the viewport center is used.
 * Infinite mode adjusts the pan offsets directly; scroll mode restores the
 * anchored scroll position after the sizer resizes (nextTick).
 */
function setZoom(next: number, anchor?: { x: number; y: number }, smooth = true) {
  const z = clampZoom(next)
  if (z === innerZoom.value) return
  const vp = viewportRef.value
  if (vp && resolvedInfinite.value) {
    const ax = anchor?.x ?? vp.clientWidth / 2
    const ay = anchor?.y ?? vp.clientHeight / 2
    const k = z / innerZoom.value
    panX.value = ax - (ax - panX.value) * k
    panY.value = ay - (ay - panY.value) * k
  } else if (vp) {
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
  if (!resolvedInfinite.value) void nextTick(applyAnchor)
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

/**
 * Measure the union bounding box of slotted children in canvas coordinates
 * (infinite-mode fallback when no contentBounds prop is provided).
 */
function measureContentBounds(): NeumorphismCanvasBounds | null {
  const content = contentRef.value
  const vp = viewportRef.value
  if (!content || !vp || content.children.length === 0) return null
  const vpRect = vp.getBoundingClientRect()
  const z = innerZoom.value
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const child of Array.from(content.children)) {
    const r = (child as HTMLElement).getBoundingClientRect()
    minX = Math.min(minX, (r.left - vpRect.left - panX.value) / z)
    minY = Math.min(minY, (r.top - vpRect.top - panY.value) / z)
    maxX = Math.max(maxX, (r.right - vpRect.left - panX.value) / z)
    maxY = Math.max(maxY, (r.bottom - vpRect.top - panY.value) / z)
  }
  if (!Number.isFinite(minX)) return null
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/** Scale content to fit the viewport (with padding) and center it. */
function fit() {
  const vp = viewportRef.value
  if (!vp) return
  const pad = 32
  if (resolvedInfinite.value) {
    const b = props.contentBounds ?? measureContentBounds()
    if (!b || !b.w || !b.h) return
    const z = clampZoom(Math.min((vp.clientWidth - pad) / b.w, (vp.clientHeight - pad) / b.h))
    smoothZoom.value = true
    if (z !== innerZoom.value) {
      innerZoom.value = z
      emit('update:modelValue', z)
      emit('zoom-change', z)
    }
    panX.value = (vp.clientWidth - b.w * z) / 2 - b.x * z
    panY.value = (vp.clientHeight - b.h * z) / 2 - b.y * z
    return
  }
  if (!naturalWidth.value || !naturalHeight.value) return
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

/**
 * Reset the view: animate pan and zoom back to the fit-to-content view.
 * In infinite mode this is the "return to content" action behind the reset
 * button and the `0` key; identical to fit() but named for intent.
 */
function resetView() {
  fit()
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
  // Scroll mode leaves touch to native overflow scroll; infinite mode pans
  // via pointer events uniformly (viewport has touch-action: none)
  if (e.pointerType === 'touch' && !resolvedInfinite.value) return
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
    left: resolvedInfinite.value ? panX.value : vp.scrollLeft,
    top: resolvedInfinite.value ? panY.value : vp.scrollTop,
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
  if (resolvedInfinite.value) {
    // Content follows the pointer; pan state is unbounded (no clamping)
    smoothZoom.value = false
    panX.value = panStart.left + dx
    panY.value = panStart.top + dy
  } else {
    vp.scrollLeft = panStart.left - dx
    vp.scrollTop = panStart.top - dy
  }
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

// ---- Wheel: Ctrl/Cmd + wheel → zoom to cursor; infinite mode also pans on plain wheel ----
function onWheel(e: WheelEvent) {
  const vp = viewportRef.value
  if (!vp) return
  const unit = e.deltaMode === 1 ? 16 : 1
  if (props.wheelZoom && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    const factor = Math.exp(-e.deltaY * unit * 0.002)
    const rect = vp.getBoundingClientRect()
    setZoom(innerZoom.value * factor, { x: e.clientX - rect.left, y: e.clientY - rect.top }, false)
    return
  }
  if (resolvedInfinite.value) {
    // Plain wheel / trackpad two-finger scroll pans the unbounded canvas
    e.preventDefault()
    smoothZoom.value = false
    panX.value -= e.deltaX * unit
    panY.value -= e.deltaY * unit
  }
}

// ---- Keyboard navigation on the viewport ----
function onViewportKeydown(e: KeyboardEvent) {
  const vp = viewportRef.value
  if (!vp) return
  const step = e.shiftKey ? 200 : 60
  const infinite = resolvedInfinite.value
  const panByKeys = (dx: number, dy: number) => {
    smoothZoom.value = false
    panX.value += dx
    panY.value += dy
  }
  switch (e.key) {
    case 'ArrowUp':
      if (infinite) panByKeys(0, step)
      else vp.scrollTop -= step
      break
    case 'ArrowDown':
      if (infinite) panByKeys(0, -step)
      else vp.scrollTop += step
      break
    case 'ArrowLeft':
      if (infinite) panByKeys(step, 0)
      else vp.scrollLeft -= step
      break
    case 'ArrowRight':
      if (infinite) panByKeys(-step, 0)
      else vp.scrollLeft += step
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
      if (infinite) resetView()
      else resetZoom()
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

/** Imperative pan by viewport-px deltas (infinite mode; no-op in scroll mode) */
function panBy(dx: number, dy: number) {
  if (!resolvedInfinite.value) return
  smoothZoom.value = false
  panX.value += dx
  panY.value += dy
}

/** Current view state (pan is viewport-px translation, post-zoom) */
function getView() {
  return { panX: panX.value, panY: panY.value, zoom: innerZoom.value }
}

/**
 * Convert client (screen) coordinates to canvas coordinates.
 * Infinite mode uses the virtual pan state; scroll mode uses scroll offsets.
 */
function toCanvasCoords(clientX: number, clientY: number) {
  const vp = viewportRef.value
  if (!vp) return { x: 0, y: 0, zoom: innerZoom.value }
  const rect = vp.getBoundingClientRect()
  const z = innerZoom.value
  if (resolvedInfinite.value) {
    return {
      x: (clientX - rect.left - panX.value) / z,
      y: (clientY - rect.top - panY.value) / z,
      zoom: z,
    }
  }
  return {
    x: (clientX - rect.left + vp.scrollLeft) / z,
    y: (clientY - rect.top + vp.scrollTop) / z,
    zoom: z,
  }
}

/** Viewport bounding rect (for edge auto-pan hit tests etc.) */
function getViewportRect() {
  return viewportRef.value?.getBoundingClientRect() ?? null
}

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
  const style: Record<string, string> = {
    backgroundImage: image,
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: '0 0',
  }
  if (resolvedInfinite.value) {
    // Grid rides on the viewport and follows the unbounded pan (mod grid size)
    style.backgroundPosition = `${panX.value % size}px ${panY.value % size}px`
  }
  return style
})

/** Infinite mode paints the grid on the viewport itself (scroll mode: sizer) */
const viewportStyle = computed(() => (resolvedInfinite.value ? gridStyle.value : {}))

const contentStyle = computed(() => ({
  transform: resolvedInfinite.value
    ? `translate(${panX.value}px, ${panY.value}px) scale(${innerZoom.value})`
    : `scale(${innerZoom.value})`,
}))

const wrapperStyle = computed(() => ({
  width: props.width,
  height: props.height,
}))

const viewportClass = computed(() => ({
  'nm-canvas__viewport--pannable': canPan.value,
  'nm-canvas__viewport--panning': isPanning.value,
  'nm-canvas__viewport--infinite': resolvedInfinite.value,
}))

const classList = computed(() => ['nm-canvas', { 'nm-canvas--fullscreen': isFullscreen.value }])

defineExpose({
  zoomIn,
  zoomOut,
  resetZoom,
  fit,
  resetView,
  toggleFullscreen,
  panBy,
  getView,
  toCanvasCoords,
  getViewportRect,
})
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
      :style="viewportStyle"
      tabindex="0"
      role="application"
      :aria-label="t('canvasLabel')"
      @pointerdown="onPointerDown"
      @pointerenter="hovering = true"
      @pointerleave="hovering = false"
      @keydown="onViewportKeydown"
    >
      <!-- 无限画布：无 sizer，内容直接由 transform（translate + scale）定位，平移无边界 -->
      <div
        v-if="resolvedInfinite"
        ref="contentRef"
        class="nm-canvas__content"
        :class="{ 'nm-canvas__content--smooth': smoothZoom }"
        :style="contentStyle"
      >
        <slot />
      </div>
      <div v-else class="nm-canvas__sizer" :style="[sizerStyle, gridStyle]">
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
        :aria-label="resolvedInfinite ? t('canvasResetView') : t('canvasZoomReset')"
        @click="resolvedInfinite ? resetView() : resetZoom()"
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

  // 无限画布：隐藏溢出（无滚动条），触屏平移交由 pointer events
  &--infinite {
    overflow: hidden;
    touch-action: none;
    background-color: var(--nm-bg-color);
    transition: background-size 0.3s $nm-ease-ambient;
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
  .nm-canvas__viewport--infinite,
  .nm-canvas__btn,
  .nm-canvas__btn svg {
    transition: none;
  }
}
</style>
