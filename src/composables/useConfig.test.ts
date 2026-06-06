import { describe, it, expect } from 'vitest'
import { computed, defineComponent, h, provide } from 'vue'
import { mount } from '@vue/test-utils'
import { useConfig, ConfigKey } from './useConfig'
import type { NeumorphismGlobalConfig } from './useConfig'

function withConfig(configOverride?: NeumorphismGlobalConfig) {
  let configResult: ReturnType<typeof useConfig> | null = null

  const Child = defineComponent({
    setup() {
      configResult = useConfig()
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

  return { config: () => configResult!, unmount: () => wrapper.unmount() }
}

describe('useConfig', () => {
  it('should return empty object by default', () => {
    const { config } = withConfig()
    expect(config().value).toEqual({})
  })

  it('should receive provided config', () => {
    const { config } = withConfig({
      button: { size: 'large', variant: 'flat' },
      input: { size: 'small' },
    })
    expect(config().value.button?.size).toBe('large')
    expect(config().value.button?.variant).toBe('flat')
    expect(config().value.input?.size).toBe('small')
  })

  it('should support all config sections', () => {
    const cfg: NeumorphismGlobalConfig = {
      button: { size: 'small' },
      input: { size: 'medium' },
      select: { size: 'large', clearable: true },
      modal: { size: 'medium', closable: true },
      toast: { position: 'top-right', maxCount: 5 },
      tooltip: { position: 'bottom', trigger: 'click' },
      tabs: { position: 'left', size: 'small' },
      pagination: { size: 'medium', showTotal: true },
      collapse: { size: 'small', accordion: true },
      form: { size: 'large', direction: 'vertical' },
      tag: { variant: 'primary', size: 'small' },
      progress: { variant: 'success', size: 'medium' },
      avatar: { size: 'large', shape: 'circle' },
      tree: { showSearch: true, multiple: false },
      switch: { size: 'small' },
      table: { size: 'medium', striped: true },
      locale: 'en-US',
      theme: { defaultTheme: 'dark', followSystem: false },
      rtl: true,
    }
    const { config } = withConfig(cfg)
    expect(config().value.locale).toBe('en-US')
    expect(config().value.rtl).toBe(true)
    expect(config().value.theme?.defaultTheme).toBe('dark')
    expect(config().value.table?.striped).toBe(true)
  })

  it('should allow custom extension fields', () => {
    const { config } = withConfig({
      customSection: { foo: 'bar' },
    } as NeumorphismGlobalConfig)
    expect((config().value as Record<string, unknown>).customSection).toEqual({ foo: 'bar' })
  })
})
