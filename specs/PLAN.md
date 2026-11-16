# 开发计划索引

需求源：`docs/prd.md`（GitHub Inspector — 个人信息与自定义字段管理控制台 v1.0.0）

## 本次 PRD（2026-11-14）切分为 6 个 feature

| 序号 | feature                 | 说明                                                                 | 依赖    | 状态   |
| ---- | ----------------------- | -------------------------------------------------------------------- | ------- | ------ |
| 1    | github-token-sync       | PAT 输入/脱敏存储、服务端代理 GET /user、作用域与配额解析、错误处理、Clear Cache | -       | 待开发 |
| 2    | profile-overview        | 档案概览卡片与遥测卡片接入真实同步数据，骨架屏/空状态（本期不做趋势图） | 1       | 待开发 |
| 3    | standard-profile-edit   | 标准档案表单：基线回填、格式校验、公开邮箱下拉、服务端代理 PATCH /user | 1       | 待开发 |
| 4    | custom-fields-backend   | custom_field 表 + 迁移、按 GitHub login 隔离的 tRPC CRUD、Secret 加密   | 1       | 待开发 |
| 5    | custom-fields-ui        | 自定义字段前端：接入 tRPC、乐观更新、行内编辑、Tags/URL/Number/Secret 输入 | 4       | 待开发 |
| 6    | save-export-actions     | 底部全局操作：保存编排、重置、按 PRD Schema 导出 JSON、E2E              | 3, 5    | 待开发 |

**推荐执行顺序**：1 → (2 ∥ 3 ∥ 4) → 5 → 6

- 1 完成后，2 / 3 / 4 互不依赖，可并行。
- 5 依赖 4 的 tRPC 接口与共享 schema。
- 6 依赖 3（档案保存接口）与 5（自定义字段状态），作为收尾集成。

## 已确认的关键决策（2026-11-14）

| 问题                 | 决策                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| GitHub API 调用路径  | Hono 服务端代理（tRPC），PAT 经 `X-GitHub-Token` 请求头传递，服务端不落库、不打日志 |
| 自定义字段持久化     | PostgreSQL（Drizzle），按服务端用 PAT 校验得到的 GitHub login 隔离，不引入 better-auth 登录 |
| 遥测趋势图           | 本期不做；遥测卡片只展示最近一次同步耗时等即时指标                   |
| 前端 PAT 存储        | sessionStorage（关闭标签页即清除），Clear Cache 立即清除；UI/导出只出现脱敏值 |

## ID 编号约定

- 功能需求 / 任务 / 验收标准 ID **在单个 feature 内编号**，跨 feature 用 `{序号}.` 前缀区分。
- 例：`2.T-001` = 序号 2 这个 feature 的 T-001；`3.F-005` = 序号 3 的 F-005。
- **跨 feature 依赖**写全限定 ID，如 `3.T-001 依赖 1.T-002`。
