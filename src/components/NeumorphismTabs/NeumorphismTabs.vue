<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useTabs } from '@/composables/useTabs'
import { useConfig } from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { TABS_SCALE } from '@/utils/controlScales'
import type { TabItem } from '@/composables/useTabs'

export type { TabItem }

export type TabsSize = 'small' | 'medium' | 'large'

export interface NeumorphismTabsProps {
  modelValue?: string
  tabs?: TabItem[]
  position?: 'top' | 'left' | 'right'
  /**
   * 尺寸——px 标签字号（数字，主几何量），或三档预设名。
   *
   * 数字即「标签字号」：标签内距按三锚点（12 / 14 / 16）分段线性插值，
   * 所以 `:size="14"` 与 `size="medium"` 逐像素相同，`:size="15"` 落在两者之间。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | TabsSize
  navLabel?: string
}

const props = withDefaults(defineProps<NeumorphismTabsProps>(), {
  modelValue: '',
  tabs: () => [],
  // 级联 prop（position/size）保持 undefined，由全局配置 tabs 段兜底
})

const config = useConfig()
const resolvedPosition = computed(() => props.position ?? config.value.tabs?.position ?? 'top')
/** 数字尺寸的语义是「标签字号」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 14

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() => {
  const raw = props.size ?? config.value.tabs?.size
  return typeof raw === 'number' ? normalizeNumericSize(raw, DEFAULT_SIZE_PX) : undefined
})

/** 字符串通道：只认档位别名（显式传数字时它不参与渲染） */
const resolvedSize = computed<TabsSize>(() => {
  const raw = props.size ?? config.value.tabs?.size
  return typeof raw === 'string' ? raw : 'medium'
})

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale）；变量在根节点，消费在标签按钮上 */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(TABS_SCALE, numericSize.value)
)

const { t } = useLocale()
const resolvedNavLabel = computed(() => props.navLabel || t('tabsNavLabel'))

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'tabClick', tab: TabItem): void
}>()

// Use headless tabs composable for all behavioral logic
const activeKey = computed({
  get: () => props.modelValue,
  set: val => {
    emit('update:modelValue', val)
    emit('change', val)
    const tab = props.tabs.find(t => t.key === val)
    if (tab) emit('tabClick', tab)
  },
})

const {
  activate,
  handleKeydown: onKeydown,
  panelId,
  orientation,
} = useTabs({
  modelValue: activeKey,
  tabs: computed(() => props.tabs),
  position: resolvedPosition,
})

const activeTabs = computed(() => props.tabs.filter(t => !t.disabled))

const tabRefs = ref<Map<string, HTMLElement>>(new Map())

function setTabRef(key: string, el: unknown) {
  if (el instanceof HTMLElement) tabRefs.value.set(key, el)
}

function handleKeydown(event: KeyboardEvent, key: string) {
  onKeydown(event, key)
  // Focus the newly activated tab after keyboard navigation
  const activeT = activeTabs.value.find(t => t.key === activeKey.value)
  if (activeT) {
    nextTick(() => tabRefs.value.get(activeT.key)?.focus())
  }
}

const classList = computed(() => [
  'nm-tabs',
  `nm-tabs--${resolvedPosition.value}`,
  numericSize.value === undefined ? `nm-tabs--${resolvedSize.value}` : 'nm-tabs--sized',
])
</script>

<template>
  <div :class="classList" :style="sizeStyle">
    <div
      class="nm-tabs__nav"
      role="tablist"
      :aria-orientation="orientation"
      :aria-label="resolvedNavLabel"
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
          :ref="el => setTabRef(tab.key, el)"
          class="nm-tabs__tab"
          :class="{
            'nm-tabs__tab--active': modelValue === tab.key,
            'nm-tabs__tab--disabled': tab.disabled,
          }"
          role="tab"
          :aria-selected="modelValue === tab.key"
          :aria-disabled="tab.disabled"
          :aria-controls="panelId"
          :tabindex="modelValue === tab.key ? 0 : -1"
          :disabled="tab.disabled"
          @click="activate(tab.key)"
          @keydown="handleKeydown($event, tab.key)"
        >
          <span v-if="tab.icon" class="nm-tabs__tab-icon" aria-hidden="true">{{ tab.icon }}</span>
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

  &--top,
  &--bottom {
    flex-direction: column;
  }

  &--left,
  &--right {
    flex-direction: row;
  }

  &--left .nm-tabs__nav {
    order: 0;
  }
  &--left .nm-tabs__panel {
    order: 1;
    flex: 1;
  }
  &--right .nm-tabs__nav {
    order: 1;
  }
  &--right .nm-tabs__panel {
    order: 0;
    flex: 1;
  }
}

.nm-tabs__nav {
  display: flex;
  gap: var(--nm-spacing-xs);
  padding: var(--nm-spacing-xs);

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
  padding: var(--nm-tabs-tab-padding-y-md) var(--nm-tabs-tab-padding-x-md);
  border: none;
  border-radius: var(--nm-border-radius-md);
  font-size: var(--nm-tabs-tab-font-md);
  font-weight: 500;
  cursor: pointer;
  color: var(--nm-text-secondary);
  background: transparent;
  white-space: nowrap;
  // 触屏：标签高度 ≥44px
  @include nm-touch-min(null, 44px);
  transition:
    box-shadow 0.35s $nm-ease-spring,
    transform 0.3s $nm-ease-spring,
    color 0.3s $nm-ease-ambient,
    background-color 0.3s $nm-ease-ambient;
  position: relative;
  overflow: hidden;

  @media (hover: hover) {
    &:hover:not(&--disabled):not(&--active) {
      color: var(--nm-text-primary);
      @include nm-raised(1px, 3px);
      transform: translateY(-1px);
    }
  }

  // 键盘焦点内环（标签紧凑排列）
  @include nm-focus-ring(-2px);

  &:active:not(&--disabled):not(&--active) {
    transform: translateY(0) scale(0.97);
    transition:
      transform 0.1s $nm-ease-compress,
      box-shadow 0.1s $nm-ease-compress;
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
    box-shadow: 0 0 6px color-mix(in srgb, var(--nm-primary-color) 40%, transparent);
    animation: nm-tab-indicator 0.4s $nm-ease-spring;
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.nm-tabs__tab-icon {
  display: inline-flex;
  align-items: center;
  margin-right: var(--nm-spacing-xs);
  line-height: 1;
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
.nm-tabs--small .nm-tabs__tab {
  padding: var(--nm-tabs-tab-padding-y-sm) var(--nm-tabs-tab-padding-x-sm);
  font-size: var(--nm-tabs-tab-font-sm);
}
.nm-tabs--medium .nm-tabs__tab {
  padding: var(--nm-tabs-tab-padding-y-md) var(--nm-tabs-tab-padding-x-md);
  font-size: var(--nm-tabs-tab-font-md);
}
.nm-tabs--large .nm-tabs__tab {
  padding: var(--nm-tabs-tab-padding-y-lg) var(--nm-tabs-tab-padding-x-lg);
  font-size: var(--nm-tabs-tab-font-lg);
}

// 数字尺寸（`:size="15"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类，所以不存在覆盖之争。
// 变量挂在根节点（`:style`），但消费方是标签按钮：选择器必须与三档类同层级
// （`.nm-tabs--sized .nm-tabs__tab`），声明也与三档类一一对应。
.nm-tabs--sized .nm-tabs__tab {
  padding: var(--nm-tabs-sz-pad-y) var(--nm-tabs-sz-pad-x);
  font-size: var(--nm-tabs-sz-font);
}

@keyframes nm-tab-active {
  0% {
    transform: scale(0.96);
  }
  60% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes nm-tab-indicator {
  0% {
    width: 0;
    opacity: 0;
  }
  50% {
    width: 28px;
    opacity: 1;
  }
  100% {
    width: 20px;
    opacity: 1;
  }
}

@keyframes nm-tab-panel-fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
