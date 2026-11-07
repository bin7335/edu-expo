// 투명 판서판 - 단축키(Alt+Shift+D)로 현재 탭에 판서 도구를 켜고 끈다.
// 단축키를 누르면 activeTab 권한이 그 탭에만 잠깐 주어진다.
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'toggle-board') return;
  if (!tab) [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['overlay.js'] });
  } catch (e) {
    console.warn('이 페이지에서는 판서를 켤 수 없어요:', e.message);
  }
});
