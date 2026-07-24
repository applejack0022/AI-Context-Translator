import { BaseAdapter } from './base.js';

const GH_FLOAT_BTN_CLASS = 'ai-ctx-github-float-btn';

// Issue / PR 标题、评论、列表行、Discussion 的选择器
const TITLE_SELECTORS = '.js-issue-title, [data-testid="issue-title"], [data-testid="pr-title"]';
const COMMENT_SELECTORS = '.timeline-comment, .js-comment-container, [data-testid="issue-body"], [data-testid="comment-body"]';
const ROW_SELECTORS = '.js-issue-row, [data-testid="issue-row"], [data-testid="pr-row"]';
const DISCUSSION_SELECTORS = '.discussion-post';

const ALL_SELECTORS = [
  TITLE_SELECTORS,
  COMMENT_SELECTORS,
  ROW_SELECTORS,
  DISCUSSION_SELECTORS,
].join(', ');

export class GitHubAdapter extends BaseAdapter {
  getHostnames() {
    return ['github.com'];
  }

  findPostCard(target) {
    return target.closest(ALL_SELECTORS);
  }

  getTranslatableElements() {
    return Array.from(document.querySelectorAll(ALL_SELECTORS));
  }

  extractTextAndContext(element) {
    if (!element) return { text: '', context: '' };

    if (element.matches(TITLE_SELECTORS)) {
      return this.extractTitle(element);
    }

    if (element.matches(ROW_SELECTORS)) {
      return this.extractIssueRow(element);
    }

    if (element.matches(DISCUSSION_SELECTORS)) {
      return this.extractDiscussion(element);
    }

    if (element.matches(COMMENT_SELECTORS)) {
      return this.extractComment(element);
    }

    return { text: '', context: '' };
  }

  extractTitle(titleEl) {
    const text = titleEl?.textContent?.trim() || '';
    const issueNumberEl = document.querySelector('.gh-header-number, [data-testid="issue-number"]');
    const issueNumber = issueNumberEl?.textContent?.trim() || '';
    return {
      text,
      context: issueNumber ? `类型：GitHub Issue/PR 标题 | ${issueNumber}` : '类型：GitHub Issue/PR 标题',
    };
  }

  extractComment(comment) {
    const authorEl = comment.querySelector('.author, [data-testid="comment-author"]');
    const author = authorEl?.textContent?.trim() || '';

    const bodyEl = comment.querySelector('.comment-body, .js-comment-body, [data-testid="comment-body"]');
    const body = this.extractCleanBody(bodyEl);

    const timeEl = comment.querySelector('relative-time, [data-testid="comment-timestamp"]');
    const time = timeEl?.textContent?.trim() || '';

    const contextParts = [];
    if (author) contextParts.push(`作者：${author}`);
    if (time) contextParts.push(`时间：${time}`);

    return { text: body, context: contextParts.join(' | ') };
  }

  extractIssueRow(row) {
    const titleEl = row.querySelector('.js-navigation-open, .Link--primary, a[id^="issue_"], a[id^="pull_request_"]');
    const title = titleEl?.textContent?.trim() || '';

    const bodyEl = row.querySelector('.text-small.color-fg-muted, [data-testid="issue-row-description"]');
    const body = bodyEl?.textContent?.trim() || '';

    const text = body ? `${title}\n\n${body}` : title;

    const metaEl = row.querySelector('.opened-by, [data-testid="issue-row-meta"]');
    const meta = metaEl?.textContent?.trim() || '';

    return { text, context: meta ? `元信息：${meta}` : '' };
  }

  extractDiscussion(post) {
    const titleEl = post.querySelector('.discussion-post-title');
    const title = titleEl?.textContent?.trim() || '';

    const bodyEl = post.querySelector('.discussion-post-body');
    const body = this.extractCleanBody(bodyEl);

    const text = body ? `${title}\n\n${body}` : title;
    return { text, context: '类型：GitHub Discussion' };
  }

  extractCleanBody(bodyEl) {
    if (!bodyEl) return '';

    const clone = bodyEl.cloneNode(true);

    // 移除代码块、diff、引用回复、交互按钮等不需要翻译的元素
    const removeSelectors = [
      'pre',
      'code',
      '.highlight',
      '.blob-code',
      '.file-header',
      '.js-suggested-change-blob',
      '.comment-reactions',
      '.js-comment-reactions',
      'blockquote', // 引用原评论，避免重复翻译
      '.email-hidden-toggle',
      '.email-quoted-reply',
      '.js-comment-edit-button',
      '.js-comment-delete-button',
      '.timeline-comment-action',
    ];

    removeSelectors.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });

    return clone.textContent?.trim() || '';
  }

  attachFloatButton(postCard, onTranslate) {
    this.attachGenericFloatButton(postCard, onTranslate, GH_FLOAT_BTN_CLASS);
  }
}
