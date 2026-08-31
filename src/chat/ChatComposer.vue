<script setup lang="ts">
import { computed } from 'vue'
import NeumorphismTextarea from '@/components/NeumorphismTextarea/NeumorphismTextarea.vue'
import NeumorphismButton from '@/components/NeumorphismButton/NeumorphismButton.vue'
import { useLocale } from '@/composables/useLocale'
import { useChatInput } from '@/composables/useChatInput'

export interface ChatComposerProps {
  /** 输入内容（v-model） */
  modelValue?: string
  /** 禁用态（如未连接），禁止输入与提交 */
  disabled?: boolean
  /** 占位文本（默认取 locale chatInputPlaceholder） */
  placeholder?: string
  /** 是否显示"取消任务"按钮 */
  cancelable?: boolean
  /** 发送按钮文本（默认取 locale chatSend） */
  sendLabel?: string
  /** 取消按钮文本（默认取 locale chatCancel） */
  cancelLabel?: string
  /** 初始行数 */
  rows?: number | string
  /** 随内容自动增高 */
  autoResize?: boolean
  /** 最大输入长度 */
  maxlength?: number | string
}

const props = withDefaults(defineProps<ChatComposerProps>(), {
  modelValue: '',
  disabled: false,
  placeholder: '',
  cancelable: false,
  sendLabel: '',
  cancelLabel: '',
  rows: 3,
  autoResize: true,
  maxlength: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  /** 提交（内容为 trim 后的非空字符串；IME 组合中的 Enter 不会触发） */
  (e: 'send', content: string): void
  /** 点击"取消任务" */
  (e: 'cancel'): void
}>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder || t('chatInputPlaceholder'))
const resolvedSendLabel = computed(() => props.sendLabel || t('chatSend'))
const resolvedCancelLabel = computed(() => props.cancelLabel || t('chatCancel'))

const inputRef = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const { handleKeydown, submit, canSubmit } = useChatInput({
  modelValue: inputRef,
  disabled: computed(() => props.disabled),
  onSubmit: content => emit('send', content),
})
</script>

<template>
  <div class="nm-chat-composer" :class="{ 'nm-chat-composer--disabled': disabled }">
    <div v-if="$slots.meta || cancelable" class="nm-chat-composer__meta">
      <slot name="meta" />
      <NeumorphismButton
        v-if="cancelable"
        class="nm-chat-composer__cancel"
        size="small"
        :disabled="disabled"
        @click="emit('cancel')"
      >
        {{ resolvedCancelLabel }}
      </NeumorphismButton>
    </div>
    <div class="nm-chat-composer__row">
      <NeumorphismTextarea
        class="nm-chat-composer__field"
        :model-value="modelValue"
        :placeholder="resolvedPlaceholder"
        :disabled="disabled"
        :rows="rows"
        :auto-resize="autoResize"
        :maxlength="maxlength"
        @update:model-value="emit('update:modelValue', $event)"
        @keydown="handleKeydown"
      />
      <!-- actions 插槽可整体替换默认发送按钮 -->
      <slot name="actions" :submit="submit" :can-submit="canSubmit">
        <NeumorphismButton
          class="nm-chat-composer__send"
          variant="raised"
          shape="pill"
          :disabled="disabled || !canSubmit"
          @click="submit"
        >
          {{ resolvedSendLabel }}
        </NeumorphismButton>
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-chat-composer {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-xs);
  padding: 10px var(--nm-spacing-md) var(--nm-spacing-md);
}

.nm-chat-composer__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--nm-spacing-sm);
  min-height: 22px;
  font-size: var(--nm-font-xs);
  color: var(--nm-text-placeholder);
}

.nm-chat-composer__cancel {
  margin-left: auto;
}

.nm-chat-composer__row {
  display: flex;
  align-items: flex-end;
  gap: var(--nm-spacing-sm);
}

.nm-chat-composer__field {
  flex: 1;
  min-width: 0;
}

// 发送按钮：主色胶囊 —— 会话区唯一的强视觉焦点
// （与 .nm-button 同元素，用双类名提升特异性压过组件自身的 variant 背景）
.nm-chat-composer__send.nm-button {
  flex-shrink: 0;
  background-color: var(--nm-primary-color);
  color: var(--nm-text-on-primary);
  font-weight: 600;

  &:disabled {
    background-color: var(--nm-surface-color);
    color: var(--nm-text-disabled);
    font-weight: 400;
  }
}
</style>
