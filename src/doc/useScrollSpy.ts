import { ref, watch, nextTick, onBeforeUnmount, type Ref } from 'vue'

export interface UseScrollSpyOptions {
  /** 内容容器（heading 渲染在其中） */
  content: Ref<HTMLElement | null>
  /**
   * 滚动容器：元素 / CSS 选择器（closest 匹配）/ undefined。
   * undefined 时自动向上查找 `.nm-layout__content`。
   */
  scrollContainer?: Ref<HTMLElement | string | undefined>
  /** 观察的标题选择器（默认 'h1, h2, h3'） */
  headingSelector?: string
  /** 内容版本信号：变化时重建观察器（如渲染 HTML 更新后 heading 集合已变） */
  watchSource?: () => unknown
  /** 激活标题变化回调 */
  onActiveChange?: (id: string) => void
}

export interface UseScrollSpyReturn {
  /** 当前激活的标题 id */
  activeHeading: Ref<string>
  /** 滚动到指定标题并立即高亮（点击导航期间屏蔽 scroll-spy，避免动画中途闪烁） */
  scrollToHeading: (id: string) => void
  /** 依当前视口位置手动重算激活标题（observer 兜底） */
  syncActiveHeading: () => void
}

/** 返回 'smooth' 或 'auto'，取决于用户的 reduced-motion 偏好 */
export function getScrollBehavior(): ScrollBehavior {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 'auto'
  }
  return 'smooth'
}

/**
 * Headless scroll-spy —— IntersectionObserver 跟踪内容区标题，
 * 输出当前激活的 heading id，并提供点击导航（平滑滚动 + 高亮锁定）。
 */
export function useScrollSpy(options: UseScrollSpyOptions): UseScrollSpyReturn {
  const { content } = options
  const headingSelector = options.headingSelector ?? 'h1, h2, h3'

  const activeHeading = ref('')

  /** 点击导航标志 — smooth scroll 期间屏蔽 scroll-spy，避免动画中途高亮闪烁 */
  let isClickScrolling = false
  let clickScrollTimer: ReturnType<typeof setTimeout> | null = null

  /** 从给定元素向上查找滚动容器 */
  function resolveScrollContainer(fromEl?: HTMLElement): HTMLElement | null {
    const el = fromEl ?? content.value
    if (!el) return null
    const target = options.scrollContainer?.value
    if (target instanceof HTMLElement) {
      return target
    }
    if (typeof target === 'string') {
      return el.closest(target) as HTMLElement | null
    }
    return el.closest('.nm-layout__content') as HTMLElement | null
  }

  /** 动态获取 header 高度（用于 scroll-spy 偏移计算） */
  function getHeaderHeight(scrollContainer?: HTMLElement): number {
    const container = scrollContainer ?? resolveScrollContainer()
    if (!container) return 64

    const layout = container.closest('.nm-layout') as HTMLElement | null
    const header = layout?.querySelector('.nm-layout__header') as HTMLElement | null
    if (header) {
      return header.getBoundingClientRect().height
    }
    return 64
  }

  function notifyActive(id: string): void {
    if (id !== activeHeading.value) {
      activeHeading.value = id
      options.onActiveChange?.(id)
    }
  }

  /** 根据当前视口位置手动同步 activeHeading（用于 smooth scroll 结束后兜底） */
  function syncActiveHeading() {
    const main = resolveScrollContainer()
    if (!main) return
    const headings = content.value?.querySelectorAll(headingSelector)
    if (!headings) return
    const offset = getHeaderHeight(main) + 20
    let current = ''
    for (const h of headings) {
      const rect = h.getBoundingClientRect()
      const containerRect = main.getBoundingClientRect()
      if (rect.top - containerRect.top <= offset) {
        current = h.id
      } else {
        break
      }
    }
    notifyActive(current)
  }

  /** 清除点击导航标志，重新启用 scroll-spy */
  function clearClickScroll() {
    isClickScrolling = false
    if (clickScrollTimer) {
      clearTimeout(clickScrollTimer)
      clickScrollTimer = null
    }
    syncActiveHeading()
  }

  /** 滚动到指定 heading 并立即高亮 */
  function scrollToHeading(id: string) {
    // 取消之前的等待
    if (clickScrollTimer) clearTimeout(clickScrollTimer)

    isClickScrolling = true
    activeHeading.value = id
    options.onActiveChange?.(id)

    const target = content.value?.querySelector(`[id="${id}"]`)
    if (target) {
      target.scrollIntoView({ behavior: getScrollBehavior() })
    }

    // 800ms 后恢复 scroll-spy（smooth scroll 动画通常在 300-500ms 内完成）
    clickScrollTimer = setTimeout(clearClickScroll, 800)
  }

  // ==========================================
  // IntersectionObserver 管线
  // ==========================================
  let headingObserver: IntersectionObserver | null = null
  let headerResizeObserver: ResizeObserver | null = null
  // 上次观察到的 header 高度：ResizeObserver 在 observe() 时必触发一次初始通知，
  // 高度未变则跳过重建，否则"重建 → observe → 初始通知 → 重建"会自旋
  let lastHeaderHeight = -1

  function disconnectObservers() {
    headingObserver?.disconnect()
    headingObserver = null
    headerResizeObserver?.disconnect()
    headerResizeObserver = null
  }

  function setupHeadingObserver() {
    disconnectObservers()

    const main = resolveScrollContainer()
    if (!main || !content.value) return

    const headerHeight = getHeaderHeight(main)
    lastHeaderHeight = headerHeight
    const headings = Array.from(content.value.querySelectorAll(headingSelector))
    if (headings.length === 0) return

    // 跟踪当前在观察区域（offset 以下、底部 60% 以上）内的 heading
    const topMap = new Map<Element, number>()

    headingObserver = new IntersectionObserver(
      entries => {
        if (isClickScrolling) return

        for (const entry of entries) {
          if (entry.isIntersecting) {
            topMap.set(entry.target, entry.boundingClientRect.top)
          } else {
            topMap.delete(entry.target)
          }
        }

        let current = ''
        let maxTop = -Infinity
        for (const [el, top] of topMap) {
          if (top > maxTop) {
            maxTop = top
            current = el.id
          }
        }

        if (current) notifyActive(current)
      },
      {
        root: main,
        rootMargin: `-${headerHeight + 20}px 0px -60% 0px`,
        threshold: 0,
      }
    )

    for (const h of headings) {
      headingObserver.observe(h)
    }

    // 监听 header 高度变化，动态调整 rootMargin
    const layout = main.closest('.nm-layout') as HTMLElement | null
    const header = layout?.querySelector('.nm-layout__header') as HTMLElement | null
    if (header && typeof ResizeObserver !== 'undefined') {
      headerResizeObserver = new ResizeObserver(() => {
        const nextHeight = header.getBoundingClientRect().height
        // 初始通知/布局抖动时高度未变 —— 不重建，避免自旋
        if (nextHeight === lastHeaderHeight) return
        lastHeaderHeight = nextHeight
        nextTick(() => setupHeadingObserver())
      })
      headerResizeObserver.observe(header)
    }
  }

  // 内容容器或内容版本变化后重建 observer 并做初始同步
  watch(options.watchSource ? [content, options.watchSource] : [content], ([el]) => {
    if (el) {
      nextTick(() => {
        setupHeadingObserver()
        // 初始同步，确保挂载时即正确高亮当前区域
        syncActiveHeading()
      })
    } else {
      disconnectObservers()
    }
  })

  onBeforeUnmount(() => {
    disconnectObservers()
    if (clickScrollTimer) clearTimeout(clickScrollTimer)
  })

  return { activeHeading, scrollToHeading, syncActiveHeading }
}
