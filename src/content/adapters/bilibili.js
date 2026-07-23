import { BaseAdapter } from './base.js';

export class BilibiliAdapter extends BaseAdapter {
  getHostnames() {
    return ['bilibili.com', 'bilibili.tv'];
  }

  findPostCard(target) {
    return target.closest(
      '.video-title, .desc-info, .reply-item, .reply-wrap, .comment-item, .reply-list-item'
    );
  }

  getTranslatableElements() {
    const selectors = [
      // 视频页标题
      '.video-title',
      // 视频页简介
      '.desc-info',
      // 评论区
      '.reply-item',
      '.reply-wrap',
      '.comment-item',
      '.reply-list-item',
    ];
    return Array.from(document.querySelectorAll(selectors.join(', ')));
  }

  extractTextAndContext(postCard) {
    if (!postCard) return { text: '', context: '' };

    // 视频标题
    if (postCard.classList.contains('video-title') || postCard.matches('h1.video-title')) {
      const text = postCard.textContent?.trim() || postCard.getAttribute('title')?.trim() || '';
      return { text, context: '类型：视频标题' };
    }

    // 视频简介
    if (postCard.classList.contains('desc-info')) {
      const text = postCard.textContent?.trim() || '';
      return { text, context: '类型：视频简介' };
    }

    // 评论
    const userEl = postCard.querySelector('.user-name, .name, .reply-user-name, .sub-user-name');
    const user = userEl?.textContent?.trim() || '';

    const contentEl = postCard.querySelector('.reply-content, .text, .root-reply');
    const text = contentEl?.textContent?.trim() || postCard.textContent?.trim() || '';

    const likeEl = postCard.querySelector('.like-text, .reply-like-text, .support');
    const likes = likeEl?.textContent?.trim() || '';

    const contextParts = [];
    if (user) contextParts.push(`用户：${user}`);
    if (likes) contextParts.push(`点赞：${likes}`);

    return {
      text,
      context: contextParts.join(' | '),
    };
  }

  attachFloatButton(postCard, onTranslate) {
    this.attachGenericFloatButton(postCard, onTranslate, 'ai-ctx-bilibili-float-btn');
  }
}
