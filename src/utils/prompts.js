const TARGET_LANGUAGES = {
  'zh-CN': '中文',
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'ru': 'Русский',
};

function getTargetLanguageName(targetLanguage) {
  return TARGET_LANGUAGES[targetLanguage] || TARGET_LANGUAGES['zh-CN'];
}

function getPromptLanguage(targetLanguage) {
  return targetLanguage && targetLanguage.startsWith('zh') ? 'zh' : 'en';
}

function buildZhPrompt(text, context, mode, targetLangName) {
  const modeInstructions = {
    literal: `只做准确、自然的${targetLangName}翻译，让${targetLangName}读者能直接理解原意。不解释梗、背景或语气，不要添加额外说明。`,
    balanced: `在翻译的同时，对明显的梗、俚语、缩写、双关、文化引用做简要解释。`,
    explain: `重点解释原文中的梗、社区黑话、文化背景和语气，翻译放在解释之后。`,
  };

  const extraRules = {
    literal: '',
    balanced: `
3. 保留原文的语气（讽刺、调侃、愤怒等）。
4. 如果是 Reddit/5ch/B站/小红书等社区的黑话，说明其在该社区中的含义。
5. 如果涉及背景知识（作品名、人物、事件），简要补充。
6. 对不确定的内容标注「不确定」。`,
    explain: `
3. 保留原文的语气（讽刺、调侃、愤怒等）。
4. 如果是 Reddit/5ch/B站/小红书等社区的黑话，说明其在该社区中的含义。
5. 如果涉及背景知识（作品名、人物、事件），简要补充。
6. 对不确定的内容标注「不确定」。`,
  };

  return `你是一位熟悉各国网络社区文化的翻译助手。请将以下文本翻译成${targetLangName}。

要求：
1. 翻译要自然口语化，符合${targetLangName}读者表达习惯。
2. ${modeInstructions[mode] || modeInstructions.literal}${extraRules[mode] || ''}

原文：
${text}

${context ? `上下文：\n${context}\n\n` : ''}请只返回翻译${mode === 'explain' ? '和解释' : ''}内容，不要输出额外说明。`;
}

function buildEnPrompt(text, context, mode, targetLangName) {
  const modeInstructions = {
    literal: `Provide an accurate and natural translation in ${targetLangName}. Do not explain memes, background, or tone. No extra notes.`,
    balanced: `Provide a natural translation in ${targetLangName}, and briefly explain obvious memes, slang, abbreviations, puns, or cultural references.`,
    explain: `Focus on explaining the original memes, community slang, cultural background, and tone. Provide the translation in ${targetLangName} after the explanation.`,
  };

  const extraRules = {
    literal: '',
    balanced: `
3. Preserve the original tone (sarcasm, teasing, anger, etc.).
4. If the text contains community slang from Reddit/5ch/Bilibili/Xiaohongshu, explain its meaning in that community.
5. If background knowledge (work names, people, events) is involved, briefly supplement it.
6. Label uncertain content as "uncertain".`,
    explain: `
3. Preserve the original tone (sarcasm, teasing, anger, etc.).
4. If the text contains community slang from Reddit/5ch/Bilibili/Xiaohongshu, explain its meaning in that community.
5. If background knowledge (work names, people, events) is involved, briefly supplement it.
6. Label uncertain content as "uncertain".`,
  };

  return `You are a translator familiar with global online communities. Please translate the following text into ${targetLangName}.

Requirements:
1. Translate naturally and fluently, suitable for ${targetLangName} readers.
2. ${modeInstructions[mode] || modeInstructions.literal}${extraRules[mode] || ''}

Original text:
${text}

${context ? `Context:\n${context}\n\n` : ''}Please return only the translation${mode === 'explain' ? ' and explanation' : ''}, without any extra notes.`;
}

/**
 * 构建翻译 prompt。
 * @param {string} text
 * @param {string} context
 * @param {string} mode - 'literal' | 'balanced' | 'explain'
 * @param {string} targetLanguage - 目标语言代码
 * @returns {string}
 */
export function buildTranslationPrompt(text, context = '', mode = 'literal', targetLanguage = 'zh-CN') {
  const targetLangName = getTargetLanguageName(targetLanguage);
  const promptLang = getPromptLanguage(targetLanguage);

  if (promptLang === 'zh') {
    return buildZhPrompt(text, context, mode, targetLangName);
  }
  return buildEnPrompt(text, context, mode, targetLangName);
}

/**
 * 预处理文本，减少无效 token。
 * @param {string} text
 * @returns {string}
 */
export function preprocessText(text) {
  return text
    .replace(/https?:\/\/\S+/g, '') // 移除 URL
    .replace(/\s+/g, ' ')           // 合并空白
    .replace(/^[\s\u200B\uFEFF]+|[\s\u200B\uFEFF]+$/g, '') // 去首尾零宽字符
    .trim();
}
