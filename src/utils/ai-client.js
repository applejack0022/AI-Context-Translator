import { buildTranslationPrompt, preprocessText } from './prompts.js';

const DEFAULT_SETTINGS = {
  provider: 'openai',
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 1024,
  mode: 'balanced',
  targetLanguage: 'zh-CN',
};

/**
 * 获取用户设置。
 * @returns {Promise<object>}
 */
async function getSettings() {
  try {
    const result = await chrome.storage.sync.get('settings');
    return { ...DEFAULT_SETTINGS, ...(result.settings || {}) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 调用 AI 翻译。
 * @param {string} text
 * @param {string} context
 * @returns {Promise<string>}
 */
export async function translate(text, context = '') {
  const settings = await getSettings();

  if (!settings.apiKey) {
    throw new Error('请先配置 API Key');
  }

  const cleanText = preprocessText(text);
  if (!cleanText) {
    throw new Error('没有可翻译的内容');
  }

  const prompt = buildTranslationPrompt(cleanText, context, settings.mode, settings.targetLanguage);

  const response = await fetch(settings.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: 'system', content: '你是一位熟悉网络社区文化的翻译助手。' },
        { role: 'user', content: prompt },
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const tip = response.status === 404
      ? `（请检查 API URL 和模型名是否正确；当前 URL: ${settings.apiUrl}，模型: ${settings.model}）`
      : '';
    throw new Error(`AI 请求失败 (${response.status}): ${errorText} ${tip}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 返回内容为空');
  }

  return {
    translation: content.trim(),
    usage: data.usage || null,
  };
}
