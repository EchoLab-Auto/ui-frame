<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useTabs } from '@/composables/useTabs'
import type { TabItem } from '@/composables/useTabs'

export type { TabItem }

export interface NeumorphismTabsProps {
  modelValue?: string
  tabs?: TabItem[]
  position?: 'top' | 'left' | 'right'
  size?: 'small' | 'medium' | 'large'
  navLabel?: string
}

const props = withDefaults(defineProps<NeumorphismTabsProps>(), {
  modelValue: '',
  tabs: () => [],
  position: 'top',
  size: 'medium',
  navLabel: '标签导航',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'tabClick', tab: TabItem): void
}>()

// Use headless tabs composable for all behavioral logic
const activeKey = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    emit('change', val)
    const tab = props.tabs.find((t) => t.key === val)
    if (tab) emit('tabClick', tab)
  },
})

const { activate, handleKeydown: onKeydown, panelId, orientation } =
  useTabs({
    modelValue: activeKey,
    tabs: computed(() => props.tabs),
    position: computed(() => props.position),
  })

const activeTabs = computed(() => props.tabs.filter((t) => !t.disabled))

const tabRefs = ref<Map<string, HTMLElement>>(new Map())

function setTabRef(key: string, el: unknown) {
  if (el instanceof HTMLElement) tabRefs.value.set(key, el)
}

function handleKeydown(event: KeyboardEvent, key: string) {
  onKeydown(event, key)
  // Focus the newly activated tab after keyboard navigation
  const activeT = activeTabs.value.find((t) => t.key === activeKey.value)
  if (activeT) {
    nextTick(() => tabRefs.value.get(activeT.key)?.focus())
  }
}

const classList = computed(() => [
  'nm-tabs',
  `nm-tabs--${props.position}`,
  `nm-tabs--${props.size}`,
])
</script>

<template>
  <div :class="classList">
    <div
      class="nm-tabs__nav"
      role="tablist"
      :aria-orientation="orientation"
      :aria-label="navLabel"
    >
      <!-- @slot Custom tab rendering. Bind: tab, active, index, activate -->
      <slot
        v-for="(tab, index) in tabs"
        :key="tab.key"
        name="tab"
        :tab="tab"
        :active="modelValue === tab.key"
        :index="index"
        :activate="activate"
      >
        <button
          :id="`${panelId}-tab-${tab.key}`"
          :ref="(el) => setTabRef(tab.key, el)"
          class="nm-tabs__tab"
          :class="{
            'nm-tabs__tab--active': modelValue === tab.key,
            'nm-tabs__tab--disabled': tab.disabled,
          }"
          role="tab"
          :aria-selected="modelValue === tab.key"
          :aria-disabled="tab.disabled"
          :tabindex="modelValue === tab.key ? 0 : -1"
          :disabled="tab.disabled"
          @click="activate(tab.key)"
          @keydown="handleKeydown($event, tab.key)"
        >
          <span class="nm-tabs__tab-label">{{ tab.label }}</span>
        </button>
      </slot>
    </div>

    <div
      :id="panelId"
      class="nm-tabs__panel"
      role="tabpanel"
      :aria-labelledby="`${panelId}-tab-${modelValue}`"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-tabs {
  display: flex;

  &--top, &--bottom {
    flex-direction: column;
  }

  &--left, &--right {
    flex-direction: row;
  }

  &--left .nm-tabs__nav { order: 0; }
  &--left .nm-tabs__panel { order: 1; flex: 1; }
  &--right .nm-tabs__nav { order: 1; }
  &--right .nm-tabs__panel { order: 0; flex: 1; }
}

.nm-tabs__nav {
  display: flex;
  gap: 4px;
  padding: 4px;

  .nm-tabs--top &,
  .nm-tabs--bottom & {
    flex-direction: row;
    overflow-x: auto;
  }

  .nm-tabs--left &,
  .nm-tabs--right & {
    flex-direction: column;
  }
}

.nm-tabs__tab {
  padding: 10px 20px;
  border: none;
  border-radius: var(--nm-border-radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: var(--nm-text-secondary);
  background: transparent;
  white-space: nowrap;
  transition:
    box-shadow 0.35s $nm-ease-spring,
    transform 0.3s $nm-ease-spring,
    color 0.3s $nm-ease-ambient,
    background-color 0.3s $nm-ease-ambient;
  position: relative;
  overflow: hidden;

  &:hover:not(&--disabled):not(&--active) {
    color: var(--nm-text-primary);
    @include nm-raised(1px, 3px);
    transform: translateY(-1px);
  }

  &:active:not(&--disabled):not(&--active) {
    transform: translateY(0) scale(0.97);
    transition: transform 0.1s $nm-ease-compress, box-shadow 0.1s $nm-ease-compress;
  }

  &--active {
    color: var(--nm-primary-color);
    @include nm-inset(2px, 4px);
    animation: nm-tab-active 0.4s $nm-ease-bounce;
  }

  // Active glow indicator
  &--active::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    border-radius: 1px;
    background-color: var(--nm-primary-color);
    box-shadow: 0 0 6px rgba(108, 122, 224, 0.4);
    animation: nm-tab-indicator 0.4s $nm-ease-spring;
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.nm-tabs__tab-label {
  position: relative;
  transition: transform 0.25s $nm-ease-spring;
}

.nm-tabs__tab--active .nm-tabs__tab-label {
  transform: scale(1.02);
}

.nm-tabs__panel {
  padding: var(--nm-spacing-md);
  color: var(--nm-text-primary);
  animation: nm-tab-panel-fade 0.35s $nm-ease-decelerate;
}

// Sizes
.nm-tabs--small .nm-tabs__tab { padding: 6px 14px; font-size: 12px; }
.nm-tabs--medium .nm-tabs__tab { padding: 10px 20px; font-size: 14px; }
.nm-tabs--large .nm-tabs__tab { padding: 14px 28px; font-size: 16px; }

@keyframes nm-tab-active {
  0% { transform: scale(0.96); }
  60% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@keyframes nm-tab-indicator {
  0% { width: 0; opacity: 0; }
  50% { width: 28px; opacity: 1; }
  100% { width: 20px; opacity: 1; }
}

@keyframes nm-tab-panel-fade {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .nm-tabs__tab {
    transition: none;
  }
  .nm-tabs__tab--active {
    animation: none;
  }
  .nm-tabs__tab--active::after {
    animation: none;
  }
  .nm-tabs__panel {
    animation: none;
  }
}
</style>
