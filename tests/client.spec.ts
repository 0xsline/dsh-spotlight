// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from 'cordis'
import * as client from '../src/client/index.ts'
import { installVisibleRects } from './dom.ts'

const flush = async (): Promise<void> => {
  await new Promise(resolve => { setTimeout(resolve, 0) })
  await new Promise(resolve => { setTimeout(resolve, 0) })
}

beforeEach(() => {
  document.body.innerHTML = ''
  installVisibleRects()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('dsh-spotlight client entry', () => {
  it('keeps the cordis plugin namespace shape', () => {
    expect(client.name).toBe('dsh-spotlight-client')
    expect(client.inject).toEqual([])
    expect(typeof client.apply).toBe('function')
  })

  it('mounts once sessions arrive and registers /spotlight once commandUi arrives', async () => {
    const ctx = new Context()
    const fiber = await ctx.plugin(client)
    expect(document.getElementById('dsh-spotlight-style')).toBeNull()

    const sessions = { getSnapshot: () => ({ ids: [], byId: {}, current: undefined }), open: vi.fn() }
    const removeSessions = ctx.provide('sessions', sessions)
    await flush()
    expect(document.getElementById('dsh-spotlight-style')).not.toBeNull()

    const register = vi.fn<(contribution: unknown) => () => void>(() => () => undefined)
    const removeCommandUi = ctx.provide('commandUi', { register })
    await flush()
    expect(register).toHaveBeenCalledTimes(1)
    const contribution = register.mock.calls[0]?.[0] as unknown as {
      name: string
      description: string
      available(session: unknown): boolean
      ui: {
        kind: string
        options(session: unknown, signal: AbortSignal): Promise<readonly { id: string, label: string, detail?: string }[]>
        onSelect(option: { id: string, label: string, detail?: string }, session: unknown): void
      }
    }
    expect(contribution.name).toBe('spotlight')
    expect(contribution.available(undefined)).toBe(true)

    const options = await contribution.ui.options(undefined, new AbortController().signal)
    expect(options.map(option => option.id)).toEqual(['open'])
    contribution.ui.onSelect(options[0]!, undefined)
    expect(document.querySelector('[data-dsh-spotlight-root]')).not.toBeNull()

    await fiber.dispose()
    expect(document.getElementById('dsh-spotlight-style')).toBeNull()
    removeSessions()
    removeCommandUi()
  })
})
