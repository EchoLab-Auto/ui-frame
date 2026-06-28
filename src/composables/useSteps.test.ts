import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useSteps } from './useSteps'
import type { StepItem } from './useSteps'

describe('useSteps', () => {
  const steps: StepItem[] = [
    { key: '1', title: 'Step 1' },
    { key: '2', title: 'Step 2' },
    { key: '3', title: 'Step 3' },
  ]

  it('should return current step based on current index', () => {
    const current = ref(0)
    const { currentStep } = useSteps({ steps: ref(steps), current })
    expect(currentStep.value).toEqual(steps[0])
  })

  it('should advance to next step', async () => {
    const current = ref(0)
    const { next } = useSteps({ steps: ref(steps), current })
    await next()
    expect(current.value).toBe(1)
  })

  it('should not advance beyond last step', async () => {
    const current = ref(2)
    const { next } = useSteps({ steps: ref(steps), current })
    await next()
    expect(current.value).toBe(2)
  })

  it('should go to previous step', () => {
    const current = ref(1)
    const { prev } = useSteps({ steps: ref(steps), current })
    prev()
    expect(current.value).toBe(0)
  })

  it('should not go before first step', () => {
    const current = ref(0)
    const { prev } = useSteps({ steps: ref(steps), current })
    prev()
    expect(current.value).toBe(0)
  })

  it('should jump to a specific step', () => {
    const current = ref(0)
    const { setCurrent } = useSteps({ steps: ref(steps), current })
    setCurrent(2)
    expect(current.value).toBe(2)
  })

  it('should not jump to out-of-range index', () => {
    const current = ref(0)
    const { setCurrent } = useSteps({ steps: ref(steps), current })
    setCurrent(-1)
    expect(current.value).toBe(0)
    setCurrent(10)
    expect(current.value).toBe(0)
  })

  it('should not jump to same index', () => {
    const current = ref(1)
    const { setCurrent } = useSteps({ steps: ref(steps), current })
    setCurrent(1)
    expect(current.value).toBe(1)
  })

  it('should validate before next step', async () => {
    const current = ref(0)
    const { next } = useSteps({ steps: ref(steps), current })
    const validator = () => false
    await next(validator)
    expect(current.value).toBe(0)
  })

  it('should proceed when validation passes', async () => {
    const current = ref(0)
    const { next } = useSteps({ steps: ref(steps), current })
    await next(() => true)
    expect(current.value).toBe(1)
  })

  it('should handle async validation', async () => {
    const current = ref(0)
    const { next } = useSteps({ steps: ref(steps), current })
    await next(() => Promise.resolve(true))
    expect(current.value).toBe(1)
  })

  it('should track manual step status', () => {
    const current = ref(0)
    const { setStepStatus } = useSteps({ steps: ref(steps), current })
    // setStepStatus stores in a map; no direct getter exposed,
    // but it shouldn't throw
    setStepStatus('1', 'finish')
    setStepStatus('2', 'error')
  })

  it('should work with empty steps', () => {
    const current = ref(0)
    const { currentStep } = useSteps({ steps: ref([]), current })
    expect(currentStep.value).toBeUndefined()
  })
})
