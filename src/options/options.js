const PROVIDER_PRESETS = {
  openai: {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
  },
  deepseek: {
    apiUrl: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
  },
  gemini: {
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-1.5-flash',
  },
  custom: {
    apiUrl: '',
    model: '',
  },
};

const DEFAULT_SETTINGS = {
  provider: 'openai',
  apiUrl: PROVIDER_PRESETS.openai.apiUrl,
  model: PROVIDER_PRESETS.openai.model,
  temperature: 0.7,
  maxTokens: 1024,
  mode: 'literal',
  targetLanguage: 'zh-CN',
  autoTranslate: false,
  apiKey: '',
};

const apiKeyInput = document.getElementById('api-key');
const providerInput = document.getElementById('provider');
const apiUrlInput = document.getElementById('api-url');
const modelInput = document.getElementById('model');
const temperatureInput = document.getElementById('temperature');
const maxTokensInput = document.getElementById('max-tokens');
const modeInput = document.getElementById('mode');
const targetLanguageInput = document.getElementById('target-language');
const autoTranslateInput = document.getElementById('auto-translate');
const saveBtn = document.getElementById('save-btn');
const statusArea = document.getElementById('status');

function applyProviderPreset(provider) {
  const preset = PROVIDER_PRESETS[provider];
  if (!preset) return;

  if (provider !== 'custom') {
    apiUrlInput.value = preset.apiUrl;
    modelInput.value = preset.model;
  }

  apiUrlInput.disabled = provider !== 'custom';
  modelInput.disabled = provider !== 'custom';
}

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('settings');
    const settings = { ...DEFAULT_SETTINGS, ...(result.settings || {}) };

    apiKeyInput.value = settings.apiKey || '';
    providerInput.value = settings.provider || DEFAULT_SETTINGS.provider;
    apiUrlInput.value = settings.apiUrl || DEFAULT_SETTINGS.apiUrl;
    modelInput.value = settings.model || DEFAULT_SETTINGS.model;
    temperatureInput.value = settings.temperature ?? DEFAULT_SETTINGS.temperature;
    maxTokensInput.value = settings.maxTokens ?? DEFAULT_SETTINGS.maxTokens;
    modeInput.value = settings.mode || DEFAULT_SETTINGS.mode;
    targetLanguageInput.value = settings.targetLanguage || DEFAULT_SETTINGS.targetLanguage;
    autoTranslateInput.checked = settings.autoTranslate ?? DEFAULT_SETTINGS.autoTranslate;

    applyProviderPreset(providerInput.value);
  } catch (err) {
    showStatus('加载设置失败：' + err.message, true);
  }
}

async function saveSettings() {
  const provider = providerInput.value;
  const settings = {
    apiKey: apiKeyInput.value.trim(),
    provider,
    apiUrl: apiUrlInput.value.trim() || DEFAULT_SETTINGS.apiUrl,
    model: modelInput.value.trim() || DEFAULT_SETTINGS.model,
    temperature: parseFloat(temperatureInput.value) || DEFAULT_SETTINGS.temperature,
    maxTokens: parseInt(maxTokensInput.value, 10) || DEFAULT_SETTINGS.maxTokens,
    mode: modeInput.value || DEFAULT_SETTINGS.mode,
    targetLanguage: targetLanguageInput.value || DEFAULT_SETTINGS.targetLanguage,
    autoTranslate: autoTranslateInput.checked,
  };

  try {
    await chrome.storage.sync.set({ settings });
    showStatus('设置已保存');
  } catch (err) {
    showStatus('保存失败：' + err.message, true);
  }
}

function showStatus(text, isError = false) {
  statusArea.textContent = text;
  statusArea.classList.toggle('error', isError);
}

providerInput.addEventListener('change', () => {
  applyProviderPreset(providerInput.value);
});

saveBtn.addEventListener('click', saveSettings);

loadSettings();
