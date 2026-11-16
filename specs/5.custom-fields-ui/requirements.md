# 自定义字段前端管理 — 需求规格

## 概述

自定义字段面板接入 4. 的 tRPC CRUD，支持行内新增/编辑/删除、按类型呈现输入组件（含 Secret），全部操作采用乐观 UI 更新。

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo（apps/web React 19 + TanStack Query + tRPC）

## 需求版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始需求 |

## 用户故事

- 作为开发者，我想要在表格里直接新增和修改扩展属性，以便快速维护技术栈、Discord Handle 等信息。
- 作为用户，我想要输入 Tags 时回车生成标签，以便直观管理标签组。
- 作为用户，我想要 Secret 字段默认隐藏，以便在共享屏幕时不泄露。

## 功能需求

1. [F-001] 列表数据来自 `customField.list`（同步成功后启用查询），移除 localStorage 与 `INITIAL_CUSTOM_FIELDS` mock。
2. [F-002] 新增：点击顶部「+ 新增字段」，在列表**底部追加一行空白编辑行**（替换现有顶部 AddFieldCard），聚焦 Key 输入；Enter/✓ 提交，Esc/✕ 取消。
3. [F-003] 编辑：双击行（或行末编辑按钮 / 键盘 Enter）进入行内编辑，可修改 Key、Type、Value；提交前用共享 schema 校验，错误内联提示。
4. [F-004] 类型化输入：Text 文本框；Tags 回车或逗号分词生成 Tag Pill，Backspace 删除末尾、点击 × 删除单个；URL 校验 http(s) 协议；Number 数字输入；Secret 密码框。
5. [F-005] 类型化展示：Tags 显示 Pill；URL 显示安全外链；Number 千分位；Secret 显示 `••••••••` 与「显示」按钮（调用 revealSecret，10 秒后自动隐藏）。
6. [F-006] 删除：点击行末垃圾桶直接移除（保留淡出动画），更新「当前已载入 N 项扩展属性」计数。
7. [F-007] 乐观 UI：create/update/delete 立即反映到列表，失败回滚并 toast 错误（CONFLICT → 「字段名已存在」）。
8. [F-008] key 唯一性前端预检（大小写敏感，与服务端一致），重复时禁止提交。
9. [F-009] 未同步（无 Token）时面板显示禁用态提示「请先同步 GitHub 账号」。

## 非功能需求

- 性能: 增删改交互 < 100ms 反馈（乐观更新），无卡顿。
- 安全: Secret 明文仅在用户点击显示后短暂存在于组件状态，不写入 Query 缓存；URL 渲染仅 http(s)。
- 可访问性: 行内编辑控件有 label；键盘可完成新增/编辑/取消；图标按钮有 aria-label。

## 验收标准

- [ ] [AC-001] 新增字段后立即出现在列表底部，刷新页面后仍在（来自 DB）。
- [ ] [AC-002] 双击行可修改 Key/Type/Value，保存后刷新仍为新值。
- [ ] [AC-003] Tags 输入 `Go` 回车、`Rust` 回车，生成 2 个 Pill，保存后为数组。
- [ ] [AC-004] 断网或服务端返回错误时，乐观插入的行被回滚并提示。
- [ ] [AC-005] 重复 key 提交被拦截并提示。
- [ ] [AC-006] Secret 默认掩码，点击显示后可见，10 秒后自动隐藏。
- [ ] [AC-007] 删除后计数同步减少。

## 依赖

- 4.custom-fields-backend（customField 路由、共享 schema）
- 1.github-token-sync（同步状态）

## 开放问题

- 无
