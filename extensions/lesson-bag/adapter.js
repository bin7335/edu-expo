// 수업 가방 ↔ 크롬 연결: 세트는 chrome.storage.local(내 컴퓨터 안)에만 저장. 권한은 tabs, storage 두 개뿐
const chromeBagAdapter = mode => ({
  mode,
  load: async () => (await chrome.storage.local.get({ sets: [] })).sets,
  save: sets => chrome.storage.local.set({ sets }),
  async getTabs(){
    // 편집 페이지에서 열었을 때는 '마지막으로 쓰던 일반 창'의 탭을 읽음
    const win = mode === 'popup' ? await chrome.windows.getCurrent() : await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
    const tabs = await chrome.tabs.query({ windowId: win.id });
    return tabs.map(t => ({ title: t.title, url: t.url, highlighted: t.highlighted }));
  },
  async open(set){
    await chrome.windows.create({ url: set.links.map(l => l.url), focused: true });
    return { blocked: 0 };
  },
  openFull: () => chrome.runtime.openOptionsPage(),
});
