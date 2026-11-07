// 출처 꼬리표 - 모든 웹페이지에서 '복사(copy)' 순간만 살짝 거드는 스크립트
// 하는 일: 복사한 글 뒤에 출처 한 줄을 붙이고, 출처 목록(내 컴퓨터의 chrome.storage.local)에 기록.
// 하지 않는 일: 페이지 내용을 읽어 보내기, 네트워크 요청, 복사하지 않은 글 읽기. (복사한 글 자체도 저장하지 않음)
(() => {
  if (window.__sourceTagLoaded) return;
  window.__sourceTagLoaded = true;

  let settings = { enabled: true, format: 'easy' };
  chrome.storage.local.get({ enabled: true, format: 'easy' }, s => { settings = s; });
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local') return;
    if (ch.enabled) settings.enabled = ch.enabled.newValue;
    if (ch.format) settings.format = ch.format.newValue;
  });

  document.addEventListener('copy', e => {
    const r = SourceTag.handleCopy(e, {
      enabled: settings.enabled, format: settings.format,
      getMeta: () => SourceTag.readMeta(document, location),
    });
    if (!r) return;
    const entry = SourceTag.makeEntry(r.meta, r.now);
    chrome.storage.local.get({ history: [] }, s => {
      chrome.storage.local.set({ history: SourceTag.addHistory(s.history, entry) });
    });
    SourceTag.toast(document, '🏷️ 출처 꼬리표를 붙여 복사했어요');
  });

  // 팝업의 "이 페이지 출처 복사" 버튼이 제목·사이트 이름을 물어볼 때만 대답
  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg && msg.type === 'source-tag:meta') reply(SourceTag.readMeta(document, location));
  });
})();
