---
name: dsh-plugin-plan
description: Use as the planning stage of dsh-plugin-development, or when asked to design a standalone DSH Cordis plugin without implementing it. Decide plugin form, roles, dependencies, configuration, invariant ownership, profile composition, evidence, and distribution before files are copied or code is written.
---

# Plan a Standalone DSH Plugin

This skill turns a requested capability into explicit package decisions. It is guidance, not a request to create files: write code only when the user also requested implementation.

## Sources of truth

Read the project-root files `README.md`, `AGENTS.md`, and `docs/dsh-plugin-contracts.md`. Inspect only package declarations installed below this repository root. If a required host contract is not represented there, stop until an approved registry dependency or local contract file is added to the repository; never traverse to another checkout.

## Confirm the request

Require an objective, observable outcome, target or planned repository location, package name, plugin id, intended consumer/profile, and distribution assumption. Ask once for missing decisions. Do not infer a public scope, default behavior, credential source, security policy, or repository destination.

## Choose the plugin form

Select exactly one runtime form:

- **Function plugin:** use named exports `name`, `inject`, `Config`, and `apply`; never add a default export because Loader unwrapping would discard the namespace metadata.
- **Service plugin:** default-export the `Service` subclass and put service registration/lifecycle on that class; do not also expose function-plugin metadata as a competing runtime entry.

Record whether the package is a service definition, provider, consumer, bundle, UI adapter, tool, command, or a justified combination. A new capability needs service-definition, provider, and consumer roles across the package graph; do not let one consumer's transport or UI concerns define a generic service API.

## Build the dependency matrix

For every imported DSH service or package, record:

| Fact | Decision |
|---|---|
| Package/API | Exact current package and export path |
| Availability | Required or optional |
| Cordis access | `inject` + `ctx.<service>`, or optional `ctx.get(name)`/scoped `ctx.inject` |
| Manifest | Peer dependency and development source |
| TypeScript | Local compiler configuration and installed package declarations |
| Composition | Existing base row or inserted bundle row |
| Test support | Real provider, focused fake, or composition fixture |

Required services belong in `inject`. Use `ctx.get(name)` for optional service reads; never use undeclared `ctx.<name>` access. Add only dependencies with a current production use.

## Design configuration

List each field with its type, validation, default or required status, evidence for that choice, and earliest failure point. Deployment-varying choices are validated `Config` fields rather than hidden constants. A default needs current-consumer evidence or relevant prior art; otherwise require an explicit value. Credential values stay outside committed configuration and flow through the owning credential service or environment-variable indirection.

Plan fail-loud behavior for self-contained misconfiguration at plugin load, and for environment-dependent failures at the earliest point where the environment can be judged.

## Choose the repository structure

Keep the baseline boundaries `src/index.ts`, `src/config.ts`, `src/runtime.ts`, `tests/harness.ts`, and `tests/plugin.spec.ts` focused. Record whether complexity justifies a capability-named `src/<feature>/` directory, additional shared harness support, visible fixtures under `tests/snapshots/`, or dependency or DSH-host patches under `patches/`. Do not pre-create directories copied from another plugin's product domains.

## Define ownership and lifecycle

Name every registration, listener, process, timer, watcher, callback, or asynchronous operation the plugin owns. Specify how the plugin fiber disposes it and what quiescent disposal means. Apply the lifecycle and cancellation rules in the project-root file `docs/dsh-plugin-contracts.md` before approving the design.

If the plugin adds model-visible input, plan the durable session event that makes it reconstructable. If it adds a tool, decide its UI render intent and locations before implementation and record the host-facing render contract in the package README.

## Decide the invariant companion

Every package exports `./invariant` and registers the exact package name. Identify an authoritative event/data relationship the package can observe at runtime. If none exists, record a package-specific `No runtime invariant:` explanation; do not invent checks for plugin metadata, service presence, effects, or fixed pure examples.

## Design profile composition

Record the target base profile and every row the bundle inserts or overrides. For each override, copy the complete intended `config` because id-targeted patches replace that value rather than deep-merging it. Decide whether the invariant row can rely on the base profile's `invariants` service. Keep secrets out of the patch.

## Select evidence

Choose the smallest tiers that can prove the behavior:

- Loader export-shape test for every function plugin;
- configuration and behavior unit tests;
- activation plus disposal/HMR-safety tests for registrations;
- invariant positive and negative tests when the installer is non-empty;
- real Loader/profile composition test for product-visible behavior;
- keyless snapshot for model-, CLI-, terminal-, editor-, or browser-visible output;
- built-artifact and git-install smoke for distributed packages;
- real-provider e2e only when behavior requires credentials or external infrastructure.

## Planning output

Return an updated handoff compatible with `dsh-plugin-development` at `.agents/skills/dsh-plugin-development/SKILL.md`, plus a short list of rejected alternatives only when they affect implementation. Planning is complete only when `pluginForm`, roles, dependency matrix, configuration, lifecycle ownership, invariant, bundle rows, test tiers, and distribution assumption contain no unresolved decision that blocks scaffolding.
