# 后端与数据库规则

本文件用于约束公开主站中的后端 API、Supabase、Postgres、RLS、迁移、存储签名与数据库建模。凡是任务涉及 `src/app/api/*`、`src/lib/supabase/*`、`src/lib/submissions/*`、`src/lib/videos/*`、`src/lib/storage/*`、`supabase/migrations/*` 或任何表结构设计，都必须先读取本文件。

## 业务边界

- 当前仓库是公开主站，不承载后台审核系统、推荐系统、评论系统、举报系统或普通用户上传系统，除非用户明确要求重新定义架构。
- 公开提交路径只解析 Bilibili 链接并写入 `submissions`，不得调用 Bilibili 接口。
- Bilibili 元数据抓取只允许在后台审核流程中延迟触发，且后台项目默认应在独立仓库维护。
- 公开 Archive / Video 读取路径不得调用 Bilibili 接口，只读取数据库中已审核、已发布的数据。
- 后端代码只服务当前公开主站的必要链路：公开读取、登录态识别、Bilibili 链接投稿、COS 原生投稿签名/完成、视频浏览与点赞。

## 建表前置流程

凡是新需求涉及新增表、改表、RLS、RPC 或数据关系调整，代理不得直接给出表结构，必须先完成以下建模步骤。

### 1. 识别业务对象

先回答当前业务到底有哪些对象，每个对象代表什么业务概念，而不是先想表名。

每个对象至少说明：

- 对象名称：例如用户资料、投稿、视频、标签、点赞记录、浏览去重记录、COS 上传任务。
- 业务职责：该对象在系统中负责什么。
- 具体业务场景：在哪些用户操作或系统流程中产生、读取、更新或删除。
- 生命周期：什么时候创建，什么时候变更，什么时候结束。
- 仓库归属：是否属于公开主站能力。若属于后台审核、推荐、评论、举报、普通上传等未开放能力，默认不得纳入当前仓库。

### 2. 确认对象关系

在设计表结构前，必须先说明对象之间的关系。

每组关系至少说明：

- 关系类型：一对一、一对多、多对多。
- 关联基数：例如一个视频可以有多个标签，一个标签可以属于多个视频。
- 外键位置：外键应该放在哪张表，为什么。
- 是否需要中间表：多对多必须优先使用中间表。
- 删除策略：`cascade`、`restrict`、`set null` 或保留历史，必须说明业务理由。
- 访问方向：公开页面主要从哪边查，服务端或审核流程主要从哪边写。

字段归属规则：

- 一对多：外键放在“多”的一侧，例如 `videos.category_id`。
- 多对多：必须建中间表，例如 `video_tags(video_id, tag_id)`。
- 一对一：优先判断是否真的需要拆表。只有权限、生命周期、敏感性或体积差异明显时才拆。
- 派生计数：如 `like_count`、`view_count` 可以放在主表，但必须说明真实来源表和同步机制。
- 外部平台原始数据：可放 `jsonb` 快照，但稳定业务字段必须拆成明确列。

### 3. 说明核心设计理由

给表结构前，必须先说明为什么这样设计。

至少覆盖：

- 为什么这些对象需要独立成表。
- 为什么这些对象不应该合并到同一张表。
- 是否符合 1NF / 2NF / 3NF。
- 是否存在反范式设计。

反范式设计必须说明：

- 反范式字段是什么。
- 为什么需要它。
- 数据从哪里同步。
- 同步失败如何恢复。
- 是否会造成一致性风险。

### 4. 再输出表结构草案

只有完成对象和关系分析后，才能给出表结构。

表结构必须包含：

- 表名。
- 字段名。
- 字段类型。
- 是否为空。
- 默认值。
- 主键。
- 外键。
- 唯一约束。
- `check` 约束。
- 索引。
- RLS 策略。
- `anon` / `authenticated` / `service_role` 权限。
- 关键查询路径。

## 范式与建模规则

- 默认遵守三大范式。
- 1NF：字段保持原子值，不在单个字段存多个标签、多个 ID 或逗号列表。
- 2NF：非主属性必须依赖完整主键。多对多关系必须用中间表表达。
- 3NF：非主属性不得依赖其他非主属性。分类、标签、色调等字典必须放独立表。
- 反范式只能作为有记录的性能或业务一致性取舍，不能作为快速实现的默认做法。
- `jsonb` 只能用于外部原始载荷、审计快照或结构不稳定的扩展数据；稳定业务字段必须拆成列。
- 状态字段必须有 `check` 约束或字典表，禁止自由文本状态值。
- 所有业务表必须有主键；跨表关系必须有外键；业务唯一性必须用 `unique` 或复合主键表达。

当前允许的典型反范式例外：

- `videos.view_count`、`videos.like_count` 作为派生计数缓存，真实行为记录仍由 `video_view_dedupes`、`video_likes` 等表承担。
- `submissions.auto_fetched_meta` 或类似字段可保存外部平台原始快照，但不能作为公开读取路径的唯一事实来源。

## 常见字段规范

新增表时优先使用统一字段规范：

- 主键：`id uuid primary key default gen_random_uuid()`。
- 用户归属：`user_id uuid references public.profiles(id)`。
- 创建时间：`created_at timestamptz not null default now()`。
- 更新时间：只有存在更新行为时才加 `updated_at timestamptz`。
- 发布时间：公开内容使用 `published_at timestamptz`。
- 状态字段：`status text not null check (...)`，禁止无约束自由文本。
- 平台字段：`platform text not null check (...)`。
- 存储来源：`storage_provider text not null check (...)`。
- 外部 ID：`external_id text`，并按业务增加唯一约束。
- 计数字段：`bigint not null default 0 check (... >= 0)`。
- 排序字段：`sort_order integer not null default 0`。
- 原始载荷：`raw_payload jsonb not null default '{}'::jsonb`，仅用于外部快照或不稳定结构。
- 软删除：默认不加。只有业务明确需要恢复或保留历史时才设计 `deleted_at`。

## API 设计规则

- `src/app/api/*/route.ts` 只做请求解析、鉴权、调用领域函数和响应映射；复杂业务逻辑必须下沉到 `src/lib/<domain>/*`。
- 每个 API 必须显式校验输入类型、长度、枚举值和 ID 格式，不能只依赖前端表单校验。
- 每个写接口必须明确认证与授权：未登录、无权限、资源不存在、冲突、服务不可用要返回可区分的错误状态。
- API 响应可以暴露稳定错误码和面向用户的中文文案；不得把数据库错误、堆栈、密钥、SQL 片段直接返回给客户端。
- 修改数据必须尽量做到幂等：重复投稿走唯一约束，重复点赞走唯一主键或冲突处理，浏览计数走去重键或 RPC。
- 使用 `service_role` 的 route 必须满足三点：仅服务端、最小用途、调用前自行完成资源可见性校验。默认优先使用普通 Supabase client 和 RLS。

## Supabase 与 RLS

- `public` 等暴露 schema 下的所有表必须启用 RLS。
- RLS policy 必须按表、操作、角色分别定义；禁止一个宽泛 policy 覆盖所有读写。
- `anon` 只允许读取明确公开的数据。
- `authenticated` 只允许读写自己的投稿、资料或互动记录。
- `service_role` 和 secret key 永远不能出现在浏览器、`NEXT_PUBLIC_*` 环境变量或客户端组件中。
- `security definer` 函数必须放在 `private` 等非暴露 schema，并设置固定 `search_path`。
- 公开 view 必须使用 `security_invoker = true` 或确认不会绕过 RLS；否则不得授权给 `anon` / `authenticated`。
- 授权判断不得依赖用户可自行修改的 `user_metadata`。管理员、角色、权限应来自数据库受控字段或 app metadata。
- 涉及用户对象访问的 API 必须防止对象级授权缺失：不能因为用户传了一个 ID 就读取或修改对应资源。

## 迁移流程

- 所有 schema 变更必须进入 `supabase/migrations/*`，禁止只在 Supabase Dashboard 手改后不落库。
- 每个 migration 必须聚焦一个主题，文件名表达业务目的。
- DDL migration 必须包含约束、索引、RLS、grant/revoke、policy 的完整配套；不能只建表不设权限。
- 数据修复 migration 与结构 migration 尽量分离。
- 涉及生产数据的修复必须说明可重复执行性和回滚思路。

新增表后必须检查：

- 主键、外键、唯一约束、`check` 约束是否齐全。
- RLS 是否启用。
- `anon` / `authenticated` / `service_role` grants 是否最小化。
- 过滤、排序、外键、RLS 常用列是否有索引。

## 查询与性能

- 公开列表查询必须分页；禁止无上限读取全表。
- 查询必须显式选择字段，避免在公开读取路径使用 `.select("*")`。
- 需要按 `published_at`、`category_id`、`user_id`、外键、状态、创建时间过滤或排序时，必须评估索引。
- RLS policy 中用到的列也要评估索引。
- 复杂筛选优先用清晰的关系表和索引。
- 只有在真实查询瓶颈出现并有验证数据时，才考虑物化视图、冗余字段或搜索表。

## 环境变量与密钥

- 配置必须来自环境变量，不能硬编码。
- 只有可公开的 Supabase URL、publishable key 或 anon key 可以使用 `NEXT_PUBLIC_*`。
- `SUPABASE_SERVICE_ROLE_KEY`、COS Secret、签名密钥只能在 server-only 模块中读取。
- 新增环境变量必须同步更新示例说明或部署文档，并说明是否公开、是否必填、在哪些 route 使用。

## 数据库设计输出模板

每次数据库设计必须按以下顺序输出：

1. 业务对象清单。
2. 对象关系和关联基数。
3. 字段归属与外键位置。
4. 核心设计理由。
5. 范式检查。
6. 反范式说明，如没有则明确写“无”。
7. 表结构草案。
8. RLS / 权限策略。
9. 索引与查询路径。
10. 验证方式。

## 验证要求

- 修改 `.ts`、`.tsx`、Supabase client、API route、migration 或 TypeScript 相关配置后，必须运行 `npm run type-check`。
- 涉及代码质量或工程配置时，还必须运行 `npm run lint`。
- 仅修改 Markdown 文档时，可以不运行 type-check，但最终回复必须明确说明未运行的原因。
- 如果涉及真实 Supabase 项目变更，还必须运行对应 SQL 验证、RLS/grant 检查和 advisor 检查。
