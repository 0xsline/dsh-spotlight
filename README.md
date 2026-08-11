# DeepSeek Harness Plugin Template

A minimal standalone repository template distilled from the official Turtle UI plugin. It preserves the DSH-specific package, Loader, bundle, invariant, development, test, and git-install conventions while removing all Turtle UI behavior.

## Repository layout

```text
.
├── src/
│   ├── index.ts                 # Function plugin: name/inject/Config/apply
│   └── invariant.ts             # Package-owned invariant companion
├── tests/plugin.spec.ts         # Loader export and activation tests
├── cordis.patch.yml             # Profile bundle contribution
├── package.json                 # Exports, peers, dsh.bundle.patch
├── tsconfig.json                # Development types via sibling DSH checkout
├── tsconfig.vitest.json         # Source-plane test resolution
├── tsconfig.prepare.json        # Self-contained git-install transpilation
├── tsdown.config.ts             # Bundle from tsc output
└── tsdown.prepare.config.ts     # Bundle directly from source on prepare
```

## Create your plugin

1. Replace every `@your-scope/dsh-plugin-template` occurrence with your package name.
2. Replace `plugin-template` with a stable Cordis plugin id.
3. Update `description`, `LICENSE`, and `cordis.patch.yml`.
4. Add only the DSH services used by the implementation to `peerDependencies`, `inject`, TypeScript references, and test resolution.
5. Replace the empty invariant installer when the package owns an authoritative event or mutable data relationship.
6. Implement behavior in `src/index.ts`; keep registrations scoped through `ctx.effect()`, `ctx.on()`, or registry disposers.
7. Replace the local `link:../deepseek-harness/...` DSH development dependencies with your published package source or workspace policy when the official DSH packages become registry-installable.
8. Set `private` to `false` only when the package is ready to publish.

Do not add a default export to a function plugin. Cordis Loader unwraps `exports.default ?? exports`; a stray default export discards namespace exports such as `inject`, `Config`, and `apply`.

## Development layout

The default development configuration expects this repository beside a DSH checkout:

```text
parent/
├── deepseek-harness/
└── plugin-template/
```

If your paths differ, update `package.json`, `tsconfig.json`, and `tsconfig.vitest.json` together. The runtime declaration remains a peer dependency; the local `link:` entry is development-only.

## Commands

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
```

`typecheck` uses the sibling DSH source graph. `prepare` deliberately uses `tsconfig.prepare.json`, so a consumer installing the plugin from Git can create runtime JavaScript without possessing that sibling checkout. The development/CI build remains the type-safety gate and emits declarations.

## Profile activation

Keep the manifest declaration:

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

Add the installed package to the target profile's `dsh.profile.bundles` list. DSH then applies `cordis.patch.yml` over the selected base profile. The patch composes plugins; it does not alter DSH host source, TypeScript configuration, build scripts, or catalogs.

## Plugin forms

This template demonstrates a function plugin and therefore named-exports:

```ts
export const name = 'plugin-template'
export const inject: string[] = []
export const Config = z.object({ /* ... */ })
export function apply(ctx: Context, config: Config): void { /* ... */ }
```

A service provider instead normally default-exports its `Service` subclass. Do not mix the two forms.

## What was intentionally removed from Turtle UI

- pi-tui and terminal rendering dependencies
- prompt, transcript, dialog, resume, and overlay systems
- DSH agent/session/model composition overrides
- snapshot fixtures and headless terminal harness
- package-specific dependency patching

Those belong to the official TUI implementation, not to the minimum reusable plugin skeleton.

## Testing guidance

The included test proves the Loader-safe ESM exports and schema-resolved activation. Replace the activation assertions with observable behavior and disposal assertions for every registry contribution. Product-visible plugins should also add a real Loader/profile composition test rather than relying only on hand-mounted unit tests.
