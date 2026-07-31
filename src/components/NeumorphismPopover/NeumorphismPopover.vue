<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { usePopover } from '@/composables/usePopover'
import { useFloatingPosition } from '@/composables/useFloatingPosition'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useZIndex } from '@/composables/useZIndex'
import { generateId } from '@/utils'
import type { PopoverPosition, PopoverTrigger } from '@/composables/usePopover'

export type { PopoverPosition, PopoverTrigger }

export interface NeumorphismPopoverProps {
  /** Preferred position of the popover relative to the trigger */
  position?: PopoverPosition
  /** How the popover is triggered */
  trigger?: PopoverTrigger
  /** Whether the popover is disabled */
  disabled?: boolean
  /** Offset from the trigger element in px */
  offset?: number
  /** Width of the popover content */
  width?: 'auto' | 'trigger' | number
  /** Plain text content (when not using the content slot) */
  content?: string
  /** Whether to show the arrow pointing to the trigger */
  showArrow?: boolean
}

const props = withDefaults(defineProps<NeumorphismPopoverProps>(), {
  showArrow: undefined,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'visible-change', visible: boolean): void
}>()

const { resolveProp } = useNeumorphismSetup()

const resolvedPosition = computed(() =>
  resolveProp(props.position, undefined, 'auto' as PopoverPosition)
)
const resolvedTrigger = computed(() =>
  resolveProp(props.trigger, undefined, 'click' as PopoverTrigger)
)
const resolvedOffset = computed(() => resolveProp(props.offset, undefined, 8))
const resolvedWidth = computed(() => resolveProp(props.width, undefined, 'auto'))
const resolvedShowArrow = computed(() => resolveProp(props.showArrow, undefined, true))

// ---- Use headless popover composable ----
const { getZIndex } = useZIndex()
const {
  isOpen,
  show,
  hide,
  toggle,
  handleKeydown: onKeydown,
} = usePopover({
  position: resolvedPosition,
  trigger: resolvedTrigger,
  disabled: computed(() => props.disabled),
  offset: resolvedOffset,
})

// ---- Refs ----
const triggerRef = ref<HTMLElement>()
const popoverRef = ref<HTMLElement>()

// ---- 共享浮层定位引擎（rAF 逐帧追踪 + 边界翻转滞后） ----
// 嵌套滚动容器/平滑滚动下由逐帧轮询保证同帧同步 —— 旧实现的 scroll
// 事件监听无 capture，嵌套滚动时浮层与触发器脱节，由引擎从根本上覆盖
const { actualPlacement, rect, refresh, stop } = useFloatingPosition({
  trigger: triggerRef,
  open: isOpen,
  placement: computed(() => resolvedPosition.value),
  offset: resolvedOffset,
  floating: popoverRef,
  estimateSize: { width: 200, height: 120 },
})

const computedStyle = computed(() => {
  const r = rect.value
  if (!r) return {}
  const offset = resolvedOffset.value
  const style: Record<string, string> = {}

  switch (actualPlacement.value) {
    case 'top':
      style.top = `${r.top - offset}px`
      style.left = `${r.left + r.width / 2}px`
      style.transform = 'translate(-50%, -100%)'
      break
    case 'bottom':
      style.top = `${r.bottom + offset}px`
      style.left = `${r.left + r.width / 2}px`
      style.transform = 'translate(-50%, 0)'
      break
    case 'left':
      style.top = `${r.top + r.height / 2}px`
      style.left = `${r.left - offset}px`
      style.transform = 'translate(-100%, -50%)'
      break
    case 'right':
      style.top = `${r.top + r.height / 2}px`
      style.left = `${r.right + offset}px`
      style.transform = 'translate(0, -50%)'
      break
  }

  // Width handling
  if (resolvedWidth.value === 'trigger') {
    style.width = `${r.width}px`
  } else if (typeof resolvedWidth.value === 'number') {
    style.width = `${resolvedWidth.value}px`
  }

  // Context-aware z-index
  style.zIndex = String(getZIndex('popover'))

  return style
})

// ---- Click-outside detection ----
function onDocumentClick(event: MouseEvent) {
  if (!isOpen.value || props.disabled) return

  const target = event.target as Node

  // Check if click is inside the trigger or the popover content
  if (triggerRef.value?.contains(target)) return
  if (popoverRef.value?.contains(target)) return

  hide()
}

onMounted(() => {
  if (typeof document === 'undefined') return
  document.addEventListener('click', onDocumentClick, true)
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('click', onDocumentClick, true)
  stop()
})

// ---- Watch isOpen to refresh position and emit ----
watch(isOpen, open => {
  emit('visible-change', open)
  if (open) nextTick(refresh)
})

// ---- Watch resolved offset to reposition if open ----
watch(resolvedOffset, () => {
  if (isOpen.value) {
    nextTick(refresh)
  }
})

const offsetPx = computed(() => `${resolvedOffset.value}px`)

const classList = computed(() => [
  'nm-popover',
  `nm-popover--${actualPlacement.value}`,
  { 'nm-popover--visible': isOpen.value },
])

// ---- Keyboard handler (with Tab dismiss) ----
function handlePopoverKeydown(event: KeyboardEvent) {
  onKeydown(event)

  if (event.key === 'Tab' && isOpen.value) {
    // Give focus a tick to move, then check if focus left the popover
    nextTick(() => {
      if (typeof document === 'undefined') return
      const ae = document.activeElement
      if (ae instanceof Node) {
        if (!triggerRef.value?.contains(ae) && !popoverRef.value?.contains(ae)) {
          hide()
        }
      }
    })
  }
}

// Trigger event handlers
function onTriggerMouseEnter() {
  if (resolvedTrigger.value === 'hover') show()
}

function onTriggerMouseLeave() {
  if (resolvedTrigger.value === 'hover') hide()
}

function onTriggerClick() {
  if (resolvedTrigger.value === 'click') toggle()
}

function onTriggerFocusIn() {
  if (resolvedTrigger.value === 'focus') show()
}

// ARIA 关联：内容 id 供触发器侧 aria-controls / aria-describedby 使用
const contentId = generateId('nm-popover')
// tooltip 触发模式下触发器用 aria-describedby 关联内容（role=tooltip 语义）
const isTooltipMode = computed(
  () => resolvedTrigger.value === 'hover' || resolvedTrigger.value === 'focus'
)

defineExpose({ show, hide, toggle, isOpen, contentId })

function onTriggerFocusOut(_event: FocusEvent) {
  if (resolvedTrigger.value === 'focus') {
    // Use nextTick to allow focus to move to popover content
    nextTick(() => {
      const ae = document.activeElement
      if (!triggerRef.value?.contains(ae as Node) && !popoverRef.value?.contains(ae as Node)) {
        hide()
      }
    })
  }
}
</script>

<template>
  <div
    ref="triggerRef"
    class="nm-popover-wrapper"
    :class="{ 'nm-popover-wrapper--disabled': disabled }"
    @mouseenter="onTriggerMouseEnter"
    @mouseleave="onTriggerMouseLeave"
    @click="onTriggerClick"
    @focusin="onTriggerFocusIn"
    @focusout="onTriggerFocusOut"
    @keydown="handlePopoverKeydown"
  >
    <!-- @slot Trigger element (e.g., a button)。作用域参数供 ARIA 关联 -->
    <slot :expanded="isOpen" :content-id="contentId" :tooltip-mode="isTooltipMode" />

    <teleport to="body">
      <transition name="nm-popover-fade">
        <div
          v-if="isOpen && (content || $slots.content)"
          :id="contentId"
          ref="popoverRef"
          :class="classList"
          :role="resolvedTrigger === 'hover' || resolvedTrigger === 'focus' ? 'tooltip' : 'dialog'"
          :aria-hidden="!isOpen"
          :style="computedStyle"
          @keydown="handlePopoverKeydown"
          @mouseenter="resolvedTrigger === 'hover' ? show() : undefined"
          @mouseleave="resolvedTrigger === 'hover' ? hide() : undefined"
        >
          <!-- @slot Custom popover content -->
          <slot name="content">
            <span class="nm-popover__text">{{ content }}</span>
          </slot>
          <span v-if="resolvedShowArrow" class="nm-popover__arrow" />
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-popover-wrapper {
  position: relative;
  display: inline-flex;

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.nm-popover {
  position: fixed;
  z-index: var(--nm-z-popover);
  cursor: default;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(4px, 12px);
  @include nm-theme-transition;

  padding: var(--nm-spacing-md);
  font-size: var(--nm-font-base);
  color: var(--nm-text-primary);
  line-height: 1.5;
  min-width: 160px;

  // Arrow
  .nm-popover__arrow {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: var(--nm-surface-color);
    transform: rotate(45deg);
  }

  // ---- Position: top ----
  &--top {
    margin-bottom: v-bind(offsetPx);

    .nm-popover__arrow {
      bottom: -5px;
      left: 50%;
      margin-left: -5px;
      box-shadow: 2px 2px 3px var(--nm-shadow-dark);
    }
  }

  // ---- Position: bottom ----
  &--bottom {
    margin-top: v-bind(offsetPx);

    .nm-popover__arrow {
      top: -5px;
      left: 50%;
      margin-left: -5px;
      box-shadow: -2px -2px 3px var(--nm-shadow-light);
    }
  }

  // ---- Position: left ----
  &--left {
    margin-right: v-bind(offsetPx);

    .nm-popover__arrow {
      right: -5px;
      top: 50%;
      margin-top: -5px;
      box-shadow: 2px -2px 3px var(--nm-shadow-dark);
    }
  }

  // ---- Position: right ----
  &--right {
    margin-left: v-bind(offsetPx);

    .nm-popover__arrow {
      left: -5px;
      top: 50%;
      margin-top: -5px;
      box-shadow: -2px 2px 3px var(--nm-shadow-light);
    }
  }
}

.nm-popover__text {
  display: block;
}

// ---- Transition ----
.nm-popover-fade-enter-active {
  transition:
    opacity 0.25s $nm-ease-decelerate,
    transform 0.25s $nm-ease-spring;
}

.nm-popover-fade-leave-active {
  transition:
    opacity 0.15s $nm-ease-accelerate,
    transform 0.15s $nm-ease-accelerate;
}

.nm-popover-fade-enter-from,
.nm-popover-fade-leave-to {
  opacity: 0;
}

// Position-specific enter/leave offsets
.nm-popover--top.nm-popover-fade-enter-from,
.nm-popover--top.nm-popover-fade-leave-to {
  transform: translate(-50%, -100%) translateY(6px);
}

.nm-popover--bottom.nm-popover-fade-enter-from,
.nm-popover--bottom.nm-popover-fade-leave-to {
  transform: translate(-50%, 0) translateY(-6px);
}

.nm-popover--left.nm-popover-fade-enter-from,
.nm-popover--left.nm-popover-fade-leave-to {
  transform: translate(-100%, -50%) translateX(6px);
}

.nm-popover--right.nm-popover-fade-enter-from,
.nm-popover--right.nm-popover-fade-leave-to {
  transform: translate(0, -50%) translateX(-6px);
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
