# 自定义字段后端存储 — 技术设计

## 设计版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始设计 |

## 项目架构

- 架构类型: Turborepo + pnpm monorepo
- 涉及层: 数据库（packages/db）、后端（packages/api、apps/server env）
- 规范: AGENTS.md；数据库沿用 `packages/db/src/schema/*.ts` + `schema/index.ts` 汇总导出的现有约定（snake_case 列名）。

## 功能模块设计

### 模块 1: 数据模型与迁移（packages/db）

`packages/db/src/schema/custom-field.ts`：

```ts
export const customFieldType = pgEnum("custom_field_type", ["Text", "Tags", "URL", "Number", "Secret"]);

export const customField = pgTable("custom_field", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubLogin: text("github_login").notNull(),
  key: text("key").notNull(),
  type: customFieldType("type").notNull(),
  value: jsonb("value").$type<CustomFieldStoredValue>().notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex("custom_field_login_key_uq").on(t.githubLogin, t.key),
  index("custom_field_login_position_idx").on(t.githubLogin, t.position),
]);
```

- `CustomFieldStoredValue = string | number | string[] | { iv: string; tag: string; ct: string }`（Secret 密文结构）。
- `github_login` 存小写（GitHub login 大小写不敏感）。
- 在 `schema/index.ts` 导出，`pnpm db:generate` 产出迁移文件提交。

### 模块 2: 共享值 schema（packages/api）

`packages/api/src/custom-fields/schema.ts`（前端 5. 复用）：

```ts
export const FIELD_TYPES = ["Text", "Tags", "URL", "Number", "Secret"] as const;
export const fieldKeySchema = z.string().trim().min(1).max(64);
export const customFieldInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Text"),   value: z.string().min(1).max(1000) }),
  z.object({ type: z.literal("Tags"),   value: z.array(z.string().trim().min(1).max(50)).min(1).max(30) }),
  z.object({ type: z.literal("URL"),    value: z.url({ protocol: /^https?$/ }) }),
  z.object({ type: z.literal("Number"), value: z.number().finite() }),
  z.object({ type: z.literal("Secret"), value: z.string().min(1).max(1000) }),
]).and(z.object({ key: fieldKeySchema }));
```

Tags 在 transform 中去重。输出类型 `CustomFieldDTO = { id, key, type, value, hasValue?, position, updatedAt }`（Secret 的 value 为 `"••••••••"`）。

### 模块 3: 账号鉴别中间件

`packages/api/src/github/identity.ts`：

- `resolveLogin(token)`：key = `sha256(token)`（不保存明文），内存 `Map<hash, { login, expiresAt }>`，TTL 5 分钟，上限 500 条（超出删最早）。未命中时 `githubRequest(token, "/user")`。
- `githubUserProcedure = githubProcedure.use(...)`：把 `ctx.githubLogin`（小写）注入 context。
- 1. 的 `github.sync` 成功后顺带写缓存（可选优化）。

### 模块 4: Secret 加密

`packages/api/src/custom-fields/crypto.ts`：`encryptSecret(plain, key)` / `decryptSecret(blob, key)`，AES-256-GCM，随机 12 字节 IV，base64 编码。密钥：

- `apps/server/.env.schema` 新增 `CUSTOM_FIELD_SECRET_KEY`（`@type=string(minLength=44)`，base64 的 32 字节），`pnpm env:generate`。
- `apps/server/src/context.ts` 把密钥注入 api context（`ctx.secretKey`），packages/api 不直接读 env（遵循 README「shared packages 接收配置」约定）。

### 模块 5: tRPC customField 路由

`packages/api/src/routers/custom-field.ts`，全部基于 `githubUserProcedure`，查询均带 `where githubLogin = ctx.githubLogin`：

- `list` → 按 position 排序，Secret 掩码。
- `revealSecret({ id })` → 解密返回。
- `create(customFieldInputSchema)` → `insert ... position = (select coalesce(max(position), -1) + 1 from custom_field where github_login = $1)`；捕获唯一约束错误（PG code `23505`）→ `CONFLICT`。
- `update({ id, key?, type?, value? })` → 若含 type 或 value，需二者组合后按 schema 整体校验（只改 type 不给 value → BAD_REQUEST）；Secret 重新加密；0 行受影响 → NOT_FOUND。
- `delete({ id })` → 0 行 → NOT_FOUND。

挂载到 `appRouter.customField`。

## 接口契约

| 过程                        | 类型     | 入参                                   | 出参                 | 错误                               |
| --------------------------- | -------- | -------------------------------------- | -------------------- | ---------------------------------- |
| `customField.list`          | query    | -                                      | `CustomFieldDTO[]`   | UNAUTHORIZED                       |
| `customField.revealSecret`  | query    | `{ id: uuid }`                         | `{ value: string }`  | NOT_FOUND / BAD_REQUEST(非 Secret) |
| `customField.create`        | mutation | `{ key, type, value }`                 | `CustomFieldDTO`     | BAD_REQUEST / CONFLICT             |
| `customField.update`        | mutation | `{ id, key?, type?, value? }`          | `CustomFieldDTO`     | BAD_REQUEST / CONFLICT / NOT_FOUND |
| `customField.delete`        | mutation | `{ id }`                               | `{ id }`             | NOT_FOUND                          |

## 数据模型

见模块 1。索引：`(github_login, key)` 唯一、`(github_login, position)` 普通索引。

## 安全考虑

- 行级隔离：所有 SQL 带 login 条件，login 来自服务端 GitHub 校验而非客户端输入。
- Token 缓存只存 sha256 哈希。
- Secret 加密存储，list 不返回明文；密钥仅在 server env。
- 不信任客户端 position/id，id 由数据库生成。

## 技术决策

| 决策         | 选项                                     | 理由                                              |
| ------------ | ---------------------------------------- | ------------------------------------------------- |
| 用户身份     | better-auth 登录 / PAT 解析 login        | PAT 解析（2026-11-14 确认），无需额外登录流程       |
| value 存储   | text / jsonb                             | jsonb：原生保存 number 与 string[]，导出无需再解析 |
| login 缓存   | 内存 Map / Redis / DB                    | 内存：单实例足够，无新增基础设施                   |
| Secret 存储  | 明文 / AES-GCM                           | AES-GCM：满足 PRD「脱敏存储」                     |
