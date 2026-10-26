<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useModal } from '@/composables/useModal'
import { useConfig } from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { generateId } from '@/utils'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

/** @deprecated 旧宽度档位（字符串）——保留仅为兼容映射，新代码请传数字（px） */
export type ModalSize = 'small' | 'medium' | 'large'

export interface NeumorphismModalProps {
  modelValue?: boolean
  title?: string
  /**
   * 对话框宽度（px，直接就是像素值）。默认 560。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）已弃用，仅按
   * small=400 / medium=560 / large=720（px）兼容映射；新代码请传数字。
   */
  size?: number | ModalSize
  closable?: boolean
  maskClosable?: boolean
  showClose?: boolean
  destroyOnClose?: boolean
  footer?: boolean
  closeLabel?: string
  cancelLabel?: string
  confirmLabel?: string
}

const props = withDefaults(defineProps<NeumorphismModalProps>(), {
  modelValue: false,
  // 级联 prop 保持 undefined,由全局配置 modal 段兜底
  closable: undefined,
  maskClosable: undefined,
  showClose: undefined,
  destroyOnClose: undefined,
  footer: true,
})

const { t } = useLocale()

const config = useConfig()
/** 旧字符串档位 → px 宽度（与 `--nm-modal-max-width-*` 的值一致；已弃用） */
const LEGACY_MAX_WIDTH: Record<ModalSize, number> = { small: 400, medium: 560, large: 720 }
const DEFAULT_MAX_WIDTH = 560

/**
 * 对话框最大宽度（px）：`prop` → 全局配置 `modal.size` → 560。
 *
 * 容错：非有限数退回默认；下限 240px（再窄标题栏会挤）。
 */
const resolvedMaxWidth = computed(() => {
  const raw = props.size ?? config.value.modal?.size ?? DEFAULT_MAX_WIDTH
  const px = typeof raw === 'number' ? raw : LEGACY_MAX_WIDTH[raw as ModalSize]
  if (!Number.isFinite(px)) return DEFAULT_MAX_WIDTH
  return Math.max(240, px)
})

/** 宽度直接写成内联 max-width：档位时代是三个 class，多个数字就退化成「一次测量」 */
const dialogStyle = computed(() => ({ maxWidth: `${resolvedMaxWidth.value}px` }))
const resolvedClosable = computed(() => props.closable ?? config.value.modal?.closable ?? true)
const resolvedMaskClosable = computed(
  () => props.maskClosable ?? config.value.modal?.maskClosable ?? true
)
const resolvedShowClose = computed(() => props.showClose ?? config.value.modal?.showClose ?? true)
const resolvedDestroyOnClose = computed(
  () => props.destroyOnClose ?? config.value.modal?.destroyOnClose ?? false
)
const resolvedCloseLabel = computed(() => props.closeLabel || t('modalClose'))
const resolvedCancelLabel = computed(() => props.cancelLabel || t('modalCancel'))
const resolvedConfirmLabel = computed(() => props.confirmLabel || t('modalConfirm'))

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'close'): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const modelRef = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

// open/close 事件契约：随 v-model 变更联动（此前声明了 emit 却从未触发）。
watch(
  () => props.modelValue,
  (val, old) => {
    if (val === old) return
    if (val) {
      emit('open')
    } else {
      emit('close')
    }
  }
)

// Use headless modal composable for all behavioral logic
const {
  visible,
  rendered,
  close,
  confirm,
  handleKeydown: onKeydown,
  focusDialog,
  overlayZIndex,
} = useModal({
  modelValue: modelRef,
  maskClosable: resolvedMaskClosable,
  closable: resolvedClosable,
  destroyOnClose: resolvedDestroyOnClose,
})

const dialogRef = ref<HTMLDivElement>()
const titleId = `nm-modal-title-${generateId()}`
const contentId = `nm-modal-content-${generateId()}`

// Auto-focus when modal becomes visible
watch(visible, async v => {
  if (v) {
    await nextTick()
    focusDialog(dialogRef.value)
  }
})

function handleMaskClick() {
  if (resolvedMaskClosable.value && resolvedClosable.value) {
    close()
    emit('cancel')
  }
}

function handleClose() {
  close()
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
  confirm()
}

function handleKeydown(event: KeyboardEvent) {
  onKeydown(event, dialogRef.value)
}

const classList = computed(() => ['nm-modal'])
</script>

<template>
  <teleport to="body">
    <transition name="nm-modal-fade">
      <div
        v-if="rendered"
        class="nm-modal__mask"
        :class="{ 'nm-modal__mask--visible': visible }"
        :style="{ zIndex: overlayZIndex }"
        @click.self="handleMaskClick"
      >
        <transition name="nm-modal-scale">
          <div
            v-if="visible"
            ref="dialogRef"
            :class="classList"
            :style="dialogStyle"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? titleId : undefined"
            :aria-label="!title ? 'Dialog' : undefined"
            :aria-describedby="contentId"
            tabindex="-1"
            @keydown="handleKeydown"
          >
            <div class="nm-modal__header">
              <h2 v-if="title" :id="titleId" class="nm-modal__title">{{ title }}</h2>
              <slot name="header" />
              <button
                v-if="resolvedShowClose && resolvedClosable"
                class="nm-modal__close"
                :aria-label="resolvedCloseLabel"
                type="button"
                @click="handleClose"
              >
                <NeumorphismIcon name="close" size="lg" />
              </button>
            </div>

            <div :id="contentId" class="nm-modal__body">
              <slot />
            </div>

            <div v-if="footer" class="nm-modal__footer">
              <slot name="footer">
                <button
                  class="nm-modal__btn nm-modal__btn--cancel"
                  type="button"
                  @click="handleClose"
                >
                  {{ resolvedCancelLabel }}
                </button>
                <button
                  class="nm-modal__btn nm-modal__btn--confirm"
                  type="button"
                  @click="handleConfirm"
                >
                  {{ resolvedConfirmLabel }}
                </button>
              </slot>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-modal__mask {
  position: fixed;
  inset: 0;
  z-index: var(--nm-z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--nm-mask-bg);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  // 遮罩铺满视口，但居中容器要避开刘海与 Home 指示条：
  // 85vh 在 iPhone 上可能正好把弹窗底边送进 Home 区。
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--nm-transition-fast);

  &--visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.nm-modal {
  position: relative;
  width: 100%;
  // 85dvh：iOS 地址栏收放时 vh 取大概率值，弹窗底部会被 URL 栏遮住；
  // dvh 跟随可视高度（旧浏览器回落到上面的 vh）。
  max-height: 85vh;
  max-height: 85dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-lg);
  @include nm-raised(8px, 20px);
  @include nm-theme-transition;
  outline: none;
}

.nm-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--nm-modal-header-padding);
  flex-shrink: 0;
}

.nm-modal__title {
  margin: 0;
  font-size: var(--nm-modal-title-font);
  font-weight: 600;
  color: var(--nm-text-primary);
}

.nm-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--nm-spacing-xl);
  height: var(--nm-spacing-xl);
  border: none;
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  color: var(--nm-text-secondary);
  background: none;
  @include nm-raised(2px, 4px);
  transition: all var(--nm-transition-fast);

  // 触屏：32×32 → 44×44 命中热区（视觉不变）
  @include nm-touch-target;

  @media (hover: hover) {
    &:hover {
      @include nm-inset(2px, 4px);
      color: var(--nm-text-primary);
    }
  }

  &:active {
    @include nm-inset(3px, 6px);
    color: var(--nm-text-primary);
  }

  @include nm-focus-ring;
}

.nm-modal__body {
  padding: var(--nm-modal-padding);
  overflow-y: auto;
  // 滚到底不把滚动链传给背景页（iOS 上 body overscroll 会「橡皮筋穿透」）
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  color: var(--nm-text-primary);
  font-size: var(--nm-font-base);
  line-height: 1.6;
}

.nm-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-modal-footer-padding);
  flex-shrink: 0;
}

.nm-modal__btn {
  padding: var(--nm-modal-btn-padding-y) var(--nm-modal-btn-padding-x);
  border: none;
  border-radius: var(--nm-border-radius-md);
  font-size: var(--nm-font-base);
  font-weight: 500;
  cursor: pointer;
  @include nm-raised(2px, 6px);
  transition:
    box-shadow 0.3s $nm-ease-spring,
    transform 0.3s $nm-ease-spring,
    background-color 0.25s $nm-ease-ambient,
    filter 0.25s $nm-ease-ambient;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow:
        4px 4px 10px var(--nm-shadow-dark),
        -2px -2px 6px var(--nm-shadow-light);
    }
  }

  &:active:not(:disabled) {
    @include nm-inset(2px, 4px);
    transform: translateY(0);
    transition:
      box-shadow 0.1s $nm-ease-compress,
      transform 0.1s $nm-ease-compress;
  }

  @include nm-focus-ring;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--cancel {
    background-color: var(--nm-surface-color);
    color: var(--nm-text-secondary);
  }

  &--confirm {
    background-color: var(--nm-primary-color);
    color: var(--nm-text-on-primary);
    box-shadow:
      2px 2px 6px color-mix(in srgb, var(--nm-primary-color) 30%, transparent),
      -2px -2px 6px var(--nm-shadow-light);
  }
}

// Transitions — enhanced with spring physics and backdrop blur progression
.nm-modal-fade-enter-active {
  transition:
    opacity 0.35s $nm-ease-decelerate,
    backdrop-filter 0.35s $nm-ease-decelerate;
}
.nm-modal-fade-leave-active {
  transition:
    opacity 0.2s $nm-ease-accelerate,
    backdrop-filter 0.2s $nm-ease-accelerate;
}
.nm-modal-fade-enter-from,
.nm-modal-fade-leave-to {
  opacity: 0;
}

.nm-modal-scale-enter-active {
  transition:
    transform 0.4s $nm-ease-spring,
    opacity 0.3s $nm-ease-decelerate;
}
.nm-modal-scale-leave-active {
  transition:
    transform 0.2s $nm-ease-accelerate,
    opacity 0.15s $nm-ease-accelerate;
}
.nm-modal-scale-enter-from {
  transform: scale(0.88) translateY(12px);
  opacity: 0;
}
.nm-modal-scale-leave-to {
  transform: scale(0.92) translateY(-4px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .nm-modal-fade-enter-active,
  .nm-modal-fade-leave-active,
  .nm-modal-scale-enter-active,
  .nm-modal-scale-leave-active {
    transition: none;
  }
}
</style>
