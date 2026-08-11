---
name: dsh-plugin-release
description: Use when checking whether a standalone DSH plugin is ready for local, Git, or npm distribution. Validate placeholders, portable dependencies, typecheck/tests/build, prepare, public exports, packed files, clean-consumer installation, documentation, versioning, and release authority; require recorded composition evidence without owning ordinary profile wiring.
---

# Prepare a Plugin for Distribution

This skill proves that a plugin's artifact can be consumed through the selected channel. It is guidance, not publishing authority: never change remotes, push, tag, release, or run a registry publish command without a direct user request.

## Select the channel

Record one or more intended channels:

- **Local checkout:** installed with `link:` for development; rebuilding updates the linked files.
- **Git source:** consumer installs a repository spec and the package's `prepare` script builds runtime JavaScript on that machine.
- **npm/tarball:** consumer installs prepacked files; the tarball must already contain every exported runtime and declaration file.

Keep `private: true` unless npm publication is explicitly intended. A private package may still be used from a local checkout or Git. Distribution readiness does not grant permission to make it public.

## Audit identity and portability

Search source-controlled files for template markers, old package names, stale row ids, absolute local paths, credentials, and development-only links:

```sh
grep -R -n -E '@your-scope/dsh-plugin-template|plugin-template|Plugin Authors|link:|file:' \
  --exclude-dir=node_modules --exclude-dir=lib .
```

Review every match. Local links may remain in a local-only development package, but a Git/npm consumer must be able to resolve every dependency without the author's sibling filesystem. DSH APIs remain peer dependencies; development dependencies used by Git `prepare` must also be reachable through the selected source.

Confirm package name, version, description, license, repository metadata, Node engine, package manager, Cordis plugin id, invariant package name, bundle rows, README examples, and lockfile all describe the same package.

## Run package verification

Install from the lockfile using the package's documented package manager, then run:

```sh
pnpm run typecheck
pnpm test
pnpm run prepare
pnpm run build
```

Run typecheck independently: the self-contained prepare path intentionally transpiles without checking DSH project references and is not type-safety evidence. Run the full build after the prepare smoke so declaration files and the final development artifact are restored even when prepare cleans `lib/`.

Import every public runtime export from `lib/` under plain Node. Verify `package.json` `main`, `types`, `exports`, and `files` point to files that actually exist after the corresponding build path. Function plugins must retain their namespace exports; service plugins must resolve to the intended default class; `./invariant` must load.

## Inspect the package archive

Run:

```sh
pnpm pack --dry-run --json
```

`pnpm pack` runs lifecycle scripts, including `prepare`, before calculating the final archive. Inspect the complete post-lifecycle file list. Require the runtime bundle, declarations and maps promised by exports, `cordis.patch.yml` for bundles, and any deliberately shipped source or assets. Reject credentials, `.env`, `.git`, `node_modules`, tests, temporary stores, local caches, unexpected generated chunks, or files outside the documented package contract.

The template's prepare path is runtime-oriented and may clean or omit `lib/types`. If normal packing removes declarations promised by `types` or `exports`, stop and fix the package lifecycle: preserve an already verified full-build declaration tree for npm packing, or add a self-contained declaration build for a clean Git source install. `pnpm --config.ignore-scripts=true pack --dry-run --json` may diagnose the pre-lifecycle file set, but it does not prove what direct publish or Git installation will produce.

When practical, create the normal lifecycle-built tarball in a temporary directory, install it into a fresh minimal consumer, and import every public entry. Use the tarball rather than the source checkout so missing `files`, exports, and runtime dependencies fail.

## Verify Git installation

For a Git channel, test a clean clone or approved repository spec without the author's sibling checkout. The install must run `prepare` successfully using reachable development dependencies and the self-contained `tsconfig.prepare.json`. Verify every manifest-declared runtime and type entry afterward; a runtime-only prepare cannot support a Git channel that still promises absent declaration files.

Load and follow [`dsh-plugin-compose`](../dsh-plugin-compose/SKILL.md) for the isolated profile installation, exact `allowBuilds` response, effective config inspection, and real-entry activation. Record that clean Git result here rather than duplicating its profile procedure. A successful standalone `prepare` command does not prove profile resolution or activation.

## Documentation and repository state

Confirm README instructions cover prerequisites, local install, selected remote install, `allowBuilds` when applicable, profile activation, configuration, failures, verification, and known limitations. Keep public JSDoc synchronized with config, events, errors, and exports. Update the changelog or release notes only when that repository uses them.

Check source-control status and whitespace:

```sh
git status --short --branch
git diff --check
```

Ensure generated `lib/` and `node_modules/` are ignored unless the chosen distribution policy deliberately tracks built artifacts. Do not delete the user's uncommitted work, rewrite history, create a commit, or clean an unrelated file.

## Version and publication

Choose a version according to the package's actual compatibility policy. Verify the lockfile and packed manifest reflect it. Tagging, GitHub release creation, npm authentication, `pnpm publish`, and pushing are separate user-authorized actions; when authorized, inspect the destination and package owner before executing them and never print tokens.

## Release-readiness report

Report the selected channel, version/private status, placeholder/link audit, exact verification commands, public-entry imports, packed file findings, clean-consumer result, profile activation result, documentation status, Git status, and every unrun platform or credential-dependent step. State “ready” only for the channels actually proven, and list publication actions as not performed unless separately authorized.
