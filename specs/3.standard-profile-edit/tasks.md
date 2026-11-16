# 标准档案字段编辑 — 任务清单

## 任务版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始任务 |

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo
- specs 路径: specs/3.standard-profile-edit/

## 任务列表

### 功能 1: 服务端回写

- [ ] T-001: `github/profile-schema.ts` 共享 zod schema（editableProfileSchema / updateProfileInput.strict） ~15min
- [ ] T-002: `github.updateProfile` mutation（diff 入参、空对象拒绝、422→BAD_REQUEST 映射） ~30min
- [ ] T-003: `github.listEmails` query（过滤 verified，无权限降级 available:false） ~15min

### 功能 2: 前端表单

- [ ] T-004: 重写 `use-profile-form`：基线来自同步缓存、changedKeys/dirty/diff/errors、再同步时 dirty 冲突处理 ~30min
- [ ] T-005: StandardProfilePanel 内联错误（aria-invalid）、字段修改标记、Bio 字数、Email datalist ~30min
- [ ] T-006: `useSaveProfile` mutation：成功更新基线与 `["github-session"]`，403 权限提示，422 错误展示 ~15min

### 集成与测试

- [ ] T-007: 单测：profile-schema 边界（URL 协议、twitter 正则、bio 长度）、updateProfile（mock fetch：200/403/422、body 仅含 diff） ~30min

## 依赖关系

- T-001 依赖 1.T-003
- T-002、T-003 依赖 T-001、1.T-002
- T-004 依赖 T-001、1.T-005
- T-005 依赖 T-004、T-003
- T-006 依赖 T-002、T-004
- T-007 依赖 T-002、1.T-007（Vitest 配置）

## 风险点

- GitHub `PATCH /user` 设置 email 需该邮箱已验证且非隐私模式，否则 422 —— 前端提示文案需明确。
- 再次同步覆盖未保存草稿属于破坏性操作，必须二次确认。
- zod 版本差异（v3 `z.string().email()` vs v4 `z.email()`）：按 catalog 中实际版本书写。
