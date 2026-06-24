<script setup lang="ts">
import { computed } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'

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

const { config, resolveProp } = useNeumorphismSetup()

const resolvedDirection = computed(() =>
  resolveProp(props.direction, config.value.divider?.direction, 'horizontal')
)
const resolvedAlign = computed(() =>
  resolveProp(props.align, config.value.divider?.align, 'center')
)
const resolvedDashed = computed(() =>
  resolveProp(props.dashed, config.value.divider?.dashed, false)
)
const resolvedInset = computed(() => resolveProp(props.inset, config.value.divider?.inset, false))

const classList = computed(() => [
  'nm-divider',
  `nm-divider--${resolvedDirection.value}`,
  ...(resolvedDirection.value === 'horizontal' ? [`nm-divider--${resolvedAlign.value}`] : []),
  {
    'nm-divider--dashed': resolvedDashed.value,
    'nm-divider--inset': resolvedInset.value,
  },
])
</script>

<template>
  <div :class="classList" role="separator" :aria-orientation="resolvedDirection">
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
  margin: var(--nm-spacing-md) 0;
  color: var(--nm-text-placeholder);
  font-size: var(--nm-font-base);

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
  transition: color 0.3s $nm-ease-ambient;
}

.nm-divider:hover .nm-divider__text {
  color: var(--nm-primary-color);
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

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
