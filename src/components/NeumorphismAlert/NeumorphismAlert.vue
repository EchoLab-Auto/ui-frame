<script setup lang="ts">
import { computed, watch } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useAlert, type AlertType } from '@/composables/useAlert'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { ALERT_SCALE } from '@/utils/controlScales'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

export type { AlertType }

export type AlertSize = 'small' | 'medium' | 'large'

export interface NeumorphismAlertProps {
  type?: AlertType
  title?: string
  message?: string
  closable?: boolean
  duration?: number
  icon?: boolean
  bordered?: boolean
  /**
   * 尺寸——px 正文字号（数字，主几何量），或三档预设名。
   *
   * 数字即「正文字号」：标题字号与四周内距按三锚点（12 / 13 / 14）分段线性插值，
   * 所以 `:size="13"` 与 `size="medium"` 逐像素相同，`:size="12.5"` 落在两者之间。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | AlertSize
  /** Accessible label for the close button */
  closeLabel?: string
}

const props = withDefaults(defineProps<NeumorphismAlertProps>(), {
  bordered: undefined,
  closable: undefined,
  icon: undefined,
  title: '',
  message: '',
  closeLabel: '',
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { config, resolveProp } = useNeumorphismSetup()

const resolvedType = computed(() =>
  resolveProp(props.type, config.value.alert?.type, 'info' as AlertType)
)
const resolvedClosable = computed(() =>
  resolveProp(props.closable, config.value.alert?.closable, true)
)
const resolvedDuration = computed(() =>
  resolveProp(props.duration, config.value.alert?.duration, 0)
)
const resolvedIcon = computed(() => resolveProp(props.icon, config.value.alert?.icon, true))
const resolvedBordered = computed(() =>
  resolveProp(props.bordered, config.value.alert?.bordered, true)
)
/**
 * 数字尺寸的语义是「正文字号」，默认值取 medium 锚点。
 *
 * 0 / 负数 / NaN 回落到这里：正文字号 0 等于内容不可读，负内距则会写出无效声明。
 */
const DEFAULT_SIZE_PX = 13

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() => {
  const raw = props.size ?? config.value.alert?.size
  return typeof raw === 'number' ? normalizeNumericSize(raw, DEFAULT_SIZE_PX) : undefined
})

/** 字符串通道：只认档位别名（显式传数字时它不参与渲染） */
const resolvedSize = computed<AlertSize>(() => {
  const raw = props.size ?? config.value.alert?.size
  return typeof raw === 'string' ? raw : 'medium'
})

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(ALERT_SCALE, numericSize.value)
)

const { t } = useLocale()
const resolvedCloseLabel = computed(() => props.closeLabel || t('alertClose'))

// Headless alert state management
const { isVisible, close, leaving } = useAlert({
  duration: resolvedDuration.value,
})

// Re-create the alert composable if duration changes via config
watch(resolvedDuration, newDuration => {
  // The composable auto-close is set at creation time only.
  // For prop/ config reactivity on duration, the parent should
  // re-mount the alert. This watcher provides a best-effort
  // reactive path: if the alert is still visible and duration
  // increases from 0 to >0, schedule a new close.
  if (isVisible.value && !leaving.value && newDuration > 0) {
    setTimeout(() => close(), newDuration)
  }
})

function handleClose() {
  close()
  // Emit after the leave animation completes so the parent can
  // remove the alert DOM node or respond once fully hidden.
  setTimeout(() => {
    emit('close')
  }, 300)
}

const classList = computed(() => [
  'nm-alert',
  `nm-alert--${resolvedType.value}`,
  numericSize.value === undefined ? `nm-alert--${resolvedSize.value}` : 'nm-alert--sized',
  {
    'nm-alert--bordered': resolvedBordered.value,
    'nm-alert--leaving': leaving.value,
    'nm-alert--hidden': !isVisible.value,
  },
])

/** Alert 类型 → 语义图标（几何在 icons 注册表，与 Toast 共用同一套）。 */
const ALERT_ICON: Record<AlertType, 'circle-info' | 'check' | 'warning' | 'circle-close'> = {
  info: 'circle-info',
  success: 'check',
  warning: 'warning',
  error: 'circle-close',
}
</script>

<template>
  <transition name="nm-alert-fade">
    <div
      v-if="isVisible"
      :class="classList"
      :style="sizeStyle"
      role="alert"
      :aria-live="resolvedType === 'error' ? 'assertive' : 'polite'"
    >
      <!-- Icon section -->
      <!-- @slot Custom icon content. Defaults to type-based SVG icon. -->
      <div v-if="resolvedIcon" class="nm-alert__icon" aria-hidden="true">
        <slot name="icon">
          <NeumorphismIcon :name="ALERT_ICON[resolvedType]" size="xl" />
        </slot>
      </div>

      <!-- Content section -->
      <div class="nm-alert__content">
        <!-- @slot Full custom content. Overrides title + message. -->
        <slot>
          <div v-if="title" class="nm-alert__title">{{ title }}</div>
          <div v-if="message" class="nm-alert__message">{{ message }}</div>
        </slot>
      </div>

      <!-- Close button -->
      <button
        v-if="resolvedClosable"
        class="nm-alert__close"
        :aria-label="resolvedCloseLabel"
        type="button"
        @click="handleClose"
      >
        <NeumorphismIcon name="close" size="sm" />
      </button>
    </div>
  </transition>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ==========================================
// Alert box
// ==========================================
.nm-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-alert-padding-y) var(--nm-alert-padding-x);
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(2px, 6px);
  @include nm-theme-transition;
  position: relative;
  overflow: hidden;
  line-height: 1.5;

  // ---- Variants ----
  &--info {
    color: var(--nm-color-info);

    .nm-alert__title,
    .nm-alert__message {
      color: var(--nm-text-primary);
    }

    &.nm-alert--bordered {
      border-left: 3px solid var(--nm-color-info);
    }
  }

  &--success {
    color: var(--nm-color-success);

    .nm-alert__title,
    .nm-alert__message {
      color: var(--nm-text-primary);
    }

    &.nm-alert--bordered {
      border-left: 3px solid var(--nm-color-success);
    }
  }

  &--warning {
    color: var(--nm-color-warning);

    .nm-alert__title,
    .nm-alert__message {
      color: var(--nm-text-primary);
    }

    &.nm-alert--bordered {
      border-left: 3px solid var(--nm-color-warning);
    }
  }

  &--error {
    color: var(--nm-color-error);

    .nm-alert__title,
    .nm-alert__message {
      color: var(--nm-text-primary);
    }

    &.nm-alert--bordered {
      border-left: 3px solid var(--nm-color-error);
    }
  }

  // ---- States ----
  &--hidden {
    display: none;
  }
}

// ==========================================
// Icon
// ==========================================
.nm-alert__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-top: 1px; // optical alignment with text

  svg {
    display: block;
    color: inherit;
  }
}

// ==========================================
// Content
// ==========================================
.nm-alert__content {
  flex: 1;
  min-width: 0;
}

.nm-alert__title {
  font-size: var(--nm-alert-title-font);
  font-weight: 600;
  margin-bottom: var(--nm-alert-title-margin-bottom);
}

.nm-alert__message {
  font-size: var(--nm-alert-font);
}

// ==========================================
// Close button
// ==========================================
.nm-alert__close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: var(--nm-spacing-2xs);
  border: none;
  background: none;
  color: var(--nm-text-placeholder);
  cursor: pointer;
  border-radius: var(--nm-border-radius-xs);
  transition:
    color 0.2s ease,
    transform 0.25s $nm-ease-spring,
    background-color 0.2s ease;

  // 触屏：~18px → 44×44 命中热区（视觉不变）
  @include nm-touch-target;

  @media (hover: hover) {
    &:hover {
      color: var(--nm-text-primary);
      background-color: var(--nm-surface-raised);
      transform: rotate(90deg);
    }
  }

  &:active {
    transform: rotate(90deg) scale(0.85);
  }

  // 内环：Alert 根 overflow:hidden，外环会被裁剪
  @include nm-focus-ring(-2px);
}

// ==========================================
// Sizes
// ==========================================
.nm-alert--small {
  --nm-alert-padding-y: var(--nm-alert-padding-y-sm);
  --nm-alert-padding-x: var(--nm-alert-padding-x-sm);
  --nm-alert-font: var(--nm-alert-font-sm);
  --nm-alert-title-font: var(--nm-alert-title-font-sm);
}

.nm-alert--medium {
  --nm-alert-padding-y: var(--nm-alert-padding-y-md);
  --nm-alert-padding-x: var(--nm-alert-padding-x-md);
  --nm-alert-font: var(--nm-alert-font-md);
  --nm-alert-title-font: var(--nm-alert-title-font-md);
}

.nm-alert--large {
  --nm-alert-padding-y: var(--nm-alert-padding-y-lg);
  --nm-alert-padding-x: var(--nm-alert-padding-x-lg);
  --nm-alert-font: var(--nm-alert-font-lg);
  --nm-alert-title-font: var(--nm-alert-title-font-lg);
}

// 数字尺寸（`:size="13"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 与三档 class 互斥——数字路径不会同时挂档位类，所以不存在覆盖之争。
// 这里只重接上面那组**间接变量**：消费侧（根 padding、`.nm-alert__title/message`
// 的 font-size）仍只认这四个名字，不重复声明，也就不会出现两套来源打架。
.nm-alert--sized {
  --nm-alert-padding-y: var(--nm-alert-sz-pad-y);
  --nm-alert-padding-x: var(--nm-alert-sz-pad-x);
  --nm-alert-font: var(--nm-alert-sz-font);
  --nm-alert-title-font: var(--nm-alert-sz-title-font);
}

// ==========================================
// Transition: nm-alert-fade
// ==========================================
.nm-alert-fade-enter-active {
  transition: all 0.35s $nm-ease-spring;
}

.nm-alert-fade-leave-active {
  transition: all 0.25s $nm-ease-accelerate;
}

.nm-alert-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.nm-alert-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

// ==========================================
// Reduced motion
// ==========================================
@media (prefers-reduced-motion: reduce) {
  .nm-alert {
    transition: none;
  }

  .nm-alert__close {
    transition: none;
  }

  .nm-alert-fade-enter-active,
  .nm-alert-fade-leave-active {
    transition: none;
  }
}
</style>
