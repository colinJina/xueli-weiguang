# shadcn/ui 接入约定

项目以 shadcn/ui 的源码组件模式完善已有设计系统。配置入口为根目录 `components.json`，基础控件位于 `src/components/ui`，交互原语由 `radix-ui` 提供。

## 已接入的组件

| 组件 | 职责 |
| --- | --- |
| `dialog.tsx` | Radix Dialog 的基础组合，包含 Portal、遮罩、标题、描述与关闭操作 |
| `dialog-shell.tsx` | 业务居中弹窗的统一外壳，适配通过父组件状态打开的弹窗与焦点恢复 |
| `dropdown-menu.tsx` | Radix 动作菜单，处理定位、碰撞避让、方向键、Esc 与焦点恢复 |
| `button.tsx` | 既有按钮变体、图标尺寸与 `asChild` 组合 |
| `icon-button.tsx` | 基于 Button 的圆形图标操作，保留 ghost / surface / soft 接口 |
| `input.tsx` / `label.tsx` | 输入框与标签的基础控件 |
| `text-field.tsx` | 组合 Input / Label，保留项目既有带标题输入框接口 |
| `tabs.tsx` | 登录、投稿、分享的标签页，统一方向键、Home / End、禁用项和面板关联 |
| `checkbox.tsx` / `toggle.tsx` | 收藏夹多选、精选开关与筛选按钮，保留受控状态及键盘操作 |
| `select.tsx` / `textarea.tsx` | 收藏备注的收藏夹选择和多行输入 |
| `slider.tsx` / `range-field.tsx` | 单轴数值滑杆，区分连续调整与最终提交 |
| `popover.tsx` / `sheet.tsx` | 桌面色盘、移动底部色盘与个人档案侧栏，统一 Portal、焦点与滚动管理 |
| `tooltip.tsx` | 视频色调提示，支持键盘、碰撞避让和 Portal，避免卡片裁切提示 |
| `toast.tsx` | 顶部消息的计时、朗读、暂停、恢复、Esc 与键盘入口 |
| `avatar.tsx` | 档案头像和图片加载失败时的文字回退 |
| `badge.tsx` / `chip.tsx` | 统一标签、计数与角标变体，Chip 作为兼容入口 |
| `card.tsx` / `skeleton.tsx` / `alert.tsx` / `progress.tsx` | 通用容器、加载骨架、表单提示和上传进度 |

DialogShell 挂载代表打开，卸载代表关闭。焦点管理对所有弹窗生效，原先按调用方选择启用的 `manageFocus` 已移除。通过状态打开时，在打开前记录焦点，在关闭后恢复；若原元素已卸载，不对失效元素执行操作。嵌套弹窗的焦点范围、背景隔离和滚动锁定由 Radix 统一维护。

收藏菜单通过 `onSelect` 记录业务操作，待菜单完成关闭、焦点回到触发器后打开收藏弹窗，避免菜单的关闭焦点覆盖弹窗的初始焦点。用户菜单与收藏菜单采用非模态菜单，保持外部区域可操作。

## 样式与语义映射

保留 Tailwind CSS 3，不套用上游 Tailwind 4 的 `@theme`、字体、圆角或动画配置。仅在 `tailwind.config.ts` 添加兼容语义，继续引用现有灰阶变量。

| shadcn 语义 | 项目映射 |
| --- | --- |
| background / foreground | `--bg-0` / `--text-1` |
| card / card-foreground | `--bg-2` / `--text-1` |
| popover / popover-foreground | `--bg-0` / `--text-1` |
| primary / primary-foreground | `--white-soft` / `--black-soft` |
| secondary / secondary-foreground | `--bg-1` / `--text-1` |
| accent / accent-foreground | `--bg-1` / `--text-1` |
| muted-foreground | `--text-2`，与旧 text-muted 等值 |
| input / border | `--line-1` |
| ring | 白色 20% 透明度，沿用按钮原有焦点环 |
| destructive / destructive-foreground | `--white-soft` / `--black-soft`，保持黑白 |

`muted` 是既有文字 token，继续兼容。导入上游组件时，把 `bg-muted` 按表面层级映射为 `bg-panel` 或 `bg-surface`，次级文字使用 `text-muted-foreground`。不得直接把 muted 改成背景色，或复制带 `hsl()` 的颜色定义覆盖当前完整色值。

业务卡片、首页与播放器继续使用项目组件；复杂控件按实际需求组合基础原语。新增组件的业务样式写在组件 Tailwind 类名中，全局样式不承载业务规则。

Bilibili / YouTube 来源 SVG 保留品牌原色：Bilibili 为 `#00A1D6`，YouTube 为 `#FF0033` 底色与白色播放图形。品牌识别不套用通用控件的黑白规则，迁移时不得将其改为 currentColor 或单色路径。

## 全站迁移边界

全部 `src/components` 模块均纳入检查。业务层不再直接创建 button、input、select、textarea、checkbox 或一维 range 控件；基础原语在 `ui/*` 中集中实现。原生 video / iframe、链接、语义容器、品牌 SVG、Motion 动画、ReactCrop 与二维饱和度 / 亮度取色区保持各自职责。

| 模块 | 迁移后的组合 |
| --- | --- |
| Auth | DialogShell、Tabs、TextField、Button、FormMessage、DropdownMenu |
| Archive | Toggle / FilterButton、Popover / Sheet、Slider、Checkbox、Tabs、Input、Textarea、Progress、Skeleton |
| User | Sheet、Avatar、Select、Textarea、Checkbox、Toggle、Input、Button、DialogShell、DropdownMenu |
| Video | Tabs、Tooltip、Button、DialogShell；播放与分享导出仍由原有业务模块负责 |
| Home / Layout / Push | 复用统一按钮、提示、菜单和对话框；通用信息容器使用 Card |
| Providers / UI | TooltipProvider、Toast 和上述基础原语，保留现有公开调用入口 |

二维取色区没有对应的 shadcn 控件，保留已实现的指针捕获、方向键、Shift 步长和可访问值。色相与精度使用 Slider；ARIA 数值属性仅放在 Thumb 上。`RangeField` 的 `onValueChange` / `onValueCommit` 使用数值，不再合成原生 input 事件。

移动档案侧栏在切换至桌面时关闭，释放滚动锁。抽屉打开其他弹窗时，在抽屉完成焦点恢复后启动业务回调。标签页切换不得通过输入框 autoFocus 抢走标签触发器焦点。

DialogShell 的输入框不使用 React autoFocus，避免在 Radix 记录打开元素之前抢先聚焦，导致关闭弹窗后无法恢复焦点。顶部消息按消息 id 处理关闭事件；退出动画中的旧消息不得关闭新消息。

## 可重复验证

- `bun run test`：全部已有领域单测和 jsdom 控件单测。
- 首次使用浏览器测试前运行 `bunx playwright install chromium`。
- `bun run test:browser`：先生成隔离生产构建，再运行桌面与 375px 移动端的全部浏览器测试。
- `tests/ui` 使用 Vite 挂载真实组件，仅用于测试，不加入 Next.js 页面路由。固定测试身份配置和 HTTP 拦截不连接生产账户。
- `tests/browser` 包含控件交互、错误保留、分享 PNG 导出、封面裁切、焦点、滚动、响应式显示、WCAG 检查及真实页面冒烟测试。
- 真实页面检查拦截写入请求；通知测试只打开设置，不申请通知权限或订阅。
- 浏览器生产构建使用 `NEXT_BROWSER_TEST=1` 与 `.next-browser`，避免开发服务的 `.next` 覆盖测试产物。失败截图、trace 和 HTML 报告在忽略目录中保留。

## 后续添加与更新

1. 检查现有组件是否已能表达需求。
2. 查看官方组件源码及依赖，选择 Radix 实现；新依赖仅在必要时添加。
3. 将颜色、圆角、图标、文案与 Tailwind 语法适配到项目规则，保留来源说明。
4. 在基础组件中扩展变体，再供业务组件复用；不维护两套同角色控件。
5. 更新需求文档，运行 `bun run type-check` 和 `bun run lint`，验证相关交互。

上游变更需要审查后合并。本地定制源码不会随依赖升级自动同步；禁止批量覆盖现有组件。

## 来源与许可

Dialog 与 DropdownMenu 的结构适配自以下 shadcn/ui 官方源码，样式、图标与导出范围已按项目需求调整：

- [Dialog 源码](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/dialog.tsx)
- [DropdownMenu 源码](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/dropdown-menu.tsx)
- [基础组件源码目录](https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/ui)：Tabs、Checkbox、Toggle、Select、Slider、Popover、Sheet、Tooltip、Avatar、Card、Alert、Progress、Skeleton、Badge 和 Textarea；均按 Tailwind 3、项目 token 和所需导出适配。
- [Toast 源码](https://github.com/shadcn-ui/ui/blob/main/apps/www/registry/new-york/ui/toast.tsx)：沿用 Radix 实现并组合已有顶部提示外观。
- [shadcn/ui 文档](https://ui.shadcn.com/docs)
- [Radix Dialog 文档](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Radix DropdownMenu 文档](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)

上游 [MIT 许可](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md) 保留如下：

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
