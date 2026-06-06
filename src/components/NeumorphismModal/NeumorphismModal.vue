<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useModal } from '@/composables/useModal'
import { useConfig } from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { generateId } from '@/utils'

export interface NeumorphismModalProps {
  modelValue?: boolean
  title?: string
  size?: 'small' | 'medium' | 'large'
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
  size: 'medium',
  closable: true,
  maskClosable: true,
  showClose: true,
  destroyOnClose: false,
  footer: true,
  closeLabel: '关闭',
  cancelLabel: '取消',
  confirmLabel: '确认',
})

const { t } = useLocale()

const config = useConfig()
const resolvedSize = computed(() => props.size ?? config.value.modal?.size ?? 'medium')
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

// Use headless modal composable for all behavioral logic
const {
  visible,
  rendered,
  close,
  confirm,
  handleKeydown: onKeydown,
  focusDialog,
} = useModal({
  modelValue: modelRef,
  maskClosable: computed(() => props.maskClosable),
  closable: computed(() => props.closable),
  destroyOnClose: computed(() => props.destroyOnClose),
})

const dialogRef = ref<HTMLDivElement>()
const titleId = `nm-modal-title-${generateId()}`

// Auto-focus when modal becomes visible
watch(visible, async v => {
  if (v) {
    await nextTick()
    focusDialog(dialogRef.value)
  }
})

function handleMaskClick() {
  if (props.maskClosable && props.closable) {
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

const classList = computed(() => ['nm-modal', `nm-modal--${resolvedSize.value}`])
</script>

<template>
  <teleport to="body">
    <transition name="nm-modal-fade">
      <div
        v-if="rendered"
        class="nm-modal__mask"
        :class="{ 'nm-modal__mask--visible': visible }"
        @click.self="handleMaskClick"
      >
        <transition name="nm-modal-scale">
          <div
            v-if="visible"
            ref="dialogRef"
            :class="classList"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? titleId : undefined"
            tabindex="-1"
            @keydown="handleKeydown"
          >
            <div class="nm-modal__header">
              <h2 v-if="title" :id="titleId" class="nm-modal__title">{{ title }}</h2>
              <slot name="header" />
              <button
                v-if="showClose && closable"
                class="nm-modal__close"
                :aria-label="resolvedCloseLabel"
                type="button"
                @click="handleClose"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="nm-modal__body">
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
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
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
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-lg);
  @include nm-raised(8px, 20px);
  @include nm-theme-transition;
  outline: none;

  &--small {
    max-width: 400px;
  }
  &--medium {
    max-width: 560px;
  }
  &--large {
    max-width: 720px;
  }
}

.nm-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  flex-shrink: 0;
}

.nm-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--nm-text-primary);
}

.nm-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  color: var(--nm-text-secondary);
  background: none;
  @include nm-raised(2px, 4px);
  transition: all var(--nm-transition-fast);

  &:hover {
    @include nm-inset(2px, 4px);
    color: var(--nm-text-primary);
  }
}

.nm-modal__body {
  padding: 24px;
  overflow-y: auto;
  color: var(--nm-text-primary);
  font-size: 14px;
  line-height: 1.6;
}

.nm-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 24px 20px;
  flex-shrink: 0;
}

.nm-modal__btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--nm-border-radius-md);
  font-size: 14px;
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

  &--cancel {
    background-color: var(--nm-surface-color);
    color: var(--nm-text-secondary);
  }

  &--confirm {
    background-color: var(--nm-primary-color);
    color: #fff;
    box-shadow:
      2px 2px 6px rgba(108, 122, 224, 0.3),
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
