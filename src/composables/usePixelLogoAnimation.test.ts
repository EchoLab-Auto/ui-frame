import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { usePixelLogoAnimation } from './usePixelLogoAnimation'
import type { LogoMode, UsePixelLogoAnimationReturn } from './usePixelLogoAnimation'
import { createMatchMediaMock } from '@/__test-utils__/test-helpers'

const NS = 'http://www.w3.org/2000/svg'

function createSvgRefs() {
  const svg = document.createElementNS(NS, 'svg') as SVGSVGElement
  const links = document.createElementNS(NS, 'g') as SVGGElement
  const pixels = document.createElementNS(NS, 'g') as SVGGElement
  const sparks = document.createElementNS(NS, 'g') as SVGGElement
  svg.appendChild(links)
  svg.appendChild(pixels)
  svg.appendChild(sparks)
  return {
    svg,
    links,
    pixels,
    sparks,
    svgRef: ref<SVGSVGElement | null>(svg),
    linksGroupRef: ref<SVGGElement | null>(links),
    pixelsGroupRef: ref<SVGGElement | null>(pixels),
    sparksGroupRef: ref<SVGGElement | null>(sparks),
  }
}

function withAnimation(opts: { mode?: LogoMode; autoplay?: boolean } = {}) {
  const refs = createSvgRefs()
  let result: UsePixelLogoAnimationReturn | null = null

  const Comp = defineComponent({
    setup() {
      result = usePixelLogoAnimation({
        linksGroupRef: refs.linksGroupRef,
        pixelsGroupRef: refs.pixelsGroupRef,
        sparksGroupRef: refs.sparksGroupRef,
        svgRef: refs.svgRef,
        ...opts,
      })
      return () => h('div')
    },
  })

  const wrapper = mount(Comp)
  return { api: () => result!, ...refs, unmount: () => wrapper.unmount() }
}

describe('usePixelLogoAnimation', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
  })

  afterEach(() => {
    rafSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('should create 31 pixel rects, 10 links and 10 sparks on mount', () => {
    const { pixels, links, sparks } = withAnimation()
    expect(pixels.querySelectorAll('rect')).toHaveLength(31)
    expect(links.querySelectorAll('line')).toHaveLength(10)
    expect(sparks.querySelectorAll('circle')).toHaveLength(10)
  })

  it('should start in the given mode and switch via setMode', () => {
    const { api } = withAnimation({ mode: 'liquid' })
    expect(api().mode.value).toBe('liquid')
    api().setMode('wave')
    expect(api().mode.value).toBe('wave')
  })

  it('should detect reduced motion from the media query', () => {
    vi.stubGlobal('matchMedia', vi.fn(createMatchMediaMock(true)))
    const { api } = withAnimation()
    expect(api().isReducedMotion.value).toBe(true)
  })

  it('should remove the media listener with the same handler on unmount', () => {
    const mql = createMatchMediaMock(false)()
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
    const { unmount } = withAnimation()

    expect(mql.addEventListener).toHaveBeenCalledTimes(1)
    const addedHandler = (mql.addEventListener as Mock).mock.calls[0][1]

    unmount()
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1)
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', addedHandler)
  })

  it('should cancel animation frame on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const { unmount } = withAnimation()
    unmount()
    expect(cancelSpy).toHaveBeenCalledWith(1)
    cancelSpy.mockRestore()
  })

  it('should keep the current mode when replaying', () => {
    const { api } = withAnimation({ mode: 'wave' })
    api().replay()
    expect(api().mode.value).toBe('wave')
  })
})
