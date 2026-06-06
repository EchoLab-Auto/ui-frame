import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismAvatar from './NeumorphismAvatar.vue'

describe('NeumorphismAvatar', () => {
  it('should render with default props', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: 'https://example.com/avatar.jpg' } })
    expect(wrapper.classes()).toContain('nm-avatar')
    expect(wrapper.classes()).toContain('nm-avatar--medium')
    expect(wrapper.classes()).toContain('nm-avatar--circle')
    expect(wrapper.find('img').exists()).toBe(true)
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismAvatar, { props: { size, src: '' } })
      expect(wrapper.classes()).toContain(`nm-avatar--${size}`)
    }
  })

  it('should apply shape classes', () => {
    const shapes = ['circle', 'rounded'] as const
    for (const shape of shapes) {
      const wrapper = mount(NeumorphismAvatar, { props: { shape, src: '' } })
      expect(wrapper.classes()).toContain(`nm-avatar--${shape}`)
    }
  })

  it('should render initials fallback', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: '', initials: 'John Doe' } })
    expect(wrapper.find('.nm-avatar__fallback').text()).toBe('JO')
  })

  it('should render alt fallback', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: '', alt: 'Alice' } })
    expect(wrapper.find('.nm-avatar__fallback').text()).toBe('A')
  })

  it('should render question mark when no fallback', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: '' } })
    expect(wrapper.find('.nm-avatar__fallback').text()).toBe('?')
  })

  it('should render fallback slot', () => {
    const wrapper = mount(NeumorphismAvatar, {
      props: { src: '' },
      slots: { fallback: '<span class="custom-fallback">@</span>' },
    })
    expect(wrapper.find('.custom-fallback').exists()).toBe(true)
  })

  it('should set alt attribute', () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: 'test.jpg', alt: 'User avatar' } })
    expect(wrapper.find('img').attributes('alt')).toBe('User avatar')
  })

  it('should emit error on image load failure', async () => {
    const wrapper = mount(NeumorphismAvatar, { props: { src: 'bad.jpg' } })
    await wrapper.find('img').trigger('error')
    expect(wrapper.emitted('error')).toBeDefined()
  })
})
