# DSH Spotlight

简体中文 | [English](README.md)

DeepSeek Harness Web 的键盘优先全局命令面板。无需离开键盘，即可在一个面板中搜索原生
Slash Command、最近会话、当前界面操作和已安装插件的设置入口。

## 功能

- **一个快捷键：** macOS 默认 `⌘K`，其他平台默认 `Ctrl+K`。
- **自由设置：** 点击面板底部的快捷键按钮，再按下新的组合键；设置保存在当前浏览器。
- **复用原生操作：** 自动发现并触发 DSH Web 已有操作，只向原生斜杠菜单贡献一条
  `/spotlight` 命令，不维护第二套命令注册表。
- **快速搜索：** 对 Slash Command、最近会话、界面操作和插件设置进行稳定的模糊匹配。
- **全键盘操作：** 上下方向键选择、Enter 执行、Escape 关闭。
- **干净卸载：** 插件卸载时移除事件监听、样式和 DOM 节点。

## 安装

将 Bundle 安装到 DSH Web Profile。通过 npm：

```sh
dsh plugin --profile web add "@0xsline/dsh-spotlight"
```

或通过 Git 源码：

```sh
dsh plugin --profile web add "github:0xsline/dsh-spotlight#main"
```

然后启动 DSH Web，按 `⌘K` 或 `Ctrl+K` 即可使用：

```sh
dsh --profile web
```

## 使用

1. 使用全局快捷键打开 Spotlight，或在 DSH Web 输入框输入 `/spotlight` 从斜杠菜单打开。
2. 输入关键词筛选命令和操作。
3. 使用上下方向键与 Enter，或直接点击结果。
4. 点击底部的「快捷键」并按下新组合键，即可修改快捷键。
5. 点击「恢复默认」可还原平台默认值。

快捷键配置按当前浏览器的 Origin 和 Profile 独立保存。

## 工作原理

DSH Spotlight 是一个独立的 Cordis Bundle，附带轻量 Web Client。客户端在宿主的会话、
命令平面、插件清单和命令 UI 服务就绪后挂载（这些服务是每个标准 DSH Web 部署的固定组成），
然后直接从这些服务读取最近会话、Slash Command 和插件清单；同时从当前页面发现可执行元素，
并把执行交还给原生界面。单个目录 RPC 失败只降级对应类别。插件不新增服务端数据通道，
也不保存持久化的服务端状态。

```text
src/index.ts             Loader 元数据
src/client/index.ts      Web Client 激活与卸载
src/spotlight/           Host + DOM 发现、搜索、键盘处理和界面
cordis.patch.yml         DSH Web Profile 组合配置
```

部分动作发现依赖当前 DSH Web 的 DOM；宿主界面结构变化时，可能需要同步更新
`src/spotlight/discovery.ts` 中的选择器。

## 开发

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
dsh --profile web
```

发布前检查包内容：

```sh
pnpm pack --dry-run --json
```

## 许可

[MIT](LICENSE)
