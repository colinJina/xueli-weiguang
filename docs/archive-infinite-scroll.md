# Archive 无限滚动

Archive 首屏由服务器输出 24 条作品，后续通过 `/api/archive/videos?stream=1&cursor=...` 按需续载。筛选 URL 可分享，旧页码链接归一为首批；默认不带 `stream` 的旧 API 和首页查询保持兼容。

## 数据读取

`get_archive_video_feed` 按 `published_at DESC,id DESC` 排序，以保留微秒精度的时间和 UUID 为游标，最多取批量大小加一条来判断 `hasMore`，不执行全量计数和 OFFSET。卡片所需的标签和色调仅查询当前批 ID，分类与标签字典保留现有短期缓存。公开接口不返回完整描述、播放器链接或头像。

RPC 使用 SECURITY INVOKER，固定 search_path 和 UTC 时区，遵循现有已发布作品 RLS。时间与 ID 必须成对提供；筛选和游标在 API/RPC 边界校验。复用发布时间、分类与发布时间的公开部分索引。

## 列表交互与性能

接近末尾时自动加载，并保留手动入口。单飞请求防止重复续载，合并时按 ID 去重；筛选变化会立即取消旧续载，过期响应不得覆盖新结果。续载失败保留已加载卡片并允许重试。界面显示已加载数量，不再将精确总数作为续载前置条件。

超过三批（72 条）后使用 TanStack Virtual 按行虚拟化，动态测量卡片高度，支持 1/2/3/4 列和各 3 行预渲染。焦点所在行保持挂载，悬浮/聚焦行和卡片提升层级，避免色点提示被相邻卡片遮挡。测量前预留高度，避免网格切换时滚动回跳。

前进后退使用最多两份、60 秒有效的内存结果缓存，虚拟行测量也短期缓存；离开路由与恢复过程中的滚动重置不得覆盖历史位置。动态高度重测可能对位置作小幅校正。已加载作品元数据仍随浏览量增长，虚拟化只限制 DOM/图片挂载量。

颜色匹配仍有计算开销，尤其是稀疏条件。后续优化应基于真实执行计划和延迟，不能用虚拟化替代服务端查询优化，也不提前添加冗余表或全量预加载。

## 安装与回滚

先安装后台维护的 `20261003071010_realtime_video_palette_expand.sql`，确保颜色辅助函数及 `video_tones.percentage/sort_order` 可用，再应用主站迁移 `supabase/migrations/20261003172811_archive_video_feed_cursor.sql`，最后发布前端。

迁移仅增加兼容 RPC、补齐已有索引和函数权限，不修改作品数据、RLS 策略或旧 RPC。前端回滚可直接恢复旧分页版本；通常保留兼容扩展即可，不需要删除新函数。

## 验证

`bun run type-check`、`bun run lint`、`bun run test` 验证类型、质量、游标边界、接口契约、取消/乱序/单飞/去重与重试。另用本地 PostgreSQL 的 10000 条已发布作品验证游标同时间排序、筛选、末尾、RLS 与权限。浏览器验证自动续载、失败重试、虚拟化过渡、响应式列数和返回恢复；这些结果不等同于生产压力测试。

2026-10-04 经用户授权，迁移已安装至 dev，版本与本地文件一致。真实匿名查询遍历 65 批、1539 条已发布作品，没有重复或遗漏，末尾状态正确；authenticated 数据库角色也能读取首批。真实 HTTP 检查首批与续批各 24 条、48 个唯一 ID、no-store、分类/标签/完全匹配颜色组合、非法游标 400 和旧接口总数兼容。真实页面加载 96 条时只挂载 27 张卡片；390px 单列挂载 4 张，没有横向溢出或浏览器运行错误。

81 个单测、类型检查与 lint 通过。生产构建在独立目录运行，避免影响其他本地开发服务；直接调用 Next 构建器，不重建此前放弃的 service worker。临时验证依赖已移除，业务新增依赖仅为固定版本的 TanStack Virtual。

迁移前后的 Advisor 项目和数量一致，没有新增提示。既有安全提示为 [pg_net 扩展位于 public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) 和 [泄露密码保护关闭](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)；既有性能提示为 [未使用索引](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) 和 [多条 permissive policy](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)。本次没有改变这些项目。
