import { ref, computed, unref, watch, nextTick } from 'vue'
import type { Ref, ComputedRef, WatchSource } from 'vue'

export interface UseChatScrollOptions {
  /** 滚动容器元素 */
  container: Ref<HTMLElement | null>
  /** 距底部多少 px 内视为"贴底"（默认 120；需大于单条新内容的典型高度） */
  threshold?: number | Ref<number>
  /** 新内容到达时是否自动吸底（仅当用户本就在底部才跟随），默认 true */
  autoScroll?: boolean | Ref<boolean>
  /**
   * 内容变化侦听源（消息条数、最后一条的输出等）。
   * 变化时在下一帧重新评估贴底状态并按需吸底。
   */
  watchSource?: WatchSource<unknown> | Array<WatchSource<unknown>>
}

export interface UseChatScrollReturn {
  /** 当前是否贴底 */
  isNearBottom: Ref<boolean>
  /** 是否显示"回到底部"按钮（即未贴底） */
  showJumpButton: ComputedRef<boolean>
  /** 绑定到容器 scroll 事件 */
  handleScroll: () => void
  /** 滚动到底部（默认 smooth，用于手动'回到底部'；内容自动跟随请传 'auto'） */
  scrollToBottom: (behavior?: ScrollBehavior) => void
  /** 立即重新评估贴底状态（容器尺寸变化等场景手动触发） */
  recheck: () => void
}

/**
 * Headless 聊天吸底滚动 —— 用户位于底部时新内容自动跟随，
 * 向上翻阅历史时不打断；离开底部时暴露"回到底部"信号。
 *
 * @example
 * ```ts
 * const { showJumpButton, handleScroll, scrollToBottom } = useChatScroll({
 *   container,
 *   watchSource: () => messages.length,
 * })
 * ```
 */
export function useChatScroll(options: UseChatScrollOptions): UseChatScrollReturn {
  const { container } = options
  const threshold = computed(() => unref(options.threshold) ?? 120)
  const autoScroll = computed(() => unref(options.autoScroll) ?? true)

  const isNearBottom = ref(true)

  // 程序化平滑滚动进行中：scroll 事件不重置贴底态
  // （动画中间态距离 > threshold 会闪烁"回到底部"按钮）
  let programmaticScroll = false
  let programmaticTimer: ReturnType<typeof setTimeout> | undefined

  function distanceToBottom(): number {
    const el = container.value
    if (!el) return 0
    return el.scrollHeight - el.scrollTop - el.clientHeight
  }

  function recheck(): void {
    if (programmaticScroll) return
    isNearBottom.value = distanceToBottom() < threshold.value
  }

  function handleScroll(): void {
    recheck()
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    const el = container.value
    if (!el) return
    if (programmaticTimer) clearTimeout(programmaticTimer)
    if (behavior === 'smooth') {
      programmaticScroll = true
      // 无 scrollend 全兼容事件，500ms 兜底恢复 scroll 事件评估
      programmaticTimer = setTimeout(() => {
        programmaticScroll = false
        recheck()
      }, 500)
    }
    el.scrollTo({ top: el.scrollHeight, behavior })
    // 乐观置位：滚动期间不因中间态闪烁"回到底部"按钮
    isNearBottom.value = true
  }

  const showJumpButton = computed(() => !isNearBottom.value)

  if (options.watchSource) {
    watch(options.watchSource, async () => {
      // 跟随与否用"内容增长前"的贴底态（最近一次用户/程序化滚动的结果）。
      // 新内容可能远超 threshold（如整块 markdown 回复），增长后再测会把
      // 本就在底部的用户误判为离开。
      const shouldFollow = autoScroll.value && isNearBottom.value
      if (shouldFollow) {
        await nextTick()
        // 内容变化跟随用瞬时定位（auto）：会话/历史整体替换时若用 smooth
        // 会从顶部播放一次滚动动画；用户本就贴底，直接保持贴底即可。
        scrollToBottom('auto')
      }
    })
  }

  return { isNearBottom, showJumpButton, handleScroll, scrollToBottom, recheck }
}
