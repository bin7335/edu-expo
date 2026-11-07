// 출처 꼬리표 팝업: 저장소는 chrome.storage.local(내 컴퓨터 안)만 사용
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
SourceTagPopup.mount(document.getElementById('app'), {
  getState: () => chrome.storage.local.get({ enabled: true, format: 'easy', fullUrl: false, history: [] }),
  set: patch => chrome.storage.local.set(patch),
  async getPageMeta(){
    const tab = await activeTab();
    if (!tab) return null;
    const { fullUrl } = await chrome.storage.local.get({ fullUrl: false });
    try {
      // 페이지의 content script에게 제목·사이트 이름을 물어봄 (og:site_name 등 읽기)
      const meta = await chrome.tabs.sendMessage(tab.id, { type: 'source-tag:meta', fullUrl });
      if (meta && meta.url) return meta;
    } catch (_) { /* 설치 전부터 열려 있던 탭 등: 탭 정보로 대신 */ }
    if (!/^(https?|file):/i.test(tab.url || '')) return null;   // 크롬 설정 화면 등
    const u = new URL(tab.url);
    const site = u.hostname.replace(/^www\./, '') || '내 컴퓨터 파일';
    return { title: SourceTag.stripSite(tab.title || '제목 없음', site), site, url: SourceTag.cleanUrl(tab.url, fullUrl), author: '', year: '' };
  },
  copyText,
});
