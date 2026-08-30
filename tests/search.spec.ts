import { describe, expect, it } from 'vitest'
import {
  defaultShortcut, directResultIndex, formatResultShortcut, formatShortcut, isSpotlightShortcut,
  moveSelection, parseShortcut, shortcutFromEvent,
} from '../src/spotlight/keyboard.ts'
import { searchCandidates, type SearchCandidate } from '../src/spotlight/search.ts'

const candidates: SearchCandidate[] = [
  { id: 'plugins', kind: 'action', title: '打开插件设置', detail: 'Open installed plugins', keywords: ['settings'] },
  { id: 'session', kind: 'session', title: 'Supabase migration', detail: 'Recent session' },
  { id: 'compact', kind: 'command', title: '/compact', detail: 'Compact context' },
]

describe('spotlight search', () => {
  it('ranks exact and prefix title matches above keyword matches', () => {
    expect(searchCandidates(candidates, '/compact')[0]?.item.id).toBe('compact')
    expect(searchCandidates(candidates, 'plugin')[0]?.item.id).toBe('plugins')
  })

  it('matches multilingual keywords and fuzzy subsequences', () => {
    expect(searchCandidates(candidates, '插件')[0]?.item.id).toBe('plugins')
    expect(searchCandidates(candidates, 'spbs mgt')[0]?.item.id).toBe('session')
  })

  it('returns no false positives and validates the result limit', () => {
    expect(searchCandidates(candidates, 'definitely missing')).toEqual([])
    expect(() => searchCandidates(candidates, '', 0)).toThrow(/positive integer/)
  })
})

describe('spotlight keyboard behavior', () => {
  it('accepts exactly one platform shortcut modifier', () => {
    const base = { key: 'k', altKey: false, shiftKey: false }
    expect(isSpotlightShortcut({ ...base, metaKey: true, ctrlKey: false })).toBe(true)
    expect(isSpotlightShortcut({ ...base, metaKey: false, ctrlKey: true })).toBe(true)
    expect(isSpotlightShortcut({ ...base, metaKey: true, ctrlKey: true })).toBe(false)
    expect(isSpotlightShortcut({ ...base, metaKey: false, ctrlKey: true, shiftKey: true })).toBe(false)
  })

  it('wraps list selection in both directions', () => {
    expect(moveSelection(2, 3, 1)).toBe(0)
    expect(moveSelection(0, 3, -1)).toBe(2)
    expect(moveSelection(0, 0, 1)).toBe(-1)
  })

  it('maps browser-safe Alt-Shift-number shortcuts to the first nine result slots', () => {
    const event = { key: '¡', code: 'Digit1', metaKey: false, ctrlKey: false, altKey: true, shiftKey: true }
    expect(directResultIndex(event)).toBe(0)
    expect(directResultIndex({ ...event, key: '9', code: 'Digit9' })).toBe(8)
    expect(directResultIndex({ ...event, code: 'Digit0' })).toBeUndefined()
    expect(directResultIndex({ ...event, ctrlKey: true })).toBeUndefined()
    expect(directResultIndex({ ...event, metaKey: true })).toBeUndefined()
    expect(directResultIndex({ ...event, shiftKey: false })).toBeUndefined()
    expect(formatResultShortcut(0, true)).toBe('⌥⇧1')
    expect(formatResultShortcut(8, false)).toBe('Alt+Shift+9')
  })

  it('captures, validates, formats, and exactly matches a custom shortcut', () => {
    const event = { key: 'P', metaKey: true, ctrlKey: false, altKey: false, shiftKey: true }
    const shortcut = shortcutFromEvent(event)
    expect(shortcut).toEqual({ ...event, key: 'p' })
    expect(formatShortcut(shortcut!, true)).toBe('⇧⌘P')
    expect(isSpotlightShortcut(event, shortcut)).toBe(true)
    expect(isSpotlightShortcut({ ...event, shiftKey: false }, shortcut)).toBe(false)
    expect(shortcutFromEvent({ ...event, key: 'Shift', metaKey: false })).toBeUndefined()
    expect(parseShortcut({ ...shortcut, altKey: 'no' })).toBeUndefined()
    expect(defaultShortcut(false)).toMatchObject({ key: 'k', ctrlKey: true, metaKey: false })
  })
})
