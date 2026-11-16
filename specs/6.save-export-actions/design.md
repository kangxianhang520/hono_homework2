# 底部全局操作与导出 — 技术设计

## 设计版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始设计 |

## 项目架构

- 架构类型: Turborepo + pnpm monorepo
- 涉及层: 前端（apps/web `features/profile-manager`）、E2E 测试（apps/web/e2e）
- 规范: AGENTS.md（Ultracite）。

## 功能模块设计

### 模块 1: 导出

重写 `lib/export-config.ts`：

```ts
export interface ExportInput {
  session: GithubSession;              // 1. 同步结果
  token: string | null;                // 仅用于 maskToken
  draftProfile: EditableProfile & { login: string };
  profileDirty: boolean;
  fields: readonly CustomField[];
}
export function buildConfig(input: ExportInput): GitHubUserProfileConfig;
export function exportFilename(login: string, now: Date): string;
export function downloadJson(data: unknown, filename: string): void;   // 保留现有实现，revokeObjectURL 延后到下一 tick
```

- `GitHubUserProfileConfig` 类型按 PRD Schema 手写（snake_case），字段映射：`rateLimit.resetEpoch → reset_epoch`；profile 字段空字符串 → 省略（Schema 中 email 有 format 约束，空串不合法）。
- Secret value → `"********"`。
- 测试中用 `ajv`（devDependency）对 PRD Schema 校验输出。

### 模块 2: 工作区状态聚合

新建 `hooks/use-workspace.ts`，聚合 3. 与 5.：

```ts
{
  dirtyCount: number;          // profile changedKeys.length + 打开的编辑行数
  canSave: boolean;            // dirtyCount > 0 && 无表单错误 && 已同步
  save(): Promise<SaveResult>;
  reset(): void;
  exportJson(): void;
}
```

- 编辑行状态从 5. 的 `CustomFieldsPanel` 上移为 `useFieldDrafts()`（`Map<id | "new", Draft>`）供面板与工作区共享——在本 feature 中完成这次上移重构。
- `save()`：
  1. 表单错误 → 聚焦首个 `aria-invalid` 元素，返回。
  2. `Promise.allSettled([profileDirty && saveProfile(diff), ...drafts.map(submitDraft)])`。
  3. 汇总结果：全成功 → 成功 toast；有失败 → 错误 toast 列出失败项（如「Profile: 权限不足」「Tech_Stack: 字段名已存在」），成功项的 draft 清除。
- `reset()`：`profileForm.reset()` + `fieldDrafts.clear()`。

### 模块 3: 操作栏与页面装配

- `ActionBar` props 改为 `{ dirtyCount, canSave, canExport, saving, onReset, onExport, onSave }`，按钮禁用态与状态文案按 F-006。
- `ProfileManagerPage` 改用 `useWorkspace`，删除 `useTimedAction` 假保存与 `handleClearCache` 中 resetFields 逻辑（Clear Cache 归 1.）。
- `useBeforeUnload(dirtyCount > 0)`：注册/注销 `beforeunload` 监听。

### 模块 4: E2E

- apps/web 新增 Playwright（`playwright.config.ts`，webServer 启动 `pnpm dev`）。
- GitHub 不可在 CI 真实访问：E2E 通过 `page.route('**/trpc/**')` 拦截 tRPC 批量请求返回固定数据（或在 server 侧以 `GITHUB_API_BASE_URL` 指向本地 mock——优先前者，零后端改动）。
- 用例：同步 → 编辑 Display Name → 新增 Tags 字段 → 编辑字段 → 删除字段 → 保存（断言 toast、dirty 消失）→ 导出（`page.waitForEvent('download')`，解析 JSON 断言结构与无明文 Secret/PAT）。

## 接口契约

无新增后端接口；消费 `github.updateProfile`、`customField.*`。

## 数据模型

导出 JSON 结构 = PRD 第 5 节 `GitHubUserProfileConfig` + `exported_at`、`profile_dirty`。

## 安全考虑

- 导出只含 `token_masked`；Secret 以占位符导出。
- `downloadJson` 使用 Blob URL，下载后释放。

## 技术决策

| 决策               | 选项                                       | 理由                                                     |
| ------------------ | ------------------------------------------ | -------------------------------------------------------- |
| 自定义字段保存时机 | 每次操作即时持久化 / Save 时批量提交       | 即时持久化 + Save 提交未完成编辑行：契合乐观 UI 与「自动持久化」现有文案 |
| 部分失败处理       | 全部回滚 / 保留成功部分                    | 保留成功部分：GitHub 与 DB 无法跨系统事务                 |
| E2E mock 方式      | 拦截 tRPC / mock GitHub 服务器             | 拦截 tRPC：无需改后端，稳定快速                           |
| Schema 校验库      | ajv / 手写                                 | ajv：直接使用 PRD 的 JSON Schema 原文                     |
