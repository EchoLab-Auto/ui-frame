<script setup lang="ts">
import { ref } from 'vue'
import {
  ChatMessageList,
  ChatComposer,
  ChatBubble,
  ChatFold,
  type ChatMessage,
} from '../../src/composites/chat'
import NeumorphismStatusDot from '../../src/components/NeumorphismStatusDot/NeumorphismStatusDot.vue'
import NeumorphismTag from '../../src/components/NeumorphismTag/NeumorphismTag.vue'

let seq = 0
const nextId = () => `demo-${++seq}`

const now = () => Math.floor(Date.now() / 1000)

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
      '最近主要有两类改动：\n\n1. doc 模块 —— 新增画布文档与流程图\n2. 组件修复 —— input-number / select 的逐帧检查修复\n\n**画布文档**已支持 prodoc-flow 流程图：\n\n```ts\nconst log = await git.log()\n```',
    reasoning: ['先取最近提交列表', '按模块归类整理成摘要'],
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

const input = ref('')

function handleSend(content: string) {
  messages.value.push({ id: nextId(), role: 'user', content, time: now() })
  // 模拟 Agent 应答
  window.setTimeout(() => {
    messages.value.push({
      id: nextId(),
      role: 'agent',
      content: `收到：「${content}」。这是一条演示回复，正文支持 **Markdown** 渲染。`,
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

      <ChatMessageList :messages="messages" class="chat-window__list" />

      <ChatComposer v-model="input" cancelable @send="handleSend" @cancel="handleCancel" />
    </section>

    <!-- 元组件自定义组装：不走 ChatMessage 数据契约，纯 UI 自由拼接 -->
    <section class="custom-demo" aria-label="元组件自定义组装演示">
      <h2 class="custom-demo__title">元组件自定义组装</h2>
      <div class="custom-demo__stage">
        <ChatBubble align="start" copy-text="这段内容可以被复制">
          <template #head>
            <NeumorphismStatusDot status="busy" size="small" />
            <span style="font-size: var(--nm-font-xs); color: var(--nm-text-placeholder)">
              自定义头部：状态点 + 任意内容
            </span>
          </template>
          这是用 <code>ChatBubble</code> 直接拼的消息壳：对齐 / 色调 / 复制按钮都是 prop，
          头部与正文全是插槽。
        </ChatBubble>
        <ChatBubble align="end" tone="primary"> 无头部的主色气泡 —— 只传正文。 </ChatBubble>
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
      ChatMessageList + ChatComposer · 五种消息形态 · 吸底滚动 · Enter 发送（IME 安全） · Agent 正文
      Markdown 渲染
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

.chat-window__list {
  flex: 1;
  min-height: 0;
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
