# GitHub 档案概览与遥测卡片 — 需求规格

## 概述

将同步得到的 GitHub 档案以身份卡片 + 遥测卡片展示，替换 `data.ts` 中的 ACCOUNT / TELEMETRY mock，并提供加载骨架屏与未同步空状态。

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo（apps/web React 19 + TanStack Query）

## 需求版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始需求 |

## 用户故事

- 作为开发者，我想要同步后立刻看到自己的头像、姓名、统计数据，以便确认拉取的是正确账号。
- 作为 Team Lead，我想要看到本次同步耗时与配额状态，以便判断网络与 Token 健康度。

## 功能需求

1. [F-001] 身份卡片展示：Avatar、Name（为空回退 login）、`@login`、Bio（为空隐藏）。
2. [F-002] 指标统计：Public Repos、Followers、Following，≥1000 使用紧凑格式（如 `1.4k`）。
3. [F-003] 事实列表：Company、Location、建号时间（`created_at` 格式化为 `YYYY-MM-DD`），值为空显示 `—`。
4. [F-004] 「访问公开 GitHub 主页」外链指向 `html_url`，新窗口打开。
5. [F-005] 遥测卡片展示即时指标：Sync Latency（ms）、最近同步时间、API 配额剩余百分比、GraphQL Node ID（`node_id`）。
6. [F-006] **本期不做**接口活跃度/耗时折线趋势图与「近 30 天修改次数」：移除 `ActivitySparkline` 与相关 mock，卡片布局保持平衡。
7. [F-007] 同步进行中显示骨架屏（Skeleton）；从未同步时显示空状态引导「输入 Token 并同步」。
8. [F-008] 移除身份卡片中 mock 的 `role` 徽章（GitHub API 无此字段），改为展示 `type`（User/Organization）或 `site_admin` 标识。

## 非功能需求

- 性能: 加载状态即时出现（无闪烁），图片设置固定宽高避免 CLS。
- 安全: 外链 `rel="noopener noreferrer"`；avatar 仅接受 `https:` URL。
- 兼容性: 1280px+ 宽屏优先，暗色主题，保持现有 lg:12 栅格布局。

## 验收标准

- [ ] [AC-001] 同步后身份卡片所有字段与 GitHub 实际数据一致。
- [ ] [AC-002] followers=1432 显示为 `1.4k`；created_at `2018-04-12T08:00:00Z` 显示为 `2018-04-12`。
- [ ] [AC-003] 字段为 null 时显示 `—`，不出现 `null`/`undefined`。
- [ ] [AC-004] 同步中显示骨架屏；未同步显示空状态。
- [ ] [AC-005] 遥测卡片 Sync Latency 与 1.F-005 返回值一致，页面中无趋势图与 mock 数值。
- [ ] [AC-006] 头像加载失败显示占位图标。

## 依赖

- 1.github-token-sync（`github.sync` 返回值与 `["github-session"]` 查询缓存）
- `@hono_homework_2/ui` Skeleton 组件（已有）
- Vitest（apps/web 新增）

## 开放问题

- 无
