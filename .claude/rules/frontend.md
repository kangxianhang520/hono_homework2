---
description: apps/web 前端（React 19 + Vite + TanStack Router/Query/Form + tRPC + Tailwind v4 + shadcn/base-ui）开发规范
globs:
  - "apps/web/**/*.{ts,tsx,css}"
  - "packages/ui/**/*.{ts,tsx,css}"
---

# 前端开发规范

## 目录与职责

- `apps/web/src/routes/`：TanStack Router 文件路由，只做路由声明（`createFileRoute`）与 loader，页面主体放到 `features/`。
- `apps/web/src/routeTree.gen.ts`：由 `@tanstack/router-plugin` 自动生成，**禁止手改**，也不要提交手工修改。
- `apps/web/src/features/<feature>/`：按业务功能聚合，内部结构为 `components/`、`hooks/`、`lib/`、`types.ts`、`data.ts`、`<feature>-page.tsx`。
- `apps/web/src/components/`：跨 feature 的应用级组件（`layout/`、`loader.tsx`、`theme-provider.tsx`）。
- `apps/web/src/utils/trpc.ts`：唯一的 `queryClient` / `trpcClient` / `trpc` 实例来源，不要另建客户端。
- `packages/ui/`：共享 UI 包（shadcn 组件 + `components/console/*` 设计系统组件 + `hooks/` + `lib/`），通用、无业务逻辑的组件放这里。

## 导入约定

- 应用内使用 `@/*` 别名（指向 `apps/web/src/*`）。
- 共享 UI 使用子路径导入：`@hono_homework_2/ui/components/button`、`@hono_homework_2/ui/components/console/panel`、`@hono_homework_2/ui/lib/utils`。不要新建 barrel（index.ts 再导出）文件。
- 后端类型只通过 `import type { AppRouter } from "@hono_homework_2/api/routers/index"` 引入，前端不得导入 server/db 运行时代码。
- 仅类型导入使用 `import type`。

## 路由（TanStack Router）

- 新页面在 `routes/` 下新增文件，通过 `createFileRoute("/path")({ component })` 声明；组件从 `@/features/...` 引入。
- Root 路由上下文为 `RouterAppContext { queryClient, trpc }`，loader 中通过 `context.queryClient.ensureQueryData(context.trpc.xxx.queryOptions())` 预取数据。
- 使用 `<Link>` / `useNavigate` 进行导航，不要直接操作 `window.location`（`main.tsx` 中已有的 stitch 跳转属历史设计，不要扩散该模式）。
- 页面 `<title>`/meta 通过路由 `head()` 配置。

## 数据获取（tRPC + TanStack Query）

- 查询：`useQuery(trpc.<router>.<proc>.queryOptions(input))`；变更：`useMutation(trpc.<router>.<proc>.mutationOptions({ onSuccess }))`。
- 变更成功后用 `queryClient.invalidateQueries({ queryKey: trpc.<router>.<proc>.queryKey() })` 刷新缓存，避免手动同步多份状态。
- 全局查询错误已在 `QueryCache.onError` 中用 sonner toast 提示；mutation 错误需在 `onError` 中自行处理并给出用户可读提示。
- 请求已带 `credentials: "include"`（Better Auth cookie 会话），不要在前端存储 token。
- 服务端地址只从 `ENV.VITE_SERVER_URL`（`apps/web/src/env.ts`，varlock 生成，**禁止手改**）读取；新增前端环境变量需以 `VITE_` 前缀声明在 varlock schema 中并运行 `pnpm --filter web env:generate`。

## 表单

- 复杂表单优先使用 `@tanstack/react-form` + `zod` 校验；简单本地草稿可沿用 feature 内自定义 hook（如 `use-profile-form.ts` 的 saved/draft/dirty 模式）。
- 每个输入必须有关联 `<label>`（或 `aria-label`），错误信息就近展示。

## 组件与状态

- 只写函数组件；hooks 仅在顶层调用，依赖数组完整。
- 不在组件内部定义组件；列表 `key` 使用稳定 ID，不用索引。
- 状态尽量下沉到使用处；可复用逻辑抽成 `features/<feature>/hooks/use-*.ts`；纯函数放 `lib/`。
- React 19：ref 作为普通 prop 传递，不用 `forwardRef`。
- 回调 `useCallback`、派生值 `useMemo` 仅在确有必要（传给子组件或计算昂贵）时使用。

## 样式（Tailwind v4 + shadcn/base-ui）

- 全局样式入口 `apps/web/src/index.css` 只 `@import` `@hono_homework_2/ui/globals.css` 与 `console.css`；设计 token 定义在 `packages/ui/src/styles/console-theme.css`，不要在应用内重复定义颜色/字号。
- 优先复用 token 化工具类（如 `text-label-ui`、`text-label-code`），避免魔法值与任意值 `[...]`。
- 拼接 className：使用了自定义 `text-*` 字号 token 的设计系统组件用 `cx()`（`@hono_homework_2/ui/lib/cx`，不做 merge）；shadcn 组件沿用 `cn()`。不要引入 tailwind-merge。
- 新增 shadcn 组件：在 `packages/ui` 下执行 `pnpm dlx shadcn@latest add <name>`（style `base-lyra`，图标库 lucide，基于 `@base-ui/react`），不要复制到 `apps/web`。
- 图标统一使用 `lucide-react`。
- 主题由 `next-themes` 强制为 dark（`forcedTheme="dark"`），新组件需在暗色下验证对比度。

## 可访问性

- 使用语义元素（`<button>`、`<nav>`、`<main>`），不要用 `div` + onClick 代替按钮；鼠标事件需配套键盘事件。
- 图片提供有意义的 `alt`；`target="_blank"` 必须加 `rel="noopener noreferrer"`；标题层级正确。
- 禁止 `dangerouslySetInnerHTML`（除非内容可信且有注释说明）。

## 代码质量与验证

- 遵循 Ultracite/Biome 规则：不留 `console.log`/`debugger`；`for...of` 优于 `forEach`；正则提到模块顶层；使用 `?.`/`??`。
- 提交前运行：`pnpm check`（Biome 格式化+lint）与 `pnpm check-types`（web 会先执行 `vite build` 再 `tsc --noEmit`）。
- 本地开发：`pnpm dev`（web 运行在 `http://localhost:3001`），或 `pnpm --filter web dev` 单独启动前端。
