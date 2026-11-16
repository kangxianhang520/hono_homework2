# 底部全局操作与导出 — 需求规格

## 概述

实现底部操作栏的「重置修改」「导出配置为 JSON」「保存档案与自定义字段」，串联 3. 与 5.，并以 E2E 测试覆盖完整主流程。

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo（apps/web）

## 需求版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始需求 |

## 用户故事

- 作为开发者，我想要一键导出「GitHub 基础档案 + 扩展字段」JSON，以便集成到博客生成器或 DevPortal。
- 作为用户，我想要一键放弃未保存修改，以便回到上次同步/保存的状态。
- 作为用户，我想要一个保存按钮同时提交档案与正在编辑的字段，以便操作简单明确。

## 功能需求

1. [F-001] 导出 JSON 严格符合 PRD 第 5 节 Schema：`auth`（`token_masked`、`scopes`、`rate_limit{limit,remaining,reset_epoch}`）、`profile`（login 必填，及 name/avatar_url/email/bio/blog/company/location/twitter_username/public_repos/followers/following）、`custom_fields`（数组，`{id,key,type,value}`），附加 `exported_at`。
2. [F-002] 导出时 Secret 类型 value 输出为 `"********"`（不导出明文）；Tags 为数组、Number 为数值；profile 采用当前草稿（含未保存修改）并在 JSON 中附 `profile_dirty: true/false`。
3. [F-003] 文件名 `github-profile-{login}-{YYYYMMDD-HHmmss}.json`，2 空格缩进；成功 toast。未同步时导出按钮禁用。
4. [F-004] 保存（Save）：
   - 标准档案有变更 → 调用 3. 的 `updateProfile`（仅 diff）；
   - 自定义字段若存在未提交的编辑行 → 先提交（与 5. 的 update/create 一致）；已提交的增删改已实时持久化；
   - 档案表单存在校验错误 → 阻止保存并滚动到首个错误字段；
   - 全部成功 → Toast「档案信息及自定义字段已成功同步并持久化！」并清除 dirty 标记；部分失败 → 列出失败项，成功部分不回滚。
   - 无任何变更时按钮禁用。
5. [F-005] 重置（Reset）：标准档案草稿恢复为基线（上次同步/保存），关闭所有自定义字段编辑行并丢弃其草稿；toast 提示。无变更时按钮禁用。
6. [F-006] 操作栏状态文案：无变更「工作区就绪 • 无未保存冲突」；有变更「工作区有 N 处未保存的修改」。
7. [F-007] 存在未保存修改时关闭/刷新页面触发浏览器 `beforeunload` 确认。
8. [F-008] 顶栏「Export JSON」与底部导出按钮共用同一逻辑。

## 非功能需求

- 性能: 导出为纯前端操作 < 100ms。
- 安全: 导出文件不含 PAT 明文与 Secret 明文。
- 兼容性: Chrome/Edge/Firefox/Safari 最新版下载可用。

## 验收标准

- [ ] [AC-001] 导出的 JSON 通过 PRD 第 5 节 JSON Schema 校验（测试中用 schema 校验）。
- [ ] [AC-002] 导出文件中搜索不到 PAT 明文与 Secret 明文。
- [ ] [AC-003] 修改档案后 Reset，表单恢复且 dirty 标记消失。
- [ ] [AC-004] 修改档案 + 打开一个字段编辑行后 Save，两者均持久化，标记消失，toast 出现。
- [ ] [AC-005] 档案存在校验错误时 Save 被阻止。
- [ ] [AC-006] E2E：同步 → 编辑档案 → 新增/编辑/删除字段 → 保存 → 导出，全流程通过（GitHub 响应 mock）。

## 依赖

- 3.standard-profile-edit（useProfileForm、useSaveProfile）
- 5.custom-fields-ui（use-custom-fields、编辑行状态）
- 1.github-token-sync（同步结果、maskToken）
- Playwright（新增，E2E）

## 开放问题

- 无
