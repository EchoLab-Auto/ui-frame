import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismThemeToggle from './NeumorphismThemeToggle.vue'
import { ConfigKey } from '@/composables/useConfig'

describe('NeumorphismThemeToggle', () => {
  it('should render three theme options with labels by default', () => {
    const wrapper = mount(NeumorphismThemeToggle)
    expect(wrapper.classes()).toContain('nm-theme-toggle')
    expect(wrapper.classes()).toContain('nm-theme-toggle--medium')
    expect(wrapper.findAll('.nm-theme-toggle__btn')).toHaveLength(3)
    expect(wrapper.findAll('.nm-theme-toggle__label')).toHaveLength(3)
  })

  it('should hide labels when size prop is small', () => {
    const wrapper = mount(NeumorphismThemeToggle, { props: { size: 'small' } })
    expect(wrapper.classes()).toContain('nm-theme-toggle--small')
    expect(wrapper.findAll('.nm-theme-toggle__label')).toHaveLength(0)
  })

  it('should hide auto option when disableAuto', () => {
    const wrapper = mount(NeumorphismThemeToggle, { props: { disableAuto: true } })
    expect(wrapper.findAll('.nm-theme-toggle__btn')).toHaveLength(2)
  })

  it('should emit update:modelValue and change on select', async () => {
    const wrapper = mount(NeumorphismThemeToggle, { props: { modelValue: 'auto' } })
    await wrapper.findAll('.nm-theme-toggle__btn')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['light'])
    expect(wrapper.emitted('change')![0]).toEqual(['light'])
  })

  // 级联配置回归：标签显隐必须走级联后的 size（此前只看原始 prop，
  // 全局配置 themeToggle.size: 'small' 时标签不隐藏）
  it('should hide labels when global config themeToggle.size is small', () => {
    const wrapper = mount(NeumorphismThemeToggle, {
      global: {
        provide: {
          [ConfigKey]: { value: { themeToggle: { size: 'small' } } },
        },
      },
    })
    expect(wrapper.classes()).toContain('nm-theme-toggle--small')
    expect(wrapper.findAll('.nm-theme-toggle__label')).toHaveLength(0)
  })

  it('should let explicit size prop override global config', () => {
    const wrapper = mount(NeumorphismThemeToggle, {
      props: { size: 'large' },
      global: {
        provide: {
          [ConfigKey]: { value: { themeToggle: { size: 'small' } } },
        },
      },
    })
    expect(wrapper.classes()).toContain('nm-theme-toggle--large')
    expect(wrapper.findAll('.nm-theme-toggle__label')).toHaveLength(3)
  })

  it('should apply disableAuto from global config', () => {
    const wrapper = mount(NeumorphismThemeToggle, {
      global: {
        provide: {
          [ConfigKey]: { value: { themeToggle: { disableAuto: true } } },
        },
      },
    })
    expect(wrapper.findAll('.nm-theme-toggle__btn')).toHaveLength(2)
  })
})
