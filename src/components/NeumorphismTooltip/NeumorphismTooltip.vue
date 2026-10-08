<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useTooltip } from '@/composables/useTooltip'
import { useFloatingPosition } from '@/composables/useFloatingPosition'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useZIndex } from '@/composables/useZIndex'
import { generateId } from '@/utils'
import type { TooltipPosition, TooltipTrigger } from '@/composables/useTooltip'

export type { TooltipPosition, TooltipTrigger }

export interface NeumorphismTooltipProps {
  content?: string
  position?: TooltipPosition
  trigger?: TooltipTrigger
  disabled?: boolean
  offset?: number
  delay?: number
}

const props = withDefaults(defineProps<NeumorphismTooltipProps>(), {
  disabled: false,
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedPosition = computed(() =>
  resolveProp(props.position, config.value.tooltip?.position, 'top')
)
const resolvedTrigger = computed(() =>
  resolveProp(props.trigger, config.value.tooltip?.trigger, 'hover')
)
const resolvedOffset = computed(() => resolveProp(props.offset, config.value.tooltip?.offset, 8))
const resolvedDelay = computed(() => resolveProp(props.delay, config.value.tooltip?.delay, 150))

// Use headless tooltip composable for all behavioral logic
const { getZIndex } = useZIndex()
const tooltipZIndex = computed(() => getZIndex('tooltip'))
const {
  isVisible,
  show,
  hide,
  toggle,
  handleKeydown: onKeydown,
} = useTooltip({
  disabled: computed(() => props.disabled),
  delay: resolvedDelay.value,
  trigger: resolvedTrigger,
})

// ARIA 关联：tooltip 内容 id（触发器经 slot props 取并以 aria-describedby 关联）
const contentId = generateId('nm-tooltip')

const triggerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

// 共享浮层定位引擎（rAF 逐帧追踪 + 边界翻转滞后）——
// 内容 teleport 到 body 后不在 wrapper 内联文档流中，由引擎的触发器 rect
// 驱动 fixed 视口坐标（与 Popover 同一模式），不受祖先 overflow 裁剪
const {
  actualPlacement: actualPosition,
  rect,
  refresh,
  stop,
} = useFloatingPosition({
  trigger: triggerRef,
  open: isVisible,
  placement: computed(() => resolvedPosition.value),
  offset: resolvedOffset,
  floating: contentRef,
  estimateSize: { width: 120, height: 40 },
})

const computedStyle = computed(() => {
  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: String(tooltipZIndex.value),
  }

  const r = rect.value
  if (!r) return style

  const offset = resolvedOffset.value

  switch (actualPosition.value) {
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

  return style
})

// 显示后内容尺寸可测，重估一次翻转决策（与 Popover 一致）
watch(isVisible, visible => {
  if (visible) nextTick(refresh)
})

onBeforeUnmount(stop)

const classList = computed(() => [
  'nm-tooltip',
  `nm-tooltip--${actualPosition.value}`,
  { 'nm-tooltip--visible': isVisible.value },
])
</script>

<template>
  <div
    ref="triggerRef"
    class="nm-tooltip-wrapper"
    :class="{ 'nm-tooltip-wrapper--disabled': disabled }"
    @mouseenter="resolvedTrigger === 'hover' ? show() : undefined"
    @mouseleave="resolvedTrigger === 'hover' ? hide() : undefined"
    @click="resolvedTrigger === 'click' ? toggle() : undefined"
    @focusin="resolvedTrigger === 'focus' ? show() : undefined"
    @focusout="resolvedTrigger === 'focus' ? hide() : undefined"
    @keydown="onKeydown"
  >
    <!-- @slot 触发器。作用域参数：contentId 供 aria-describedby 关联 -->
    <slot :content-id="contentId" />

    <teleport to="body">
      <transition name="nm-tooltip-fade">
        <div
          v-if="isVisible && (content || $slots.content)"
          :id="contentId"
          ref="contentRef"
          :class="classList"
          :style="computedStyle"
          role="tooltip"
          :aria-hidden="!isVisible"
          @mouseenter="resolvedTrigger === 'hover' ? show() : undefined"
          @mouseleave="resolvedTrigger === 'hover' ? hide() : undefined"
        >
          <span class="nm-tooltip__arrow" />
          <span class="nm-tooltip__content">
            <!-- @slot Custom tooltip content -->
            <slot name="content">{{ content }}</slot>
          </span>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.nm-tooltip {
  position: fixed;
  z-index: var(--nm-z-tooltip);
  cursor: default;

  .nm-tooltip__content {
    display: block;
    padding: var(--nm-tooltip-padding-y) var(--nm-tooltip-padding-x);
    font-size: var(--nm-font-md);
    line-height: 1.4;
    white-space: nowrap;
    color: var(--nm-text-primary);
    background-color: var(--nm-surface-color);
    border-radius: var(--nm-border-radius-sm);
    @include nm-raised(3px, 8px);
  }

  .nm-tooltip__arrow {
    position: absolute;
    width: var(--nm-spacing-sm);
    height: var(--nm-spacing-sm);
    background-color: var(--nm-surface-color);
    transform: rotate(45deg);
    box-shadow: 1px 1px 3px var(--nm-shadow-dark);
  }

  // 方位类仅驱动箭头位置（坐标由 teleport 后的 fixed 内联样式写入）
  &--top {
    .nm-tooltip__arrow {
      bottom: -4px;
      left: 50%;
      margin-left: var(--nm-spacing-neg-xs);
    }
  }

  &--bottom {
    .nm-tooltip__arrow {
      top: -4px;
      left: 50%;
      margin-left: var(--nm-spacing-neg-xs);
    }
  }

  &--left {
    .nm-tooltip__arrow {
      right: -4px;
      top: 50%;
      margin-top: var(--nm-spacing-neg-xs);
    }
  }

  &--right {
    .nm-tooltip__arrow {
      left: -4px;
      top: 50%;
      margin-top: var(--nm-spacing-neg-xs);
    }
  }
}

// Transition — base
.nm-tooltip-fade-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.nm-tooltip-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.nm-tooltip-fade-enter-from,
.nm-tooltip-fade-leave-to {
  opacity: 0;
}

// Position-specific enter/leave offsets
.nm-tooltip--top.nm-tooltip-fade-enter-from,
.nm-tooltip--top.nm-tooltip-fade-leave-to {
  transform: translateX(-50%) translateY(4px);
}

.nm-tooltip--bottom.nm-tooltip-fade-enter-from,
.nm-tooltip--bottom.nm-tooltip-fade-leave-to {
  transform: translateX(-50%) translateY(-4px);
}

.nm-tooltip--left.nm-tooltip-fade-enter-from,
.nm-tooltip--left.nm-tooltip-fade-leave-to {
  transform: translateY(-50%) translateX(4px);
}

.nm-tooltip--right.nm-tooltip-fade-enter-from,
.nm-tooltip--right.nm-tooltip-fade-leave-to {
  transform: translateY(-50%) translateX(-4px);
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
