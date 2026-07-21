import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeumorphismLogo from './NeumorphismLogo.vue'

describe('NeumorphismLogo', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
  })

  afterEach(() => {
    rafSpy.mockRestore()
  })

  it('should render with default props', () => {
    const wrapper = mount(NeumorphismLogo)
    expect(wrapper.classes()).toContain('nm-logo')
    expect(wrapper.classes()).toContain('nm-logo--medium')
    expect(wrapper.find('.nm-logo__svg').exists()).toBe(true)
  })

  it('should apply size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    for (const size of sizes) {
      const wrapper = mount(NeumorphismLogo, { props: { size } })
      expect(wrapper.classes()).toContain(`nm-logo--${size}`)
      wrapper.unmount()
    }
  })

  it('should render custom width', () => {
    const wrapper = mount(NeumorphismLogo, { props: { width: 300 } })
    expect((wrapper.element as HTMLElement).style.width).toBe('300px')
  })

  it('should emit mode-change when slot setMode is invoked', async () => {
    const wrapper = mount(NeumorphismLogo, {
      props: { mode: 'pulse' },
      slots: {
        default: `
          <template #default="{ setMode }">
            <button class="slot-set-mode" @click="setMode('liquid')">Liquid</button>
          </template>
        `,
      },
    })
    await wrapper.find('.slot-set-mode').trigger('click')
    await nextTick()
    expect(wrapper.emitted('mode-change')).toBeTruthy()
    expect(wrapper.emitted('mode-change')![0]).toEqual(['liquid'])
    expect(wrapper.emitted('update:mode')![0]).toEqual(['liquid'])
  })

  it('should expose slot props', () => {
    const wrapper = mount(NeumorphismLogo, {
      slots: {
        default: `
          <template #default="{ mode, setMode, replay }">
            <button class="slot-mode" @click="setMode('wave')">{{ mode }}</button>
            <button class="slot-replay" @click="replay()">Replay</button>
          </template>
        `,
      },
    })
    expect(wrapper.find('.slot-mode').exists()).toBe(true)
    expect(wrapper.find('.slot-replay').exists()).toBe(true)
  })

  it('should clean up rAF on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')
    const wrapper = mount(NeumorphismLogo)
    wrapper.unmount()
    expect(cancelSpy).toHaveBeenCalled()
    cancelSpy.mockRestore()
  })
})
