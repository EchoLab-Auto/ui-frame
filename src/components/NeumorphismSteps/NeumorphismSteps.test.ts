import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismSteps from './NeumorphismSteps.vue'

const steps = [
  { key: '1', title: 'Step 1', description: 'First step' },
  { key: '2', title: 'Step 2', description: 'Second step' },
  { key: '3', title: 'Step 3', description: 'Third step' },
]

describe('NeumorphismSteps', () => {
  it('renders all three steps', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0 } })
    expect(wrapper.findAll('.nm-steps__item')).toHaveLength(3)
  })

  it('marks first step as active when current is 0', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0 } })
    expect(wrapper.find('.nm-steps__item--active').exists()).toBe(true)
  })

  it('renders step titles', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0 } })
    expect(wrapper.text()).toContain('Step 1')
    expect(wrapper.text()).toContain('Step 3')
  })

  it('renders step descriptions', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0 } })
    expect(wrapper.text()).toContain('First step')
  })

  it('supports horizontal direction by default', () => {
    const wrapper = mount(NeumorphismSteps, { props: { steps, current: 0 } })
    expect(wrapper.find('.nm-steps').exists()).toBe(true)
  })

  it('supports vertical direction', () => {
    const wrapper = mount(NeumorphismSteps, {
      props: { steps, current: 0, direction: 'vertical' },
    })
    expect(wrapper.find('.nm-steps--vertical').exists()).toBe(true)
  })

  it('applies error status from step config', () => {
    const stepsWithError = [
      { key: '1', title: 'S1', status: 'error' as const },
      { key: '2', title: 'S2' },
    ]
    const wrapper = mount(NeumorphismSteps, {
      props: { steps: stepsWithError, current: -1 },
    })
    expect(wrapper.find('.nm-steps__circle--error').exists()).toBe(true)
  })
})
