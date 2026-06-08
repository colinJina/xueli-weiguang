# 前端与设计系统规则

本文件用于约束页面、组件、样式、交互和可见文案。凡是任务涉及 `src/app/*` 页面、`src/components/*`、Tailwind class、设计还原、空状态、弹窗、表单或可见文案，都必须先读取本文件。

## 设计系统总原则

当前项目的设计规范以根目录 [design.md](../../design.md) 为准，核心原则不可偏离：

- UI 外壳、控件、排版、装饰语言必须保持严格黑白系统。
- 视频封面、作品缩略图、创作内容素材可以保留原始色彩。
- 内容素材不得反向污染 UI token、按钮颜色、边框颜色、图标颜色或文本颜色。

## 颜色 token

```css
--bg-0: #000000;
--bg-1: #0A0A0B;
--bg-2: #111214;
--bg-3: #17181B;
--line-1: #232428;
--line-2: #2F3136;
--line-3: #FFFFFF1F;
--text-1: #FFFFFF;
--text-2: #C9CBD1;
--text-3: #8B8E97;
--text-4: #5F636B;
--white-soft: #F5F5F3;
--black-soft: #050505;
```

## 关键限制

- 不要给 UI 元素引入彩色按钮、彩色边框、彩色阴影或彩色发光。
- 不要使用高饱和渐变作为 UI 主背景。
- 优先通过灰阶、留白、字号、边框和体块关系建立层级。
- 主 CTA 可以使用白底黑字反转样式。
- 内容封面允许有颜色，但 UI 外壳和控件必须保持中立。

## 间距、圆角、阴影

- 使用 `4px` 基准栅格。
- 常用间距：`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`。
- 圆角：`sm = 10px`、`md = 14px`、`lg = 18px`、`xl = 24px`、`2xl = 32px`。
- 阴影：
  - `panel`: `0 6px 18px rgba(0,0,0,0.22)`。
  - `overlay`: `0 10px 30px rgba(0,0,0,0.28)`。
  - `hero`: `0 16px 48px rgba(0,0,0,0.36)`。

## Tailwind 使用规则

优先使用语义 token，而不是直接硬编码颜色：

```tsx
<div className="bg-background border-border text-foreground" />
```

避免：

```tsx
<div className="bg-black border-gray-700 text-white" />
```

禁止在 `globals.css` 写具体业务组件样式。`globals.css` 只能写滚动条样式、全局背景、全局字体等真正全局规则。

## 组件复用规则

- 优先复用 `src/components/ui/button.tsx`。
- 纯图标操作优先复用 `src/components/ui/icon-button.tsx`。
- 筛选项、标签、状态胶囊、计数胶囊和分页数字优先复用 `src/components/ui/chip.tsx`。
- 单行输入框优先复用 `src/components/ui/text-field.tsx`。
- 表单错误 / 成功 / 信息 / 加载提示优先复用 `src/components/ui/form-message.tsx`。
- 弹窗、认证面板、投稿面板等居中对话框优先复用 `src/components/ui/dialog-shell.tsx`。
- 页面结构优先复用 `TopNav`、`PageShell`、`PlaceholderPanel`。
- 品牌字样与站点标题优先复用 `src/components/layout/site-brand.tsx`。
- 视频详情页相关结构优先放入 `src/components/video/*`。
- 类名合并统一使用 `src/lib/utils.ts` 中的 `cn()`。

## 组件封装规则

- 同一段 Tailwind class 或同一控件骨架在 2 个以上文件出现时，必须抽成可复用组件或 `cva` variant。
- 同一交互角色出现 2 次以上时必须封装，例如图标按钮、筛选胶囊、表单输入框、弹窗关闭按钮、分页数字。
- 同一视觉语义出现 2 次以上时必须封装，例如状态提示、标签、计数、卡片角标、空状态提示。
- 需要统一 hover、focus、disabled、loading、active 状态的控件必须封装。
- 基础 UI 的颜色、圆角、边框、间距和状态表现应由 `src/components/ui/*` 控制。
- 如果已有基础组件缺少所需样式，先扩展该组件的 `variant` 或 `size`，再在页面中复用。

## 占位与空状态

- 任何“暂未开放”、“敬请期待”、“即将上线”等占位场景禁止使用纯文案，必须至少包含 SVG 图标、轻量动画、骨架屏块或半透明视觉装饰之一。
- 状态提示必须用不同 SVG 图标区分，不能仅靠文字颜色或文案区分。
- 弹窗、对话框、抽屉、抽屉式面板的关闭按钮必须使用 SVG 图标，禁止使用字面 `×`、`✕`、`X` 等字符。
- 步骤指示器、进度条、分页器禁止仅用纯文字编号，应配合 SVG 圆点、横条或连接线等视觉元素。
- 暴露给最终用户的可见文案禁止出现内部任务编号或开发用词，例如 `Task 2`、`TODO`、`占位`、`待接入`、`Mock`、`Placeholder`。
- 表单提交按钮在禁用状态下禁止仅显示纯灰色文案，应附带禁用态图标或动态提示。
- 输入框 `placeholder` 仅用于示例输入内容，禁止承载业务状态说明。

## 字体

- 默认字体采用 Geist。
- Geist 字体统一通过 `geist/font/sans` 接入。
- 中文字符显式 fallback 到 `Noto Sans SC`，不要依赖隐式系统回退。
- 需要更粗字重时直接使用 `font-black` 或 `font-[900]`。
