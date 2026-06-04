<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useTooltip } from '@/composables/useTooltip'
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
  position: 'top',
  trigger: 'hover',
  disabled: false,
  offset: 8,
  delay: 150,
})

// Use headless tooltip composable for all behavioral logic
const { isVisible, show, hide, toggle, handleKeydown: onKeydown } =
  useTooltip({
    disabled: computed(() => props.disabled),
    delay: props.delay,
    trigger: computed(() => props.trigger),
  })

const offsetPx = computed(() => `${props.offset}px`)

const triggerRef = ref<HTMLElement>()
const actualPosition = ref<TooltipPosition>(props.position)

function checkBoundary(): TooltipPosition {
  const el = triggerRef.value
  if (!el) return props.position

  const rect = el.getBoundingClientRect()

  // Check if tooltip would overflow in the preferred direction
  switch (props.position) {
    case 'top':
      if (rect.top < 60) return 'bottom'
      break
    case 'bottom':
      if (rect.bottom > window.innerHeight - 60) return 'top'
      break
    case 'left':
      if (rect.left < 100) return 'right'
      break
    case 'right':
      if (rect.right > window.innerWidth - 100) return 'left'
      break
  }
  return props.position
}

watch(isVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      actualPosition.value = checkBoundary()
    })
  } else {
    actualPosition.value = props.position
  }
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
    @mouseenter="trigger === 'hover' ? show() : undefined"
    @mouseleave="trigger === 'hover' ? hide() : undefined"
    @click="trigger === 'click' ? toggle() : undefined"
    @focusin="trigger === 'focus' ? show() : undefined"
    @focusout="trigger === 'focus' ? hide() : undefined"
    @keydown="onKeydown"
  >
    <slot />

    <transition name="nm-tooltip-fade">
      <div
        v-if="isVisible && (content || $slots.content)"
        :class="classList"
        role="tooltip"
        :aria-hidden="!isVisible"
        @mouseenter="trigger === 'hover' ? show() : undefined"
        @mouseleave="trigger === 'hover' ? hide() : undefined"
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
  z-index: 9998;
  cursor: default;

  .nm-tooltip__content {
    display: block;
    padding: 8px 14px;
    font-size: 13px;
    line-height: 1.4;
    white-space: nowrap;
    color: var(--nm-text-primary);
    background-color: var(--nm-surface-color);
    border-radius: var(--nm-border-radius-sm);
    @include nm-raised(3px, 8px);
  }

  .nm-tooltip__arrow {
    position: absolute;
    width: 8px;
    height: 8px;
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
.nm-tooltip-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.nm-tooltip-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.nm-tooltip-fade-enter-from,
.nm-tooltip-fade-leave-to { opacity: 0; }

// Position-specific enter/leave offsets
.nm-tooltip--top.nm-tooltip-fade-enter-from,
.nm-tooltip--top.nm-tooltip-fade-leave-to { transform: translateX(-50%) translateY(4px); }

.nm-tooltip--bottom.nm-tooltip-fade-enter-from,
.nm-tooltip--bottom.nm-tooltip-fade-leave-to { transform: translateX(-50%) translateY(-4px); }

.nm-tooltip--left.nm-tooltip-fade-enter-from,
.nm-tooltip--left.nm-tooltip-fade-leave-to { transform: translateY(-50%) translateX(4px); }

.nm-tooltip--right.nm-tooltip-fade-enter-from,
.nm-tooltip--right.nm-tooltip-fade-leave-to { transform: translateY(-50%) translateX(-4px); }
</style>
