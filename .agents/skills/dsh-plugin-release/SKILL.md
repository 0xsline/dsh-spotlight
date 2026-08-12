---
name: dsh-plugin-release
description: Use when checking whether a standalone DSH plugin is ready for local, Git, or npm distribution. Validate placeholders, portable dependencies, typecheck/tests/build, prepare, public exports, packed files, clean-consumer installation, documentation, versioning, and release authority; require recorded composition evidence without owning ordinary profile wiring.
---

# Prepare a Plugin for Distribution

This skill proves that a plugin's artifact can be consumed through the selected channel. It is guidance, not publishing authority: never change remotes, push, tag, release, or run a registry publish command without a direct user request.

## Select the channel

Record one or more intended channels:

- **Packed local artifact:** consumer installs the tarball produced inside this repository; no repository-relative `link:` or `file:` dependency is allowed.
- **Git source:** consumer installs a repository spec and the package's `prepare` script builds runtime JavaScript and declarations on that machine.
- **npm/tarball:** consumer installs prepacked files; the tarball must already contain every exported runtime and declaration file.

Keep `private: true` unless npm publication is explicitly intended. A private package may still be consumed as a packed local artifact or from Git. Distribution readiness does not grant permission to make it public.

## Audit identity and portability

Search source-controlled identity owners for template markers, old package names, stale row ids, absolute local paths, credentials, and forbidden local dependencies:

```sh
grep -R -n -E '@your-scope/dsh-plugin-template|plugin-template|Plugin Authors|link:|file:|\.\./' \
  --exclude-dir=node_modules --exclude-dir=lib --exclude-dir=.agents \
  package.json src tests cordis.patch.yml README.md AGENTS.md tsconfig*.json scripts
```

Review every match. This template does not permit repository-relative `link:`, `file:`, repository-external source, or repository-external project-reference paths. Registry packages and runtime host peers are package dependencies, not filesystem inputs; every Git/npm consumer must resolve the build from the repository's own manifest and lockfile.

Confirm package name, version, description, license, repository metadata, Node engine, package manager, Cordis plugin id, invariant package name, bundle rows, README examples, and lockfile all describe the same package.

If `pnpm-workspace.yaml` declares `patchedDependencies`, verify every project-root patch path exists under `patches/`, targets the exact installed version, has a documented reason, and is available during a clean Git install. A DSH host patch under `patches/` must be a self-contained diff with a documented pinned host snapshot, regenerated and applied through `scripts/extract-patch.mjs` and `scripts/patch.sh` (configured in `patches/host-patch.config.json`), and must not appear in the published package's `files`. If no patch is declared, `patches/` must contain guidance only.

## Run package verification

Install from the lockfile using the package's documented package manager, then run:

```sh
pnpm run verify:self-contained
pnpm run typecheck
pnpm test
pnpm run prepare
pnpm run build
```

Run the full development typecheck independently from prepare. Prepare has its own declaration check and runtime bundle, but it does not replace the package-level project build. Run the full build after the prepare smoke so the development artifact is restored consistently.

Import every public runtime export from `lib/` under plain Node. Verify `package.json` `main`, `types`, `exports`, and `files` point to files that actually exist after the corresponding build path. Function plugins must retain their namespace exports; service plugins must resolve to the intended default class; `./invariant` must load.

## Inspect the package archive

Run:

```sh
pnpm pack --dry-run --json
```

`pnpm pack` runs lifecycle scripts, including `prepare`, before calculating the final archive. Inspect the complete post-lifecycle file list. Require the runtime bundle, declarations and maps promised by exports, `cordis.patch.yml` for bundles, and any deliberately shipped source or assets. Reject credentials, `.env`, `.git`, `node_modules`, tests, temporary stores, local caches, unexpected generated chunks, or files outside the documented package contract.

The prepare script deliberately recreates `lib/`, emits `lib/types`, and then bundles runtime files without removing the declarations. If normal packing omits declarations promised by `types` or `exports`, stop and fix the package lifecycle. `pnpm --config.ignore-scripts=true pack --dry-run --json` may diagnose the pre-lifecycle file set, but it does not prove what direct publish or Git installation will produce.

When practical, create the normal lifecycle-built tarball in a temporary directory, install it into a fresh minimal consumer, and import every public entry. Use the tarball rather than the source checkout so missing `files`, exports, and runtime dependencies fail.

## Verify Git installation

For a Git channel, test a clean clone or approved repository spec without any source or configuration outside that clone. The install must run `prepare` successfully using only the clone's reachable registry dependencies, `tsconfig.prepare.dts.json`, and `tsconfig.prepare.json`. Verify every manifest-declared runtime and type entry afterward.

Load and follow `dsh-plugin-compose` at `.agents/skills/dsh-plugin-compose/SKILL.md` for the isolated profile installation, exact `allowBuilds` response, effective config inspection, and real-entry activation. Record that clean Git result here rather than duplicating its profile procedure. A successful standalone `prepare` command does not prove profile resolution or activation.

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
