---
name: dsh-plugin-scaffold
description: Use after dsh-plugin-plan to create a new standalone DSH plugin repository from plugin-template. Copy only source-controlled template files, replace package and Cordis identifiers, align dependencies and sibling-checkout paths, generate the lockfile, and prove the unchanged skeleton before behavior is added.
---

# Scaffold a Plugin Repository

This skill creates a clean standalone repository from [`plugin-template`](../../../README.md). It is guidance, not a blind copy script: inspect the source and target first, preserve the template's build split, and stop rather than overwriting an existing non-empty directory.

## Required handoff

Require `target`, `packageName`, `pluginId`, description, plugin form, dependency matrix, target profile, invariant decision, distribution assumption, and the template location. Default the template location only when `plugin-template` exists at the workspace root. If the target exists and is non-empty, ask whether this is an audit/merge task; never replace it as scaffolding.

Validate names before copying:

- npm package name follows the selected scope policy and contains no unresolved placeholder;
- Cordis plugin and row ids are stable lowercase kebab-case;
- the package name and plugin id are distinct concepts and need not be identical;
- the target is outside the template and DSH checkout.

## Copy the source skeleton

Copy source-controlled template files while excluding `.git/`, `node_modules/`, `lib/`, temporary files, and package-manager stores. Do not use an unguarded recursive delete. Preserve these two build paths:

- development/CI: `tsc -b` emits declarations into `lib/types`, then `tsdown.config.ts` bundles those emitted modules;
- Git installation: `tsdown.prepare.config.ts` bundles directly from `src` with `tsconfig.prepare.json`, without sibling project references or typechecking.

Preserve the pinned Node, pnpm, Cordis, TypeScript, Vitest, and tsdown ranges from the current template unless current DSH source requires a coordinated update. Do not replace them with `latest`.

## Replace template identity

Update identity deliberately in these owners:

- `package.json`: `name`, `description`, optional repository metadata, exports/files, and `private` according to the distribution plan;
- `src/index.ts`: module name, exported `name`, configuration description, and placeholder behavior;
- `src/invariant.ts`: module path, exact `PACKAGE_NAME`, companion plugin name, and invariant explanation;
- `tests/plugin.spec.ts`: package description, expected plugin id, configuration assertions;
- `cordis.patch.yml`: package names, deployment-local row ids, and planned configuration;
- `tsconfig.json` and `tsconfig.vitest.json`: self-package path aliases;
- `README.md`, `AGENTS.md`, and `LICENSE`: package-specific contract and ownership rather than template instructions.

Search afterward for all template markers:

```sh
grep -R -n -E '@your-scope/dsh-plugin-template|plugin-template|Plugin Authors' \
  --exclude-dir=node_modules --exclude-dir=lib .
```

Review each match; do not suppress a remaining load-visible placeholder because it appears in documentation.

## Align dependencies and TypeScript

For every planned DSH import, update these together:

1. `peerDependencies` for runtime-provided DSH/Cordis APIs;
2. a reachable development source in `devDependencies` when needed;
3. `tsconfig.json` source mappings and project references;
4. `tsconfig.vitest.json` source mappings or the current Vitest resolver configuration;
5. `inject` and `cordis.patch.yml` when the service must be composed.

Use `dependencies` for libraries bundled or required by the plugin at runtime. Keep optional peers explicit. A local `link:../deepseek-harness/...` development dependency is valid only while the sibling topology exists; replace every non-portable link before a Git-install or npm release smoke.

If the target is not a sibling of `deepseek-harness`, adjust `package.json`, both TypeScript configs, and any test resolution together. The self-contained prepare config must not inherit the sibling DSH base config.

## Establish repository state

Generate or refresh `pnpm-lock.yaml` only after identity and dependency edits. Initialize Git only when the user requested a new repository or approved that step; do not create a remote, commit, tag, or push without separate authority. Confirm generated `lib/`, `node_modules/`, and `*.tsbuildinfo` stay ignored.

Preserve the bundled `.agents/skills/dsh-plugin-*` directories in the new repository so project-root discovery keeps this workflow available. Copy the portable files as part of the template and never replace them with absolute symlinks that fail in another clone.

## Baseline verification

Before adding product behavior, run from the target repository:

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
```

If the execution sandbox, network, native build, or package-manager state blocks one command, preserve its exact failure and retry unchanged only through the environment's approved narrow escalation path. Do not rewrite dependencies to hide an environmental denial.

Scaffolding is complete only when all placeholders are gone, package exports and bundle rows use the intended names, dependency/type-resolution records agree, generated files are ignored, and the baseline commands pass or have a concrete external blocker reported as unverified.

Return the updated shared handoff and exact commands run. Do not describe the scaffold as complete when behavior code was added before the baseline was proven.
