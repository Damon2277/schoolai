# schoolAI Web

基于 React + TypeScript + Vite 的 `schoolAI` 前端原型，实现交互规范与视觉指南中的核心模块：

- AI 创作中心：快捷模板条、对话区、历史会话侧栏、多行输入区。
- 模板库：公共/自定义模板切换、模板卡片操作、新建/编辑/删除及应用流程。
- 设计令牌与主题：集中管理颜色、字体、圆角、阴影等视觉变量，保证界面一致性。

> 当前版本为界面与交互雏形，智能出题/批改模块后续与既有 PC 界面集成。

## 目录结构

```
schoolAI-web/
├── src/
│   ├── App.tsx           # 主界面与交互逻辑
│   ├── App.css           # 页面级样式
│   ├── styles/
│   │   ├── tokens.css    # 设计令牌（颜色/字体/间距等）
│   │   └── base.css      # 全局基础样式与工具类
│   ├── main.tsx          # 入口文件
│   └── index.css         # 引入基础样式
├── public/
├── package.json
└── README.md
```

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览构建包
npm run preview

# AI 调用（DeepSeek）示例
cp .env.example .env.local
# 编辑 .env.local，填入 VITE_DEEPSEEK_API_KEY
```

## 功能概览

- **AI 创作中心**
  - 快捷模板条：默认 3 个公共模板，可由自定义模板覆盖并支持取消恢复。
  - 历史会话侧栏：新建、重命名、删除、折叠/抽屉响应式。
  - 输入区：多行输入 + 快捷标签；点击「创作」即调用 DeepSeek API 生成结果并展示。
- **模板库**
  - 公共/自定义标签页切换，卡片展示名称、简介、更新时间、来源标签。
  - 模板应用：占位符弹窗填写 → 自动切换至创作中心并填入输入框，Toast 提示。
  - 自定义模板：新建/编辑/删除，设为快捷模板时保持 3 槽位规则。
- **视觉主题**：通过 `tokens.css` 管理主题色、渐变、字体、圆角、阴影，并在 `App.css` 中复用。

## 自测清单

1. `npm run build`：确保 TypeScript 编译与 Vite 构建通过。
2. 手动验证关键交互：
   - 快捷模板点击 → 占位符弹窗 → 填写后填入输入框并提示；
   - 历史会话新建/切换/删除、折叠抽屉在窄屏；
   - 模板库公共/自定义切换、新建模板、设为快捷、删除恢复默认。

> 当前未接入自动化测试框架。若需补充单测，可引入 Vitest/Testing Library，并针对模板操作、会话管理逻辑编写测试用例。

## 后续对接

- **效率模块**：智能出题 / 智能批改将复用现有 PC 界面，待对接后统一视觉与导航状态。
- **状态管理**：视后续数据接口情况，可抽离当前的本地 state 至 Zustand / Redux 或 React Query。
- **测试体系**：接入 Vitest + Testing Library，覆盖模板管理与快捷模板逻辑，保障后续迭代稳定性。

## 设计文档

详细视觉与交互规范存放于 `../docs/schoolAI_requirements.md`，包含色彩、排版、组件样式及交互线框，开发时可随时参考。
- 配置 DeepSeek：在根目录下创建 `.env.local` 并写入 `VITE_DEEPSEEK_API_KEY=你的密钥`，示例文件见 `.env.example`。
