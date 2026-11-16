---
description: 后端 API 规范 - Hono 服务端 + tRPC 路由 + Better Auth 认证的分层、鉴权、校验与错误处理约定
globs:
  - apps/server/**
  - packages/api/**
  - packages/auth/**
---

# Backend API 规范

## 分层与目录职责

| 位置 | 职责 |
| --- | --- |
| `apps/server/src/index.ts` | Hono 应用入口:中间件(logger、cors)、挂载 `/api/auth/*` 与 `/trpc/*`、`@hono/node-server` 启动 |
| `apps/server/src/services.ts` | 唯一的服务实例化处:`createDb(ENV)`、`createAuth(ENV, db)` |
| `apps/server/src/context.ts` | 每请求构建 tRPC context(`{ db, session }`) |
| `apps/server/src/env.server.ts` | 运行时环境变量入口(`varlock/auto-load`),业务代码只从这里 import `ENV` |
| `packages/api/src/index.ts` | `initTRPC`、`router`、`publicProcedure`、`protectedProcedure` 定义 |
| `packages/api/src/context.ts` | `Context` 类型(与 server 实现解耦,只依赖类型) |
| `packages/api/src/routers/*.ts` | 按领域拆分的子 router,在 `routers/index.ts` 汇总为 `appRouter` |
| `packages/auth/src/index.ts` | Better Auth 工厂 `createAuth(env, db)`,导出 `Session` 类型 |

- 业务逻辑写在 `packages/api`,不要写进 `apps/server`;server 只做装配和传输层。
- `packages/api` / `packages/auth` 不得直接读取 `process.env` 或 import `apps/server`;依赖通过参数/context 注入(工厂函数 + `Context`)。
- 不要在 router 中自行 `createDb()` / `createAuth()`,一律用 `ctx.db`、`ctx.session`。

## tRPC 路由约定

- 新领域新建 `packages/api/src/routers/<domain>.ts`,导出 `<domain>Router = router({...})`,并在 `routers/index.ts` 的 `appRouter` 中以 `<domain>: <domain>Router` 注册。
- 读操作用 `.query`,写操作用 `.mutation`;procedure 名用动词驼峰(`getAll`、`getById`、`create`、`update`、`delete`、`toggle`)。
- 保留 `export type AppRouter = typeof appRouter`,前端 `apps/web/src/utils/trpc.ts` 依赖它做端到端类型推断;不要为前端手写重复的类型。
- 当前未配置 transformer(无 superjson):返回值必须可 JSON 序列化,`Date` 在客户端会是字符串,`bigint`/`Map`/`Set` 不可直接返回。如需引入 transformer,必须同时改 server `initTRPC` 与 web `httpBatchLink`。
- 子 router 内 import 使用相对路径 `../index` 获取 `router` / procedure;跨包使用 `@hono_homework_2/*` 别名(如 `@hono_homework_2/db/schema/todo`)。

## 鉴权

- 涉及用户数据或任何写操作的 procedure 必须使用 `protectedProcedure`,其中 `ctx.session` 已收窄为非空,用 `ctx.session.user.id` 做归属过滤。
- 只有健康检查、公开只读数据才使用 `publicProcedure`。(现有 `todoRouter` 全部为 public 属于脚手架示例,新增业务不要沿用。)
- 资源级权限:更新/删除时在 `where` 中同时匹配资源 id 与 `userId`(`and(eq(t.id, input.id), eq(t.userId, ctx.session.user.id))`),不要先查后判断再写。
- 认证路由由 Better Auth 处理:`app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))`,不要手写登录/注册/会话接口。
- Better Auth 配置变更(插件、字段)只改 `packages/auth/src/index.ts`,随后运行 `pnpm --filter server auth:generate` 重新生成 `packages/db/src/schema/auth.ts`,禁止手改该生成文件。
- 跨域 cookie 依赖 `sameSite: "none"` + `secure: true` 与 `trustedOrigins: [CORS_ORIGIN]`;新增前端来源时同步更新 `CORS_ORIGIN` / `trustedOrigins`,不要放宽为 `*`。

## 输入校验

- 所有带参数的 procedure 必须用 `.input(z.object({...}))`(zod,`catalog:` 版本)校验,不要信任客户端数据。
- 字符串加约束(`.min(1)`、`.max(n)`、`.trim()`),id 用 `z.number().int().positive()` 或与 schema 主键类型一致的校验。
- 可复用的 schema 抽成模块顶层常量,避免在 procedure 中内联重复定义。

## 错误处理

- 业务错误抛 `TRPCError`,使用语义化 code:`UNAUTHORIZED`(未登录)、`FORBIDDEN`(无权限)、`NOT_FOUND`、`BAD_REQUEST`、`CONFLICT`、`INTERNAL_SERVER_ERROR`;`message` 写清楚原因,不要抛字符串或裸 `Error`。
- 更新/删除未命中行时(如 `.returning()` 结果为空)抛 `NOT_FOUND`,不要静默成功。
- 不要为了重新抛出而 `try/catch`;只在需要转换错误(如唯一约束冲突 → `CONFLICT`)时捕获。
- 不向客户端泄露数据库错误细节、堆栈或密钥。

## 数据访问

- 通过 `ctx.db`(Drizzle,AWS RDS / Aurora PostgreSQL)访问数据库;表定义从 `@hono_homework_2/db/schema/<table>` 导入,条件构造用 `drizzle-orm` 的 `eq`/`and` 等。
- 所有异步调用必须 `await`;写操作需要回传数据时使用 `.returning()`,只返回前端需要的字段。
- 多步写操作使用 `ctx.db.transaction(async (tx) => ...)` 保证原子性。
- 列表查询考虑分页(`limit`/`offset` 或游标)与排序,避免无界 `select()`。
- schema 变更遵循 database 规则(`packages/db`),不在 api 包中写 DDL。

## Hono 服务端

- 全局中间件顺序:`logger()` → `cors()` → 路由;新增中间件(限流、安全头等)放在路由挂载之前。
- CORS 的 `origin` 只来自 `ENV.CORS_ORIGIN`,保持 `credentials: true`;新增需要的 method/header 时显式加入 `allowMethods` / `allowHeaders`。
- 优先通过 tRPC 暴露业务接口;仅在 webhook、文件流、第三方回调等 tRPC 不适合的场景下,才在 `index.ts` 中添加原生 Hono 路由,并对其自行做鉴权(`auth.api.getSession({ headers: c.req.raw.headers })`)与 zod 校验。
- 除启动日志外不要在业务代码中留 `console.log`。

## 环境变量

- 新变量先加到 `apps/server/.env.schema`(带 `@type`,敏感值默认 `@sensitive`),再运行 `pnpm --filter server env:generate` 重新生成 `src/env.ts`;禁止手改 `env.ts`。
- 包内需要的配置以类型(如 `AuthConfig`)声明,由 server 传入 `ENV`,不要在共享包内读环境变量。
- 不要提交 `.env` 中的真实密钥。

## 验证

- 修改后运行 `pnpm check-types` 与 `pnpm check`(Ultracite/Biome),必要时 `pnpm exec ultracite fix`。
- 本地联调:`pnpm dev`(server 默认 `http://localhost:3000`,tRPC 端点 `/trpc`,健康检查 `GET /` 与 `healthCheck` procedure)。
