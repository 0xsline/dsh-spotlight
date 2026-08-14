# DSH Spotlight

## English

A keyboard-first command palette for DeepSeek Harness Web. Open one palette to
find native slash commands, recent sessions, visible UI actions, and installed
plugin settings—without leaving the keyboard.

### Features

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

### Install

Install the bundle into your DSH Web profile:

```sh
dsh plugin --profile web add "github:0xsline/dsh-spotlight#main"
dsh web
```

Then open `http://127.0.0.1:3080` and press `⌘K` or `Ctrl+K`.

### Usage

1. Open Spotlight with the global shortcut.
2. Type to filter commands and actions.
3. Use Arrow Up/Down and Enter, or click a result.
4. Click **Shortcut** in the footer to record a different key combination.
5. Click **Reset** to restore the platform default.

Shortcut preferences are local to the current browser origin and profile.

### How it works

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

### Development

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

### License

[MIT](LICENSE)

---

## 简体中文

DeepSeek Harness Web 的键盘优先全局命令面板。无需离开键盘，即可在一个面板中搜索原生
Slash Command、最近会话、当前界面操作和已安装插件的设置入口。

### 功能

- **一个快捷键：** macOS 默认 `⌘K`，其他平台默认 `Ctrl+K`。
- **自由设置：** 点击面板底部的快捷键按钮，再按下新的组合键；设置保存在当前浏览器。
- **复用原生操作：** 自动发现并触发 DSH Web 已有操作，不维护第二套命令注册表。
- **快速搜索：** 对 Slash Command、最近会话、界面操作和插件设置进行稳定的模糊匹配。
- **全键盘操作：** 上下方向键选择、Enter 执行、Escape 关闭。
- **干净卸载：** 插件卸载时移除事件监听、样式和 DOM 节点。

### 安装

将 Bundle 安装到 DSH Web Profile：

```sh
dsh plugin --profile web add "github:0xsline/dsh-spotlight#main"
dsh web
```

打开 `http://127.0.0.1:3080`，按 `⌘K` 或 `Ctrl+K` 即可使用。

### 使用

1. 使用全局快捷键打开 Spotlight。
2. 输入关键词筛选命令和操作。
3. 使用上下方向键与 Enter，或直接点击结果。
4. 点击底部的「快捷键」并按下新组合键，即可修改快捷键。
5. 点击「恢复默认」可还原平台默认值。

快捷键配置按当前浏览器的 Origin 和 Profile 独立保存。

### 工作原理

DSH Spotlight 是一个独立的 Cordis Bundle，附带轻量 Web Client。客户端从当前 DSH Web
页面发现可执行元素，并把执行交还给原生界面；插件不新增服务端数据通道，也不保存持久化的
服务端状态。

```text
src/index.ts             Loader 元数据
src/client/index.ts      Web Client 激活与卸载
src/spotlight/           动作发现、搜索、键盘处理和界面
cordis.patch.yml         DSH Web Profile 组合配置
```

动作发现依赖当前 DSH Web 的 DOM；宿主界面结构变化时，可能需要同步更新
`src/spotlight/discovery.ts` 中的选择器。

### 开发

环境要求：Node.js `^22.19.0 || >=24.0.0`、pnpm `11.7.0`。

```sh
git clone https://github.com/0xsline/dsh-spotlight.git
cd dsh-spotlight
pnpm install

pnpm run verify:self-contained
pnpm run typecheck
pnpm test
pnpm run build
```

在 DSH Web 中测试本地代码：

```sh
pnpm run prepare
dsh plugin --profile web add "link:$(pwd)"
dsh web
```

发布前检查包内容：

```sh
pnpm pack --dry-run --json
```

### 许可

[MIT](LICENSE)
