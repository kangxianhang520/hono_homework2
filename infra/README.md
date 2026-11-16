# AWS 部署前的一次性准备

这些步骤只需在 AWS 账号可用后做一次,之后每次 push 到 `main` 由 GitHub Actions 自动部署。

## 1. 创建 GitHub OIDC 身份提供商和部署角色

用有管理员权限的身份执行(把 `<owner>` / `<repo>` / `<region>` 换成实际值):

```bash
aws cloudformation deploy \
  --region <region> \
  --stack-name github-actions-deploy-role \
  --template-file infra/github-oidc-role.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides GitHubOrg=<owner> GitHubRepo=<repo>
```

- 如果账号里已经有 `token.actions.githubusercontent.com` 身份提供商,加上 `CreateOidcProvider=false`。
- 部署角色只能被 `<owner>/<repo>` 的 `main` 分支扮演,权限只覆盖本项目 stack(`hono-homework-2`)用到的资源。

取出角色 ARN:

```bash
aws cloudformation describe-stacks --region <region> \
  --stack-name github-actions-deploy-role \
  --query "Stacks[0].Outputs[?OutputKey=='DeployRoleArn'].OutputValue" --output text
```

## 2. 配置 GitHub 仓库

Settings → Secrets and variables → Actions,建议放在 `production` environment 下:

| 类型 | 名称 | 值 |
| --- | --- | --- |
| Secret | `AWS_DEPLOY_ROLE_ARN` | 上一步取出的角色 ARN |
| Variable | `AWS_REGION` | 部署区域,如 `ap-northeast-1` |
| Variable | `CORS_ORIGIN` | 前端地址,如 `https://app.example.com` |
| Variable | `BETTER_AUTH_URL` | API 对外地址(首次部署可先填占位,部署后改为输出的 `ApiUrl`) |
| Variable | `VITE_SERVER_URL` | 前端访问 API 的地址,同上 |

## 3. 首次部署之后

- 从 stack 输出 `ApiUrl` 拿到 API 地址,回填 `BETTER_AUTH_URL` / `VITE_SERVER_URL` 后重新运行一次工作流。
- 数据库在私有子网,GitHub runner 和本机都连不上。表结构迁移由 stack 里的 `MigrateFunction` 在 VPC 内执行,工作流每次部署后自动调用;手动触发:`aws lambda invoke --function-name <MigrateFunctionName 输出> out.json`。
- RDS 开启了 `DeletionProtection`,删除 stack 前需要先在 RDS 控制台关闭它;删除时会自动保留最终快照。
