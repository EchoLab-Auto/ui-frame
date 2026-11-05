import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeumorphismScrollbar from './NeumorphismScrollbar.vue'

/**
 * 覆盖层变体（dots / glow）的测试需要容器有真实的几何尺寸，
 * happy-dom 的 clientHeight / scrollHeight 默认是 0，必须显式 mock。
 */
function mockGeometry(el: HTMLElement, clientHeight: number, scrollHeight: number) {
  Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true })
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
}

/** 取覆盖层内部的实际绘制元素（sticky wrapper 的第一个子节点） */
function overlayOf(el: HTMLElement): HTMLElement {
  return (el.firstElementChild as HTMLElement).firstElementChild as HTMLElement
}

/** rAF 回调落地 + 响应式 watch 落地 */
async function settle() {
  await new Promise(r => setTimeout(r, 30))
  await nextTick()
}

describe('NeumorphismScrollbar', () => {
  it('renders without error when target is empty (no-op)', () => {
    const wrapper = mount(NeumorphismScrollbar)
    expect(wrapper.exists()).toBe(true)
  })

  it('applies CSS class variant to the target element', () => {
    document.body.innerHTML = '<div id="sb-target"></div>'
    const wrapper = mount(NeumorphismScrollbar, {
      props: { variant: 'primary', target: '#sb-target' },
    })
    const el = document.querySelector('#sb-target')!
    expect(el.classList.contains('nm-scrollbar--primary')).toBe(true)
    wrapper.unmount()
    expect(el.classList.contains('nm-scrollbar--primary')).toBe(false)
  })

  it('dots variant builds overlay wrapper inside target', () => {
    document.body.innerHTML = '<div id="sb-dots"></div>'
    mount(NeumorphismScrollbar, {
      props: { variant: 'dots', target: '#sb-dots' },
    })
    const el = document.querySelector('#sb-dots')!
    expect(el.children.length).toBeGreaterThan(0)
  })

  it('dots paints on first mount (no scroll needed)', async () => {
    document.body.innerHTML = '<div id="sb-dots-first"></div>'
    const el = document.querySelector('#sb-dots-first') as HTMLElement
    mockGeometry(el, 400, 2000)
    mount(NeumorphismScrollbar, { props: { variant: 'dots', target: '#sb-dots-first' } })
    await nextTick()
    const overlay = overlayOf(el)
    // 回归：非 immediate watch 导致首次挂载 backgroundImage 为空，
    // 必须滚一下才出现点阵。
    expect(overlay.style.backgroundImage.length).toBeGreaterThan(0)
    expect(overlay.style.height).toBe('400px')
    expect(overlay.style.backgroundImage).not.toContain('NaN')
  })

  it('dots repaints when dotColor / accentColor props change', async () => {
    document.body.innerHTML = '<div id="sb-dots-color"></div>'
    const el = document.querySelector('#sb-dots-color') as HTMLElement
    mockGeometry(el, 400, 2000)
    const wrapper = mount(NeumorphismScrollbar, {
      props: { variant: 'dots', target: '#sb-dots-color' },
    })
    await nextTick()
    const overlay = overlayOf(el)
    await wrapper.setProps({ dotColor: '#ff0000' })
    await nextTick()
    // 回归：resolveColor 原样返回 hex prop，split(',') → NaN → 整片点阵被丢弃
    expect(overlay.style.backgroundImage).toContain('rgba(255,0,0')
    expect(overlay.style.backgroundImage).not.toContain('NaN')
  })

  it('dots cursor stays fully visible at both scroll extremes', async () => {
    document.body.innerHTML = '<div id="sb-dots-edge"></div>'
    const el = document.querySelector('#sb-dots-edge') as HTMLElement
    mockGeometry(el, 400, 2000)
    mount(NeumorphismScrollbar, { props: { variant: 'dots', target: '#sb-dots-edge' } })
    await nextTick()
    const overlay = overlayOf(el)

    // 顶部（scrollTop=0）：游标在 sigma=14px 处，首行（y=2.5）处于晕的中段——
    // 既非全亮 accent 也非最暗 dot 色，验证「游标没有被钳到画布外」
    const topRow = overlay.style.backgroundImage.slice(0, 120)
    expect(topRow).toContain('rgba(190,222,99')
    expect(topRow).not.toContain('rgba(205,250,78')

    el.scrollTop = 1600 // maxScroll
    el.dispatchEvent(new Event('scroll'))
    await settle()
    // 底部：游标在 h - sigma = 386px 处，末行（y=397.5）对称地处于晕的中段
    const bottomRow = overlay.style.backgroundImage.slice(-120)
    expect(bottomRow).toContain('rgba(190,222,99')
    expect(bottomRow).not.toContain('rgba(205,250,78')
  })

  it('dots reacts to window resize (container height change)', async () => {
    document.body.innerHTML = '<div id="sb-dots-resize"></div>'
    const el = document.querySelector('#sb-dots-resize') as HTMLElement
    let height = 400
    Object.defineProperty(el, 'clientHeight', { get: () => height, configurable: true })
    Object.defineProperty(el, 'scrollHeight', { value: 2000, configurable: true })
    mount(NeumorphismScrollbar, { props: { variant: 'dots', target: '#sb-dots-resize' } })
    await settle()
    const overlay = overlayOf(el)
    expect(overlay.style.height).toBe('400px')

    height = 600
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(overlay.style.height).toBe('600px')
    expect(overlay.style.backgroundSize).toBe('25px 600px')
  })

  it('glow positions itself by scroll progress', async () => {
    document.body.innerHTML = '<div id="sb-glow-pos"></div>'
    const el = document.querySelector('#sb-glow-pos') as HTMLElement
    mockGeometry(el, 400, 2000)
    mount(NeumorphismScrollbar, { props: { variant: 'glow', target: '#sb-glow-pos' } })
    await settle()
    const glow = overlayOf(el)
    expect(glow.style.transform).toBe('translateY(0px)')
    expect(glow.style.backgroundImage).toContain('radial-gradient')

    el.scrollTop = 1600 // maxScroll
    el.dispatchEvent(new Event('scroll'))
    await settle()
    // clientHeight 400 - GLOW_HEIGHT 72 = 328
    expect(glow.style.transform).toBe('translateY(328px)')
  })

  it('glow repaints when accentColor prop changes', async () => {
    document.body.innerHTML = '<div id="sb-glow-color"></div>'
    const el = document.querySelector('#sb-glow-color') as HTMLElement
    mockGeometry(el, 400, 2000)
    const wrapper = mount(NeumorphismScrollbar, {
      props: { variant: 'glow', target: '#sb-glow-color' },
    })
    await settle()
    const glow = overlayOf(el)
    await wrapper.setProps({ accentColor: '#00ff00' })
    await nextTick()
    expect(glow.style.backgroundImage).toContain('rgba(0,255,0,0.5)')
  })

  it('removes overlay and listeners on unmount', async () => {
    document.body.innerHTML = '<div id="sb-unmount"></div>'
    const el = document.querySelector('#sb-unmount') as HTMLElement
    mockGeometry(el, 400, 2000)
    const wrapper = mount(NeumorphismScrollbar, {
      props: { variant: 'dots', target: '#sb-unmount' },
    })
    await nextTick()
    expect(el.children.length).toBe(1)
    expect(document.getElementById('nm-sb-hide--sb-unmount')).not.toBeNull()
    wrapper.unmount()
    expect(el.children.length).toBe(0)
    // 注入的隐藏原生滚动条样式必须一并清理
    expect(document.getElementById('nm-sb-hide--sb-unmount')).toBeNull()
  })
})
