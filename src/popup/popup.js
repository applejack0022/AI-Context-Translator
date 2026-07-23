const quickText = document.getElementById('quick-text');
const quickTranslateBtn = document.getElementById('quick-translate-btn');
const openOptionsBtn = document.getElementById('open-options-btn');
const clearCacheBtn = document.getElementById('clear-cache-btn');
const resetUsageBtn = document.getElementById('reset-usage-btn');
const resultArea = document.getElementById('result-area');
const statusArea = document.getElementById('status-area');
const usageTodayEl = document.getElementById('usage-today');
const usageTotalEl = document.getElementById('usage-total');
const usageCountEl = document.getElementById('usage-count');
const popupMode = document.getElementById('popup-mode');
const popupTargetLang = document.getElementById('popup-target-language');
const popupAutoTranslate = document.getElementById('popup-auto-translate');

let settingsCache = {};

function setStatus(text, isError = false) {
  statusArea.textContent = text;
  statusArea.classList.toggle('error', isError);
}

function showResult(text) {
  resultArea.textContent = text;
  resultArea.classList.remove('hidden');
}

function renderUsage(stats) {
  usageTodayEl.textContent = stats.today.toLocaleString();
  usageTotalEl.textContent = stats.total.toLocaleString();
  usageCountEl.textContent = stats.count.toLocaleString();
}

async function loadUsage() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_USAGE' });
    if (response.success) {
      renderUsage(response.data);
    }
  } catch (err) {
    console.error('[AI Translator] 加载用量失败:', err);
  }
}

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('settings');
    const settings = result.settings || {};
    settingsCache = settings;

    popupMode.value = settings.mode || 'literal';
    popupTargetLang.value = settings.targetLanguage || 'zh-CN';
    popupAutoTranslate.checked = settings.autoTranslate || false;
  } catch (err) {
    console.error('[AI Translator] 加载设置失败:', err);
  }
}

async function savePartialSettings(changes) {
  try {
    const newSettings = { ...settingsCache, ...changes };
    await chrome.storage.sync.set({ settings: newSettings });
    settingsCache = newSettings;
    setStatus('设置已保存');
  } catch (err) {
    console.error('[AI Translator] 保存设置失败:', err);
  }
}

// 监听设置变更
popupMode.addEventListener('change', () => {
  savePartialSettings({ mode: popupMode.value });
});

popupTargetLang.addEventListener('change', () => {
  savePartialSettings({ targetLanguage: popupTargetLang.value });
});

popupAutoTranslate.addEventListener('change', () => {
  savePartialSettings({ autoTranslate: popupAutoTranslate.checked });
});

quickTranslateBtn.addEventListener('click', async () => {
  const text = quickText.value.trim();
  if (!text) {
    setStatus('请输入要翻译的内容', true);
    return;
  }

  setStatus('翻译中...');
  resultArea.classList.add('hidden');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE',
      payload: { text },
    });

    if (!response.success) {
      setStatus(response.error, true);
      return;
    }

    showResult(response.data.translation);
    setStatus(response.data.fromCache ? '（来自缓存）' : '翻译完成');
    await loadUsage();
  } catch (err) {
    setStatus(err.message, true);
  }
});

openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

clearCacheBtn.addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' });
    if (response.success) {
      setStatus('缓存已清空');
    } else {
      setStatus(response.error, true);
    }
  } catch (err) {
    setStatus(err.message, true);
  }
});

resetUsageBtn.addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'RESET_USAGE' });
    if (response.success) {
      setStatus('用量统计已重置');
      await loadUsage();
    } else {
      setStatus(response.error, true);
    }
  } catch (err) {
    setStatus(err.message, true);
  }
});

loadSettings();
loadUsage();
