# Dependency Patches

Place pnpm dependency patches in `patches/` only when an exact upstream package version must be corrected for this plugin.

Declare each patch in the project-root `pnpm-workspace.yaml`:

```yaml
patchedDependencies:
  'package-name@1.2.3': patches/package-name@1.2.3.patch
```

Keep the patch version exact, document why the patch is required, and remove it when the upstream dependency contains the fix. A patch that affects the Git prepare build must be present in source control and covered by clean-install, `pnpm run prepare`, and pack verification. Do not add an empty `patchedDependencies` block when the plugin has no patches.
