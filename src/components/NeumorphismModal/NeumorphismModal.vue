<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

export interface NeumorphismModalProps {
  modelValue?: boolean
  title?: string
  size?: 'small' | 'medium' | 'large'
  closable?: boolean
  maskClosable?: boolean
  showClose?: boolean
  destroyOnClose?: boolean
  footer?: boolean
}

const props = withDefaults(defineProps<NeumorphismModalProps>(), {
  modelValue: false,
  size: 'medium',
  closable: true,
  maskClosable: true,
  showClose: true,
  destroyOnClose: false,
  footer: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'close'): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = ref(props.modelValue)
const rendered = ref(props.modelValue)
const dialogRef = ref<HTMLDivElement>()
const previousActiveElement = ref<HTMLElement>()

watch(() => props.modelValue, (val) => {
  if (val) {
    rendered.value = true
    previousActiveElement.value = document.activeElement as HTMLElement
    nextTick(() => {
      visible.value = true
      dialogRef.value?.focus()
    })
    emit('open')
  } else {
    visible.value = false
    if (props.destroyOnClose) {
      setTimeout(() => { rendered.value = false }, 200)
    }
    previousActiveElement.value?.focus()
    emit('close')
  }
})

const classList = computed(() => [
  'nm-modal',
  `nm-modal--${props.size}`,
])

function handleMaskClick() {
  if (props.maskClosable && props.closable) {
    close()
  }
}

function close() {
  if (!props.closable) return
  emit('update:modelValue', false)
  emit('cancel')
}

function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.closable) {
    close()
    return
  }
  if (event.key === 'Tab') {
    const dialog = dialogRef.value
    if (!dialog) return
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [contenteditable]:not([contenteditable="false"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === first) { event.preventDefault(); last?.focus() }
    } else {
      if (document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
  }
}

onMounted(() => {
  if (props.modelValue) {
    rendered.value = true
    nextTick(() => { visible.value = true; dialogRef.value?.focus() })
  }
})

onBeforeUnmount(() => {
  if (visible.value) {
    previousActiveElement.value?.focus()
  }
})
</script>

<template>
  <teleport to="body">
    <transition name="nm-modal-fade">
      <div v-if="rendered" class="nm-modal__mask" :class="{ 'nm-modal__mask--visible': visible }" @click.self="handleMaskClick">
        <transition name="nm-modal-scale">
          <div
            v-if="visible"
            ref="dialogRef"
            :class="classList"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? 'nm-modal-title' : undefined"
            tabindex="-1"
            @keydown="handleKeydown"
          >
            <div class="nm-modal__header">
              <h2 v-if="title" id="nm-modal-title" class="nm-modal__title">{{ title }}</h2>
              <slot name="header" />
              <button
                v-if="showClose && closable"
                class="nm-modal__close"
                @click="close"
                :aria-label="'关闭'"
                type="button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="nm-modal__body">
              <slot />
            </div>

            <div v-if="footer" class="nm-modal__footer">
              <slot name="footer">
                <button class="nm-modal__btn nm-modal__btn--cancel" type="button" @click="close">取消</button>
                <button class="nm-modal__btn nm-modal__btn--confirm" type="button" @click="confirm">确认</button>
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

  &--small  { max-width: 400px; }
  &--medium { max-width: 560px; }
  &--large  { max-width: 720px; }
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
  transition: all var(--nm-transition-fast);

  &:active {
    @include nm-inset(2px, 4px);
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

// Transitions
.nm-modal-fade-enter-active { transition: opacity 0.25s ease; }
.nm-modal-fade-leave-active { transition: opacity 0.2s ease; }
.nm-modal-fade-enter-from,
.nm-modal-fade-leave-to { opacity: 0; }

.nm-modal-scale-enter-active { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease; }
.nm-modal-scale-leave-active { transition: transform 0.2s ease, opacity 0.15s ease; }
.nm-modal-scale-enter-from { transform: scale(0.92); opacity: 0; }
.nm-modal-scale-leave-to { transform: scale(0.92); opacity: 0; }
</style>
