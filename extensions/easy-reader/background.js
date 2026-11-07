// 술술 읽기 - 단축키(Alt+Shift+R)로 현재 탭에 읽기 도우미를 켜고 끈다.
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'toggle-reader') return;
  if (!tab) [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['reader.js'] });
  } catch (e) {
    console.warn('이 페이지에서는 읽기 도우미를 켤 수 없어요:', e.message);
  }
});
