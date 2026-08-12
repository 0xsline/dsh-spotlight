# Standalone DSH Plugin Contracts

This reference is shipped with the template so planning, implementation, testing, and distribution use only guidance stored below the repository root.

## Repository boundary

All source, TypeScript configuration, test fixtures, skill instructions, and contributor guidance used by this template live below the repository root. Describe repository files with project-root paths such as `docs/dsh-plugin-contracts.md`; parent-directory navigation is not valid documentation. Paths that leave the repository are not valid template inputs. Ordinary npm dependencies are allowed; a dependency is not a source or configuration file reference.

A DSH host is a runtime consumer of the finished package, not a development input. The host supplies Cordis services and applies the package's bundle patch when the package is installed into a profile.

## Plugin forms

A function plugin exports `name`, `inject`, `Config`, and `apply` as one ESM namespace and has no default export. A service plugin default-exports its service class and follows the host service lifecycle. Do not combine the two loader forms.

Required Cordis services belong in `inject`. Optional services are read through named lookup and must tolerate absence or attach and detach through a scoped injection. Configuration is a serializable Schemastery schema; deployment-varying choices are fields, not hidden constants.

## Scalable repository structure

The baseline source boundary separates `src/index.ts`, `src/config.ts`, `src/runtime.ts`, and `src/invariant.ts`. For a larger plugin, keep those responsibilities focused and group cohesive behavior under capability-named directories such as `src/<feature>/`. Add `src/services/` only when the package owns actual Cordis services.

The baseline test boundary includes `tests/plugin.spec.ts` and the shared real-Cordis mount in `tests/harness.ts`. Add feature-specific `tests/<feature>.spec.ts` files for focused behavior and stable visible-output fixtures under `tests/snapshots/`. Keep snapshot inventory and refresh rules explicit.

`patches/` is an optional project-root directory for two kinds of corrections: exact-version pnpm dependency patches (declared in `pnpm-workspace.yaml`) and DSH host patches (self-contained diffs against a pinned host snapshot, applied with `git apply`, never part of the published package). A host patch carries only what the official plugin registration system cannot provide — actual host code (launcher wiring, build seams, catalog entries, seam tests), never documentation and never anything the official channels handle (bundle roster and dependencies, workspace integration, generation, install-side artifacts). `scripts/extract-patch.mjs` regenerates the patch and `scripts/patch.sh` applies it; both read `patches/host-patch.config.json` (schema in `patches/README.md`). It must remain empty apart from its local README until a real patch exists. Turtle UI's `src/chat/`, `src/components/`, and `src/extension/` are product feature names, not mandatory template directories.

## Lifecycle ownership

Every listener, registry entry, timer, watcher, child process, and callback registered by a plugin belongs to its Cordis fiber. Use effects or returned disposers and test removal after fiber disposal. Publish state and emit events only after the owning operation succeeds. A waterfall listener delegates by calling `next()`.

## Invariant companion

Every package may expose `./invariant` as a separate function plugin. Its installer checks an authoritative event or data relationship owned by the package. An empty installer is valid only when the package owns no observable relationship; explain that reason in the source. The companion can use the host's `invariants` service through the narrow local interface in `src/invariant.ts`.

## Bundle composition

`package.json` declares the bundle patch with `dsh.bundle.patch`. `cordis.patch.yml` inserts or overrides plugin rows; it does not change source files, compiler settings, catalogs, or launcher code. An id-targeted override replaces the complete `config`, so retained fields must be restated. The package row name must resolve through the consuming DSH profile.

## Evidence

The minimum package evidence includes a real Loader export-shape test, schema/default behavior, observable plugin behavior, and disposal. Product-visible behavior additionally needs a real assembled composition test and a focused keyless snapshot when output is stable and user-visible. Typechecking, tests, and a development build are separate checks.

## Build and distribution

The development build is:

```sh
pnpm run typecheck
pnpm test
pnpm run build
```

The self-contained prepare build is:

```sh
pnpm run prepare
```

It emits declarations and runtime JavaScript using only this repository's installed dependencies. `pnpm pack --dry-run --json` runs lifecycle scripts; inspect its final file list and restore a development build afterward when the pack lifecycle cleans or replaces generated files.

A package is ready for Git or npm only when every manifest-declared runtime and type entry exists after the relevant consumer lifecycle. Publishing, pushing, tagging, and registry operations remain separately authorized actions.
