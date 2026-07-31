import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useFloatingPosition } from './useFloatingPosition'
import type { FloatingPlacement } from './useFloatingPosition'

function mockTrigger(rect: Partial<DOMRect>): { value: HTMLElement } {
  const el = document.createElement('div')
  el.getBoundingClientRect = vi.fn(
    () =>
      ({
        top: 100,
        bottom: 140,
        left: 100,
        right: 220,
        width: 120,
        height: 40,
        ...rect,
      }) as DOMRect
  )
  document.body.appendChild(el)
  return { value: el }
}

function flushFrames(n = 2) {
  return new Promise<void>(resolve => {
    let count = 0
    function step() {
      count++
      if (count >= n) resolve()
      else requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

describe('useFloatingPosition', () => {
  const innerWidth = window.innerWidth
  const innerHeight = window.innerHeight

  beforeEach(() => {
    document.body.innerHTML = ''
  })
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: innerWidth, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true })
  })

  it('打开时全量重估并写入 rect 与 available', async () => {
    const trigger = mockTrigger({})
    const open = ref(false)
    const placement = ref<FloatingPlacement | 'auto'>('bottom')
    const { rect, available, actualPlacement, stop } = useFloatingPosition({
      trigger,
      open,
      placement,
      offset: ref(6),
    })
    open.value = true
    await nextTick()
    expect(rect.value).not.toBeNull()
    expect(rect.value!.top).toBe(100)
    expect(actualPlacement.value).toBe('bottom')
    // spaceBelow = innerHeight - 140 - 6
    expect(available.value).toBe(window.innerHeight - 140 - 6)
    stop()
  })

  it('显式方向在滞后条件满足时翻转（对侧更宽裕）', async () => {
    // 触发器贴近视口底部：spaceBelow 很小
    const trigger = mockTrigger({ top: innerHeight - 60, bottom: innerHeight - 20 })
    const open = ref(false)
    const placement = ref<FloatingPlacement | 'auto'>('bottom')
    const { actualPlacement, stop } = useFloatingPosition({
      trigger,
      open,
      placement,
      offset: ref(0),
    })
    open.value = true
    await nextTick()
    expect(actualPlacement.value).toBe('top')
    stop()
  })

  it('对侧不宽裕时不翻转（滞后保护）', async () => {
    // 触发器在视口中部：两侧都充足
    const trigger = mockTrigger({ top: 400, bottom: 440 })
    const open = ref(false)
    const placement = ref<FloatingPlacement | 'auto'>('bottom')
    const { actualPlacement, stop } = useFloatingPosition({
      trigger,
      open,
      placement,
      offset: ref(0),
    })
    open.value = true
    await nextTick()
    expect(actualPlacement.value).toBe('bottom')
    stop()
  })

  it('auto 按候选顺序选择首个满足空间的方向', async () => {
    // 底部不足、上方充足 → 选 top
    const trigger = mockTrigger({ top: innerHeight - 60, bottom: innerHeight - 20 })
    const open = ref(false)
    const placement = ref<FloatingPlacement | 'auto'>('auto')
    const { actualPlacement, stop } = useFloatingPosition({
      trigger,
      open,
      placement,
      offset: ref(0),
    })
    open.value = true
    await nextTick()
    expect(actualPlacement.value).toBe('top')
    stop()
  })

  it('rAF 逐帧跟随：触发器移动后 rect 同步更新', async () => {
    let top = 100
    const el = document.createElement('div')
    el.getBoundingClientRect = vi.fn(
      () =>
        ({
          top,
          bottom: top + 40,
          left: 100,
          right: 220,
          width: 120,
          height: 40,
        }) as DOMRect
    )
    document.body.appendChild(el)
    const trigger = { value: el }
    const open = ref(false)
    const { rect, stop } = useFloatingPosition({
      trigger,
      open,
      placement: ref<FloatingPlacement | 'auto'>('bottom'),
      offset: ref(0),
    })
    open.value = true
    await nextTick()
    await flushFrames(2)
    expect(rect.value!.top).toBe(100)
    top = 300
    await flushFrames(3)
    expect(rect.value!.top).toBe(300)
    stop()
  })

  it('关闭后停止追踪且方向复位', async () => {
    const trigger = mockTrigger({})
    const open = ref(true)
    const { actualPlacement, stop } = useFloatingPosition({
      trigger,
      open,
      placement: ref<FloatingPlacement | 'auto'>('bottom'),
      offset: ref(0),
    })
    await nextTick()
    open.value = false
    await nextTick()
    expect(actualPlacement.value).toBe('bottom')
    stop()
  })

  it('SSR 安全：无 window 时不抛错', async () => {
    const trigger = mockTrigger({})
    const open = ref(false)
    const originalWindow = globalThis.window
    // @ts-expect-error 模拟 SSR 环境
    delete globalThis.window
    const { stop } = useFloatingPosition({
      trigger,
      open,
      placement: ref<FloatingPlacement | 'auto'>('bottom'),
      offset: ref(0),
    })
    open.value = true
    await nextTick()
    globalThis.window = originalWindow
    stop()
  })
})
