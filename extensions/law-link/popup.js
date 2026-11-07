// 법령 콕 팝업: 팝업을 연 순간에만(activeTab) 지금 탭의 글을 읽어 법령명을 찾음. 저장·전송 없음.
async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
LawLinkPopup.mount(document.getElementById('app'), {
  async getPage() {
    const tab = await activeTab();
    if (!tab || !/^(https?|file):/i.test(tab.url || '')) return null;
    try {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({ title: document.title, text: document.body ? document.body.innerText.slice(0, 300000) : '' }),
      });
      return res && res.result ? res.result : null;
    } catch (_) { return null; }   // 웹 스토어 등 스크립트가 막힌 페이지
  },
  open(url) { chrome.tabs.create({ url }); },
});
