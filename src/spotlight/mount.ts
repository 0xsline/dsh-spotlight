import { discoverActions, discoverVisibleActions, type SpotlightAction } from './discovery.ts'
import type { SpotlightHost } from './host.ts'
import {
  defaultShortcut, formatShortcut, isSpotlightShortcut, moveSelection, parseShortcut, shortcutFromEvent,
  type SpotlightShortcut,
} from './keyboard.ts'
import { capPerKind, searchCandidates } from './search.ts'

const STYLE_ID = 'dsh-spotlight-style'
const ROOT_ATTRIBUTE = 'data-dsh-spotlight-root'
const SHORTCUT_STORAGE_KEY = 'dsh.spotlight.shortcut.v1'
const KIND_LABEL: Record<SpotlightAction['kind'], string> = {
  action: '操作', command: '命令', session: '会话', plugin: '插件',
}

/** The palette consumes the host theme's alias tokens so it follows light/dark and brand overrides. */
const CSS = `
[data-dsh-spotlight-root] { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: start center; padding-top: min(14vh, 120px); background: rgba(8, 10, 16, .48); backdrop-filter: blur(6px); font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
[data-dsh-spotlight-panel] { width: min(680px, calc(100vw - 28px)); max-height: min(620px, calc(100vh - 48px)); overflow: hidden; border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12)); border-radius: 18px; background: var(--dsw-alias-bg-overlay, #17191f); color: var(--dsw-alias-label-primary, #f5f7fb); box-shadow: 0 24px 80px rgba(0,0,0,.42); }
[data-dsh-spotlight-search] { display: flex; align-items: center; gap: 12px; padding: 18px 18px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.1)); }
[data-dsh-spotlight-search] svg { width: 20px; height: 20px; flex: none; color: var(--dsw-alias-label-secondary, #949aa8); }
[data-dsh-spotlight-input] { width: 100%; border: 0; outline: 0; background: transparent; color: inherit; font: inherit; font-size: 17px; line-height: 1.5; }
[data-dsh-spotlight-input]::placeholder { color: var(--dsw-alias-label-secondary, #8f96a3); }
[data-dsh-spotlight-results] { max-height: min(470px, calc(100vh - 190px)); overflow: auto; padding: 8px; }
[data-dsh-spotlight-option] { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 11px 12px; border: 0; border-radius: 11px; background: transparent; color: inherit; text-align: left; cursor: pointer; }
[data-dsh-spotlight-option][aria-selected="true"], [data-dsh-spotlight-option]:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 16%, transparent); }
[data-dsh-spotlight-title] { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 620; }
[data-dsh-spotlight-detail] { display: block; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-secondary, #969dab); font-size: 12px; }
[data-dsh-spotlight-kind] { padding: 3px 7px; border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12)); border-radius: 999px; color: var(--dsw-alias-label-secondary, #a1a7b3); font-size: 11px; }
[data-dsh-spotlight-empty] { padding: 42px 18px; color: var(--dsw-alias-label-secondary, #969dab); text-align: center; font-size: 13px; }
[data-dsh-spotlight-footer] { display: flex; justify-content: space-between; gap: 12px; padding: 10px 16px 12px; border-top: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.08)); color: var(--dsw-alias-label-secondary, #8f96a3); font-size: 11px; }
[data-dsh-spotlight-footer] kbd { padding: 2px 5px; border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.14)); border-radius: 5px; background: rgba(255,255,255,.04); font: inherit; }
[data-dsh-spotlight-footer-controls] { display: flex; align-items: center; gap: 10px; }
[data-dsh-spotlight-shortcut], [data-dsh-spotlight-shortcut-reset] { border: 0; padding: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; }
[data-dsh-spotlight-shortcut]:hover, [data-dsh-spotlight-shortcut-reset]:hover { color: var(--dsw-alias-label-primary, #f5f7fb); }
[data-dsh-spotlight-shortcut][data-recording="true"] { color: var(--dsw-alias-label-primary, #f5f7fb); }
@media (prefers-reduced-motion: no-preference) { [data-dsh-spotlight-panel] { animation: dsh-spotlight-in .12s ease-out; } @keyframes dsh-spotlight-in { from { opacity: 0; transform: translateY(-8px) scale(.985); } } }
`

function icon(document: Document): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '2')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('d', 'm21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z')
  svg.appendChild(path)
  return svg
}

/** Mount the browser contribution and return its disposer plus a programmatic opener. */
export function mountSpotlight(host: SpotlightHost, document: Document, window: Window): {
  dispose(): void
  open(): void
} {
  const body = document.body
  if (body === null) return { dispose: () => undefined, open: () => undefined }

  let ownsStyle = false
  if (document.getElementById(STYLE_ID) === null) {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
    ownsStyle = true
  }

  let root: HTMLElement | undefined
  let previousFocus: HTMLElement | undefined
  let recordingShortcut = false
  const applePlatform = new RegExp('Mac|iPhone|iPad', 'i').test(window.navigator.platform)
  const fallbackShortcut = defaultShortcut(applePlatform)
  let shortcut: SpotlightShortcut = fallbackShortcut
  try {
    shortcut = parseShortcut(JSON.parse(window.localStorage.getItem(SHORTCUT_STORAGE_KEY) ?? 'null')) ?? fallbackShortcut
  } catch {}

  const saveShortcut = (next: SpotlightShortcut | undefined): void => {
    shortcut = next ?? fallbackShortcut
    try {
      if (next === undefined) window.localStorage.removeItem(SHORTCUT_STORAGE_KEY)
      else window.localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }

  const close = (): void => {
    recordingShortcut = false
    root?.remove()
    root = undefined
    if (previousFocus?.isConnected === true) previousFocus.focus({ preventScroll: true })
    previousFocus = undefined
  }

  const open = (): void => {
    if (root !== undefined) return
    document.querySelector<HTMLElement>(`[${ROOT_ATTRIBUTE}]`)?.remove()
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined

    const overlay = document.createElement('div')
    overlay.setAttribute(ROOT_ATTRIBUTE, '')
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', 'DSH Spotlight')

    const panel = document.createElement('section')
    panel.setAttribute('data-dsh-spotlight-panel', '')
    const search = document.createElement('div')
    search.setAttribute('data-dsh-spotlight-search', '')
    search.appendChild(icon(document))
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = '搜索操作、命令、会话或插件…'
    input.autocomplete = 'off'
    input.spellcheck = false
    input.setAttribute('data-dsh-spotlight-input', '')
    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-autocomplete', 'list')
    input.setAttribute('aria-expanded', 'true')
    input.setAttribute('aria-controls', 'dsh-spotlight-results')
    search.appendChild(input)

    const results = document.createElement('div')
    results.id = 'dsh-spotlight-results'
    results.setAttribute('data-dsh-spotlight-results', '')
    results.setAttribute('role', 'listbox')
    const footer = document.createElement('footer')
    footer.setAttribute('data-dsh-spotlight-footer', '')
    const count = document.createElement('span')
    const controls = document.createElement('span')
    controls.setAttribute('data-dsh-spotlight-footer-controls', '')
    const shortcutButton = document.createElement('button')
    shortcutButton.type = 'button'
    shortcutButton.setAttribute('data-dsh-spotlight-shortcut', '')
    shortcutButton.setAttribute('aria-label', '设置 Spotlight 快捷键')
    const resetShortcut = document.createElement('button')
    resetShortcut.type = 'button'
    resetShortcut.setAttribute('data-dsh-spotlight-shortcut-reset', '')
    resetShortcut.setAttribute('aria-label', '恢复默认快捷键')
    resetShortcut.textContent = '恢复默认'
    const help = document.createElement('span')
    help.innerHTML = '<kbd>↑↓</kbd> 选择&nbsp;&nbsp;<kbd>↵</kbd> 执行&nbsp;&nbsp;<kbd>esc</kbd> 关闭'
    controls.append(shortcutButton, resetShortcut, help)
    footer.append(count, controls)
    panel.append(search, results, footer)
    overlay.appendChild(panel)
    body.appendChild(overlay)
    root = overlay

    let actions: SpotlightAction[] = []
    try {
      actions = discoverVisibleActions(host, document)
    } catch (error) {
      console.warn('[dsh-spotlight] visible discovery failed', error)
    }
    let matches = searchCandidates(actions, '')
    let active = matches.length > 0 ? 0 : -1

    const renderShortcut = (): void => {
      shortcutButton.textContent = recordingShortcut
        ? '请按新快捷键…'
        : `快捷键 ${formatShortcut(shortcut, applePlatform)}`
      shortcutButton.setAttribute('data-recording', String(recordingShortcut))
    }

    shortcutButton.addEventListener('click', () => {
      recordingShortcut = true
      renderShortcut()
      shortcutButton.focus({ preventScroll: true })
    })
    shortcutButton.addEventListener('keydown', event => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') {
        recordingShortcut = false
        renderShortcut()
        input.focus({ preventScroll: true })
        return
      }
      const next = shortcutFromEvent(event)
      if (next === undefined) return
      saveShortcut(next)
      recordingShortcut = false
      renderShortcut()
      input.focus({ preventScroll: true })
    })
    resetShortcut.addEventListener('click', () => {
      saveShortcut(undefined)
      recordingShortcut = false
      renderShortcut()
      input.focus({ preventScroll: true })
    })

    const execute = (action: SpotlightAction): void => {
      close()
      action.run()
    }

    const render = (): void => {
      matches = capPerKind(searchCandidates(actions, input.value, 200), 6)
      if (active >= matches.length) active = matches.length - 1
      if (active < 0 && matches.length > 0) active = 0
      results.textContent = ''
      if (matches.length === 0) {
        const empty = document.createElement('div')
        empty.setAttribute('data-dsh-spotlight-empty', '')
        empty.textContent = '没有匹配结果'
        results.appendChild(empty)
        input.removeAttribute('aria-activedescendant')
      } else {
        matches.forEach(({ item }, index) => {
          const option = document.createElement('button')
          option.type = 'button'
          option.id = `dsh-spotlight-option-${index}`
          option.setAttribute('data-dsh-spotlight-option', '')
          option.setAttribute('role', 'option')
          const copy = document.createElement('span')
          const title = document.createElement('span')
          title.setAttribute('data-dsh-spotlight-title', '')
          title.textContent = item.title
          const detail = document.createElement('span')
          detail.setAttribute('data-dsh-spotlight-detail', '')
          detail.textContent = item.detail ?? ''
          copy.append(title, detail)
          const kind = document.createElement('span')
          kind.setAttribute('data-dsh-spotlight-kind', '')
          kind.textContent = KIND_LABEL[item.kind]
          option.append(copy, kind)
          option.addEventListener('mousemove', () => {
            if (active !== index) { active = index; render() }
          })
          option.addEventListener('click', () => { execute(item) })
          results.appendChild(option)
        })
        input.setAttribute('aria-activedescendant', `dsh-spotlight-option-${active}`)
      }
      count.textContent = `${matches.length} 个结果`
    }

    input.addEventListener('input', () => { active = 0; render() })
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        active = moveSelection(active, matches.length, event.key === 'ArrowDown' ? 1 : -1)
        render()
        document.getElementById(`dsh-spotlight-option-${active}`)?.scrollIntoView({ block: 'nearest' })
        return
      }
      if (event.key === 'Enter' && active >= 0) {
        event.preventDefault()
        const action = matches[active]?.item
        if (action !== undefined) execute(action)
      }
    })
    overlay.addEventListener('mousedown', event => { if (event.target === overlay) close() })
    render()
    renderShortcut()
    input.focus({ preventScroll: true })
    void discoverActions(host, document).then(discovered => {
      if (root !== overlay) return
      actions = discovered
      active = 0
      render()
      input.focus({ preventScroll: true })
    }).catch(error => {
      console.warn('[dsh-spotlight] async discovery failed', error)
    })
  }

  const onGlobalKeydown = (event: KeyboardEvent): void => {
    if (recordingShortcut || !isSpotlightShortcut(event, shortcut)) return
    event.preventDefault()
    event.stopPropagation()
    if (root === undefined) open()
    else close()
  }
  window.addEventListener('keydown', onGlobalKeydown, true)

  const dispose = (): void => {
    window.removeEventListener('keydown', onGlobalKeydown, true)
    close()
    if (ownsStyle) document.getElementById(STYLE_ID)?.remove()
  }

  return { dispose, open }
}
