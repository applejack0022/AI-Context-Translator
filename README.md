# AI Context Translator

> **AI-powered contextual translation for online communities.**  
> Translate Reddit, 5ch, Bilibili, Xiaohongshu with AI that understands memes, slang, and cultural context — not just literal word-for-word translation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-brightgreen)

---

## ✨ Features

### Translation Methods
| Method | Description |
|---|---|
| **Selection Translate** | Select any text, click the floating "译" button |
| **Context Menu** | Right-click any element → "Translate" |
| **Hover Button** | Hover over a post card / comment to reveal a translate button |
| **Auto Viewport** | Automatically translates visible content as you scroll (optional) |

### Supported Websites
| Site | Details |
|---|---|
| **Reddit** | Post feed, detail pages, comments |
| **5ch (日本)** | Board thread list (`5ch.io`), detail pages, each reply |
| **Bilibili (B站)** | Video titles, descriptions, comments |
| **Xiaohongshu (小红书)** | Feed note cards, note detail pages, comments |
| **Any website** | Selection & context-menu translate work everywhere |

### AI-Powered Translation
- Bring your own **API Key** (OpenAI / DeepSeek / Gemini / custom)
- **9 target languages**: 简体中文, 繁體中文, English, 日本語, 한국어, Français, Deutsch, Español, Русский
- **3 translation modes**:
  - **Literal** — Accurate & natural translation only, no explanations (saves tokens)
  - **Balanced** — Translation + brief explanation of memes/slang/cultural references
  - **Explain** — Focus on explaining the context, tone, and inside jokes
- Translation prompt adapts to your target language automatically

### Cost-Saving Design
- **Viewport-aware**: Only translates content currently visible on screen
- **Local cache**: Same text won't be retranslated within 24 hours (per language)
- **Text preprocessing**: Strips URLs, whitespace, zero-width characters before sending
- **Concurrency control**: Max 3 simultaneous AI requests
- **Cheap models**: Works great with `deepseek-chat`, `gpt-3.5-turbo`, `gemini-1.5-flash`
- **Token usage stats**: Track daily & total token consumption in the popup

---

## 🚀 Installation

### Chrome Web Store
_Coming soon_

### Manual (Developer Mode)
1. Clone the repo:
   ```bash
   git clone https://github.com/yourname/ai-context-translator.git
   cd ai-context-translator
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build:
   ```bash
   npm run build
   ```
4. Open `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select the `dist/` folder.

---

## ⚙️ Configuration

1. Click the extension icon → **Open settings**
2. Fill in your **API Key**
3. Select your **provider** (OpenAI / DeepSeek / Gemini / Custom)
4. Choose your **target language**
5. Pick a **translation mode**
6. (Optional) Enable **Auto Translate** for viewport-aware translation
7. Click **Save**

### Recommended Models (Cheapest)
| Model | Provider | Notes |
|---|---|---|
| `deepseek-chat` | DeepSeek | Great quality, very cheap |
| `gpt-3.5-turbo` | OpenAI | Reliable, widely available |
| `gemini-1.5-flash` | Gemini (OpenAI compatible) | Free tier available |

---

## 📁 Project Structure

```
ai-context-translator/
├── src/
│   ├── background/        # Service Worker — API calls, cache, messaging
│   ├── content/           # Content scripts
│   │   ├── adapters/      # Site-specific adapters
│   │   │   ├── base.js
│   │   │   ├── reddit.js
│   │   │   ├── _5ch.js
│   │   │   ├── bilibili.js
│   │   │   └── xiaohongshu.js
│   │   ├── viewport-translator.js
│   │   └── content.js     # Entry point
│   ├── popup/             # Extension popup
│   ├── options/           # Settings page
│   ├── utils/
│   │   ├── ai-client.js   # Unified AI API client
│   │   ├── cache.js       # Local translation cache
│   │   ├── hash.js        # Text hashing
│   │   ├── prompts.js     # Multi-language prompt templates
│   │   └── usage.js       # Token usage tracking
│   └── styles/
├── dist/                  # Build output (generated)
├── docs/
│   └── SPEC.md            # Detailed specification (Chinese)
├── .gitignore
├── LICENSE
├── package.json
├── vite.config.js
└── README.md
```

---

## 🧩 How the Adapter System Works

Each supported website has a dedicated **adapter** that knows how to:
1. Identify post cards, comments, and content blocks on the page
2. Extract clean text from them (excluding votes, share buttons, metadata)
3. Provide context (author, subreddit, likes, etc.) for better AI translation

To add a new website, create a new file in `src/content/adapters/` and register it in `adapter-manager.js`. Each adapter extends the `BaseAdapter` class with 4 methods:
- `getHostnames()` — which domains to match
- `findPostCard(target)` — find the parent post/comment element
- `getTranslatableElements()` — get all translatable elements on the page
- `extractTextAndContext(postCard)` — extract clean text + context

---

## 🗺️ Roadmap

- [x] MVP: Selection translate, AI API, local cache
- [x] Popup & Options page
- [x] Reddit adapter (feed + detail + comments)
- [x] 5ch adapter (thread list + detail pages)
- [x] Bilibili adapter (titles, descriptions, comments)
- [x] Xiaohongshu adapter (feed + detail + comments)
- [x] Viewport-aware auto translate
- [x] Multi-language target support (9 languages)
- [x] Token usage stats
- [ ] Streaming output
- [ ] Custom user prompt templates
- [ ] Chrome Web Store release
- [ ] Edge / Firefox support

---

## 🤝 Contributing

Issues and PRs are welcome! If you'd like to add support for a new website, the adapter system makes it straightforward — just create a new adapter file.

---

## 📜 License

[MIT](./LICENSE) — free for personal and commercial use.

---

## ⚠️ Privacy

- Your API Key is stored **locally** in `chrome.storage.sync`
- Translated content is cached **locally** in `chrome.storage.local`
- **No data** is sent to any server other than the AI API you configure
- No analytics, no tracking, no third-party services
