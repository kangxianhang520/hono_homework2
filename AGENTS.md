# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm exec ultracite fix`
- **Check for issues**: `pnpm exec ultracite check`
- **Diagnose setup**: `pnpm exec ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome will catch most mechanical issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `pnpm exec ultracite fix` before committing to ensure compliance.

---

# 项目踩坑与教训(AGENTS.md)

- [T-001] GitHub API 坑:fine-grained PAT 的响应不带 `X-OAuth-Scopes` 头,要区分「头缺失=null(未知/细粒度 token)」和「头存在但为空=[](无 scope)」,不要把缺失当成无权限;`X-RateLimit-*` 也可能缺失或非法,解析要返回 null 而不是 NaN/0。
- [T-001] Biome `lint/style/useErrorCause` 坑:自定义 Error 子类把 cause 作为位置参数传入(内部再 `super(message, { cause })`)时,在 catch 中 `throw new XxxError(..., error)` 仍会被该规则误报,需在 throw 处加 `// biome-ignore lint/style/useErrorCause: <原因>`;或让构造函数接收 `{ cause }` options 对象以避开误报。
- [T-004] tRPC 自定义请求头坑:`httpBatchLink` 的 `headers` 必须写成函数(`headers: () => ...`)在每次请求时读取 sessionStorage 里的 token,不要在模块加载时读一次存成常量,否则登录/清除 token 后请求头不会更新;token 不存在时返回 `{}` 而不是带空值的 header。
- [T-004] CORS 前置坑:前端新增自定义请求头(如 `X-GitHub-Token`)后,必须同步把它加进 `apps/server/src/app.ts` 中 `cors({ allowHeaders })` 列表(当前只有 `Content-Type`、`Authorization`),否则跨域预检失败,浏览器直接拦截请求,服务端日志里看不到任何报错。
- [T-002] tRPC 中间件坑:resolver 里抛出的错误不会在中间件的 `await next()` 处 throw,而是返回 `{ ok: false, error }`;要在中间件里统一把底层错误(如 `GithubApiError`)映射成 `TRPCError`,必须检查 `!result.ok && result.error.cause instanceof Xxx` 再 throw 新错误,用 try/catch 包 `next()` 是抓不到的。
- [T-002] tRPC errorFormatter 坑:要给前端透出额外字段(如限流 `resetEpoch`),在 `initTRPC.create({ errorFormatter })` 里从 `error.cause` 取值并合并进 `shape.data`;因此映射 `TRPCError` 时务必传 `cause: originalError`,并让 message 只用稳定错误码(如 `GITHUB_TOKEN_INVALID`),绝不拼入 token 等敏感信息。
- [T-003] GitHub 响应校验坑:GitHub REST 会对未填写的字段(如 `/user` 的 `name`/`email`/`bio`/`blog`/`twitter_username`)显式返回 `null`,不是省略字段;zod schema 要用 `.nullish()` 而不是 `.optional()`,否则 `safeParse` 失败、正常账号也会被当成上游错误。上游数据先以 `githubRequest<unknown>` 取回再 `safeParse`,失败时抛 `TRPCError({ code: "BAD_GATEWAY", message: "GITHUB_UPSTREAM_ERROR" })`,不要用泛型直接断言类型。
- [T-007] packages/api 单测模式坑:tRPC procedure 用 `t.createCallerFactory(router)` 直接调用,ctx 传最小假对象(`{ db: {}, githubToken, session: null } as unknown as Context`),不要起 Hono server;外部 HTTP 用 `vi.stubGlobal("fetch", vi.fn<typeof fetch>())` 并在 `afterEach` 里 `mockReset()` + `vi.unstubAllGlobals()` 防止串测。注意 `mockResolvedValue(new Response(...))` 每次返回同一个 Response,body 只能读一次,若被测代码会多次 fetch 要改用 `mockImplementation(() => new Response(...))`;断言错误时只比对稳定错误码 message,并断言 message 中不含 token。
- [T-005] 前端 token 同步时序坑:tRPC link 是从 sessionStorage 读 `X-GitHub-Token` 的(见 T-004),所以必须先 `saveToken(token)` 再 `mutate()`,否则首发请求不带新 token;同时在 `onError` 里回滚到旧 token(无旧值则 `clearToken()`),避免一个无效/401 的 token 残留在存储里污染后续所有请求。
- [T-005] 跨组件共享 mutation 结果坑:`useMutation` 的 `data` 只存在于调用它的那个 hook 实例里,其它组件拿不到;需要在 `onSuccess` 中 `queryClient.setQueryData(KEY, result)`,读取方用 `useQuery({ queryKey: KEY, queryFn: () => null, enabled: false, staleTime: Infinity })` 订阅,不要自建全局 store。限流 `resetEpoch` 是 unix 秒,倒计时与 `Date.now()`(毫秒)相减前要先 `/1000`,且 `useCountdown` 的 effect 只依赖 epoch,epoch 为 null 时不启 interval。
- [T-006] 派生展示值的 useMemo 依赖坑:不要用布尔派生标志(如 `synced = data !== null`)作依赖,也不要在 useMemo/render 中读 sessionStorage(`loadToken()`)等副作用源;「已同步状态下换 token 重新同步」时布尔值不变,memo 不重算,UI 会显示旧 token 的掩码。应在同步成功路径(`onSuccess`)把派生值(如 masked token)一并写进 `setQueryData` 的结果/hook state,读取方只依赖该结果对象。
- [T-006] React Query 清缓存坑:「清除会话」类操作优先用 `queryClient.removeQueries({ queryKey: KEY })` 精确清理,`queryClient.clear()` 会清空全应用缓存,需对照 spec 确认是否本意;另外 `enabled: false` 的观察者在 key 被移除后需验证确实重渲染为 `data=undefined`,不确定时同时显式 `setQueryData(KEY, null)`/重置 mutation 状态,并把 `'—'` 这类占位符抽成共享常量,避免各组件各写一份字面量。
- [T-001] 前端展示格式化坑:数字/日期格式化必须固定 locale 与时区,否则输出随机器环境变化、单测不稳定。`Intl.NumberFormat` 显式传 `"en-US"` + `notation: "compact"`(默认输出大写 `1.4K`,需小写时再 `.toLowerCase()`),formatter 实例提到模块顶层复用;日期用 `new Date(t).toISOString().slice(0, 10)` 取 UTC 日期,且必须先 `Number.isNaN(Date.parse(iso))` 判非法——非法日期调 `toISOString()` 会直接抛 `RangeError` 让整个页面崩掉,应回落到共享占位符 `PLACEHOLDER`。
- [T-001] 前端复用后端 GitHub 类型坑:前端用 `import type { GithubUser } from "@hono_homework_2/api/github/schemas"` 取 zod 推导类型(只能 `import type`,不能引入运行时),由于 schema 字段几乎全是 `.nullish()`(见 T-003),view 映射层每个字段都要处理 `null | undefined`(计数用 `typeof n === "number"` 判断而不是 truthy,避免 0 被当成缺失;字符串先 `?.trim()` 再判空),不要在组件里散落判空。
- [T-004] 相对时间展示坑:`formatRelativeTime(iso, nowMs)` 这类纯函数要把 `now` 作为参数注入(便于测试、不在函数内读 `Date.now()`),组件侧用一个只依赖 `active` 布尔的 `useNow` hook 每秒 `setInterval` 刷新 state 并在 cleanup 中 `clearInterval`;只在 render 时算一次会让「12s ago」永久冻结,数据为 null 时不要启动 interval。上游可能缺失/非法的值(时间戳 `Date.parse` 为 NaN、配额 `limit<=0`)一律返回 null 交给共享 `PLACEHOLDER` 渲染,不要显示 NaN/Infinity%。
- [T-003] 设计系统组件 props 不透传坑:`packages/ui/src/components/console/*`(如 `Panel` 只收 `as/shadow/children/className`)不会把多余 props 展开到 DOM;而 JSX 里带连字符的属性(`aria-busy`、`aria-label`、`data-*`)TS 不报错,tsc 能过但属性被静默丢弃。给这类组件加无障碍/数据属性前先看其 Props 定义;要么在内部包一层原生 `<div aria-busy aria-label>` / `role="status"` + `sr-only` 文案,要么扩展组件让它透传 `ComponentProps<"div">` 的剩余属性。
- [T-002] 图片加载失败回退坑:`<img onError>` 会被 Biome `lint/a11y/noNoninteractiveElementInteractions` 误报,需在 img 上加 `// biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError is a load-failure fallback`;回退用组件内 `failed` state 时,父组件必须给该子组件传 `key={url}`,否则换账号/换头像 URL 后 `failed=true` 残留,新图永远不显示(用 key 重置 state,不要写 useEffect 同步)。
- [T-002] 上游 URL 渲染坑:GitHub 返回的 `avatar_url`/`html_url`/`blog` 等是外部可控数据,用作 `<img src>` 前先用 `new URL(u).protocol === "https:"`(包 try/catch,解析失败按无效处理)校验并降级为占位图标;用作 `<a href>` 时同样只接受 http(s),防 `javascript:` URL,外链加 `rel="noopener noreferrer"`。空值统一用共享 `PLACEHOLDER`(`@/components/layout/placeholder`)显示 `—`。
- [T-006] apps/web Vitest 配置坑:单测用独立的 `apps/web/vitest.config.ts`(`environment: "node"`,`resolve.tsconfigPaths: true` 解析 `@/*` 别名),不要复用 `vite.config.ts`——那里的 varlock / TanStack Router / Tailwind 插件会在测试时加载 env 校验、生成路由文件,纯逻辑测试会因此失败或变慢;根 `test` 走 `turbo run test`,各包自带 `"test": "vitest run"`,turbo 的 `test` task 设 `outputs: []`。
- [T-006] 展示格式化可测性坑:被单测断言的格式化函数必须固定 locale 和时区——`Intl.NumberFormat` 显式写 `"en-US"`(compact 输出 `1.4K`,如需小写再 `.toLowerCase()`),日期用 `toISOString().slice(0, 10)` 取 UTC 而不是 `toLocaleDateString()`,否则 CI 与本地时区/语言不同会导致断言漂移;非法日期先 `Number.isNaN(Date.parse(x))` 回退占位符,不要让 `toISOString()` 抛 RangeError。
- [T-005] 同步数据三态渲染坑:依赖 `useGithubSync()` 的卡片按 `status === "pending"` → 骨架、`data` 非空 → 真实卡片、否则 → 空态 的顺序判断(先判 pending,重新同步时才会显示骨架而非旧数据),用 `let x: ReactNode` + if/else 组装,避免 Biome 禁止的嵌套三元;`enabled: false` 的 `useQuery` 初始 `data` 是 `undefined`,hook 已统一归一为 `null`,消费方只用 `useGithubSync().data` 并与 `null` 比较,不要绕过 hook 直接 `useQuery(GITHUB_SESSION_KEY)`,否则 `data !== null` 在未同步时为 true。删除 mock(如 `ACCOUNT`/`RATE_LIMIT`/`TELEMETRY`)前先 `grep -rn` 全部引用方并一起替换,再跑 `pnpm check-types` 确认无残留导入。
