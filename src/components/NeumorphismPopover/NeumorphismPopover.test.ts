//! `NeumorphismPopover` 的**视口夹边**契约（2026-11 用户报障）。
//!
//! 现场："点击弹出的那个框超出边界了，我按不到"。
//!
//! 两个独立成因，一个在定位引擎（判向时机），一个在本组件（没有最终夹边）：
//!
//! ① `useFloatingPosition` 打开那一帧量不到内容高度（浮层刚挂载，
//!    `offsetHeight`=0），auto 用估计值 120 判向 → 选 bottom；内容真渲染成
//!    430px 后已压出屏幕下沿。修法见 `useFloatingPosition.test.ts`
//!    （实测尺寸变化后补一次重判）。
//!
//! ② 判向只决定"选哪一侧"，两侧都装不下时（或侧向空间不够）没有任何机制
//!    把浮层拉回视口。本文件锁定 ② —— 最终坐标必须被夹进
//!    `[margin, 视口 - 尺寸 - margin]`。

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeumorphismPopover from './NeumorphismPopover.vue'

const originalWidth = window.innerWidth
const originalHeight = window.innerHeight

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true })
}

function flushFrames(n = 3) {
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

const wrappers: Array<{ unmount: () => void }> = []

/**
 * 挂一个浮层，并把触发器钉在指定位置。
 *
 * `triggerRef` 挂的是组件的**外层 wrapper**（`.nm-popover-wrapper`），不是 slot
 * 里的按钮——rect 必须 mock 在 wrapper 上，否则量到的全是 0（那就是个 0×0 的
 * 触发器，夹边会把浮层推到左上角，断言看起来"莫名其妙地失败"）。
 *
 * 浮层尺寸在 happy-dom 里量不到（offsetHeight 恒 0），组件回落到 200×120 的
 * 估计值——`boxOf` 的尺寸参数必须与之一致。
 */
async function mountAt(rect: { top: number; bottom: number; left: number; right: number }) {
  const wrapper = mount(NeumorphismPopover, {
    props: { position: 'auto', trigger: 'click', offset: 8 },
    slots: { default: '<button class="trg">open</button>', content: '<div class="body">x</div>' },
    global: { stubs: { teleport: false, transition: false } },
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  const trigger = wrapper.find('.nm-popover-wrapper').element as HTMLElement
  trigger.getBoundingClientRect = vi.fn(
    () =>
      ({
        ...rect,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
        x: rect.left,
        y: rect.top,
      }) as DOMRect
  )
  await wrapper.find('.trg').trigger('click')
  await nextTick()
  await flushFrames(4)
  const popover = document.querySelector('.nm-popover') as HTMLElement | null
  return { wrapper, popover }
}

/** 从内联样式还原浮层盒子的左上角（位置是"锚点 + transform"两段式）。 */
function boxOf(popover: HTMLElement, height = 120, width = 200) {
  const top = parseFloat(popover.style.top)
  const left = parseFloat(popover.style.left)
  const transform = popover.style.transform
  const up = transform.includes('-100%') && transform.includes('-50%')
  const full = transform.includes('-100%')
  // translate(-50%, -100%) → top 是盒底；translate(-50%, 0) → top 是盒顶
  const boxTop = up ? top - height : top
  // translate(-50%, ...) → left 是盒水平中心；translate(-100%, ...) → left 是盒右边缘
  const boxLeft = full ? left - width : left - width / 2
  return { top: boxTop, left: boxLeft, bottom: boxTop + height, right: boxLeft + width }
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  while (wrappers.length) wrappers.pop()!.unmount()
  document.body.innerHTML = ''
  Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: originalHeight, configurable: true })
})

describe('NeumorphismPopover 视口夹边', () => {
  it('触发器贴底、下方装不下时，浮层不越过视口下沿', async () => {
    setViewport(1024, 400)
    // 触发器在视口最下方：下方只剩 20px，远小于浮层高度
    const { popover } = await mountAt({ top: 360, bottom: 380, left: 100, right: 220 })
    expect(popover, '浮层应已挂载（Teleport 到 body）').toBeTruthy()

    const box = boxOf(popover!)
    expect(box.bottom).toBeLessThanOrEqual(400)
    expect(box.top).toBeGreaterThanOrEqual(0)
  })

  it('触发器贴右边缘时，浮层不越过视口右沿', async () => {
    setViewport(360, 640)
    // 触发器就在右边缘：水平居中会让浮层右半截出屏
    const { popover } = await mountAt({ top: 200, bottom: 240, left: 300, right: 356 })
    expect(popover).toBeTruthy()

    const box = boxOf(popover!)
    expect(box.right).toBeLessThanOrEqual(360)
    expect(box.left).toBeGreaterThanOrEqual(0)
  })

  it('锚点足够宽裕时不做无谓平移（正常位置不被夹边改写）', async () => {
    setViewport(1024, 700)
    // 触发器在视口中部，两侧都宽裕
    const { popover } = await mountAt({ top: 300, bottom: 340, left: 400, right: 520 })
    expect(popover).toBeTruthy()

    const box = boxOf(popover!)
    // 居中：left 锚点 = 触发器水平中心 460，盒左 = 460 - 200/2 = 360
    expect(Math.round(box.left)).toBe(360)
  })
})
