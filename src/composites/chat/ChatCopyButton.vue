<script setup lang="ts">
import { computed } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useLocale } from '@/composables/useLocale'

defineProps<{
  /** 待复制文本 */
  text: string
}>()

const { t } = useLocale()
const { copied, copy } = useClipboard()

const label = computed(() => (copied.value ? t('chatCopied') : t('chatCopy')))
</script>

<template>
  <button
    type="button"
    class="nm-chat-copy"
    :class="{ 'nm-chat-copy--copied': copied }"
    :aria-label="label"
    :title="label"
    @click.stop="copy(text)"
  >
    {{ copied ? '✓' : '⧉' }}
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-chat-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--nm-border-radius-sm);
  background: transparent;
  color: var(--nm-text-placeholder);
  font-size: var(--nm-font-sm);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    transform 0.25s $nm-ease-spring;

  @media (hover: hover) {
    &:hover {
      color: var(--nm-text-primary);
      background-color: var(--nm-surface-raised);
    }
  }

  &:active {
    transform: scale(0.85);
  }

  &--copied {
    color: var(--nm-color-success);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-chat-copy {
    transition: none;
  }
}
</style>
