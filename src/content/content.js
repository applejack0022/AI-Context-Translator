import { getActiveAdapter } from './adapter-manager.js';
import { ViewportTranslator } from './viewport-translator.js';

const FLOAT_BTN_ID = 'ai-ctx-translator-float-btn';
const POPUP_ID = 'ai-ctx-translator-popup';

let currentPopup = null;
let activeAdapter = null;

async function init() {
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousedown', handleMouseDown);
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);

  activeAdapter = getActiveAdapter();
  if (activeAdapter) {
    console.log('[AI Translator] 已加载适配器:', activeAdapter.constructor.name);
    initAdapterFloatButtons();

    const viewportTranslator = new ViewportTranslator(activeAdapter);
    await viewportTranslator.start();
  }
}

function initAdapterFloatButtons() {
  // 事件委托：处理动态加载的帖子卡片
  // 使用 composedPath 以支持 Shadow DOM 内的元素
  document.addEventListener('mouseover', (e) => {
    const path = e.composedPath ? e.composedPath() : [e.target];
    let postCard = null;
    for (const el of path) {
      if (el instanceof HTMLElement) {
        postCard = activeAdapter.findPostCard(el);
        if (postCard) break;
      }
    }

    if (!postCard) return;
    console.log('[AI Translator] 找到帖子卡片:', postCard.tagName);

    activeAdapter.attachFloatButton(postCard, (text, context) => {
      console.log('[AI Translator] 悬浮按钮点击，文本长度:', text?.length);
      doTranslate(text, context, postCard);
    });
  });
}

function handleMouseUp(e) {
  const target = e.target;
  const element = target instanceof Element ? target : target.parentElement;
  if (element && (element.closest(`#${FLOAT_BTN_ID}`) || element.closest(`#${POPUP_ID}`))) {
    return;
  }

  const selection = window.getSelection();
  const text = selection?.toString()?.trim();

  if (!text || text.length < 1) {
    removeFloatButton();
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  showFloatButton(rect, text);
}

function handleMouseDown(e) {
  const target = e.target;
  const element = target instanceof Element ? target : target.parentElement;
  if (element && (element.closest(`#${FLOAT_BTN_ID}`) || element.closest(`#${POPUP_ID}`))) {
    return;
  }
  removeFloatButton();
  hidePopup();
}

function showFloatButton(rect, text) {
  removeFloatButton();

  const btn = document.createElement('button');
  btn.id = FLOAT_BTN_ID;
  btn.textContent = '译';
  btn.title = '翻译选中文字';
  btn.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    doTranslate(text);
  });

  document.body.appendChild(btn);

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  btn.style.left = `${rect.left + rect.width / 2 - 15 + scrollX}px`;
  btn.style.top = `${rect.top - 36 + scrollY}px`;
}

function removeFloatButton() {
  const existing = document.getElementById(FLOAT_BTN_ID);
  if (existing) existing.remove();
}

function handleBackgroundMessage(request, sender, sendResponse) {
  console.log('[AI Translator] content script 收到消息:', request.type);
  if (request.type === 'CONTEXT_MENU_TRANSLATE') {
    const text = request.payload?.text?.trim();
    if (text) {
      doTranslate(text);
    }
  }
}

async function doTranslate(text, context = '', anchor = null) {
  if (!text || text.length < 1) return;

  showPopup('翻译中...', null, true, anchor);

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE',
      payload: { text, context },
    });

    if (!response.success) {
      showPopup(`翻译失败：${response.error}`, null, false, anchor);
      return;
    }

    const result = response.data;
    showPopup(result.translation, result.fromCache ? '（来自缓存）' : '', false, anchor);
  } catch (err) {
    showPopup(`翻译失败：${err.message}`, null, false, anchor);
  }
}

function getAnchorRect(anchor) {
  if (anchor && anchor.getBoundingClientRect) {
    return anchor.getBoundingClientRect();
  }

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    return selection.getRangeAt(0).getBoundingClientRect();
  }

  return { left: 100, top: 100, width: 0, right: 100, bottom: 100 };
}

function showPopup(content, subtitle, loading, anchor = null) {
  hidePopup();

  const popup = document.createElement('div');
  popup.id = POPUP_ID;

  const rect = getAnchorRect(anchor);
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  popup.innerHTML = `
    <div class="ai-ctx-popup-header">
      <span>AI 翻译</span>
      ${subtitle ? `<span class="ai-ctx-popup-subtitle">${escapeHtml(subtitle)}</span>` : ''}
      <button class="ai-ctx-popup-close" title="关闭">×</button>
    </div>
    <div class="ai-ctx-popup-body ${loading ? 'ai-ctx-popup-loading' : ''}">
      ${escapeHtml(content)}
    </div>
  `;

  document.body.appendChild(popup);
  currentPopup = popup;

  // 定位：尽量让弹窗出现在锚点下方中央
  const popupRect = popup.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - popupRect.width / 2 + scrollX;
  let top = rect.bottom + 8 + scrollY;

  if (left < 8 + scrollX) left = 8 + scrollX;
  if (left + popupRect.width > window.innerWidth + scrollX - 8) {
    left = window.innerWidth + scrollX - popupRect.width - 8;
  }
  if (top + popupRect.height > window.innerHeight + scrollY - 8) {
    top = rect.top - popupRect.height - 8 + scrollY;
  }

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;

  popup.querySelector('.ai-ctx-popup-close').addEventListener('click', hidePopup);
}

function hidePopup() {
  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
