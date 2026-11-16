# 自定义字段前端管理 — 技术设计

## 设计版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始设计 |

## 项目架构

- 架构类型: Turborepo + pnpm monorepo
- 涉及层: 前端（apps/web `features/profile-manager`，packages/ui console 组件）
- 规范: AGENTS.md（Ultracite）——hooks 依赖完整、组件不内嵌定义、key 用 id、键盘事件配合鼠标事件、语义化按钮。

## 功能模块设计

### 模块 1: 类型与数据 hook

- `types.ts`：`FieldType`、`CustomField` 改为从 `@hono_homework_2/api/custom-fields/schema` 导入（含 Secret，value 为 `string | number | string[]`），删除本地重复定义；`FIELD_TYPE_LABELS` 增加 `Secret: "Secret (加密)"`。
- 重写 `hooks/use-custom-fields.ts`：
  - `useQuery(trpc.customField.list.queryOptions(undefined, { enabled: hasSession }))`
  - 三个 `useMutation`，标准乐观模式：`onMutate` → `cancelQueries` + 快照 + `setQueryData`；`onError` → 回滚 + toast；`onSettled` → `invalidateQueries`。
  - create 乐观行使用 `temp-${crypto.randomUUID()}` id，成功后由 invalidate 替换。
  - 对外：`{ fields, status, addField, updateField, removeField }`。
- 删除 localStorage 逻辑与 `INITIAL_CUSTOM_FIELDS`。

### 模块 2: 类型化输入组件

`components/field-value-input.tsx`：`({ type, value, onChange, id }) => ReactNode` 分发：

- Text/Secret → `TextInput`（Secret 为 `type=password` + reveal 切换）
- Number → `TextInput type="number" inputMode="decimal"`，onChange 转 number
- URL → `TextInput type="url"` + 协议提示
- Tags → `components/tags-input.tsx`：Pill 列表 + 输入框；`Enter`/`,`/`，` 提交 token，`Backspace` 在空输入时删除末尾；去重；每个 Pill 的 × 为 `IconButton`（aria-label）。

切换 Type 时 value 做转换：Tags↔Text 用逗号拼接/拆分；切到 Number 若不可解析则清空。

### 模块 3: 行组件与编辑态

- `CustomFieldRow` 拆为显示态与编辑态：
  - 显示态：`onDoubleClick` 与 `onKeyDown(Enter)` 进入编辑；行末增加编辑 `IconButton`（满足键盘与鼠标双通道）。
  - `CustomFieldEditRow`：Key 输入 + Type `Select` + `FieldValueInput` + ✓/✕；Enter 提交、Esc 取消；用 `customFieldInputSchema.safeParse` + 列表 key 预检生成错误。
- 新增流程：面板内 `draftOpen` 状态，打开时在列表底部渲染 `CustomFieldEditRow mode="create"`；删除 `add-field-card.tsx`。
- `FieldValueCell` 增加 Number 千分位与 Secret 掩码 + `SecretReveal`（调用 `trpcClient.customField.revealSecret.query`，结果只存组件 state，`setTimeout` 10s 清除，卸载时清理）。

### 模块 4: 面板状态

- `CustomFieldsPanel`：status `pending` → 3 行 Skeleton；无 session → 禁用态；错误 → 重试按钮。
- 计数 `fields.length`（不含正在编辑的草稿行）。
- 页脚文案改为「已同步至服务端」。

## 接口契约

消费 4.custom-fields-backend：`customField.list / create / update / delete / revealSecret`。

## 数据模型

前端缓存键：`trpc.customField.list.queryKey()`。

## 安全考虑

- Secret 明文不进入 React Query 缓存与日志，仅组件内短暂存在。
- 外链只渲染 `toSafeUrl` 通过的 http(s) URL，`rel="noopener noreferrer"`。
- 所有输入以纯文本渲染，无 `dangerouslySetInnerHTML`。

## 技术决策

| 决策       | 选项                                 | 理由                                         |
| ---------- | ------------------------------------ | -------------------------------------------- |
| 乐观更新   | setQueryData / useOptimistic         | setQueryData：与 tRPC + React Query 缓存一致，回滚简单 |
| 新增入口   | 顶部卡片 / 底部空白行                | 底部空白行：与 PRD 4.4 描述一致               |
| 编辑模式   | 单元格级 / 行级                      | 行级：Key/Type/Value 联动校验（改 type 需同时校验 value） |
