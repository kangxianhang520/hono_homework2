# 标准档案字段编辑 — 需求规格

## 概述

以同步得到的 GitHub 档案作为基线，提供标准字段的编辑、格式校验、未保存标记，并经服务端代理 `PATCH /user` 回写 GitHub。

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo（apps/web + packages/api tRPC）

## 需求版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始需求 |

## 用户故事

- 作为开发者，我想要直接在控制台修改 GitHub 显示名、简介、博客等，以便不用切换到 GitHub 设置页。
- 作为用户，我想要在格式错误时立刻看到提示，以便避免提交失败。

## 功能需求

1. [F-001] 表单基线来自同步结果（1.github-token-sync），再次同步成功后基线与草稿同时刷新（若存在未保存修改，提示确认覆盖）。
2. [F-002] 字段：Username（只读主键）、Display Name、Public Email、Bio（多行，提示支持 Markdown）、Blog/Website、Company、Location、Twitter Handle。
3. [F-003] Public Email 支持下拉选择（来自 `GET /user/emails` 已验证邮箱，需 `user:email` 作用域）或手动录入；无权限时退化为手动输入并提示。
4. [F-004] 校验：Blog 为空或合法 http(s) URL；Email 为空或合法邮箱格式；Twitter Handle 去掉前导 `@`、仅字母数字下划线、≤15 字符；Bio ≤160 字符（GitHub 限制）。错误内联显示，存在错误时禁止保存。
5. [F-005] 任一字段与基线不同即标记「未保存变更」（字段级标记 + 全局 dirty）。
6. [F-006] 服务端 `github.updateProfile` 只提交变更字段（diff）调用 `PATCH /user`，返回最新档案；成功后基线更新为返回值。
7. [F-007] Token 缺少 `user` 写权限（403）时，提示「当前 Token 缺少 user 写入权限，无法回写 GitHub」，草稿保留。

## 非功能需求

- 性能: 输入无卡顿（受控组件，仅当前字段重渲染可接受）。
- 安全: 服务端用 zod 白名单字段，拒绝 `login` 等只读字段；token 处理遵循 1.design 安全约定。
- 兼容性: 同 PRD。

## 验收标准

- [ ] [AC-001] 同步后表单显示真实档案；修改任一字段出现未保存标记，改回原值标记消失。
- [ ] [AC-002] Blog 输入 `javascript:alert(1)` 或 `abc` 显示错误并禁止保存。
- [ ] [AC-003] 具备 `user` 权限的 Token 保存后，GitHub 端数据实际更新，标记清除。
- [ ] [AC-004] 只读 Token 保存时显示权限不足提示，草稿不丢失。
- [ ] [AC-005] 有 `user:email` 权限时 Email 可下拉选择已验证邮箱。
- [ ] [AC-006] PATCH 请求体只包含修改过的字段。

## 依赖

- GitHub REST API `PATCH /user`、`GET /user/emails`
- 1.github-token-sync（githubProcedure、githubRequest、同步缓存）

## 开放问题

- GitHub 只允许把 Public Email 设为已验证邮箱；手动录入未验证邮箱时 GitHub 返回 422，按通用错误展示（已在设计中处理）。
