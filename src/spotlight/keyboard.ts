/** Keyboard fields used by the global shortcut matcher. */
export interface ShortcutEvent {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
}

/** Persistable exact keyboard shortcut. */
export interface SpotlightShortcut extends ShortcutEvent {}

const MODIFIER_KEYS = new Set(['alt', 'control', 'meta', 'shift'])

function normalizedKey(key: string): string {
  return key.length === 1 ? key.toLocaleLowerCase() : key
}

/** Platform default: Command-K on Apple devices, Control-K elsewhere. */
export function defaultShortcut(applePlatform: boolean): SpotlightShortcut {
  return { key: 'k', metaKey: applePlatform, ctrlKey: !applePlatform, altKey: false, shiftKey: false }
}

/** Admit a user shortcut only when it combines a modifier with a non-modifier key. */
export function shortcutFromEvent(event: ShortcutEvent): SpotlightShortcut | undefined {
  const key = normalizedKey(event.key)
  if (key === '' || MODIFIER_KEYS.has(key.toLocaleLowerCase())) return undefined
  if (!event.metaKey && !event.ctrlKey && !event.altKey) return undefined
  return { key, metaKey: event.metaKey, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey }
}

/** Validate an unknown persisted shortcut. */
export function parseShortcut(value: unknown): SpotlightShortcut | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const candidate = value as Partial<SpotlightShortcut>
  if (typeof candidate.key !== 'string'
    || typeof candidate.metaKey !== 'boolean'
    || typeof candidate.ctrlKey !== 'boolean'
    || typeof candidate.altKey !== 'boolean'
    || typeof candidate.shiftKey !== 'boolean') return undefined
  return shortcutFromEvent(candidate as ShortcutEvent)
}

/** Compact user-facing shortcut label. */
export function formatShortcut(shortcut: SpotlightShortcut, applePlatform: boolean): string {
  const parts: string[] = []
  if (shortcut.ctrlKey) parts.push(applePlatform ? '⌃' : 'Ctrl+')
  if (shortcut.altKey) parts.push(applePlatform ? '⌥' : 'Alt+')
  if (shortcut.shiftKey) parts.push(applePlatform ? '⇧' : 'Shift+')
  if (shortcut.metaKey) parts.push(applePlatform ? '⌘' : 'Meta+')
  const key = shortcut.key === ' ' ? 'Space' : shortcut.key.length === 1 ? shortcut.key.toLocaleUpperCase() : shortcut.key
  return `${parts.join('')}${key}`
}

/** Match an exact configured shortcut; without one, retain the legacy Cmd/Ctrl-K matcher. */
export function isSpotlightShortcut(event: ShortcutEvent, shortcut?: SpotlightShortcut): boolean {
  if (shortcut === undefined) {
    return normalizedKey(event.key) === 'k'
      && event.metaKey !== event.ctrlKey
      && !event.altKey
      && !event.shiftKey
  }
  return normalizedKey(event.key) === normalizedKey(shortcut.key)
    && event.metaKey === shortcut.metaKey
    && event.ctrlKey === shortcut.ctrlKey
    && event.altKey === shortcut.altKey
    && event.shiftKey === shortcut.shiftKey
}

/** Move a list selection with wraparound. */
export function moveSelection(current: number, length: number, delta: -1 | 1): number {
  if (length < 1) return -1
  return (Math.max(0, current) + delta + length) % length
}
