# 底部全局操作与导出 — 任务清单

## 任务版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始任务 |

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo
- specs 路径: specs/6.save-export-actions/

## 任务列表

### 功能 1: 导出

- [ ] T-001: 重写 `export-config.ts`：按 PRD Schema 构建（snake_case、Secret 占位、token_masked、profile_dirty）、exportFilename ~30min

### 功能 2: 保存与重置

- [ ] T-002: 编辑行草稿状态上移为 `useFieldDrafts`，面板改为消费共享状态 ~30min
- [ ] T-003: `use-workspace`：dirtyCount/canSave、save（错误聚焦、allSettled、部分失败汇总 toast）、reset、exportJson ~30min
- [ ] T-004: ActionBar 禁用态与状态文案、顶栏导出复用、`useBeforeUnload`，页面去除假保存逻辑 ~15min

### 集成与测试

- [ ] T-005: 单测：buildConfig 用 ajv 校验 PRD Schema、无 PAT/Secret 明文；use-workspace 部分失败分支 ~30min
- [ ] T-006: Playwright 配置 + E2E 主流程（拦截 tRPC：同步→编辑→字段增改删→保存→导出下载断言） ~30min

## 依赖关系

- T-001 依赖 1.T-005、5.T-001
- T-002 依赖 5.T-006
- T-003 依赖 T-001、T-002、3.T-006
- T-004 依赖 T-003
- T-005 依赖 T-003、2.T-006（apps/web Vitest 配置）
- T-006 依赖 T-004

## 风险点

- T-002 是对 5. 产物的重构，若 5. 已把草稿状态放在面板内部，需同步更新 5. 的组件测试。
- tRPC httpBatchLink 批量请求的拦截需按批量响应格式（数组）构造 mock，建议封装 helper。
- Safari 对 `a.download` + 立即 `revokeObjectURL` 可能下载失败，需延迟释放。
