/**
 * Serializable configuration, schema, and direct-call defaults.
 * @module @your-scope/dsh-plugin-template/config
 */

import z from 'schemastery'

/** Plugin configuration supplied by the profile composition. */
export interface Config {
  /** Message written when this plugin loads. */
  message?: string
}

/** Configuration after defaults have been resolved. */
export interface ResolvedConfig {
  /** Message written when this plugin loads. */
  message: string
}

/** Loader-visible configuration schema and defaults. */
export const Config: z<Config> = z.object({
  message: z.string().default('DSH plugin template loaded'),
})

/**
 * Resolve the same defaults for direct callers that bypass Cordis Loader.
 * @param config - Partial serialized configuration.
 * @returns Configuration with all template defaults applied.
 */
export function resolveConfig(config: Config = {}): ResolvedConfig {
  return {
    message: config.message ?? 'DSH plugin template loaded',
  }
}
