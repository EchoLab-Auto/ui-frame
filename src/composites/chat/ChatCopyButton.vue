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
    <svg
      v-if="copied"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
    <svg
      v-else
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
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
