import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismCard from './NeumorphismCard.vue'

describe('NeumorphismCard', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismCard, { slots: { default: 'Content' } })
    expect(wrapper.classes()).toContain('nm-card')
    expect(wrapper.classes()).toContain('nm-card--elevation-2')
    expect(wrapper.classes()).toContain('nm-card--radius-large')
    expect(wrapper.text()).toBe('Content')
  })

  it('should apply elevation classes', () => {
    for (let i = -4; i <= 4; i++) {
      const wrapper = mount(NeumorphismCard, { props: { elevation: i } })
      expect(wrapper.classes()).toContain(`nm-card--elevation-${i}`)
    }
  })

  it('should apply radius classes', () => {
    const radii = ['small', 'medium', 'large', 'xl'] as const
    for (const radius of radii) {
      const wrapper = mount(NeumorphismCard, { props: { radius } })
      expect(wrapper.classes()).toContain(`nm-card--radius-${radius}`)
    }
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
})
