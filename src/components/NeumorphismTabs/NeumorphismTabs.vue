<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { generateId } from '@/utils'

export interface TabItem {
  key: string
  label: string
  disabled?: boolean
  icon?: string
}

export interface NeumorphismTabsProps {
  modelValue?: string
  tabs?: TabItem[]
  position?: 'top' | 'left' | 'right'
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<NeumorphismTabsProps>(), {
  modelValue: '',
  tabs: () => [],
  position: 'top',
  size: 'medium',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'tabClick', tab: TabItem): void
}>()

const activeKey = ref(props.modelValue)
const tabListId = generateId('nm-tabs')
const tabRefs = ref<Map<string, HTMLElement>>(new Map())

watch(() => props.modelValue, (val) => { activeKey.value = val })

function activate(key: string) {
  if (props.tabs.find((t) => t.key === key)?.disabled) return
  activeKey.value = key
  emit('update:modelValue', key)
  emit('change', key)
  const tab = props.tabs.find((t) => t.key === key)
  if (tab) emit('tabClick', tab)
}

function setTabRef(key: string, el: unknown) {
  if (el instanceof HTMLElement) tabRefs.value.set(key, el)
}

function handleKeydown(event: KeyboardEvent, key: string) {
  const activeTabs = props.tabs.filter((t) => !t.disabled)
  const idx = activeTabs.findIndex((t) => t.key === key)
  let nextIdx: number

  if (props.position === 'left' || props.position === 'right') {
    if (event.key === 'ArrowDown') { event.preventDefault(); nextIdx = idx + 1 < activeTabs.length ? idx + 1 : 0 }
    else if (event.key === 'ArrowUp') { event.preventDefault(); nextIdx = idx - 1 >= 0 ? idx - 1 : activeTabs.length - 1 }
    else return
  } else {
    if (event.key === 'ArrowRight') { event.preventDefault(); nextIdx = idx + 1 < activeTabs.length ? idx + 1 : 0 }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); nextIdx = idx - 1 >= 0 ? idx - 1 : activeTabs.length - 1 }
    else return
  }

  const nextTab = activeTabs[nextIdx]
  if (nextTab) {
    activate(nextTab.key)
    nextTick(() => tabRefs.value.get(nextTab.key)?.focus())
  }
}

const panelId = computed(() => `${tabListId}-panel`)

const classList = computed(() => [
  'nm-tabs',
  `nm-tabs--${props.position}`,
  `nm-tabs--${props.size}`,
])
</script>

<template>
  <div :class="classList">
    <div class="nm-tabs__nav" role="tablist" :aria-orientation="position === 'left' || position === 'right' ? 'vertical' : 'horizontal'" :aria-label="'标签导航'">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :ref="(el) => setTabRef(tab.key, el)"
        class="nm-tabs__tab"
        :class="{
          'nm-tabs__tab--active': activeKey === tab.key,
          'nm-tabs__tab--disabled': tab.disabled,
        }"
        role="tab"
        :aria-selected="activeKey === tab.key"
        :aria-disabled="tab.disabled"
        :tabindex="activeKey === tab.key ? 0 : -1"
        :disabled="tab.disabled"
        @click="activate(tab.key)"
        @keydown="handleKeydown($event, tab.key)"
      >
        <span class="nm-tabs__tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <div
      :id="panelId"
      class="nm-tabs__panel"
      role="tabpanel"
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
  transition: all var(--nm-transition-fast);

  &:hover:not(&--disabled):not(&--active) {
    color: var(--nm-text-primary);
    @include nm-raised(1px, 3px);
  }

  &--active {
    color: var(--nm-primary-color);
    @include nm-inset(2px, 4px);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.nm-tabs__tab-label {
  position: relative;
}

.nm-tabs__panel {
  padding: var(--nm-spacing-md);
  color: var(--nm-text-primary);
}

// Sizes
.nm-tabs--small .nm-tabs__tab { padding: 6px 14px; font-size: 12px; }
.nm-tabs--medium .nm-tabs__tab { padding: 10px 20px; font-size: 14px; }
.nm-tabs--large .nm-tabs__tab { padding: 14px 28px; font-size: 16px; }
</style>
