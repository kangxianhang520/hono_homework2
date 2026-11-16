---
description: Drizzle ORM (1.0 RC) + AWS RDS / Aurora PostgreSQL 的 schema、relations、migration 与查询规范(packages/db)
globs:
  - "packages/db/**"
  - "packages/api/src/**"
  - "packages/auth/src/**"
---

# 数据库规范(Drizzle ORM + AWS RDS / Aurora PostgreSQL)

## 包结构与职责

- 数据库代码全部放在 `packages/db`(包名 `@hono_homework_2/db`),别处不要直接创建连接。
  - `src/index.ts`:`createDb(env)` 工厂,类型是 `Database`。
  - `src/schema/*.ts`:按领域拆分表定义(`auth.ts`、`todo.ts` ...),由 `src/schema/index.ts` 汇总导出(drizzle-kit 读的是这个入口)。
  - `src/relations.ts`:用 `defineRelations(schema)` 合并全部关系,再展开各领域的 `defineRelationsPart`(例如 `authRelations`)。
  - `src/migrations/`:drizzle-kit 生成的迁移文件,不要手写或手改。
  - `src/env.ts`:varlock 自动生成,**禁止手改**;要改变量就改 `.env.schema`。
- 使用方通过子路径导入:`@hono_homework_2/db/schema/<domain>`;要类型就 `import type { Database } from "@hono_homework_2/db"`。
- 连接实例只在 `apps/server/src/services.ts` 里用 `createDb(ENV)` 创建一次,再经 tRPC context(`ctx.db`)和 `createAuth(ENV, db)` 注入。业务代码不要自己 `createDb`。

## Schema 定义

- 统一用 `drizzle-orm/pg-core`(`pgTable`、`text`、`timestamp`、`boolean`、`index` ...),dialect 为 `postgresql`,只用 `public` schema(`schemaFilter: ["public"]`)。
- 命名:TS 属性用 camelCase,数据库列名显式写 snake_case,例如 `createdAt: timestamp("created_at")`;表名用单数小写(`user`、`session`、`todo`)。
- 新增业务表应包含 `createdAt: timestamp("created_at").defaultNow().notNull()` 和 `updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull()`。
- 主键:和用户关联的实体与 Better Auth 保持一致,用 `text("id").primaryKey()`;现有 `todo` 用的是 `serial`,改它要先评估迁移影响。
- 外键必须写 `.references(() => user.id, { onDelete: "cascade" | "set null" })`,并在第三个参数里给外键列建索引:`(t) => [index("<table>_<col>_idx").on(t.col)]`。
- 按用户隔离的数据要有 `userId` 外键列,所有查询都必须按 `ctx.session.user.id` 过滤。
- 每个新 schema 文件都要加进 `src/schema/index.ts` 的导出;如果需要关系查询,还要在 `relations.ts` 合并对应的 relations part。

## Better Auth 表

- `schema/auth.ts` 里的 `user/session/account/verification` 由 Better Auth 约定生成。不要随意改字段名或删字段;需要扩展时,先改 Better Auth 配置(`additionalFields` / 插件),再重新生成 schema,保持两边一致。

## Relations(Drizzle v1 RQB v2)

- 用 `defineRelations` / `defineRelationsPart` 的 `r.one.x({ from, to })` / `r.many.x({ from, to })` 写法,**不要**用旧版 `relations()` API。
- 关系查询用 `db.query.<table>.findMany({ with, where })`(v2 对象式 where);简单的 CRUD 用 `db.select/insert/update/delete`。

## 迁移流程

- 命令(在仓库根目录执行,由 turbo 转发到 db 包):
  - `pnpm db:generate`:schema 改动后生成迁移 SQL(会提交进 git)。
  - `pnpm db:migrate`:应用迁移(开发和生产都走这个)。
  - `pnpm db:push`:只用于本地快速原型,不能对共享或生产库用。
  - `pnpm db:studio`:可视化查看数据。
- schema 每次变更都必须带上生成的迁移文件一起提交;不要删除或修改已经应用过的迁移。
- 破坏性变更(删列、改类型、加 NOT NULL)分两步做:先加可空列或新列并回填数据,再收紧约束。
- drizzle-kit 版本锁定为 `1.0.0-rc.5`,升级前先确认 migrations 格式兼容。

## 连接与环境变量

- 运行时驱动:`pg`(node-postgres 连接池 `Pool`)+ `drizzle-orm/node-postgres`,数据库为 AWS RDS / Aurora PostgreSQL。
- `DATABASE_URL` 给运行时用(可指向 RDS Proxy 或 Aurora writer endpoint);`DATABASE_URL_DIRECT`(直连实例/writer endpoint)适合迁移这类 DDL 场景。两个都是 sensitive 变量,由 varlock 管理(`packages/db/.env.schema` 从 `apps/server/.env.schema` 导入 `DATABASE_*`)。
- 不要提交 `.env`,不要在日志或错误信息里打印连接串;代码里不要直接读 `process.env`,应通过 `ENV` 或注入的配置拿值(`drizzle.config.ts` 除外)。

## 查询规范

- node-postgres 支持交互式事务:多条写操作需要原子性时用 `db.transaction(async (tx) => ...)`,事务内只做数据库操作,不要调用 GitHub 等外部 API,避免长时间占用连接。
- 只选需要的列(`db.select({ id: t.id, ... })`),列表查询必须加 `limit` / 分页,避免全表拉取与连接池占用。
- 所有过滤条件都用 `eq/and/inArray` 等运算符或 `sql` 模板的参数化写法;**禁止**把用户输入拼接进 `sql.raw`。
- 输入先用 zod 在 tRPC procedure 里校验,再写库;写操作需要返回数据时用 `.returning()`。
- update/delete 必须带 `where`,资源归属用户时同时校验 `userId`,防止越权。
- 常用的过滤或排序列要建索引;同一个请求里不要循环查库(N+1),改用 `inArray` 或关系查询。

## 校验

- 改动后执行 `pnpm check-types` 和 `pnpm check`(Ultracite/Biome),schema 有变更时还要确认 `pnpm db:generate` 生成的迁移内容符合预期。
