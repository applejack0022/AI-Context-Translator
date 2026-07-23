/**
 * 计算文本的简化 hash，用于缓存 key。
 * @param {string} text
 * @returns {string}
 */
export function hashText(text) {
  if (!text) return '';
  let hash = 0;
  const str = text.trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `h${Math.abs(hash).toString(36)}_${str.length}`;
}
