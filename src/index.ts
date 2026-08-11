/**
 * Standalone function plugin for DeepSeek Harness.
 * @module @your-scope/dsh-plugin-template
 */

/** Cordis plugin name; keep this stable after publishing. */
export const name = 'plugin-template'

/** Services that must exist before the plugin is applied. */
export const inject: string[] = []

export { Config } from './config.ts'
export type { ResolvedConfig } from './config.ts'
export { apply } from './runtime.ts'
export type { PluginRuntime } from './runtime.ts'
