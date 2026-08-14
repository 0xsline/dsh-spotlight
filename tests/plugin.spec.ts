import { describe, expect, it, vi } from 'vitest'
import Loader from '@cordisjs/plugin-loader'
import { Context } from 'cordis'
import * as plugin from '../src/index.ts'
import * as invariant from '../src/invariant.ts'
import { createPluginHarness } from './harness.ts'

describe('@0xsline/dsh-spotlight', () => {
  it('preserves the function-plugin namespace through Loader unwrapping', () => {
    expect('default' in plugin).toBe(false)

    const loader = Object.create(Loader.prototype) as Loader
    const unwrapped = loader.unwrapExports(plugin) as Record<string, unknown>
    expect(unwrapped).toBe(plugin)
    expect(unwrapped.name).toBe('dsh-spotlight')
    expect(unwrapped.inject).toEqual([])
    expect(unwrapped.Config).toBeDefined()
    expect(typeof unwrapped.apply).toBe('function')
  })

  it('mounts and disposes its empty server half', async () => {
    const harness = await createPluginHarness()
    await harness.dispose()
  })

  it('registers the invariant companion through its local host contract', async () => {
    const ctx = new Context()
    const unregister = vi.fn()
    const register = vi.fn<(packageName: string, installer: unknown) => () => void>(() => unregister)
    const removeService = ctx.provide('invariants', { register })

    const fiber = await ctx.plugin(invariant)
    expect(register).toHaveBeenCalledTimes(1)
    expect(register.mock.calls[0]?.[0]).toBe('@0xsline/dsh-spotlight')
    expect(typeof register.mock.calls[0]?.[1]).toBe('function')

    await fiber.dispose()
    expect(unregister).toHaveBeenCalledTimes(1)
    await removeService()
  })
})
