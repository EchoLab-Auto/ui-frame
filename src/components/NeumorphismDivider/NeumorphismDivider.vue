<script setup lang="ts">
import { computed } from 'vue'

export type DividerDirection = 'horizontal' | 'vertical'
export type DividerAlign = 'left' | 'center' | 'right'

export interface NeumorphismDividerProps {
  direction?: DividerDirection
  align?: DividerAlign
  dashed?: boolean
  inset?: boolean
}

const props = withDefaults(defineProps<NeumorphismDividerProps>(), {
  direction: 'horizontal',
  align: 'center',
  dashed: false,
  inset: false,
})

const classList = computed(() => [
  'nm-divider',
  `nm-divider--${props.direction}`,
  ...(props.direction === 'horizontal' ? [`nm-divider--${props.align}`] : []),
  {
    'nm-divider--dashed': props.dashed,
    'nm-divider--inset': props.inset,
  },
])
</script>

<template>
  <div
    :class="classList"
    role="separator"
    :aria-orientation="direction"
  >
    <span v-if="$slots.default" class="nm-divider__text">
      <slot />
    </span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-divider {
  display: flex;
  align-items: center;
  border: none;
  margin: 16px 0;
  color: var(--nm-text-placeholder);
  font-size: 14px;

  &--horizontal {
    width: 100%;
    border-top: 1px solid rgba(128, 128, 128, 0.15);
  }

  &--vertical {
    display: inline-flex;
    height: 1em;
    border-left: 1px solid rgba(128, 128, 128, 0.15);
    margin: 0 12px;
    vertical-align: middle;
  }

  &--dashed {
    border-top-style: dashed;

    &.nm-divider--vertical {
      border-left-style: dashed;
    }
  }

  &--left,
  &--right,
  &--center {
    // Alignment is handled via pseudo-elements on .nm-divider__text
  }
}

.nm-divider__text {
  padding: 0 16px;
  white-space: nowrap;
  font-weight: 500;
  color: var(--nm-text-secondary);
}

// Horizontal with text — line-text-line pattern
.nm-divider--horizontal .nm-divider__text {
  position: relative;
  display: inline-block;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 120px;
    border-top: 1px solid rgba(128, 128, 128, 0.15);
  }

  &::before {
    right: 100%;
  }

  &::after {
    left: 100%;
  }
}

// Align: hide the relevant pseudo-element
.nm-divider--left.nm-divider--horizontal .nm-divider__text::before,
.nm-divider--right.nm-divider--horizontal .nm-divider__text::after {
  content: none;
}
</style>
