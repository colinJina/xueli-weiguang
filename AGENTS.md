# AGENTS.md

本文件是 `雪笠微光` 仓库的代理入口。它只保留必须常驻的高优先级规则和子文档加载路由；细则维护在 `docs/agent-rules/*` 中，按任务类型渐进式读取。

Codex 会自动加载根 `AGENTS.md`。`docs/agent-rules/*` 不会自动加载，代理必须根据本文件的路由规则主动读取相关子文档后再行动。

## 常驻红线

- 当前仓库是公开主站，不要在没有明确指令的情况下扩展后台审核界面、举报、评论、隐藏下载页、推荐系统或普通用户上传系统。
- 公开提交路径只解析 Bilibili/youtube 链接并写入 `submissions`，不得调用 Bilibili/youtube。
- Bilibil/youtubei 元数据抓取只允许在后台审核流程中延迟触发。
- 公开 Archive / Video 读取路径不得调用 Bilibili/youtube 接口。
- UI 外壳、控件、排版、装饰语言必须保持严格黑白系统；内容封面可以保留原始色彩。
- 不在 `globals.css` 写业务组件样式；业务样式一律优先使用 Tailwind 和现有组件。
- 每次新增或修改功能，涉及变更的操作都要更新 `design-input` 下的需求文档。
- 涉及 TypeScript 代码或配置改动后，必须运行 `bun run type-check`；涉及代码质量或工程配置时还要运行 `bun run lint`。

## 渐进式加载路由

开始任务后，先判断任务类型，再读取对应子文档。任务跨多个模块时，读取所有相关文档。

| 任务类型 | 必须读取 |
| --- | --- |
| 不确定项目边界、目录归属、当前阶段、模块职责 | [project-context.md](docs/agent-rules/project-context.md) |
| 需求拆解、方案判断、vibecoding 协作、文档维护、跨模块改动 | [workflow-collaboration.md](docs/agent-rules/workflow-collaboration.md) |
| 页面、组件、Tailwind、设计系统、空状态、弹窗、表单、可见文案 | [frontend-ui.md](docs/agent-rules/frontend-ui.md) |
| API route、Supabase、Postgres、RLS、迁移、建表、存储签名、鉴权 | [backend-database.md](docs/agent-rules/backend-database.md) |
| TypeScript、ESLint、构建、依赖、脚本、husky、验证命令 | [code-quality.md](docs/agent-rules/code-quality.md) |

数据库相关需求有额外硬门槛：不得直接给表结构，必须先输出“业务对象 -> 对象关系和关联基数 -> 字段归属和外键位置 -> 核心设计理由 -> 范式检查 -> 反范式说明 -> 表结构草案”。

## 项目速览

- 项目：`雪笠微光`，视频收藏、聚合展示与公开档案感呈现的公开主站。
- 框架：Next.js 15 App Router。
- 视图层：React 19。
- 语言：TypeScript 5。
- 样式：Tailwind CSS 3。
- 质量工具：ESLint 9 flat config。
- 数据与鉴权：Supabase。
- 路径别名：`@/*` 映射到 `src/*`。

## 常用命令

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run type-check
bun run check
```

## 文档维护规则

- 根 `AGENTS.md` 只放加载路由、常驻红线和高频命令。
- 新增稳定规则时，优先写入最相关的 `docs/agent-rules/*` 子文档。
- 如果规则只适用于某个子目录，优先在该子目录新增更近的 `AGENTS.md` 或 `AGENTS.override.md`，不要污染根规则。
- 当用户纠正代理的重复错误时，把修正沉淀到对应子文档，并视情况补充根加载路由。

## 最终回复要求

- 简要说明改了哪些文件。
- 明确说明是否运行 `bun run type-check`，以及结果或未运行原因。
- 如果没有运行必要验证，不能声称任务已完成或可提交。
