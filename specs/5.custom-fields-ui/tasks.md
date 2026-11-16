# 自定义字段前端管理 — 任务清单

## 任务版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始任务 |

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo
- specs 路径: specs/5.custom-fields-ui/

## 任务列表

### 功能 1: 数据接入

- [ ] T-001: types 改用共享 schema（含 Secret）、FIELD_TYPE_LABELS 补 Secret，删除 localStorage 与 INITIAL_CUSTOM_FIELDS ~15min
- [ ] T-002: 重写 use-custom-fields：list query（enabled by session）+ create/update/delete 乐观更新与回滚 toast ~30min

### 功能 2: 类型化输入与展示

- [ ] T-003: `tags-input.tsx`（Enter/逗号分词、Backspace、× 删除、去重）+ `field-value-input.tsx` 类型分发与切换类型值转换 ~30min
- [ ] T-004: FieldValueCell 增加 Number 千分位、Secret 掩码 + SecretReveal（revealSecret、10s 自动隐藏） ~30min

### 功能 3: 行内编辑

- [ ] T-005: CustomFieldEditRow（create/edit 模式、schema 校验 + key 预检、Enter/Esc），行双击/Enter/编辑按钮进入编辑 ~30min
- [ ] T-006: CustomFieldsPanel：底部追加空白行替换 AddFieldCard、Skeleton/禁用/错误态、计数与页脚文案 ~30min

### 集成与测试

- [ ] T-007: 组件测试（Vitest + Testing Library）：TagsInput 分词、EditRow 校验与重复 key、乐观回滚（mock tRPC 失败） ~30min

## 依赖关系

- T-001 依赖 4.T-004
- T-002 依赖 T-001、4.T-006、1.T-005
- T-003 依赖 T-001
- T-004 依赖 T-001、4.T-005
- T-005 依赖 T-003
- T-006 依赖 T-002、T-005
- T-007 依赖 T-006、2.T-006（apps/web Vitest 配置）

## 风险点

- 乐观插入的 temp id 若被用户立即编辑/删除，需等真实 id 回来再发请求（禁用 temp 行的操作按钮）。
- 双击进入编辑与文本选择冲突：编辑态进入时 `window.getSelection()?.removeAllRanges()`。
- Testing Library 需新增依赖 `@testing-library/react`、`jsdom`。
