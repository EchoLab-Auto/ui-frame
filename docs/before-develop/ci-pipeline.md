# CI 流程设计

> 本文档定义 `@echolab-auto/ui-frame` 的 CI/CD 设计原则与验证链路。开发者在提交或开 PR 前应理解本文，确保变更可顺利通过 CI。

---

## 一、设计原则

| 原则             | 说明                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| **门禁前移**     | 本地运行 `npm run typecheck && npm run lint && npm test` 就能覆盖 CI 90% 的失败场景 |
| **单一事实源**   | CI 执行的命令与 `package.json` scripts 一一对应，无隐藏逻辑                         |
| **快速失败**     | 步骤按失败成本排序——lint 先于 typecheck，typecheck 先于 test，test 先于 build       |
| **产物复用**     | CI 的 `dist-example` artifact 被 Pages 工作流直接下载，避免重复构建                 |
| **npm 版本锁定** | 所有工作流统一 `npm install -g npm@11`，与本地开发环境一致                          |

---

## 二、CI 工作流架构

```
PR 创建/更新
  │
  ├──→ PR Title Check ──→ 校验 <type>(<scope>): <subject> 格式
  │
  └──→ CI (Node 20+22 矩阵)
         ├── npm ci
         ├── npm audit --audit-level=high
         ├── npm run lint         ← ESLint
         ├── npm run format:check ← Prettier
         ├── npm run typecheck    ← vue-tsc --noEmit
         ├── npm test             ← Vitest
         ├── npm run build        ← Vite (ESM + UMD)
         ├── Bundle size check    ← JS < 20KB gzip, CSS < 30KB gzip
         ├── npm run example:build
         ├── Verify outputs
         └── Upload artifacts ──→ Pages (自动部署示例站)

Release Published
  └──→ Publish
         ├── 完整验证 (lint + format + typecheck + test + build + verify)
         └── npm publish --provenance ──→ npm registry
```

---

## 三、CI 步骤详解

### 节点矩阵

CI 在 **Node 20** 和 **Node 22** 上同时运行。只有 Node 22 的 job 上传 artifact。任何节点失败都会阻止合并。

### 步骤清单

| 步骤          | 命令                                | 失败意味着                       | 本地如何复现                                         |
| ------------- | ----------------------------------- | -------------------------------- | ---------------------------------------------------- |
| **Install**   | `npm ci`                            | lock file 与 package.json 不一致 | `npm ci`                                             |
| **Audit**     | `npm audit --audit-level=high`      | 存在高危漏洞                     | `npm audit`                                          |
| **Lint**      | `npm run lint`                      | ESLint 规则违反                  | `npm run lint`                                       |
| **Format**    | `npm run format:check`              | 代码格式不符合 Prettier          | `npx prettier --check .`                             |
| **TypeCheck** | `npm run typecheck`                 | TypeScript 类型错误              | `npm run typecheck`                                  |
| **Test**      | `npm test`                          | 测试失败                         | `npm test`                                           |
| **Build**     | `npm run build`                     | 构建失败（类型或配置问题）       | `npm run build`                                      |
| **Size**      | `gzip -c dist/ui-frame.js \| wc -c` | 产物超过大小限制                 | `npm run build && gzip -c dist/ui-frame.js \| wc -c` |
| **Example**   | `npm run example:build`             | 示例站点构建失败                 | `npm run example:build`                              |
| **Verify**    | `test -f dist/...`                  | 关键产物文件缺失                 | 检查 `dist/` 目录                                    |

### Bundle Size 门禁

| 产物                            | 限制    | 当前值（参考） |
| ------------------------------- | ------- | -------------- |
| `dist/ui-frame.js` gzipped      | < 20 KB | ~2.2 KB        |
| `dist/style.css` gzipped        | < 30 KB | ~24 KB         |
| `dist/ui-frame.umd.cjs` gzipped | 不限制  | ~50 KB         |

> 当库体积接近上限时，应审查是否有新增的大型依赖。

---

## 四、开发者本地最小验证集

以下命令应在 **每次提交前** 执行：

```bash
npm run typecheck && npm test && npm run lint
```

修改了构建相关（`vite.config.ts`、`package.json` exports、新增组件目录）时追加：

```bash
npm run build && npm run example:build
```

修改了样式或组件视觉时，必须通过[人类闭环验证](./develop-pipeline.md#人类闭环验证ui-修改必做)：

```bash
npm run example
# → 浏览器访问 http://localhost:5173/ 审查视觉效果
```

---

## 五、CI 通过/失败判定

### 允许合并的条件（全部满足）

```
□ PR Title Check 通过
□ CI 全部步骤通过（Node 20 + Node 22 两个矩阵）
□ CI 中无 cancel-in-progress 导致的步骤跳过
```

### 常见失败场景与修复

| 症状                          | 根因                        | 修复                                     |
| ----------------------------- | --------------------------- | ---------------------------------------- |
| `npm ci` 报 lock file 不匹配  | 本地修改了依赖但未更新 lock | `npm install` 后提交更新的 lock 文件     |
| `npm audit` 报高危漏洞        | 依赖存在安全漏洞            | `npm audit fix` 或升级依赖               |
| `prettier/prettier` lint 错误 | 代码未格式化                | `npx prettier --write .`                 |
| `vue-tsc` 类型错误            | Prop/Event 类型不匹配       | 检查 `.vue` 中的 defineProps/defineEmits |
| 测试超时                      | 异步测试未正确 await        | 检查 `async/await` 或 `flushPromises`    |
| Bundle size 超标              | 新增大型依赖或代码          | 审查变更，考虑 tree-shaking 或代码分割   |
| `example:build` 失败          | 示例页面使用了未导出的 API  | 确保组件/类型已在 `src/index.ts` 中导出  |

---

## 六、工作流间依赖关系

| 上游               | 下游        | 依赖方式                                     |
| ------------------ | ----------- | -------------------------------------------- |
| **CI**             | **Pages**   | `workflow_run` 事件：CI 成功后自动部署示例站 |
| **CI**             | **Publish** | 无直接依赖；Publish 独立运行完整验证链       |
| **PR Title Check** | 无          | 独立运行                                     |

### 产物传递

```
CI (Node 22) 构建产物
  ├── dist/          → 上传为 artifact "dist"
  └── dist-example/  → 上传为 artifact "dist-example"
                          ↓
                    Pages 下载 "dist-example" → 部署 GitHub Pages
```

> CI artifact 的保留期为 GitHub 默认值（90 天）。Pages 工作流仅下载 **main 分支最新 CI 成功** 的产物。

---

## 七、CI 与项目规范的关系

| 规范         | CI 如何执行                        | 对应文档                                       |
| ------------ | ---------------------------------- | ---------------------------------------------- |
| 提交信息格式 | PR Title Check（commitlint）       | [develop-pipeline.md](./develop-pipeline.md)   |
| 类型安全     | TypeCheck（vue-tsc）               | [design-philosophy.md](./design-philosophy.md) |
| 代码风格     | Lint（ESLint）+ Format（Prettier） | [develop-pipeline.md](./develop-pipeline.md)   |
| 设计原则合规 | 架构合规检查（人工，不在 CI）      | [design-philosophy.md](./design-philosophy.md) |
| 测试覆盖率   | 仅执行测试，不强制覆盖率门禁       | [develop-pipeline.md](./develop-pipeline.md)   |
| 产物完整性   | Verify outputs                     | 本文                                           |
| Bundle size  | gzip check                         | 本文                                           |

---

## 八、已知缺口与改进方向

当前 CI 已覆盖核心质量门禁，以下是未纳入但可在未来增加的检查：

| 缺口                         | 优先级 | 说明                                                                              |
| ---------------------------- | ------ | --------------------------------------------------------------------------------- |
| **代码覆盖率门禁**           | 中     | 当前 `npm test` 运行测试但 CI 不检查覆盖率阈值（本地配置 80%/70% lines/branches） |
| **Changeset 强制检查**       | 中     | PR 未强制要求 changeset 文件；可在 CI 中加入 `changeset status` 检查              |
| **E2E / 视觉回归测试**       | 低     | 无浏览器自动化测试或截图对比                                                      |
| **无障碍自动化测试**         | 低     | 无 axe-core 等 a11y 扫描                                                          |
| **依赖许可证检查**           | 低     | 无 `license-checker` 扫描                                                         |
| **Prerelease/snapshot 发布** | 低     | 无 `next` 频道或 canary 发布流程                                                  |
| **自动 CHANGELOG 生成**      | 低     | 依赖 changeset 手动生成，CI 不自动生成                                            |

---

## 九、CI 检查清单（提交前对照）

```
□ 本地 typecheck 通过
□ 本地 lint 通过（0 errors）
□ 本地 test 通过
□ 本地 build 成功（如修改构建配置）
□ commit message 符合 Conventional Commits
□ PR 标题格式正确（type(scope): subject）
□ 无新增高危 npm 依赖
□ dist/ 产物文件完整
```
