<script setup lang="ts">
import { computed } from 'vue'
import { useCollapse } from '@/composables/useCollapse'
import type { CollapseItem } from '@/composables/useCollapse'
import { generateId } from '@/utils'
import { useNeumorphismSetup } from '@/extensions/createComponent'

export type { CollapseItem }

export interface NeumorphismCollapseProps {
  modelValue?: string[]
  accordion?: boolean
  items?: CollapseItem[]
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<NeumorphismCollapseProps>(), {
  modelValue: () => [],
  accordion: false,
  items: () => [],
  size: 'medium',
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedSize = computed(() => resolveProp(props.size, config.value.collapse?.size, 'medium'))
const resolvedAccordion = computed(() =>
  resolveProp(props.accordion, config.value.collapse?.accordion, false)
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', value: string[]): void
}>()

const activeKeys = computed({
  get: () => props.modelValue,
  set: val => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

// Use headless collapse composable for all behavioral logic
const { toggle, isActive } = useCollapse({
  modelValue: activeKeys,
  items: computed(() => props.items),
  accordion: computed(() => resolvedAccordion.value),
})

const collapseId = generateId('nm-collapse')

const classList = computed(() => ['nm-collapse', `nm-collapse--${resolvedSize.value}`])
</script>

<template>
  <div :class="classList">
    <div
      v-for="item in items"
      :key="item.key"
      class="nm-collapse__item"
      :class="{
        'nm-collapse__item--active': isActive(item.key),
        'nm-collapse__item--disabled': item.disabled,
      }"
    >
      <h3 class="nm-collapse__header">
        <button
          :id="`${collapseId}-${item.key}-header`"
          class="nm-collapse__trigger"
          type="button"
          :aria-expanded="isActive(item.key)"
          :aria-controls="`${collapseId}-${item.key}-panel`"
          :aria-disabled="item.disabled"
          :disabled="item.disabled"
          @click="toggle(item.key)"
        >
          <!-- @slot Custom header rendering. Bind: item, active -->
          <slot :name="`header-${item.key}`" :item="item" :active="isActive(item.key)">
            <span class="nm-collapse__title">{{ item.title }}</span>
          </slot>
          <span
            class="nm-collapse__icon"
            :class="{ 'nm-collapse__icon--active': isActive(item.key) }"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
      </h3>

      <div
        :id="`${collapseId}-${item.key}-panel`"
        class="nm-collapse__panel"
        :class="{ 'nm-collapse__panel--collapsed': !isActive(item.key) }"
        role="region"
        :aria-labelledby="`${collapseId}-${item.key}-header`"
      >
        <div class="nm-collapse__content">
          <div class="nm-collapse__content-inner">
            <slot :name="item.key" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-collapse {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-xs);
}

.nm-collapse__item {
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);

  &--disabled {
    opacity: 0.5;
  }
}

.nm-collapse__header {
  margin: 0;
}

.nm-collapse__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--nm-collapse-trigger-padding-y-md) var(--nm-collapse-trigger-padding-x-md);
  border: none;
  cursor: pointer;
  font-size: var(--nm-collapse-trigger-font-md);
  font-weight: 500;
  color: var(--nm-text-primary);
  background: none;
  text-align: left;
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(2px, 5px);
  transition: all var(--nm-transition-normal);

  &:hover:not(:disabled) {
    @include nm-raised(3px, 7px);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.99);
    @include nm-inset(2px, 5px);
    transition:
      transform 0.1s $nm-ease-compress,
      box-shadow 0.1s $nm-ease-compress;
  }

  &[aria-expanded='true'] {
    @include nm-inset(2px, 5px);
    border-radius: var(--nm-border-radius-md) var(--nm-border-radius-md) 0 0;
  }

  &:disabled {
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--nm-primary-color);
  }
}

.nm-collapse__title {
  flex: 1;
  color: var(--nm-text-primary);
}

.nm-collapse__icon {
  display: flex;
  color: var(--nm-text-secondary);
  transition: transform var(--nm-transition-fast);

  &--active {
    transform: rotate(180deg);
  }
}

.nm-collapse__panel {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &--collapsed {
    grid-template-rows: 0fr;
  }
}

.nm-collapse__content {
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.25s ease;
}

.nm-collapse__panel--collapsed .nm-collapse__content {
  opacity: 0;
}

.nm-collapse__content-inner {
  padding: var(--nm-collapse-content-padding-y) var(--nm-collapse-content-padding-x);
  color: var(--nm-text-primary);
  font-size: var(--nm-font-base);
  line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  .nm-collapse__panel,
  .nm-collapse__content {
    transition: none;
  }
}

// Sizes
.nm-collapse--small .nm-collapse__trigger {
  padding: var(--nm-collapse-trigger-padding-y-sm) var(--nm-collapse-trigger-padding-x-sm);
  font-size: var(--nm-collapse-trigger-font-sm);
}
.nm-collapse--large .nm-collapse__trigger {
  padding: var(--nm-collapse-trigger-padding-y-lg) var(--nm-collapse-trigger-padding-x-lg);
  font-size: var(--nm-collapse-trigger-font-lg);
}
</style>
