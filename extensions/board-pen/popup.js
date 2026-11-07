// 팝업 버튼: 현재 탭에 overlay.js 를 주입(이미 있으면 켜기/끄기만 바뀜)
document.getElementById('go').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['overlay.js'] });
    window.close();
  } catch (e) {
    document.getElementById('err').style.display = 'block';
  }
});
