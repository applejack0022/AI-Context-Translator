/**
 * 站点适配器基类。
 * 每个适配器负责识别特定网站的翻译单元，并提取上下文。
 */
export class BaseAdapter {
  /**
   * 返回适配器支持的域名列表。
   * @returns {string[]}
   */
  getHostnames() {
    return [];
  }

  /**
   * 判断当前页面是否由该适配器处理。
   * @returns {boolean}
   */
  match() {
    const hostnames = this.getHostnames();
    if (hostnames.length === 0) return false;
    return hostnames.some((h) => window.location.hostname.includes(h));
  }

  /**
   * 获取页面中所有可翻译的帖子/楼层/段落元素。
   * @returns {HTMLElement[]}
   */
  getTranslatableElements() {
    return [];
  }

  /**
   * 从单个翻译单元中提取文本和上下文。
   * @param {HTMLElement} element
   * @returns {{text: string, context: string}}
   */
  extractTextAndContext(element) {
    return { text: '', context: '' };
  }

  /**
   * 查找鼠标事件目标所属的帖子卡片/楼层元素。
   * @param {HTMLElement} target
   * @returns {HTMLElement|null}
   */
  findPostCard(target) {
    return null;
  }

  /**
   * 在帖子卡片上创建悬浮翻译按钮（可选实现）。
   * @param {HTMLElement} postCard
   * @param {Function} onTranslate
   */
  attachFloatButton(postCard, onTranslate) {
    // 子类可覆盖
  }

  /**
   * 通用悬浮按钮实现。子类可调用此方法，或自行覆盖。
   * @param {HTMLElement} postCard
   * @param {Function} onTranslate
   * @param {string} className
   */
  attachGenericFloatButton(postCard, onTranslate, className = 'ai-ctx-generic-float-btn') {
    if (!postCard || postCard.dataset.aiCtxFloatAttached === 'true') return;
    postCard.dataset.aiCtxFloatAttached = 'true';

    let btn = null;
    let hideTimer = null;

    const showBtn = () => {
      clearTimeout(hideTimer);
      if (btn && btn.isConnected) return;

      btn = document.createElement('button');
      btn.className = className;
      btn.textContent = '译';
      btn.title = '翻译此条';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { text, context } = this.extractTextAndContext(postCard);
        if (text) {
          onTranslate(text, context);
        }
      });

      btn.addEventListener('mouseenter', () => clearTimeout(hideTimer));
      btn.addEventListener('mouseleave', () => {
        hideTimer = setTimeout(() => btn?.remove(), 200);
      });

      const computed = window.getComputedStyle(postCard);
      if (computed.position === 'static') {
        postCard.style.position = 'relative';
      }
      postCard.appendChild(btn);
    };

    const hideBtn = () => {
      hideTimer = setTimeout(() => {
        if (btn) {
          btn.remove();
          btn = null;
        }
      }, 200);
    };

    postCard.addEventListener('mouseenter', showBtn);
    postCard.addEventListener('mouseleave', hideBtn);
  }
}
