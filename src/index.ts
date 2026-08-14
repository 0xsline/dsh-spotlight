/**
 * Standalone function plugin for DeepSeek Harness.
 * @module @0xsline/dsh-spotlight
 */

/** Cordis plugin name; keep this stable after publishing. */
export const name = 'dsh-spotlight'

/** Services that must exist before the plugin is applied. */
export const inject: string[] = []

export { Config } from './config.ts'
export { apply } from './runtime.ts'
