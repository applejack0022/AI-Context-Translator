const USAGE_KEY = 'usage_stats';

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * 获取用量统计。
 * @returns {Promise<{today: number, total: number, count: number, todayCount: number}>}
 */
export async function getUsageStats() {
  try {
    const result = await chrome.storage.local.get(USAGE_KEY);
    const data = result[USAGE_KEY] || { total: 0, count: 0, daily: {} };
    const todayKey = getTodayKey();
    return {
      today: data.daily[todayKey] || 0,
      todayCount: data.dailyCount?.[todayKey] || 0,
      total: data.total || 0,
      count: data.count || 0,
    };
  } catch (e) {
    console.error('[AI Translator] 获取用量统计失败:', e);
    return { today: 0, todayCount: 0, total: 0, count: 0 };
  }
}

/**
 * 记录一次翻译用量。
 * @param {number} promptTokens
 * @param {number} completionTokens
 * @param {number} totalTokens
 */
export async function recordUsage(promptTokens, completionTokens, totalTokens) {
  const validTotal = Number.isFinite(totalTokens) && totalTokens > 0
    ? totalTokens
    : (Number.isFinite(promptTokens) ? promptTokens : 0) + (Number.isFinite(completionTokens) ? completionTokens : 0);

  if (validTotal <= 0) return;

  try {
    const result = await chrome.storage.local.get(USAGE_KEY);
    const data = result[USAGE_KEY] || { total: 0, count: 0, daily: {}, dailyCount: {} };
    const todayKey = getTodayKey();

    data.total = (data.total || 0) + validTotal;
    data.count = (data.count || 0) + 1;
    data.daily = data.daily || {};
    data.dailyCount = data.dailyCount || {};
    data.daily[todayKey] = (data.daily[todayKey] || 0) + validTotal;
    data.dailyCount[todayKey] = (data.dailyCount[todayKey] || 0) + 1;

    await chrome.storage.local.set({ [USAGE_KEY]: data });
  } catch (e) {
    console.error('[AI Translator] 记录用量失败:', e);
  }
}

/**
 * 清空用量统计。
 */
export async function resetUsage() {
  try {
    await chrome.storage.local.remove(USAGE_KEY);
  } catch (e) {
    console.error('[AI Translator] 清空用量失败:', e);
  }
}
