import { Context } from 'cordis'
import * as plugin from '../src/index.ts'

/** Mount the production server half through real Cordis. */
export async function createPluginHarness(config: plugin.Config = {}) {
  const ctx = new Context()
  const fiber = await ctx.plugin(plugin, config)

  return {
    ctx,
    fiber,
    async dispose(): Promise<void> {
      await fiber.dispose()
    },
  }
}
