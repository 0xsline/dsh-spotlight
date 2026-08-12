# Patches

`patches/` is a project-root directory for corrections only, never product code. It carries two kinds of patches:

- **dependency patches**: exact-version pnpm patches for registry packages;
- **DSH host patches**: self-contained diffs against the DSH host source.

## Dependency patches

Place pnpm dependency patches in `patches/` only when an exact upstream package version must be corrected for this plugin.

Declare each patch in the project-root `pnpm-workspace.yaml`:

```yaml
patchedDependencies:
  'package-name@1.2.3': patches/package-name@1.2.3.patch
```

Keep the patch version exact, document why the patch is required, and remove it when the upstream dependency contains the fix. A patch that affects the Git prepare build must be present in source control and covered by clean-install, `pnpm run prepare`, and pack verification. Do not add an empty `patchedDependencies` block when the plugin has no patches.

## DSH host patches

When the plugin's behavior requires changing the DSH host itself — launcher or bootstrap wiring, build seams, or any source a `cordis.patch.yml` cannot express — carry the host-side diff here instead of shipping a modified host. `cordis.patch.yml` composes plugin rows only; it cannot edit host source, compiler settings, build scripts, catalogs, or boot code.

The host patch carries only what the official plugin registration system cannot provide. Three rules:

- **keep actual code**: host code that must run or change for the plugin to work and that no official channel can express — launcher calls that must happen before any target module import, host build seams (for example a source-transform option in the client bundle preset, which `dsh.client` has no field for), catalog entries compiled into an official package, rows inserted into a host-owned bundle patch (see below), and host-side tests proving those seams;
- **drop documentation**: README, docs, and agent-note changes do not affect host behavior;
- **drop what the official registration system handles**: installing packages (bundle specs) and the plugin's own bundle rows — a plugin bundle declares its rows in its own `cordis.patch.yml` and installs through `dsh plugin --profile <p> add <spec>`. Rows inside a **host-owned** bundle (for example `packages/bundle/web-app/cordis.patch.yml`) are host source: the official channels cannot add a plugin's rows to a host bundle, so a seam that inserts them there is kept. Catalog generation over the workspace, invariant/gate exemptions that only exist because a package lives inside the host workspace, and install-side artifacts such as `pnpm-lock.yaml` and third-party notices are also dropped.

When the host must compose the plugin's rows for every profile, insert them into a host-owned bundle patch instead of a profile-init template: bundle layers apply on every boot — including profiles initialized before the patch, whose files dsh never overwrites — while a profile template only reaches newly initialized profiles. The rows resolve on source hosts through the plugin's git-spec dependencies in the host workspace.

When porting an existing repository, start from the complete diff between the ported repository and the baseline host repository, restricted to everything outside the shipped packages, then cut it down to these three rules. A seam the plugin needs that is not in the host patch is a dropped change; a registry-handled or doc-only change that is in the host patch is scope creep. If the seam requires a static import of the plugin packages, note that it resolves only on source hosts (the installed-bundle host cannot resolve it until the official host contains the wiring).

Store each host patch as one self-contained diff with a documented pinned host snapshot, the apply command, and the regeneration command:

```sh
git apply patches/<name>-host.patch    # from a DSH checkout at the pinned snapshot
```

The repository scripts mechanize extraction and application; both read `patches/host-patch.config.json` when present:

```sh
pnpm run extract:patch -- --harness <fork-checkout>   # regenerate the patch
pnpm run patch:host -- <deepseek-harness-checkout>         # apply the patch
```

Config schema:

```json
{
  "name": "fabric-host-integration",
  "baseline": "4ee4ae88...",
  "upstream": "0e1065d4",
  "out": "patches/fabric-host-integration.patch",
  "exclude": ["packages/self-modification/cordis-fabric", "README.md", "docs"],
  "revert": ["packages/bundle/web-app/cordis.patch.yml", "pnpm-lock.yaml"],
  "seams": [
    { "file": ".gitignore", "old": "node_modules/\nlib/", "new": "node_modules/\n!apps/cli/tests/fixtures/node_modules/\nlib/" }
  ]
}
```

- `baseline` / `upstream` / `out` — pinned host snapshot, the upstream commit carrying the wiring, and the patch output path (CLI flags override);
- `exclude` — pathspec excludes never allowed into the patch (shipped packages, documentation);
- `revert` — files reverted wholesale to the baseline (registry-handled or workspace-integration changes);
- `seams` — partial keeps: exact `{ file, old, new }` replacements applied after the revert; the extractor fails loud when an anchor has drifted upstream.

The extractor verifies the result (forward apply on a baseline worktree, reverse apply on the trimmed worktree) and the applier is idempotent (a tree that already contains the wiring is detected and skipped). The bundle itself installs through the official plugin channel (`dsh plugin --profile <p> add <spec>`); `scripts/patch.sh` only applies the host seams.

Record in this README which host files the patch touches, why the plugin needs them, and the snapshot it applies to. A host patch is a repository-level artifact for host maintainers: it is not part of the published package, is never declared in `pnpm-workspace.yaml`, and is removed when the host contains the change.
