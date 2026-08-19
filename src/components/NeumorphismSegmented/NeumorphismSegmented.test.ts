import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismSegmented from './NeumorphismSegmented.vue'

const OPTIONS = [
  { label: '无约束', value: 'none' },
  { label: '白名单', value: 'allowlist' },
  { label: '黑名单', value: 'denylist', disabled: true },
]

describe('NeumorphismSegmented', () => {
  it('渲染 radiogroup 与全部选项', () => {
    const wrapper = mount(NeumorphismSegmented, { props: { options: OPTIONS } })
    expect(wrapper.classes()).toContain('nm-segmented')
    expect(wrapper.attributes('role')).toBe('radiogroup')
    const items = wrapper.findAll('.nm-segmented__item')
    expect(items).toHaveLength(3)
    expect(items[0].attributes('role')).toBe('radio')
  })

  it('选中项带 active 类与 aria-checked', async () => {
    const wrapper = mount(NeumorphismSegmented, {
      props: { options: OPTIONS, modelValue: 'none' },
    })
    const items = wrapper.findAll('.nm-segmented__item')
    expect(items[0].classes()).toContain('nm-segmented__item--active')
    expect(items[0].attributes('aria-checked')).toBe('true')

    await items[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['allowlist'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['allowlist'])
  })

  it('禁用项点击不触发事件', async () => {
    const wrapper = mount(NeumorphismSegmented, {
      props: { options: OPTIONS, modelValue: 'none' },
    })
    const disabled = wrapper.findAll('.nm-segmented__item')[2]
    expect(disabled.attributes('disabled')).toBeDefined()
    await disabled.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('方向键导航并选中', async () => {
    const wrapper = mount(NeumorphismSegmented, {
      props: { options: OPTIONS, modelValue: 'none' },
    })
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['allowlist'])
  })

  it('应用尺寸修饰类', () => {
    const wrapper = mount(NeumorphismSegmented, {
      props: { options: OPTIONS, size: 'small' },
    })
    expect(wrapper.classes()).toContain('nm-segmented--small')
  })
})
