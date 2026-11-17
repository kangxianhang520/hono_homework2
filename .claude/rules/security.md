---
description: 安全规范 - 密钥与环境变量(varlock)、Better Auth 认证/会话、Hono CORS、tRPC 授权、Drizzle 数据访问与前端 XSS 防护
globs: apps/server/**, apps/web/**, packages/api/**, packages/auth/**, packages/db/**, **/.env.schema
---

# 安全规范

## 密钥与环境变量(varlock)

- 所有环境变量必须先在对应包的 `.env.schema` 中声明(`apps/server`、`apps/web`、`packages/db`),schema 默认 `@defaultSensitive=true`,不要随意给服务端变量加 `@public`。
- `.env` / `.env*.local` 已被 `.gitignore` 忽略,只允许提交 `.env.schema`;绝不在代码、注释、测试、文档或 `specs/` 中写入真实的 `BETTER_AUTH_SECRET`、`DATABASE_URL` 等值。
- 服务端通过 `ENV`(`apps/server/src/env.server.ts`,内部 `import "varlock/auto-load"`)读取配置,不要直接散落使用 `process.env`。
- `src/env.ts` 为 varlock 自动生成文件,禁止手改;修改 schema 后重新生成。
- 前端(`apps/web`)只能使用标记为 `@public` 的变量(当前为 `NODE_ENV`、`VITE_SERVER_URL`)。任何 `VITE_*` 变量都会被打包进浏览器产物,严禁把密钥、数据库连接串放进 web 端。
- 不在日志中输出 env、session、cookie、Authorization 头或密码;`hono/logger` 之外新增日志时注意脱敏。

## 认证与会话(Better Auth)

- 认证统一由 `packages/auth` 的 `createAuth` 提供,服务端经 `/api/auth/*` 挂载 `auth.handler`;不要自行实现密码哈希、token 签发或会话存储。
- `BETTER_AUTH_SECRET` 必须为高熵随机值(至少 32 字节),各环境不同,泄露后立即轮换。
- 保持 cookie 属性 `httpOnly: true`、`secure: true`;`sameSite: "none"` 仅因前后端跨域而设置,必须同时依赖 `trustedOrigins` 白名单做 CSRF 防护,不得放宽为通配。
- `trustedOrigins` 只包含 `CORS_ORIGIN` 及明确的桌面端 origin,禁止加入 `*` 或用户可控值。
- 新增 Better Auth 插件、OAuth provider、邮箱验证/重置密码流程时,同步考虑限流(rate limit)与密码策略;生产环境建议开启 Better Auth 内置 rate limiting。
- 前端不得把 session token 写入 `localStorage`/`sessionStorage`,会话只依赖 httpOnly cookie(请求需 `credentials: "include"`)。

## HTTP 层(Hono)

- CORS 必须使用精确 origin(`ENV.CORS_ORIGIN`),`credentials: true` 时严禁 `origin: "*"`;`allowMethods` / `allowHeaders` 保持最小集合,新增前评估必要性。
- 新增路由优先放进 tRPC;确需裸 Hono 路由时,自行校验 session(`auth.api.getSession({ headers })`)和输入。
- 错误响应不得泄露堆栈、SQL、内部路径或第三方服务错误原文;生产环境返回通用错误信息。
- 文件上传、Webhook 等入口须限制请求体大小,并校验签名/类型。

## API 授权(tRPC)

- 任何读写用户数据的 procedure 必须使用 `protectedProcedure`;`publicProcedure` 仅用于真正公开的数据(如健康检查)。
- 授权要做到资源级:查询/更新/删除时用 `ctx.session.user.id` 约束归属(`where userId = ctx.session.user.id`),禁止信任客户端传入的 `userId`。
- 所有 procedure 输入必须用 zod `.input()` 校验(类型、长度、枚举、格式),拒绝未知字段的副作用。
- 抛错使用 `TRPCError` 并选择正确的 code(`UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `BAD_REQUEST`),message 面向用户,不夹带内部细节。
- 返回数据只选取需要的字段,不要把 `password`、`token`、`account` 等敏感列返回给前端。

## 数据库(Drizzle + AWS RDS / Aurora PostgreSQL)

- 只通过 Drizzle 查询构建器或 `sql` 模板标签进行参数化查询,禁止字符串拼接 SQL(包括 `sql.raw` 拼接用户输入)。
- `DATABASE_URL` 必须使用 TLS(`sslmode=verify-full`,通过 `NODE_EXTRA_CA_CERTS` 加载 AWS RDS CA bundle),不得关闭证书校验(禁止 `rejectUnauthorized: false`)。
- 数据库凭证存放在 AWS Secrets Manager(加密使用 KMS),不得写入代码或提交到仓库;RDS 位于 VPC 私有子网、不开放公网访问,仅允许 Lambda 安全组连接。
- Better Auth 相关表(`packages/db/src/schema/auth.ts`)由 Better Auth 管理,修改前确认与其 schema 兼容;不要手动明文存储密码或 token。
- 迁移(`packages/db/src/migrations`)提交前审查,避免误删列/表;破坏性迁移先在 RDS 快照恢复出的临时实例或 staging 库上验证。
- 用户关联数据表应有 `userId` 外键并设置合理的 `onDelete` 行为,便于按用户做数据隔离与删除。

## 前端(React + Vite)

- 避免 `dangerouslySetInnerHTML`;确需渲染 HTML 时先用可信库净化(如 DOMPurify)。
- 外链 `target="_blank"` 必须带 `rel="noopener noreferrer"`;不要把用户输入直接拼进 `href`(防 `javascript:` URL)。
- `localStorage` 仅存放非敏感的 UI 偏好/草稿数据,读写需 try/catch 并对 `JSON.parse` 结果做校验,不存放个人敏感信息或凭证。
- 前端校验(TanStack Form + zod)只用于体验,服务端必须重复校验。
- 禁止 `eval`、`new Function`、直接写 `document.cookie`。

## 依赖与工具链

- 依赖统一用 `pnpm` 安装,提交 `pnpm-lock.yaml`;新增依赖前确认维护状态与来源,定期 `pnpm audit`。
- 提交前运行 `pnpm check`(Ultracite/Biome)与 `pnpm check-types`;移除 `console.log`、`debugger`。
- 发现安全问题(密钥泄露、越权、注入)优先修复并轮换相关凭证,不要在 commit message 或 issue 中贴出密钥原文。

## GitHub Personal Access Token(X-GitHub-Token)

- GitHub PAT 是用户凭证,不是 Better Auth 会话:前端只存在 `sessionStorage`(`features/profile-manager/lib/token-storage.ts` 的 `saveToken`/`loadToken`/`clearToken`),禁止写入 `localStorage`、cookie、URL 查询参数或 React Query 持久化缓存;关闭标签页即失效。
- 仅通过请求头 `X-GitHub-Token` 传给后端(`apps/web/src/utils/trpc.ts` 的 `headers: () => ...` 每次请求读取),token 不存在时不发送该头;CORS `allowHeaders` 只为它显式放行,不要改成通配。
- 服务端只在 `apps/server/src/context.ts` 读取该头注入 `ctx.githubToken`,仅用于转发 `api.github.com`;**不得**写入数据库、日志、错误 message、`errorFormatter` 输出或返回给前端。
- UI 展示只用 `maskToken()` 掩码值;同步失败(401 等)时回滚/`clearToken()`,不让无效 token 残留在存储中。
- 映射 GitHub 错误为 `TRPCError` 时 message 只用稳定错误码(如 `GITHUB_TOKEN_INVALID`、`GITHUB_UPSTREAM_ERROR`),不夹带上游响应原文或 token;单测须断言错误 message 不含 token。
- 上游 GitHub 响应一律先按 `unknown` 取回再用 zod `safeParse` 校验,不信任第三方数据结构。
- 用户自定义字段中的 `Secret` 类型值属于敏感数据:列表/导出默认掩码展示,不写日志,导出前需用户显式确认。

## 云部署与 CI 凭证(AWS SAM + GitHub Actions)

- CI 只用 GitHub OIDC + IAM Role(`aws-actions/configure-aws-credentials`)获取临时凭证,禁止在仓库或 GitHub Secrets 中存长期 Access Key;GitHub Secrets 只放 `AWS_DEPLOY_ROLE_ARN`。
- 部署角色(`infra/github-oidc-role.yaml`)信任策略限定 `aud=sts.amazonaws.com` 与 `sub=repo:<owner>/<repo>:ref:refs/heads/main`;权限按最小权限授予,禁止 `AdministratorAccess`,`iam:PassRole`/`iam:CreateRole` 仅限本 stack 资源。
- 敏感配置(数据库密码、`BETTER_AUTH_SECRET`)只放 Secrets Manager,由 Lambda 冷启动时经 `src/lambda-secrets.ts` 读取;不写进 `template.yaml`、`samconfig.toml` 或 Lambda 明文环境变量。
- Lambda 安全组只放行出站,数据库安全组只允许来自 Lambda 安全组的 5432 入站;不要为调试给 RDS 开公网或放宽到 `0.0.0.0/0`。
