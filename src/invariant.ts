/**
 * Package-owned invariant companion for `@your-scope/dsh-plugin-template`.
 * @module @your-scope/dsh-plugin-template/invariant
 */

import type { Context } from 'cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@your-scope/dsh-plugin-template'

/** Cordis companion plugin name. */
export const name = 'plugin-template-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the template logs at activation and owns no event
 * sequence or mutable data relation. Replace this when the real plugin does.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
