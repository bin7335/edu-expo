// 26 수업 가방: 탭 골라 담기·편집(순서/삭제/추가)·QR·삭제 확인·JSON 내보내기/가져오기·열기
const B = BagCore, ui = window.__demo.ui;
await ui.ready;
const P = $('#popup'), r = k => P.querySelector(`[data-r="${k}"]`);
const STORE = 'lesson-bag-demo-v1';
// 1) 웹페이지 탭만 담기 후보(chrome:// 제외), 하나 빼고 담기
assert(r('sum').textContent.includes('4개 중 4개'), '탭 4개 중 4개: ' + r('sum').textContent);
const boxes = P.querySelectorAll('[data-tab]');
boxes[2].click(); await wait(50);
assert(r('sum').textContent.includes('4개 중 3개'), '하나 빼면 3개');
const n0 = ui.sets.length;
r('name').value = '테스트 세트'; r('saveBtn').click(); await wait(100);
const s = ui.sets[0];
assert(ui.sets.length === n0 + 1 && s.name === '테스트 세트' && s.links.length === 3, '세트 담기: ' + JSON.stringify(s && { n: s.name, l: s.links.length }));
assert(s.links[0].url === 'https://ko.wikipedia.org/wiki/%EC%A6%9D%EB%B0%9C' && s.links.every(l => !/science\.go\.kr/.test(l.url)), '고른 탭만, 주소는 정규화');
assert(JSON.parse(localStorage.getItem(STORE))[0].name === '테스트 세트', '저장됨');
assert(P.querySelector('.lb-card .lb-tt small').textContent.startsWith('링크 3개'), '카드에 링크 수');
// 이름 비우면 날짜 기본 이름, 아무 탭도 안 고르면 담지 않음
r('saveBtn').click(); await wait(100);
assert(/^\d{1,2}월 \d{1,2}일 수업 세트$/.test(ui.sets[0].name), '기본 이름: ' + ui.sets[0].name);
r('none').click(); const n1 = ui.sets.length; r('saveBtn').click(); await wait(100);
assert(ui.sets.length === n1 && /골라 주세요/.test(r('msg').textContent), '빈 선택은 담지 않음');
// 2) 편집: 순서 바꾸기·지우기·주소 추가(정규화·제목 짐작)·잘못된 주소 거부
const card = () => P.querySelector(`.lb-card[data-id="${s.id}"]`);
card().querySelector('[data-act=edit]').click(); await wait(50);
const t0 = s.links.map(l => l.title);
card().querySelector('[data-act=down][data-i="0"]').click(); await wait(50);
assert(s.links[0].title === t0[1] && s.links[1].title === t0[0], '아래로 이동');
card().querySelector('[data-act=rm][data-i="2"]').click(); await wait(50);
assert(s.links.length === 2, '링크 지우기');
const add = v => { const i = card().querySelector('[data-f=addUrl]'); i.value = v; card().querySelector('[data-act=add]').click(); };
add('example.com/lesson/물의_순환'); await wait(50);
const last = s.links[s.links.length - 1];
assert(last.url === 'https://example.com/lesson/%EB%AC%BC%EC%9D%98_%EC%88%9C%ED%99%98' && last.title === '물의 순환 - example.com', '주소 추가·제목 짐작: ' + JSON.stringify(last));
add('javascript:alert(1)'); await wait(50);
assert(s.links.length === 3 && /http/.test(r('msg').textContent), 'javascript: 주소는 거부');
const rn = card().querySelector('[data-f=rename]'); rn.value = '바뀐 이름'; fire(rn, 'input');
assert(s.name === '바뀐 이름' && JSON.parse(localStorage.getItem(STORE)).find(x => x.id === s.id).name === '바뀐 이름', '이름 바꾸기 저장');
// 3) QR: 링크 하나면 그 주소, 목록이면 글자 목록
card().querySelector('[data-act=qr]').click(); await wait(50);
assert(card().querySelector('.lb-qrimg svg'), 'QR 그림');
assert(B.qrText(s, '1') === s.links[1].url, 'QR 링크 선택');
const lt = B.qrText(s, 'list');
assert(lt.split('\n')[0] === '[수업 가방] 바뀐 이름' && lt.split('\n')[1] === '1. ' + s.links[0].title && lt.split('\n')[2] === s.links[0].url, 'QR 목록 글: ' + lt);
const q = QR.encode('https://example.com/');
assert(q.size === 25 && q.modules.length === 25, 'QR 20자 주소는 버전2(25칸): ' + q.size);
assert(q.modules[0].slice(0, 7).every(Boolean) && q.modules[6].slice(0, 7).every(Boolean) && !q.modules[7][0], '찾기 무늬');
const sel = card().querySelector('[data-f=qrSel]'); sel.value = 'list'; fire(sel, 'change'); await wait(50);
assert(card().querySelector('.lb-qrimg svg') && /글자/.test(card().querySelector('.lb-cap').textContent), '목록 QR');
// 4) 열기: 새 탭이 막히면 막힌 개수 안내
card().querySelector('[data-act=open]').click(); await wait(100);
assert(r('msg').textContent.includes(`새 탭 ${s.links.length}개를 막았어요`), '열기 안내: ' + r('msg').textContent);
// 5) 삭제는 두 번 눌러야
const n2 = ui.sets.length;
card().querySelector('[data-act=del]').click(); await wait(50);
assert(ui.sets.length === n2 && card().querySelector('[data-act=del]').textContent.includes('정말'), '첫 클릭은 확인');
card().querySelector('[data-act=del]').click(); await wait(50);
assert(ui.sets.length === n2 - 1 && !card(), '두 번째 클릭에 삭제');
// 6) JSON 내보내기 → 가져오기 왕복, 이상한 링크는 건너뜀
const exp = JSON.parse(B.exportJson(ui.sets));
assert(exp.app === 'lesson-bag' && exp.sets.length === ui.sets.length && !('id' in exp.sets[0]), '내보내기 형식');
const bad = JSON.stringify({ sets: [{ name: '가져온 세트', createdAt: '2026-03-02T00:00:00Z', links: [{ title: 'a', url: 'https://a.example/' }, { url: 'chrome://settings' }, { url: 'javascript:x' }] }, { name: '빈 세트', links: [{ url: 'file:///c:/x' }] }, { nope: 1 }] });
const n3 = ui.sets.length;
const res = await ui.importText(bad);
assert(res.sets.length === 1 && res.skipped === 4 && ui.sets.length === n3 + 1 && ui.sets[0].name === '가져온 세트', '가져오기: ' + JSON.stringify({ n: res.sets.length, sk: res.skipped }));
assert(/이상한 링크 4개/.test(r('msg').textContent), '건너뛴 개수 안내');
let err = ''; try { await ui.importText('not json'); } catch (e) { err = e.message; }
assert(err === 'JSON 형식이 아니에요', 'JSON 아님 오류: ' + err);
const round = B.parseImport(B.exportJson(ui.sets));
assert(round.skipped === 0 && round.sets.length === ui.sets.length && round.sets[0].links[0].url === ui.sets[0].links[0].url, '내보내기→가져오기 왕복');
return 'ok 6';
