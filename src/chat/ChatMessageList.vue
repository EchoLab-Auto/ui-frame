<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import ChatTray from './ChatTray.vue'
import ChatMessageItem from './ChatMessageItem.vue'
import type { ChatMessage } from './types'

export interface ChatMessageListProps {
  /** 消息列表（按时间升序） */
  messages: ChatMessage[]
  /** Agent 消息正文是否按 Markdown 渲染 */
  markdown?: boolean
  /** 新内容到达时是否自动吸底（仅当用户本就在底部才跟随） */
  autoScroll?: boolean
  /** 距底部多少 px 内视为贴底 */
  scrollThreshold?: number
  /** 空消息时的提示文本（默认取 locale chatEmpty） */
  emptyText?: string
  /** 自定义时间格式化（入参为秒级 Unix 时间戳） */
  formatTime?: (time: number) => string
}

const props = withDefaults(defineProps<ChatMessageListProps>(), {
  markdown: undefined,
  autoScroll: undefined,
  scrollThreshold: undefined,
  emptyText: '',
  formatTime: undefined,
})

const { t } = useLocale()

const resolvedEmptyText = computed(() => props.emptyText || t('chatEmpty'))

// 侦听消息条数与最后一条的流式增量（正文 / 推理尾段 / 工具输出 / 分支活动）
const lastMessage = computed(() => props.messages[props.messages.length - 1])
const watchSource = () => {
  const last = lastMessage.value
  const reasoning = last?.reasoning
  return [
    props.messages.length,
    last?.content,
    reasoning?.length,
    reasoning && reasoning.length > 0 ? reasoning[reasoning.length - 1] : undefined,
    last?.tool?.output,
    last?.branch?.entries.length,
  ]
}
</script>

<template>
  <ChatTray
    :auto-scroll="autoScroll"
    :scroll-threshold="scrollThreshold"
    :watch-source="watchSource"
  >
    <div v-if="messages.length === 0" class="nm-chat-list__empty">
      <slot name="empty">{{ resolvedEmptyText }}</slot>
    </div>
    <slot v-for="message in messages" :key="message.id" name="message" :message="message">
      <ChatMessageItem :message="message" :markdown="markdown" :format-time="formatTime" />
    </slot>
  </ChatTray>
</template>

<style scoped lang="scss">
.nm-chat-list__empty {
  margin: auto;
  color: var(--nm-text-placeholder);
  font-size: var(--nm-font-md);
}
</style>
