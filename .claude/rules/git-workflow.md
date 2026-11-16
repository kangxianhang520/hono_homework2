---
description: Git 分支、提交信息、提交前检查与 PR 流程规范(Turborepo + pnpm monorepo)
---

# Git 工作流规范

## 分支

- 主分支为 `main`,禁止直接在 `main` 上提交或 force push;所有改动走功能分支 + PR。
- 分支命名使用小写 + 下划线/连字符,体现用途,例如:`feat/profile-edit`、`fix/auth-session`、`requirement_breakdown`。
- 一个 feature(对应 `specs/<n>.<feature-name>/`)对应一个分支,分支内按 `tasks.md` 的 task 粒度小步提交。
- 开始工作前先 `git fetch` 并基于最新 `origin/main` 创建分支;合并前 rebase 或 merge `main` 解决冲突。

## 提交信息

- 使用 Conventional Commits:`<type>(<scope>): <subject>`,`scope` 可选。
  - type:`feat` / `fix` / `refactor` / `chore` / `docs` / `test` / `style` / `perf` / `build` / `ci`。
  - scope 优先用 workspace 名:`web`、`server`、`docs`、`api`、`auth`、`db`、`ui`、`config`、`env`。
  - 示例:`feat(api): add profile.update procedure`、`fix(db): correct custom_field index`。
- subject 用祈使句、简短(建议 ≤ 72 字符),结尾不加句号;中英文均可,同一 PR 内保持一致。
- 一个提交只做一件事;跨包改动(如 db schema + api + web)若属于同一功能可合并为一个提交,但不要混入无关格式化。
- 由 Claude 生成的提交,结尾附加会话要求的 `Co-Authored-By` 署名行。

## 提交前检查

提交/推送前在仓库根目录依次通过:

```bash
pnpm fix           # ultracite fix (Biome) 自动格式化与修复
pnpm check         # ultracite check,必须零错误
pnpm check-types   # turbo run check-types,全部 workspace 类型检查
pnpm build         # 涉及构建配置、依赖或路由时执行
```

- 修改 `packages/db/src/schema` 后必须执行 `pnpm db:generate` 并一并提交生成的 migration 文件;不要手改已提交的 migration。
- 修改 Better Auth 配置导致表结构变化时,执行 `pnpm auth:generate` 并提交产物。

## 禁止提交的内容

- 环境变量与密钥:`.env`、`.env*.local`、任何包含 `DATABASE_URL`、`BETTER_AUTH_SECRET`、GitHub token 的文件。新增变量只修改 varlock schema(`.env.schema`)并通过 `pnpm env:generate` 生成类型。
- 生成物与缓存:`node_modules`、`dist`、`build`、`.turbo`、`*.tsbuildinfo`、`apps/web/src/routeTree.gen.ts`、`coverage`、`*.log`。
- 本地规划文件:`PLAN.md` 及 `.gitignore` 中列出的临时目录。
- `.claude/settings.local.json` 等个人本地配置。
- 提交前用 `git status` / `git diff --staged` 确认暂存内容,避免 `git add -A` 带入无关文件。

## 依赖与锁文件

- 统一使用 `pnpm@11.9.0`,禁止 npm/yarn/bun 安装依赖产生其他锁文件。
- 依赖变更必须同时提交 `package.json` 与 `pnpm-lock.yaml`;共享版本优先放入 `pnpm-workspace.yaml` 的 `catalog:`。

## Pull Request

- PR 目标分支为 `main`,标题沿用 Conventional Commits 格式。
- 描述包含:关联的 spec/feature(`specs/` 路径)、变更摘要、涉及的 workspace、数据库 migration 说明、验证方式(命令输出或截图)。
- 合并前确保 `pnpm check` 与 `pnpm check-types` 通过,并处理所有 review 意见。
- 由 Claude 创建的 PR,描述结尾附加会话要求的生成署名行。

## 危险操作

- 未经用户明确要求,不执行 `git push --force`、`git reset --hard`、`git clean -fd`、`git rebase -i`、删除分支等破坏性操作。
- 未经用户要求不主动 commit 或 push;需要提交时若当前在 `main`,先创建分支。
