import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { ComponentRegistry } from './componentRegistry'

const mockComponent = { setup() { return () => h('div') } }

describe('ComponentRegistry', () => {
  it('should register and retrieve a component', () => {
    const registry = new ComponentRegistry()
    registry.register('TestComp', mockComponent)
    expect(registry.get('TestComp')).toBe(mockComponent)
  })

  it('should return undefined for unregistered component', () => {
    const registry = new ComponentRegistry()
    expect(registry.get('Missing')).toBeUndefined()
  })

  it('should report has() correctly', () => {
    const registry = new ComponentRegistry()
    registry.register('A', mockComponent)
    expect(registry.has('A')).toBe(true)
    expect(registry.has('B')).toBe(false)
  })

  it('should allow overriding an existing registration', () => {
    const registry = new ComponentRegistry()
    const comp2 = { setup() { return () => h('span') } }
    registry.register('X', mockComponent)
    registry.register('X', comp2)
    expect(registry.get('X')).toBe(comp2)
  })

  it('should support chained register()', () => {
    const registry = new ComponentRegistry()
    registry
      .register('A', mockComponent)
      .register('B', mockComponent)
    expect(registry.get('A')).toBe(mockComponent)
    expect(registry.get('B')).toBe(mockComponent)
  })

  it('should report correct size', () => {
    const registry = new ComponentRegistry()
    expect(registry.size).toBe(0)
    registry.register('A', mockComponent)
    expect(registry.size).toBe(1)
  })

  it('should remove a component', () => {
    const registry = new ComponentRegistry()
    registry.register('A', mockComponent)
    expect(registry.remove('A')).toBe(true)
    expect(registry.has('A')).toBe(false)
    expect(registry.remove('B')).toBe(false)
  })

  it('should construct from entries iterable', () => {
    const registry = new ComponentRegistry([
      ['A', mockComponent],
      ['B', mockComponent],
    ])
    expect(registry.size).toBe(2)
  })

  it('should iterate entries()', () => {
    const registry = new ComponentRegistry()
    registry.register('A', mockComponent).register('B', mockComponent)
    const result = new Map(registry.entries())
    expect(result.size).toBe(2)
    expect(result.get('A')).toBe(mockComponent)
  })

  it('should iterate names()', () => {
    const registry = new ComponentRegistry()
    registry.register('A', mockComponent).register('B', mockComponent)
    const names = Array.from(registry.names())
    expect(names).toContain('A')
    expect(names).toContain('B')
  })

  it('should install to app with correct names', () => {
    const called: string[] = []
    const mockApp = {
      component(name: string, _comp: unknown) {
        called.push(name)
      },
    } as any

    const registry = new ComponentRegistry()
    registry.register('Foo', mockComponent).register('Bar', mockComponent)
    registry.install(mockApp)
    expect(called).toEqual(['Foo', 'Bar'])
  })

  it('should install to app with prefix', () => {
    const called: string[] = []
    const mockApp = {
      component(name: string, _comp: unknown) {
        called.push(name)
      },
    } as any

    const registry = new ComponentRegistry()
    registry.register('Foo', mockComponent)
    registry.install(mockApp, 'App')
    expect(called).toEqual(['AppFoo'])
  })
})
