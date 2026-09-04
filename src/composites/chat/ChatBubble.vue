<script setup lang="ts">
import ChatCopyButton from './ChatCopyButton.vue'

export type ChatBubbleAlign = 'start' | 'end' | 'center'
export type ChatBubbleTone = 'default' | 'primary' | 'plain'

export interface ChatBubbleProps {
  /** 水平对齐：start 居左 / end 居右 / center 居中（默认 start） */
  align?: ChatBubbleAlign
  /**
   * 色调：default 中性凸起气泡 / primary 主色气泡（用户侧） /
   * plain 无气泡平铺文本（配合 center 出"细线夹文本"系统消息样式）
   */
  tone?: ChatBubbleTone
  /** 传入则在头部显示悬停浮现的复制按钮 */
  copyText?: string
}

withDefaults(defineProps<ChatBubbleProps>(), {
  align: 'start',
  tone: 'default',
  copyText: '',
})
</script>

<template>
  <div class="nm-chat-bubble" :class="[`nm-chat-bubble--${align}`, `nm-chat-bubble--${tone}`]">
    <div v-if="$slots.head || copyText" class="nm-chat-bubble__head">
      <slot name="head" />
      <span class="nm-chat-bubble__head-spacer" />
      <ChatCopyButton v-if="copyText" class="nm-chat-bubble__copy" :text="copyText" />
    </div>
    <div class="nm-chat-bubble__content">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// —— 气泡壳：对齐与色调正交组合 ——
.nm-chat-bubble {
  max-width: min(78%, 640px);
  padding: var(--nm-spacing-sm) 14px;
  border-radius: var(--nm-border-radius-md);

  &--start {
    align-self: flex-start;
  }
  &--end {
    align-self: flex-end;
  }
  &--center {
    align-self: center;
  }

  &--primary {
    background-color: var(--nm-chat-user-bg);
    box-shadow:
      3px 3px 10px var(--nm-shadow-dark),
      -2px -2px 8px var(--nm-shadow-light);
  }

  &--default {
    background-color: var(--nm-chat-agent-bg);
    box-shadow:
      3px 3px 10px var(--nm-shadow-dark),
      -2px -2px 8px var(--nm-shadow-light);
  }

  // 非对称圆角暗示方向：居右压右下角，居左压左下角
  &--primary#{&}--end {
    border-radius: var(--nm-border-radius-md) var(--nm-border-radius-md) var(--nm-border-radius-xs)
      var(--nm-border-radius-md);
  }
  &--default#{&}--start {
    border-radius: var(--nm-border-radius-md) var(--nm-border-radius-md) var(--nm-border-radius-md)
      var(--nm-border-radius-xs);
  }

  // 平铺：无气泡（系统消息等提示性内容）
  &--plain {
    max-width: 92%;
    padding: 0 var(--nm-spacing-sm);
    color: var(--nm-chat-system-color);
    font-size: var(--nm-font-sm);
  }

  &--plain#{&}--center {
    display: flex;
    align-items: center;
    gap: var(--nm-spacing-sm);

    &::before,
    &::after {
      content: '';
      height: 1px;
      width: 32px;
      background: var(--nm-shadow-dark);
    }
  }
}

.nm-chat-bubble__head {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  margin-bottom: 2px;
}

.nm-chat-bubble__head-spacer {
  flex: 1;
}

// 复制按钮平时隐藏，悬停气泡时浮现（触屏常显）
.nm-chat-bubble__copy {
  opacity: 0;
  transition: opacity 0.2s ease;

  .nm-chat-bubble:hover & {
    opacity: 1;
  }

  @media (hover: none) {
    opacity: 1;
  }
}

.nm-chat-bubble__content {
  color: var(--nm-text-primary);
  font-size: var(--nm-font-md);
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;

  // MarkdownRenderer 自带排版，关闭外层 pre-wrap 双重作用
  &:has(.neumorphism-markdown) {
    white-space: normal;
  }

  .nm-chat-bubble--plain & {
    color: inherit;
    font-size: inherit;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-chat-bubble__copy {
    transition: none;
  }
}
</style>
