---
name: dsh-plugin-compose
description: Use when wiring a standalone DSH plugin into a profile through package.json dsh.bundle.patch and cordis.patch.yml, installing a local or Git package with dsh plugin, inspecting effective rows, and proving activation without patching DSH host source.
---

# Compose a Plugin into a DSH Profile

This skill owns profile wiring and activation evidence. It is guidance, not permission to modify a user's live profile: prefer an isolated `DSH_HOME` or an explicitly approved development profile, and distinguish “the bundle is present” from “the plugin behavior works.”

## Sources of truth

Read the project-root files `README.md`, `AGENTS.md`, and `docs/dsh-plugin-contracts.md`, plus the target package manifest. Use the locally documented profile commands against the installed DSH host; if the host rejects them, report a compatibility blocker rather than reading host source outside the repository.

## Verify the bundle declaration

The package manifest must point at a shipped patch:

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

Ensure `cordis.patch.yml` is present in the manifest `files` list. Every bare package named in a patch row must be a runtime-resolvable package of the profile or DSH installation; TypeScript path aliases do not affect Loader resolution.

## Review patch semantics

Apply these rules before installation:

- Bundle layers are applied in the order listed by `dsh.profile.bundles`; profile, home, command-line, and launcher patches may override them later.
- An id-targeted patch replaces that row's complete `config` value. Restate every field the plugin expects to retain; never assume deep merge.
- `insert` adds rows. Use stable, deployment-local ids and exact npm package names.
- A patch targeting an absent id warns on stderr rather than proving the intended override; inspect the effective tree and treat the warning as failed composition unless absence is intentional.
- `!!js` is permitted only inside plugin `config`. Loader metadata such as `id`, `name`, and `disabled` stays static.
- Keep credentials out of patches; use credential references or environment-variable names.
- An empty or comments-only patch is invalid because it parses to no list. Use `[]` for an intentionally empty layer.

`cordis.patch.yml` cannot edit DSH source files, compiler settings, build scripts, generated catalogs, CLI routing, or runtime boot code. If behavior requires those changes, stop and classify it as a DSH host change, carried as a documented patch under `patches/` (see `patches/README.md`), rather than hiding it in plugin installation instructions.

## Choose an isolated profile

For repeatable composition work, use a temporary or dedicated development `DSH_HOME`; record its path for every command and remove it only when no later test needs it. Do not overwrite `$DSH_HOME/cordis.patch.yml` or an existing named profile without user approval.

Select the base profile that supplies the required services. A custom profile initializes from `@deepseek-ai/dsh-base`; a Web, headless, or TUI-facing plugin may need the matching bundle stack. Do not insert duplicate providers merely because a required row is not visible in the plugin patch itself.

## Install the package

Confirm `pnpm` is on `PATH`; `dsh plugin` forwards package-manager operations to it and fails before installation when it is unavailable.

Install a packed artifact, registry version, or user-approved Git spec through DSH's profile package manager. Do not use a repository-relative `link:` or `file:` spec; the package must first prove that its own artifact is complete:

```sh
pnpm pack
# pass the generated archive, registry spec, or approved Git spec to dsh plugin
```

For Git installation, use the user-approved Git spec. pnpm 10 and later block dependency lifecycle builds until allowed: a source package with `prepare` may fail the first installation and print the exact `allowBuilds` key. Add only that printed key to the profile's `pnpm-workspace.yaml`, then rerun the unchanged install. Do not guess or broadly allow build scripts.

A successful package-manager command should add a manifest-declared bundle to `dsh.profile.bundles`. A dependency without `dsh.bundle.patch` remains installed but inactive as a bundle; treat the warning as a manifest defect when activation was intended.

## Inspect the effective composition

Use config dumps before starting a long-lived application:

```sh
dsh --profile <profile> --dump-default-config
dsh --profile <profile> --dump-config
```

Confirm the expected bundle source comment, inserted rows, overridden full configuration, ordering, invariant companion, and absence of unmatched-target warnings. Inspect the profile `package.json` only as supporting evidence; the effective dump owns the assembled result.

## Prove activation

Boot through the actual intended runner or application entry. Observe an effect specific to plugin activation, not only package resolution or a generic log from another row. For a long-lived TUI/Web process, use a managed background task or the environment's designated terminal/tmux workflow, collect its output, and dispose it cleanly after the smoke.

Composition proves that the layer resolves, mounts, and disposes. Behavioral correctness belongs to `dsh-plugin-test` at `.agents/skills/dsh-plugin-test/SKILL.md`, including real-composition assertions for product-visible plugins.

## Composition exit condition

Return the profile name and isolated home, install spec, bundle order, expected effective rows, warnings, activation observation, cleanup status, and exact commands run. Do not report successful composition when only `pnpm add` passed, when an override target was absent, or when the plugin never reached its real entry path.
