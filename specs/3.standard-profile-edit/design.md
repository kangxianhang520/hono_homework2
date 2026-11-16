# 标准档案字段编辑 — 技术设计

## 设计版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始设计 |

## 项目架构

- 架构类型: Turborepo + pnpm monorepo
- 涉及层: 后端（packages/api tRPC 路由）、前端（apps/web 表单）、共享校验 schema（packages/api 导出给 web）
- 规范: AGENTS.md（Ultracite），校验统一用 zod（项目已依赖）。

## 功能模块设计

### 模块 1: 共享校验 schema

`packages/api/src/github/profile-schema.ts`：

```ts
export const editableProfileSchema = z.object({
  name: z.string().max(255),
  email: z.union([z.literal(""), z.email()]),
  bio: z.string().max(160),
  blog: z.union([z.literal(""), z.url({ protocol: /^https?$/ })]),
  company: z.string().max(255),
  location: z.string().max(255),
  twitter_username: z.string().regex(/^\w{0,15}$/),   // 前端提交前去掉前导 @
});
export const updateProfileInput = editableProfileSchema.partial().strict();
export type EditableProfile = z.infer<typeof editableProfileSchema>;
```

前端与服务端共用，保证校验一致；`.strict()` 拒绝 `login` 等未知字段。正则写为模块顶层常量。

### 模块 2: 服务端过程

`routers/github.ts` 新增：

- `github.updateProfile`（mutation, githubProcedure）：入参 `updateProfileInput`；空对象直接返回 `BAD_REQUEST`；调用 `githubRequest('PATCH', '/user', body)`；GitHub 422 映射 `BAD_REQUEST` + message `GITHUB_VALIDATION_FAILED`（附 GitHub errors 字段名）；返回 `{ profile, rateLimit, latencyMs }`。
- `github.listEmails`（query, githubProcedure）：`GET /user/emails`，过滤 `verified`，返回 `{ email, primary, visibility }[]`；403/404 时返回 `{ available: false }` 而非抛错，便于前端降级。

### 模块 3: 前端表单状态

重写 `hooks/use-profile-form.ts`：

- `baseline` 来自 `["github-session"]` 的 `profile`（映射为 `EditableProfile` + login，null → ""）。
- 同步结果变化时：若 `!dirty` 直接重置草稿；若 dirty，暴露 `pendingBaseline`，由页面弹确认（复用 toast + 按钮或 `confirm` 组件）。
- `errors = editableProfileSchema.safeParse(draft)` 派生字段级错误。
- `changedKeys` = 与 baseline 不同的 key 列表；`dirty = changedKeys.length > 0`。
- `diff()` 返回只含变更字段的对象（twitter 去 `@`）。
- `commit(profile)` 用服务端返回值更新 baseline 与草稿。

### 模块 4: 表单 UI

- `StandardProfilePanel` 新增 props：`errors`、`changedKeys`、`emailOptions`；`Field` 显示错误文案（`aria-invalid` + `aria-describedby`）与「已修改」小圆点。
- Public Email：`<input list>` + `<datalist>`（已验证邮箱），满足「下拉或手动」，无需新组件。
- Bio 下方显示字数 `n/160`。
- 保存触发入口仍是 6. 的全局 Save（表单 submit 调同一 handler）。本 feature 提供 `useSaveProfile()`：`useMutation(trpc.github.updateProfile)`，成功 → `commit` + 更新 `["github-session"]`；403 → 权限提示。

## 接口契约

| 过程                   | 类型     | 入参                              | 出参                                | 错误                                          |
| ---------------------- | -------- | --------------------------------- | ----------------------------------- | --------------------------------------------- |
| `github.updateProfile` | mutation | `Partial<EditableProfile>`（≥1 键） | `{ profile, rateLimit, latencyMs }` | BAD_REQUEST / UNAUTHORIZED / FORBIDDEN / TOO_MANY_REQUESTS |
| `github.listEmails`    | query    | 无                                | `{ available: boolean; emails: {email,primary,visibility}[] }` | UNAUTHORIZED |

## 数据模型

无数据库变更。

## 安全考虑

- 服务端字段白名单（`.strict()`），不可修改 login。
- Blog 仅允许 http(s)，防 `javascript:` 注入；Bio 以纯文本渲染。
- 不在客户端假设权限：以 PATCH 实际 403 为准（fine-grained token 无 scopes 头）。

## 技术决策

| 决策         | 选项                                 | 理由                                         |
| ------------ | ------------------------------------ | -------------------------------------------- |
| 表单库       | 自定义 hook / @tanstack/react-form   | 沿用现有 `use-profile-form` hook，字段少，改动最小 |
| 邮箱下拉     | datalist / 自定义 Combobox           | datalist 原生可访问，同时支持手动录入         |
| 提交内容     | 全量 / diff                          | diff：减少误覆盖，满足「按需调用」            |
