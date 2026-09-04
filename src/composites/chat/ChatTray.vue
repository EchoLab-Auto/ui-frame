<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useChatScroll } from '@/composables/useChatScroll'

export interface ChatTrayProps {
  /** 新内容到达时是否自动吸底（仅当用户本就在底部才跟随） */
  autoScroll?: boolean
  /** 距底部多少 px 内视为贴底 */
  scrollThreshold?: number
  /** 内容变化侦听源（如 `() => messages.length`），变化时下一帧重新评估吸底 */
  watchSource?: () => unknown
  /** "回到底部"按钮的无障碍文本（默认取 locale chatJumpToBottom） */
  jumpLabel?: string
}

const props = withDefaults(defineProps<ChatTrayProps>(), {
  autoScroll: undefined,
  scrollThreshold: undefined,
  watchSource: undefined,
  jumpLabel: '',
})

const { t } = useLocale()
const { config, resolveProp } = useNeumorphismSetup()

const resolvedAutoScroll = computed(() =>
  resolveProp(props.autoScroll, config.value.chat?.autoScroll, true)
)
const resolvedThreshold = computed(() =>
  resolveProp(props.scrollThreshold, config.value.chat?.scrollThreshold, 120)
)
const resolvedJumpLabel = computed(() => props.jumpLabel || t('chatJumpToBottom'))

const containerRef = ref<HTMLElement | null>(null)

const { isNearBottom, showJumpButton, handleScroll, scrollToBottom, recheck } = useChatScroll({
  container: containerRef,
  threshold: resolvedThreshold,
  autoScroll: resolvedAutoScroll,
  watchSource: () => props.watchSource?.(),
})

// 初始挂载即定位到底部（瞬时，无平滑动画）
onMounted(async () => {
  await nextTick()
  scrollToBottom('auto')
})

defineExpose({ isNearBottom, showJumpButton, scrollToBottom, recheck })
</script>

<template>
  <div class="nm-chat-tray">
    <div
      ref="containerRef"
      class="nm-chat-tray__scroll"
      role="log"
      aria-live="polite"
      @scroll="handleScroll"
    >
      <slot />
    </div>
    <button
      v-if="showJumpButton"
      type="button"
      class="nm-chat-tray__jump"
      :aria-label="resolvedJumpLabel"
      :title="resolvedJumpLabel"
      @click="scrollToBottom()"
    >
      ↓
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-chat-tray {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

// —— 下沉消息托盘：凹陷托盘承载凸起气泡，构成物理纵深 ——
.nm-chat-tray__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px var(--nm-spacing-md);
  background-color: var(--nm-chat-tray-bg);
  @include nm-inset(2px, 6px);
  scrollbar-width: thin;
  scrollbar-color: var(--nm-neutral-300) transparent;
}

.nm-chat-tray__jump {
  position: absolute;
  right: var(--nm-spacing-md);
  bottom: var(--nm-spacing-md);
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-surface-color);
  color: var(--nm-text-secondary);
  font-size: var(--nm-font-lg);
  cursor: pointer;
  box-shadow:
    4px 4px 10px var(--nm-shadow-dark),
    -3px -3px 8px var(--nm-shadow-light);
  transition:
    transform 0.25s $nm-ease-spring,
    color 0.2s ease;

  @media (hover: hover) {
    &:hover {
      transform: translateY(-2px);
      color: var(--nm-text-primary);
    }
  }

  &:active {
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-chat-tray__jump {
    transition: none;
  }
}
</style>
