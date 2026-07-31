<script setup lang="ts">
import { computed, ref } from 'vue'
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

const offsetPx = computed(() => `${resolvedOffset.value}px`)

// ARIA 关联：tooltip 内容 id（触发器经 slot props 取并以 aria-describedby 关联）
const contentId = generateId('nm-tooltip')

const triggerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

// 共享浮层定位引擎 —— 翻转决策的逐帧追踪（旧 scroll 监听无 capture，
// 嵌套滚动容器内翻转状态与视口脱节）；内容本体为内联绝对定位，
// 天然随触发器原子移动，引擎只负责方向
const { actualPlacement: actualPosition } = useFloatingPosition({
  trigger: triggerRef,
  open: isVisible,
  placement: computed(() => resolvedPosition.value),
  offset: resolvedOffset,
  floating: contentRef,
  estimateSize: { width: 120, height: 40 },
})

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

    <transition name="nm-tooltip-fade">
      <div
        v-if="isVisible && (content || $slots.content)"
        :id="contentId"
        ref="contentRef"
        :class="classList"
        :style="{ zIndex: tooltipZIndex }"
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
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.nm-tooltip {
  position: absolute;
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

  &--top {
    bottom: calc(100% + v-bind(offsetPx));
    left: 50%;
    transform: translateX(-50%);

    .nm-tooltip__arrow {
      bottom: -4px;
      left: 50%;
      margin-left: -4px;
    }
  }

  &--bottom {
    top: calc(100% + v-bind(offsetPx));
    left: 50%;
    transform: translateX(-50%);

    .nm-tooltip__arrow {
      top: -4px;
      left: 50%;
      margin-left: -4px;
    }
  }

  &--left {
    right: calc(100% + v-bind(offsetPx));
    top: 50%;
    transform: translateY(-50%);

    .nm-tooltip__arrow {
      right: -4px;
      top: 50%;
      margin-top: -4px;
    }
  }

  &--right {
    left: calc(100% + v-bind(offsetPx));
    top: 50%;
    transform: translateY(-50%);

    .nm-tooltip__arrow {
      left: -4px;
      top: 50%;
      margin-top: -4px;
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
