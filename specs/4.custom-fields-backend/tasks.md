# 自定义字段后端存储 — 任务清单

## 任务版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-11-14 | v1   | 初始任务 |

## 项目信息

- 项目名: hono-homework-2
- 架构类型: Turborepo + pnpm monorepo
- specs 路径: specs/4.custom-fields-backend/

## 任务列表

### 功能 1: 数据层

- [ ] T-001: `schema/custom-field.ts`（pgEnum、表、唯一/普通索引）+ index 导出 + `db:generate` 迁移文件 ~15min

### 功能 2: 鉴别与加密

- [ ] T-002: `github/identity.ts` resolveLogin（sha256 缓存、TTL、上限）+ `githubUserProcedure` 注入 githubLogin ~30min
- [ ] T-003: `custom-fields/crypto.ts` AES-256-GCM + server env `CUSTOM_FIELD_SECRET_KEY` 与 context 注入 secretKey ~30min

### 功能 3: tRPC CRUD

- [ ] T-004: `custom-fields/schema.ts` 共享 zod（FIELD_TYPES 含 Secret、discriminatedUnion、Tags 去重）+ DTO 映射（Secret 掩码） ~15min
- [ ] T-005: `routers/custom-field.ts` list / revealSecret / create（position 子查询、23505→CONFLICT） ~30min
- [ ] T-006: update（type+value 组合校验、Secret 重加密、NOT_FOUND）/ delete，挂载 appRouter ~30min

### 集成与测试

- [ ] T-007: 单测：schema 各类型边界、crypto 往返、identity 缓存命中；路由测试（mock db/fetch）覆盖跨账号 NOT_FOUND 与 CONFLICT ~30min

## 依赖关系

- T-002 依赖 1.T-002
- T-004 依赖 T-001
- T-005 依赖 T-001、T-002、T-003、T-004
- T-006 依赖 T-005
- T-007 依赖 T-006、1.T-007（Vitest 配置）

## 风险点

- drizzle-kit 为 `1.0.0-rc.5`，生成迁移语法可能与稳定版不同，生成后需人工检查 SQL。
- position 由单条 SQL 子查询计算，并发插入可能重复（不影响唯一性，仅影响排序），可接受；如需严格有序可改为 `db.transaction` + 行锁。
- 进程内登录缓存在多实例部署下不共享，仅影响配额消耗，不影响正确性。
