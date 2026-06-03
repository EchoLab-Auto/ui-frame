<script setup lang="ts">
import { computed } from 'vue'

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
  /** Whether to show zoom controls */
  showControls?: boolean
  /** Canvas width (CSS value, e.g. '100%', '800px') */
  width?: string
  /** Canvas height (CSS value) */
  height?: string
}

const props = withDefaults(defineProps<NeumorphismCanvasProps>(), {
  modelValue: 1,
  minZoom: 0.1,
  maxZoom: 5,
  zoomStep: 0.1,
  showGrid: true,
  gridSize: 20,
  showControls: true,
  width: '100%',
  height: '500px',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'zoom-change', value: number): void
}>()

const currentZoom = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    emit('zoom-change', val)
  },
})

const zoomPercent = computed(() => Math.round(currentZoom.value * 100))

function zoomIn() {
  currentZoom.value = Math.min(props.maxZoom, +(currentZoom.value + props.zoomStep).toFixed(2))
}

function zoomOut() {
  currentZoom.value = Math.max(props.minZoom, +(currentZoom.value - props.zoomStep).toFixed(2))
}

function resetZoom() {
  currentZoom.value = 1
}

// Grid background CSS
const gridStyle = computed(() => {
  if (!props.showGrid) return {}
  const size = props.gridSize * currentZoom.value
  return {
    backgroundImage: `
      radial-gradient(circle, var(--nm-text-placeholder) 1px, transparent 1px)
    `,
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: '0 0',
  }
})

const wrapperStyle = computed(() => ({
  width: props.width,
  height: props.height,
}))

const classList = computed(() => [
  'nm-canvas',
])
</script>

<template>
  <div :class="classList" :style="wrapperStyle">
    <!-- Toolbar -->
    <div v-if="showControls" class="nm-canvas__toolbar">
      <div class="nm-canvas__controls">
        <button
          type="button"
          class="nm-canvas__btn"
          aria-label="缩小"
          :disabled="currentZoom <= minZoom"
          @click="zoomOut"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
            <path d="M8 11h6M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <span class="nm-canvas__zoom-text">{{ zoomPercent }}%</span>

        <button
          type="button"
          class="nm-canvas__btn"
          aria-label="放大"
          :disabled="currentZoom >= maxZoom"
          @click="zoomIn"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
            <path d="M11 8v6M8 11h6M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <button
          type="button"
          class="nm-canvas__btn nm-canvas__btn--reset"
          aria-label="重置缩放"
          @click="resetZoom"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3 3v5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <slot name="toolbar" />
    </div>

    <!-- Canvas viewport -->
    <div class="nm-canvas__viewport">
      <div
        class="nm-canvas__grid"
        :style="gridStyle"
      >
        <div
          class="nm-canvas__content"
          :style="{ transform: `scale(${currentZoom})`, transformOrigin: 'top left' }"
        >
          <slot />
        </div>
      </div>
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
}

// Toolbar
.nm-canvas__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.08);
  flex-shrink: 0;
}

.nm-canvas__controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nm-canvas__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  background-color: var(--nm-surface-color);
  color: var(--nm-text-secondary);
  cursor: pointer;
  @include nm-raised-strong(2px, 4px);
  transition:
    background-color var(--nm-transition-fast),
    box-shadow var(--nm-transition-fast),
    color var(--nm-transition-fast);

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    color: var(--nm-primary-color);
  }

  &:active:not(:disabled) {
    @include nm-inset-strong(2px, 4px);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &--reset {
    margin-left: 4px;
  }
}

.nm-canvas__zoom-text {
  min-width: 44px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--nm-text-secondary);
  user-select: none;
}

// Viewport
.nm-canvas__viewport {
  flex: 1;
  overflow: auto;
  position: relative;
}

.nm-canvas__grid {
  min-width: 100%;
  min-height: 100%;
  background-color: var(--nm-bg-color);
}

.nm-canvas__content {
  display: inline-block;
  min-width: 100%;
  transition: transform 0.15s ease-out;
}
</style>
