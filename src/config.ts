/**
 * Serializable configuration, schema, and direct-call defaults.
 * @module @0xsline/dsh-spotlight/config
 */

import z from '@deepseek-ai/schemastery'

/** The MVP has no deployment-varying server configuration. */
export interface Config {}

/** Loader-visible configuration schema and defaults. */
export const Config: z<Config> = z.object({})
