import type { SearchCandidate } from './search.ts'

/** A searchable operation backed by the current DSH Web document. */
export interface SpotlightAction extends SearchCandidate {
  run(): void
}

const ACTIONABLE_SELECTOR = 'a[href], button, [role="button"], [role="menuitem"], [role="option"], [role="tab"]'
const SPOTLIGHT_ROOT_SELECTOR = '[data-dsh-spotlight-root]'
const COMMAND_LABEL = new RegExp('^(?:commands?|命令)$', 'i')
const SETTINGS_LABEL = new RegExp('^(?:settings?|设置)$', 'i')
const PLUGINS_LABEL = new RegExp('^(?:plugins?|插件)$', 'i')

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

function commandButtonOf(document: Document): HTMLElement | undefined {
  return actionable(document).find(element =>
    element.getAttribute('aria-haspopup') === 'listbox'
    && COMMAND_LABEL.test(labelOf(element)))
}

function nativeCommandOptions(document: Document): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[role="option"]')]
    .filter(element => !belongsToSpotlight(element))
}

function waitForCommandOptions(document: Document): Promise<HTMLElement[]> {
  const existing = nativeCommandOptions(document)
  if (existing.length > 0) return Promise.resolve(existing)
  const window = document.defaultView
  if (window === null) return Promise.resolve([])
  return new Promise(resolve => {
    let timer = 0
    const observer = new window.MutationObserver(() => {
      const options = nativeCommandOptions(document)
      if (options.length === 0) return
      observer.disconnect()
      window.clearTimeout(timer)
      resolve(options)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    timer = window.setTimeout(() => {
      observer.disconnect()
      resolve([])
    }, 1000)
  })
}

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

  const newChat = firstAction(document, /(?:new (?:chat|session|conversation)|新建(?:会话|对话|聊天))/i)
  if (newChat !== undefined) {
    actions.push({
      id: 'new-chat', kind: 'action', title: '新建会话', detail: 'New conversation',
      keywords: ['chat', 'session', 'conversation'], run: () => { newChat.click() },
    })
  }

  const settings = firstAction(document, SETTINGS_LABEL)
  if (settings !== undefined) {
    actions.push({
      id: 'open-plugins', kind: 'action', title: '打开插件设置', detail: 'Open installed plugins',
      keywords: ['settings', 'extensions', '插件'],
      run: () => {
        settings.click()
        document.defaultView?.setTimeout(() => {
          const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
          const plugins = [...dialog?.querySelectorAll<HTMLElement>('button, [role="tab"]') ?? []]
            .find(element => PLUGINS_LABEL.test(labelOf(element)))
          plugins?.click()
        }, 200)
      },
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

function slashCommands(document: Document, commandButton: HTMLElement, elements: Iterable<HTMLElement>): SpotlightAction[] {
  const actions: SpotlightAction[] = []
  for (const element of elements) {
    if (belongsToSpotlight(element)) continue
    const raw = (
      element.getAttribute('data-command')
      ?? element.getAttribute('data-slash-command')
      ?? element.children.item(0)?.textContent
      ?? ''
    ).trim()
    const commandName = raw.startsWith('/') ? raw : `/${raw}`
    if (!/^\/[\p{L}\p{N}_:-]+$/u.test(commandName) || commandName.length > 80) continue
    const detail = element.children.item(1)?.textContent?.trim() || 'Slash command'
    actions.push({
      id: commandName,
      kind: 'command',
      title: commandName,
      detail,
      keywords: [raw, detail],
      run: () => {
        const liveButton = commandButtonOf(document) ?? commandButton
        if (liveButton.getAttribute('aria-expanded') !== 'true') liveButton.click()
        void waitForCommandOptions(document).then(options => {
          const option = options
            .find(candidate => candidate.children.item(0)?.textContent?.trim() === commandName.slice(1))
          if (option !== undefined) {
            option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: document.defaultView }))
          }
          else insertCommand(document, commandName)
        })
      },
    })
  }
  return actions
}

async function hiddenSlashCommands(document: Document): Promise<SpotlightAction[]> {
  const commandButton = commandButtonOf(document)
  if (commandButton === undefined) return []
  const wasOpen = commandButton.getAttribute('aria-expanded') === 'true'
  if (!wasOpen) commandButton.click()
  const options = await waitForCommandOptions(document)
  const actions = slashCommands(document, commandButton, options)
  const liveButton = commandButtonOf(document) ?? commandButton
  if (!wasOpen && liveButton.getAttribute('aria-expanded') === 'true') {
    liveButton.click()
  }
  return actions
}

function recentSessions(document: Document): SpotlightAction[] {
  const actions: SpotlightAction[] = []
  for (const element of document.querySelectorAll<HTMLElement>('[role="treeitem"][aria-selected], a[href], [data-session-id]')) {
    if (belongsToSpotlight(element)) continue
    const href = element.getAttribute('href') ?? ''
    const treeSession = element.getAttribute('role') === 'treeitem' && element.hasAttribute('aria-selected')
    const sessionId = (element.getAttribute('data-session-id') ?? href) || labelOf(element)
    if (sessionId === '' || (!treeSession && !element.hasAttribute('data-session-id') && !/(?:session|chat|thread|task)/i.test(href))) continue
    const parts = [...element.querySelectorAll<HTMLElement>('span')].map(labelOf).filter(Boolean)
    const title = treeSession ? parts[0] ?? labelOf(element) : labelOf(element)
    if (title === '') continue
    actions.push({
      id: sessionId,
      kind: 'session',
      title,
      detail: parts.slice(1).join(' · ') || '最近会话 · Recent session',
      keywords: [sessionId],
      run: () => { element.click() },
    })
  }
  return actions
}

function installedPlugins(document: Document): SpotlightAction[] {
  const actions: SpotlightAction[] = []
  for (const element of document.querySelectorAll<HTMLElement>('[data-plugin-id], a[href*="plugin"]')) {
    if (belongsToSpotlight(element)) continue
    const id = element.getAttribute('data-plugin-id') ?? element.getAttribute('href') ?? ''
    const title = labelOf(element)
    if (id === '' || title === '') continue
    actions.push({
      id,
      kind: 'plugin',
      title,
      detail: '已安装插件 · Installed plugin',
      keywords: [id, 'settings', '插件'],
      run: () => { element.click() },
    })
  }
  return actions
}

/** Discover immediately visible actions represented by the current Web UI. */
export function discoverVisibleActions(document: Document): SpotlightAction[] {
  return unique([
    ...builtInActions(document),
    ...interfaceActions(document),
    ...recentSessions(document),
    ...installedPlugins(document),
  ])
}

/** Discover visible actions plus the host's lazily rendered Slash catalog. */
export async function discoverActions(document: Document): Promise<SpotlightAction[]> {
  const visible = discoverVisibleActions(document)
  const commands = await hiddenSlashCommands(document)
  return unique([...visible, ...commands])
}
