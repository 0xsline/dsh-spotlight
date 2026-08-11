---
name: dsh-plugin-test
description: Use when designing or running evidence for a standalone DSH plugin. Cover real Loader exports, configuration, behavior, registration disposal, invariants, assembled profile behavior, visible snapshots, and built artifacts while selecting the smallest commands that would fail for the regression.
---

# Test a Standalone DSH Plugin

This skill selects evidence for the plugin's actual entry paths. It is guidance, not a mandate to run every repository test: each behavior needs the narrowest test that proves it, and product-visible behavior also needs a real assembled-application test.

## Read the test owners

Read the target tests, [`plugin-template/tests/plugin.spec.ts`](../../../tests/plugin.spec.ts), current DSH [`testing policy`](../../../../deepseek-harness/docs/testing.md), and package test rules. Inspect an official plugin with the same role when available. Tests live under `tests/`, not `src/__tests__/`.

## Required evidence map

Create a short mapping from each promised behavior or failure to the test file and assertion that observes it. Include configuration defaults and rejections, lifecycle/disposal, event or durable state, composition, visible output, and distribution path as applicable. Do not count typechecking, coverage percentage, or an agent report as behavioral evidence.

## 1. Verify Loader exports

Every function plugin needs a test through the real `Loader.prototype.unwrapExports` path:

```ts
expect('default' in plugin).toBe(false)
const loader = Object.create(Loader.prototype) as Loader
const unwrapped = loader.unwrapExports(plugin) as Record<string, unknown>
expect(unwrapped).toBe(plugin)
expect(unwrapped.name).toBe('<plugin-id>')
expect(unwrapped.inject).toEqual([/* required services */])
expect(unwrapped.Config).toBeDefined()
expect(typeof unwrapped.apply).toBe('function')
```

A service plugin instead verifies that Loader unwraps the default-exported service class with its intended metadata. Do not use one assertion pattern for both forms.

## 2. Verify configuration and behavior

Test schema defaults, each supported explicit value, cross-field or environment-dependent rejection at its promised failure point, and the observable operation result. Avoid tests for hostile values that cannot cross the typed same-process API; test untrusted parser, config, model/tool, file, worker, process, and wire inputs at their real entry.

Prefer authoritative state, events, registered descriptors, process results, or returned values over internal fields and log text. A log assertion is appropriate only when logging is the plugin's documented behavior, as in the untouched minimal template.

## 3. Prove registration disposal

Mount the real required services, then the plugin through `ctx.plugin()`. Observe every contribution while the fiber is live, dispose that fiber, and observe its removal through the registry or service API. Do not infer cleanup from `fiber.dispose()` resolving.

Exercise attach/detach when optional services are handled through scoped injection. For asynchronous owners, test cancellation/disposal during an await and verify no callback, process, timer, watcher, or pending operation outlives the promised quiescent point.

## 4. Test the invariant companion

For a non-empty invariant installer, mount the real invariant service and companion, prove a valid owned relationship passes, then produce one deliberately invalid relationship through the closest real event/data path and assert the intended invariant failure. Verify companion disposal removes the registration.

For an explained empty installer, test the export and registration only when needed for packaging or Loader regression; do not invent a fake semantic invariant to increase test count.

## 5. Add a real composition test

A product-visible plugin requires a non-unit test that boots a test Cordis composition through the real Loader and application/process path. Mock only external services, credentials, time, randomness, or infrastructure that cannot be deterministic. Assert model-visible, durable, CLI-, terminal-, editor-, or browser-visible output.

A hand-built sequence of `ctx.plugin(...)` calls is useful unit coverage but does not substitute for this test. The fixture must include the package through its real export and composition metadata so a wrong package name, missing peer, invalid row, Loader export error, or boot-order defect fails.

## 6. Snapshot visible behavior

Stable user- or model-visible text is behavior. Add the focused keyless snapshot owned by the actual example/runner and review expected output semantically. Keep fixtures portable across Linux and macOS; fix nondeterministic scenarios rather than normalizing away meaningful differences.

Follow `AGENTS.md` in a UI plugin repository for its required demonstration channel. In particular, a TUI may require tmux presentation rather than transcript rendering.

## 7. Verify source and artifact paths

Run the target package commands:

```sh
pnpm run typecheck
pnpm test
pnpm run build
```

After build, import each public runtime entry from `lib/` under plain Node and verify the expected ESM exports. Run `pnpm run prepare` separately when Git installation is supported; remember that prepare transpiles and bundles but does not replace the development typecheck.

Use `pnpm pack --dry-run --json` to inspect files only in the release stage or when exports/files changed. A packed-consumer or Git-install smoke belongs to [`dsh-plugin-release`](../dsh-plugin-release/SKILL.md).

## Select commands narrowly

Run exact test files or names while iterating, then the package's complete test script before claiming package-level success. Add focused coverage only when it provides evidence for changed source; do not lower thresholds, use `--passWithNoTests`, or exclude affected modules to force green output. Real-provider e2e runs only when required credentials are available, and secrets never appear in output.

On failure, stop and determine whether the implementation, test expectation, fixture, composition, or proven environment constraint is wrong. Never bypass a genuine failure or repeat a passing command solely for ceremony.

## Test exit condition

Report the behavior-to-test mapping, exact commands and results, snapshots changed, artifact imports, skipped environment-dependent tests, and remaining gaps. A plugin is tested only when its Loader form, behavior, disposal, composition requirement, visible output, and built entry paths have the evidence selected in planning.
