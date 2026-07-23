import { BaseAdapter } from './adapters/base.js';
import { RedditAdapter } from './adapters/reddit.js';
import { Ch5Adapter } from './adapters/_5ch.js';
import { BilibiliAdapter } from './adapters/bilibili.js';
import { XiaohongshuAdapter } from './adapters/xiaohongshu.js';

const ADAPTERS = [
  new RedditAdapter(),
  new Ch5Adapter(),
  new BilibiliAdapter(),
  new XiaohongshuAdapter(),
];

/**
 * 获取当前页面匹配的适配器。
 * @returns {BaseAdapter|null}
 */
export function getActiveAdapter() {
  for (const adapter of ADAPTERS) {
    if (adapter.match()) {
      return adapter;
    }
  }
  return null;
}

/**
 * 注册自定义适配器（供未来扩展）。
 * @param {BaseAdapter} adapter
 */
export function registerAdapter(adapter) {
  if (adapter instanceof BaseAdapter) {
    ADAPTERS.push(adapter);
  }
}
