const TRANSLATED_ATTR = 'data-ai-ctx-translated';
const TRANSLATING_ATTR = 'data-ai-ctx-translating';

export class ViewportTranslator {
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.options = {
      threshold: 0.05,
      rootMargin: '100px',
      delayMs: 500,
      maxConcurrent: 3,
      ...options,
    };
    this.observer = null;
    this.queue = [];
    this.running = 0;
    this.pendingTimers = new WeakMap();
  }

  async start() {
    const settings = await this.getSettings();
    if (!settings.autoTranslate) {
      console.log('[AI Translator] 自动翻译已关闭');
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => this.handleIntersection(entry));
    }, {
      root: null,
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold,
    });

    this.observeCurrentElements();
    this.observeMutations();
  }

  async getSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
      return { autoTranslate: false, ...(result.settings || {}) };
    } catch (e) {
      return { autoTranslate: false };
    }
  }

  observeCurrentElements() {
    const elements = this.adapter.getTranslatableElements();
    console.log('[AI Translator] 扫描到可翻译元素:', elements.length);
    elements.forEach((el) => this.observeElement(el));
  }

  observeElement(el) {
    if (!el || el.hasAttribute(TRANSLATED_ATTR) || el.hasAttribute(TRANSLATING_ATTR)) return;
    this.observer.observe(el);
  }

  observeMutations() {
    const body = document.body;
    if (!body) return;

    const mutationObserver = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        this.observeCurrentElements();
      }
    });

    mutationObserver.observe(body, { childList: true, subtree: true });
  }

  handleIntersection(entry) {
    const el = entry.target;

    if (entry.isIntersecting) {
      console.log('[AI Translator] 元素进入视口:', el.tagName);
      const timer = setTimeout(() => this.enqueue(el), this.options.delayMs);
      this.pendingTimers.set(el, timer);
    } else {
      const timer = this.pendingTimers.get(el);
      if (timer) {
        clearTimeout(timer);
        this.pendingTimers.delete(el);
      }
    }
  }

  enqueue(el) {
    if (el.hasAttribute(TRANSLATED_ATTR) || el.hasAttribute(TRANSLATING_ATTR)) return;
    this.queue.push(el);
    this.processQueue();
  }

  async processQueue() {
    if (this.running >= this.options.maxConcurrent || this.queue.length === 0) return;

    this.running++;
    const el = this.queue.shift();

    try {
      await this.translateElement(el);
    } catch (err) {
      console.error('[AI Translator] 自动翻译失败:', err);
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  async translateElement(el) {
    el.setAttribute(TRANSLATING_ATTR, 'true');
    console.log('[AI Translator] 开始翻译元素:', el.tagName);

    const { text, context } = this.adapter.extractTextAndContext(el);
    if (!text) {
      console.log('[AI Translator] 元素无文本，跳过');
      el.setAttribute(TRANSLATED_ATTR, 'true');
      return;
    }

    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE',
      payload: { text, context },
    });

    if (!response.success) {
      el.removeAttribute(TRANSLATING_ATTR);
      console.error('[AI Translator] 自动翻译失败:', response.error);
      return;
    }

    this.renderTranslation(el, response.data.translation);
    el.removeAttribute(TRANSLATING_ATTR);
    el.setAttribute(TRANSLATED_ATTR, 'true');
    console.log('[AI Translator] 元素翻译完成');
  }

  renderTranslation(el, translation) {
    const existing = el.nextElementSibling?.classList?.contains('ai-ctx-translation');
    if (existing) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'ai-ctx-translation';
    wrapper.textContent = translation;

    if (el.parentNode) {
      el.parentNode.insertBefore(wrapper, el.nextSibling);
      console.log('[AI Translator] 翻译结果已插入到帖子卡片之后');
    } else {
      el.appendChild(wrapper);
    }
  }
}
