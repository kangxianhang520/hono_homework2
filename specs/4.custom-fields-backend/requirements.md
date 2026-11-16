# 自定义字段后端存储 — 需求规格

## 概述

在 PostgreSQL 中持久化自定义元数据字段（key/type/value），通过 tRPC 提供按 GitHub 账号隔离的 CRUD，Secret 类型值加密存储。

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo（packages/db Drizzle + AWS RDS / Aurora PostgreSQL，packages/api tRPC）

## 需求版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始需求 |

## 用户故事

- 作为开发者，我想要我的自定义字段保存在服务端，以便换浏览器/设备后用同一 Token 仍能看到。
- 作为 Team Lead，我想要 Secret 类型字段加密保存，以便敏感信息（如内部工号、密钥指纹）不被明文泄露。

## 功能需求

1. [F-001] 新建 `custom_field` 表：id、github_login、key、type、value、position、created_at、updated_at；`(github_login, key)` 唯一。
2. [F-002] 归属鉴别：服务端用请求头 PAT 调 `GET /user` 解析 login，作为数据隔离主键；同一 token 的解析结果短期缓存，避免每次 CRUD 消耗配额。用户无法读写其他 login 的字段。
3. [F-003] `customField.list`：按 position 升序返回当前用户全部字段；Secret 值返回掩码与 `hasValue`，不返回明文。
4. [F-004] `customField.revealSecret`：按 id 返回单个 Secret 字段明文（用于 UI「显示」按钮）。
5. [F-005] `customField.create`：校验后插入，position 取当前最大值 +1；key 重复返回 CONFLICT。
6. [F-006] `customField.update`：按 id 局部更新 key/type/value；改 type 时按新类型重新校验 value；key 冲突返回 CONFLICT。
7. [F-007] `customField.delete`：按 id 删除，仅能删除本人字段。
8. [F-008] 值校验（与前端共用 schema）：Text ≤1000 字符；Tags 为字符串数组（每项 1–50 字符、去重、≤30 项）；URL 必须 http(s)；Number 为有限数值；Secret ≤1000 字符。key：1–64 字符、去首尾空格。
9. [F-009] Secret 值以 AES-256-GCM 加密存储，密钥来自新环境变量 `CUSTOM_FIELD_SECRET_KEY`。

## 非功能需求

- 性能: 单次 CRUD 服务端处理（不含 GitHub 鉴别缓存未命中）< 200ms。
- 安全: 全部过程走 githubProcedure；跨账号访问返回 NOT_FOUND（不泄露存在性）；Secret 明文不入日志。
- 兼容性: 数据库为 AWS RDS / Aurora PostgreSQL（node-postgres 驱动，支持事务）；position 计算采用单条 SQL 子查询，无需显式事务。

## 验收标准

- [ ] [AC-001] `pnpm db:generate` 生成迁移，`db:migrate` 后表结构与设计一致。
- [ ] [AC-002] A 账号创建的字段，B 账号 Token list 不可见，update/delete A 的 id 返回 NOT_FOUND。
- [ ] [AC-003] 同一账号重复 key 创建/改名返回 CONFLICT。
- [ ] [AC-004] 非法值（URL `ftp://x`、Number `abc`、空 key）返回 BAD_REQUEST。
- [ ] [AC-005] 数据库中 Secret 字段 value 为密文；list 不含明文；revealSecret 返回明文。
- [ ] [AC-006] 连续 10 次 CRUD 只触发 1 次 GitHub `GET /user`（缓存命中）。

## 依赖

- 1.github-token-sync（githubProcedure、githubRequest）
- Drizzle ORM / drizzle-kit（已有）、Node `crypto`

## 开放问题

- 无
