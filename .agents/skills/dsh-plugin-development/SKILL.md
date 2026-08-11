---
name: dsh-plugin-development
description: Use when creating or extending a standalone DeepSeek Harness Cordis plugin from plugin-template and coordinating planning, scaffolding, implementation, profile composition, testing, and release readiness. Do not use for changes that belong inside the DSH monorepo or for SDK DSL-only projects.
---

# Develop a Standalone DSH Plugin

This skill coordinates the complete standalone-plugin workflow. It is guidance, not an autonomous workflow engine: load the stage skill named below before performing that stage, preserve its handoff facts, and use current source when a copied example disagrees with the installed DSH version.

## Scope

Use this suite for an ESM Cordis plugin package based on [`plugin-template`](../../../README.md), including a package-owned invariant companion and an optional profile bundle patch. Use the DSH monorepo's own package workflow for changes under `deepseek-harness/packages/`; do not translate SDK DSL projects into this package form without an explicit migration request.

Read the applicable instructions and current architecture before implementation:

- [`deepseek-harness/AGENTS.md`](../../../../deepseek-harness/AGENTS.md)
- [`deepseek-harness/packages/AGENTS.md`](../../../../deepseek-harness/packages/AGENTS.md)
- [`deepseek-harness/docs/architecture.md`](../../../../deepseek-harness/docs/architecture.md)
- [`deepseek-harness/docs/cordis-primer.md`](../../../../deepseek-harness/docs/cordis-primer.md)
- [`plugin-template/README.md`](../../../README.md)

## Required inputs

Establish these facts before editing. Ask one concise batch of questions when the request does not determine them:

- plugin objective and observable behavior;
- target directory or existing checkout;
- npm package name and stable Cordis plugin id;
- intended profile or consuming application;
- whether the package is new or existing;
- intended distribution channel: local checkout, Git, npm, or not yet selected.

Do not invent a package scope, target path, credential source, public default, or publishing destination.

## Shared handoff

At every stage transition, retain and update one concise handoff in the task state or user-approved design document:

```text
objective:
target:
packageName:
pluginId:
pluginForm: function | service
roles:
requiredServices:
optionalServices:
config:
invariant:
bundleRows:
testTiers:
distribution:
completedChecks:
openDecisions:
```

Do not create a transient planning file merely to move between skills. Create a durable design document only when the user requests one or the plugin introduces a non-trivial public contract that needs its own repository documentation.

## Stage sequence

1. Load [`dsh-plugin-plan`](../dsh-plugin-plan/SKILL.md). Leave planning only after the plugin form, roles, dependencies, configuration, invariant decision, composition, test tiers, and distribution assumptions are explicit.
2. For a new repository, load [`dsh-plugin-scaffold`](../dsh-plugin-scaffold/SKILL.md). Leave scaffolding only after all template placeholders are replaced and the unchanged skeleton passes install, typecheck, tests, and build. Skip file creation for an existing plugin, but still audit it against the scaffold exit conditions.
3. Load [`dsh-plugin-implement`](../dsh-plugin-implement/SKILL.md). Implement only the planned behavior, update the package contract and invariant companion, and keep all registrations owned by the plugin fiber.
4. Load [`dsh-plugin-compose`](../dsh-plugin-compose/SKILL.md) when the package contributes a profile bundle or must be proven in an assembled DSH profile. Verify the effective rows rather than assuming the patch applied.
5. Load [`dsh-plugin-test`](../dsh-plugin-test/SKILL.md). Run the smallest evidence that covers the behavior; product-visible plugins require a real Loader/profile composition test in addition to hand-mounted unit tests.
6. Load [`dsh-plugin-release`](../dsh-plugin-release/SKILL.md) for Git/npm delivery or when claiming the package is distribution-ready. Local-only work still performs its placeholder, exports, files-list, and build-artifact checks.

Stages may be performed in one coding pass, but their exit conditions do not disappear. Planning is never skipped. Composition may be omitted only for a package that deliberately declares no bundle and is tested through its actual consumer. Publishing actions require a direct user request; release readiness never implies permission to publish, tag, push, or create a remote.

## Hard stops

- A function plugin named-exports `name`, `inject`, `Config`, and `apply` and has no default export. A service plugin default-exports its service class. Never mix the two forms.
- `cordis.patch.yml` composes packages and configuration; it does not patch DSH host source, TypeScript projects, catalogs, or launch code.
- Never commit credentials. Accept secret references or environment-variable names according to the owning DSH service.
- Do not add compatibility shims for hypothetical consumers or hardcode deployment-varying tunables.
- Never claim a check passed unless its exact command completed successfully. Distinguish code failures from proven sandbox, network, credential, or platform blockers.
- Do not publish, push, rewrite Git history, or configure a remote without explicit authority.

## Skill discovery

This suite is repository-local and is part of the template source. Preserve `.agents/skills/dsh-plugin-*` when creating a standalone plugin so future sessions rooted in that repository discover the workflow. Do not replace the directories with absolute symlinks that fail in another clone.

## Completion report

Report the final package path, plugin form, injected services, bundle rows, invariant decision, behavior added, commands actually run, distribution status, and any unverified environment-dependent step. Keep release actions and readiness claims separate.
