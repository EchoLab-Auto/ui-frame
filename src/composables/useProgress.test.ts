import { describe, it, expect, vi, afterEach } from 'vitest'
import { ref, defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useProgress } from './useProgress'
import type { UseProgressReturn, ProgressSize } from './useProgress'
import { createMatchMediaMock } from '@/__test-utils__/test-helpers'

function withProgress(options: {
  modelValue?: number
  max?: number
  indeterminate?: boolean
  size?: ProgressSize
}) {
  const modelValue = ref(options.modelValue ?? 0)
  const max = ref(options.max ?? 100)
  const indeterminate = ref(options.indeterminate ?? false)
  const size = ref<ProgressSize>(options.size ?? 'medium')

  let result: UseProgressReturn | null = null
  const Comp = defineComponent({
    setup() {
      result = useProgress({ modelValue, max, indeterminate, size })
      return () => h('div')
    },
  })
  const wrapper = mount(Comp)
  return {
    api: () => result!,
    modelValue,
    max,
    indeterminate,
    size,
    unmount: () => wrapper.unmount(),
  }
}

describe('useProgress', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('should clamp percentage into [0, 100]', () => {
    const { api, modelValue } = withProgress({ modelValue: 50 })
    expect(api().percentage.value).toBe(50)

    modelValue.value = 150
    expect(api().percentage.value).toBe(100)

    modelValue.value = -20
    expect(api().percentage.value).toBe(0)
  })

  it('should respect max when computing percentage', () => {
    const { api } = withProgress({ modelValue: 30, max: 200 })
    expect(api().percentage.value).toBe(15)
  })

  it('should return 0 percentage while indeterminate', () => {
    const { api } = withProgress({ modelValue: 80, indeterminate: true })
    expect(api().percentage.value).toBe(0)
    expect(api().isComplete.value).toBe(false)
  })

  it('should report isComplete only at 100% and not while indeterminate', () => {
    const { api, modelValue, indeterminate } = withProgress({ modelValue: 100 })
    expect(api().isComplete.value).toBe(true)

    indeterminate.value = true
    expect(api().isComplete.value).toBe(false)

    indeterminate.value = false
    modelValue.value = 99
    expect(api().isComplete.value).toBe(false)
  })

  it('should initialize displayPercentage to the current percentage', () => {
    const { api } = withProgress({ modelValue: 42 })
    expect(api().displayPercentage.value).toBe(42)
  })

  it('should snap displayPercentage instantly when reduced motion is preferred', async () => {
    vi.stubGlobal('matchMedia', vi.fn(createMatchMediaMock(true)))
    const { api, modelValue } = withProgress({ modelValue: 10 })

    modelValue.value = 90
    await nextTick()
    expect(api().displayPercentage.value).toBe(90)
  })

  it('should animate displayPercentage towards the target with ease-out', async () => {
    vi.stubGlobal('matchMedia', vi.fn(createMatchMediaMock(false)))
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    const rafCallbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })

    const { api, modelValue } = withProgress({ modelValue: 0 })
    modelValue.value = 100
    await nextTick()

    expect(rafCallbacks).toHaveLength(1)
    // t = (1325 - 1000) / 650 = 0.5 → easeOutCubic(0.5) = 0.875
    rafCallbacks[0](1325)
    expect(api().displayPercentage.value).toBe(88)

    // t = 1 → animation completes and stops scheduling further frames
    rafCallbacks[1](1650)
    expect(api().displayPercentage.value).toBe(100)
    expect(rafCallbacks).toHaveLength(2)
  })

  it('should cancel a running label animation on unmount', async () => {
    vi.stubGlobal('matchMedia', vi.fn(createMatchMediaMock(false)))
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)

    const { modelValue, unmount } = withProgress({ modelValue: 0 })
    modelValue.value = 80
    await nextTick()
    unmount()
    expect(cancelSpy).toHaveBeenCalledWith(1)
  })

  it('should compute circular geometry per size', () => {
    const { api, size } = withProgress({ size: 'medium' })
    expect(api().circleSize.value).toBe(120)
    expect(api().strokeWidth.value).toBe(7)
    expect(api().radius.value).toBe((120 - 7) / 2)

    size.value = 'small'
    expect(api().circleSize.value).toBe(64)
    expect(api().strokeWidth.value).toBe(4)

    size.value = 'large'
    expect(api().circleSize.value).toBe(160)
    expect(api().strokeWidth.value).toBe(10)
  })

  it('should map percentage to dashOffset', () => {
    const { api } = withProgress({ modelValue: 25 })
    const c = api().circumference.value
    expect(api().dashOffset.value).toBeCloseTo(c * 0.75)
  })
})
