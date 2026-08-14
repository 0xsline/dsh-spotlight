# DSH Spotlight

[简体中文](README.zh.md) | English

A keyboard-first command palette for DeepSeek Harness Web. Open one palette to
find native slash commands, recent sessions, visible UI actions, and installed
plugin settings—without leaving the keyboard.

## Features

- **One shortcut:** `⌘K` on macOS, `Ctrl+K` on other platforms.
- **Customizable:** click the shortcut control in the footer, then press a new
  key combination. The setting is stored in the current browser.
- **Native actions:** discovers and triggers the actions already provided by
  DSH Web instead of maintaining a second command registry.
- **Fast search:** deterministic fuzzy matching across slash commands, recent
  sessions, UI actions, and plugin settings.
- **Keyboard navigation:** Arrow Up/Down to select, Enter to run, Escape to
  close.
- **Clean lifecycle:** removes its event listeners, styles, and DOM nodes when
  unloaded.

## Install

Install the bundle into your DSH Web profile:

```sh
dsh plugin --profile web add "github:0xsline/dsh-spotlight#main"
dsh web
```

Then open `http://127.0.0.1:3080` and press `⌘K` or `Ctrl+K`.

## Usage

1. Open Spotlight with the global shortcut.
2. Type to filter commands and actions.
3. Use Arrow Up/Down and Enter, or click a result.
4. Click **Shortcut** in the footer to record a different key combination.
5. Click **Reset** to restore the platform default.

Shortcut preferences are local to the current browser origin and profile.

## How it works

DSH Spotlight is a standalone Cordis bundle with a small Web client. The client
discovers actionable elements in the current DSH Web page and delegates
execution back to those native elements. It adds no server data channel and
stores no durable server-side state.

```text
src/index.ts             Loader metadata
src/client/index.ts      Web client activation and disposal
src/spotlight/           Discovery, search, keyboard handling, and UI
cordis.patch.yml         DSH Web profile composition
```

Because discovery follows the current DSH Web DOM, host UI changes may require
updating the selectors in `src/spotlight/discovery.ts`.

## Development

Requirements: Node.js `^22.19.0 || >=24.0.0` and pnpm `11.7.0`.

```sh
git clone https://github.com/0xsline/dsh-spotlight.git
cd dsh-spotlight
pnpm install

pnpm run verify:self-contained
pnpm run typecheck
pnpm test
pnpm run build
```

Test a local checkout in DSH Web:

```sh
pnpm run prepare
dsh plugin --profile web add "link:$(pwd)"
dsh web
```

Inspect the package contents before publishing:

```sh
pnpm pack --dry-run --json
```

## License

[MIT](LICENSE)
