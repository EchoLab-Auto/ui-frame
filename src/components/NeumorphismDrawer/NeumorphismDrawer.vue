<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useDrawer, type DrawerPosition } from '@/composables/useDrawer'
import { useLocale } from '@/composables/useLocale'
import { generateId } from '@/utils'

export interface NeumorphismDrawerProps {
  modelValue?: boolean
  position?: DrawerPosition
  title?: string
  width?: number | string
  maskClosable?: boolean
  closable?: boolean
  showClose?: boolean
  destroyOnClose?: boolean
}

const props = withDefaults(defineProps<NeumorphismDrawerProps>(), {
  modelValue: false,
  position: 'right',
  maskClosable: true,
  closable: true,
  showClose: true,
  destroyOnClose: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'close'): void
}>()

const modelRef = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const {
  isOpen,
  rendered,
  close,
  handleKeydown: onKeydown,
  handleMaskClick,
  focusDrawer,
} = useDrawer({
  modelValue: modelRef,
  maskClosable: computed(() => props.maskClosable),
  closable: computed(() => props.closable),
  destroyOnClose: computed(() => props.destroyOnClose),
})

const drawerRef = ref<HTMLDivElement>()
const titleId = `nm-drawer-title-${generateId()}`
const contentId = `nm-drawer-content-${generateId()}`

const { t } = useLocale()
const resolvedCloseLabel = computed(() => t('drawerClose'))

// Resolve default width based on position
const resolvedWidth = computed(() => {
  if (props.width != null) return toPixelValue(props.width)
  const pos = props.position
  if (pos === 'left' || pos === 'right') return '320px'
  return '240px'
})

function toPixelValue(v: number | string): string {
  return typeof v === 'number' ? `${v}px` : v
}

// Auto-focus when drawer becomes open
watch(isOpen, async v => {
  if (v) {
    await nextTick()
    focusDrawer(drawerRef.value)
  }
})

// Watch modelValue to emit open/close events
watch(
  () => props.modelValue,
  val => {
    if (val) {
      emit('open')
    } else {
      emit('close')
    }
  }
)

function onMaskClick() {
  handleMaskClick()
}

function onCloseClick() {
  close()
}

function handleKeydown(event: KeyboardEvent) {
  onKeydown(event, drawerRef.value)
}

const isHorizontal = computed(() => props.position === 'left' || props.position === 'right')
const sizeStyle = computed(() => {
  const w = resolvedWidth.value
  return isHorizontal.value ? { width: w } : { height: w }
})
</script>

<template>
  <teleport to="body">
    <transition name="nm-drawer-fade">
      <div
        v-if="rendered"
        class="nm-drawer__mask"
        :class="{ 'nm-drawer__mask--visible': isOpen }"
        @click.self="onMaskClick"
      >
        <transition name="nm-drawer-slide">
          <div
            v-if="isOpen"
            ref="drawerRef"
            :class="['nm-drawer', `nm-drawer--${position}`]"
            :style="sizeStyle"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? titleId : undefined"
            :aria-label="!title ? resolvedCloseLabel || 'Drawer' : undefined"
            :aria-describedby="contentId"
            tabindex="-1"
            @keydown="handleKeydown"
          >
            <div class="nm-drawer__header">
              <h2 v-if="title" :id="titleId" class="nm-drawer__title">{{ title }}</h2>
              <slot name="header" />
              <button
                v-if="showClose && closable"
                class="nm-drawer__close"
                :aria-label="resolvedCloseLabel"
                type="button"
                @click="onCloseClick"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div :id="contentId" class="nm-drawer__body">
              <slot />
            </div>

            <div v-if="$slots.footer" class="nm-drawer__footer">
              <slot name="footer" />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ---- mask ----
.nm-drawer__mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: var(--nm-mask-bg);
  backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--nm-transition-fast);

  &--visible {
    opacity: 1;
    pointer-events: auto;
  }
}

// ---- drawer panel ----
.nm-drawer {
  position: fixed;
  display: flex;
  flex-direction: column;
  background-color: var(--nm-surface-color);
  @include nm-raised(8px, 20px);
  @include nm-theme-transition;
  outline: none;
  overflow: hidden;

  // Position variants --------------------------------------------------
  &--left {
    left: 0;
    top: 0;
    bottom: 0;
    border-radius: 0 var(--nm-border-radius-lg) var(--nm-border-radius-lg) 0;
  }

  &--right {
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: var(--nm-border-radius-lg) 0 0 var(--nm-border-radius-lg);
  }

  &--top {
    left: 0;
    right: 0;
    top: 0;
    border-radius: 0 0 var(--nm-border-radius-lg) var(--nm-border-radius-lg);
  }

  &--bottom {
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: var(--nm-border-radius-lg) var(--nm-border-radius-lg) 0 0;
  }
}

// ---- header ----
.nm-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--nm-spacing-lg) var(--nm-spacing-xl);
  flex-shrink: 0;
  border-bottom: 1px solid var(--nm-border-color);
}

.nm-drawer__title {
  margin: 0;
  font-size: var(--nm-font-lg);
  font-weight: 600;
  color: var(--nm-text-primary);
}

.nm-drawer__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--nm-spacing-xl);
  height: var(--nm-spacing-xl);
  border: none;
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  color: var(--nm-text-secondary);
  background: none;
  @include nm-raised(2px, 4px);
  transition: all var(--nm-transition-fast);

  &:hover {
    @include nm-inset(2px, 4px);
    color: var(--nm-text-primary);
  }
}

// ---- body ----
.nm-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--nm-spacing-xl);
  color: var(--nm-text-primary);
  font-size: var(--nm-font-base);
  line-height: 1.6;
}

// ---- footer ----
.nm-drawer__footer {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-spacing-lg) var(--nm-spacing-xl);
  flex-shrink: 0;
  border-top: 1px solid var(--nm-border-color);
}

// =========================================================================
// Transitions
// =========================================================================

// Mask fade
.nm-drawer-fade-enter-active {
  transition:
    opacity 0.35s $nm-ease-decelerate,
    backdrop-filter 0.35s $nm-ease-decelerate;
}
.nm-drawer-fade-leave-active {
  transition:
    opacity 0.2s $nm-ease-accelerate,
    backdrop-filter 0.2s $nm-ease-accelerate;
}
.nm-drawer-fade-enter-from,
.nm-drawer-fade-leave-to {
  opacity: 0;
}

// Slide transitions — position-aware
.nm-drawer-slide-enter-active {
  transition: transform 0.35s $nm-ease-spring;
}
.nm-drawer-slide-leave-active {
  transition: transform 0.2s $nm-ease-accelerate;
}

// Left drawer slides from left
.nm-drawer--left.nm-drawer-slide-enter-from,
.nm-drawer--left.nm-drawer-slide-leave-to {
  transform: translateX(-100%);
}

// Right drawer slides from right
.nm-drawer--right.nm-drawer-slide-enter-from,
.nm-drawer--right.nm-drawer-slide-leave-to {
  transform: translateX(100%);
}

// Top drawer slides from top
.nm-drawer--top.nm-drawer-slide-enter-from,
.nm-drawer--top.nm-drawer-slide-leave-to {
  transform: translateY(-100%);
}

// Bottom drawer slides from bottom
.nm-drawer--bottom.nm-drawer-slide-enter-from,
.nm-drawer--bottom.nm-drawer-slide-leave-to {
  transform: translateY(100%);
}

// =========================================================================
// Reduced motion
// =========================================================================
@media (prefers-reduced-motion: reduce) {
  .nm-drawer-fade-enter-active,
  .nm-drawer-fade-leave-active,
  .nm-drawer-slide-enter-active,
  .nm-drawer-slide-leave-active {
    transition: none;
  }
}
</style>
