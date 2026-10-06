# 前端与设计系统规则

本文件用于约束页面、组件、样式、交互和可见文案。凡是任务涉及 `src/app/*` 页面、`src/components/*`、Tailwind class、设计还原、空状态、弹窗、表单或可见文案，都必须先读取本文件。

## 设计系统总原则

当前项目的设计规范以根目录 [design.md](../../design.md) 为准，核心原则不可偏离：

- UI 外壳、控件、排版、装饰语言必须保持严格黑白系统。
- 视频封面、作品缩略图、创作内容素材可以保留原始色彩。
- Bilibili / YouTube 来源品牌 SVG 保留原始品牌颜色，作为黑白 UI 系统的明确例外；不得改成 currentColor、单色路径或通过滤镜转成黑白。通用控件与其他图标仍沿用既有设计规则。
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

## 产品命名与文案

- 内容对象统一称为大写 `PV`，面向用户的页面、表单、状态、错误、分享图、通知及 aria-label / alt / title 不得混用“影像”“视频”“作品”等替代称呼。上传相关说明也使用“PV 文件”“PV 格式”。
- 中文与 `PV` 之间保留一个空格，计数统一为“12 个 PV”。公开内容入口称“PV”，个人收藏页、导航及账户菜单入口称“我的收藏”，不再使用“档案”“我的档案”“个人中心”作为个人收藏入口名称。
- 产品硬编码文案不使用中文句号 `。` 或英文句末句点 `.`，覆盖按钮、标题、说明、状态、错误、通知、分享图及 aria-label / alt / title。多句说明优先缩短，必要时使用逗号、分号或换行；URL、文件名、版本号和小数中的点保留。
- 本规则针对产品硬编码文案。真实内容的标题、简介、作者名、分类和标签按原文展示；代码标识符、路由、协议、数据库字段和 MIME 保持技术语义，不做机械替换。
- 文案面向 PV 动画设计师，直接描述可执行的操作、当前结果和下一步。上传方式称“本地上传”，站内来源称“站内 PV”；不得把 COS、Hero、Web Push、上传会话、对象路径或上传凭证等实现术语暴露到界面。存储方式不得被表述为“原创”等未经确认的创作归属。
- 本次统一的完整修改方案见 [design-consistency-change-spec.md](../../design-input/design-consistency-change-spec.md)；其中 PV 命名、我的收藏入口及文案无句号为本轮明确要求，其他样式调整按文档范围实施，不把尚未实施的方案当作现有行为。

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

## shadcn/ui 接入与维护

- 基础 UI 采用 shadcn/ui 的源码组合方式，交互原语统一选用 `radix-ui`；接入约定与来源见 [shadcn-ui.md](../shadcn-ui.md)。
- 保持 Tailwind 3、现有 Geist / Noto Sans SC 字体、黑白 token 和项目圆角，新增控件先适配这些约定。
- 业务居中弹窗复用 `DialogShell`；通用组合使用 `Dialog` 的 `Trigger`、`Content`、`Title`、`Description` 和 `Close`。焦点限制、Esc、背景隔离和滚动锁定交由 Radix 处理，业务层不得重复添加全局监听。
- 动作菜单复用 `DropdownMenu`，导航项通过 `DropdownMenuItem asChild` 组合 `Link`。菜单选项使用 `onSelect`，同时支持键盘与指针。
- 菜单打开弹窗时，先关闭菜单并将焦点返回触发按钮，再打开弹窗；弹窗关闭后回到同一按钮。
- `Button` 支持 `asChild`，保持单一交互元素，禁止嵌套按钮与链接。`IconButton` 复用 Button，必须提供可访问名称。
- `TextField` 组合 `Label` 与 `Input`，保留完整 input 属性、ref 和标签关联；不复制输入框骨架。
- 新组件的次级文字使用 `text-muted-foreground`。旧 `text-muted` 继续兼容；本项目 `muted` 表示文字颜色，导入上游 `bg-muted` 时必须改为 `bg-panel` 或 `bg-surface`，不得覆盖其现有含义。
- 错误、成功等状态继续通过图标与文字区分，`destructive` 也保持黑白，不复制上游红色默认值。
- 按需求添加组件；查看源码或 diff 后再合并，禁止使用批量覆盖命令改写已定制组件、全局样式或配置。
- 修改弹窗、菜单或触发器组合时，除类型检查和 lint 外，还要验证 Tab / Shift+Tab、方向键、Esc、焦点恢复、嵌套层及移动端显示。
- 标签页使用 Tabs；复选框、选择框、多行输入、一维滑杆分别使用 Checkbox、Select、Textarea、Slider。筛选操作通过 FilterButton / Toggle 组合，静态标签通过 Chip / Badge 展示。
- 桌面浮层使用 Popover，移动边缘面板使用 Sheet；业务层不得自行重复实现 Esc、焦点循环、背景隔离或 body 滚动锁定。响应式抽屉进入桌面布局时必须关闭。
- 从 Sheet 打开其他弹窗时，等待 onCloseAutoFocus 完成后启动业务回调；标签页内不要用 autoFocus 覆盖触发器的键盘焦点。
- DialogShell 内禁止输入框 React autoFocus 抢在 Radix 焦点记录之前执行；默认交由 FocusScope 聚焦，以保证关闭后恢复打开元素。
- Slider 的 aria-valuetext 等数值属性只放在 Thumb 上，禁止放在无 slider 角色的 Root 容器。RangeField 回调使用数值，连续变化与完成提交分别处理。
- 提示使用 Tooltip / Toast，通用状态使用 Alert / Skeleton / Progress。Toast 的可朗读文案不得全部放在带朗读排除属性的 Close / Action 内。
- Toast 关闭回调必须校验消息 id，避免退出动画中的旧提示清除新提示。
- 运行 `bun run test:browser` 验证跨组件交互。测试组件页面只放在 tests/ui，禁止将测试专用路由、模拟账号或数据写入入口留在公开主站。

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
