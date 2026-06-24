<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMenu } from '@/composables/useMenu'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useTheme } from '@/composables/useTheme'
import NeumorphismPopover from '@/components/NeumorphismPopover/NeumorphismPopover.vue'
import type { MenuItem } from '@/composables/useMenu'

export type { MenuItem as NeumorphismMenuItemProps }

export interface NeumorphismNavMenuProps {
  /** Navigation menu items */
  items?: MenuItem[]
  /** Default active item key */
  defaultActive?: string
  /** Layout direction */
  mode?: 'horizontal' | 'vertical'
  /** Whether to show active indicator (bottom border/glow) */
  showIndicator?: boolean
  /** Theme override */
  theme?: 'light' | 'dark'
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<NeumorphismNavMenuProps>(), {
  items: () => [],
  defaultActive: undefined,
  mode: 'horizontal',
  showIndicator: true,
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
  resolveProp(props.mode, undefined as 'horizontal' | 'vertical' | undefined, 'horizontal')
)

const resolvedSize = computed(() =>
  resolveProp(props.size, undefined as 'small' | 'medium' | 'large' | undefined, 'medium')
)

const resolvedShowIndicator = computed(() => resolveProp(props.showIndicator, undefined, true))

// ---- Headless menu composable ----
const activeKeyRef = ref<string | null>(props.defaultActive ?? null)
const expandedKeysRef = ref<string[]>([])

const {
  handleKeydown,
  handleItemClick: onItemClick,
  handleItemEnter: onItemEnter,
  isExpanded,
  isActive,
  expand,
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

// ---- Hover open/close timers for horizontal dropdown submenus ----
let closeTimer: ReturnType<typeof setTimeout> | null = null

function onMouseEnter(item: MenuItem) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  onItemEnter(item)
}

function onMouseLeave(item: MenuItem) {
  if (resolvedMode.value === 'horizontal' && item.children?.length) {
    closeTimer = setTimeout(() => {
      collapse(item.key)
    }, 250)
  }
}

function onSubmenuMouseEnter() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function onSubmenuMouseLeave(item: MenuItem) {
  closeTimer = setTimeout(() => {
    collapse(item.key)
  }, 250)
}

// ---- Popover refs for dropdown positioning ----
const popoverRefs = ref<Record<string, InstanceType<typeof NeumorphismPopover> | null>>({})

function setPopoverRef(key: string, el: any) {
  popoverRefs.value[key] = el
}

function onPopoverVisibleChange(item: MenuItem, visible: boolean) {
  if (visible) {
    expand(item.key)
  } else {
    collapse(item.key)
  }
}

const classList = computed(() => [
  'nm-nav-menu',
  `nm-nav-menu--${resolvedMode.value}`,
  `nm-nav-menu--${resolvedSize.value}`,
  `nm-nav-menu--theme-${resolvedTheme.value}`,
  {
    'nm-nav-menu--indicator': resolvedShowIndicator.value,
  },
])

function getItemClass(item: MenuItem) {
  return [
    'nm-nav-menu__item',
    {
      'nm-nav-menu__item--active': isActive(item.key),
      'nm-nav-menu__item--disabled': item.disabled,
      'nm-nav-menu__item--divided': item.divided,
      'nm-nav-menu__item--has-children': item.children && item.children.length > 0,
      'nm-nav-menu__item--expanded': isExpanded(item.key),
    },
  ]
}
</script>

<template>
  <nav :class="classList" role="navigation" aria-label="Navigation menu" @keydown="handleKeydown">
    <ul class="nm-nav-menu__list" role="menubar" :aria-orientation="resolvedMode">
      <template v-for="item in items" :key="item.key">
        <!-- Divider (in vertical mode) -->
        <li
          v-if="item.divided && resolvedMode === 'vertical'"
          class="nm-nav-menu__divider"
          role="separator"
        />

        <!-- Item with submenu (horizontal: dropdown via NeumorphismPopover) -->
        <NeumorphismPopover
          v-if="item.children?.length && resolvedMode === 'horizontal'"
          :key="`${item.key}-popover`"
          :ref="(el: any) => setPopoverRef(item.key, el)"
          position="bottom"
          trigger="hover"
          :offset="4"
          :show-arrow="false"
          :disabled="item.disabled"
          @visible-change="(visible: boolean) => onPopoverVisibleChange(item, visible)"
        >
          <!-- Trigger: nav item -->
          <li
            :class="getItemClass(item)"
            role="menuitem"
            :aria-disabled="item.disabled ?? false"
            :aria-haspopup="'menu'"
            :aria-expanded="isExpanded(item.key)"
            :tabindex="item.disabled ? -1 : 0"
            @click.stop="item.children?.length ? undefined : onItemClick(item)"
            @mouseenter="onMouseEnter(item)"
            @mouseleave="onMouseLeave(item)"
          >
            <div class="nm-nav-menu__item-content">
              <span v-if="item.icon" class="nm-nav-menu__item-icon" aria-hidden="true">
                {{ item.icon }}
              </span>
              <span class="nm-nav-menu__item-label">{{ item.label }}</span>
              <span class="nm-nav-menu__dropdown-arrow" aria-hidden="true">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>
            <!-- Active indicator bar -->
            <span
              v-if="resolvedShowIndicator && isActive(item.key)"
              class="nm-nav-menu__indicator"
              aria-hidden="true"
            />
          </li>

          <!-- Dropdown submenu content -->
          <template #content>
            <div
              class="nm-nav-menu__dropdown"
              role="menu"
              :aria-label="item.label"
              @mouseenter="onSubmenuMouseEnter"
              @mouseleave="onSubmenuMouseLeave(item)"
              @keydown="handleKeydown"
            >
              <template v-for="child in item.children" :key="child.key">
                <div v-if="child.divided" class="nm-nav-menu__dropdown-divider" role="separator" />
                <div
                  :class="[
                    'nm-nav-menu__dropdown-item',
                    {
                      'nm-nav-menu__dropdown-item--active': isActive(child.key),
                      'nm-nav-menu__dropdown-item--disabled': child.disabled,
                      'nm-nav-menu__dropdown-item--divided': child.divided,
                    },
                  ]"
                  role="menuitem"
                  :aria-disabled="child.disabled ?? false"
                  :tabindex="child.disabled ? -1 : 0"
                  @click.stop="onItemClick(child)"
                  @mouseenter="onItemEnter(child)"
                >
                  <span
                    v-if="child.icon"
                    class="nm-nav-menu__dropdown-item-icon"
                    aria-hidden="true"
                  >
                    {{ child.icon }}
                  </span>
                  <span class="nm-nav-menu__dropdown-item-label">{{ child.label }}</span>
                </div>
              </template>
            </div>
          </template>
        </NeumorphismPopover>

        <!-- Regular item (no children, or vertical mode) -->
        <li
          v-if="!item.children?.length || resolvedMode === 'vertical'"
          :class="getItemClass(item)"
          role="menuitem"
          :aria-disabled="item.disabled ?? false"
          :aria-haspopup="item.children?.length ? 'menu' : undefined"
          :aria-expanded="item.children?.length ? isExpanded(item.key) : undefined"
          :tabindex="item.disabled ? -1 : 0"
          @click.stop="onItemClick(item)"
          @mouseenter="onMouseEnter(item)"
          @mouseleave="onMouseLeave(item)"
          @keydown="handleKeydown"
        >
          <div class="nm-nav-menu__item-content">
            <span v-if="item.icon" class="nm-nav-menu__item-icon" aria-hidden="true">
              {{ item.icon }}
            </span>
            <span class="nm-nav-menu__item-label">{{ item.label }}</span>
            <span
              v-if="item.children?.length && resolvedMode === 'vertical'"
              class="nm-nav-menu__expand-icon"
              :class="{ 'nm-nav-menu__expand-icon--expanded': isExpanded(item.key) }"
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
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          </div>

          <!-- Active indicator bar (horizontal only) -->
          <span
            v-if="resolvedShowIndicator && resolvedMode === 'horizontal' && isActive(item.key)"
            class="nm-nav-menu__indicator"
            aria-hidden="true"
          />

          <!-- Vertical submenu (inline expand) -->
          <ul
            v-if="item.children?.length && resolvedMode === 'vertical' && isExpanded(item.key)"
            class="nm-nav-menu__submenu"
            role="menu"
            :aria-label="item.label"
          >
            <template v-for="child in item.children" :key="child.key">
              <li
                class="nm-nav-menu__item nm-nav-menu__item--sub"
                :class="{
                  'nm-nav-menu__item--active': isActive(child.key),
                  'nm-nav-menu__item--disabled': child.disabled,
                }"
                role="menuitem"
                :aria-disabled="child.disabled ?? false"
                :tabindex="child.disabled ? -1 : 0"
                @click.stop="onItemClick(child)"
                @mouseenter="onItemEnter(child)"
              >
                <div class="nm-nav-menu__item-content">
                  <span v-if="child.icon" class="nm-nav-menu__item-icon" aria-hidden="true">
                    {{ child.icon }}
                  </span>
                  <span class="nm-nav-menu__item-label">{{ child.label }}</span>
                </div>
              </li>
            </template>
          </ul>
        </li>
      </template>

      <!-- Empty state -->
      <li v-if="items.length === 0" class="nm-nav-menu__empty">No navigation items</li>
    </ul>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

/* ==========================================
   Base nav menu
   ========================================== */
.nm-nav-menu {
  @include nm-theme-transition;
  user-select: none;
  outline: none;

  // Sizes
  &--small {
    --nm-nav-font: var(--nm-font-xs);
    --nm-nav-padding-x: var(--nm-spacing-sm);
    --nm-nav-padding-y: 6px;
    --nm-nav-gap: 2px;
    --nm-nav-icon-size: 14px;
    --nm-nav-indicator-height: 2px;
  }
  &--medium {
    --nm-nav-font: var(--nm-font-base);
    --nm-nav-padding-x: var(--nm-spacing-md);
    --nm-nav-padding-y: 8px;
    --nm-nav-gap: var(--nm-spacing-xs);
    --nm-nav-icon-size: 18px;
    --nm-nav-indicator-height: 2px;
  }
  &--large {
    --nm-nav-font: var(--nm-font-lg);
    --nm-nav-padding-x: var(--nm-spacing-lg);
    --nm-nav-padding-y: 10px;
    --nm-nav-gap: var(--nm-spacing-sm);
    --nm-nav-icon-size: 20px;
    --nm-nav-indicator-height: 3px;
  }
}

/* ==========================================
   List
   ========================================== */
.nm-nav-menu__list {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* ==========================================
   Horizontal mode (default)
   ========================================== */
.nm-nav-menu--horizontal {
  .nm-nav-menu__list {
    flex-direction: row;
    align-items: center;
    gap: 0;
  }
}

/* ==========================================
   Vertical mode
   ========================================== */
.nm-nav-menu--vertical {
  .nm-nav-menu__list {
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: var(--nm-spacing-xs);
  }

  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(4px, 12px);

  .nm-nav-menu__item {
    border-radius: var(--nm-border-radius-sm);
  }

  .nm-nav-menu__submenu {
    margin: 2px 0 0 0;
    padding: 0 0 0 0;
    list-style: none;
    border-left: 1px solid var(--nm-border-subtle);
    margin-left: calc(var(--nm-nav-icon-size) + var(--nm-nav-padding-x));
    padding-left: var(--nm-spacing-sm);
  }

  .nm-nav-menu__item--sub {
    border-radius: var(--nm-border-radius-sm);
  }
}

/* ==========================================
   Menu item
   ========================================== */
.nm-nav-menu__item {
  position: relative;
  list-style: none;

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--divided {
    border-top: 1px solid var(--nm-border-subtle);
  }
}

.nm-nav-menu__item-content {
  display: flex;
  align-items: center;
  gap: var(--nm-nav-gap);
  padding: var(--nm-nav-padding-y) var(--nm-nav-padding-x);
  font-size: var(--nm-nav-font);
  color: var(--nm-text-primary);
  cursor: pointer;
  white-space: nowrap;
  border-radius: var(--nm-border-radius-sm);

  @include nm-theme-transition;
  transition:
    color 0.25s $nm-ease-ambient,
    background-color 0.25s $nm-ease-ambient,
    transform 0.2s $nm-ease-spring;
}

/* ---- Interactive states ---- */
.nm-nav-menu__item:not(.nm-nav-menu__item--disabled) {
  .nm-nav-menu__item-content {
    &:hover {
      color: var(--nm-primary-color);
    }

    &:active {
      transform: scale(0.97);
      transition: transform 0.1s $nm-ease-compress;
    }
  }
}

/* ---- Active/selected item ---- */
.nm-nav-menu__item--active:not(.nm-nav-menu__item--disabled) {
  .nm-nav-menu__item-content {
    color: var(--nm-primary-color);
    font-weight: 600;
  }
}

/* ==========================================
   Active indicator (bottom bar)
   ========================================== */
.nm-nav-menu--indicator {
  .nm-nav-menu__indicator {
    position: absolute;
    bottom: 0;
    left: var(--nm-nav-padding-x);
    right: var(--nm-nav-padding-x);
    height: var(--nm-nav-indicator-height);
    background-color: var(--nm-primary-color);
    border-radius: 1px;
    box-shadow: 0 0 6px color-mix(in srgb, var(--nm-primary-color) 50%, transparent);
    animation: nm-nav-indicator-in 0.3s $nm-ease-spring both;
  }
}

@keyframes nm-nav-indicator-in {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

/* ==========================================
   Icon
   ========================================== */
.nm-nav-menu__item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--nm-nav-icon-size);
  height: var(--nm-nav-icon-size);
  flex-shrink: 0;
  font-size: var(--nm-nav-icon-size);
  line-height: 1;
}

/* ==========================================
   Label
   ========================================== */
.nm-nav-menu__item-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ==========================================
   Dropdown arrow (horizontal in-trigger)
   ========================================== */
.nm-nav-menu__dropdown-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--nm-text-placeholder);
  transition: transform 0.25s $nm-ease-spring;
  margin-left: 2px;
  width: 12px;
  height: 12px;
}

.nm-nav-menu__item--expanded .nm-nav-menu__dropdown-arrow {
  transform: rotate(180deg);
}

/* ==========================================
   Expand icon (vertical mode)
   ========================================== */
.nm-nav-menu__expand-icon {
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
}

/* ==========================================
   Dropdown popover content
   ========================================== */
.nm-nav-menu__dropdown {
  display: flex;
  flex-direction: column;
  min-width: 160px;
  padding: var(--nm-spacing-xs);
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(4px, 12px);
}

.nm-nav-menu__dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-spacing-sm) var(--nm-spacing-md);
  font-size: var(--nm-font-base);
  color: var(--nm-text-primary);
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.2s ease,
    transform 0.15s $nm-ease-spring;

  &:hover:not(&--disabled) {
    background-color: var(--nm-surface-raised);
    transform: translateX(2px);
  }

  &:active:not(&--disabled) {
    transform: translateX(1px) scale(0.98);
    transition: transform 0.08s $nm-ease-compress;
  }

  &--active:not(&--disabled) {
    color: var(--nm-primary-color);
    font-weight: 600;
    background-color: var(--nm-surface-raised);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--divided {
    border-top: 1px solid var(--nm-border-subtle);
    margin-top: var(--nm-spacing-xs);
    padding-top: calc(var(--nm-spacing-sm) + var(--nm-spacing-xs));
  }
}

.nm-nav-menu__dropdown-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  font-size: 18px;
}

.nm-nav-menu__dropdown-item-label {
  flex: 1;
}

.nm-nav-menu__dropdown-divider {
  height: 1px;
  margin: var(--nm-spacing-xs) var(--nm-spacing-md);
  background-color: var(--nm-border-subtle);
}

/* ==========================================
   Divider (vertical mode)
   ========================================== */
.nm-nav-menu__divider {
  height: 1px;
  margin: var(--nm-spacing-xs) 0;
  background-color: var(--nm-border-subtle);
  list-style: none;
}

/* ==========================================
   Submenu (vertical mode)
   ========================================== */
.nm-nav-menu__submenu {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* ==========================================
   Empty state
   ========================================== */
.nm-nav-menu__empty {
  padding: var(--nm-spacing-md);
  text-align: center;
  color: var(--nm-text-placeholder);
  font-size: var(--nm-nav-font);
  list-style: none;
}

/* ==========================================
   Reduced motion
   ========================================== */
@media (prefers-reduced-motion: reduce) {
  .nm-nav-menu__item-content,
  .nm-nav-menu__dropdown-item {
    transition: none !important;
  }

  .nm-nav-menu--indicator .nm-nav-menu__indicator {
    animation: none !important;
  }

  .nm-nav-menu__dropdown-arrow,
  .nm-nav-menu__expand-icon {
    transition: none !important;
  }
}
</style>
