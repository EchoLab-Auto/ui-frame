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

  // 模拟 outlined 单盒：触发器盒底随展开不断长高（bottom 持续增大）
  function mockGrowingTrigger(getGrow: () => number) {
    const el = document.createElement('div')
    el.getBoundingClientRect = vi.fn(
      () =>
        ({
          top: 400,
          bottom: 440 + getGrow(),
          left: 100,
          right: 220,
          width: 120,
          height: 40 + getGrow(),
        }) as DOMRect
    )
    document.body.appendChild(el)
    return { value: el }
  }

  it('未锁定：盒底增长越过 minSpace 后中途翻转（outlined 旧缺陷的对照）', async () => {
    let grow = 0
    const trigger = mockGrowingTrigger(() => grow)
    const open = ref(false)
    const { actualPlacement, stop } = useFloatingPosition({
      trigger,
      open,
      placement: ref<FloatingPlacement | 'auto'>('bottom'),
      offset: ref(0),
    })
    open.value = true
    await nextTick()
    expect(actualPlacement.value).toBe('bottom')

    // 盒底长到视口底部附近：spaceBelow = innerHeight - (440+grow) < 120
    grow = window.innerHeight - 440 - 100
    await flushFrames(3)
    expect(actualPlacement.value).toBe('top')
    stop()
  })

  it('lockPlacement：打开决策一次后冻结，盒底增长不再翻转', async () => {
    let grow = 0
    const trigger = mockGrowingTrigger(() => grow)
    const open = ref(false)
    const { actualPlacement, stop } = useFloatingPosition({
      trigger,
      open,
      placement: ref<FloatingPlacement | 'auto'>('bottom'),
      offset: ref(0),
      lockPlacement: ref(true),
    })
    open.value = true
    await nextTick()
    // 打开时以闭合几何决策：下方空间充足 → bottom
    expect(actualPlacement.value).toBe('bottom')

    grow = window.innerHeight - 440 - 100
    await flushFrames(3)
    // 冻结 —— 不随盒底增长翻转
    expect(actualPlacement.value).toBe('bottom')
    stop()
  })

  it('lockPlacement：打开瞬间空间不足仍判到对侧（一次性决策保留滞后）', async () => {
    const trigger = mockTrigger({ top: window.innerHeight - 60, bottom: window.innerHeight - 20 })
    const open = ref(false)
    const { actualPlacement, stop } = useFloatingPosition({
      trigger,
      open,
      placement: ref<FloatingPlacement | 'auto'>('bottom'),
      offset: ref(0),
      lockPlacement: ref(true),
    })
    open.value = true
    await nextTick()
    expect(actualPlacement.value).toBe('top')
    stop()
  })

  it('lockPlacement：关闭后下次打开重新决策', async () => {
    let top = 400
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
    const { actualPlacement, stop } = useFloatingPosition({
      trigger,
      open,
      placement: ref<FloatingPlacement | 'auto'>('bottom'),
      offset: ref(0),
      lockPlacement: ref(true),
    })
    open.value = true
    await nextTick()
    expect(actualPlacement.value).toBe('bottom')

    open.value = false
    await nextTick()
    // 移到视口底部再打开 → 重新决策为 top
    top = window.innerHeight - 60
    open.value = true
    await nextTick()
    expect(actualPlacement.value).toBe('top')
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
