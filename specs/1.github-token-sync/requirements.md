# GitHub Token 授权与数据同步 — 需求规格

## 概述

用户输入 GitHub PAT，经 Hono 服务端代理请求 `GET https://api.github.com/user`，拉取账号档案并解析授权作用域与 API 配额，替换当前页面的 mock 数据源。

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo（apps/web: React 19 + TanStack Router/Query；apps/server: Hono on Node；packages/api: tRPC v11；packages/db: Drizzle + AWS RDS / Aurora PostgreSQL；packages/ui: shadcn + console 组件）

## 需求版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始需求 |

## 用户故事

- 作为开源贡献者，我想要粘贴 PAT 后一键拉取 GitHub 档案，以便免去手动录入基础信息。
- 作为 Team Lead，我想要看到 Token 已授权的作用域与剩余配额，以便判断该 Token 能否用于后续写操作。
- 作为注重安全的用户，我想要 Token 默认密文显示并可随时清除，以便避免凭证泄露。

## 功能需求

1. [F-001] Token 输入框默认密文（`type=password`），提供显示/隐藏切换。
2. [F-002] 点击「获取/同步数据」后，前端通过 tRPC `github.sync` 调用服务端；服务端携带 `Authorization: Bearer <token>` 请求 `GET /user`。
3. [F-003] 解析响应头 `X-OAuth-Scopes`，在界面以 Chip 高亮展示已授权作用域；Fine-grained Token 无该头时显示「Fine-grained（作用域不可见）」提示。
4. [F-004] 解析 `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset`，展示配额进度条（如 `4,982 / 5,000`）与重置倒计时（每秒/每分钟刷新），侧栏与顶栏同步展示。
5. [F-005] 记录服务端到 GitHub 的请求耗时（Sync Latency, ms）并随结果返回。
6. [F-006] 异常处理：401 → 提示「Token 无效或已过期」并附「重新生成 Token」外链；403 且 `X-RateLimit-Remaining=0` → 提示配额耗尽及重置时间点；网络/5xx → 通用错误提示可重试。
7. [F-007] PAT 存于 sessionStorage，刷新后自动恢复（不自动发请求，显示「已缓存 Token，点击同步」）；UI 其他位置（顶栏 connected token 等）只显示脱敏值（前 11 位 + `***`）。
8. [F-008] 「Clear Cache」清除 sessionStorage 中的 PAT、清空 React Query 缓存，页面回到未同步状态。
9. [F-009] 移除 `apps/web/src/main.tsx` 中跳转 `/stitch-design.html` 的临时逻辑，首页渲染 React 版 `ProfileManagerPage`。

## 非功能需求

- 性能: 服务端代理额外开销 < 50ms；同步过程中按钮进入 pending 态并显示 loading。
- 安全: 服务端不得记录 PAT（含 hono logger、错误堆栈、tRPC 错误 cause）；PAT 只经 HTTPS 请求头传输，不出现在 URL/query；不发送到任何第三方分析系统。
- 兼容性: PC 宽屏 1280px+ 优先，暗色主题。

## 验收标准

- [ ] [AC-001] 输入有效 PAT 点击同步后，页面展示真实 login/作用域/配额，且无 mock 数据残留。
- [ ] [AC-002] 输入无效 PAT，显示 401 提示与重新生成链接，且不崩溃。
- [ ] [AC-003] 模拟配额耗尽（403 + remaining=0），显示重置时间点。
- [ ] [AC-004] 刷新页面后 Token 仍在输入框（密文）；关闭标签页后再打开则为空。
- [ ] [AC-005] 点击 Clear Cache 后 sessionStorage 无 PAT，页面回到未同步状态。
- [ ] [AC-006] 服务端日志与 tRPC 错误响应中搜索不到 PAT 明文。
- [ ] [AC-007] 访问 `/` 不再跳转到 `stitch-design.html`。

## 依赖

- GitHub REST API v3（`GET /user`）
- `@hono/trpc-server`、`@trpc/tanstack-react-query`（已有）
- Vitest（新增，用于 packages/api 单测）

## 开放问题

- 无（调用路径、存储方式已于 2026-11-14 确认，见 PLAN.md）
