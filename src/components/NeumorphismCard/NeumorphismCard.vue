<script setup lang="ts">
import { computed } from 'vue'

export type CardVariant = 'raised' | 'pressed'
export type CardDepth = 'shallow' | 'medium' | 'deep' | 'very-deep'

export interface NeumorphismCardProps {
  /** Card shadow variant */
  variant?: CardVariant
  /** Inset depth level (only applies when variant is 'pressed') */
  depth?: CardDepth
  /** Border radius level */
  radius?: 'small' | 'medium' | 'large' | 'xl'
  /** Whether the card has no padding */
  noPadding?: boolean
  /** Whether to add hover lift effect */
  hoverable?: boolean
}

const props = withDefaults(defineProps<NeumorphismCardProps>(), {
  variant: 'raised',
  depth: 'medium',
  radius: 'large',
  noPadding: false,
  hoverable: false,
})

const classList = computed(() => [
  'nm-card',
  `nm-card--${props.variant}`,
  `nm-card--depth-${props.depth}`,
  `nm-card--radius-${props.radius}`,
  {
    'nm-card--no-padding': props.noPadding,
    'nm-card--hoverable': props.hoverable,
  },
])
</script>

<template>
  <div :class="classList">
    <div v-if="$slots.header" class="nm-card__header">
      <slot name="header" />
    </div>
    <div class="nm-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="nm-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-card {
  background-color: var(--nm-surface-color);
  color: var(--nm-text-primary);
  overflow: hidden;
  @include nm-theme-transition;
}

// ---------- Radius variants ----------
.nm-card--radius-small {
  border-radius: var(--nm-border-radius-sm);
}

.nm-card--radius-medium {
  border-radius: var(--nm-border-radius-md);
}

.nm-card--radius-large {
  border-radius: var(--nm-border-radius-lg);
}

.nm-card--radius-xl {
  border-radius: var(--nm-border-radius-xl);
}

// ---------- Padding ----------
.nm-card:not(.nm-card--no-padding) {
  .nm-card__header {
    padding: var(--nm-spacing-md) var(--nm-spacing-lg);
  }

  .nm-card__body {
    padding: var(--nm-spacing-lg);
  }

  .nm-card__footer {
    padding: var(--nm-spacing-md) var(--nm-spacing-lg);
  }
}

.nm-card--no-padding {
  .nm-card__header,
  .nm-card__body,
  .nm-card__footer {
    padding: 0;
  }
}

// ---------- Header / Footer ----------
.nm-card__header {
  border-bottom: 1px solid transparent;
}

.nm-card__footer {
  border-top: 1px solid transparent;
}

// ---------- Raised variant ----------
.nm-card--raised {
  @include nm-raised(6px, 12px);

  .nm-card__header {
    border-bottom-color: rgba(0, 0, 0, 0.05);
  }

  .nm-card__footer {
    border-top-color: rgba(0, 0, 0, 0.05);
  }
}

// ---------- Pressed variant ----------
.nm-card--pressed {
  background-color: var(--nm-surface-raised);

  &.nm-card--depth-shallow {
    @include nm-inset-deep(var(--nm-depth-shallow), calc(var(--nm-depth-shallow) * 2));
  }

  &.nm-card--depth-medium {
    @include nm-inset-deep(var(--nm-depth-medium), calc(var(--nm-depth-medium) * 2));
  }

  &.nm-card--depth-deep {
    @include nm-inset-deep(var(--nm-depth-deep), calc(var(--nm-depth-deep) * 2));
  }

  &.nm-card--depth-very-deep {
    @include nm-inset-deep(var(--nm-depth-very-deep), calc(var(--nm-depth-very-deep) * 2));
  }
}

// ---------- Hoverable ----------
.nm-card--hoverable.nm-card--raised {
  transition:
    box-shadow var(--nm-transition-fast),
    transform var(--nm-transition-fast);

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      10px 10px 20px var(--nm-shadow-dark),
      -10px -10px 20px var(--nm-shadow-light);
  }
}
</style>
