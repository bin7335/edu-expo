// 98 특별실 예약판: 특별실 추가·이름 바꾸기, 주 이동(연도 넘김 포함) 날짜 정답, 예약·겹침 방지, 매주 반복·이번 주만 취소·이후 모두 취소, 반복과 단건 겹침 거부, 내 반만 보기, 특별실별 인쇄, 저장
const set = (sel, v) => { const el = $(sel); el.value = v; fire(el, 'input'); fire(el, 'change'); };
const cell = (d, p) => $('#grid .cell[data-day="' + d + '"][data-p="' + p + '"]');
const book = (d, p, cls, subj, rep) => { cell(d, p).click(); set('#mCls', cls); set('#mSubj', subj); $('#mRepeat').checked = !!rep; $('#mSave').click(); };
const week = v => set('#weekPick', v);
// 1) 특별실 추가 → 탭 선택
$('#roomsBtn').click();
assert($('#roomsModal').classList.contains('on'), '특별실 편집 열림');
const nRooms = $$('#roomList [data-rid]').length;
set('#newRoom', '테스트실'); $('#addRoom').click();
set('#newRoom', '테스트실'); $('#addRoom').click();
assert($$('#roomList [data-rid]').length === nRooms + 1, '같은 이름은 한 번만 추가');
$('#roomsClose').click();
const tabOf = name => $$('#roomTabs .rt').find(b => b.querySelector('.nm').textContent === name);
tabOf('테스트실').click();
assert(tabOf('테스트실').classList.contains('on') && $('#roomTitle').textContent.includes('테스트실'), '테스트실 탭');
// 2) 날짜: 주 선택·표머리·점심 줄
week('2026-11-18');
assert($('#weekLabel').textContent === '2026. 11. 16.(월) - 11. 20.(금)', '주 표시: ' + $('#weekLabel').textContent);
assert($$('#grid thead th').slice(1).map(t => t.textContent).join(',') === '11/16(월),11/17(화),11/18(수),11/19(목),11/20(금)', '요일 머리: ' + $$('#grid thead th').map(t => t.textContent).join(','));
assert($$('#grid .cell').length === 30 && $$('#grid tr.lunch').length === 1, '1-6교시 × 5일, 점심 줄');
// 3) 예약 + 겹침 방지
book(2, 3, '5-1', '과학');
assert(cell(2, 3).querySelector('.bk') && cell(2, 3).textContent.includes('5-1') && cell(2, 3).textContent.includes('과학'), '예약 표시');
cell(2, 3).click();
assert($('#modal').classList.contains('on') && $('#mInfo').textContent.includes('5-1') && $('#mFree').style.display === 'none', '이미 예약된 칸은 정보만');
$('#mClose').click();
book(1, 4, '', '체육');
assert(!cell(1, 4).querySelector('.bk') && /학년반/.test($('#toast').textContent), '학년반 빈칸 거부');
$('#mClose').click();
// 4) 매주 반복
book(0, 1, '3-2', '실과', true);
assert(cell(0, 1).querySelector('.bk.rep'), '반복 표시');
$('#nextWeek').click();
assert($('#weekLabel').textContent === '2026. 11. 23.(월) - 11. 27.(금)' && cell(0, 1).textContent.includes('3-2') && !cell(2, 3).querySelector('.bk'), '다음 주에도 반복, 단건은 없음');
$('#prevWeek').click(); $('#prevWeek').click();
assert($('#weekLabel').textContent === '2026. 11. 9.(월) - 11. 13.(금)' && !cell(0, 1).querySelector('.bk'), '시작 주 이전에는 없음');
// 5) 반복이 미래 단건과 겹치면 거부
week('2026-11-30'); book(0, 2, '4-1', '음악');
week('2026-11-16'); book(0, 2, '6-1', '과학', true);
assert(/겹치는 예약/.test($('#toast').textContent) && /11\/30/.test($('#toast').textContent), '반복 겹침 거부: ' + $('#toast').textContent);
$('#mClose').click();
week('2026-11-23'); assert(!cell(0, 2).querySelector('.bk'), '거부된 반복은 안 생김');
// 6) 이번 주만 취소 → 빈 칸에 다른 반복은 거부(기존 반복과 겹침) / 이 날부터 모두 취소
cell(0, 1).click(); assert(/매주/.test($('#mInfo').textContent), '반복 예약 정보'); $('#mCancelOne').click();
assert(!cell(0, 1).querySelector('.bk'), '11/23만 취소');
book(0, 1, '1-1', '국어', true);
assert(/겹치는 예약/.test($('#toast').textContent) && !cell(0, 1).querySelector('.bk'), '반복끼리 겹침 거부: ' + $('#toast').textContent);
$('#mClose').click();
$('#nextWeek').click(); assert(cell(0, 1).textContent.includes('3-2'), '11/30은 그대로');
cell(0, 1).click(); $('#mCancelAll').click();
assert(!cell(0, 1).querySelector('.bk'), '11/30부터 끝');
$('#nextWeek').click(); assert(!cell(0, 1).querySelector('.bk'), '12/7도 없음');
week('2026-11-16'); assert(cell(0, 1).textContent.includes('3-2'), '지난 기록(11/16)은 남음');
// 7) 연도 넘김
week('2026-12-31');
assert($('#weekLabel').textContent === '2026. 12. 28.(월) - 2027. 1. 1.(금)', '연말 주: ' + $('#weekLabel').textContent);
$('#nextWeek').click();
assert($('#weekLabel').textContent === '2027. 1. 4.(월) - 1. 8.(금)' && $$('#grid thead th')[1].textContent === '1/4(월)', '새해 주: ' + $('#weekLabel').textContent);
// 8) 내 반만 보기
week('2026-11-18');
set('#myCls', '5-1'); if (!$('#mineBtn').classList.contains('on')) $('#mineBtn').click();
assert($$('#grid .bk.mine').length === 1 && $$('#grid .bk.other').length === 1 && cell(0, 1).querySelector('.bk.other'), '내 반 강조·다른 반 흐리게');
assert($('#myList').textContent.includes('테스트실') && $('#myList').textContent.includes('11/18(수) 3교시'), '내 반 이번 주 목록: ' + $('#myList').textContent);
$('#mineBtn').click();
assert(!$('#grid .bk.other'), '내 반만 보기 끄기');
// 9) 이름 바꾸기 → 예약 유지
$('#roomsBtn').click();
const inp = $$('#roomList input[data-rid]').find(i => i.value === '테스트실');
inp.value = '테스트 실험실'; fire(inp, 'change'); $('#roomsClose').click();
assert(tabOf('테스트 실험실') && tabOf('테스트 실험실').classList.contains('on') && cell(2, 3).textContent.includes('5-1'), '이름 바꿔도 예약 유지');
assert(tabOf('테스트 실험실').querySelector('.c').textContent === '2', '이번 주 예약 수 2: ' + tabOf('테스트 실험실').textContent);
// 10) 인쇄: 특별실별 한 장
const p0 = window.__printed || 0;
$('#printBtn').click();
assert((window.__printed || 0) === p0 + 1 && $$('#printArea .pg').length === nRooms + 1 && $('#printArea').textContent.includes('테스트 실험실 주간 예약표') && $('#printArea').textContent.includes('2026. 11. 16.(월) - 11. 20.(금)'), '인쇄: ' + $$('#printArea .pg').length);
// 11) 저장
await wait(400);
const st = JSON.parse(localStorage.getItem('edu-expo.room-booking.v1') || 'null');
const rid = st.rooms.find(r => r.name === '테스트 실험실').id;
assert(st.singles.filter(s => s.room === rid).length === 2 && st.rules.filter(r => r.room === rid).length === 1 && st.rules.find(r => r.room === rid).skip.includes('2026-11-23') && st.rules.find(r => r.room === rid).until === '2026-11-29' && st.myCls === '5-1', '저장: ' + JSON.stringify(st.rules.filter(r => r.room === rid)));
return 'ok 11';
