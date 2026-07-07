/**
 * Build-time version constant.
 *
 * Injected by Vite `define` (see `vite.config.ts` / `vite.umd.config.ts`)
 * as a JSON string literal at build time. In source this is referenced as
 * a bare identifier (see `version` in `src/index.ts`), NOT a string — the
 * replacement happens on the identifier, so wrapping it in quotes would
 * prevent substitution and leak the literal `__VERSION__` into the bundle.
 */
declare const __VERSION__: string
