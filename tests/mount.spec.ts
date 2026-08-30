// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSpotlight } from '../src/spotlight/mount.ts'
import type { SpotlightHost, SpotlightSessionList, SpotlightSessions } from '../src/spotlight/host.ts'
import { installVisibleRects } from './dom.ts'

const SHORTCUT_STORAGE_KEY = 'dsh.spotlight.shortcut.v1'

function fakeSessions(list: Partial<SpotlightSessionList> = {}): SpotlightSessions {
  const snapshot: SpotlightSessionList = { ids: [], byId: {}, current: undefined, ...list }
  return { list: { getSnapshot: () => snapshot }, open: vi.fn() }
}

function hostWithSessions(): SpotlightHost {
  return {
    sessions: fakeSessions({
      ids: ['a'],
      byId: { a: { id: 'a', displayTitle: 'Alpha', running: false } },
      current: 'a',
    }),
  }
}

function keydown(key: string, init: KeyboardEventInit = {}): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
}

beforeEach(() => {
  document.body.innerHTML = ''
  window.localStorage.clear()
  installVisibleRects()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('spotlight mount', () => {
  it('opens on the platform shortcut and closes on Escape', () => {
    const { dispose } = mountSpotlight(hostWithSessions(), document, window)
    keydown('k', { ctrlKey: true })
    expect(document.querySelector('[data-dsh-spotlight-root]')).not.toBeNull()

    document.querySelector<HTMLInputElement>('[data-dsh-spotlight-input]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(document.querySelector('[data-dsh-spotlight-root]')).toBeNull()
    dispose()
  })

  it('executes the active result on Enter through the host service', () => {
    const host = hostWithSessions()
    const { dispose } = mountSpotlight(host, document, window)
    keydown('k', { ctrlKey: true })
    document.querySelector<HTMLInputElement>('[data-dsh-spotlight-input]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(host.sessions.open).toHaveBeenCalledWith('a')
    expect(document.querySelector('[data-dsh-spotlight-root]')).toBeNull()
    dispose()
  })

  it('shows and executes direct Alt-Shift-number result shortcuts', () => {
    window.localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify({
      key: '!', metaKey: false, ctrlKey: false, altKey: true, shiftKey: true,
    }))
    const host: SpotlightHost = {
      sessions: fakeSessions({
        ids: ['a', 'b'],
        byId: {
          a: { id: 'a', displayTitle: 'Alpha', running: false },
          b: { id: 'b', displayTitle: 'Beta', running: false },
        },
        current: 'a',
      }),
    }
    const { dispose, open } = mountSpotlight(host, document, window)
    open()
    const input = document.querySelector<HTMLInputElement>('[data-dsh-spotlight-input]')!
    const shortcuts = [...document.querySelectorAll('[data-dsh-spotlight-result-shortcut]')]

    expect(shortcuts.map(shortcut => shortcut.textContent)).toEqual(['Alt+Shift+1', 'Alt+Shift+2'])
    const unavailable = new KeyboardEvent('keydown', {
      key: '(', code: 'Digit9', altKey: true, shiftKey: true, bubbles: true, cancelable: true,
    })
    input.dispatchEvent(unavailable)
    expect(unavailable.defaultPrevented).toBe(true)
    expect(host.sessions.open).not.toHaveBeenCalled()

    const direct = new KeyboardEvent('keydown', {
      key: '!', code: 'Digit2', altKey: true, shiftKey: true, bubbles: true, cancelable: true,
    })
    input.dispatchEvent(direct)
    expect(direct.defaultPrevented).toBe(true)
    expect(host.sessions.open).toHaveBeenCalledWith('b')
    expect(document.querySelector('[data-dsh-spotlight-root]')).toBeNull()
    dispose()
  })

  it('renumbers direct shortcuts to the fully visible result window', () => {
    let scrolled = false
    const rect = (top: number, bottom: number): DOMRect => ({
      top, bottom, left: 0, right: 100, width: 100, height: bottom - top,
      x: 0, y: top, toJSON: () => ({}),
    })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.hasAttribute('data-dsh-spotlight-results')) return rect(0, 100)
      const optionIndex = Number(this.getAttribute('data-dsh-spotlight-result-index'))
      if (Number.isInteger(optionIndex)) {
        const top = (optionIndex - (scrolled ? 2 : 0)) * 40
        return rect(top, top + 40)
      }
      return rect(0, 0)
    })
    const host: SpotlightHost = {
      sessions: fakeSessions({
        ids: ['a', 'b', 'c', 'd'],
        byId: {
          a: { id: 'a', displayTitle: 'Alpha', running: false },
          b: { id: 'b', displayTitle: 'Beta', running: false },
          c: { id: 'c', displayTitle: 'Charlie', running: false },
          d: { id: 'd', displayTitle: 'Delta', running: false },
        },
        current: 'a',
      }),
    }
    const { dispose } = mountSpotlight(host, document, window)
    keydown('k', { ctrlKey: true })
    const results = document.querySelector<HTMLElement>('[data-dsh-spotlight-results]')!
    const input = document.querySelector<HTMLInputElement>('[data-dsh-spotlight-input]')!

    expect([...document.querySelectorAll('[data-dsh-spotlight-result-shortcut]')]
      .map(shortcut => shortcut.textContent)).toEqual(['Alt+Shift+1', 'Alt+Shift+2'])
    scrolled = true
    results.dispatchEvent(new Event('scroll'))
    const options = [...document.querySelectorAll('[data-dsh-spotlight-option]')]
    expect(options.slice(0, 2).map(option => option.querySelector('[data-dsh-spotlight-result-shortcut]')))
      .toEqual([null, null])
    expect(options.slice(2).map(option => option.querySelector('[data-dsh-spotlight-result-shortcut]')?.textContent))
      .toEqual(['Alt+Shift+1', 'Alt+Shift+2'])

    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: '€', code: 'Digit2', altKey: true, shiftKey: true, bubbles: true,
    }))
    expect(host.sessions.open).toHaveBeenCalledWith('d')
    dispose()
  })

  it('filters results from the input value', () => {
    const { dispose } = mountSpotlight(hostWithSessions(), document, window)
    keydown('k', { ctrlKey: true })
    const input = document.querySelector<HTMLInputElement>('[data-dsh-spotlight-input]')!
    input.value = 'zzz-no-match'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(document.querySelector('[data-dsh-spotlight-empty]')).not.toBeNull()
    dispose()
  })

  it('honors a persisted custom shortcut and resets through the footer control', () => {
    window.localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify({
      key: 'j', metaKey: false, ctrlKey: false, altKey: true, shiftKey: false,
    }))
    const { dispose } = mountSpotlight(hostWithSessions(), document, window)
    keydown('k', { ctrlKey: true })
    expect(document.querySelector('[data-dsh-spotlight-root]')).toBeNull()
    keydown('j', { altKey: true })
    expect(document.querySelector('[data-dsh-spotlight-root]')).not.toBeNull()

    document.querySelector<HTMLButtonElement>('[data-dsh-spotlight-shortcut-reset]')?.click()
    expect(window.localStorage.getItem(SHORTCUT_STORAGE_KEY)).toBeNull()
    dispose()
  })

  it('opens programmatically for the /spotlight command hook', () => {
    const { dispose, open } = mountSpotlight(hostWithSessions(), document, window)
    open()
    expect(document.querySelector('[data-dsh-spotlight-root]')).not.toBeNull()
    dispose()
  })

  it('disposes the listener, the palette, and the owned stylesheet', () => {
    const { dispose } = mountSpotlight(hostWithSessions(), document, window)
    keydown('k', { ctrlKey: true })
    dispose()
    expect(document.querySelector('[data-dsh-spotlight-root]')).toBeNull()
    expect(document.getElementById('dsh-spotlight-style')).toBeNull()
    keydown('k', { ctrlKey: true })
    expect(document.querySelector('[data-dsh-spotlight-root]')).toBeNull()
  })

  it('consumes the host theme alias tokens instead of invented names', () => {
    const { dispose } = mountSpotlight(hostWithSessions(), document, window)
    const css = document.getElementById('dsh-spotlight-style')?.textContent ?? ''
    expect(css).toContain('--dsw-alias-bg-overlay')
    expect(css).toContain('--dsw-alias-label-primary')
    expect(css).toContain('--dsw-alias-brand-primary')
    expect(css).not.toContain('--dsw-alias-bg-1')
    expect(css).not.toContain('--dsw-alias-text-1')
    dispose()
  })
})
