/**
 * Minimal function plugin for DeepSeek Harness.
 * @module @your-scope/dsh-plugin-template
 */

import type { Context } from 'cordis'
import z from 'schemastery'

/** Plugin configuration supplied by the profile composition. */
export interface Config {
  /** Message written when this plugin loads. */
  message?: string
}

/** Cordis plugin name; keep this stable after publishing. */
export const name = 'plugin-template'

/** Services that must exist before the plugin is applied. */
export const inject: string[] = []

/** Loader-visible configuration schema and defaults. */
export const Config: z<Config> = z.object({
  message: z.string().default('DSH plugin template loaded'),
})

/**
 * Apply the plugin to its Cordis context.
 * @param ctx - Scoped plugin context; registrations must be owned by its effects.
 * @param config - Configuration resolved by Cordis from {@link Config}.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.logger.info(config.message)
}
