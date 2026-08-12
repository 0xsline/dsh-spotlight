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

When porting an existing repository, the host patch is the complete diff between the ported repository and the baseline host repository, restricted to everything outside the shipped packages: every non-package change belongs in it, never a partial selection. A host-side change that is not in the host patch is a dropped change, not an omission.

Store each host patch as one self-contained diff with a documented pinned host snapshot, the apply command, and the regeneration command:

```sh
git apply patches/<name>-host.patch    # from a DSH checkout at the pinned snapshot
git -C <deepseek-harness> diff <snapshot-a> <snapshot-b> -- <host files> \
  > patches/<name>-host.patch
```

Record in this README which host files the patch touches, why the plugin needs them, and the snapshot it applies to. A host patch is a repository-level artifact for host maintainers: it is not part of the published package, is never declared in `pnpm-workspace.yaml`, and is removed when the host contains the change.
