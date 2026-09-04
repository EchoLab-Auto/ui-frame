<script setup lang="ts">
import { computed } from 'vue'
import NeumorphismTag from '@/components/NeumorphismTag/NeumorphismTag.vue'
import { useLocale } from '@/composables/useLocale'
import ChatFold from './ChatFold.vue'
import ChatToolCallBlock from './ChatToolCallBlock.vue'
import ChatReasoningBlock from './ChatReasoningBlock.vue'
import type { ChatBranchSummary } from './types'

export interface ChatBranchMergeBlockProps {
  /** 分支合并块数据 */
  branch: ChatBranchSummary
  /** 已格式化的时间文本 */
  time?: string
}

const props = withDefaults(defineProps<ChatBranchMergeBlockProps>(), {
  time: '',
})

const { t } = useLocale()

const shortId = computed(() =>
  props.branch.branchId.length > 8 ? props.branch.branchId.slice(0, 8) : props.branch.branchId
)

const toolCount = computed(() => props.branch.entries.filter(e => e.kind === 'tool').length)
const reasoningCount = computed(
  () => props.branch.entries.filter(e => e.kind === 'reasoning').length
)

const statsLabel = computed(() =>
  t('chatBranchStats', { tools: toolCount.value, reasonings: reasoningCount.value })
)
</script>

<template>
  <ChatFold :sunk="false" class="nm-chat-branch">
    <template #head="{ open }">
      <NeumorphismTag size="small">{{ t('chatBranchMerge') }}</NeumorphismTag>
      <span class="nm-chat-branch__id">{{ shortId }}</span>
      <span v-if="time" class="nm-chat-branch__time">{{ time }}</span>
      <span class="nm-chat-branch__stats">{{ open ? t('chatCollapse') : statsLabel }}</span>
    </template>
    <template #subhead>
      <div class="nm-chat-branch__summary">{{ branch.summary }}</div>
    </template>
    <div class="nm-chat-branch__entries">
      <div v-if="branch.entries.length === 0" class="nm-chat-branch__empty">
        {{ t('chatBranchEmpty') }}
      </div>
      <template v-for="entry in branch.entries" :key="entry">
        <ChatToolCallBlock
          v-if="entry.kind === 'tool'"
          :name="entry.toolName ?? entry.text"
          :input="entry.input"
          :output="entry.output"
          :status="entry.status"
        />
        <ChatReasoningBlock v-else-if="entry.kind === 'reasoning'" :parts="[entry.text]" />
        <div v-else-if="entry.kind === 'content'" class="nm-chat-branch__content">
          {{ entry.text }}
        </div>
        <div v-else class="nm-chat-branch__notice">{{ entry.text }}</div>
      </template>
    </div>
  </ChatFold>
</template>

<style scoped lang="scss">
.nm-chat-branch__id {
  font-family: var(--nm-font-mono);
  font-size: var(--nm-font-sm);
  color: var(--nm-text-secondary);
}

.nm-chat-branch__time {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-disabled);
}

.nm-chat-branch__stats {
  margin-left: auto;
  font-size: var(--nm-font-sm);
  color: var(--nm-text-placeholder);
  transition: color 0.2s ease;

  :hover > & {
    color: var(--nm-text-primary);
  }
}

.nm-chat-branch__summary {
  margin-top: var(--nm-spacing-xs);
  color: var(--nm-text-primary);
  font-size: var(--nm-font-md);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.nm-chat-branch__entries {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  padding-top: var(--nm-spacing-sm);
  border-top: 1px solid var(--nm-shadow-dark);
}

.nm-chat-branch__empty,
.nm-chat-branch__notice {
  font-size: var(--nm-font-sm);
  color: var(--nm-text-placeholder);
}

.nm-chat-branch__content {
  color: var(--nm-text-primary);
  font-size: var(--nm-font-md);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (prefers-reduced-motion: reduce) {
  .nm-chat-branch__stats {
    transition: none;
  }
}
</style>
