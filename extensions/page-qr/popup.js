// 딸깍 QR 팝업: 툴바 아이콘(또는 Alt+Q)을 누르면 activeTab 권한으로 지금 탭의 제목·주소를 읽어 QR을 그림
// 저장·전송 없음. 네트워크 요청 코드가 전혀 없습니다.
async function activeTab(){
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
async function copyText(text){
  try { await navigator.clipboard.writeText(text); return true; }
  catch (_) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}
PageQRPopup.mount(document.getElementById('app'), {
  async getTab(){
    const tab = await activeTab();
    if (!tab) return null;
    // activeTab: 아이콘을 누른 순간 이 탭의 url·title을 읽을 수 있게 됨 (설치 때 "모든 사이트" 경고 없음)
    return { title: tab.title || '', url: tab.url || tab.pendingUrl || '' };
  },
  async openBig(url, title){
    const tab = await activeTab();
    await chrome.tabs.create({
      url: chrome.runtime.getURL('big.html' + PageQR.bigQuery(url, title)),
      index: tab ? tab.index + 1 : undefined,
    });
    window.close();
  },
  copyText,
});
