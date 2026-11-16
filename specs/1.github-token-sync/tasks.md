# GitHub Token 授权与数据同步 — 任务清单

## 任务版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始任务 |

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo
- specs 路径: specs/1.github-token-sync/

## 任务列表

### 功能 1: 服务端 GitHub 代理

- [ ] T-001: packages/api `github/headers.ts`（parseScopes/parseRateLimit）+ `github/errors.ts`（GithubApiError）+ `github/client.ts`（githubRequest，含耗时统计） ~30min
- [ ] T-002: Context 增加 githubToken；server context 读取 `X-GitHub-Token`，CORS 放行该头；`githubProcedure` 中间件 + errorFormatter 错误码映射 ~30min
- [ ] T-003: `github/schemas.ts`（GithubUser zod）+ `routers/github.ts` 的 `github.sync` mutation，挂载到 appRouter ~15min

### 功能 2: 前端 Token 会话与同步

- [ ] T-004: `lib/token-storage.ts`（sessionStorage 读写/清除、maskToken）+ trpc link 注入 `X-GitHub-Token` 头 + 删除 main.tsx stitch 跳转 ~15min
- [ ] T-005: `use-github-sync` + `use-countdown` hook；TokenSyncPanel 改 props 驱动，展示真实 scopes/配额/倒计时/401·403 错误态 ~30min
- [ ] T-006: ConsoleShell/Sidebar/Topbar 接入真实 rateLimit 与脱敏 token，未同步占位；Clear Cache 清 token + queryClient ~30min

### 集成与测试

- [ ] T-007: packages/api 引入 Vitest；headers 解析、错误映射、github.sync（mock fetch：200/401/403 限流）单测，断言错误中无 token ~30min

## 依赖关系

- T-002 依赖 T-001
- T-003 依赖 T-002
- T-005 依赖 T-003、T-004
- T-006 依赖 T-005
- T-007 依赖 T-003

## 风险点

- Fine-grained Token 不返回 `X-OAuth-Scopes`：UI 需显式提示，下游（3. 保存权限判断）不能仅依赖 scopes，需以 PATCH 实际返回为准。
- tRPC httpBatchLink 对 query 使用 GET，若误把 token 放入 input 会进入 URL —— 统一走请求头规避。
- 本地开发跨域 cookie `sameSite: none` 配置不影响自定义头，但需确认预检请求通过。
