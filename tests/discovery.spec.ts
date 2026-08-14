// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  discoverActions, discoverVisibleActions, openPluginSettings,
} from '../src/spotlight/discovery.ts'
import type { SpotlightHost, SpotlightSessionList, SpotlightSessions } from '../src/spotlight/host.ts'
import { installVisibleRects } from './dom.ts'

function fakeSessions(list: Partial<SpotlightSessionList> = {}): SpotlightSessions {
  const snapshot: SpotlightSessionList = { ids: [], byId: {}, current: undefined, ...list }
  return { list: { getSnapshot: () => snapshot }, open: vi.fn() }
}

beforeEach(() => {
  document.body.innerHTML = ''
  installVisibleRects()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('session discovery', () => {
  it('lists non-blank sessions from the host service and opens them by id', () => {
    const host: SpotlightHost = {
      sessions: fakeSessions({
        ids: ['a', 'b', 'c'],
        byId: {
          a: { id: 'a', displayTitle: 'Alpha', running: false },
          b: { id: 'b', displayTitle: 'Beta', cwd: '/proj', running: true },
          c: { id: 'c', displayTitle: 'Blank', running: false, blank: true },
        },
        current: 'a',
      }),
    }
    const sessions = discoverVisibleActions(host, document).filter(action => action.kind === 'session')
    expect(sessions.map(action => action.title)).toEqual(['Alpha', 'Beta'])
    sessions[0]?.run()
    expect(host.sessions.open).toHaveBeenCalledWith('a')
  })
})

describe('slash command discovery', () => {
  it('lists the host command catalog for the current session', async () => {
    const host: SpotlightHost = {
      sessions: fakeSessions({ current: 's1' }),
      commands: {
        list: vi.fn().mockResolvedValue({ ok: true, value: [{ name: 'compact', description: 'Compact context' }] }),
        execute: vi.fn(),
      },
    }
    const actions = await discoverActions(host, document)
    const command = actions.find(action => action.kind === 'command')
    expect(command?.title).toBe('/compact')
    expect(command?.detail).toBe('Compact context')
  })

  it('executes bare commands through the command plane', async () => {
    const execute = vi.fn().mockResolvedValue({ ok: true, value: { result: 'ok' } })
    const host: SpotlightHost = {
      sessions: fakeSessions({ current: 's1' }),
      commands: {
        list: vi.fn().mockResolvedValue({ ok: true, value: [{ name: 'compact', description: '' }] }),
        execute,
      },
    }
    const actions = await discoverActions(host, document)
    const command = actions.find(action => action.kind === 'command')
    command?.run()
    await vi.waitFor(() => expect(execute).toHaveBeenCalledWith('s1', '/compact'))
  })

  it('hands argued commands to the composer claim path', async () => {
    document.body.innerHTML = '<textarea></textarea>'
    const host: SpotlightHost = {
      sessions: fakeSessions({ current: 's1' }),
      commands: {
        list: vi.fn().mockResolvedValue({ ok: true, value: [{ name: 'search', input: { hint: 'query' } }] }),
        execute: vi.fn(),
      },
    }
    const actions = await discoverActions(host, document)
    const command = actions.find(action => action.kind === 'command')
    command?.run()
    expect(document.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe('/search ')
    expect(host.commands?.execute).not.toHaveBeenCalled()
  })

  it('falls back to the composer when execution is unknown or rejected', async () => {
    document.body.innerHTML = '<textarea></textarea>'
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea')
    for (const execute of [
      vi.fn().mockResolvedValue({ ok: true, value: undefined }),
      vi.fn().mockRejectedValue(new Error('transport')),
    ]) {
      const host: SpotlightHost = {
        sessions: fakeSessions({ current: 's1' }),
        commands: { list: vi.fn().mockResolvedValue({ ok: true, value: [{ name: 'compact', description: '' }] }), execute },
      }
      const actions = await discoverActions(host, document)
      actions.find(action => action.kind === 'command')?.run()
      await vi.waitFor(() => expect(textarea?.value).toBe('/compact '))
      if (textarea !== null) textarea.value = ''
    }
  })

  it('degrades to no commands without the command plane or a current session', async () => {
    const withService = await discoverActions({
      sessions: fakeSessions({ current: undefined }),
      commands: { list: vi.fn(), execute: vi.fn() },
    }, document)
    expect(withService.some(action => action.kind === 'command')).toBe(false)

    const withoutService = await discoverActions({ sessions: fakeSessions({ current: 's1' }) }, document)
    expect(withoutService.some(action => action.kind === 'command')).toBe(false)
  })
})

describe('plugin discovery', () => {
  it('lists installed plugins from the host inventory and jumps to plugin settings', async () => {
    document.body.innerHTML = '<button aria-label="设置"></button><button aria-label="插件"></button>'
    const host: SpotlightHost = {
      sessions: fakeSessions(),
      pluginInventory: {
        list: vi.fn().mockResolvedValue({
          ok: true,
          value: { entries: [{ entryId: '@scope/dsh-spotlight', moduleName: '@0xsline/dsh-spotlight', enabled: true }] },
        }),
      },
    }
    const actions = await discoverActions(host, document)
    const plugin = actions.find(action => action.kind === 'plugin')
    expect(plugin?.title).toBe('spotlight')
    expect(plugin?.detail).toBe('@scope/dsh-spotlight')
    plugin?.run()
    await vi.waitFor(() => expect(document.querySelector<HTMLButtonElement>('button[aria-label="插件"]')).toBeDefined())
  })

  it('degrades to no plugins without the inventory service', async () => {
    const actions = await discoverActions({ sessions: fakeSessions() }, document)
    expect(actions.some(action => action.kind === 'plugin')).toBe(false)
  })
})

describe('built-in and interface actions', () => {
  it('discovers composer focus, new chat, settings jump, and chat scrolling', () => {
    document.body.innerHTML = `
      <textarea></textarea>
      <button aria-label="新建会话"></button>
      <button aria-label="设置"></button>
      <div style="overflow-y: auto"><div data-chat-flow=""><p>msg</p></div></div>
    `
    const host: SpotlightHost = { sessions: fakeSessions() }
    const actions = discoverVisibleActions(host, document)
    const ids = actions.map(action => action.id)
    expect(ids).toContain('focus-composer')
    expect(ids).toContain('new-chat')
    expect(ids).toContain('open-plugins')
    expect(ids).toContain('chat-top')
    expect(ids).toContain('chat-bottom')
  })

  it('skips disabled, unlabeled, and excluded interface elements', () => {
    document.body.innerHTML = `
      <button aria-label="发送消息"></button>
      <button aria-label="关闭"></button>
      <button aria-label="停止" aria-disabled="true"></button>
      <button>no label</button>
      <button aria-label="复制"></button>
    `
    const actions = discoverVisibleActions({ sessions: fakeSessions() }, document)
    const titles = actions.map(action => action.title)
    expect(titles).toContain('复制')
    expect(titles).not.toContain('发送消息')
    expect(titles).not.toContain('关闭')
    expect(titles).not.toContain('停止')
    expect(titles).not.toContain('no label')
  })

  it('opens plugin settings through the visible plugins tab without a fixed sleep', async () => {
    document.body.innerHTML = '<button aria-label="设置"></button>'
    const settings = document.querySelector<HTMLButtonElement>('button[aria-label="设置"]')!
    const clickSettings = vi.spyOn(settings, 'click')
    // The plugins tab renders asynchronously after the settings panel opens.
    const promise = openPluginSettings(document)
    const tab = document.createElement('button')
    tab.setAttribute('aria-label', '插件')
    document.body.appendChild(tab)
    const clickTab = vi.spyOn(tab, 'click')
    await promise
    expect(clickSettings).toHaveBeenCalledTimes(1)
    expect(clickTab).toHaveBeenCalledTimes(1)
  })
})
