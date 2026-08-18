# dsh-plugin-manager

[English](./README_EN.md) | 中文

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）Web 界面的插件管理器：在 **设置 → 插件** 中新增一个"插件管理"标签页，让你不用编辑任何配置文件就能查看、启用、停用已安装的插件。

## 示例

![插件管理标签页：自定义插件可开关，核心组件收起且只读](./docs/screenshot.png)

## 功能

- **自定义插件** 分区（默认展开）：列出所有用户安装的插件（模块名不在 `@deepseek-ai/*` 官方范围内的即视为自定义插件），每个插件带一个开关
  - 开关**立即生效**（无需重启）：停用即卸载该插件的 Host 半件并从客户端模块图移除其浏览器半件
  - 开关状态**持久化**：写入用户级补丁层 `~/.dsh/cordis.patch.yml` 的托管标记块，重启 DSH 后保持
  - 以后新安装的插件会自动出现在这个分区，无需任何额外配置
- **核心组件** 分区（默认收起）：展示全部核心组件的启用状态与 Cordis 挂载状态（已挂载 / 等待依赖 / 挂载失败…），开关为禁用态——核心组件保持现有状态、不可切换（界面和服务端双重保护）
- 每个条目同时显示模块全名、条目 id、启用状态与运行状态指示灯

## 安装

### 通过 dsh CLI（推荐）

```powershell
dsh plugin --profile web add github:big-lixin/dsh-plugin-manager
```

该命令把包装进 profile（pnpm），并借助包内声明的 `dsh.bundle.patch` 层自动完成挂载。**bundle 层栈在启动时组合，所以 CLI 安装需要重启一次 DSH 才生效**。

> 如果你之前用过下方的手动方式安装过本插件，请先从 `~/.dsh/profiles/web/cordis.patch.yml` 中删掉手写的那条 `insert` 挂载行，再切换到 CLI 渠道——两条相同的行会重复挂载。

### 手动安装（可热挂载，无需重启）

1. 把本仓库复制到 `~/.dsh/profiles/web/node_modules/dsh-plugin-manager`
2. 在 `~/.dsh/profiles/web/cordis.patch.yml` 中追加挂载行：

   ```yaml
   - insert:
       - id: plugin-manager
         name: dsh-plugin-manager
   ```

3. 该补丁文件被 HMR 监听，保存后 Host 半件立即挂载；**刷新浏览器页面**即可在 设置 → 插件 中看到"插件管理"标签页

### 升级

```powershell
dsh plugin --profile web update dsh-plugin-manager
```

升级同样在下次重启后生效。

## 工作原理

- **数据来源**：Host 半件直接读取 Cordis Loader 的条目树（与内置"插件列表"标签页同一数据源），不维护第二份状态
- **开关机制**：切换开关会向用户级补丁层 `~/.dsh/cordis.patch.yml` 写入 / 移除一条 id 定向补丁：

  ```yaml
  # >>> dsh-plugin-manager
  - id: better-sidebar
    disabled: true
  # <<< dsh-plugin-manager
  ```

  DSH 对该文件有文件监听（HMR），写入后热应用到运行中的组合树，因此停用/启用无需重启；同时补丁文件本身就是持久化，重启后依然生效
- **Host ↔ 浏览器通信**：Host 半件通过 `webServer` 服务注册两个同源 HTTP 接口，浏览器半件直接 `fetch`：

  | 接口 | 方法 | 说明 |
  | --- | --- | --- |
  | `/__plugin-manager__/list` | GET | 返回全部非 group 条目（id、模块名、启用状态、fiber 阶段、是否自定义）及补丁文件路径 |
  | `/__plugin-manager__/set-disabled` | POST | 请求体 `{ "id": "<条目 id>", "disabled": true/false }`；核心组件返回 `403` |

## 注意事项

- 本插件自身也会出现在"自定义插件"分区。停用它会让管理页一并失效；恢复方法：编辑 `~/.dsh/cordis.patch.yml`，删掉标记块中对应的 `- id: plugin-manager` 两行（或直接清空标记块）
- 卸载：摘掉 `profiles/web/cordis.patch.yml` 中的挂载行（热卸载立即生效），再删除包目录；如果曾用开关停用过某插件，卸载后建议顺手清理 `~/.dsh/cordis.patch.yml` 标记块中的残留条目
- 手动复制进 `node_modules` 的目录不属于 pnpm 管理；若以后对 profile 重新执行 `pnpm install` 导致目录被清，按上文重新安装一次即可

## 开发

纯 JavaScript、零依赖、零构建：

```
lib/host.js     Host 半件（ESM，默认导出 Cordis 插件对象）
lib/client.js   浏览器半件（window.__ModuleLoader__ 格式）
```

要点：

- Host 半件把 `loader` 与 `webServer` 声明为 `inject` 硬依赖——DSH 启动时各条目并发挂载，用 `ctx.get('webServer')` 惰性读取会撞上启动竞态
- 补丁定向的 id 是组合数据中的**行 id**（`entry.options.id`），不是运行时条目 id（`include:xxx` 形式）

## License

[MIT](./LICENSE)
