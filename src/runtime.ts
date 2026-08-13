/**
 * Runtime boundary and Cordis activation for the plugin.
 * @module @dsh-external/dsh-spotlight/runtime
 */

import type { Context } from 'cordis'
import type { Config } from './config.ts'

/**
 * Apply the plugin to its Cordis context.
 * @param ctx - Scoped plugin context; registrations must be owned by its effects.
 * @param config - Configuration resolved by Cordis from the exported schema.
 */
export function apply(_ctx: Context, _config: Config): void {}
