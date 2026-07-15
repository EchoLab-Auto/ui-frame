import type { Component, App } from 'vue'
import type { NeumorphismGlobalConfig } from '../composables/useConfig'

/**
 * A named collection of component overrides + config defaults that can be
 * applied as a group (e.g. "compact", "material", "dashboard").
 */
export interface ComponentPreset {
  /** Components to register or replace. */
  components?: Record<string, Component>
  /** Global config defaults for this preset. */
  config?: Partial<NeumorphismGlobalConfig>
}

/**
 * Runtime component registry that maps component names to implementations.
 *
 * Supports:
 * - Registering or replacing components via `register()`
 * - Looking up components via `get()` / `has()`
 * - Named presets that bundle component overrides + config
 * - Bulk-installing onto a Vue App via `install(app, prefix?)`
 *
 * @example
 * ```ts
 * const registry = new ComponentRegistry()
 * registry
 *   .registerPreset('compact', {
 *     config: { button: { size: 'small' }, input: { size: 'small' } },
 *   })
 *   .registerPreset('material', {
 *     components: { NeumorphismButton: MaterialButton },
 *   })
 * registry.applyPreset('compact').applyPreset('material')
 * registry.install(app, 'App')
 * ```
 */
export class ComponentRegistry {
  private _map = new Map<string, Component>()
  private _presets = new Map<string, ComponentPreset>()

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

  // ---- Preset system ----

  /**
   * Register a named preset. Does NOT apply it — call `applyPreset(name)`
   * to activate, or pass the name to `install(app, prefix, presets)`.
   */
  registerPreset(name: string, preset: ComponentPreset): this {
    this._presets.set(name, preset)
    return this
  }

  /** Check if a preset is registered. */
  hasPreset(name: string): boolean {
    return this._presets.has(name)
  }

  /**
   * Apply a registered preset: merge its component overrides and config
   * into the current registry state. Later presets override earlier ones.
   * Returns `this` for chaining.
   */
  applyPreset(name: string): this {
    const preset = this._presets.get(name)
    if (!preset) return this
    if (preset.components) {
      for (const [key, comp] of Object.entries(preset.components)) {
        this._map.set(key, comp)
      }
    }
    return this
  }

  /**
   * Collect config defaults from one or more named presets.
   * Returns a shallow-merged config object (later presets win).
   */
  getPresetConfig(...names: string[]): Partial<NeumorphismGlobalConfig> {
    const merged: Record<string, unknown> = {}
    for (const name of names) {
      const preset = this._presets.get(name)
      if (preset?.config) Object.assign(merged, preset.config)
    }
    return merged as Partial<NeumorphismGlobalConfig>
  }

  /** Register all components onto a Vue App instance. */
  install(app: App, prefix = '', presetNames?: string[]): this {
    // Apply any requested presets before installing
    if (presetNames) {
      for (const name of presetNames) this.applyPreset(name)
    }
    for (const [name, component] of this._map) {
      app.component(`${prefix}${name}`, component)
    }
    return this
  }
}
