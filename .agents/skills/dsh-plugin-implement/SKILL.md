---
name: dsh-plugin-implement
description: Use after planning and scaffolding, or when extending an existing standalone DSH plugin. Implement the selected Cordis function or service plugin with validated configuration, declared injections, fiber-owned registrations, package invariants, bundle metadata, dependency alignment, JSDoc, README updates, and focused tests.
---

# Implement a Standalone DSH Plugin

This skill applies the implementation rules shared by official DSH plugins. It is guidance, not permission to expand scope: implement the approved handoff, inspect every current API you import, and stop for a design decision when the code would change the planned public behavior.

## Read current owners

Read the target project-root files `AGENTS.md`, `README.md`, `src/README.md`, and `docs/dsh-plugin-contracts.md`. Inspect only declarations installed below the repository root for every imported API and record the exact host-facing service contract in the package README before changing service relationships or lifecycle code. Stop when a required contract is absent; do not read another checkout.

Keep `src/index.ts` as the Loader boundary, configuration in `src/config.ts`, and fakeable host/process boundaries plus activation in `src/runtime.ts`. Move cohesive behavior to capability-named `src/<feature>/` directories only when the implementation warrants the split.

For tool plugins, define the tool's render intent, locations, input schema, and visible output in the package README and tests. Do not rely on a workspace-only cookbook or SDK index; the package must contain the contract it needs.

## Preserve the selected plugin form

For a function plugin, keep one ESM namespace entry:

```ts
export const name = 'stable-plugin-id'
export const inject = ['requiredService']
export interface Config { /* serializable fields */ }
export const Config: z<Config> = z.object({ /* validation and defaults */ })
export function apply(ctx: Context, config: Config): void { /* effects */ }
```

Do not add a default export. The real Cordis Loader unwraps `exports.default ?? exports`; a stray default export drops `inject`, `Config`, and `apply` from the loaded namespace.

For a service plugin, default-export the `Service` subclass and use the class's current Cordis `inject`/`Config`/initialization conventions. Do not mix a service default export with competing function-plugin namespace metadata. Keep `src/invariant.ts` as its own function-plugin export.

## Use services explicitly

List every required service in `inject` before reading `ctx.<service>`. Read an optional service through `ctx.get(name)`; use scoped `ctx.inject` when behavior must attach and detach as that optional service appears. Extend `cordis` through declaration merging only when the package actually defines a context service or typed event.

Use package names across package boundaries and `.ts` extensions for local relative imports. Keep host-provided Cordis APIs as peers, external implementation libraries in `dependencies`, and development resolution through this repository's declared dependencies. Add no dependency, path alias, or project reference without a production import; never add a path that leaves the repository.

## Validate configuration and failures

Represent every deployment-varying choice as a documented, Schemastery-validated `Config` field. Resolve defaults once at the owning implementation boundary. Reject self-contained misconfiguration at load; reject environment-dependent unavailability at the earliest operation that can judge it. Never silently skip a requested registration or fall back to a less secure provider.

Trust TypeScript at typed same-process calls. Add runtime validation at configuration, parser, queued, durable/file, model/tool JSON, worker, process, and wire inputs, not around values already guaranteed by a local static interface.

Credentials never appear as literal defaults, committed patch values, logs, diagnostics, snapshots, or tests. Accept credential references or environment-variable names through the owning DSH mechanism.

## Own lifecycle effects

Every registry contribution must be an effect. Use `ctx.effect()`, `ctx.on()`, or the disposer returned by the registry so unloading the plugin fiber removes the contribution. A registration call that returns a disposer must be returned or captured by an owning effect, not discarded.

Publish state and emit events only after the operation's success point. Contain extension callbacks according to the owning service's rules. One asynchronous operation should have one lifecycle controller or transaction unless an independent owner or settlement point requires separate state. Disposal must stop new work and await owned in-flight work when the public contract promises quiescence.

Waterfall listeners call `next()` when delegating. Returning without it deliberately takes over or short-circuits the chain and must be documented and tested.

## Keep model-visible facts durable

Anything added to a model request must be reconstructable from the session log. Add the owning session event before deriving prompts, history, replay, UI echoes, or query views. Pin stable model-visible text and test dynamic output through the real assembled application path.

## Implement the invariant companion

Keep the exact manifest package name in `src/invariant.ts` and export it as `./invariant`. An installer checks an authoritative event/data relationship owned by this package. It must not assert service presence, method presence, plugin metadata, effects, or fixed examples. When no relationship exists, retain a concise package-specific `No runtime invariant:` explanation instead of inventing a check.

Non-empty installers need a positive path and a deliberately invalid negative path through the real invariant service. Ensure companion registration disposes with its fiber.

## Maintain composition and package metadata

Keep `package.json` exports, files, peers, development dependencies, TypeScript references, and `cordis.patch.yml` synchronized with code. A bundle patch inserts or overrides profile rows only; host source modifications belong in DSH itself and cannot be represented by `cordis.patch.yml`.

An id-targeted patch replaces the complete target `config`; restate every retained field. Keep static Loader metadata outside `!!js`; JavaScript interpolation is permitted only under plugin `config` in DSH composition.

## Document the package contract

Update public JSDoc and the package README in the same change as configuration, defaults, errors, events, exports, or behavior. Document prerequisites, configuration, behavior, failure modes, lifecycle/disposal, composition, verification, distribution assumptions, model/token/cache effects when relevant, and durable limitations. Remove template teaching text once it no longer describes the plugin.

Every exported function, class, type with non-obvious use, configuration field, and event needs concise contract documentation. Comments preserve behavior, ownership, timing, failure, and non-obvious rationale; they do not narrate implementation steps or tests.

## Implementation exit condition

Run focused tests while implementing, then return an updated handoff naming files changed, services imported, config fields, registrations/disposers, events, invariant behavior, bundle rows, docs updated, and tests currently passing. Implementation is not complete until every planned behavior has an observable test owner and no unplanned public API or configuration remains.
