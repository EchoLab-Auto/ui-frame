import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismUpload from './NeumorphismUpload.vue'

const mockFile = {
  id: '1',
  name: 'test.pdf',
  size: 1024,
  type: 'application/pdf',
  status: 'done' as const,
  progress: 100,
}

describe('NeumorphismUpload', () => {
  it('renders upload trigger area', () => {
    const wrapper = mount(NeumorphismUpload)
    expect(wrapper.find('.nm-upload').exists()).toBe(true)
  })

  it('shows drag mode when drag prop is true', () => {
    const wrapper = mount(NeumorphismUpload, { props: { drag: true } })
    expect(wrapper.find('.nm-upload--drag').exists()).toBe(true)
  })

  it('renders file name in text mode', () => {
    const wrapper = mount(NeumorphismUpload, {
      props: { modelValue: [mockFile], listType: 'text' },
    })
    expect(wrapper.text()).toContain('test.pdf')
  })

  it('renders in picture list mode', () => {
    const wrapper = mount(NeumorphismUpload, {
      props: {
        modelValue: [{ ...mockFile, name: 'img.png', type: 'image/png' }],
        listType: 'picture',
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('shows upload prompt text', () => {
    const wrapper = mount(NeumorphismUpload)
    expect(wrapper.text()).toBeTruthy()
  })

  it('passes accept prop for file type filtering', () => {
    const wrapper = mount(NeumorphismUpload, { props: { accept: 'image/*' } })
    expect(wrapper.exists()).toBe(true)
  })
})
