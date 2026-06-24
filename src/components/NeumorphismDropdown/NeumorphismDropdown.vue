<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import type { PopoverPosition, PopoverTrigger } from '@/composables/usePopover'
import NeumorphismPopover from '@/components/NeumorphismPopover/NeumorphismPopover.vue'

export interface DropdownItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  divided?: boolean
  danger?: boolean
}

export interface NeumorphismDropdownProps {
  /** Dropdown items */
  items?: DropdownItem[]
  /** Popover position relative to trigger */
  position?: PopoverPosition
  /** Trigger mode */
  trigger?: PopoverTrigger
  /** Whether the dropdown is disabled */
  disabled?: boolean
  /** Offset from trigger in px */
  offset?: number
}

const props = withDefaults(defineProps<NeumorphismDropdownProps>(), {
  items: () => [],
  position: 'bottom',
  trigger: 'click',
  disabled: false,
  offset: 4,
})

const { resolveProp } = useNeumorphismSetup()

const resolvedPosition = computed(() =>
  resolveProp(props.position, undefined, 'bottom' as PopoverPosition)
)
const resolvedTrigger = computed(() =>
  resolveProp(props.trigger, undefined, 'click' as PopoverTrigger)
)
const resolvedOffset = computed(() => resolveProp(props.offset, undefined, 4))

const emit = defineEmits<{
  (e: 'select', item: DropdownItem): void
  (e: 'visible-change', visible: boolean): void
}>()

const popoverRef = ref<InstanceType<typeof NeumorphismPopover>>()
const activeIndex = ref(-1)

function handleSelect(item: DropdownItem) {
  if (item.disabled) return
  emit('select', item)
  // Close popover after selection
  popoverRef.value?.hide?.()
}

function handleVisibleChange(visible: boolean) {
  if (!visible) activeIndex.value = -1
  emit('visible-change', visible)
}

function handleKeydown(event: KeyboardEvent) {
  const enabledItems = props.items.filter(i => !i.disabled)
  if (!enabledItems.length) return

  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault()
      activeIndex.value = activeIndex.value < enabledItems.length - 1 ? activeIndex.value + 1 : 0
      break
    }
    case 'ArrowUp': {
      event.preventDefault()
      activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : enabledItems.length - 1
      break
    }
    case 'Enter':
    case ' ': {
      event.preventDefault()
      if (activeIndex.value >= 0) {
        handleSelect(enabledItems[activeIndex.value])
      }
      break
    }
    case 'Escape': {
      popoverRef.value?.hide?.()
      break
    }
    default:
      break
  }
}

function getItemClass(item: DropdownItem, _index: number) {
  const isActive = props.items.filter(i => !i.disabled)[activeIndex.value] === item
  return [
    'nm-dropdown__item',
    {
      'nm-dropdown__item--disabled': item.disabled,
      'nm-dropdown__item--danger': item.danger,
      'nm-dropdown__item--divided': item.divided,
      'nm-dropdown__item--active': isActive,
    },
  ]
}

const classList = computed(() => ['nm-dropdown'])
</script>

<template>
  <NeumorphismPopover
    ref="popoverRef"
    :position="resolvedPosition"
    :trigger="resolvedTrigger"
    :disabled="disabled"
    :offset="resolvedOffset"
    :show-arrow="false"
    @visible-change="handleVisibleChange"
  >
    <!-- Trigger slot -->
    <slot />

    <!-- Content slot -->
    <template #content>
      <div :class="classList" role="menu" @keydown="handleKeydown">
        <template v-for="(item, index) in items" :key="item.key">
          <div v-if="item.divided && index > 0" class="nm-dropdown__divider" role="separator" />
          <div
            :class="getItemClass(item, index)"
            role="menuitem"
            :aria-disabled="item.disabled"
            :tabindex="item.disabled ? -1 : 0"
            @click="handleSelect(item)"
          >
            <span v-if="item.icon" class="nm-dropdown__item-icon">{{ item.icon }}</span>
            <span class="nm-dropdown__item-label">{{ item.label }}</span>
          </div>
        </template>
        <div v-if="items.length === 0 && $slots.items" class="nm-dropdown__custom">
          <slot name="items" />
        </div>
      </div>
    </template>
  </NeumorphismPopover>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-dropdown {
  display: flex;
  flex-direction: column;
  min-width: 160px;
  padding: var(--nm-spacing-xs);
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(4px, 12px);
}

.nm-dropdown__item {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-spacing-sm) var(--nm-spacing-md);
  font-size: var(--nm-font-base);
  color: var(--nm-text-primary);
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.15s $nm-ease-spring;
  white-space: nowrap;
  user-select: none;

  &:hover:not(&--disabled) {
    background-color: var(--nm-surface-raised);
    transform: translateX(2px);
  }

  &:active:not(&--disabled) {
    transform: translateX(1px) scale(0.98);
    transition: transform 0.08s $nm-ease-compress;
  }

  &--active:not(&--disabled) {
    background-color: var(--nm-surface-raised);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--danger {
    color: var(--nm-color-error);
  }
}

.nm-dropdown__item-icon {
  display: inline-flex;
  align-items: center;
  width: 18px;
  justify-content: center;
  flex-shrink: 0;
}

.nm-dropdown__item-label {
  flex: 1;
}

.nm-dropdown__divider {
  height: 1px;
  margin: var(--nm-spacing-xs) 0;
  background-color: var(--nm-border-subtle);
}

.nm-dropdown__custom {
  min-width: 120px;
}

@media (prefers-reduced-motion: reduce) {
  .nm-dropdown__item {
    transition: none;
  }
}
</style>
