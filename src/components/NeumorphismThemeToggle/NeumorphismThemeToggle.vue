<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { THEME_TOGGLE_SCALE } from '@/utils/controlScales'
import type { Theme } from '@/composables/useTheme'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

export type ThemeToggleSize = 'small' | 'medium' | 'large'

export interface NeumorphismThemeToggleProps {
  /** v-model binding: 'light' | 'dark' | 'auto' */
  modelValue?: Theme
  /**
   * 尺寸——内层按钮的上下内距 px（数字，主几何量），或三档预设名。
   *
   * 数字即「按钮上下内距」：图标、左右内距、外层内距按锚点表（5 / 6 / 8）
   * 分段线性插值，尺寸施加在内部 `.nm-theme-toggle__btn` / `__icon` 上。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | ThemeToggleSize
  /** Whether to disable auto mode option */
  disableAuto?: boolean
  /** Whether the toggle is disabled */
  disabled?: boolean
}

const props = withDefaults(defineProps<NeumorphismThemeToggleProps>(), {
  disableAuto: undefined,
  modelValue: 'auto',
  disabled: false,
})

const { config, resolveProp } = useNeumorphismSetup()

/** 尺寸原始取值：显式 prop > 全局配置 `themeToggle.size` > 档位默认 medium */
const rawSize = computed<number | ThemeToggleSize>(() =>
  resolveProp(props.size, config.value.themeToggle?.size, 'medium' as number | ThemeToggleSize)
)

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() =>
  typeof rawSize.value === 'number'
    ? normalizeNumericSize(rawSize.value, THEME_TOGGLE_SCALE.primary.md)
    : undefined
)

/** 字符串通道：数字路径下不挂档位类，这里只用于档位类名与语义兜底 */
const resolvedSize = computed<ThemeToggleSize>(() =>
  typeof rawSize.value === 'string' ? rawSize.value : 'medium'
)

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined
    ? undefined
    : resolveControlScale(THEME_TOGGLE_SCALE, numericSize.value)
)

/**
 * 是否显示文字标签——**结构性差异，不能只靠 CSS 抹平**。
 *
 * 小档（5px 内距）藏标签，是因为三个「图标 + 文字」按钮并排会撑爆一条工具栏；
 * 这不是视觉效果而是布局结构（少渲染一个 span），所以必须在 JS 里判定。
 *
 * 数字路径的判据：上下内距 < medium 锚点（6px）等价于小档。
 * 取锚点而不是硬编码 6，是为了让 `:size="6"` ≡ `medium`、`:size="5"` ≡ `small`
 * 在结构上也一致（内距 = 6 时按 medium 展开标签）。代价是「5 < x < 6」这类
 * 落在小档与中档之间的尺寸也会展开标签——这与插值后的内距同向（内距越接近 6，
 * 越放得下文字），比「数字路径一律显示标签」更贴合几何。
 */
const showLabel = computed(() =>
  numericSize.value === undefined
    ? resolvedSize.value !== 'small'
    : numericSize.value >= THEME_TOGGLE_SCALE.primary.md
)
const resolvedDisableAuto = computed(() =>
  resolveProp(props.disableAuto, config.value.themeToggle?.disableAuto, false)
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: Theme): void
  (e: 'change', value: Theme): void
}>()

const { t } = useLocale()

const options = computed<{ value: Theme; label: string }[]>(() => {
  const items = [
    { value: 'light' as Theme, label: t('themeToggleLight') },
    { value: 'auto' as Theme, label: t('themeToggleAuto') },
    { value: 'dark' as Theme, label: t('themeToggleDark') },
  ]
  if (resolvedDisableAuto.value) {
    return items.filter(i => i.value !== 'auto')
  }
  return items
})

const themeContext = useTheme()

// Sync external modelValue changes to the global theme system
watch(
  () => props.modelValue,
  value => {
    if (value !== themeContext.theme.value) {
      themeContext.setTheme(value)
    }
  },
  { immediate: true }
)

const classList = computed(() => [
  'nm-theme-toggle',
  // 数字与档位类互斥：几何全由内联 `--nm-theme-toggle-sz-*` 决定
  numericSize.value === undefined
    ? `nm-theme-toggle--${resolvedSize.value}`
    : 'nm-theme-toggle--sized',
  {
    'nm-theme-toggle--disabled': props.disabled,
  },
])

function selectTheme(value: Theme) {
  if (props.disabled) return
  if (value === props.modelValue) return
  themeContext.setTheme(value)
  emit('update:modelValue', value)
  emit('change', value)
}

/**
 * 图标尺寸档（§8 枚举）：small → 14；medium/large → 18。
 * 三态同档，保证并排按钮视觉大小一致（此前激活态 scale(1.1) 让其一档独大）。
 *
 * 数字路径沿用 `lg` 的 SVG 属性：实际渲染宽度由 `--sized` 规则里的
 * `--nm-theme-toggle-sz-icon` 覆盖（CSS 属性优先于 svg 的 width/height 属性），
 * 而线宽 2px 在 14~18px 区间内本就不变，所以不需要再算一份图标档。
 */
const iconSize = computed<'sm' | 'lg'>(() => (resolvedSize.value === 'small' ? 'sm' : 'lg'))

/** 主题选项 → 语义图标（三态统一线框，2026-10）。 */
const THEME_ICON: Record<string, 'sun' | 'monitor' | 'moon'> = {
  light: 'sun',
  auto: 'monitor',
  dark: 'moon',
}

function themeIconName(value: string) {
  return THEME_ICON[value] ?? 'monitor'
}
</script>

<template>
  <div :class="classList" :style="sizeStyle" role="radiogroup" :aria-label="t('themeToggleLabel')">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="nm-theme-toggle__btn"
      :class="{
        'nm-theme-toggle__btn--active': modelValue === opt.value,
      }"
      :aria-pressed="modelValue === opt.value"
      :disabled="disabled"
      @click="selectTheme(opt.value)"
    >
      <!-- 三态图标统一为线框（2026-10）：sun / monitor / moon 全部 stroke 风格，
           此前 light 是"实心圆+线框射线"、dark 是"纯实心块"，切换主题时
           实心↔线框跳变。尺寸与线宽由 NeumorphismIcon 按档自动处理。 -->
      <NeumorphismIcon
        :name="themeIconName(opt.value)"
        :size="iconSize"
        class="nm-theme-toggle__icon"
      />

      <span v-if="showLabel" class="nm-theme-toggle__label">{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-theme-toggle {
  display: inline-flex;
  align-items: center;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-full);
  padding: 3px;
  @include nm-inset-strong(3px, 6px);
  @include nm-theme-transition;
  user-select: none;
  gap: var(--nm-spacing-2xs);

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nm-theme-toggle__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-6);
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--nm-text-placeholder);
  border-radius: var(--nm-border-radius-full);
  transition:
    background-color 0.35s $nm-ease-spring,
    box-shadow 0.35s $nm-ease-spring,
    color 0.3s $nm-ease-ambient,
    transform 0.25s $nm-ease-spring;
  white-space: nowrap;
  position: relative;
  overflow: hidden;

  &:disabled {
    cursor: not-allowed;
  }

  @media (hover: hover) {
    &:hover:not(:disabled):not(.nm-theme-toggle__btn--active) {
      color: var(--nm-text-secondary);
      background-color: color-mix(in srgb, var(--nm-border-subtle) 60%, transparent);
      transform: translateY(-1px);
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
    transition: transform 0.1s $nm-ease-compress;
  }

  @include nm-focus-ring;

  &--active {
    color: var(--nm-primary-color);
    @include nm-raised-strong(2px, 4px);
    background-color: var(--nm-surface-raised);
    animation: nm-theme-toggle-activate 0.4s $nm-ease-bounce;
  }
}

// Ripple effect on active state
.nm-theme-toggle__btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--nm-primary-color) 10%, transparent) 0%,
    transparent 70%
  );
  opacity: 0;
  transform: scale(0);
  transition: none;
}

.nm-theme-toggle__btn--active::after {
  animation: nm-theme-toggle-ripple 0.5s $nm-ease-decelerate;
}

.nm-theme-toggle__icon {
  width: var(--nm-icon-size-md);
  height: var(--nm-icon-size-md);
  flex-shrink: 0;
  transition: transform 0.35s $nm-ease-spring;
}

.nm-theme-toggle__btn--active .nm-theme-toggle__icon {
  /* 只旋转、不缩放（2026-10 修复）：scale(1.1) 让 14px 图标实测渲染 18.86px，
     脱离 §8 枚举档且比相邻按钮明显更大更粗。旋转 15° 保留"激活"的可感知差异。 */
  transform: rotate(15deg);
}

.nm-theme-toggle__label {
  font-size: var(--nm-font-sm);
  font-weight: 500;
}

// ---------- Size variants ----------

.nm-theme-toggle--small {
  padding: var(--nm-spacing-2xs);

  .nm-theme-toggle__btn {
    padding: 5px var(--nm-spacing-sm);
  }

  .nm-theme-toggle__icon {
    width: var(--nm-icon-size-sm);
    height: var(--nm-icon-size-sm);
  }
}

.nm-theme-toggle--medium {
  padding: 3px;

  .nm-theme-toggle__btn {
    padding: var(--nm-spacing-6) var(--nm-spacing-12);
  }
}

.nm-theme-toggle--large {
  padding: var(--nm-spacing-xs);

  .nm-theme-toggle__btn {
    padding: var(--nm-spacing-sm) var(--nm-spacing-md);
    gap: var(--nm-spacing-sm);
  }

  .nm-theme-toggle__icon {
    width: var(--nm-icon-size-lg);
    height: var(--nm-icon-size-lg);
  }

  .nm-theme-toggle__label {
    font-size: var(--nm-font-base);
  }
}

// ---------- 数字尺寸（`:size="9"`）----------
// 尺寸施加在**内部**按钮 / 图标 / 标签上：变量挂根节点（内联下发），子选择器消费。
// 注意规则必须排在三档 class 之后——`padding` 与基础 `.nm-theme-toggle` 同为
// 单类选择器（0,1,0），靠顺序取胜。
.nm-theme-toggle--sized {
  padding: var(--nm-theme-toggle-sz-pad);

  .nm-theme-toggle__btn {
    padding: var(--nm-theme-toggle-sz-btn-pad-y) var(--nm-theme-toggle-sz-btn-pad-x);
  }

  .nm-theme-toggle__icon {
    // CSS 属性覆盖 svg 的 width/height 属性，所以图标档不必再算一份
    width: var(--nm-theme-toggle-sz-icon);
    height: var(--nm-theme-toggle-sz-icon);
  }

  .nm-theme-toggle__label {
    font-size: var(--nm-theme-toggle-sz-font);
  }
}

@keyframes nm-theme-toggle-activate {
  0% {
    transform: scale(0.92);
  }
  60% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes nm-theme-toggle-ripple {
  0% {
    opacity: 0.4;
    transform: scale(0);
  }
  100% {
    opacity: 0;
    transform: scale(2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-theme-toggle__btn {
    transition: none;
  }
  .nm-theme-toggle__btn--active {
    animation: none;
  }
  .nm-theme-toggle__btn--active::after {
    animation: none;
  }
  .nm-theme-toggle__icon {
    transition: none;
  }
}
</style>
