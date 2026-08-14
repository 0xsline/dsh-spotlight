import type { SearchCandidate } from './search.ts'
import type {
  SpotlightCommandDescriptor, SpotlightHost, SpotlightPluginEntry, SpotlightSessionSummary,
} from './host.ts'

/** A searchable operation backed by a DSH Web host service or the current page. */
export interface SpotlightAction extends SearchCandidate {
  run(): void
}

const ACTIONABLE_SELECTOR = 'a[href], button, [role="button"], [role="menuitem"], [role="option"], [role="tab"]'
const SPOTLIGHT_ROOT_SELECTOR = '[data-dsh-spotlight-root]'
const SETTINGS_LABEL = new RegExp('^(?:settings?|设置)$', 'i')
const PLUGINS_LABEL = new RegExp('^(?:plugins?|插件)$', 'i')
const NEW_CHAT_LABEL = new RegExp('^(?:new (?:chat|session|conversation)|新建(?:会话|对话|聊天))$', 'i')
/** Host command names are lowercase ASCII with letters, digits, `_` or `-`. */
const COMMAND_NAME = new RegExp('^[a-z0-9_-]{1,80}$')

function belongsToSpotlight(element: HTMLElement): boolean {
  return element.closest(SPOTLIGHT_ROOT_SELECTOR) !== null
}

function labelOf(element: HTMLElement): string {
  return (
    element.getAttribute('aria-label')
    ?? element.getAttribute('title')
    ?? element.textContent
    ?? ''
  ).replace(new RegExp('\\s+', 'g'), ' ').trim()
}

function actionable(document: Document): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(ACTIONABLE_SELECTOR)]
    .filter(element => !belongsToSpotlight(element) && element.getClientRects().length > 0)
}

function firstAction(document: Document, pattern: RegExp): HTMLElement | undefined {
  return actionable(document).find(element =>
    pattern.test(labelOf(element)) || pattern.test(element.getAttribute('href') ?? ''))
}

function composerOf(document: Document): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('textarea, [contenteditable="true"], [role="textbox"]')]
    .find(element => element.getAttribute('aria-hidden') !== 'true')
}

/** Insert a command line into the composer so the native slash pipeline owns the rest. */
function insertCommand(document: Document, command: string): void {
  const composer = composerOf(document)
  if (composer === undefined) return
  if (composer instanceof HTMLInputElement || composer instanceof HTMLTextAreaElement) {
    composer.value = command
  } else {
    composer.textContent = command
  }
  composer.dispatchEvent(new Event('input', { bubbles: true }))
  composer.focus()
}

function chatScroller(document: Document): HTMLElement | undefined {
  let element = document.querySelector<HTMLElement>('[data-chat-flow=""]')?.parentElement
  while (element !== null && element !== undefined) {
    const overflow = getComputedStyle(element).overflowY
    if (overflow === 'auto' || overflow === 'scroll') return element
    element = element.parentElement
  }
  return undefined
}

function unique(actions: SpotlightAction[]): SpotlightAction[] {
  const seen = new Set<string>()
  return actions.filter(action => {
    const key = `${action.kind}:${action.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Wait for an actionable element matching the predicate, without a fixed sleep. */
function waitForActionable(
  document: Document,
  predicate: (element: HTMLElement) => boolean,
  timeoutMs: number,
): Promise<HTMLElement | undefined> {
  const existing = actionable(document).find(predicate)
  if (existing !== undefined) return Promise.resolve(existing)
  const window = document.defaultView
  if (window === null) return Promise.resolve(undefined)
  return new Promise(resolve => {
    let timer = 0
    const observer = new window.MutationObserver(() => {
      const found = actionable(document).find(predicate)
      if (found === undefined) return
      observer.disconnect()
      window.clearTimeout(timer)
      resolve(found)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    timer = window.setTimeout(() => {
      observer.disconnect()
      resolve(undefined)
    }, timeoutMs)
  })
}

/** Open the Web settings surface and switch to the installed-plugins section. */
export async function openPluginSettings(document: Document): Promise<void> {
  const settings = firstAction(document, SETTINGS_LABEL)
  if (settings === undefined) return
  settings.click()
  const plugins = await waitForActionable(document, element => PLUGINS_LABEL.test(labelOf(element)), 2000)
  plugins?.click()
}

/** Immediately available operations read from the current page structure. */
function builtInActions(document: Document): SpotlightAction[] {
  const actions: SpotlightAction[] = []
  const composer = composerOf(document)
  if (composer !== undefined) {
    actions.push({
      id: 'focus-composer', kind: 'action', title: '聚焦输入框',
      detail: 'Focus message composer', keywords: ['input', 'prompt', '输入'],
      run: () => { composer.focus() },
    })
  }

  const newChat = firstAction(document, NEW_CHAT_LABEL)
  if (newChat !== undefined) {
    actions.push({
      id: 'new-chat', kind: 'action', title: '新建会话', detail: 'New conversation',
      keywords: ['chat', 'session', 'conversation'], run: () => { newChat.click() },
    })
  }

  const settings = firstAction(document, SETTINGS_LABEL)
  if (settings !== undefined) {
    actions.push({
      id: 'open-plugins', kind: 'action', title: '打开插件设置', detail: 'Open installed plugin settings',
      keywords: ['settings', 'extensions', '插件'],
      run: () => { void openPluginSettings(document) },
    })
  }

  const scroller = chatScroller(document)
  if (scroller !== undefined) {
    actions.push(
      {
        id: 'chat-top', kind: 'action', title: '跳到会话开头', detail: 'Jump to oldest message',
        keywords: ['top', 'first', '开头'], run: () => { scroller.scrollTo({ top: 0, behavior: 'smooth' }) },
      },
      {
        id: 'chat-bottom', kind: 'action', title: '跳到会话末尾', detail: 'Jump to newest message',
        keywords: ['bottom', 'latest', '末尾'], run: () => { scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' }) },
      },
    )
  }
  return actions
}

/** Interface operations: elements that carry an explicit label or are tabs. */
function interfaceActions(document: Document): SpotlightAction[] {
  const excluded = new RegExp('^(?:new (?:chat|session|conversation)|新建(?:会话|对话|聊天)|send message|发送消息|close|关闭(?:详情)?|commands?|命令)$', 'i')
  return actionable(document).flatMap(element => {
    const explicitLabel = element.getAttribute('aria-label') ?? element.getAttribute('title')
    if (explicitLabel === null && element.getAttribute('role') !== 'tab') return []
    const title = explicitLabel?.trim() || labelOf(element)
    if (title === '' || title.length > 80 || excluded.test(title)) return []
    if (element.getAttribute('aria-disabled') === 'true' || (element instanceof HTMLButtonElement && element.disabled)) return []
    return [{
      id: `ui:${title}`,
      kind: 'action' as const,
      title,
      detail: '界面操作 · UI action',
      keywords: [element.getAttribute('href') ?? ''],
      run: () => { element.click() },
    }]
  })
}

/** Recent sessions straight from the host sessions service, newest order preserved. */
function sessionActions(host: SpotlightHost): SpotlightAction[] {
  const snapshot = host.sessions.list.getSnapshot()
  return snapshot.ids.flatMap(id => {
    const session: SpotlightSessionSummary | undefined = snapshot.byId[id]
    if (session === undefined || session.blank === true) return []
    const detail = [
      session.cwd,
      session.agentPreset !== undefined ? `Preset: ${session.agentPreset}` : undefined,
      session.running ? '运行中' : undefined,
    ].filter((part): part is string => part !== undefined).join(' · ') || '最近会话 · Recent session'
    return [{
      id: `session:${session.id}`,
      kind: 'session',
      title: session.displayTitle,
      detail,
      keywords: [session.id, session.cwd ?? ''],
      run: () => { host.sessions.open(session.id) },
    }]
  })
}

/** Dispatch one bare host command; argued commands fall through to the composer claim path. */
async function runSlashCommand(
  host: SpotlightHost,
  document: Document,
  descriptor: SpotlightCommandDescriptor,
  name: string,
): Promise<void> {
  const commands = host.commands
  const sessionId = host.sessions.list.getSnapshot().current
  if (commands === undefined || sessionId === undefined || descriptor.input !== undefined) {
    insertCommand(document, `/${name} `)
    return
  }
  try {
    const result = await commands.execute(sessionId, `/${name}`)
    if (!result.ok || result.value === undefined) {
      // Unknown or rejected: hand the line to the native slash pipeline.
      insertCommand(document, `/${name} `)
    }
  } catch {
    insertCommand(document, `/${name} `)
  }
}

/** The host command catalog for the current session, exposed as palette commands. */
function commandActions(host: SpotlightHost, document: Document): Promise<SpotlightAction[]> {
  const commands = host.commands
  if (commands === undefined) return Promise.resolve([])
  const sessionId = host.sessions.list.getSnapshot().current
  if (sessionId === undefined) return Promise.resolve([])
  return commands.list(sessionId).then(result => {
    if (!result.ok) return []
    return result.value.flatMap(descriptor => {
      const name = descriptor.name.trim()
      if (!COMMAND_NAME.test(name)) return []
      return [{
        id: `command:${name}`,
        kind: 'command',
        title: `/${name}`,
        detail: descriptor.description?.trim() || 'Slash command',
        keywords: [name, descriptor.description ?? ''],
        run: () => { void runSlashCommand(host, document, descriptor, name) },
      }]
    })
  }, () => [] as SpotlightAction[])
}

/** Compact a module specifier into a display name. */
function pluginDisplayName(moduleName: string): string {
  const unscoped = moduleName.startsWith('@') ? moduleName.slice(moduleName.indexOf('/') + 1) : moduleName
  return unscoped.replace(new RegExp('^(?:cordis-plugin-|dsh-(?:host-|client-)?)'), '') || moduleName
}

/** Installed plugins from the host inventory, each jumping to the Plugins settings section. */
function pluginActions(host: SpotlightHost, document: Document): Promise<SpotlightAction[]> {
  const inventory = host.pluginInventory
  if (inventory === undefined) return Promise.resolve([])
  return inventory.list().then(result => {
    if (!result.ok) return []
    return result.value.entries.flatMap((entry: SpotlightPluginEntry) => {
      const title = pluginDisplayName(entry.moduleName)
      if (title === '') return []
      return [{
        id: `plugin:${entry.entryId}`,
        kind: 'plugin',
        title,
        detail: `${entry.entryId}${entry.enabled ? '' : ' · 已禁用'}`,
        keywords: [entry.entryId, entry.moduleName, '插件', 'plugin'],
        run: () => { void openPluginSettings(document) },
      }]
    })
  }, () => [] as SpotlightAction[])
}

/** Discover immediately available actions: built-ins, sessions, and interface elements. */
export function discoverVisibleActions(host: SpotlightHost, document: Document): SpotlightAction[] {
  return unique([
    ...builtInActions(document),
    ...sessionActions(host),
    ...interfaceActions(document),
  ])
}

/** Discover the full action set: visible actions plus the host command and plugin catalogs. */
export async function discoverActions(host: SpotlightHost, document: Document): Promise<SpotlightAction[]> {
  const visible = discoverVisibleActions(host, document)
  const [commands, plugins] = await Promise.all([
    commandActions(host, document),
    pluginActions(host, document),
  ])
  return unique([...visible, ...commands, ...plugins])
}
