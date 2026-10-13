<script setup lang="ts">
import { ref } from 'vue'
import {
  ChatComposer,
  ChatFold,
  ChatCopyButton,
  type ChatMessage,
  type ChatRole,
  type ChatToolStatus,
} from '../../src/composites/chat'
import { useChatScroll } from '../../src/composables/useChatScroll'
import NeumorphismButton from '../../src/components/NeumorphismButton/NeumorphismButton.vue'
import NeumorphismStatusDot from '../../src/components/NeumorphismStatusDot/NeumorphismStatusDot.vue'
import NeumorphismTag from '../../src/components/NeumorphismTag/NeumorphismTag.vue'

let seq = 0
const nextId = () => `demo-${++seq}`

const now = () => Math.floor(Date.now() / 1000)

// —— 宿主自组行模型：role → 气泡样式变体 + 角色名 ——
//（2026-10-13 起：ui-frame 解散 ChatBubble，气泡壳样式 / 角色映射由宿主
// CSS 承担——本页即"原子组装参考实现"。）
const roleMap: Record<ChatRole, { label: string; variant: 'user' | 'agent' | 'system' }> = {
  user: { label: '用户', variant: 'user' },
  agent: { label: 'Echo', variant: 'agent' },
  system: { label: '系统', variant: 'system' },
  tool: { label: '工具', variant: 'agent' },
  branch: { label: '分支', variant: 'agent' },
}

const toolStatusText: Record<ChatToolStatus, string> = {
  running: '运行中',
  succeeded: '已完成',
  failed: '失败',
}

const formatTime = (time?: number) =>
  time
    ? new Date(time * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : ''

// 正文纯文本：工具 / 分支消息由宿主归纳为一行摘要
function messageText(message: ChatMessage): string {
  if (message.tool) {
    const status = message.tool.status ? toolStatusText[message.tool.status] : ''
    return `工具调用 ${message.tool.name}${status ? `（${status}）` : ''}`
  }
  if (message.branch) return `分支合并：${message.branch.summary}`
  return message.content
}

const messages = ref<ChatMessage[]>([
  {
    id: nextId(),
    role: 'system',
    content: '后台任务 #3 已挂起 · 2 个分支 · 汇总仓库近期变更',
    time: now() - 3600,
  },
  {
    id: nextId(),
    role: 'user',
    content: '帮我总结一下这个仓库最近的改动',
    time: now() - 3590,
    source: { adapterName: 'qq', channel: 'group_1', groupName: '前端群', userName: '小明' },
  },
  {
    id: nextId(),
    role: 'tool',
    content: 'run_shell',
    time: now() - 3585,
    tool: {
      name: 'run_shell',
      input: 'command=git log --oneline -10',
      output: 'c9a8912 feat(doc): 画布文档\nbe192e2 fix(input-number): 逐帧检查四缺陷修复',
      status: 'succeeded',
    },
  },
  {
    id: nextId(),
    role: 'agent',
    content:
      '最近主要有两类改动：\n\n1. doc 模块 —— 新增画布文档与流程图\n2. 组件修复 —— input-number / select 的逐帧检查修复',
    time: now() - 3580,
  },
  {
    id: nextId(),
    role: 'branch',
    content: '',
    time: now() - 3500,
    branch: {
      branchId: 'branch-9f2c7d1e4a',
      summary: '已在后台完成依赖审计，发现 0 个高危漏洞',
      entries: [
        { kind: 'reasoning', text: '需要审计生产依赖与开发依赖' },
        {
          kind: 'tool',
          text: 'run_shell',
          toolName: 'run_shell',
          input: 'command=npm audit --audit-level=high',
          output: 'found 0 high severity vulnerabilities',
          status: 'succeeded',
        },
        { kind: 'content', text: '审计完成，未发现高危漏洞。' },
      ],
    },
  },
  {
    id: nextId(),
    role: 'tool',
    content: 'read_file',
    time: now() - 60,
    tool: { name: 'read_file', input: 'path=src/index.ts', output: null, status: 'running' },
  },
])

// 吸底滚动（headless）：滚动容器 + 侦听源（消息条数变化时重估）
const trayRef = ref<HTMLElement | null>(null)
const { showJumpButton, handleScroll, scrollToBottom } = useChatScroll({
  container: trayRef,
  watchSource: () => messages.value.length,
})

const input = ref('')

function handleSend(content: string) {
  messages.value.push({ id: nextId(), role: 'user', content, time: now() })
  // 模拟 Agent 应答
  window.setTimeout(() => {
    messages.value.push({
      id: nextId(),
      role: 'agent',
      content: `收到：「${content}」。这是一条演示回复（宿主自组消息行）。`,
      time: now(),
    })
  }, 600)
}

function handleCancel() {
  messages.value.push({
    id: nextId(),
    role: 'system',
    content: '已请求取消当前任务（演示）',
    time: now(),
  })
}
</script>

<template>
  <div class="chat-page">
    <!-- 会话窗口：整张页面唯一的强凸起主体 -->
    <section class="chat-window" aria-label="聊天组件演示">
      <header class="chat-window__header">
        <NeumorphismStatusDot status="online" size="small" />
        <div class="chat-window__title-group">
          <h1 class="chat-window__title">Echo 助手</h1>
          <span class="chat-window__subtitle">local:tui::local_user</span>
        </div>
        <NeumorphismTag size="small" rounded>deepseek-v4-flash</NeumorphismTag>
      </header>

      <div class="chat-window__tray">
        <div
          ref="trayRef"
          class="chat-window__list"
          role="log"
          aria-live="polite"
          @scroll="handleScroll"
        >
          <div
            v-for="message in messages"
            :key="message.id"
            class="chat-row"
            :class="`chat-row--${roleMap[message.role].variant}`"
          >
            <div v-if="message.role !== 'system'" class="chat-row__head">
              <span class="chat-row__role">{{ roleMap[message.role].label }}</span>
              <span v-if="message.time" class="chat-row__time">{{ formatTime(message.time) }}</span>
              <span class="chat-row__spacer" />
              <ChatCopyButton :text="messageText(message)" />
            </div>
            <div class="chat-row__content">{{ messageText(message) }}</div>
          </div>
        </div>
        <NeumorphismButton
          v-if="showJumpButton"
          class="chat-window__jump"
          shape="pill"
          size="small"
          aria-label="回到底部"
          title="回到底部"
          @click="scrollToBottom()"
        >
          ↓
        </NeumorphismButton>
      </div>

      <ChatComposer v-model="input" cancelable @send="handleSend" @cancel="handleCancel" />
    </section>

    <!-- 元组件自定义组装：不走 ChatMessage 数据契约，纯 UI 自由拼接 -->
    <section class="custom-demo" aria-label="元组件自定义组装演示">
      <h2 class="custom-demo__title">元组件自定义组装</h2>
      <div class="custom-demo__stage">
        <div class="chat-row chat-row--agent">
          <div class="chat-row__head">
            <NeumorphismStatusDot status="busy" size="small" />
            <span class="chat-row__role">自定义头部：状态点 + 任意内容</span>
            <span class="chat-row__spacer" />
            <ChatCopyButton text="这段内容可以被复制" />
          </div>
          <div class="chat-row__content">
            这是宿主 CSS 拼出的消息壳：对齐 / 色调 / 复制按钮由宿主配方承担。
          </div>
        </div>
        <div class="chat-row chat-row--user">
          <div class="chat-row__content">无头部的用户侧气泡 —— 只放正文。</div>
        </div>
        <ChatFold>
          <template #head="{ open }">
            <span style="font-size: var(--nm-font-sm)">
              {{ open ? '收起' : '展开' }}：ChatFold 自定义折叠内容
            </span>
          </template>
          <p style="margin: 0; font-size: var(--nm-font-sm); color: var(--nm-text-secondary)">
            折叠体里可以放任意 DOM —— 表格、图片、表单都行。
          </p>
        </ChatFold>
      </div>
    </section>

    <p class="chat-page__hint">
      宿主自组消息行：useChatScroll + v-for 气泡行（role → 宿主样式映射） · 吸底滚动 · Enter
      发送（IME 安全） · 正文纯文本
    </p>
  </div>
</template>

<style scoped lang="scss">
.chat-page {
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--nm-spacing-lg);
  padding: var(--nm-spacing-lg);
  box-sizing: border-box;
  // 顶部极淡的径向高光，让窗口像被环境光照亮
  background: radial-gradient(
    72% 46% at 50% 0%,
    color-mix(in srgb, var(--nm-shadow-light) 55%, transparent),
    transparent 72%
  );
}

[data-theme='dark'] .chat-page {
  background: radial-gradient(72% 46% at 50% 0%, rgba(255, 255, 255, 0.03), transparent 72%);
}

.chat-window {
  width: min(820px, 100%);
  height: min(680px, calc(100vh - 160px));
  display: flex;
  flex-direction: column;
  border-radius: var(--nm-border-radius-lg);
  background-color: var(--nm-surface-color);
  overflow: hidden;
  box-shadow:
    12px 12px 32px var(--nm-shadow-dark),
    -8px -8px 24px var(--nm-shadow-light),
    0 0 0 1px var(--nm-shadow-ambient-subtle);
}

// 窗口顶栏：底部一道"凹槽缝"（暗线 + 亮线）与托盘分隔
.chat-window__header {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  padding: 12px var(--nm-spacing-md);
  border-bottom: 1px solid var(--nm-shadow-dark);
  box-shadow: 0 1px 0 var(--nm-shadow-light);
}

.chat-window__title-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.chat-window__title {
  margin: 0;
  font-size: var(--nm-font-lg);
  font-weight: 600;
  color: var(--nm-text-primary);
  line-height: 1.2;
}

.chat-window__subtitle {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-placeholder);
  font-family: var(--nm-font-mono);
}

// ── 宿主配方（2026-10-13 起替代库内 ChatTray/ChatBubble 组装件）────────────
// 托盘：凹陷滚动井 + 吸底跳转钮定位（行为在 useChatScroll，视觉由宿主承担）
.chat-window__tray {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chat-window__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-12);
  padding: 18px var(--nm-spacing-md);
  background-color: var(--nm-chat-tray-bg);
  box-shadow:
    inset 2px 2px 6px var(--nm-shadow-dark),
    inset -1px -1px 4px var(--nm-shadow-light);
  scrollbar-width: thin;
  scrollbar-color: var(--nm-neutral-300) transparent;
}

.chat-window__jump {
  position: absolute;
  right: var(--nm-spacing-md);
  bottom: var(--nm-spacing-md);
}

// 消息行（宿主自组气泡壳：对齐 / 色调 / 圆角暗示方向）
.chat-row {
  max-width: min(78%, 640px);
  padding: var(--nm-spacing-sm) var(--nm-spacing-14);
  border-radius: var(--nm-border-radius-md);

  &--user {
    align-self: flex-end;
    background-color: var(--nm-chat-user-bg);
    box-shadow:
      3px 3px 10px var(--nm-shadow-dark),
      -2px -2px 8px var(--nm-shadow-light);
    // 非对称圆角：居右压右下角
    border-radius: var(--nm-border-radius-md) var(--nm-border-radius-md) var(--nm-border-radius-xs)
      var(--nm-border-radius-md);
  }

  &--agent {
    align-self: flex-start;
    background-color: var(--nm-chat-agent-bg);
    box-shadow:
      3px 3px 10px var(--nm-shadow-dark),
      -2px -2px 8px var(--nm-shadow-light);
    border-radius: var(--nm-border-radius-md) var(--nm-border-radius-md) var(--nm-border-radius-md)
      var(--nm-border-radius-xs);
  }

  &--system {
    align-self: center;
    max-width: 92%;
    padding: 0 var(--nm-spacing-sm);
    color: var(--nm-chat-system-color);
    font-size: var(--nm-font-sm);
    background: none;
    box-shadow: none;
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

// 行头（宿主自组）：角色 / 时间 / 复制按钮（悬停浮现）
.chat-row__head {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  margin-bottom: var(--nm-spacing-2xs);
}

.chat-row__spacer {
  flex: 1;
}

.chat-row__role {
  font-size: var(--nm-font-xs);
  font-weight: 600;
  color: var(--nm-text-secondary);
  letter-spacing: 0.02em;
}

.chat-row__time {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-disabled);
  font-variant-numeric: tabular-nums;
}

.chat-row__content {
  color: var(--nm-text-primary);
  font-size: var(--nm-font-md);
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;

  // MarkdownRenderer 自带排版，关闭外层 pre-wrap 双重作用
  &:has(.neumorphism-markdown) {
    white-space: normal;
  }

  .chat-row--system & {
    color: inherit;
    font-size: inherit;
  }
}

// 复制按钮平时隐藏，悬停行时浮现（触屏常显）
.chat-row .nm-chat-copy {
  opacity: 0;
  transition: opacity 0.2s ease;

  @media (hover: hover) {
    .chat-row:hover & {
      opacity: 1;
    }
  }

  @media (hover: none) {
    opacity: 1;
  }
}

.chat-row__time {
  font-size: var(--nm-font-xs);
  color: var(--nm-text-disabled);
  font-variant-numeric: tabular-nums;
}

.custom-demo {
  width: min(820px, 100%);
}

.custom-demo__title {
  margin: 0 0 var(--nm-spacing-sm);
  font-size: var(--nm-font-md);
  font-weight: 600;
  color: var(--nm-text-secondary);
}

.custom-demo__stage {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--nm-spacing-md);
  border-radius: var(--nm-border-radius-lg);
  background-color: var(--nm-chat-tray-bg);
  box-shadow:
    inset 3px 3px 8px var(--nm-shadow-dark),
    inset -2px -2px 6px var(--nm-shadow-light);
}

.chat-page__hint {
  margin: 0;
  font-size: var(--nm-font-xs);
  color: var(--nm-text-placeholder);
  text-align: center;
}
</style>
