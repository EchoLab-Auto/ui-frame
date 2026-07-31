# CI/CD 设计说明

> 本文档完整描述 `@echolab-auto/ui-frame` 的 GitHub Actions CI/CD 架构，包括工作流设计、触发策略、任务链关系及故障排查。

---

## 目录

- [架构概览](#架构概览)
- [工作流详解](#工作流详解)
  - [CI — 核心验证](#ci--核心验证)
  - [Publish — 发布到 npm](#publish--发布到-npm)
  - [Pages — 示例站部署](#pages--示例站部署)
  - [PR Title Check — PR 标题校验](#pr-title-check--pr-标题校验)
- [工作流触发链](#工作流触发链)
- [环境配置](#环境配置)
- [产物与缓存](#产物与缓存)
- [故障排查](#故障排查)

---

## 架构概览

本项目采用 **4 条独立工作流** 组成 CI/CD 体系：

| 工作流         | 文件                 | 职责                                    | 触发时机              |
| -------------- | -------------------- | --------------------------------------- | --------------------- |
| CI             | `ci.yml`             | 代码质量验证 + 构建 + 测试              | push/PR 到 `main`     |
| Release        | `release.yml`        | Changesets 版本与发布（自动 CHANGELOG） | push 到 `main` / 手动 |
| Pages          | `pages.yml`          | 部署示例站到 GitHub Pages               | CI 成功 / 手动        |
| PR Title Check | `pr-title-check.yml` | 校验 PR 标题符合 Conventional Commits   | PR 生命周期事件       |

设计原则：

- **职责分离**：验证、发布、部署三者独立，互不阻塞
- **并发控制**：同分支/同 PR 的重复运行自动取消（`cancel-in-progress: true`）
- **产物复用**：CI 构建的 example 产物被 Pages 工作流直接下载复用，避免重复构建

---

## 工作流详解

### CI — 核心验证

**文件**：`.github/workflows/ci.yml`

**触发条件**：

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch: # 支持手动触发
```

**矩阵策略**：CI 同时在 Node 20 和 Node 22 上运行，确保跨版本兼容性。仅 Node 22 的任务上传 artifacts（避免重复）。

**任务流水线**（`jobs.check`）：

| 步骤               | 命令                                                 | 说明                                           |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------- |
| Checkout           | `actions/checkout@v4`                                | 拉取代码                                       |
| Setup Node         | `actions/setup-node@v4`                              | Node 20/22 矩阵 + npm 缓存                     |
| Upgrade npm        | `npm install -g npm@11`                              | 锁定 npm 版本，避免 lock 文件兼容问题          |
| Install            | `npm ci`                                             | 纯净安装，依赖 lock 文件                       |
| Audit              | `npm audit --audit-level=high`                       | 安全检查（仅 high/critical 级别报错）          |
| Lint               | `npm run lint`                                       | ESLint 检查 `.ts` `.tsx` `.vue`                |
| Format check       | `npm run format:check`                               | Prettier 格式校验                              |
| Component registry | `npm run check:registry`                             | barrel → import → NAME_TO_COMPONENT 三者一致性 |
| Type check         | `npm run typecheck`                                  | `vue-tsc --noEmit` 全量类型检查                |
| Test               | `npm run test:coverage`                              | Vitest 单元测试 + 覆盖率阈值门禁               |
| Build library      | `npm run build`                                      | Vite 构建组件库产物                            |
| Bundle size        | `find dist -name '*.js' -exec gzip -c {} + \| wc -c` | 全量载荷 < 180KB gzipped, CSS < 36KB gzipped   |
| Build example      | `npm run example:build`                              | 构建示例站点                                   |
| Verify outputs     | `test -f ...`                                        | 断言产物文件全部存在                           |
| Package lint       | `npx publint`                                        | 校验 exports/sideEffects/types 等包发布契约    |
| Upload artifacts   | `actions/upload-artifact@v4`                         | Node 22 only: 上传 `dist/` 和 `dist-example/`  |

**产物校验清单**：

```
Library core:
  dist/ui-frame.js
  dist/ui-frame.umd.cjs
  dist/style.css
  dist/index.d.ts

Subpath exports:
  dist/composables/
  dist/extensions/index.js + .d.ts
  dist/utils/index.js + .d.ts

Example:
  dist-example/index.html
```

---

### Release — Changesets 发布流水线

**文件**：`.github/workflows/release.yml`

**触发条件**：

```yaml
on:
  push:
    branches: [main] # main 更新即评估
  workflow_dispatch: # 支持手动触发
```

**发布模型（Changesets 标准流）**：

```
开发者 PR（携带 .changeset/*.md 变更说明）
  → 合并到 main
  → changesets/action 检测到未发布 changeset
  → 自动开/更新 "Version Packages" PR（bump 版本 + 生成 CHANGELOG.md）
  → 该 PR 合并后再次触发
  → npm run release = npm run build && changeset publish --provenance
  → 发布到 npm 并自动创建 GitHub Release
```

**配套脚本（package.json）**：

| 脚本      | 命令                                              | 用途               |
| --------- | ------------------------------------------------- | ------------------ |
| version   | `changeset version && npm run format`             | 版本 bump + 格式化 |
| release   | `npm run build && changeset publish --provenance` | 构建并发布         |
| changeset | `changeset`                                       | 本地新增变更说明   |

**配套门禁**：

- **PR changeset 检查**：CI 的 `changeset-check` job（仅 PR 触发）运行
  `npx changeset status --since=origin/main` —— 无 changeset 文件则失败，
  强制每个变更 PR 携带版本说明
- **完整验证**：main 上的 CI 全量跑（lint + format + typecheck + test:coverage + build + verify + publint），发布前的最后一道防线
- **权限最小化**：仅申请 `contents: write`、`id-token: write`、`pull-requests: write`

---

### Publish — 发布到 npm（已废弃，见 Release）

旧 `publish.yml`（GitHub Release 触发 + 直连 `npm publish`）已被 Changesets 流水线取代并删除。

**产物校验清单**（与 CI 一致）：

```
Library core:
  dist/ui-frame.js
  dist/ui-frame.umd.cjs
  dist/style.css
  dist/index.d.ts

Subpath exports:
  dist/composables/
  dist/extensions/index.js + .d.ts
  dist/utils/index.js + .d.ts
```

> 注意：Publish 的验证步骤与 CI 完全一致，确保发布前代码质量达标。

---

### Pages — 示例站部署

**文件**：`.github/workflows/pages.yml`

**触发条件**：

```yaml
on:
  workflow_run:
    workflows: ['CI'] # 依赖 CI 工作流
    branches: [main]
    types: [completed] # CI 完成后触发
  workflow_dispatch: # 支持手动触发
```

**设计要点**：

- **产物复用优先**：先尝试下载 CI 产物（`dist-example`），失败才本地重新构建
- **环境保护**：使用 `environment: github-pages`，支持部署保护规则
- **并发控制**：`group: pages` + `cancel-in-progress: false`，避免部署冲突

**任务流水线**：

```
Install dependencies
  ↓
Download dist-example artifact (from CI)
  ↓ 成功？→ 直接部署
  ↓ 失败？→ npm run example:build（fallback）
  ↓
Configure Pages → Upload → Deploy
```

---

### PR Title Check — PR 标题校验

**文件**：`.github/workflows/pr-title-check.yml`

**触发条件**：

```yaml
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
```

**作用**：确保每个 PR 标题符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范，方便后续生成 CHANGELOG 和版本号。

**校验规则**（由 `@commitlint/config-conventional` 定义）：

```
<type>(<scope>): <subject>

类型(type): feat|fix|docs|style|refactor|test|build|ci|chore
```

**命令**：

```bash
echo "${{ github.event.pull_request.title }}" | npx commitlint
```

---

## 工作流触发链

```
PR 创建/更新
  │
  ├──→ PR Title Check ──→ 校验标题格式 ──→ ✅/❌
  │
  └──→ CI ──→ Lint/Test/Build ──→ 上传 artifacts ──→ ✅/❌

Push 到 main
  │
  └──→ CI ──→ Lint/Test/Build ──→ 上传 artifacts ──→ ✅
            │
            └──→ 触发 Pages ──→ 下载 artifacts ──→ 部署到 GitHub Pages

Push 到 main
  │
  └──→ Release ──→ changesets/action ──→ Version PR ──→ 合并后发布到 npm
```

---

## 环境配置

### Node 与 npm 版本

| 工具    | 版本 | 说明                                            |
| ------- | ---- | ----------------------------------------------- |
| Node.js | `22` | LTS 版本，通过 `actions/setup-node@v4` 指定     |
| npm     | `11` | 全局升级，避免 npm 10 与 lockfile v3 的兼容问题 |

### HUSKY=0

所有工作流均设置环境变量 `HUSKY=0`：

```yaml
env:
  HUSKY: 0
```

**原因**：`package.json` 中定义了 `"prepare": "husky"`，该脚本在安装依赖时自动执行。CI 环境不需要安装 Git hooks，设置 `HUSKY=0` 让 husky 跳过安装，避免在 CI 容器中操作 `.git/hooks`。

> 注意：`HUSKY=0` 仅在 husky 已安装时生效。若 `husky` 未写入 `devDependencies`，`npm ci` 运行 `prepare` 时会直接报 `command not found`。因此必须确保 `husky` 在 `devDependencies` 中。

### 并发控制

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

- 同一工作流 + 同一分支/PR 的多次运行，旧运行自动取消
- Publish 和 Pages 使用 `cancel-in-progress: false`，防止发布/部署冲突

---

## 产物与缓存

### Artifacts

| 产物名称       | 来源             | 消费者                    |
| -------------- | ---------------- | ------------------------- |
| `dist`         | CI Build library | Publish（备用）、本地调试 |
| `dist-example` | CI Build example | Pages 部署                |

### npm 缓存

`actions/setup-node@v4` 自动启用 `cache: npm`，缓存路径为 `~/.npm`，加速 `npm ci`。

---

## 故障排查

### `npm ci` 失败：`sh: husky: not found`

**根因**：`husky` 未写入 `devDependencies`，`prepare` 脚本执行时找不到命令。

**修复**：

```bash
npm install -D husky
# 确保 package.json devDependencies 中包含 husky
```

### `npm ci` 失败：`lock file version` 不兼容

**根因**：CI 中的 npm 版本与 lock 文件版本不匹配。

**修复**：确保 CI 中 `npm install -g npm@11` 与本地开发环境一致。

### 类型检查超时

**根因**：`vue-tsc` 在大型项目中可能较慢。

**缓解**：已设置 `timeout-minutes: 10`，如仍超时检查是否有循环类型引用。

### Pages 部署未触发

**排查**：

1. 检查 CI 工作流是否成功完成（Pages 依赖 CI 的 `workflow_run`）
2. 检查 `dist-example` artifact 是否成功上传
3. 手动触发：`Actions → Pages → Run workflow`

### PR Title Check 失败

**规范格式**：

```
feat: 新增 Switch 组件
fix(button): 修复点击事件未触发
docs: 更新开发指南
ci: 升级 Node 版本
```

**不允许**：

```
新增 Switch 组件          # 缺少 type
feat 新增 Switch 组件      # 缺少冒号
FEAT: 新增 Switch 组件     # type 必须小写
```
