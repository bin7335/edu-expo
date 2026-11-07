// 법령 콕 - 우클릭 메뉴: 드래그한 법령명을 국가법령정보센터에서 열기
importScripts('law-core.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'law-link', title: LawLink.MENU_TITLE, contexts: ['selection'] });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'law-link' || !info.selectionText) return;
  const r = LawLink.resolveSelection(info.selectionText);
  if (!r) return;
  const opt = { url: r.url };
  if (tab && tab.index != null) opt.index = tab.index + 1;
  chrome.tabs.create(opt);
});
