import { describe, expect, it, vi } from 'vitest'
import Loader from '@cordisjs/plugin-loader'
import { Context } from 'cordis'
import * as plugin from '../src/index.ts'

describe('@your-scope/dsh-plugin-template', () => {
  it('preserves the function-plugin namespace through Loader unwrapping', () => {
    expect('default' in plugin).toBe(false)

    const loader = Object.create(Loader.prototype) as Loader
    const unwrapped = loader.unwrapExports(plugin) as Record<string, unknown>
    expect(unwrapped).toBe(plugin)
    expect(unwrapped.name).toBe('plugin-template')
    expect(unwrapped.inject).toEqual([])
    expect(unwrapped.Config).toBeDefined()
    expect(typeof unwrapped.apply).toBe('function')
  })

  it('applies with schema defaults', async () => {
    const ctx = new Context()
    const info = vi.spyOn(ctx.logger, 'info').mockImplementation(() => undefined)

    const fiber = await ctx.plugin(plugin, {})
    expect(info).toHaveBeenCalledWith('DSH plugin template loaded')

    await fiber.dispose()
  })

  it('accepts composition configuration', async () => {
    const ctx = new Context()
    const info = vi.spyOn(ctx.logger, 'info').mockImplementation(() => undefined)

    const fiber = await ctx.plugin(plugin, { message: 'hello from a profile' })
    expect(info).toHaveBeenCalledWith('hello from a profile')

    await fiber.dispose()
  })
})
