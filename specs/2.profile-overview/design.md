# GitHub 档案概览与遥测卡片 — 技术设计

## 设计版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始设计 |

## 项目架构

- 架构类型: Turborepo + pnpm monorepo
- 涉及层: 前端（apps/web `features/profile-manager`）
- 规范: AGENTS.md（Ultracite）——组件不内嵌定义、key 用稳定 ID、img 提供 alt 与宽高、语义化 HTML。

## 功能模块设计

### 模块 1: 视图模型映射

新建 `features/profile-manager/lib/profile-view.ts`（纯函数，可单测）：

```ts
export interface IdentityView {
  avatarUrl: string | null; name: string; login: string; bio: string | null;
  kindLabel: string;            // "User" | "Organization" | "Site Admin"
  profileUrl: string;
  stats: { label: string; value: string }[];
  facts: { icon: string; label: string; value: string }[];
}
export function toIdentityView(user: GithubUser): IdentityView;
export function formatCompactNumber(n: number): string;   // Intl.NumberFormat notation:"compact"
export function formatDate(iso: string): string;          // YYYY-MM-DD (UTC)
```

`GithubUser` 类型从 `@hono_homework_2/api/github/schemas` 导入（1.T-003）。

### 模块 2: 身份卡片

- `IdentityCard` 改为 `{ view: IdentityView }` props；`Avatar` 抽出为同文件顶层组件，接收 url/alt；`avatarUrl` 非 https 时直接显示占位。
- 新增 `IdentityCardSkeleton`（Panel + Skeleton 块，结构与卡片一致）。

### 模块 3: 遥测卡片

- `TelemetryCard` 改为 props：`{ latencyMs, syncedAt, rateLimit, nodeId }`。
- 删除 `activity-sparkline.tsx` 与 `TELEMETRY` mock；卡片内用 4 个指标块（2×2 或 1×4 栅格）展示：Sync Latency、Last Synced（相对时间，如 `12s ago`）、Quota Remaining（%）、GraphQL Node。
- 延迟着色：<300ms primary，300–500ms tertiary，>500ms error（对应 NFR 500ms 目标）。
- 新增 `TelemetryCardSkeleton`。

### 模块 4: 页面装配

- `ProfileManagerPage` 读取 `["github-session"]` 缓存与 sync mutation 状态：
  - `status === "pending"` → 两个 Skeleton；
  - 无数据 → `OverviewEmptyState`（使用 ui `empty.tsx`）；
  - 有数据 → 真实卡片。
- 删除 `data.ts` 中 `ACCOUNT`、`TELEMETRY`。

## 接口契约

无新增接口，消费 `1.github-token-sync` 的 `github.sync` 结果：`profile`（含 `avatar_url, name, login, bio, type, site_admin, public_repos, followers, following, company, location, created_at, html_url, node_id`）、`rateLimit`、`latencyMs`、`syncedAt`。

> 需确保 1.T-003 的 `GithubUser` schema 包含 `type`、`site_admin`、`html_url`、`node_id`、`created_at` 字段。

## 数据模型

无。

## 安全考虑

- 头像 URL 校验协议（复用 `toSafeUrl`）；外链 `noopener noreferrer`。
- 不渲染 HTML（bio 作为纯文本，Markdown 渲染不在本 feature 范围）。

## 技术决策

| 决策         | 选项                          | 理由                                    |
| ------------ | ----------------------------- | --------------------------------------- |
| 趋势图       | 做 / 不做                     | 不做（2026-11-14 用户确认），降低范围    |
| 数字紧凑格式 | Intl compact / 手写           | Intl.NumberFormat，无依赖、本地化正确    |
| 数据来源     | 独立 query / 共享 sync 缓存   | 共享 `["github-session"]`，避免重复消耗配额 |
