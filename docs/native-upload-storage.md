# 本地 PV 提交的存储访问地域

PV 与封面上传完成后，服务器必须独立检查 COS 原对象的大小、Content-Type 和 ETag，才能保存投稿。前端上传成功不能替代该检查。

## 历史与配置

PR #23 的生产部署 b3300be 没有根目录 vercel.json 地域配置。对其原生提交接口发出未登录请求，返回 401，x-vercel-id 为 hkg1::iad1，函数实际运行在美国 iad1。

提交 9205ec5 于 2026-10-06 00:37（北京时间）新增 vercel.json，将全站 Node.js 函数设为新加坡 sin1，用于降低 Supabase 查询的跨地域延迟。该配置于当日 18:25 随 PR #25 / e4d9992 发布；对应历史接口响应为 hkg1::sin1。这一发布中的 COS 客户端、存储配置、STS 签名代码未改变，提交接口只调整文案。

地域变更与随后 COS 连接超时存在时间关联，是本轮优先回退验证的变化；仅凭这项关联仍不能声称已经证明线路故障的全部原因。

## 上传接口的地域隔离

- /api/submissions/native/cos/upload-signature 和 /api/submissions/native/complete 显式导出 preferredRegion = "iad1"，恢复既有上传流程原来的运行地域
- 根目录 vercel.json 保留 sin1，其他页面和数据库读取继续沿用现有配置
- 不改变 COS 桶、COS 地域、浏览器上传路径、短期签名、公开播放地址、后台发布或数据库约束
- 保留 MOV/QuickTime 支持、上传结果复用、完成租约和幂等保存；不回滚已验证的上传功能修复
- 不启用 COS 全球加速，不新增环境变量或付费服务

## 验证与回滚

运行 type-check、lint、相关回归测试和生产构建，再确认部署后的两个接口响应中函数执行地域为 iad1。原生提交必须经管理员登录后实际验证返回 201，不能以部署 READY 或未登录 401 检查代替完整提交成功。

HEAD 失败日志包含目标 Host、VERCEL_REGION、耗时和错误码，不包含密钥、Authorization 或投稿文案，用于区分实际执行地域和网络失败阶段。

若发布平台不支持逐接口地域或部署失败，不改变当前生产别名；按实际构建错误调整方案。代码回滚仅需移除两个接口的 preferredRegion，回到根目录的默认地域配置，不删除任何上传对象或投稿。

参考：[Next.js 15 Route Segment Config](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config)、[Vercel 请求地域标识](https://vercel.com/docs/headers/request-headers)。
