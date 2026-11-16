---
description: 测试与验证规范：当前以类型检查 + Ultracite 作为质量门禁，新增测试统一采用 Vitest（前端 + Testing Library，后端 Hono app.request / tRPC createCaller），E2E 用 Playwright
globs: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "**/vitest.config.*", "**/playwright.config.*", "e2e/**"]
---

# Testing 规范

## 现状（以实际配置为准）

- 仓库当前**没有任何测试框架和测试文件**；根 `package.json` 没有 `test` 脚本，`turbo.json` 也没有 `test` task。
- 现阶段的质量门禁是：
  - `pnpm check-types`：turbo 跑各包 `tsc --noEmit`（web 会先 `vite build` 再跑 tsc）
  - `pnpm check`：`ultracite check`（Biome）
- 每个 task 完成前必须两条都通过；有格式问题先跑 `pnpm fix`。

## 引入测试框架（第一次加测试时）

- 统一用 **Vitest**（和 Vite 同源，web 能复用 `vite.config`）。不要引入 Jest。
- 装在需要测试的包里（`pnpm add -D vitest -F <pkg>`），给包加 `"test": "vitest run"`。
- 在 `turbo.json` 加 `test` task（`dependsOn: ["^build"]` 不需要，因为共享包直接导出源码；设 `outputs: []`），根 `package.json` 加 `"test": "turbo run test"`。
- 前端组件测试：`@testing-library/react` + `@testing-library/user-event` + `jsdom`（或 `happy-dom`），只在 `apps/web` / `packages/ui` 用。
- E2E：用 **Playwright**，单独放在 `apps/web/e2e/`，不进单元测试流水线。
- 测试代码同样要过 Ultracite：断言写在 `it()`/`test()` 里，禁止提交 `.only` / `.skip`，用 async/await 不用 done 回调，`describe` 嵌套保持扁平。

## 文件位置与命名

- 测试文件和被测文件放一起：`foo.ts` → `foo.test.ts`，组件 `Foo.tsx` → `Foo.test.tsx`。
- E2E 用 `*.spec.ts`，放 `apps/web/e2e/`。
- 不要建 `__tests__` 大目录，也不要建 barrel 形式的测试工具 index 文件。

## 按模块的测试方法

### backend（`apps/server`、`packages/api`、`packages/auth`）

- **Hono 路由**：直接调 `app.request("/path", init)` 断言 status/body，不起真实端口，不用 `@hono/node-server`。
- **tRPC procedure**（`packages/api/src/routers`）：用 `appRouter.createCaller(ctx)` 调用，手动构造 context（session 有/无两种），覆盖：
  - `publicProcedure` 正常返回
  - `protectedProcedure` 无 session 时抛 `TRPCError`（`UNAUTHORIZED`）
  - zod 输入校验失败（`BAD_REQUEST`）
- **Better Auth**：不测框架本身；只测我们自己的配置/钩子和依赖 session 的业务逻辑，session 通过 context 注入 mock。
- 环境变量走 varlock：测试需要的变量用测试专用 env 提供，**不要**在测试里写真实密钥，也不要读生产 `.env`。

### database（`packages/db`）

- 单元测试**不连真实 RDS / Aurora 数据库**。需要 DB 的逻辑优先抽成纯函数测试，或 mock `db` 实例。
- 确实需要集成测试时，使用本地 Postgres（如 Docker）或独立的测试用 RDS 实例，用专门的 `DATABASE_URL`；绝不对 main 分支/生产库跑测试。
- schema 变更（`src/schema`）必须配套 `pnpm db:generate` 生成的 migration，并检查生成的 SQL；不要手改已提交的 migration。
- 集成测试自己准备和清理数据（每个用例独立，不依赖执行顺序）。

### frontend（`apps/web`、`packages/ui`）

- 组件测试用 Testing Library，按可访问性查询（`getByRole`/`getByLabelText`），不要用 class 选择器或 test-id 兜底。
- 需要 TanStack Query 的组件，每个测试新建 `QueryClient`（关闭 retry），避免缓存串扰。
- tRPC 调用在组件测试里 mock，不打真实后端。
- 路由相关逻辑用 TanStack Router 的内存 history 渲染；不要测试 `routeTree.gen.ts`（生成文件）。
- 表单（TanStack Form + zod）至少覆盖：校验错误提示、提交成功、提交失败（toast/错误态）。

## 编写原则

- 优先测业务逻辑和边界：空值、未登录、权限不足、输入非法、外部服务失败。
- 一个测试只验证一个行为，名字描述行为（`"returns 401 when session is missing"`）。
- 不提交 `console.log`；不依赖真实时间/随机数（用 `vi.useFakeTimers()` / 注入）。
- 不用 snapshot 代替明确断言，除非是稳定的纯展示输出。
- 测试中 mock 用 `vi.fn()` / `vi.mock()`，在 `afterEach` 里 `vi.restoreAllMocks()`。

## 提交前检查

```bash
pnpm check-types   # 类型检查（当前主门禁）
pnpm check         # Ultracite / Biome
pnpm test          # 引入 Vitest 并配置 turbo test task 之后
```
