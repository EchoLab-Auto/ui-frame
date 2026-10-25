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
    const variants = ['raised', 'pressed', 'primary', 'glow', 'glass', 'glass-raised'] as const
    for (const variant of variants) {
      const wrapper = mount(NeumorphismButton, { props: { variant } })
      expect(wrapper.find('button').classes()).toContain(`nm-button--${variant}`)
    }
  })

  describe('glass morphism（与 NeumorphismCard 共用档位）', () => {
    it('legacy variant="glass" 折叠为 float 档，并保留旧类名', () => {
      const wrapper = mount(NeumorphismButton, { props: { variant: 'glass' } })
      const classes = wrapper.find('button').classes()
      // 旧类名仍在（向后兼容）
      expect(classes).toContain('nm-button--glass')
      // 新档位类
      expect(classes).toContain('nm-button--glass-float')
      // 材质由玻璃接管，基础变体回落 raised
      expect(classes).toContain('nm-button--raised')
      expect(classes).not.toContain('nm-button--glass-raised')
    })

    it('legacy variant="glass-raised" 折叠为 raised 档', () => {
      const wrapper = mount(NeumorphismButton, { props: { variant: 'glass-raised' } })
      const classes = wrapper.find('.nm-button').classes()
      expect(classes).toContain('nm-button--glass')
      expect(classes).toContain('nm-button--glass-raised')
      expect(classes).toContain('nm-button--raised')
      expect(classes).not.toContain('nm-button--glass-float')
    })

    it('glass prop 接受三档并与 variant 正交', () => {
      for (const glass of ['float', 'raised', 'pressed'] as const) {
        const wrapper = mount(NeumorphismButton, { props: { glass, variant: 'primary' } })
        const classes = wrapper.find('.nm-button').classes()
        expect(classes).toContain('nm-button--glass')
        expect(classes).toContain(`nm-button--glass-${glass}`)
        // variant 仍是 primary（玻璃只换材质，不吞掉变体）
        expect(classes).toContain('nm-button--primary')
        expect(
          classes.filter(c => /^nm-button--glass-(float|raised|pressed)$/.test(c))
        ).toHaveLength(1)
      }
    })

    it('glass: true 是 float 的简写', () => {
      const wrapper = mount(NeumorphismButton, { props: { glass: true } })
      const classes = wrapper.find('.nm-button').classes()
      expect(classes).toContain('nm-button--glass')
      expect(classes).toContain('nm-button--glass-float')
    })

    it('explicit glass prop 覆盖旧 variant 的玻璃语义', () => {
      const wrapper = mount(NeumorphismButton, {
        props: { variant: 'glass', glass: 'pressed' },
      })
      const classes = wrapper.find('.nm-button').classes()
      expect(classes).toContain('nm-button--glass-pressed')
      expect(classes).not.toContain('nm-button--glass-float')
    })

    it('glass: false 显式关闭旧 variant 带来的玻璃', () => {
      const wrapper = mount(NeumorphismButton, { props: { variant: 'glass', glass: false } })
      const classes = wrapper.find('.nm-button').classes()
      expect(classes.some(c => c.startsWith('nm-button--glass'))).toBe(false)
    })

    it('未传 glass 时应用全局配置 button.glass', () => {
      const wrapper = mount(NeumorphismButton, {
        global: {
          provide: {
            [ConfigKey as symbol]: computed(() => ({ button: { glass: 'pressed' as const } })),
          },
        },
      })
      expect(wrapper.find('.nm-button').classes()).toContain('nm-button--glass-pressed')
    })

    it('显式 prop 覆盖全局配置的玻璃档位', () => {
      const wrapper = mount(NeumorphismButton, {
        props: { glass: 'raised' },
        global: {
          provide: {
            [ConfigKey as symbol]: computed(() => ({ button: { glass: 'pressed' as const } })),
          },
        },
      })
      const classes = wrapper.find('.nm-button').classes()
      expect(classes).toContain('nm-button--glass-raised')
      expect(classes).not.toContain('nm-button--glass-pressed')
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
