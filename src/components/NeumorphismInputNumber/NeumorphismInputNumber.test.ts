import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismInputNumber from './NeumorphismInputNumber.vue'

describe('NeumorphismInputNumber', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders value and controls', () => {
    const wrapper = mount(NeumorphismInputNumber, { props: { modelValue: 3 } })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('3')
    expect(wrapper.find('.nm-input-number__btn--decrement').exists()).toBe(true)
    expect(wrapper.find('.nm-input-number__btn--increment').exists()).toBe(true)
  })

  it('到达 min 时 decrement 按钮禁用，max 时 increment 按钮禁用', () => {
    const atMin = mount(NeumorphismInputNumber, { props: { modelValue: 0, min: 0, max: 10 } })
    expect(atMin.find('.nm-input-number__btn--decrement').attributes('disabled')).toBeDefined()
    expect(atMin.find('.nm-input-number__btn--increment').attributes('disabled')).toBeUndefined()

    const atMax = mount(NeumorphismInputNumber, { props: { modelValue: 10, min: 0, max: 10 } })
    expect(atMax.find('.nm-input-number__btn--increment').attributes('disabled')).toBeDefined()
    expect(atMax.find('.nm-input-number__btn--decrement').attributes('disabled')).toBeUndefined()
  })

  it('界内时两个按钮均可操作；空值也可操作', () => {
    const mid = mount(NeumorphismInputNumber, { props: { modelValue: 5, min: 0, max: 10 } })
    expect(mid.find('.nm-input-number__btn--decrement').attributes('disabled')).toBeUndefined()
    expect(mid.find('.nm-input-number__btn--increment').attributes('disabled')).toBeUndefined()

    const empty = mount(NeumorphismInputNumber, { props: { modelValue: undefined } })
    expect(empty.find('.nm-input-number__btn--decrement').attributes('disabled')).toBeUndefined()
    expect(empty.find('.nm-input-number__btn--increment').attributes('disabled')).toBeUndefined()
  })

  it('长按按钮连续步进，抬起即停', async () => {
    vi.useFakeTimers()
    const wrapper = mount(NeumorphismInputNumber, {
      props: { modelValue: 3, min: 0, max: 100 },
    })
    const inc = wrapper.find('.nm-input-number__btn--increment')

    await inc.trigger('pointerdown')
    // pointerdown 立即步进一次
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)

    // 400ms 延迟 + 3 个 80ms 间隔 → 再步进 3 次
    vi.advanceTimersByTime(400 + 80 * 3)
    expect(wrapper.emitted('update:modelValue')!.length).toBe(4)

    // 抬起后停止
    await inc.trigger('pointerup')
    vi.advanceTimersByTime(500)
    expect(wrapper.emitted('update:modelValue')!.length).toBe(4)
  })

  it('移出按钮（pointerleave）同样停止连续步进', async () => {
    vi.useFakeTimers()
    const wrapper = mount(NeumorphismInputNumber, {
      props: { modelValue: 3, min: 0, max: 100 },
    })
    const inc = wrapper.find('.nm-input-number__btn--increment')

    await inc.trigger('pointerdown')
    vi.advanceTimersByTime(400 + 80)
    const count = wrapper.emitted('update:modelValue')!.length
    expect(count).toBeGreaterThan(1)

    await inc.trigger('pointerleave')
    vi.advanceTimersByTime(500)
    expect(wrapper.emitted('update:modelValue')!.length).toBe(count)
  })
})
