<script setup lang="ts">
import { computed } from 'vue'
import NeumorphismTag from '@/components/NeumorphismTag/NeumorphismTag.vue'
import NeumorphismSpinner from '@/components/NeumorphismSpinner/NeumorphismSpinner.vue'
import { useLocale } from '@/composables/useLocale'
import ChatFold from './ChatFold.vue'
import ChatCopyButton from './ChatCopyButton.vue'
import type { ChatToolStatus } from './types'

export interface ChatToolCallBlockProps {
  /** 工具名 */
  name: string
  /** 已摘要化的参数文本 */
  input?: string
  /** 工具输出 */
  output?: string | null
  status?: ChatToolStatus
  /** 已格式化的时间文本 */
  time?: string
}

const props = withDefaults(defineProps<ChatToolCallBlockProps>(), {
  input: '',
  output: null,
  status: undefined,
  time: '',
})

const { t } = useLocale()

const inputText = computed(() => props.input ?? '')
const outputText = computed(() => props.output ?? '')
const totalChars = computed(() => inputText.value.length + outputText.value.length)

const statusLabel = computed(() => {
  if (props.status === 'running') return t('chatToolRunning')
  if (props.status === 'succeeded') return t('chatToolSucceeded')
  if (props.status === 'failed') return t('chatToolFailed')
  return ''
})

const statusVariant = computed(() => {
  if (props.status === 'succeeded') return 'success' as const
  if (props.status === 'failed') return 'error' as const
  return 'info' as const
})
</script>

<template>
  <ChatFold :expandable="totalChars > 0" class="nm-chat-tool">
    <template #head="{ open }">
      <NeumorphismTag size="small" variant="info">{{ t('chatRoleTool') }}</NeumorphismTag>
      <span class="nm-chat-tool__name">{{ name }}</span>
      <NeumorphismSpinner v-if="status === 'running'" size="small" />
      <span v-if="time" class="nm-chat-tool__time">{{ time }}</span>
      <NeumorphismTag v-if="status" size="small" :variant="statusVariant">
        {{ statusLabel }}
      </NeumorphismTag>
      <span v-if="totalChars > 0" class="nm-chat-tool__detail-hint">
        {{ open ? t('chatToolCollapse') : t('chatToolDetails', { count: totalChars }) }}
      </span>
    </template>
    <template #actions>
      <ChatCopyButton v-if="outputText" :text="outputText" />
    </template>
    <pre v-if="inputText" class="nm-chat-tool__pre nm-chat-tool__pre--input">{{ inputText }}</pre>
    <pre v-if="outputText" class="nm-chat-tool__pre nm-chat-tool__pre--output">{{
      outputText
    }}</pre>
  </ChatFold>
</template>

<style scoped lang="scss">
.nm-chat-tool__name {
  font-family: var(--nm-font-mono);
  font-size: var(--nm-font-md);
  color: var(--nm-text-primary);
  font-weight: 600;
}

.nm-chat-tool__time {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-disabled);
}

.nm-chat-tool__detail-hint {
  font-size: var(--nm-font-sm);
  color: var(--nm-text-placeholder);
  transition: color 0.2s ease;

  :hover > & {
    color: var(--nm-text-primary);
  }
}

.nm-chat-tool__pre {
  margin: var(--nm-spacing-sm) 0 0;
  padding: var(--nm-spacing-sm);
  border-radius: var(--nm-border-radius-sm);
  background-color: var(--nm-surface-color);
  font-family: var(--nm-font-mono);
  font-size: var(--nm-font-sm);
  line-height: 1.55;
  color: var(--nm-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  max-height: 320px;
  overflow-y: auto;
}

.nm-chat-tool__pre--output {
  color: var(--nm-text-primary);
}

@media (prefers-reduced-motion: reduce) {
  .nm-chat-tool__detail-hint {
    transition: none;
  }
}
</style>
