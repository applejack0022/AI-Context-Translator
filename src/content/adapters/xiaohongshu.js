import { BaseAdapter } from './base.js';

export class XiaohongshuAdapter extends BaseAdapter {
  getHostnames() {
    return ['xiaohongshu.com', 'xhslink.com'];
  }

  findPostCard(target) {
    return target.closest(
      '.note-item, .note-card, .feed-note-card, .note-container, .comment-item, .comment-card'
    );
  }

  getTranslatableElements() {
    const selectors = [
      // 信息流笔记卡片
      '.note-item',
      '.note-card',
      '.feed-note-card',
      // 详情页笔记容器
      '.note-container',
      // 评论
      '.comment-item',
      '.comment-card',
    ];
    return Array.from(document.querySelectorAll(selectors.join(', ')));
  }

  extractTextAndContext(postCard) {
    if (!postCard) return { text: '', context: '' };

    const isDetail = postCard.classList.contains('note-container');

    // 详情页：标题 + 正文
    if (isDetail) {
      const titleEl = postCard.querySelector('.title, .note-title');
      const title = titleEl?.textContent?.trim() || '';

      const bodyEl = postCard.querySelector('.desc, .note-desc, .content, .note-content');
      const body = bodyEl?.textContent?.trim() || '';

      const text = [title, body].filter(Boolean).join('\n\n');
      return { text, context: '类型：小红书笔记详情' };
    }

    // 信息流卡片：只翻译标题/描述
    if (
      postCard.classList.contains('note-item') ||
      postCard.classList.contains('note-card') ||
      postCard.classList.contains('feed-note-card')
    ) {
      const titleEl = postCard.querySelector('.title, .note-title, .desc, .note-desc');
      const title = titleEl?.textContent?.trim() || '';

      const authorEl = postCard.querySelector('.author, .author-name, .user-name');
      const author = authorEl?.textContent?.trim() || '';

      const contextParts = [];
      if (author) contextParts.push(`作者：${author}`);

      return { text: title, context: contextParts.join(' | ') };
    }

    // 评论
    const userEl = postCard.querySelector('.user-name, .author-name, .name');
    const user = userEl?.textContent?.trim() || '';

    const contentEl = postCard.querySelector('.comment-content, .content, .text');
    const text = contentEl?.textContent?.trim() || postCard.textContent?.trim() || '';

    const contextParts = [];
    if (user) contextParts.push(`用户：${user}`);

    return { text, context: contextParts.join(' | ') };
  }

  attachFloatButton(postCard, onTranslate) {
    this.attachGenericFloatButton(postCard, onTranslate, 'ai-ctx-xiaohongshu-float-btn');
  }
}
