#!/usr/bin/env node
// `prepare`：本地装依赖时挂钩子；**作为 git 依赖被安装时必须产出 dist**。
//
// 为什么需要它：Panel 等消费方以 `git+https://…#<sha>` 引用本库，npm 会在
// 临时克隆里跑 `prepare` 再打包——没有这一步，装进去的包只有源码、没有
// `dist/`，消费方 import 直接失败（而失败发生在他们那边，不在本仓 CI）。
//
// 为什么 husky 用 try/catch 包住：CI 与临时克隆里没有 hooks 目录，husky 失败
// 属正常；但不能让它挡住后面的构建。
//
// 代价：本地 `npm install` 也会构建一遍（约 20s）。这是刻意取舍——「dist 一定
// 与源码同步」比省那 20s 重要；历史上正是靠「提交一份手工同步的产物」维持，
// 结果产物与源码漂移、消费方被锁在旧 API 上。

import { execSync } from 'node:child_process'

function tryRun(command) {
  try {
    execSync(command, { stdio: 'inherit' })
  } catch {
    // husky 在无 .git / 无 hooks 的环境里会失败，不影响产物
  }
}

if (!process.env.UI_FRAME_SKIP_HUSKY) tryRun('husky')
execSync('npm run build', { stdio: 'inherit' })
