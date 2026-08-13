/**
 * Serializable configuration, schema, and direct-call defaults.
 * @module @dsh-external/dsh-spotlight/config
 */

import z from 'schemastery'

/** The MVP has no deployment-varying server configuration. */
export interface Config {}

/** Loader-visible configuration schema and defaults. */
export const Config: z<Config> = z.object({})
