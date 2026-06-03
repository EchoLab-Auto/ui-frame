<script setup lang="ts">
import { computed, ref } from 'vue'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
export type TooltipTrigger = 'hover' | 'click' | 'focus'

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

const isVisible = ref(false)
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

const classList = computed(() => [
  'nm-tooltip',
  `nm-tooltip--${props.position}`,
  { 'nm-tooltip--visible': isVisible.value },
])

function show() {
  if (props.disabled) return
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
  showTimer = setTimeout(() => { isVisible.value = true }, props.delay)
}

function hide() {
  if (showTimer) { clearTimeout(showTimer); showTimer = null }
  hideTimer = setTimeout(() => { isVisible.value = false }, 100)
}

function toggle() {
  if (props.disabled) return
  isVisible.value ? hide() : show()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { isVisible.value = false }
}
</script>

<template>
  <div
    class="nm-tooltip-wrapper"
    :class="{ 'nm-tooltip-wrapper--disabled': disabled }"
    @mouseenter="trigger === 'hover' ? show() : undefined"
    @mouseleave="trigger === 'hover' ? hide() : undefined"
    @click="trigger === 'click' ? toggle() : undefined"
    @focusin="trigger === 'focus' ? show() : undefined"
    @focusout="trigger === 'focus' ? hide() : undefined"
    @keydown="handleKeydown"
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

  // Tooltip box
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

  // Arrow
  .nm-tooltip__arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: var(--nm-surface-color);
    transform: rotate(45deg);
    box-shadow: 1px 1px 3px var(--nm-shadow-dark);
  }

  // Positions
  &--top {
    bottom: calc(100% + v-bind('`${offset}px`'));
    left: 50%;
    transform: translateX(-50%);

    .nm-tooltip__arrow {
      bottom: -4px;
      left: 50%;
      margin-left: -4px;
    }
  }

  &--bottom {
    top: calc(100% + v-bind('`${offset}px`'));
    left: 50%;
    transform: translateX(-50%);

    .nm-tooltip__arrow {
      top: -4px;
      left: 50%;
      margin-left: -4px;
    }
  }

  &--left {
    right: calc(100% + v-bind('`${offset}px`'));
    top: 50%;
    transform: translateY(-50%);

    .nm-tooltip__arrow {
      right: -4px;
      top: 50%;
      margin-top: -4px;
    }
  }

  &--right {
    left: calc(100% + v-bind('`${offset}px`'));
    top: 50%;
    transform: translateY(-50%);

    .nm-tooltip__arrow {
      left: -4px;
      top: 50%;
      margin-top: -4px;
    }
  }
}

// Transition
.nm-tooltip-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.nm-tooltip-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.nm-tooltip-fade-enter-from,
.nm-tooltip-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(4px); }
</style>
