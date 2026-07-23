# AI Context Translator 项目方案

## 1. 项目概述

**项目名称**：AI Context Translator（暂名，可替换）  
**定位**：面向 Reddit、日本 5ch、国内 B 站等社区网站的 AI 语境化翻译浏览器扩展。  
**核心差异**：
- 接入用户自有的 AI API Key，不依赖固定翻译引擎。
- 不只是直译，而是结合网页上下文解释梗、俚语、社区黑话和文化背景。
- 通过「只翻译当前窗口可见内容」和本地缓存，显著降低 token 消耗。

## 2. 目标用户与场景

| 场景 | 示例 |
|---|---|
| 浏览 Reddit 热门帖子 | 翻译标题、正文、评论，解释 subreddit 内部梗 |
| 浏览日本 5ch | 翻译楼层，解释日式网络用语、缩写、梗 |
| 浏览 B 站评论区 | 翻译评论，解释弹幕/社区黑话 |
| 学习外语社区文化 | 通过「梗解释模式」理解深层含义 |

## 3. 核心功能

### 3.1 多种翻译触发方式

| 触发方式 | 说明 | 适用场景 |
|---|---|---|
| 划词翻译 | 选中文字后弹出翻译按钮 | 任意可选中文字 |
| 右键菜单翻译 | 右键任意元素，取 `textContent` 或 `aria-label` | 按钮、链接、不可选中标题 |
| 悬浮翻译按钮 | 鼠标悬停在帖子卡片/标题上出现小「译」按钮 | Reddit 主页卡片式标题 |
| 自动翻译可见内容 | 进入视口的段落/楼层自动翻译 | 长文、评论区 |
| 一键翻译当前可见 | Popup 中点击按钮，批量翻译当前屏幕内容 | 快速浏览 |

### 3.2 网页解析与正文提取

- **站点适配器**：为 Reddit、5ch、B 站等网站编写独立适配器，识别帖子卡片、楼层、评论、正文容器。
- **通用兜底**：未适配页面使用 Mozilla Readability 算法提取正文。
- **楼层识别启发式**：通过 DOM 重复结构检测自动识别评论区楼层。

### 3.3 AI 语境化翻译

- 不只做语言转换，还要求 AI：
  - 解释梗、俚语、缩写、双关、文化引用。
  - 保留原文语气（讽刺、调侃、愤怒等）。
  - 说明社区黑话在特定平台中的含义。
  - 对不确定的内容标注「不确定」。

### 3.4 结果展示方式

| 模式 | 效果 |
|---|---|
| 双语模式（默认） | 原文下方显示译文，上下对照 |
| 替换模式 | 原文被译文替换，悬停显示原文 |
| 悬浮提示模式 | 鼠标悬停才显示译文 |

### 3.5 成本优化

- **只翻译可见内容**：用 Intersection Observer 监听视口，只翻译进入屏幕的元素。
- **本地缓存**：按文本 hash 缓存翻译结果，24 小时内不重复请求。
- **缓存按语言隔离**：不同目标语言的缓存使用不同 key，切换语言不命中旧缓存。
- **文本预处理**：过滤 URL、合并空白、去除零宽字符。
- **模型可选**：支持 gpt-3.5-turbo、deepseek-chat、gemini-1.5-flash 等低价模型。
- **并发与防抖**：限制最多 3 个同时请求，滚动过快时取消已离开视口的任务。
- **主页只翻译标题**：在帖子列表页（如 5ch.io 主页、小红书信息流）只翻译标题，减少 token。

## 4. 技术架构

### 4.1 技术栈

- **扩展框架**：Chrome Extension Manifest V3
- **构建工具**：Vite + CRXJS
- **前端样式**：原生 CSS 或 Tailwind CSS
- **DOM 提取**：自研适配器 + `@mozilla/readability`
- **AI 调用**：原生 fetch，统一封装多模型接口
- **存储**：`chrome.storage.local`（配置、缓存）

### 4.2 模块结构

```
ai-context-translator/
├── public/
│   └── manifest.json
├── src/
│   ├── background/
│   │   └── background.js           # Service Worker — API 调用、缓存、跨标签通信、右键菜单
│   ├── content/
│   │   ├── adapters/               # 网站适配器
│   │   │   ├── base.js
│   │   │   ├── reddit.js
│   │   │   ├── _5ch.js
│   │   │   ├── bilibili.js
│   │   │   └── xiaohongshu.js
│   │   ├── adapter-manager.js      # 适配器注册与匹配
│   │   ├── content.js              # 内容脚本入口（划词、悬浮按钮、弹窗渲染）
│   │   └── viewport-translator.js  # 可见区域自动翻译
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   ├── utils/
│   │   ├── ai-client.js            # 统一 AI 调用
│   │   ├── cache.js                # 本地缓存（按语言隔离）
│   │   ├── hash.js                 # 文本 hash
│   │   ├── prompts.js              # 多语言 prompt 模板
│   │   └── usage.js                # Token 用量统计
│   └── styles/
│       └── content.css             # 内容脚本注入样式
├── dist/                           # 构建输出（gitignore）
├── docs/
│   └── SPEC.md
├── .gitignore
├── LICENSE
├── package.json
├── vite.config.js
└── README.md
```

## 5. 关键功能详细设计

### 5.1 Reddit 主页标题按钮处理

Reddit 当前帖子标题常被包裹为不可选中的按钮/链接：

```html
<shreddit-post>
  <a href="/r/xxx/comments/..." data-testid="post-title-text">
    <h3>帖子标题</h3>
  </a>
</shreddit-post>
```

解决方案：
1. 事件委托监听点击，通过 `closest('shreddit-post')` 定位帖子卡片。
2. 提取标题、subreddit、作者、点赞数、flair 作为上下文。
3. 鼠标悬停时在卡片右上角显示「译」按钮。
4. 右键菜单可直接翻译当前元素。

### 5.2 可见区域自动翻译

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const timer = setTimeout(() => translateElement(entry.target), 500);
      entry.target.dataset.translateTimer = timer;
    } else {
      clearTimeout(entry.target.dataset.translateTimer);
    }
  });
}, {
  root: null,
  rootMargin: '200px',
  threshold: 0.3
});
```

流程：
1. 页面加载后识别正文/评论容器。
2. 把容器拆分为段落/楼层/帖子卡片等翻译单元。
3. 用 Intersection Observer 监听每个单元。
4. 元素进入视口并停留 500ms 后触发翻译。
5. 先查本地缓存，未命中再请求 AI。
6. 元素离开视口时取消待执行的翻译任务。
7. 对动态加载内容（如 Reddit 无限滚动），监听容器子节点变化并自动加入观察。

### 5.3 AI Prompt 模板

Prompt 根据目标语言动态生成：
- 目标为中文（zh-CN/zh-TW）→ 用中文 prompt
- 目标为其他语言 → 用英文 prompt

**直译模式（默认）**：
```
你是一位熟悉各国网络社区文化的翻译助手。请将以下文本翻译成中文。

要求：
1. 翻译要自然口语化，符合中文社区表达习惯。
2. 只做准确、自然的中文翻译，让中文读者能直接理解原意。不解释梗、背景或语气，不要添加额外说明。

原文：
{text}
```

**梗解释模式**：在翻译的同时解释梗、俚语、社区黑话和文化背景。

可配置人设：
- 直译模式（默认，最省 token）
- 平衡模式（翻译 + 简要解释）
- 梗解释模式（重点解释）

## 6. 成本估算

| 场景 | 估算 |
|---|---|
| Reddit 一条短评论 | 约 50~200 tokens |
| 5ch 一个楼层 | 约 100~300 tokens |
| B 站一条评论 | 约 50~200 tokens |
| 使用 deepseek-chat / gpt-3.5-turbo | $0.5~$2 可翻译数千条 |
| 配合缓存和可见区域翻译 | 实际成本可降低 50%~80% |

## 7. 开发状态

### 已完成
- [x] Manifest V3 + Vite 扩展框架搭建
- [x] 划词翻译 + 结果浮层
- [x] AI API 调用（支持 OpenAI / DeepSeek / Gemini / 自定义）
- [x] 本地翻译缓存（按语言隔离，24h TTL）
- [x] Popup 快速翻译 + Token 用量统计
- [x] Options 设置页面（API Key、服务商、模型、翻译模式、目标语言、自动翻译开关）
- [x] 右键菜单翻译
- [x] Reddit 适配器（主页帖子卡片 + 详情页 + 评论）
- [x] 5ch 适配器（主页帖子列表 + 详情页楼层）
- [x] Bilibili 适配器（视频标题 + 简介 + 评论）
- [x] 小红书适配器（信息流卡片 + 详情页 + 评论）
- [x] 可见区域自动翻译（Intersection Observer）
- [x] 多语言目标（9 种语言）
- [x] Reddit 帖子卡片悬浮翻译按钮
- [x] 主页只翻译标题（5ch/小红书信息流）

### 待完成
- [ ] 流式输出
- [ ] 自定义用户 prompt 模板
- [ ] Chrome Web Store 上架
- [ ] Edge / Firefox 支持

## 8. 用户设置项

| 设置项 | 默认值 | 选项 | 说明 |
|---|---|---|---|
| 服务商 | OpenAI | OpenAI / DeepSeek / Gemini / 自定义 | 选择后自动填充 API URL 和推荐模型 |
| API URL | （随服务商变化） | — | OpenAI 兼容接口地址 |
| 模型 | gpt-3.5-turbo | （随服务商变化） | AI 模型名称 |
| Temperature | 0.7 | 0~2 | AI 输出随机性 |
| Max Tokens | 1024 | 100~4096 | 单次最大 token |
| API Key | 空 | — | 用户自填，仅存在本地 |
| 翻译模式 | 直译模式 | 直译 / 平衡 / 梗解释 | 翻译输出风格 |
| 目标语言 | 简体中文 | 9 种语言 | 翻译结果输出语言 |
| 自动翻译 | 关闭 | 开/关 | 是否开启可见区域自动翻译 |

## 9. 风险与对策

| 风险 | 对策 |
|---|---|
| AI API 费用 | 默认低价模型，提供用量统计 |
| 网站改版导致适配失效 | 选择器规则可热更新，允许用户自定义适配器 |
| 长文本超时 | 分段翻译 + 流式输出 |
| 频繁滚动触发大量请求 | 防抖、并发限制、缓存 |
| AI 胡编梗解释 | prompt 要求不确定时标注，后续可加入置信度 |
| 隐私合规 | API Key 和翻译内容只存在本地，不上传第三方服务器 |

## 10. 开源建议

- **License**：MIT（宽松，便于社区贡献）。
- **README**：包含 GIF 演示、安装方式、支持网站、API 配置、成本说明。
- **Issue 模板**：网站适配请求、翻译质量问题、Bug 报告、功能建议。
- **贡献指南**：重点说明如何新增网站适配器和本地调试方法。
- **代码规范**：ESLint + Prettier，提交前跑测试。

## 11. 后续可扩展方向

- 流式输出（已计划）。
- 支持本地模型（Ollama、LM Studio）。
- 支持 Edge / Firefox。
- 支持翻译历史记录导出。
- 支持用户自定义 prompt 模板。
- 支持网页截图 + 多模态模型翻译（梗图翻译）。

---

**文档版本**：v2.0  
**最后更新**：2026-07-23  
**仓库地址**：_[等待上传后填写]_
