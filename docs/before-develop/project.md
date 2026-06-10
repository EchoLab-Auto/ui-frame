# @echolab/ui-frame 开发前必读索引

> 本文档是 `docs/before-develop/` 的入口索引，汇总所有开发前必读文件的职责与快速参考。开发任何功能前，请按以下顺序阅读。

---

## 文件索引

| 文件                                                 | 职责                         | 必读时机           |
| ---------------------------------------------------- | ---------------------------- | ------------------ |
| [design-philosophy.md](./design-philosophy.md)       | 六条核心设计原则             | **任何修改前**     |
| [develop-pipeline.md](./develop-pipeline.md)         | 从编码到提交的完整验证流程   | 理解规范后开始编码 |
| [documentation-guide.md](./documentation-guide.md)   | 文档分层结构与撰写规范       | 需要写/改文档时    |
| [readme-specification.md](./readme-specification.md) | 项目 README 的内容结构与标准 | 修改 README 时     |

---

## 设计理念一句话总结

**用物理直觉指导视觉，用逻辑分离支撑扩展，用级联配置平衡灵活，用 Token 系统贯通主题，用协议通信解耦组合。**

展开为六条原则：

1. **物理隐喻优先** — 凸起/凹陷/elevation 必须有物理对应
2. **Headless 与 UI 解耦** — 逻辑写在 composable，组件只做视觉
3. **级联配置体系** — 显式 prop > 全局配置 > 硬编码默认值
4. **Token 驱动的主题** — 视觉参数用 CSS 变量，不硬编码
5. **协议化组件通信** — 复杂组合用类型化 Provide/Inject
6. **无障碍是基本要求** — 键盘、ARIA、焦点管理、reduced-motion

详细阐述与示例见 [design-philosophy.md](./design-philosophy.md)。

---

## 开发 Pipeline 速查

### 完整流程

```
前置检查 → 开发阶段（架构合规 + 编码 + 测试） → 人类闭环（UI 修改时） → 提交前验证 → CI 验证
```

详细步骤与命令见 [develop-pipeline.md](./develop-pipeline.md)。

### 最小验证集（Quick Check）

```bash
npm run typecheck && npm test && npm run lint
```

修改了构建相关时追加：

```bash
npm run build && npm run example:build
```

### 提交信息格式

```
<type>(<scope>): <subject>
```

`type`: feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert

---

## 文档分层速查

```
docs/
├── before-develop/    # 约束层 — "该怎么写"（面向开发者）
│   ├── design-philosophy.md
│   ├── develop-pipeline.md
│   ├── documentation-guide.md
│   └── readme-specification.md
│
└── develop/           # 参考层 — "怎么用"（面向使用者）
    ├── api.md         # 参考手册式，按模块名检索
    └── guide.md       # 教程式，按场景阅读
```

详细规范见 [documentation-guide.md](./documentation-guide.md)。

---

## 检查清单汇总

### 提交前检查

```
□ 类型检查通过（npm run typecheck）
□ Lint 检查零错误（npm run lint）
□ 全量测试通过（npm test）
□ 库构建成功（npm run build）
□ 示例构建成功（npm run example:build，如相关）
□ commit message 符合 Conventional Commits 规范
```

### 新增组件检查

```
□ 创建 composable（逻辑层）+ 测试
□ 创建 Vue 组件（视觉层）
□ 导出到 src/index.ts
□ 更新示例站点
□ 运行完整 pipeline
```

### 修改主题/样式检查

```
□ CSS 变量命名符合 Token 规范
□ 验证亮色/暗色双主题
□ 检查 prefers-reduced-motion 支持
□ 确认无障碍属性（ARIA、焦点管理）
```

### 文档撰写检查

```
□ 新增/修改的模块是否已在 API 文档中记录？
□ 新增/修改的使用场景是否已在用户指南中示例？
□ 所有代码示例是否包含正确的导入语句？
□ 类型定义是否与源码导出保持一致？
□ 是否使用了正确的文档分层？
□ 是否存在与另一份文档的重复内容？
□ 是否遵循了格式规范？
```

### README 检查

```
□ 标题是否为 npm 包名 @echolab/ui-frame？
□ 一句话描述是否准确传达项目定位？
□ 特性列表是否包含新拟态、主题切换、TypeScript、无障碍？
□ 安装命令是否正确？
□ 快速开始示例是否可直接复制运行？
□ 是否提供了完整文档的链接？
□ 是否声明了 License？
□ 内容是否面向外部使用者，无内部实现细节？
```

---

## CI 验证清单（PR 合并前自动执行）

| 阶段     | 命令                    | 失败后果              |
| -------- | ----------------------- | --------------------- |
| 安装     | `npm ci`                | 依赖锁定冲突          |
| 类型     | `npm run typecheck`     | TS 类型错误           |
| **Lint** | **`npm run lint`**      | **代码格式/风格错误** |
| 测试     | `npm test`              | 测试失败或覆盖率不足  |
| 库构建   | `npm run build`         | 构建产物缺失          |
| 示例构建 | `npm run example:build` | 示例站点损坏          |
| 产物校验 | 5 个关键文件存在检查    | 产物不完整            |

详细 CI 架构说明见 [../develop/ci-design.md](../develop/ci-design.md)。
