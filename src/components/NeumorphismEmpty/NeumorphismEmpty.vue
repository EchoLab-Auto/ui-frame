<script setup lang="ts">
import { computed } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export type EmptySize = 'small' | 'medium' | 'large'

export interface NeumorphismEmptyProps {
  image?: string
  description?: string
  size?: EmptySize
}

const props = withDefaults(defineProps<NeumorphismEmptyProps>(), {
  size: 'medium',
})

const { resolveProp } = useNeumorphismSetup()

const resolvedSize = computed(() => resolveProp(props.size, undefined, 'medium'))

const classList = computed(() => ['nm-empty', `nm-empty--${resolvedSize.value}`])
</script>

<template>
  <div :class="classList">
    <div class="nm-empty__image">
      <slot name="image">
        <img v-if="image" :src="image" :alt="description ?? ''" class="nm-empty__img" />
        <svg
          v-else
          class="nm-empty__illustration"
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- Outer box -->
          <rect
            x="28"
            y="48"
            width="104"
            height="82"
            rx="4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            opacity="0.3"
          />
          <!-- Box lid -->
          <path
            d="M28 48 L80 62 L132 48"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            opacity="0.3"
          />
          <!-- Inner document lines -->
          <rect x="48" y="66" width="64" height="6" rx="2" fill="currentColor" opacity="0.12" />
          <rect x="48" y="80" width="48" height="6" rx="2" fill="currentColor" opacity="0.12" />
          <rect x="48" y="94" width="56" height="6" rx="2" fill="currentColor" opacity="0.12" />
          <!-- Magnifying glass -->
          <circle
            cx="116"
            cy="116"
            r="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            opacity="0.25"
          />
          <line
            x1="127"
            y1="127"
            x2="138"
            y2="138"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            opacity="0.25"
          />
        </svg>
      </slot>
    </div>

    <div v-if="description" class="nm-empty__description">
      {{ description }}
    </div>

    <div v-if="$slots.default" class="nm-empty__footer">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--nm-spacing-xl) var(--nm-spacing-md);
  text-align: center;
  color: var(--nm-text-placeholder);
  user-select: none;
}

// --- Sizes ---

.nm-empty--small {
  .nm-empty__illustration {
    width: 60px;
    height: 60px;
  }

  .nm-empty__img {
    max-width: 60px;
    max-height: 60px;
  }

  .nm-empty__description {
    margin-top: var(--nm-spacing-xs);
    font-size: var(--nm-font-sm);
  }

  .nm-empty__footer {
    margin-top: var(--nm-spacing-sm);
  }
}

.nm-empty--medium {
  .nm-empty__illustration {
    width: 100px;
    height: 100px;
  }

  .nm-empty__img {
    max-width: 100px;
    max-height: 100px;
  }

  .nm-empty__description {
    margin-top: var(--nm-spacing-sm);
    font-size: var(--nm-font-base);
  }

  .nm-empty__footer {
    margin-top: var(--nm-spacing-md);
  }
}

.nm-empty--large {
  .nm-empty__illustration {
    width: 140px;
    height: 140px;
  }

  .nm-empty__img {
    max-width: 140px;
    max-height: 140px;
  }

  .nm-empty__description {
    margin-top: var(--nm-spacing-md);
    font-size: var(--nm-font-lg);
  }

  .nm-empty__footer {
    margin-top: var(--nm-spacing-lg);
  }
}

// --- Image wrapper ---

.nm-empty__image {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nm-empty__illustration {
  color: var(--nm-text-disabled);
}

.nm-empty__img {
  object-fit: contain;
}

// --- Description ---

.nm-empty__description {
  color: var(--nm-text-secondary);
  line-height: 1.5;
  max-width: 320px;
}

// --- Footer ---

.nm-empty__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-sm);
  flex-wrap: wrap;
}

// --- Reduced motion ---

@media (prefers-reduced-motion: reduce) {
  .nm-empty {
    transition: none !important;
    animation: none !important;
  }
}
</style>
