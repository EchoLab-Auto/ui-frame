import { describe, it, expect } from 'vitest'
import { computed, defineComponent, h, provide } from 'vue'
import { mount } from '@vue/test-utils'
import { useNeumorphismSetup } from './createComponent'
import { ConfigKey } from '../composables/useConfig'
import type { NeumorphismGlobalConfig } from '../composables/useConfig'

function withSetup(configOverride?: Partial<NeumorphismGlobalConfig>) {
  let setupCtx: ReturnType<typeof useNeumorphismSetup> | null = null

  // Parent provides config; child injects it via useNeumorphismSetup
  const Child = defineComponent({
    setup() {
      setupCtx = useNeumorphismSetup()
      return () => h('div')
    },
  })

  const Parent = defineComponent({
    setup() {
      if (configOverride) {
        provide(
          ConfigKey,
          computed(() => configOverride)
        )
      }
      return () => h(Child)
    },
  })

  const wrapper = mount(Parent)

  return { ctx: () => setupCtx!, unmount: () => wrapper.unmount() }
}

describe('useNeumorphismSetup', () => {
  it('should provide config (empty without provider)', () => {
    const { ctx } = withSetup()
    expect(ctx().config).toBeDefined()
    expect(ctx().config.value).toBeDefined()
  })

  it('should provide config from provider', () => {
    const { ctx } = withSetup({ button: { size: 'large' } })
    expect(ctx().config.value.button?.size).toBe('large')
  })

  it('resolveProp: should return explicit value when provided', () => {
    const { ctx } = withSetup()
    const result = ctx().resolveProp('explicit', undefined, 'default')
    expect(result).toBe('explicit')
  })

  it('resolveProp: should return config value when explicit is undefined', () => {
    const { ctx } = withSetup()
    const result = ctx().resolveProp(undefined, 'fromConfig', 'default')
    expect(result).toBe('fromConfig')
  })

  it('resolveProp: should return default when both explicit and config are undefined', () => {
    const { ctx } = withSetup()
    const result = ctx().resolveProp(undefined, undefined, 'default')
    expect(result).toBe('default')
  })

  it('resolveProp: should prefer explicit over config', () => {
    const { ctx } = withSetup()
    const result = ctx().resolveProp('explicit', 'config', 'default')
    expect(result).toBe('explicit')
  })

  it('resolveProp: should handle boolean values correctly', () => {
    const { ctx } = withSetup()
    // false is a valid explicit value and should be returned
    expect(ctx().resolveProp(false, undefined, true)).toBe(false)
    expect(ctx().resolveProp(true, false, false)).toBe(true)
  })

  it('resolveProp: should handle number 0 correctly', () => {
    const { ctx } = withSetup()
    // 0 is a valid value (not nullish)
    expect(ctx().resolveProp(0, undefined, 10)).toBe(0)
  })

  it('resolveProp: should handle empty string correctly', () => {
    const { ctx } = withSetup()
    // '' is a valid value (not nullish)
    expect(ctx().resolveProp('', undefined, 'default')).toBe('')
  })
})
