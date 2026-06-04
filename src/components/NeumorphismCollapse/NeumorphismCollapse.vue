<script setup lang="ts">
import { computed } from 'vue'
import { useCollapse } from '@/composables/useCollapse'
import type { CollapseItem } from '@/composables/useCollapse'
import { generateId } from '@/utils'

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

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', value: string[]): void
}>()

const activeKeys = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

// Use headless collapse composable for all behavioral logic
const { toggle, isActive } = useCollapse({
  modelValue: activeKeys,
  items: computed(() => props.items),
  accordion: computed(() => props.accordion),
})

const collapseId = generateId('nm-collapse')

const classList = computed(() => [
  'nm-collapse',
  `nm-collapse--${props.size}`,
])
</script>

<template>
  <div :class="classList">
    <div
      v-for="item in items"
      :key="item.key"
      class="nm-collapse__item"
      :class="{ 'nm-collapse__item--active': isActive(item.key), 'nm-collapse__item--disabled': item.disabled }"
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
          <span class="nm-collapse__icon" :class="{ 'nm-collapse__icon--active': isActive(item.key) }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </span>
        </button>
      </h3>

      <div
        :id="`${collapseId}-${item.key}-panel`"
        class="nm-collapse__panel"
        role="region"
        :aria-labelledby="`${collapseId}-${item.key}-header`"
      >
        <div
          class="nm-collapse__content"
          :class="{ 'nm-collapse__content--collapsed': !isActive(item.key) }"
        >
          <slot :name="item.key" />
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
  gap: 4px;
}

.nm-collapse__item {
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);

  &--disabled { opacity: 0.5; }
}

.nm-collapse__header {
  margin: 0;
}

.nm-collapse__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  border: none;
  cursor: pointer;
  font-size: 15px;
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

  &[aria-expanded="true"] {
    @include nm-inset(2px, 5px);
    border-radius: var(--nm-border-radius-md) var(--nm-border-radius-md) 0 0;
  }

  &:disabled { cursor: not-allowed; }
  &:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--nm-primary-color); }
}

.nm-collapse__title {
  flex: 1;
  color: var(--nm-text-primary);
}

.nm-collapse__icon {
  display: flex;
  color: var(--nm-text-secondary);
  transition: transform var(--nm-transition-fast);

  &--active { transform: rotate(180deg); }
}

.nm-collapse__panel {
  overflow: hidden;
}

.nm-collapse__content {
  padding: 16px 20px;
  color: var(--nm-text-primary);
  font-size: 14px;
  line-height: 1.6;
  max-height: 2000px;
  opacity: 1;
  transition: max-height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease, padding 0.25s ease;

  &--collapsed {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-collapse__content {
    transition: none;
  }
}

// Sizes
.nm-collapse--small  .nm-collapse__trigger { padding: 12px 16px; font-size: 13px; }
.nm-collapse--large  .nm-collapse__trigger { padding: 20px 28px; font-size: 16px; }
</style>
