/**
 * DSH Web client contribution for `@0xsline/dsh-spotlight`. Loaded
 * through the official client channel: the host scans this package's
 * `dsh.client` declaration and mounts the bundle's named exports as a Cordis
 * plugin. The palette mounts once the host sessions service exists, and an
 * optional `/spotlight` slash command registers through the host command UI.
 *
 * Host services are read by name only (narrow local contracts in
 * `src/spotlight/host.ts`); missing optional services degrade the affected
 * categories instead of failing the web boot.
 * @module @0xsline/dsh-spotlight/client
 */

import type { Context } from 'cordis'
import { mountSpotlight } from '../spotlight/mount.ts'
import type {
  SpotlightCommands, SpotlightCommandUi, SpotlightHost, SpotlightPluginInventory, SpotlightSessions,
} from '../spotlight/host.ts'

/** Cordis plugin name. */
export const name = 'dsh-spotlight-client'

/** No hard dependencies: the mount attaches through scoped injection. */
export const inject: string[] = []

/** The `remote` service face carrying the command and plugin-inventory namespaces. */
interface RemoteFacade {
  commands?: SpotlightCommands
  pluginInventory?: SpotlightPluginInventory
}

/** Assemble the host contract from named services; undefined without `sessions`. */
function resolveHost(ctx: Context): SpotlightHost | undefined {
  const sessions = ctx.get('sessions') as SpotlightSessions | undefined
  if (sessions === undefined) return undefined
  const remote = ctx.get('remote') as RemoteFacade | undefined
  return {
    sessions,
    ...(remote?.commands !== undefined ? { commands: remote.commands } : {}),
    ...(remote?.pluginInventory !== undefined ? { pluginInventory: remote.pluginInventory } : {}),
  }
}

/** The `/spotlight` contribution: a popupSelect entry that opens the palette. */
function registerSpotlightCommand(scope: Context, open: () => void): (() => void) | undefined {
  let commandDispose: (() => void) | undefined
  let disposed = false
  const dispose = (): void => {
    if (disposed) return
    disposed = true
    commandDispose?.()
    commandDispose = undefined
  }
  scope.inject(['commandUi'], (uiScope) => {
    if (disposed) return
    const commandUi = uiScope.get('commandUi') as SpotlightCommandUi | undefined
    if (commandUi === undefined) return
    commandDispose = commandUi.register({
      name: 'spotlight',
      description: '打开 Spotlight 命令面板 · Open the Spotlight palette',
      available: () => true,
      ui: {
        kind: 'popupSelect',
        options: async () => [
          { id: 'open', label: '打开 Spotlight', detail: 'Open the Spotlight palette' },
        ],
        onSelect: () => { open() },
      },
    })
    uiScope.effect(() => {
      commandDispose?.()
      commandDispose = undefined
      return () => undefined
    })
  })
  return dispose
}

/**
 * Apply the client plugin: mount the palette in the sessions scope and expose
 * the `/spotlight` command where the host command UI exists.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['sessions'], (scope) => {
    scope.effect(() => {
      const host = resolveHost(scope)
      if (host === undefined) return () => undefined
      const { dispose, open } = mountSpotlight(host, document, window)
      const disposeCommand = registerSpotlightCommand(scope, open)
      return () => {
        disposeCommand?.()
        dispose()
      }
    })
  })
}
