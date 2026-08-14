/**
 * DSH Web client contribution for `@0xsline/dsh-spotlight`. Loaded
 * through the official client channel: the host scans this package's
 * `dsh.client` declaration and mounts the bundle's named exports as a Cordis
 * plugin. The palette mounts once the host sessions, command-plane, and
 * plugin-inventory services exist — all three are composition-critical in
 * every stock DSH Web deployment, so hard injection cannot fail the boot
 * beyond what the host UI itself already requires. An optional `/spotlight`
 * slash command registers through the host command UI where it exists.
 *
 * Host services are read by name only (narrow local contracts in
 * `src/spotlight/host.ts`).
 * @module @0xsline/dsh-spotlight/client
 */

import type { Context } from 'cordis'
import { mountSpotlight } from '../spotlight/mount.ts'
import type {
  SpotlightCommands, SpotlightCommandUi, SpotlightHost, SpotlightPluginInventory, SpotlightSessions,
} from '../spotlight/host.ts'

/** Cordis plugin name. */
export const name = 'dsh-spotlight-client'

/**
 * Services required before the palette mounts. All are provided by the stock
 * DSH Web roster (runtime, api-remotes, ui-commands); the command and
 * inventory Remotes carry inject-guarded descriptors, so the entry must
 * declare them.
 */
export const inject = ['sessions', 'remote.commands', 'remote.pluginInventory', 'commandUi']
/** The `/spotlight` contribution: a popupSelect entry that opens the palette. */
function registerSpotlightCommand(commandUi: SpotlightCommandUi, open: () => void): () => void {
  return commandUi.register({
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
}

/**
 * Apply the client plugin: mount the palette and register the `/spotlight`
 * command where the host command UI exists.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => {
    const host: SpotlightHost = {
      sessions: ctx.get('sessions') as SpotlightSessions,
      commands: ctx.get('remote.commands') as SpotlightCommands,
      pluginInventory: ctx.get('remote.pluginInventory') as SpotlightPluginInventory,
    }
    const { dispose, open } = mountSpotlight(host, document, window)
    const disposeCommand = registerSpotlightCommand(ctx.get('commandUi') as SpotlightCommandUi, open)
    return () => {
      disposeCommand()
      dispose()
    }
  })
}
