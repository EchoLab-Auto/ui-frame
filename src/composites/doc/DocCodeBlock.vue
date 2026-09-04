<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useClipboard } from '@/composables/useClipboard'
import { highlightCode } from './highlight'

export interface DocCodeBlockProps {
  /** 源代码原文 */
  code: string
  /** 语言标记（fence 标识，如 ts / bash；text 与 plain 不高亮） */
  lang?: string
  /** 是否显示行号（默认 true） */
  showLineNumbers?: boolean
}

const props = withDefaults(defineProps<DocCodeBlockProps>(), {
  lang: 'text',
  showLineNumbers: true,
})

const { t } = useLocale()
const { copied, copy } = useClipboard({ resetDelay: 1500 })

const language = computed(() => props.lang || 'text')
const highlighted = computed(() => highlightCode(props.code, props.lang))
const lineCount = computed(() => props.code.split('\n').length)

const copyLabel = computed(() => (copied.value ? t('markdownCodeCopied') : t('markdownCodeCopy')))
</script>

<template>
  <div class="code-block-wrapper doc-code-block">
    <div class="code-block-header">
      <span class="code-lang">{{ language }}</span>
      <span class="code-lines">{{ lineCount }} lines</span>
      <button
        type="button"
        class="code-copy-btn"
        :class="{ copied }"
        :aria-label="copyLabel"
        @click="copy(code)"
      >
        {{ copyLabel }}
      </button>
    </div>
    <div class="code-block-body">
      <div v-if="showLineNumbers" class="line-numbers" aria-hidden="true">
        <span v-for="n in lineCount" :key="n" class="line-num">{{ n }}</span>
      </div>
      <pre><code :class="`language-${language}`" v-html="highlighted" /></pre>
    </div>
  </div>
</template>

<!-- 全局样式：token-* 类由 highlightCode 字符串产物使用，scoped 无法命中 v-html 内容 -->
<style>
.code-block-wrapper {
  margin: 0 0 20px 0;
  border-radius: var(--nm-border-radius-lg);
  overflow: hidden;
  background-color: var(--nm-surface-color);
  border: 1px solid var(--nm-border-subtle);
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid var(--nm-border-subtle);
}

.code-lang {
  font-size: 11px;
  font-weight: 700;
  color: var(--nm-primary-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: var(--nm-font-mono);
}

.code-lines {
  font-size: 11px;
  color: var(--nm-text-placeholder);
  font-family: var(--nm-font-mono);
  margin-left: auto;
  margin-right: 12px;
}

.code-copy-btn {
  padding: 4px 10px;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  font-size: 11px;
  font-weight: 500;
  color: var(--nm-text-secondary);
  background-color: var(--nm-surface-color);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.code-copy-btn:hover {
  color: var(--nm-primary-color);
}

.code-copy-btn.copied {
  background-color: var(--nm-primary-color);
  color: #fff;
}

.code-copy-btn:focus-visible {
  outline: 2px solid var(--nm-primary-color);
  outline-offset: 2px;
  border-radius: var(--nm-border-radius-sm);
}

.code-block-body {
  display: flex;
  overflow-x: auto;
}

.line-numbers {
  display: flex;
  flex-direction: column;
  padding: 14px 0 14px 14px;
  flex-shrink: 0;
  user-select: none;
  border-right: 1px solid var(--nm-border-subtle);
}

.line-num {
  font-size: 12px;
  line-height: 1.65;
  color: var(--nm-text-placeholder);
  font-family: var(--nm-font-mono);
  text-align: right;
  padding-right: 14px;
  min-width: 28px;
}

.code-block-body pre {
  flex: 1;
  margin: 0;
  padding: 14px 20px;
  background: transparent;
  overflow-x: auto;
  box-shadow: none;
}

.code-block-body pre code {
  display: block;
  font-size: 13px;
  line-height: 1.65;
  font-family: var(--nm-font-mono);
  background: transparent;
  padding: 0;
  box-shadow: none;
}

.token-comment {
  color: var(--nm-code-comment);
  font-style: italic;
}
.token-string {
  color: var(--nm-code-string);
}
.token-keyword {
  color: var(--nm-code-keyword);
  font-weight: 600;
}
.token-function {
  color: var(--nm-code-function);
}
.token-number {
  color: var(--nm-code-number);
}
.token-type {
  color: var(--nm-code-type);
}
.token-operator {
  color: var(--nm-code-operator);
}
.token-punctuation {
  color: var(--nm-code-punctuation);
}

@media (prefers-reduced-motion: reduce) {
  .code-copy-btn {
    transition: none;
  }
}
</style>
