# GitHub Token 授权与数据同步 — 技术设计

## 设计版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始设计 |

## 项目架构

- 架构类型: Turborepo + pnpm monorepo
- 涉及层: 后端（apps/server Hono + packages/api tRPC）、前端（apps/web）
- 规范来源: 项目无 `.claude/CLAUDE.md` 与 `.claude/rules/`，遵循根目录 `AGENTS.md`（Ultracite/Biome）：显式类型、`unknown` 优于 `any`、async/await、抛出 `Error` 对象、无 `console.log`、避免 barrel file、top-level regex。

## 功能模块设计

### 模块 1: GitHub 客户端（packages/api）

新建 `packages/api/src/github/client.ts`：

```ts
export interface GithubCallMeta {
  scopes: string[] | null;          // null = 响应无 X-OAuth-Scopes（fine-grained token）
  rateLimit: { limit: number; remaining: number; resetEpoch: number };
  latencyMs: number;
}
export async function githubRequest<T>(token: string, path: string, init?: RequestInit):
  Promise<{ data: T; meta: GithubCallMeta }>;
```

- 基于全局 `fetch`，固定 `Accept: application/vnd.github+json`、`X-GitHub-Api-Version: 2022-11-28`、`User-Agent: github-inspector`。
- `performance.now()` 计算耗时。
- 头部解析拆到 `github/headers.ts`（纯函数 `parseScopes`、`parseRateLimit`），便于单测。
- 非 2xx 时抛出 `GithubApiError`（`github/errors.ts`），携带 `status`、`rateLimit`、GitHub 返回的 `message`，**不包含 token**。

### 模块 2: tRPC github 路由 + Token 中间件

- `packages/api/src/context.ts`：`Context` 新增 `githubToken: string | null`。
- `apps/server/src/context.ts`：从 `X-GitHub-Token` 请求头读取 token 注入 context。
- `apps/server/src/index.ts`：CORS `allowHeaders` 增加 `X-GitHub-Token`；`allowMethods` 保持。确认 `hono/logger` 只打印 method/path，不打印 header。
- `packages/api/src/index.ts`：新增 `githubProcedure` 中间件——token 为空抛 `UNAUTHORIZED`；把 `GithubApiError` 映射为 `TRPCError`：

| GitHub 状态                         | TRPC code             | message（前端可展示）       | data                    |
| ----------------------------------- | --------------------- | --------------------------- | ----------------------- |
| 401                                 | `UNAUTHORIZED`        | `GITHUB_TOKEN_INVALID`      | -                       |
| 403/429 且 remaining = 0            | `TOO_MANY_REQUESTS`   | `GITHUB_RATE_LIMITED`       | `{ resetEpoch }`        |
| 403（其他，权限不足）               | `FORBIDDEN`           | `GITHUB_FORBIDDEN`          | -                       |
| 其他 / 网络错误                     | `BAD_GATEWAY`(或 INTERNAL_SERVER_ERROR) | `GITHUB_UPSTREAM_ERROR` | -              |

  通过 `initTRPC.create({ errorFormatter })` 把 `resetEpoch` 放进 `shape.data`。
- 新建 `packages/api/src/routers/github.ts`：`github.sync` (query 语义但用 **mutation**，因为由按钮触发、带副作用的配额消耗) 返回：

```ts
{ profile: GithubUser; scopes: string[] | null; rateLimit; latencyMs; syncedAt: string }
```

  `GithubUser` 以 zod 解析 GitHub 响应（login 必填，其余 nullable），在 `github/schemas.ts` 定义并导出类型供前端复用。

### 模块 3: 前端 Token 会话与同步（apps/web）

- `features/profile-manager/lib/token-storage.ts`：`loadToken/saveToken/clearToken`（sessionStorage key `gh-inspector:pat`，try/catch 包裹），`maskToken(token)`。
- `utils/trpc.ts`：`httpBatchLink` 增加 `headers()`，从 token-storage 读取并设置 `X-GitHub-Token`（为空则不设）。
- `features/profile-manager/hooks/use-github-sync.ts`：`useMutation(trpc.github.sync.mutationOptions())`，对外暴露 `{ sync, data, status, error }`；成功时 `saveToken`。同步结果通过 `queryClient.setQueryData(["github-session"], result)` 作为页面级单一数据源，供 feature 2/3/6 读取。
- `TokenSyncPanel` 改为 props 驱动：scopes、rateLimit、status、error；移除 `SESSION.initialPat` 等 mock。
- 配额重置倒计时：`useCountdown(resetEpoch)` hook（1s interval，组件卸载清理），格式 `42m` / `3m 12s`。
- 错误态：根据 `error.message` 映射文案；401 文案附 `https://github.com/settings/tokens` 外链（`rel="noopener noreferrer"`）。
- `ConsoleShell` / `AppSidebar` / `AppTopbar` 的 `rateLimit`、`connectedToken` 改为来自同步结果；未同步时显示占位（`—`）。
- Clear Cache：`clearToken()` + `queryClient.clear()` + 本地状态复位。
- `main.tsx`：删除 stitch 跳转逻辑。

## 接口契约

| 过程          | 类型     | 请求头             | 入参 | 出参                                                         | 错误码                                               |
| ------------- | -------- | ------------------ | ---- | ------------------------------------------------------------ | ---------------------------------------------------- |
| `github.sync` | mutation | `X-GitHub-Token`   | 无   | `{ profile, scopes, rateLimit{limit,remaining,resetEpoch}, latencyMs, syncedAt }` | UNAUTHORIZED / TOO_MANY_REQUESTS / FORBIDDEN / BAD_GATEWAY |

## 数据模型

无数据库变更。前端 sessionStorage：`gh-inspector:pat` → PAT 字符串。

## 安全考虑

- PAT 仅在请求头传输；服务端不持久化、不缓存明文、不写日志；`GithubApiError` 与 `TRPCError.cause` 不携带 token。
- 前端除输入框外只显示 `maskToken` 结果。
- 外链统一 `rel="noopener noreferrer"`。
- CORS 只放行 `CORS_ORIGIN`，`credentials: true` 不变。

## 技术决策

| 决策               | 选项                                | 理由                                                         |
| ------------------ | ----------------------------------- | ------------------------------------------------------------ |
| Token 传递方式     | 请求头 / tRPC input                 | 请求头：不会进入 tRPC 批量 URL（GET query），对所有 github* 过程统一生效 |
| sync 过程类型      | query / mutation                    | mutation：按钮触发，避免 React Query 自动重取消耗配额         |
| HTTP 客户端        | fetch / octokit                     | fetch：仅 2 个端点，免新增依赖                                |
| 单测框架           | Vitest                              | 与 Vite 生态一致，TS 零配置                                   |
