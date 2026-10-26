import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import NeumorphismCard from './NeumorphismCard.vue'
import { ConfigKey } from '@/composables/useConfig'

describe('NeumorphismCard', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismCard, { slots: { default: 'Content' } })
    expect(wrapper.classes()).toContain('nm-card')
    expect(wrapper.classes()).toContain('nm-card--elevation-2')
    expect(wrapper.attributes('style')).toContain('--nm-card-radius: 24px')
    expect(wrapper.text()).toBe('Content')
  })

  it('should apply elevation classes', () => {
    for (let i = -4; i <= 4; i++) {
      const wrapper = mount(NeumorphismCard, { props: { elevation: i } })
      expect(wrapper.classes()).toContain(`nm-card--elevation-${i}`)
    }
  })

  it('radius 是 px 数字，写到 --nm-card-radius 自定义属性', () => {
    for (const radius of [0, 4, 12, 24, 40]) {
      const wrapper = mount(NeumorphismCard, { props: { radius } })
      expect(wrapper.attributes('style')).toContain(`--nm-card-radius: ${radius}px`)
    }
  })

  it('radius: 小数也按 px 原样下发', () => {
    const wrapper = mount(NeumorphismCard, { props: { radius: 7.5 } })
    expect(wrapper.attributes('style')).toContain('--nm-card-radius: 7.5px')
  })

  it('radius: 走全局配置 card.radius 级联', () => {
    const wrapper = mount(NeumorphismCard, {
      global: {
        provide: { [ConfigKey as symbol]: computed(() => ({ card: { radius: 8 } })) },
      },
    })
    expect(wrapper.attributes('style')).toContain('--nm-card-radius: 8px')
  })

  it('radius: prop 优先于全局配置', () => {
    const wrapper = mount(NeumorphismCard, {
      props: { radius: 40 },
      global: {
        provide: { [ConfigKey as symbol]: computed(() => ({ card: { radius: 8 } })) },
      },
    })
    expect(wrapper.attributes('style')).toContain('--nm-card-radius: 40px')
  })

  it('radius: 负值夹到 0（CSS 不接受负圆角）', () => {
    const wrapper = mount(NeumorphismCard, { props: { radius: -8 } })
    expect(wrapper.attributes('style')).toContain('--nm-card-radius: 0px')
  })

  it('radius: NaN 退回默认 24', () => {
    const wrapper = mount(NeumorphismCard, { props: { radius: Number.NaN } })
    expect(wrapper.attributes('style')).toContain('--nm-card-radius: 24px')
  })

  it('should apply no-padding class', () => {
    const wrapper = mount(NeumorphismCard, { props: { noPadding: true } })
    expect(wrapper.classes()).toContain('nm-card--no-padding')
  })

  it('should apply hoverable bulge class', () => {
    const wrapper = mount(NeumorphismCard, { props: { hoverable: true } })
    expect(wrapper.classes()).toContain('nm-card--hoverable')
    expect(wrapper.classes()).toContain('nm-card--hover-bulge')
  })

  it('should apply hoverable sink class', () => {
    const wrapper = mount(NeumorphismCard, { props: { hoverable: 'sink' } })
    expect(wrapper.classes()).toContain('nm-card--hoverable')
    expect(wrapper.classes()).toContain('nm-card--hover-sink')
  })

  it('should not apply hoverable class when false', () => {
    const wrapper = mount(NeumorphismCard, { props: { hoverable: false } })
    expect(wrapper.classes()).not.toContain('nm-card--hoverable')
  })

  it('should render header slot', () => {
    const wrapper = mount(NeumorphismCard, {
      slots: {
        header: '<h3>Header</h3>',
        default: 'Body',
      },
    })
    expect(wrapper.find('.nm-card__header').exists()).toBe(true)
    expect(wrapper.find('.nm-card__header').text()).toBe('Header')
    expect(wrapper.find('.nm-card__body').text()).toBe('Body')
  })

  it('should render footer slot', () => {
    const wrapper = mount(NeumorphismCard, {
      slots: {
        default: 'Body',
        footer: '<button>Action</button>',
      },
    })
    expect(wrapper.find('.nm-card__footer').exists()).toBe(true)
    expect(wrapper.find('.nm-card__footer').text()).toBe('Action')
  })

  it('should not render header/footer when slots empty', () => {
    const wrapper = mount(NeumorphismCard, { slots: { default: 'Body' } })
    expect(wrapper.find('.nm-card__header').exists()).toBe(false)
    expect(wrapper.find('.nm-card__footer').exists()).toBe(false)
  })

  it('should compute elevation from variant and depth (backward compat)', () => {
    const wrapper = mount(NeumorphismCard, {
      props: { variant: 'pressed', depth: 'deep' },
    })
    expect(wrapper.classes()).toContain('nm-card--elevation--3')
  })

  it('should prefer elevation over variant+depth', () => {
    const wrapper = mount(NeumorphismCard, {
      props: { elevation: 1, variant: 'pressed', depth: 'deep' },
    })
    expect(wrapper.classes()).toContain('nm-card--elevation-1')
  })

  describe('glass morphism', () => {
    it('glass: applies frosted glass class (legacy boolean)', () => {
      const wrapper = mount(NeumorphismCard, { props: { glass: true } })
      expect(wrapper.classes()).toContain('nm-card--glass')
      // 旧布尔语义归一为 float 档
      expect(wrapper.classes()).toContain('nm-card--glass-float')
    })

    it('does not apply any glass class by default', () => {
      const wrapper = mount(NeumorphismCard)
      expect(wrapper.classes().some(c => c.startsWith('nm-card--glass'))).toBe(false)
    })

    it('maps each glass variant to its own modifier class', () => {
      const variants = ['float', 'raised', 'pressed'] as const
      for (const glass of variants) {
        const wrapper = mount(NeumorphismCard, { props: { glass } })
        expect(wrapper.classes()).toContain('nm-card--glass')
        expect(wrapper.classes()).toContain(`nm-card--glass-${glass}`)
        // 档位互斥：只挂一个修饰类
        const modifiers = wrapper
          .classes()
          .filter(c => /^nm-card--glass-(float|raised|pressed)$/.test(c))
        expect(modifiers).toHaveLength(1)
      }
    })

    it('keeps the elevation class alongside the glass variant', () => {
      // 玻璃只换"表面材质"，台阶高度仍由 elevation 决定
      const wrapper = mount(NeumorphismCard, { props: { glass: 'raised', elevation: 3 } })
      expect(wrapper.classes()).toContain('nm-card--glass-raised')
      expect(wrapper.classes()).toContain('nm-card--elevation-3')
    })

    it('combines with hoverable', () => {
      const wrapper = mount(NeumorphismCard, { props: { glass: 'float', hoverable: true } })
      expect(wrapper.classes()).toContain('nm-card--glass-float')
      expect(wrapper.classes()).toContain('nm-card--hoverable')
    })

    it('glass: falls back to the global config default when the prop is absent', () => {
      const wrapper = mount(NeumorphismCard, {
        global: {
          provide: {
            [ConfigKey as symbol]: computed(() => ({ card: { glass: 'pressed' as const } })),
          },
        },
      })
      expect(wrapper.classes()).toContain('nm-card--glass-pressed')
    })

    it('glass: false overrides the global config default', () => {
      const wrapper = mount(NeumorphismCard, {
        props: { glass: false },
        global: {
          provide: {
            [ConfigKey as symbol]: computed(() => ({ card: { glass: 'raised' as const } })),
          },
        },
      })
      expect(wrapper.classes().some(c => c.startsWith('nm-card--glass'))).toBe(false)
    })
  })

  it('布局支持（非实现）：class/style/attrs 透传到根节点，父级可施加任意布局', () => {
    // 契约：消费方经 class/style 注入布局（如卡片栈的 flex 高度分配），
    // 卡片自身不内置布局模式（防臃肿）。
    const wrapper = mount(NeumorphismCard, {
      attrs: {
        class: 'rail-card',
        style: 'flex-grow: 2',
        'data-layout': 'stack',
      },
      slots: { default: 'Body' },
    })
    expect(wrapper.classes()).toContain('nm-card')
    expect(wrapper.classes()).toContain('rail-card')
    expect(wrapper.attributes('style')).toContain('flex-grow: 2')
    expect(wrapper.attributes('data-layout')).toBe('stack')
    // 内部结构保持稳定锚点供消费方选择器使用（> .nm-card__body 等）
    expect(wrapper.find('.nm-card__body').exists()).toBe(true)
    // 不得引入内置布局类（回归守卫）
    expect(wrapper.classes().some(c => c.includes('flexible'))).toBe(false)
  })
})

describe('NeumorphismCard — 超椭圆轮廓（squircle / clipPath）', () => {
  /**
   * jsdom 里 `getBoundingClientRect()` 恒为 0、`border-radius` 也读不到计算值，
   * 所以这两处用桩函数给出可控值；每个用例后恢复。
   */
  function stubLayout(width: number, height: number, radius = '16px') {
    const rect = {
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect)
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      borderTopLeftRadius: radius,
    } as CSSStyleDeclaration)
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /** 组件把轮廓写进自定义属性（内联 clip-path 会被 jsdom 丢掉，见组件注释） */
  const clipOf = (wrapper: ReturnType<typeof mount>) =>
    (wrapper.element as HTMLElement).style.getPropertyValue('--nm-card-clip') ?? ''

  const nums = (path: string) => (path.match(/-?\d+\.?\d*/g) ?? []).map(Number)

  it('默认（不传 squircle）不产生轮廓 —— 零行为变化', async () => {
    stubLayout(200, 120)
    const wrapper = mount(NeumorphismCard)
    await nextTick()
    expect(clipOf(wrapper)).toBe('')
    expect(wrapper.classes()).not.toContain('nm-card--clipped')
  })

  it('squircle=true → 生成 path("…") 且打上 clipped 类', async () => {
    stubLayout(200, 120, '16px')
    const wrapper = mount(NeumorphismCard, { props: { squircle: true } })
    await nextTick()
    const clip = clipOf(wrapper)
    expect(clip.startsWith('path("M')).toBe(true)
    expect(clip.endsWith('Z")')).toBe(true)
    expect(wrapper.classes()).toContain('nm-card--clipped')
  })

  it('轮廓点全部落在盒内，且四角对称（点数 = 4×(steps+1)）', async () => {
    stubLayout(200, 120, '16px')
    const wrapper = mount(NeumorphismCard, { props: { squircle: true } })
    await nextTick()
    const n = nums(clipOf(wrapper))
    // 默认 steps=28 → 4×(28+1)=116 点 → 232 个数
    expect(n.length).toBe(232)
    const xs = n.filter((_, i) => i % 2 === 0)
    const ys = n.filter((_, i) => i % 2 === 1)
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-0.01)
    expect(Math.max(...xs)).toBeLessThanOrEqual(200.01)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-0.01)
    expect(Math.max(...ys)).toBeLessThanOrEqual(120.01)
    // 首点应落在左上角弧的起点 (0, radius)
    expect(xs[0]).toBeCloseTo(0, 1)
    expect(ys[0]).toBeCloseTo(16, 1)
  })

  it('指数越大越"方"：同参数处更贴角（x 更小）', async () => {
    stubLayout(200, 120, '24px')
    const round = mount(NeumorphismCard, { props: { squircle: 2 } })
    const square = mount(NeumorphismCard, { props: { squircle: 6 } })
    await nextTick()
    const a = nums(clipOf(round))
    const b = nums(clipOf(square))
    // 取同一参数位置比较：steps=28，k=14 即 t=π/4 处的落点（数字下标 2k=28）。
    // 同 t 下 n 越大曲线越贴角点（n→∞ 退化为直角）：
    //   n=2（圆弧）→ x = 24·(1−cos45°) ≈ 7.03
    //   n=6        → x = 24·(1−cos45°^(1/3)) ≈ 2.62
    expect(b[28]).toBeLessThan(a[28])
    expect(a[28]).toBeCloseTo(24 * (1 - Math.SQRT1_2), 1)
    // 但首点（弧起点）的 y 仍等于半径 —— 指数只改曲率不改跨度
    expect(a[1]).toBeCloseTo(24, 1)
    expect(b[1]).toBeCloseTo(24, 1)
  })

  it('半径被钳到半宽/半高（与 border-radius 的收敛行为一致）', async () => {
    stubLayout(100, 40, '80px')
    const wrapper = mount(NeumorphismCard, { props: { squircle: true } })
    await nextTick()
    const n = nums(clipOf(wrapper))
    const ys = n.filter((_, i) => i % 2 === 1)
    // 半高 = 20，故 y 最大到 40、最小到 0，不会出现 80 这样的越界
    expect(Math.max(...ys)).toBeLessThanOrEqual(40.01)
    expect(ys[0]).toBeCloseTo(20, 1)
  })

  it('clipPath prop 优先于 squircle（原样透传，不重新生成）', async () => {
    stubLayout(200, 120)
    const custom = 'path("M0 0 L10 0 L10 10 Z")'
    const wrapper = mount(NeumorphismCard, { props: { squircle: true, clipPath: custom } })
    await nextTick()
    expect(clipOf(wrapper)).toBe(custom)
    expect(wrapper.classes()).toContain('nm-card--clipped')
  })

  it('未布局（尺寸 0）时不产生轮廓 —— 避免空 path', async () => {
    stubLayout(0, 0)
    const wrapper = mount(NeumorphismCard, { props: { squircle: true } })
    await nextTick()
    expect(clipOf(wrapper)).toBe('')
    expect(wrapper.classes()).not.toContain('nm-card--clipped')
  })

  it('radius 变化后重测，轮廓跟着改（滑块能实时拖半径）', async () => {
    // 桩：圆角读的是元素内联的 --nm-card-radius，模拟真实浏览器里
    // `border-radius: var(--nm-card-radius)` 解析出的计算值
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 120,
      top: 0,
      left: 0,
      right: 200,
      bottom: 120,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      el =>
        ({
          borderTopLeftRadius:
            (el as HTMLElement).style.getPropertyValue('--nm-card-radius') || '0px',
        }) as CSSStyleDeclaration
    )

    const wrapper = mount(NeumorphismCard, { props: { squircle: true, radius: 16 } })
    await nextTick()
    // 首点的 y 就是生效半径
    expect(nums(clipOf(wrapper))[1]).toBeCloseTo(16, 1)

    await wrapper.setProps({ radius: 40 })
    await nextTick()
    expect(nums(clipOf(wrapper))[1]).toBeCloseTo(40, 1)

    // 归零：半径 < 0.5 不再画轮廓（此时 border-radius 被强制 0，缓存也不该自杀）
    await wrapper.setProps({ radius: 0 })
    await nextTick()
    expect(clipOf(wrapper)).toBe('')
  })
})
