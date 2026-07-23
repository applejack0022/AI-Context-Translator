import { BaseAdapter } from './base.js';

export class Ch5Adapter extends BaseAdapter {
  getHostnames() {
    return ['5ch.net', 'bbspink.com', '5ch.io'];
  }

  findPostCard(target) {
    return target.closest('.post, .res, .message, .thread, [data-id]');
  }

  getTranslatableElements() {
    return Array.from(document.querySelectorAll('.post, .res, .message, .thread, [data-id]'));
  }

  extractTextAndContext(postCard) {
    if (!postCard) return { text: '', context: '' };

    const isThreadList = postCard.classList.contains('thread');

    // 主页 thread 卡片：只翻译标题，正文在详情页翻译
    if (isThreadList) {
      const titleEl = postCard.querySelector('.thread_title');
      const title = titleEl?.textContent?.trim() || '';

      const posterEl = postCard.querySelector('.poster_info');
      const poster = posterEl?.textContent?.trim() || '';

      const contextParts = [];
      if (poster) contextParts.push(`作者：${poster}`);

      return { text: title, context: contextParts.join(' | ') };
    }

    // 详情页 post 楼层：提取楼层号 + 正文
    const numberEl = postCard.querySelector('.postid, .number, .resnum, [data-num]');
    const number = numberEl?.textContent?.trim() || '';

    const uidEl = postCard.querySelector('.uid, .postusername, .name, .postername');
    const uid = uidEl?.textContent?.trim() || '';

    const bodyEl = postCard.querySelector('.post-content, .message, .comment, .resbody');
    const text = bodyEl?.textContent?.trim() || postCard.textContent?.trim() || '';

    const contextParts = [];
    if (number) contextParts.push(`楼层：${number}`);
    if (uid) contextParts.push(`作者：${uid}`);

    return {
      text,
      context: contextParts.join(' | '),
    };
  }

  attachFloatButton(postCard, onTranslate) {
    this.attachGenericFloatButton(postCard, onTranslate, 'ai-ctx-5ch-float-btn');
  }
}
