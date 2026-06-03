<script setup lang="ts">
import { computed } from 'vue'
import { generateId } from '@/utils'

export interface CollapseItem {
  key: string
  title: string
  disabled?: boolean
}

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

const collapseId = generateId('nm-collapse')

function toggle(key: string) {
  const item = props.items.find((i) => i.key === key)
  if (item?.disabled) return

  const keys = [...props.modelValue]
  const idx = keys.indexOf(key)
  if (idx >= 0) {
    keys.splice(idx, 1)
  } else {
    if (props.accordion) {
      emit('update:modelValue', [key])
      emit('change', [key])
      return
    }
    keys.push(key)
  }
  emit('update:modelValue', keys)
  emit('change', keys)
}

function isActive(key: string): boolean {
  return props.modelValue.includes(key)
}

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
          <span class="nm-collapse__title">{{ item.title }}</span>
          <span class="nm-collapse__icon" :class="{ 'nm-collapse__icon--active': isActive(item.key) }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </span>
        </button>
      </h3>

      <transition name="nm-collapse">
        <div
          v-if="isActive(item.key)"
          :id="`${collapseId}-${item.key}-panel`"
          class="nm-collapse__panel"
          role="region"
          :aria-labelledby="`${collapseId}-${item.key}-header`"
        >
          <div class="nm-collapse__content">
            <slot :name="item.key" />
          </div>
        </div>
      </transition>
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
}

// Panel transition
.nm-collapse-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.nm-collapse-leave-active { transition: all 0.2s ease; }
.nm-collapse-enter-from,
.nm-collapse-leave-to { opacity: 0; max-height: 0; }
.nm-collapse-enter-to,
.nm-collapse-leave-from { opacity: 1; max-height: 500px; }

// Sizes
.nm-collapse--small  .nm-collapse__trigger { padding: 12px 16px; font-size: 13px; }
.nm-collapse--large  .nm-collapse__trigger { padding: 20px 28px; font-size: 16px; }
</style>
