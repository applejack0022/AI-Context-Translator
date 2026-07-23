import { hashText } from './hash.js';

const CACHE_KEY_PREFIX = 'translation_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 小时

function buildCacheKey(text, targetLanguage) {
  return `${CACHE_KEY_PREFIX}${targetLanguage || 'zh-CN'}_${hashText(text)}`;
}

/**
 * 从缓存获取翻译结果。
 * @param {string} text
 * @param {string} targetLanguage - 目标语言代码
 * @returns {Promise<string|null>}
 */
export async function getCachedTranslation(text, targetLanguage = 'zh-CN') {
  const key = buildCacheKey(text, targetLanguage);
  try {
    const result = await chrome.storage.local.get(key);
    const item = result[key];
    if (!item) return null;
    if (Date.now() - item.timestamp > CACHE_TTL_MS) {
      await chrome.storage.local.remove(key);
      return null;
    }
    return item.value;
  } catch (e) {
    console.error('[AI Translator] cache get error:', e);
    return null;
  }
}

/**
 * 写入缓存。
 * @param {string} text
 * @param {string} translation
 * @param {string} targetLanguage - 目标语言代码
 */
export async function setCachedTranslation(text, translation, targetLanguage = 'zh-CN') {
  const key = buildCacheKey(text, targetLanguage);
  try {
    await chrome.storage.local.set({
      [key]: {
        value: translation,
        timestamp: Date.now(),
      },
    });
  } catch (e) {
    console.error('[AI Translator] cache set error:', e);
  }
}

/**
 * 清空所有翻译缓存。
 */
export async function clearCache() {
  try {
    const all = await chrome.storage.local.get(null);
    const keys = Object.keys(all).filter((k) => k.startsWith(CACHE_KEY_PREFIX));
    if (keys.length > 0) {
      await chrome.storage.local.remove(keys);
    }
  } catch (e) {
    console.error('[AI Translator] cache clear error:', e);
  }
}
