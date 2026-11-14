# 产品需求文档 (PRD)：GitHub 个人信息与自定义字段管理控制台

## 1. 文档概述
- **产品名称**：GitHub Inspector - 个人信息与动态字段管理工具 (Profile & Custom Metadata Console)
- **文档版本**：v1.0.0
- **目标受众**：前端开发团队、后端开发团队、测试团队、产品架构师
- **核心目标**：通过用户提供的 GitHub Personal Access Token (PAT) 读取官方账号核心信息，并在本地/持久层提供标准档案查看及**动态自定义元数据字段（键/值/类型）的自由增删改查与导出**能力。

---

## 2. 业务背景与用户价值
1. **背景**：GitHub 原生个人主页字段相对固定（仅包含 Bio、Company、Location、Blog、Social Links 等），对于开发者、技术团队管理者或开源布道者而言，常需关联内部门户名册、团队 SSO 映射、GPG 签名指纹、技术栈标签、Discord/Matrix 协作 Handle 等扩展属性。
2. **价值**：
   - **一键读取官方数据**：免去手动录入基础档案的繁琐步骤。
   - **无缝扩展非标准属性**：支持任意键值对的结构化扩展与维护。
   - **数据便携性**：支持一键导出标准 JSON，便于集成至静态博客生成器、团队内部 DevPortal 或自动化流水线。

---

## 3. 用户角色与权限 (User Persona)
- **独立开发者 / 开源贡献者**：希望集中维护自己的 GitHub 公开身份卡片与技术技能标签。
- **技术团队管理员 (Team Lead)**：需要批量校验成员 GitHub 账号合法性并附加团队内部元数据属性（如工号、所属项目组、时区）。

---

## 4. 功能需求详细说明 (FRD)

### 4.1 Token 凭证授权与数据拉取
- **功能描述**：用户输入 GitHub Personal Access Token（PAT，经典 Token 或 Fine-grained Token），系统请求 GitHub REST API v3 / GraphQL 接口并拉取档案。
- **详细逻辑**：
  1. **输入项**：Token 输入框，默认密文展示（`••••••••`），附带显示/隐藏切换开关。
  2. **验证触发**：点击「获取/同步数据」按钮后，发起对 `GET https://api.github.com/user` 的请求（带 `Authorization: Bearer <token>`）。
  3. **权限作用域检查**：解析响应头中的 `X-OAuth-Scopes`，在界面动态高亮呈现已授权作用域（如 `read:user`, `user:email`, `repo`, `workflow` 等）。
  4. **配额监控**：读取响应头 `X-RateLimit-Remaining` 与 `X-RateLimit-Limit`，展示当前 API 调用配额进度条（如 `4,982 / 5,000`）及配额重置倒计时。
  5. **异常处理**：
     - 若 Token 无效或过期，提示 401 错误并引导重新生成。
     - 若超出频控（Rate Limit Exceeded 403），提示重置时间点。

### 4.2 GitHub 档案信息概览卡片
- **功能描述**：将 API 同步得到的核心画像以可视化卡片展示。
- **展示字段**：
  - 用户头像（Avatar URL）、全名（Name）、用户名（Login/Handle）。
  - 核心指标统计：Public Repos 数量、Followers 数量、Following 数量。
  - 组织所属（Company）、地理位置（Location）、建号时间（Created At）。
  - 「访问公开 GitHub 主页」外链跳转。
- **遥测与网络健康度（Telemetry）**：
  - 展示接口同步耗时（Sync Latency，如 84ms）。
  - 接口调用活跃度与响应耗时折线趋势图。

### 4.3 标准档案字段展示与编辑 (Standard Profile Fields)
- **字段清单**：
  - `Username`（只读主键，不可修改）
  - `Display Name`（显示姓名）
  - `Public Email`（公开邮箱，支持下拉或手动录入）
  - `Bio`（个人简介，支持多行文本与 Markdown 语法）
  - `Blog / Website`（个人主页，URL 格式校验）
  - `Company`（所在公司/组织）
  - `Location`（地理位置）
  - `Twitter Handle`（社交平台账号）
- **操作规则**：支持在输入框内修改，修改后触发「未保存变更」标记。

### 4.4 附加自定义字段动态管理 (Custom Metadata & Tags)
- **核心逻辑**：允许用户在原生 GitHub 档案之外附加非标准键值对。
- **字段属性结构**：
  - `key` (String, 必填)：字段键名，需保证唯一性（如 `GPG_Key_ID`, `Tech_Stack`, `Discord_Handle`）。
  - `type` (Enum, 必填)：支持 `Text`、`Tags`（标签数组）、`URL`、`Number`、`Secret/Masked`。
  - `value` (Any, 必填)：根据选定的数据类型呈现对应的输入与解析组件（例如 Tags 类型支持回车分词生成 Tag Pill；URL 类型支持协议检查）。
- **操作交互**：
  1. **新增字段**：点击顶部「+ 新增字段」按钮，列表底部追加一行空白编辑行。
  2. **编辑字段**：双击或直接在表格行中修改 Key、Type 或 Value。
  3. **删除字段**：点击行末垃圾桶图标，直接移除对应元数据项，并更新“当前已载入 N 项扩展属性”计数。

### 4.5 底部全局操作与持久化
- **重置修改 (Reset)**：放弃当前未提交的改动，恢复为上一次拉取或保存的状态。
- **导出配置为 JSON (Export JSON)**：将「GitHub 基础档案 + 扩展自定义字段」整合打包为格式化的 JSON 文件供下载。
- **保存档案与自定义字段 (Save)**：
  - 基础字段按需调用 GitHub API `PATCH /user` 尝试更新（需 Token 具备 `user` 写入权限）。
  - 自定义字段持久化至浏览器 LocalStorage / IndexedDB 或后端配置中心。
  - 成功后弹出 Toast 成功通知并消除未保存脏数据标记。

---

## 5. 数据结构规范 (Schema Definition)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GitHubUserProfileConfig",
  "type": "object",
  "properties": {
    "auth": {
      "type": "object",
      "properties": {
        "token_masked": { "type": "string" },
        "scopes": { "type": "array", "items": { "type": "string" } },
        "rate_limit": {
          "type": "object",
          "properties": {
            "limit": { "type": "integer" },
            "remaining": { "type": "integer" },
            "reset_epoch": { "type": "integer" }
          }
        }
      }
    },
    "profile": {
      "type": "object",
      "properties": {
        "login": { "type": "string" },
        "name": { "type": "string" },
        "avatar_url": { "type": "string", "format": "uri" },
        "email": { "type": "string", "format": "email" },
        "bio": { "type": "string" },
        "blog": { "type": "string" },
        "company": { "type": "string" },
        "location": { "type": "string" },
        "twitter_username": { "type": "string" },
        "public_repos": { "type": "integer" },
        "followers": { "type": "integer" },
        "following": { "type": "integer" }
      },
      "required": ["login"]
    },
    "custom_fields": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "key": { "type": "string" },
          "type": { "type": "string", "enum": ["Text", "Tags", "URL", "Number", "Secret"] },
          "value": { "type": ["string", "number", "array"] }
        },
        "required": ["key", "type", "value"]
      }
    }
  }
}
```

---

## 6. 非功能性需求 (NFR)
1. **安全性 (Security)**：
   - 严禁将用户输入的 PAT 明文上传至未授权第三方分析系统。
   - 内存与存储中 PAT 必须支持脱敏存储，支持用户随时「清除缓存 (Clear Cache)」。
2. **性能与体验 (Performance & UX)**：
   - API 数据加载延迟低于 500ms（视 GitHub 国际网络状况），加载时呈现骨架屏或 Loading 动效。
   - 自定义字段增删改均需实现乐观 UI 更新（Optimistic UI），无卡顿响应。
3. **兼容性与响应式**：
   - 优先适配 PC 端宽屏控制台工作台（1280px+），支持暗色主题（Obsidian Dark Theme）。
