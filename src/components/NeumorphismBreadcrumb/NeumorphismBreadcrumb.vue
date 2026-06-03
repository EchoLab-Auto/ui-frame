<script setup lang="ts">
import { computed } from 'vue'

export interface BreadcrumbItem {
  label: string
  to?: string
  disabled?: boolean
}

export interface NeumorphismBreadcrumbProps {
  items?: BreadcrumbItem[]
  separator?: string
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<NeumorphismBreadcrumbProps>(), {
  items: () => [],
  separator: '/',
  size: 'medium',
})

const emit = defineEmits<{
  (e: 'itemClick', item: BreadcrumbItem, index: number): void
}>()

const classList = computed(() => [
  'nm-breadcrumb',
  `nm-breadcrumb--${props.size}`,
])

function handleClick(item: BreadcrumbItem, index: number) {
  if (item.disabled) return
  emit('itemClick', item, index)
}
</script>

<template>
  <nav :class="classList" aria-label="面包屑导航">
    <ol class="nm-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="nm-breadcrumb__item"
        :class="{
          'nm-breadcrumb__item--active': index === items.length - 1,
          'nm-breadcrumb__item--disabled': item.disabled,
        }"
        :aria-current="index === items.length - 1 ? 'page' : undefined"
      >
        <a
          v-if="item.to && index !== items.length - 1"
          :href="item.to"
          class="nm-breadcrumb__link"
          @click.prevent="handleClick(item, index)"
        >
          {{ item.label }}
        </a>
        <span
          v-else
          class="nm-breadcrumb__text"
          role="button"
          :tabindex="index !== items.length - 1 && !item.disabled ? 0 : -1"
          @click="handleClick(item, index)"
          @keydown.enter="handleClick(item, index)"
          @keydown.space.prevent="handleClick(item, index)"
        >
          {{ item.label }}
        </span>

        <span
          v-if="index < items.length - 1"
          class="nm-breadcrumb__separator"
          aria-hidden="true"
        >
          {{ separator }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-breadcrumb {
  @include nm-theme-transition;
}

.nm-breadcrumb__list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 4px;
}

.nm-breadcrumb__item {
  display: flex;
  align-items: center;
  gap: 4px;

  &--active .nm-breadcrumb__text {
    font-weight: 600;
    color: var(--nm-text-primary);
  }

  &--disabled .nm-breadcrumb__link,
  &--disabled .nm-breadcrumb__text {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nm-breadcrumb__link {
  color: var(--nm-text-secondary);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: var(--nm-border-radius-sm);
  transition: all var(--nm-transition-fast);

  &:hover {
    color: var(--nm-primary-color);
    background-color: var(--nm-surface-raised);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--nm-primary-color);
  }
}

.nm-breadcrumb__text {
  padding: 4px 8px;
  border-radius: var(--nm-border-radius-sm);
  cursor: default;

  &[role="button"] {
    cursor: pointer;
    color: var(--nm-text-secondary);
    &:hover { color: var(--nm-primary-color); }
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--nm-primary-color);
    }
  }
}

.nm-breadcrumb__separator {
  color: var(--nm-text-placeholder);
  font-size: 13px;
  user-select: none;
}

// Sizes
.nm-breadcrumb--small { font-size: 12px; }
.nm-breadcrumb--medium { font-size: 14px; }
.nm-breadcrumb--large { font-size: 16px; }
</style>
