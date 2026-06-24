import { computed, type Ref, type ComputedRef } from 'vue'

/**
 * Status of an individual step in the workflow.
 * - `wait`: not yet reached
 * - `process`: the current active step
 * - `finish`: completed successfully
 * - `error`: completed with an error
 */
export type StepStatus = 'wait' | 'process' | 'finish' | 'error'

/** Descriptor for a single step in a stepped workflow. */
export interface StepItem {
  /** Unique key for the step (used for identity and status mapping). */
  key: string
  /** Display title for the step. */
  title: string
  /** Optional description / subtitle for the step. */
  description?: string
  /** Override the auto-computed status. When omitted the composable auto-assigns it. */
  status?: StepStatus
}

export interface UseStepsOptions {
  /** Reactive array of step definitions. */
  steps: Ref<StepItem[]> | ComputedRef<StepItem[]>
  /** Reactive 0-based index of the currently active step. */
  current: Ref<number>
}

export interface UseStepsReturn {
  /** The current step item (computed from `current`). */
  currentStep: ComputedRef<StepItem | undefined>
  /** Jump to a specific step by its 0-based index. */
  setCurrent: (index: number) => void
  /** Advance to the next step. Optionally pass a `beforeNext` validator. */
  next: (beforeNext?: () => boolean | Promise<boolean>) => Promise<void>
  /** Go back to the previous step. */
  prev: () => void
  /** Manually override the status of a specific step. */
  setStepStatus: (key: string, status: StepStatus) => void
}

/**
 * Headless steps composable — encapsulates step navigation, status auto-
 * computation, and validation hooks.
 *
 * @example
 * ```ts
 * const steps = ref<StepItem[]>([
 *   { key: '1', title: 'Step 1' },
 *   { key: '2', title: 'Step 2' },
 * ])
 * const current = ref(0)
 * const { currentStep, next, prev, setStepStatus } = useSteps({ steps, current })
 * ```
 */
export function useSteps(opts: UseStepsOptions): UseStepsReturn {
  const { steps, current } = opts

  // Track manually assigned step statuses keyed by step key.
  const manualStatusMap = new Map<string, StepStatus>()

  const currentStep = computed(() => steps.value[current.value])

  function setCurrent(index: number) {
    if (index < 0 || index >= steps.value.length) return
    if (index === current.value) return
    current.value = index
  }

  async function next(beforeNext?: () => boolean | Promise<boolean>) {
    if (current.value >= steps.value.length - 1) return
    if (beforeNext) {
      const canProceed = await beforeNext()
      if (!canProceed) return
    }
    current.value = current.value + 1
  }

  function prev() {
    if (current.value <= 0) return
    current.value = current.value - 1
  }

  function setStepStatus(key: string, status: StepStatus) {
    manualStatusMap.set(key, status)
  }

  return {
    currentStep,
    setCurrent,
    next,
    prev,
    setStepStatus,
  }
}
