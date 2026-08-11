# DeepSeek Harness Plugin Template

A self-contained standalone repository template for an ESM Cordis plugin. Every source file, compiler setting, test fixture, contributor instruction, skill, and build helper used by the repository is inside this directory; every development input resolves below this repository root.

Normal npm dependencies are resolved from the package registry. A DSH host is a runtime consumer of the finished package, not a source or build input.

## Repository layout

```text
.
├── .agents/skills/               # Repository-local plugin development workflow
│   ├── dsh-plugin-development/   # End-to-end coordinator
│   └── dsh-plugin-*/             # Plan, scaffold, implement, compose, test, release
├── docs/
│   └── dsh-plugin-contracts.md   # Shared local contract for all plugin skills
├── patches/
│   └── README.md                 # Optional pnpm dependency-patch contract
├── scripts/
│   ├── prepare.mjs               # Self-contained declaration and runtime prepare build
│   └── verify-self-contained.mjs # Repository-boundary and skill metadata check
├── src/
│   ├── README.md                 # Growth rules for services and feature modules
│   ├── config.ts                 # Serializable schema and resolved defaults
│   ├── index.ts                  # Loader-facing function-plugin namespace
│   ├── invariant.ts              # Package-owned invariant companion
│   └── runtime.ts                # Fakeable host boundary and Cordis activation
├── tests/
│   ├── README.md                 # Harness, feature-test, and snapshot conventions
│   ├── harness.ts                # Shared real-Cordis test mount
│   ├── plugin.spec.ts            # Loader export and activation tests
│   └── snapshots/
│       └── README.md             # Optional product-visible fixture contract
├── .gitignore                    # Generated artifact exclusions
├── AGENTS.md                     # Repository-local contributor rules
├── LICENSE                       # Template license
├── README.md                     # Repository and usage contract
├── cordis.patch.yml              # Profile bundle contribution
├── package.json                  # Exports, peers, dsh.bundle.patch
├── pnpm-lock.yaml                # Reproducible registry dependency graph
├── pnpm-workspace.yaml           # Package-manager and optional patch policy
├── tsconfig.base.json            # Local strict compiler baseline
├── tsconfig.json                 # Development declaration project
├── tsconfig.vitest.json          # Source-plane test project
├── tsconfig.prepare.json         # Runtime bundle resolution settings
├── tsconfig.prepare.dts.json     # Self-contained prepare declarations
├── tsdown.config.ts              # Development runtime bundle
├── tsdown.prepare.config.ts      # Prepare runtime bundle
└── vitest.config.ts              # Test runner configuration
```

## Scalable source and test structure

The baseline mirrors the scalable first-level split used by larger DSH plugins while keeping product behavior minimal:

- `src/index.ts` owns the Loader namespace;
- `src/config.ts` owns the serializable schema and direct-call defaults;
- `src/runtime.ts` owns fakeable host boundaries and Cordis activation;
- `tests/harness.ts` owns the shared real-Cordis test mount;
- cohesive production behavior grows under capability-named `src/<feature>/` directories;
- stable product-visible expected output belongs under `tests/snapshots/`;
- exact-version pnpm dependency patches belong under `patches/` and are declared in `pnpm-workspace.yaml`.

Directories such as Turtle UI's chat, components, and extension areas describe that product, not the DSH plugin contract. Create equivalent feature directories only when the new plugin owns those capabilities. See `src/README.md`, `tests/README.md`, `tests/snapshots/README.md`, and `patches/README.md` for the local rules.

## Create your plugin

1. Replace the package identity in `package.json`, `src/index.ts`, `src/config.ts`, `src/runtime.ts`, `src/invariant.ts`, `tests/plugin.spec.ts`, `cordis.patch.yml`, the TypeScript package metadata, `README.md`, and `AGENTS.md`.
2. Replace the template package name `@your-scope/dsh-plugin-template` and plugin ids only in those identity owners. Do not perform a global replacement inside `.agents/skills/`; its generic examples and marker checks must remain reusable.
3. Update `description`, `LICENSE`, and `cordis.patch.yml`.
4. Add only the DSH host services used by the implementation to the package contract and composition patch. Keep source and build dependencies resolvable from this repository's `node_modules`.
5. Replace the empty invariant installer when the package owns an authoritative event or mutable data relationship.
6. Implement activation and host-boundary behavior in `src/runtime.ts`, moving cohesive capabilities into project-specific `src/<feature>/` directories as needed. Keep `src/index.ts` limited to Loader metadata and public re-exports, and scope registrations through `ctx.effect()`, `ctx.on()`, or registry disposers.
7. Keep every source, compiler, documentation, and project-reference path inside this repository. Describe files from the project root, for example `docs/dsh-plugin-contracts.md`. Do not add local-path `link:` or `file:` dependencies.
8. Set `private` to `false` only when the package's public dependencies and distribution artifacts are ready.

Do not add a default export to a function plugin. Cordis Loader unwraps `exports.default ?? exports`; a stray default export discards namespace exports such as `inject`, `Config`, and `apply`.

## Bundled development skills

DSH discovers the repository-local workflow under `.agents/skills/`. Start with [`dsh-plugin-development`](.agents/skills/dsh-plugin-development/SKILL.md) for the complete sequence, or invoke one stage directly:

| Skill | Purpose |
|---|---|
| [`dsh-plugin-plan`](.agents/skills/dsh-plugin-plan/SKILL.md) | Decide plugin form, dependencies, configuration, invariant, composition, and evidence. |
| [`dsh-plugin-scaffold`](.agents/skills/dsh-plugin-scaffold/SKILL.md) | Instantiate and baseline-verify a new repository from this template. |
| [`dsh-plugin-implement`](.agents/skills/dsh-plugin-implement/SKILL.md) | Implement lifecycle-safe Cordis behavior, metadata, docs, and invariants. |
| [`dsh-plugin-compose`](.agents/skills/dsh-plugin-compose/SKILL.md) | Install the bundle into an isolated profile and prove effective activation. |
| [`dsh-plugin-test`](.agents/skills/dsh-plugin-test/SKILL.md) | Verify Loader exports, behavior, disposal, composition, snapshots, and artifacts. |
| [`dsh-plugin-release`](.agents/skills/dsh-plugin-release/SKILL.md) | Check local, Git, or npm distribution readiness without publishing implicitly. |

Keep these directories when copying the template so future sessions rooted in the plugin repository retain the same workflow.

## Independent development

Run every command from this directory:

```sh
pnpm install
pnpm run verify:self-contained
pnpm run typecheck
pnpm test
pnpm run build
pnpm run prepare
```

`pnpm install` resolves only the dependencies declared by this package. `verify:self-contained` rejects filesystem dependency specs, compiler paths that leave the repository, external or broken Markdown links, absolute workstation paths, and malformed bundled skill metadata. `typecheck` checks both the declaration project in `tsconfig.json` and the source-plane tests in `tsconfig.vitest.json` against the local strict compiler baseline. `prepare` first removes this repository's generated `lib/`, emits declarations into `lib/types`, and bundles runtime JavaScript from `src`; it reads only files below this repository root.

The development build and prepare build use separate configurations, but both are fully contained in this repository. `pnpm run build` is the development/CI type-safety gate. `pnpm run prepare` is the consumer-side artifact build for Git and tarball installation.

## Profile activation

The package manifest declares the bundle patch:

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

A DSH host may install this package into a profile and apply `cordis.patch.yml` over its own runtime composition. That host integration is intentionally outside this repository's build and test inputs. The patch composes plugins; it does not alter host source, compiler settings, build scripts, or catalogs.

The invariant companion uses a narrow local interface for the host's `invariants` service. This keeps the package build independent of the host's private source package while preserving the runtime registration used by a DSH profile.

## Plugin forms

This template demonstrates a function plugin and therefore named exports:

```ts
// src/index.ts
export const name = 'plugin-template'
export const inject: string[] = []
export { Config } from './config.ts'
export { apply } from './runtime.ts'

// src/config.ts
export interface Config { /* serializable fields */ }
export const Config: z<Config> = z.object({ /* validation and defaults */ })

// src/runtime.ts
export function apply(ctx: Context, config: Config): void { /* effects */ }
```

A service provider instead normally default-exports its `Service` subclass. Do not mix the two forms.

## Distribution checks

Before considering Git or npm distribution, run a clean prepare and inspect the final archive:

```sh
pnpm run prepare
pnpm pack --dry-run --json
pnpm run build
```

The final package must contain every runtime and declaration file named by `main`, `types`, `exports`, and `files`. The final `pnpm run build` restores the development artifact after pack lifecycle scripts. Keep `private: true` until the package's DSH host peers are available through the selected distribution channel.

## Testing guidance

The included test proves Loader-safe ESM exports and schema-resolved activation. Replace the activation assertions with observable behavior and disposal assertions for every registry contribution. Product-visible plugins should add a real Loader/profile composition test in the consuming DSH application rather than relying only on hand-mounted unit tests.
