/**
 * Narrow local contracts for the host-provided client services the Spotlight
 * browser half consumes. The host supplies these through Cordis named lookup;
 * this package never imports host source, so each interface states only the
 * fields the Spotlight actually reads. Every surface is optional to read
 * except `sessions`, which gates the whole mount.
 *
 * Host references (upstream contract owners, for drift checking):
 * - `ctx.sessions`            packages/client/runtime/src/client/contract/sessions.ts
 * - `ctx.remote.commands`     packages/interaction/commands + api-remotes Remote
 * - `ctx.remote.pluginInventory` packages/host/plugin-inventory
 * - `ctx.commandUi`           packages/client/ui-commands/src/client/contract.ts
 * @module @0xsline/dsh-spotlight/host
 */

export type SpotlightSessionId = string

/** One session row the Spotlight reads from the host list snapshot. */
export interface SpotlightSessionSummary {
  id: SpotlightSessionId
  displayTitle: string
  cwd?: string
  agentPreset?: string
  running: boolean
  blank?: boolean
}

/** The list-snapshot face the Spotlight reads (subset of the host's SessionListState). */
export interface SpotlightSessionList {
  ids: SpotlightSessionId[]
  byId: Record<SpotlightSessionId, SpotlightSessionSummary>
  current: SpotlightSessionId | undefined
}

/** Observable-snapshot + selection face the Spotlight uses (subset of the host's ISessions). */
export interface SpotlightSessions {
  list: { getSnapshot(): SpotlightSessionList }
  open(id: SpotlightSessionId): void
}

/** Host RPC outcome envelope (subset of the host's RpcResult). */
export interface RpcOk<T> { ok: true, value: T }
export interface RpcError { ok: false, error: { code: string, message: string } }
export type RpcResult<T> = RpcOk<T> | RpcError

/** One host slash command (subset of the host's CommandDescriptor). */
export interface SpotlightCommandDescriptor {
  name: string
  description?: string
  input?: { hint?: string }
}

/** The host command plane RPC face the Spotlight uses (subset of `remote.commands`). */
export interface SpotlightCommands {
  list(sessionId: SpotlightSessionId): Promise<RpcResult<readonly SpotlightCommandDescriptor[]>>
  execute(sessionId: SpotlightSessionId, line: string): Promise<RpcResult<{ result: unknown } | undefined>>
}

/** One Loader inventory row (subset of the host's PluginInventoryEntry). */
export interface SpotlightPluginEntry {
  entryId: string
  moduleName: string
  enabled: boolean
}

/** The host plugin-inventory RPC face the Spotlight uses (subset of `remote.pluginInventory`). */
export interface SpotlightPluginInventory {
  list(): Promise<RpcResult<{ entries: readonly SpotlightPluginEntry[] }>>
}

/** One popupSelect option row (subset of the host's SelectOption). */
export interface SpotlightSelectOption {
  id: string
  label: string
  detail?: string
}

/** Client command contribution shape accepted by the host's `commandUi` registry. */
export interface SpotlightCommandContribution {
  name: string
  description: string
  available(session: unknown): boolean
  ui: {
    kind: 'popupSelect'
    options(session: unknown, signal: AbortSignal): Promise<readonly SpotlightSelectOption[]>
    onSelect(option: SpotlightSelectOption, session: unknown): void | Promise<void>
  }
}

/** The `ctx.commandUi` registry face the Spotlight uses to expose `/spotlight`. */
export interface SpotlightCommandUi {
  register(contribution: SpotlightCommandContribution): () => void
}

/** Every host service the Spotlight browser half reads, assembled from the Cordis context. */
export interface SpotlightHost {
  sessions: SpotlightSessions
  commands?: SpotlightCommands
  pluginInventory?: SpotlightPluginInventory
  commandUi?: SpotlightCommandUi
}
