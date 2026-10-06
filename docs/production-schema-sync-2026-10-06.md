# 前后台共用数据库结构核对记录

2026-10-06（北京时间）经用户明确批准，将缺失的应用结构迁移应用到 `xueli-weiguang-prod`，并修复开发库两处历史约束偏差。前台与后台共用数据库；此次不复制开发库业务内容，不执行色族收缩、恢复或测试内容导入。

## 环境与迁移映射

- 开发：`yqrnnfyzmxnqgnewrhas`
- 生产：`imddodkuwdxmcrqpuesg`

| 逻辑迁移 | 源文件版本 / 仓库 | 本次生产版本 |
| --- | --- | --- |
| realtime_video_palette_expand | 20261003071010 / 后台 | 20261006095732 |
| archive_video_feed_cursor | 20261003172811 / 前台 | 20261006095738 |
| set_video_collections | 20261004102616 / 前台 | 20261006095746 |
| archive_pgroonga_search | 20261005102628 / 前台 | 20261006095755 |
| archive_search_rls_indexes | 20261005104657 / 前台 | 20261006095802 |
| fix_native_submission_feature_conflict | 20261006090103 / 前台 | 20261006095809 |
| align_palette_and_external_video_constraints | 20261006095451 / 前台 | 20261006095828 |

源文件与远程版本存在历史时间戳映射，迁移按逻辑名称与实际结构核对，不能盲目从单独仓库重放历史 SQL。色板扩展从后台仓库的源文件应用，未复制该文件到前台重复维护。

新增对齐迁移不更新业务行：将 `tones.color_hex` 设为非空，并将外部 PV 的 `embed_url` 检查恢复为去除空白后非空，与既有源迁移和生产约束一致。两边执行后的实际定义相同。开发预检确认不存在空 HEX 或空外部嵌入地址。

色板扩展保留现有内容 ID、词条 ID、关联及旧发布 RPC；只对生产库自身的 HEX 做大小写规范化，为其色板初始化顺序，并保存本库的 private 恢复快照。生产预检确认不存在重复 HEX、非法 HEX 或超过五色的历史关联。

明确排除开发库 `publish_pvdex_dev_import_20261003`，该迁移导入测试内容，不属于结构发布。

## 结构与行为验证

- 比较 public/private 的 591 项主要定义：表及 RLS/权限、字段类型/默认值/非空性、约束、索引、触发器、函数源码及执行权限、policy、view、扩展、publication 和 schema 权限。
- 比较 218 项补充定义：列顺序/排序规则/列权限、表 owner/选项、默认权限；同时检查序列和枚举，按定义比较，不比较序列运行值。
- 两组比较均没有缺失、额外或实质差异。函数源码只规范化 CRLF/LF 后比较；不比较业务行、迁移历史时间戳、恢复快照内容、Supabase 管理的系统数据和环境密钥。
- 生产以 anon 调用 `get_archive_video_feed`、`search_archive_video_feed` 和 HEX 规范化辅助函数成功，分页结果符合限制。
- 验证 anon 无法调用收藏修改/本地投稿完成 RPC，也不能读取 private 恢复表；authenticated 保留收藏调用权，service_role 保留投稿完成调用权。
- public/private 应用表未启用 RLS 的数量为 0。
- 开发执行 `supabase/tests/native-submission-completion.sql` 通过，覆盖展示申请开/关、完成会话状态和冲突幂等，所有 fixture 回滚。生产未插入回归 fixture。
- 前台 `bun run type-check`、`bun run lint` 通过；全量 Vitest 为 27 个文件、206 项通过。

## Advisor 与实际环境边界

已执行生产 security/performance advisor。

- 两项已有安全配置提醒：[pg_net 位于 public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)、[Auth 未启用泄露密码保护](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)。本次未更改这两项配置。
- 性能提示包括 [8 项多条 permissive SELECT policy](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies) 和 [14 项尚未使用索引](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)；新搜索索引尚未经历实际流量。本次保留既有管理员/公开读取策略，未因提示改变权限语义或删除索引。

数据库迁移和只读行为已验证，PR 尚未合并；尚未在真实 iPhone 重新上传文件，也未完成真实管理员发布、COS 和多会话并发回归。这些限制不能用本地构建或 SQL 定义一致代替。
