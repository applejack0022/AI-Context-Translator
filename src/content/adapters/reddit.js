import { BaseAdapter } from './base.js';

const FLOAT_BTN_CLASS = 'ai-ctx-reddit-float-btn';

// 主页帖子卡片、详情页原帖、详情页评论的选择器
const POST_CARD_SELECTORS = 'shreddit-post, [data-testid="post-container"]';
const COMMENT_SELECTORS = 'shreddit-comment, [data-testid="comment"], [data-testid="comment-content"]';
const ALL_TRANS_SELECTORS = `${POST_CARD_SELECTORS}, ${COMMENT_SELECTORS}`;

export class RedditAdapter extends BaseAdapter {
  getHostnames() {
    return ['reddit.com'];
  }

  findPostCard(target) {
    return target.closest(ALL_TRANS_SELECTORS);
  }

  getTranslatableElements() {
    return Array.from(document.querySelectorAll(ALL_TRANS_SELECTORS));
  }

  extractTextAndContext(postCard) {
    if (!postCard) return { text: '', context: '' };

    // 同时支持 light DOM 和 Shadow DOM 查询
    const $ = (selector) => {
      const found = postCard.querySelector(selector);
      if (found) return found;
      if (postCard.shadowRoot) {
        return postCard.shadowRoot.querySelector(selector);
      }
      return null;
    };

    const $$ = (selector) => {
      const found = Array.from(postCard.querySelectorAll(selector));
      if (found.length > 0) return found;
      if (postCard.shadowRoot) {
        return Array.from(postCard.shadowRoot.querySelectorAll(selector));
      }
      return [];
    };

    // 判断是帖子还是评论
    const isComment = postCard.matches(COMMENT_SELECTORS);

    if (isComment) {
      return this.extractComment($, $$);
    }

    return this.extractPost($, $$, postCard);
  }

  extractPost($, $$, postCard) {
    // 标题选择器（按优先级）
    const titleSelectors = [
      'a[data-testid="post-title-text"]',
      'a[href*="/comments/"] h3',
      'a[href*="/comments/"] h2',
      'a[href*="/comments/"] span[data-testid="post-title-text"]',
      '[data-testid="post-title"]',
      'h3 a[id]',
      'h3',
      'h2',
    ];

    let title = '';
    for (const selector of titleSelectors) {
      const el = $(selector);
      const value = el?.textContent?.trim() || el?.getAttribute('aria-label') || '';
      if (value && value.length > 2) {
        title = value;
        break;
      }
    }

    // 正文摘要
    const bodyEl = $('[data-testid="post-content-text"], [slot="text-body"], [data-testid="outbound-link"]');
    const body = bodyEl?.textContent?.trim() || '';

    const text = body ? `${title}\n\n${body}` : title;

    if (!text) {
      // 兜底：克隆节点并移除元信息后再取文本
      return this.extractCleanFallback(postCard);
    }

    // 上下文
    const subredditEl = $$('a[href^="/r/"]')
      .find((a) => a.textContent?.trim().startsWith('r/'));
    const subreddit = subredditEl?.textContent?.trim() || '';

    const authorEl = $('a[href^="/user/"], a[href^="/u/"]');
    const author = authorEl?.textContent?.trim() || '';

    const flairEl = $('shreddit-flair, [data-testid="post-flair"]');
    const flair = flairEl?.textContent?.trim() || '';

    const contextParts = [];
    if (subreddit) contextParts.push(`社区：${subreddit}`);
    if (author) contextParts.push(`作者：${author}`);
    if (flair) contextParts.push(`标签：${flair}`);

    return { text, context: contextParts.join(' | ') };
  }

  extractComment($, $$) {
    const authorEl = $('a[href^="/user/"], a[href^="/u/"], [data-testid="comment-author-link"]');
    const author = authorEl?.textContent?.trim() || '';

    const bodySelectors = [
      '[data-testid="comment-content"]',
      '[data-testid="comment"] > div p',
      '.RichTextJSON-root',
      '[slot="comment"]',
      'p',
    ];

    let body = '';
    for (const selector of bodySelectors) {
      const el = $(selector);
      const value = el?.textContent?.trim() || '';
      if (value && value.length > 2) {
        body = value;
        break;
      }
    }

    const contextParts = [];
    if (author) contextParts.push(`作者：${author}`);

    return { text: body, context: contextParts.join(' | ') };
  }

  extractCleanFallback(postCard) {
    const clone = postCard.cloneNode(true);

    // 移除可能包含元信息的元素
    const removeSelectors = [
      'shreddit-vote-button',
      'faceplate-tracker',
      'faceplate-number',
      'faceplate-menu',
      '[data-testid="comment-button"]',
      '[data-testid="share-button"]',
      '[data-testid="crosspost-button"]',
      '[data-testid="more-options"]',
      'button',
      'a[href^="/r/"]',
      'a[href^="/user/"]',
      'a[href^="/u/"]',
      'shreddit-award',
      'shreddit-flair',
      'shreddit-share-button',
      'shreddit-crosspost-button',
    ];

    removeSelectors.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });

    const text = clone.textContent?.trim() || '';
    return { text, context: '' };
  }

  attachFloatButton(postCard, onTranslate) {
    if (!postCard || postCard.dataset.aiCtxFloatAttached === 'true') return;
    postCard.dataset.aiCtxFloatAttached = 'true';

    let btn = null;
    let hideTimer = null;

    const showBtn = () => {
      clearTimeout(hideTimer);
      if (btn && btn.isConnected) return;

      btn = document.createElement('button');
      btn.className = FLOAT_BTN_CLASS;
      btn.textContent = '译';
      btn.title = '翻译此帖子/评论';

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
