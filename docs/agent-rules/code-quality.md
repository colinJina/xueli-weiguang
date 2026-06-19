# 代码质量与验证规则

本文件用于约束 TypeScript、ESLint、构建验证、Git hook 和最终回复。凡是任务涉及 `.ts`、`.tsx`、`tsconfig`、`next.config`、`tailwind.config`、ESLint、依赖脚本或工程配置，都必须先读取本文件。

## 常用命令

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run type-check
bun run check
```

## TypeScript 检查

- 任何涉及 `.ts`、`.tsx`、`tsconfig`、`next.config`、`tailwind.config` 或其他 TypeScript 相关配置的修改后，都必须执行 `bun run type-check`。
- 如果 `bun run type-check` 失败，必须先修复问题，或明确说明阻塞原因与失败输出的关键点。
- 在未执行必要检查前，不得声称任务“已完成”“已修复”或“可以提交”。

## ESLint 规则

- ESLint 配置入口固定为根目录 `eslint.config.mjs`，并保持 ESLint 9 flat config 方案。
- 基础规则集以 `eslint-config-next/core-web-vitals` 与 `eslint-config-next/typescript` 为准，不要自行退回 `.eslintrc*`。
- React 与 React Hook 规则交由 Next 官方规则集维护。
- 不要在未经明确要求的情况下关闭 `react-hooks/rules-of-hooks` 或 `react-hooks/exhaustive-deps`。
- TypeScript 文件中的未使用变量统一使用 `@typescript-eslint/no-unused-vars` 检查，并关闭基础 `no-unused-vars`。
- 允许以下划线 `_` 开头的变量、参数、捕获错误或解构占位符作为有意未使用。
- 类型导入优先使用 `import type`。
- 基础一致性规则至少保持 `curly` 与 `eqeqeq`。
- 修改 ESLint 规则、脚本或相关依赖后，必须重新执行 `bun run lint`。
- 如果改动涉及 TypeScript 相关文件或配置，还必须执行 `bun run type-check`。

## Git hook

- `.husky/*` 下的 Git hook 文件必须保持为可执行 shell 脚本格式。
- `.husky/*` 文件首行固定包含 `#!/usr/bin/env sh`。
- 不要把 Windows 专用命令写进 husky hook。

## 依赖与脚本

- 新增生产依赖前必须确认是否已有本地实现、浏览器 API、Next.js 或 Supabase 官方能力可满足需求。
- 不引入与当前 Node-only 约束冲突的 Python、`child_process` 或第三方 Bilibili wrapper。
- 修改 `package.json` scripts、依赖、ESLint、TypeScript、Next 或 Tailwind 配置后，至少运行 `bun run lint` 和 `bun run type-check`。

## 最终回复

- 最终回复必须明确说明是否运行 `bun run type-check`。
- 如果运行，说明结果。
- 如果未运行，说明原因，例如“仅修改 Markdown 文档”。
- 若验证失败，必须给出关键失败点和下一步处理建议。
