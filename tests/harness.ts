import { Context } from 'cordis'
import { vi } from 'vitest'
import * as plugin from '../src/index.ts'

/** Mount the production plugin with an observable host logger. */
export async function createPluginHarness(config: plugin.Config = {}) {
  const ctx = new Context()
  const info = vi.spyOn(ctx.logger, 'info').mockImplementation(() => undefined)
  const fiber = await ctx.plugin(plugin, config)

  return {
    ctx,
    fiber,
    info,
    async dispose(): Promise<void> {
      try {
        await fiber.dispose()
      } finally {
        info.mockRestore()
      }
    },
  }
}
