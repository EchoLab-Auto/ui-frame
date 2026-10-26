import { describe, it, expect } from 'vitest'
import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import NeumorphismButton from './NeumorphismButton.vue'
import { ConfigKey } from '@/composables/useConfig'

describe('NeumorphismButton', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismButton, { slots: { default: 'Click me' } })
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Click me')
    expect(btn.classes()).toContain('nm-button')
    expect(btn.classes()).toContain('nm-button--raised')
    expect(btn.classes()).toContain('nm-button--medium')
    expect(btn.classes()).toContain('nm-button--rounded')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('should apply variant classes', () => {
    // 玻璃三档同样是变体：基础档一律落 `raised`，玻璃类另行叠加
    const plain = ['raised', 'pressed', 'primary', 'glow'] as const
    for (const variant of plain) {
      const wrapper = mount(NeumorphismButton, { props: { variant } })
      expect(wrapper.find('button').classes()).toContain(`nm-button--${variant}`)
    }

    const glassTiers = [
      ['glass', 'float'],
      ['glass-raised', 'raised'],
      ['glass-pressed', 'pressed'],
    ] as const
    for (const [variant, tier] of glassTiers) {
      const wrapper = mount(NeumorphismButton, { props: { variant } })
      const classes = wrapper.find('button').classes()
      expect(classes).toContain('nm-button--glass')
      expect(classes).toContain(`nm-button--glass-${tier}`)
      expect(classes).toContain('nm-button--raised')
    }
  })

  describe('glass morphism（玻璃是 variant 的一档）', () => {
    it('variant="glass" → float 档', () => {
      const classes = mount(NeumorphismButton, { props: { variant: 'glass' } })
        .find('button')
        .classes()
      expect(classes).toContain('nm-button--glass')
      expect(classes).toContain('nm-button--glass-float')
      expect(classes).not.toContain('nm-button--glass-raised')
      expect(classes).not.toContain('nm-button--glass-pressed')
    })

    it('variant="glass-raised" → raised 档', () => {
      const classes = mount(NeumorphismButton, { props: { variant: 'glass-raised' } })
        .find('.nm-button')
        .classes()
      expect(classes).toContain('nm-button--glass')
      expect(classes).toContain('nm-button--glass-raised')
      expect(classes).not.toContain('nm-button--glass-float')
    })

    it('variant="glass-pressed" → pressed 档', () => {
      const classes = mount(NeumorphismButton, { props: { variant: 'glass-pressed' } })
        .find('.nm-button')
        .classes()
      expect(classes).toContain('nm-button--glass')
      expect(classes).toContain('nm-button--glass-pressed')
      expect(classes).not.toContain('nm-button--glass-float')
    })

    it('三个玻璃变体各自只挂一个档位类', () => {
      for (const variant of ['glass', 'glass-raised', 'glass-pressed'] as const) {
        const classes = mount(NeumorphismButton, { props: { variant } })
          .find('.nm-button')
          .classes()
        expect(
          classes.filter(c => /^nm-button--glass-(float|raised|pressed)$/.test(c))
        ).toHaveLength(1)
      }
    })

    it('不再接受 glass prop：传了也不会变成玻璃（属性落到原生 button 上）', () => {
      // @ts-expect-error glass 已从 props 中移除，这里故意用旧写法验证不会静默生效
      const wrapper = mount(NeumorphismButton, { props: { glass: 'raised' } })
      const classes = wrapper.find('.nm-button').classes()
      expect(classes.some(c => c.startsWith('nm-button--glass'))).toBe(false)
    })

    it('全局配置 button.variant 可设成玻璃变体', () => {
      const wrapper = mount(NeumorphismButton, {
        global: {
          provide: {
            [ConfigKey as symbol]: computed(() => ({
              button: { variant: 'glass-pressed' as const },
            })),
          },
        },
      })
      const classes = wrapper.find('.nm-button').classes()
      expect(classes).toContain('nm-button--glass-pressed')
    })

    it('显式 variant 覆盖全局配置', () => {
      const wrapper = mount(NeumorphismButton, {
        props: { variant: 'raised' },
        global: {
          provide: {
            [ConfigKey as symbol]: computed(() => ({
              button: { variant: 'glass-pressed' as const },
            })),
          },
        },
      })
      const classes = wrapper.find('.nm-button').classes()
      expect(classes.some(c => c.startsWith('nm-button--glass'))).toBe(false)
    })

    it('默认不挂任何玻璃类', () => {
      const wrapper = mount(NeumorphismButton)
      expect(
        wrapper
          .find('.nm-button')
          .classes()
          .some(c => c.startsWith('nm-button--glass'))
      ).toBe(false)
    })
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismButton, { props: { size } })
      expect(wrapper.find('button').classes()).toContain(`nm-button--${size}`)
    }
  })

  it('should apply shape classes', () => {
    const shapes = ['rounded', 'pill', 'circle'] as const
    for (const shape of shapes) {
      const wrapper = mount(NeumorphismButton, { props: { shape } })
      expect(wrapper.find('button').classes()).toContain(`nm-button--${shape}`)
    }
  })

  it('should emit click event', () => {
    const wrapper = mount(NeumorphismButton)
    wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('should not emit click when disabled', () => {
    const wrapper = mount(NeumorphismButton, { props: { disabled: true } })
    wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('should not emit click when loading', () => {
    const wrapper = mount(NeumorphismButton, { props: { loading: true } })
    wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('should have disabled attribute when disabled', () => {
    const wrapper = mount(NeumorphismButton, { props: { disabled: true } })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').classes()).toContain('nm-button--disabled')
  })

  it('should have disabled attribute when loading', () => {
    const wrapper = mount(NeumorphismButton, { props: { loading: true } })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').classes()).toContain('nm-button--loading')
  })

  it('should render loading spinner', () => {
    const wrapper = mount(NeumorphismButton, {
      props: { loading: true },
      slots: { default: 'Save' },
    })
    expect(wrapper.find('.nm-button__spinner').exists()).toBe(true)
    expect(wrapper.find('.nm-button__content--hidden').exists()).toBe(true)
  })

  it('should set aria-label', () => {
    const wrapper = mount(NeumorphismButton, { props: { ariaLabel: 'Close dialog' } })
    expect(wrapper.find('button').attributes('aria-label')).toBe('Close dialog')
  })

  it('should set aria-busy when loading', () => {
    const wrapper = mount(NeumorphismButton, { props: { loading: true } })
    expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
  })

  it('should not set aria-busy when not loading', () => {
    const wrapper = mount(NeumorphismButton)
    expect(wrapper.find('button').attributes('aria-busy')).toBeUndefined()
  })

  it('should support different button types', () => {
    const types = ['button', 'submit', 'reset'] as const
    for (const type of types) {
      const wrapper = mount(NeumorphismButton, { props: { type } })
      expect(wrapper.find('button').attributes('type')).toBe(type)
    }
  })

  it('should set form attribute', () => {
    const wrapper = mount(NeumorphismButton, { props: { form: 'my-form' } })
    expect(wrapper.find('button').attributes('form')).toBe('my-form')
  })

  it('should render slot content', () => {
    const wrapper = mount(NeumorphismButton, {
      slots: { default: '<span class="icon">*</span> Save' },
    })
    expect(wrapper.find('.icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('Save')
  })

  // 级联配置回归：显式 prop > 全局配置 > 默认值（withDefaults 不得遮蔽全局配置）
  it('should apply variant/size from global config when props are absent', () => {
    const wrapper = mount(NeumorphismButton, {
      slots: { default: 'x' },
      global: {
        provide: {
          [ConfigKey]: { value: { button: { variant: 'pressed', size: 'large' } } },
        },
      },
    })
    expect(wrapper.classes()).toContain('nm-button--pressed')
    expect(wrapper.classes()).toContain('nm-button--large')
  })

  it('should let explicit props override global config', () => {
    const wrapper = mount(NeumorphismButton, {
      props: { variant: 'glow', size: 'small' },
      slots: { default: 'x' },
      global: {
        provide: {
          [ConfigKey]: { value: { button: { variant: 'pressed', size: 'large' } } },
        },
      },
    })
    expect(wrapper.classes()).toContain('nm-button--glow')
    expect(wrapper.classes()).toContain('nm-button--small')
  })
})
