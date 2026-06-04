import type { Component, App } from 'vue'

/**
 * Runtime component registry that maps component names to implementations.
 *
 * Supports:
 * - Registering or replacing components via `register()`
 * - Looking up components via `get()` / `has()`
 * - Bulk-installing onto a Vue App via `install(app, prefix?)`
 *
 * @example
 * ```ts
 * const registry = new ComponentRegistry()
 * registry
 *   .register('NeumorphismButton', MyCustomButton)
 *   .register('MyWidget', MyWidget)
 * registry.install(app, 'App')
 * ```
 */
export class ComponentRegistry {
  private _map = new Map<string, Component>()

  constructor(entries?: Iterable<readonly [string, Component]>) {
    if (entries) {
      for (const [name, component] of entries) {
        this._map.set(name, component)
      }
    }
  }

  /** Register or replace a component. Returns `this` for chaining. */
  register(name: string, component: Component): this {
    this._map.set(name, component)
    return this
  }

  /** Retrieve a registered component by name. */
  get(name: string): Component | undefined {
    return this._map.get(name)
  }

  /** Check if a component name is registered. */
  has(name: string): boolean {
    return this._map.has(name)
  }

  /** Delete a registered component. Returns true if it existed. */
  remove(name: string): boolean {
    return this._map.delete(name)
  }

  /** Number of registered components. */
  get size(): number {
    return this._map.size
  }

  /** Iterate all [name, component] entries. */
  entries(): IterableIterator<[string, Component]> {
    return this._map.entries()
  }

  /** Iterate all component names. */
  names(): IterableIterator<string> {
    return this._map.keys()
  }

  /** Register all components onto a Vue App instance. */
  install(app: App, prefix = ''): this {
    for (const [name, component] of this._map) {
      app.component(`${prefix}${name}`, component)
    }
    return this
  }
}
