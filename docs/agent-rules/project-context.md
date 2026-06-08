# 项目上下文

本文件用于帮助代理快速理解仓库背景、阶段边界、技术栈和目录归属。凡是任务涉及新功能、跨模块改动、架构判断或不确定文件归属时，先读取本文件。

## 项目概览

`雪笠微光` 是一个以视频收藏、聚合展示与公开档案感呈现为目标的公开主站。当前仓库处于第一阶段，已有能力包括：

- Next.js 15 App Router 前端骨架。
- React 19 与 TypeScript 5。
- 严格黑白系统的设计 token。
- 静态首页首屏与精选内容区。
- Archive / Collections / Profile / Video 相关基础路由。
- 可复用的布局与基础 UI 组件。
- 视频详情页静态还原组件。
- Supabase 与 Bilibili 推荐投稿链路的公开主站部分。
- COS 原生视频相关链路的公开主站既有部分。

## 明确不包含的能力

除非用户明确要求重新定义架构，否则不要主动添加：

- 公开站内的后台审核界面，后台项目应保持在独立仓库。
- 举报系统。
- 评论系统。
- 隐藏下载页。
- 普通用户视频上传系统扩展。现有 COS 原生链路只按既有边界维护，不主动扩展为通用上传系统。
- 推荐系统或自动推荐算法。

## 核心数据边界

- 用户提交路径只解析链接并写入 `submissions`，不得调用 Bilibili。
- Bilibili 元数据抓取只允许在后台审核流程中延迟触发。
- 公开 Archive / Video 读取路径不得调用 Bilibili 接口。
- 公开读取只展示数据库中已发布、可公开的数据。

## 技术栈

- 框架：Next.js 15 App Router。
- 视图层：React 19。
- 语言：TypeScript 5。
- 样式：Tailwind CSS 3。
- 代码质量：ESLint 9 flat config。
- 工具库：`class-variance-authority`、`clsx`、`tailwind-merge`。
- 数据与鉴权：Supabase。
- 存储：腾讯云 COS 相关签名和对象访问逻辑。

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
npm run check
```

## 目录归属

```txt
src/
├── app/                     # App Router 页面与 route handlers
├── components/              # UI、布局和业务组件
├── config/                  # 站点导航与基础配置
└── lib/                     # 工具函数、数据访问、领域逻辑

supabase/
├── migrations/              # 数据库迁移
└── backups/                 # 人工保留的 schema 快照等备份材料

design-input/                # 需求与设计输入记录
docs/agent-rules/            # 代理协作规则子文档
```

路径别名：

- `@/*` 映射到 `src/*`。

## 业务模块归属

- 首页：`src/app/page.tsx`、`src/components/home/*`。
- Archive：`src/app/archive/*`、`src/components/archive/*`、`src/lib/videos/get-videos.ts`。
- Video 详情：`src/app/video/[id]/*`、`src/components/video/*`、`src/lib/videos/*`。
- 投稿：`src/app/api/submissions/*`、`src/lib/submissions/*`、`src/lib/bilibili/*`。
- 认证：`src/components/auth/*`、`src/lib/auth/*`、`src/lib/supabase/*`。
- 存储：`src/lib/storage/*`。
- 基础 UI：`src/components/ui/*`。
- 布局：`src/components/layout/*`。

## 当前优先级

1. 完善前端页面还原。
2. 抽取并复用组件。
3. 保持黑白设计系统一致。
4. 在明确要求后再接入数据层与业务链路。
5. 每次功能改动同步更新 `design-input` 下的需求文档。
6. 不在 `globals.css` 写业务组件样式。
7. 默认字体采用 Geist，中文显式 fallback 到 `Noto Sans SC`。
