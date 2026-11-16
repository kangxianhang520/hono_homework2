# hono_homework_2

GitHub Inspector 是一个 GitHub 个人信息与自定义字段管理控制台：用户输入 GitHub Personal Access Token 后，系统拉取账号档案、授权作用域和 API 配额，并支持编辑标准档案字段、回写 GitHub。
用户还可以在 GitHub 原生档案之外附加任意自定义键值字段（Text / Tags / URL / Number / Secret），持久化保存并一键导出为标准 JSON。


## 技术栈

- **语言**:TypeScript(全仓)
- **前端**(`apps/web`):React 19 + Vite + TanStack Router / Query / Form + Tailwind v4 + shadcn(base-ui),共享组件在 `packages/ui`
- **后端**(`apps/server`):Hono(`@hono/node-server`)+ tRPC(`packages/api`)+ Better Auth(`packages/auth`)
- **数据库**(`packages/db`):Drizzle ORM + AWS RDS / Aurora PostgreSQL(驱动 `pg` + `drizzle-orm/node-postgres`,部署在 VPC 私有子网)
- **文档**(`apps/docs`):Astro Starlight
- **工具链**:Turborepo、Biome / Ultracite(lint + format)、varlock(环境变量 schema 与类型生成)
- **包管理器**:pnpm@11.9.0

## 常用命令

| 用途 | 命令 |
| --- | --- |
| 安装依赖 | `pnpm install`(postinstall 会执行 varlock codegen) |
| 启动全部开发服务 | `pnpm dev` |
| 仅启动前端 / 后端 | `pnpm dev:web` / `pnpm dev:server` |
| 构建 | `pnpm build` |
| 类型检查(作为测试门禁) | `pnpm check-types` |
| Lint 检查 | `pnpm check` |
| 自动修复格式/lint | `pnpm fix` |
| 数据库 schema 推送 / 生成迁移 / 执行迁移 | `pnpm db:push` / `pnpm db:generate` / `pnpm db:migrate` |
| Drizzle Studio | `pnpm db:studio` |
| 启动 / 停止本地数据库(Docker Postgres) | `pnpm db:start` / `pnpm db:stop` |
| 生成迁移(turbo 无终端 UI 时) | `cd packages/db && pnpm exec drizzle-kit generate --name <描述>` |
| 生成 Better Auth schema | `pnpm auth:generate` |
| 重新生成环境变量类型 | `pnpm env:generate` |

## 目录结构

```
apps/
  web/        # React SPA:src/routes(文件路由)、features、components、utils
  server/     # Hono 服务入口:index.ts、context.ts、env*.ts
  docs/       # Astro Starlight 文档站
packages/
  api/        # tRPC routers 与 context(前后端共享类型)
  auth/       # Better Auth 配置
  db/         # Drizzle schema、relations、migrations、drizzle.config.ts
  ui/         # shadcn 共享组件、hooks、样式
  config/     # 共享 tsconfig.base.json
specs/        # 需求/设计/任务规格(yd:prd 产出)
turbo.json    # Turborepo 任务管线
biome.json    # Biome / Ultracite 配置
```

## 开发约定

- 修改代码后运行 `pnpm fix` 与 `pnpm check-types`,确保 lint 与类型通过
- 共享逻辑放在 `packages/*`,通过 `@hono_homework_2/*` workspace 包引用,避免跨 app 相对路径导入
- 环境变量通过 varlock schema 声明,修改后执行 `pnpm env:generate`

## AWS 部署(SAM + GitHub Actions)

### 部署方式

- AWS 资源统一用 **AWS SAM** 定义和部署:根目录 `template.yaml` + `samconfig.toml`,不在控制台手动创建资源。
- 后端以 **Lambda** 运行:路由只写在 `apps/server/src/app.ts`;`src/lambda.ts`(`hono/aws-lambda` 的 `handle(app)`)给 Lambda 用,`src/index.ts`(`@hono/node-server`)给本地开发用。两个入口共用同一个 `app`,不要复制路由。
- 环境变量:`src/env.server.ts` 在本地走 varlock;在 Lambda(存在 `AWS_LAMBDA_FUNCTION_NAME`)里 varlock 不可用,改为用 zod 校验 `process.env`。`.env.schema` 新增或修改变量时,要同步改 `env.server.ts` 里的 Lambda schema 和 `template.yaml` 的环境变量。
- 前面挂 **API Gateway(HTTP API)** 作为对外入口。
- Lambda 代码由 tsdown 打成单一 bundle 到 `apps/server/dist-lambda`(`pnpm turbo run build -F server`),`template.yaml` 的 `CodeUri` 指向它,运行时 `nodejs22.x`(arm64)。不运行 `sam build`,直接 `sam deploy`。

### 网络(同一个 VPC)

服务(Lambda)和数据库放在**同一个 VPC**,共 3 个子网:

| 子网 | 类型 | 放什么 |
| --- | --- | --- |
| PublicSubnet | 公有子网(路由到 Internet Gateway) | NAT Gateway,唯一能直接访问外网的子网 |
| PrivateSubnetA | 私有子网(AZ-a,出网走 NAT) | Lambda、数据库 |
| PrivateSubnetB | 私有子网(AZ-b,出网走 NAT) | Lambda、数据库 |

- 两个私有子网必须在**不同可用区**:Lambda 跨 AZ 高可用,RDS 的 DB Subnet Group 也要求至少 2 个 AZ。
- Lambda 要调用 `api.github.com`,所以私有子网必须经 NAT Gateway 出网,否则所有 GitHub 请求都会超时。
- 安全组:Lambda 安全组只放行出站;数据库安全组只允许来自 Lambda 安全组的 5432 端口入站,**数据库不开放公网访问**。
- 敏感配置放在 Secrets Manager,不写进模板、不存进 GitHub Secrets:数据库密码由 RDS 托管生成(`ManageMasterUserPassword`),`BETTER_AUTH_SECRET` 由模板里的 `AuthSecret` 生成。Lambda 冷启动时由 `src/lambda-secrets.ts` 读取这两个 secret 拼出 `DATABASE_URL`,所以 RDS 自动轮换密码后新实例照常可用。
- 连接 RDS 使用 `sslmode=verify-full`,Lambda 环境变量 `NODE_EXTRA_CA_CERTS=/var/runtime/ca-cert.pem` 提供 RDS CA 证书。
- 数据库在私有子网,GitHub Actions runner 连不上。迁移由 VPC 内的 `MigrateFunction`(`apps/server/src/lambda-migrate.ts`,打包时把 `packages/db/src/migrations` 复制进 `dist-lambda-migrate`)执行,CI 在 `sam deploy` 之后调用它。新增 schema 改动只需提交生成的迁移文件,下次部署自动应用。
- 本地开发数据库用 `docker-compose.yml` 里的 Postgres 17(`pnpm db:start`),`apps/server/.env` 的 `DATABASE_URL` 指向 `127.0.0.1:5432`,本地不走 SSL。

### GitHub Actions 部署

- 工作流文件:`.github/workflows/deploy.yml`,push 到 `main` 时自动部署。
- 认证用 **GitHub OIDC + IAM Role**(`aws-actions/configure-aws-credentials`),**禁止**在仓库里存长期 Access Key。GitHub Secrets 里只放角色 ARN(`AWS_DEPLOY_ROLE_ARN`)。
- IAM 部署角色 `github-actions-hono-homework-2-deploy` 由 `infra/github-oidc-role.yaml` 一次性创建(步骤见 `infra/README.md`),要求:
  - **信任策略**:只信任 `token.actions.githubusercontent.com`,`aud` 为 `sts.amazonaws.com`,`sub` 限定为 `repo:<owner>/<repo>:ref:refs/heads/main`,其他仓库和分支不能扮演该角色。
  - **权限策略(最小权限)**:CloudFormation(本项目 stack)、SAM 制品 S3 桶读写、Lambda、API Gateway、EC2 VPC/子网/安全组/NAT、RDS、Secrets Manager 读取、CloudWatch Logs,以及仅限本 stack 创建角色的 `iam:PassRole` / `iam:CreateRole` 等(SAM 需要 `CAPABILITY_IAM`)。不要授予 `AdministratorAccess`。

相关文件:

| 文件 | 作用 |
| --- | --- |
| `template.yaml` | SAM 模板:VPC、子网、NAT、安全组、RDS、Secrets、Lambda、API Gateway |
| `samconfig.toml` | stack 名称与部署参数 |
| `.github/workflows/deploy.yml` | CI 部署:lint → 类型检查 → 打包 → `sam validate --lint` → `sam deploy` → 调用迁移 Lambda |
| `infra/github-oidc-role.yaml` | 一次性创建 GitHub OIDC 身份提供商和部署角色 |
| `docker-compose.yml` | 本地开发用 Postgres |

GitHub 仓库配置:Secret `AWS_DEPLOY_ROLE_ARN`;Variables `AWS_REGION`、`CORS_ORIGIN`、`BETTER_AUTH_URL`、`VITE_SERVER_URL`。

## 模块规则(按需引入)

- 前端开发:@rules/frontend.md
- 后端开发:@rules/backend-api.md
- 数据库开发:@rules/database.md

## 通用规则

- 代码风格:@rules/coding-style.md
- 测试:@rules/testing.md
- 安全:@rules/security.md
- Git 流程:@rules/git-workflow.md

## 项目经验与踩坑记录

@AGENTS.md
