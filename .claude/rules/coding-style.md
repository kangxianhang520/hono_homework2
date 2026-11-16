---
description: 全仓 TypeScript/React 编码风格与命名约定(Biome/Ultracite + strict tsconfig),写或改任何 TS/TSX 代码时遵守
globs: "**/*.{ts,tsx,mts,cts,js,jsx,mjs,css}"
---

# Coding Style

本仓库由 Biome(Ultracite 预设:`ultracite/biome/core` + `react` + `tanstack`)统一格式化与 lint,详细原则见根目录 `AGENTS.md`。本文件只列需要人工遵守、或容易被忽略的约定。

## 工具与命令

- 提交前运行 `pnpm check`(= `ultracite fix`)自动修复格式与可修复的 lint 问题
- 类型检查:`pnpm check-types`(各包 `tsc --noEmit`,经 Turborepo 汇总)
- 不要手动调整与 Biome 冲突的格式;不要添加 eslint/prettier 配置
- 不要编辑生成文件:`routeTree.gen.ts`、`dist/`、`.turbo/`、drizzle 生成的 migration SQL(由 `db:generate` 产出)

## 格式

- 缩进使用 **Tab**;字符串使用**双引号**
- import 由 Biome `organizeImports` 自动排序;外部包/workspace 包在前,相对路径 import 与之空一行分组
- Tailwind class 由 `useSortedClasses` 自动排序,不要手动打乱

## TypeScript

- tsconfig 为 `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals/Parameters` + `verbatimModuleSyntax`:
  - 仅类型导入必须用 `import type` 或 `import { type X }`
  - 下标访问结果视为可能 `undefined`,用早返回/`??` 处理,不要用 `!` 非空断言掩盖
  - 未使用的变量/参数直接删除,不要用 `_` 前缀绕过(除非签名必须保留)
- 禁止 `any`;未知类型用 `unknown` 再收窄;优先类型收窄而非 `as` 断言
- 字面量集合用 `as const` 并派生类型,例如 `export const FIELD_TYPES = [...] as const; type FieldType = (typeof FIELD_TYPES)[number];`
- 对象形状优先 `interface`,联合/派生类型用 `type`;enum 必须显式初始化(`useEnumInitializers`)
- 禁止重新赋值函数参数(`noParameterAssign`);默认参数放最后;每条声明只声明一个变量
- 不写可推断的冗余类型注解(`noInferrableTypes`);导出函数/公共 API 写明参数与返回类型
- 魔法数字抽成具名常量(`SCREAMING_SNAKE_CASE`),如 `const SAVE_DURATION_MS = 600;`
- 使用 `Number.parseInt` / `Number.isNaN` 等 `Number` 命名空间方法

## 命名

- 文件名:全部 **kebab-case**(`profile-manager-page.tsx`、`use-custom-fields.ts`、`app-sidebar.tsx`)
- React 组件:PascalCase 具名导出函数(`export function ProfileManagerPage()`),不使用 default export(TanStack Router 路由文件除外,按其约定导出 `Route`)
- Hook:`useXxx`,文件 `use-xxx.ts`
- tRPC router:`xxxRouter`;procedure 用动词驼峰(`getAll`、`create`、`toggle`)
- Drizzle 表对象用单数驼峰(`todo`、`user`),数据库列名由 schema 显式指定
- 常量 `SCREAMING_SNAKE_CASE`;变量/函数 camelCase;类型/接口 PascalCase

## 模块与导入

- 跨包引用使用 workspace 包名 + 子路径:`@hono_homework_2/ui/components/button`、`@hono_homework_2/db/schema/todo`,不要用相对路径跨包
- web 内部使用 `@/*` 别名指向 `apps/web/src/*`;同一 feature 目录内用相对路径
- 不新增 barrel 文件(只做 re-export 的 `index.ts`);按需从具体文件导入
- 前端按 feature 组织:`apps/web/src/features/<feature>/{components,hooks,lib}/`,以及 `types.ts`、`data.ts`
- 共享 UI 组件放 `packages/ui/src/components`(shadcn/base-ui),业务组件留在 `apps/web`

## 代码风格

- 默认 `const`,需要重新赋值才用 `let`,禁止 `var`
- 回调使用箭头函数;遍历优先 `for...of`,不用 `.forEach()`
- 使用 `?.`、`??`、模板字符串、解构
- 早返回减少嵌套;不写多余 `else`(`noUselessElse`);不嵌套三元表达式
- 复杂条件抽成具名布尔变量;函数保持单一职责,控制认知复杂度
- 正则字面量提升到模块顶层,不在循环中创建
- 循环累加器中不使用展开运算符

## 异步与错误处理

- 一律 `async/await`,不写 `.then()` 链;不遗漏 `await`(floating promise)
- 抛出 `Error`(后端 tRPC 中抛 `TRPCError` 并给出 `code` 与 `message`),不要抛字符串
- 不为“捕获后原样重抛”写 try/catch;捕获时要有实际处理(toast、降级、记录)
- 外部输入一律用 zod 校验(tRPC `.input(z.object(...))`、表单、环境变量经 varlock/env 模块)

## React

- 仅函数组件;Hook 只在顶层调用;依赖数组写全
- 列表 `key` 使用稳定 id,不使用数组下标
- 不在组件内部定义组件
- React 19:`ref` 作为普通 prop 传递,不使用 `forwardRef`
- 自闭合无子元素的标签(`useSelfClosingElements`)
- 无障碍:语义化元素(`<button>`、`<nav>`)、表单控件有 label、图片有 alt、鼠标事件配套键盘事件
- 外链 `target="_blank"` 必须加 `rel="noopener noreferrer"`;避免 `dangerouslySetInnerHTML`

## 注释与调试

- 提交代码中不保留 `console.log`、`debugger`、`alert`
- 优先自解释命名;对非显而易见的逻辑或字段语义用 JSDoc `/** ... */` 说明
- 测试中不提交 `.only` / `.skip`
