<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import MarkdownRenderer from '@/doc/MarkdownRenderer.vue'
import ChatBubble from './ChatBubble.vue'
import ChatReasoningBlock from './ChatReasoningBlock.vue'
import ChatToolCallBlock from './ChatToolCallBlock.vue'
import ChatBranchMergeBlock from './ChatBranchMergeBlock.vue'
import type { ChatMessage } from './types'

export interface ChatMessageItemProps {
  /** 消息数据 */
  message: ChatMessage
  /** Agent 消息正文是否按 Markdown 渲染（用户/系统消息始终纯文本） */
  markdown?: boolean
  /** 自定义时间格式化（入参为秒级 Unix 时间戳） */
  formatTime?: (time: number) => string
}

const props = withDefaults(defineProps<ChatMessageItemProps>(), {
  markdown: undefined,
  formatTime: undefined,
})

const { t } = useLocale()
const { config, resolveProp } = useNeumorphismSetup()

const resolvedMarkdown = computed(() =>
  resolveProp(props.markdown, config.value.chat?.markdown, true)
)

const isUser = computed(() => props.message.role === 'user')

const sourceLabel = computed(() => {
  const source = props.message.source
  if (!source) return ''
  const parts: string[] = []
  if (source.adapterName) parts.push(source.adapterName)
  if (source.channel?.startsWith('group')) {
    parts.push(t('chatSourceGroup', { name: source.groupName ?? source.channel }))
  }
  if (source.userName) parts.push(source.userName)
  return parts.join(' · ')
})

const timeLabel = computed(() => {
  const time = props.message.time
  if (!time) return ''
  if (props.formatTime) return props.formatTime(time)
  return new Date(time * 1000).toLocaleTimeString(undefined, { hour12: false })
})

/** Markdown 渲染只作用于 agent 正文；user/system 保持 pre-wrap 纯文本 */
const renderMarkdown = computed(() => resolvedMarkdown.value && props.message.role === 'agent')
</script>

<template>
  <ChatToolCallBlock
    v-if="message.role === 'tool' && message.tool"
    :name="message.tool.name"
    :input="message.tool.input"
    :output="message.tool.output"
    :status="message.tool.status"
    :time="timeLabel"
  />
  <ChatBranchMergeBlock
    v-else-if="message.role === 'branch' && message.branch"
    :branch="message.branch"
    :time="timeLabel"
  />
  <ChatBubble v-else-if="message.role === 'system'" align="center" tone="plain" role="note">
    <span class="nm-chat-message__system-text">{{ message.content }}</span>
    <span v-if="timeLabel" class="nm-chat-message__system-time">{{ timeLabel }}</span>
  </ChatBubble>
  <ChatBubble
    v-else
    :align="isUser ? 'end' : 'start'"
    :tone="isUser ? 'primary' : 'default'"
    :copy-text="message.content"
    role="article"
    :aria-label="isUser ? t('chatRoleUser') : t('chatRoleAgent')"
  >
    <template #head>
      <span v-if="!isUser" class="nm-chat-message__role">{{ t('chatRoleAgent') }}</span>
      <span v-if="sourceLabel" class="nm-chat-message__source">{{ sourceLabel }}</span>
      <span v-if="timeLabel" class="nm-chat-message__time">{{ timeLabel }}</span>
    </template>
    <ChatReasoningBlock
      v-if="message.reasoning && message.reasoning.length > 0"
      :parts="message.reasoning"
    />
    <div class="nm-chat-message__content">
      <MarkdownRenderer v-if="renderMarkdown" :content="message.content" :show-toc="false" />
      <template v-else>{{ message.content }}</template>
    </div>
  </ChatBubble>
</template>

<style scoped lang="scss">
// —— 领域头内容：角色 / 来源 / 时间，压低存在感 ——
.nm-chat-message__role {
  font-size: var(--nm-font-xs);
  font-weight: 600;
  color: var(--nm-text-secondary);
  letter-spacing: 0.02em;
}

.nm-chat-message__source {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-placeholder);
}

.nm-chat-message__time {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-disabled);
  font-variant-numeric: tabular-nums;
}

.nm-chat-message__system-time {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-disabled);
}

.nm-chat-message__content {
  white-space: pre-wrap;
  word-break: break-word;

  // MarkdownRenderer 自带排版，关闭外层 pre-wrap 双重作用
  &:has(.neumorphism-markdown) {
    white-space: normal;
  }
}
</style>
