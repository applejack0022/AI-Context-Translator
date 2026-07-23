import { translate } from '../utils/ai-client.js';
import { getCachedTranslation, setCachedTranslation, clearCache } from '../utils/cache.js';
import { recordUsage, getUsageStats, resetUsage } from '../utils/usage.js';

const DEFAULT_SETTINGS = {
  targetLanguage: 'zh-CN',
};

async function getSettings() {
  try {
    const result = await chrome.storage.sync.get('settings');
    return { ...DEFAULT_SETTINGS, ...(result.settings || {}) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

const MENU_ID_TRANSLATE = 'ai-context-translator-translate';

// 安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID_TRANSLATE,
    title: '翻译选中/元素内容',
    contexts: ['selection', 'page', 'link'],
  });
});

// 处理消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TRANSLATE') {
    handleTranslate(request.payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // 保持通道打开以异步响应
  }

  if (request.type === 'CLEAR_CACHE') {
    clearCache()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.type === 'GET_USAGE') {
    getUsageStats()
      .then((stats) => sendResponse({ success: true, data: stats }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.type === 'RESET_USAGE') {
    resetUsage()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  return false;
});

async function handleTranslate({ text, context = '' }) {
  const settings = await getSettings();
  const targetLanguage = settings.targetLanguage || 'zh-CN';

  const cached = await getCachedTranslation(text, targetLanguage);
  if (cached) {
    return { translation: cached, fromCache: true };
  }

  const result = await translate(text, context);
  await setCachedTranslation(text, result.translation, targetLanguage);

  if (result.usage) {
    await recordUsage(
      result.usage.prompt_tokens,
      result.usage.completion_tokens,
      result.usage.total_tokens
    );
  }

  return { translation: result.translation, fromCache: false };
}

// 右键菜单点击：通知对应标签页的内容脚本
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID_TRANSLATE || !tab?.id) return;

  const text = info.selectionText || '';
  if (!text) {
    console.log('[AI Translator] 右键菜单：没有选中文字');
    return;
  }

  console.log('[AI Translator] 右键菜单点击，准备发送消息到标签页', tab.id);

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: 'CONTEXT_MENU_TRANSLATE',
      payload: { text },
    });
    console.log('[AI Translator] 右键翻译消息已发送');
  } catch (err) {
    console.error('[AI Translator] 右键翻译发送失败，内容脚本可能未加载:', err);
    // 尝试在页面中提示用户刷新
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          window.alert('AI Context Translator：请刷新当前页面后再使用右键翻译功能');
        },
      });
    } catch (e) {
      console.error('[AI Translator] 执行提示脚本失败:', e);
    }
  }
});
