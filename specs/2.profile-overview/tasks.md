# GitHub 档案概览与遥测卡片 — 任务清单

## 任务版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始任务 |

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo
- specs 路径: specs/2.profile-overview/

## 任务列表

### 功能 1: 视图模型

- [x] T-001: `lib/profile-view.ts`（toIdentityView、formatCompactNumber、formatDate、kindLabel） ~15min

### 功能 2: 身份卡片

- [x] T-002: IdentityCard 改 props 驱动（真实字段、空值 `—`、https 头像校验、html_url 外链），移除 role mock ~30min
- [x] T-003: IdentityCardSkeleton + OverviewEmptyState ~15min

### 功能 3: 遥测卡片

- [x] T-004: TelemetryCard 改为 4 项即时指标（延迟着色、相对时间、配额%、node_id），删除 ActivitySparkline 与 TELEMETRY mock，附 Skeleton ~30min

### 集成与测试

- [x] T-005: ProfileManagerPage 按 pending/空/有数据切换卡片，删除 ACCOUNT mock ~15min
- [x] T-006: apps/web 引入 Vitest；profile-view 单测（紧凑数字、日期、null 回退、kindLabel） ~15min

## 依赖关系

- T-001 依赖 1.T-003（GithubUser 类型）
- T-002、T-003 依赖 T-001
- T-004 依赖 1.T-005
- T-005 依赖 T-002、T-003、T-004、1.T-005
- T-006 依赖 T-001

## 风险点

- 若 3. 或 5. 先行引入 apps/web Vitest，T-006 只需补测试文件，注意避免重复配置。
- `Intl` compact 在不同 locale 输出不同（`1.4K` vs `1.4k`），固定 `en-US` 并统一小写。
