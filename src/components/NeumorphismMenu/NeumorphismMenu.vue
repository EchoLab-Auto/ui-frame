<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMenu } from '@/composables/useMenu'
import { useNeumorphismSetup } from '@/extensions/createComponent'

import { useTheme } from '@/composables/useTheme'
import NeumorphismTooltip from '@/components/NeumorphismTooltip/NeumorphismTooltip.vue'
import type { MenuItem } from '@/composables/useMenu'

export type { MenuItem as NeumorphismMenuItemProps }

export interface NeumorphismMenuProps {
  /** Menu items (with optional children for submenus) */
  items?: MenuItem[]
  /** Layout direction */
  mode?: 'vertical' | 'horizontal'
  /** Default active (selected) item key */
  defaultActive?: string
  /** Default expanded submenu keys */
  defaultExpanded?: string[]
  /** Collapsed mode — only icons are shown */
  collapsed?: boolean
  /** Whether items can be selected (tracked via activeKey) */
  selectable?: boolean
  /** Theme override */
  theme?: 'light' | 'dark'
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<NeumorphismMenuProps>(), {
  items: () => [],
  mode: 'vertical',
  defaultActive: undefined,
  defaultExpanded: () => [],
  collapsed: false,
  selectable: true,
  theme: undefined,
  size: 'medium',
})

const emit = defineEmits<{
  (e: 'select', item: MenuItem): void
  (e: 'item-click', item: MenuItem): void
}>()

const { resolveProp } = useNeumorphismSetup()
const { isDark } = useTheme()

const resolvedTheme = computed(() => {
  if (props.theme) return props.theme
  return isDark.value ? 'dark' : 'light'
})

const resolvedMode = computed(() =>
  resolveProp(props.mode, undefined as 'vertical' | 'horizontal' | undefined, 'vertical')
)

const resolvedSize = computed(() =>
  resolveProp(props.size, undefined as 'small' | 'medium' | 'large' | undefined, 'medium')
)

const resolvedSelectable = computed(() => resolveProp(props.selectable, undefined, true))

// ---- Headless menu composable ----
const activeKeyRef = ref<string | null>(props.defaultActive ?? null)
const expandedKeysRef = ref<string[]>([...props.defaultExpanded])

const {
  handleKeydown,
  handleItemClick: onItemClick,
  handleItemEnter: onItemEnter,
  isExpanded,
  isActive,
  collapse,
} = useMenu({
  items: computed(() => props.items),
  mode: resolvedMode,
  activeKey: activeKeyRef,
  expandedKeys: expandedKeysRef,
  onSelect: item => {
    emit('select', item)
    emit('item-click', item)
  },
})

// ---- Traps for mouse enter/leave on submenus (horizontal mode) ----
let closeTimer: ReturnType<typeof setTimeout> | null = null

function onSubmenuMouseEnter(item: MenuItem) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  onItemEnter(item)
}

function onSubmenuMouseLeave(item: MenuItem) {
  if (resolvedMode.value === 'horizontal' && item.children?.length) {
    closeTimer = setTimeout(() => {
      collapse(item.key)
    }, 200)
  }
}

const classList = computed(() => [
  'nm-menu',
  `nm-menu--${resolvedMode.value}`,
  `nm-menu--${resolvedSize.value}`,
  `nm-menu--theme-${resolvedTheme.value}`,
  {
    'nm-menu--collapsed': props.collapsed,
    'nm-menu--selectable': resolvedSelectable.value,
  },
])

// ---- Determine ARIA role ----
const ariaRole = computed(() => (resolvedMode.value === 'horizontal' ? 'menubar' : 'menu'))

function getItemClass(item: MenuItem) {
  return [
    'nm-menu__item',
    {
      'nm-menu__item--active': isActive(item.key),
      'nm-menu__item--disabled': item.disabled,
      'nm-menu__item--divided': item.divided,
      'nm-menu__item--has-children': item.children && item.children.length > 0,
      'nm-menu__item--expanded': isExpanded(item.key),
    },
  ]
}

function onItemKeydown(event: KeyboardEvent, item: MenuItem) {
  if (item.disabled) return
  handleKeydown(event)
}

const expandIconClass = computed(() => [
  'nm-menu__expand-icon',
  {
    'nm-menu__expand-icon--expanded': false,
    'nm-menu__expand-icon--horizontal': resolvedMode.value === 'horizontal',
  },
])
</script>

<template>
  <nav :class="classList" :role="ariaRole" :aria-label="'Menu'" @keydown="handleKeydown">
    <ul class="nm-menu__list" role="group">
      <template v-for="item in items" :key="item.key">
        <!-- Divider before item -->
        <li v-if="item.divided" class="nm-menu__divider" role="separator" :aria-hidden="true" />

        <li
          :class="getItemClass(item)"
          role="menuitem"
          :aria-disabled="item.disabled ?? false"
          :aria-expanded="item.children?.length ? isExpanded(item.key) : undefined"
          :aria-haspopup="item.children?.length ? 'menu' : undefined"
          :tabindex="item.disabled ? -1 : 0"
          @click.stop="onItemClick(item)"
          @mouseenter="onSubmenuMouseEnter(item)"
          @mouseleave="onSubmenuMouseLeave(item)"
          @keydown="onItemKeydown($event, item)"
        >
          <!-- Item content -->
          <div class="nm-menu__item-content">
            <!-- Icon -->
            <span v-if="item.icon" class="nm-menu__item-icon" aria-hidden="true">
              {{ item.icon }}
            </span>

            <!-- Label (hidden in collapsed mode) -->
            <span v-if="!collapsed || !item.icon" class="nm-menu__item-label">
              {{ item.label }}
            </span>

            <!-- Expand arrow for submenus -->
            <span
              v-if="item.children?.length && !collapsed"
              :class="[
                ...expandIconClass,
                { 'nm-menu__expand-icon--expanded': isExpanded(item.key) },
              ]"
              aria-hidden="true"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path v-if="resolvedMode === 'vertical'" d="M9 18l6-6-6-6" />
                <path v-else d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>

          <!-- Submenu (recursive, only if not collapsed) -->
          <ul
            v-if="item.children?.length && isExpanded(item.key) && !collapsed"
            class="nm-menu__submenu"
            role="menu"
            :aria-label="item.label"
          >
            <template v-for="child in item.children" :key="child.key">
              <li v-if="child.divided" class="nm-menu__divider" role="separator" />
              <li
                :class="[
                  'nm-menu__item',
                  'nm-menu__item--sub',
                  {
                    'nm-menu__item--active': isActive(child.key),
                    'nm-menu__item--disabled': child.disabled,
                    'nm-menu__item--has-children': child.children && child.children.length > 0,
                    'nm-menu__item--expanded': isExpanded(child.key),
                  },
                ]"
                role="menuitem"
                :aria-disabled="child.disabled ?? false"
                :aria-expanded="child.children?.length ? isExpanded(child.key) : undefined"
                :aria-haspopup="child.children?.length ? 'menu' : undefined"
                :tabindex="child.disabled ? -1 : 0"
                @click.stop="onItemClick(child)"
                @mouseenter="onSubmenuMouseEnter(child)"
                @mouseleave="onSubmenuMouseLeave(child)"
                @keydown="onItemKeydown($event, child)"
              >
                <div class="nm-menu__item-content">
                  <span v-if="child.icon" class="nm-menu__item-icon" aria-hidden="true">
                    {{ child.icon }}
                  </span>
                  <span class="nm-menu__item-label">{{ child.label }}</span>
                  <span
                    v-if="child.children?.length"
                    :class="[
                      ...expandIconClass,
                      { 'nm-menu__expand-icon--expanded': isExpanded(child.key) },
                    ]"
                    aria-hidden="true"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path v-if="resolvedMode === 'vertical'" d="M9 18l6-6-6-6" />
                      <path v-else d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </div>

                <!-- Nested submenu (depth 2) -->
                <ul
                  v-if="child.children?.length && isExpanded(child.key)"
                  class="nm-menu__submenu"
                  role="menu"
                  :aria-label="child.label"
                >
                  <template v-for="grandchild in child.children" :key="grandchild.key">
                    <li v-if="grandchild.divided" class="nm-menu__divider" role="separator" />
                    <li
                      :class="[
                        'nm-menu__item',
                        'nm-menu__item--sub',
                        'nm-menu__item--sub-deep',
                        {
                          'nm-menu__item--active': isActive(grandchild.key),
                          'nm-menu__item--disabled': grandchild.disabled,
                        },
                      ]"
                      role="menuitem"
                      :aria-disabled="grandchild.disabled ?? false"
                      :tabindex="grandchild.disabled ? -1 : 0"
                      @click.stop="onItemClick(grandchild)"
                      @mouseenter="onSubmenuMouseEnter(grandchild)"
                      @mouseleave="onSubmenuMouseLeave(grandchild)"
                      @keydown="onItemKeydown($event, grandchild)"
                    >
                      <div class="nm-menu__item-content">
                        <span v-if="grandchild.icon" class="nm-menu__item-icon" aria-hidden="true">
                          {{ grandchild.icon }}
                        </span>
                        <span class="nm-menu__item-label">{{ grandchild.label }}</span>
                      </div>
                    </li>
                  </template>
                </ul>
              </li>
            </template>
          </ul>

          <!-- Collapsed mode: tooltip for items with icon only -->
          <NeumorphismTooltip
            v-if="collapsed && item.icon"
            :content="item.label"
            position="right"
            :delay="300"
            :disabled="!collapsed"
          />
        </li>
      </template>

      <!-- Empty state -->
      <li v-if="items.length === 0" class="nm-menu__empty">No menu items</li>
    </ul>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

/* ==========================================
   Base menu
   ========================================== */
.nm-menu {
  @include nm-theme-transition;
  user-select: none;
  outline: none;

  // Sizes
  &--small {
    --nm-menu-font: var(--nm-font-xs);
    --nm-menu-padding-x: var(--nm-spacing-sm);
    --nm-menu-padding-y: 5px;
    --nm-menu-gap: 2px;
    --nm-menu-icon-size: 14px;
  }
  &--medium {
    --nm-menu-font: var(--nm-font-base);
    --nm-menu-padding-x: var(--nm-spacing-md);
    --nm-menu-padding-y: 7px;
    --nm-menu-gap: var(--nm-spacing-xs);
    --nm-menu-icon-size: 18px;
  }
  &--large {
    --nm-menu-font: var(--nm-font-lg);
    --nm-menu-padding-x: var(--nm-spacing-lg);
    --nm-menu-padding-y: 9px;
    --nm-menu-gap: var(--nm-spacing-sm);
    --nm-menu-icon-size: 20px;
  }
}

/* ==========================================
   List
   ========================================== */
.nm-menu__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* ==========================================
   Vertical mode
   ========================================== */
.nm-menu--vertical {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(4px, 12px);
  padding: var(--nm-spacing-xs);

  .nm-menu__submenu {
    margin: 2px 0 0 0;
    padding: 0 0 0 0;
    list-style: none;
    border-left: 1px solid var(--nm-border-subtle);
    margin-left: calc(var(--nm-menu-icon-size) + var(--nm-menu-padding-x));
    padding-left: var(--nm-spacing-sm);
  }
}

/* ==========================================
   Horizontal mode
   ========================================== */
.nm-menu--horizontal {
  display: flex;
  flex-direction: row;
  align-items: center;

  .nm-menu__list {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0;
  }

  .nm-menu__item {
    position: relative;
  }

  .nm-menu__submenu {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 180px;
    margin: 4px 0 0 0;
    padding: var(--nm-spacing-xs);
    list-style: none;
    background-color: var(--nm-surface-color);
    border-radius: var(--nm-border-radius-md);
    @include nm-raised(4px, 12px);
    z-index: 100;
  }
}

/* ==========================================
   Menu item
   ========================================== */
.nm-menu__item {
  position: relative;
  border-radius: var(--nm-border-radius-sm);

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--divided {
    border-top: 1px solid var(--nm-border-subtle);
    margin-top: var(--nm-spacing-xs);
    padding-top: var(--nm-spacing-xs);
  }
}

.nm-menu__item-content {
  display: flex;
  align-items: center;
  gap: var(--nm-menu-gap);
  padding: var(--nm-menu-padding-y) var(--nm-menu-padding-x);
  font-size: var(--nm-menu-font);
  color: var(--nm-text-primary);
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  white-space: nowrap;

  @include nm-theme-transition;
  transition:
    background-color 0.25s $nm-ease-ambient,
    transform 0.2s $nm-ease-spring,
    box-shadow 0.25s $nm-ease-ambient,
    color 0.25s $nm-ease-ambient;
}

/* ---- Interactive states ---- */
.nm-menu__item:not(.nm-menu__item--disabled) {
  .nm-menu__item-content {
    &:hover {
      background-color: var(--nm-surface-raised);
      @include nm-hover-lift-strong(-1px);

      .nm-menu--vertical & {
        transform: translateX(3px);
        box-shadow:
          inset 1px 1px 2px var(--nm-shadow-dark),
          inset -1px -1px 2px var(--nm-shadow-light);
      }
    }

    &:active {
      transform: translateY(0);
      transition:
        box-shadow 0.12s $nm-ease-compress,
        transform 0.12s $nm-ease-compress;
      @include nm-inset(2px, 4px);
    }
  }
}

/* ---- Active/selected item ---- */
.nm-menu--selectable .nm-menu__item--active:not(.nm-menu__item--disabled) {
  .nm-menu__item-content {
    color: var(--nm-primary-color);
    font-weight: 600;
    background-color: var(--nm-surface-raised);
    @include nm-inset(2px, 4px);
  }
}

/* ---- Sub items ---- */
.nm-menu__item--sub {
  .nm-menu__item-content {
    padding-left: var(--nm-menu-padding-x);
  }
}

.nm-menu__item--sub-deep {
  .nm-menu__item-content {
    padding-left: calc(var(--nm-menu-padding-x) + var(--nm-spacing-sm));
  }
}

/* ---- Horizontal mode item ---- */
.nm-menu--horizontal .nm-menu__item-content {
  padding: var(--nm-menu-padding-y) var(--nm-menu-padding-x);
}

/* ==========================================
   Icon
   ========================================== */
.nm-menu__item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--nm-menu-icon-size);
  height: var(--nm-menu-icon-size);
  flex-shrink: 0;
  font-size: var(--nm-menu-icon-size);
  line-height: 1;
}

/* ==========================================
   Label
   ========================================== */
.nm-menu__item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ==========================================
   Expand icon
   ========================================== */
.nm-menu__expand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--nm-text-placeholder);
  transition: transform 0.25s $nm-ease-spring;
  margin-left: auto;

  &--expanded {
    transform: rotate(90deg);
  }

  &--horizontal {
    margin-left: var(--nm-spacing-xs);

    &.nm-menu__expand-icon--expanded {
      transform: rotate(180deg);
    }
  }
}

/* ==========================================
   Divider
   ========================================== */
.nm-menu__divider {
  height: 1px;
  margin: var(--nm-spacing-xs) var(--nm-menu-padding-x);
  background-color: var(--nm-border-subtle);
  list-style: none;
}

/* ==========================================
   Collapsed mode
   ========================================== */
.nm-menu--collapsed {
  min-width: unset;
  width: fit-content;

  .nm-menu__item-content {
    justify-content: center;
    padding: var(--nm-menu-padding-y) calc(var(--nm-menu-padding-x) - 2px);
    gap: 0;
  }

  .nm-menu__item--has-children {
    .nm-menu__expand-icon {
      display: none;
    }
  }

  .nm-menu__submenu {
    display: none;
  }
}

/* ==========================================
   Empty state
   ========================================== */
.nm-menu__empty {
  text-align: center;
  padding: var(--nm-spacing-lg) var(--nm-spacing-md);
  font-size: var(--nm-menu-font);
  color: var(--nm-text-placeholder);
  list-style: none;
}

/* ==========================================
   Light / Dark theme overrides
   ========================================== */
.nm-menu--theme-light {
  // Default is already light
}

.nm-menu--theme-dark {
  // Dark theme adjustments — tokens handle most of it
  background-color: var(--nm-surface-color);
}

/* ==========================================
   Reduced motion
   ========================================== */
@media (prefers-reduced-motion: reduce) {
  .nm-menu__item-content {
    transition: none !important;
  }

  .nm-menu__expand-icon {
    transition: none !important;
  }
}
</style>
