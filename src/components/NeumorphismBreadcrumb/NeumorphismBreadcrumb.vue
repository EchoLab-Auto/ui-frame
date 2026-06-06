<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'

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

const { t } = useLocale()

const emit = defineEmits<{
  (e: 'itemClick', item: BreadcrumbItem, index: number): void
}>()

const classList = computed(() => ['nm-breadcrumb', `nm-breadcrumb--${props.size}`])

function handleClick(item: BreadcrumbItem, index: number) {
  if (item.disabled) return
  emit('itemClick', item, index)
}
</script>

<template>
  <nav :class="classList" :aria-label="t('breadcrumbLabel')">
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
        <span
          class="nm-breadcrumb__text"
          :class="{ 'nm-breadcrumb__text--link': index !== items.length - 1 && !item.disabled }"
          :role="index !== items.length - 1 ? 'link' : undefined"
          :tabindex="index !== items.length - 1 && !item.disabled ? 0 : -1"
          @click="handleClick(item, index)"
          @keydown.enter="handleClick(item, index)"
          @keydown.space.prevent="handleClick(item, index)"
        >
          {{ item.label }}
        </span>

        <span v-if="index < items.length - 1" class="nm-breadcrumb__separator" aria-hidden="true">
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

  &--disabled .nm-breadcrumb__text {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nm-breadcrumb__text {
  padding: 4px 8px;
  border-radius: var(--nm-border-radius-sm);
  cursor: default;
  transition:
    color 0.25s $nm-ease-ambient,
    background-color 0.25s $nm-ease-ambient,
    box-shadow 0.25s $nm-ease-ambient,
    transform 0.2s $nm-ease-spring;

  &--link {
    cursor: pointer;
    color: var(--nm-text-secondary);
    @include nm-raised(1px, 2px);

    &:hover {
      color: var(--nm-primary-color);
      background-color: var(--nm-surface-raised);
      transform: translateY(-1px);
      box-shadow:
        3px 3px 6px var(--nm-shadow-dark),
        -2px -2px 4px var(--nm-shadow-light);
    }

    &:active {
      transform: translateY(0);
      @include nm-inset(1px, 2px);
      transition:
        transform 0.1s $nm-ease-compress,
        box-shadow 0.1s $nm-ease-compress;
    }

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
  transition: color 0.3s ease;
}

// Sizes
.nm-breadcrumb--small {
  font-size: 12px;
}
.nm-breadcrumb--medium {
  font-size: 14px;
}
.nm-breadcrumb--large {
  font-size: 16px;
}

@media (prefers-reduced-motion: reduce) {
  .nm-breadcrumb__text {
    transition: none;
  }
}
</style>
