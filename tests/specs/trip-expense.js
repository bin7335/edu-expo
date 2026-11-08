// 100 출장비 계산기: 출장 시간 자동, 4시간 이상/미만 여비, 공용차량 감액(0원 아래로 안 내려감), 같은 날 합산 기준, 기준 설정 변경, 붙여넣기(날짜 형식·오류 줄), 월별 합계, 수정·삭제, CSV 수식 방지, 인쇄, 저장
const T = window.__trip;
assert(T && typeof T.setData === 'function', '__trip 있어야 함');
T.setData({ trips: [] });
const set = (sel, v) => { const el = $(sel); el.value = v; fire(el, 'input'); fire(el, 'change'); };
const sum = k => $('#sum [data-k="' + k + '"] b').textContent;
const rows = () => $$('#trips tbody tr[data-id]');
const amt = i => rows()[i].querySelector('[data-k="amt"]').textContent;
const dur = i => rows()[i].querySelector('[data-k="dur"]').textContent;
// 0) 기본 기준값
assert($('#cTh').value === '4' && $('#cHi').value === '20000' && $('#cLo').value === '10000' && $('#cCar').value === '10000' && /기관별 기준이 다를 수 있으니 확인하세요/.test(document.body.innerText), '기본 기준·안내 문구');
// 1) 붙여넣기: 제목 줄 건너뜀, 여러 날짜 형식, 오류 줄
set('#bulk', '날짜\t출발\t복귀\t용무\t장소\t공용차량\n2027-01-05\t09:00\t13:00\t교육청 회의\t햇살교육지원청\tX\n2027-01-05\t14:00\t15:30\t협의회\t햇살중학교\tO\n2027.1.6\t13:00\t16:59\t연수\t연수원\t\n2027/01/07\t8:30\t17:30\t현장체험 답사\t과학관\t관용차\n2027-01-08\t15:00\t14:00\t잘못된 줄\t-\tX');
$('#bulkAdd').click();
assert(T.state().trips.length === 4 && /4건 추가/.test($('#toast').textContent) && /1줄/.test($('#toast').textContent), '붙여넣기 4건·오류 1줄: ' + $('#toast').textContent);
set('#month', '2027-01');
assert(rows().length === 4, '1월 4건');
assert(dur(0) === '4시간' && dur(1) === '1시간 30분' && dur(2) === '3시간 59분' && dur(3) === '9시간', '출장 시간: ' + [0, 1, 2, 3].map(dur).join(','));
// 2) 건별: 4시간 이상 2만 / 공용차량 감액(1만-1만=0) / 4시간 미만 1만 / 4시간 이상+공용차량 1만
assert(amt(0) === '20,000' && amt(1) === '0' && amt(2) === '10,000' && amt(3) === '10,000', '건별 여비: ' + [0, 1, 2, 3].map(amt).join(','));
assert(sum('cnt') === '4' && sum('time') === '18시간 29분' && sum('total') === '40,000', '월 합계: ' + sum('cnt') + '/' + sum('time') + '/' + sum('total'));
// 3) 같은 날 합산: 1/5는 5시간 30분 → 2만 - 공용차량 1만 = 1만 → 합계 3만
set('#cMode', 'day');
assert(sum('total') === '30,000' && amt(0) === '10,000' && /합산/.test(amt(1)), '같은 날 합산: ' + sum('total') + ' / ' + amt(0) + ' / ' + amt(1));
set('#cMode', 'each');
// 4) 기준 설정 바꾸기
set('#cHi', '25000');
assert(sum('total') === '50,000', '4시간 이상 25,000원(공용차량 9시간 건은 15,000): ' + sum('total'));
set('#cTh', '3');
assert(amt(2) === '25,000' && sum('total') === '65,000', '기준 3시간: ' + sum('total'));
set('#cTh', '4'); set('#cHi', '20000');
assert(sum('total') === '40,000', '원래대로 40,000');
// 5) 직접 입력 + 복귀 시각 오류 거부
const add = (d, s, e, p, pl, car) => { set('#fDate', d); set('#fStart', s); set('#fEnd', e); set('#fPurpose', p); set('#fPlace', pl); $('#fCar').checked = car; $('#addBtn').click(); };
add('2027-02-01', '11:00', '10:00', '오류', '어딘가', false);
assert(T.state().trips.length === 4 && /복귀/.test($('#toast').textContent), '복귀가 출발보다 빠르면 거부');
add('2027-02-01', '10:00', '11:00', '=cmd|calc', '교육지원청', false);
assert(T.state().trips.length === 5, '직접 입력');
// 6) 월별 합계 표
const mrow = m => $$('#monthly tbody tr').find(r => r.querySelector('td').textContent === m);
assert(mrow('2027년 1월') && /4건/.test(mrow('2027년 1월').textContent) && mrow('2027년 1월').textContent.includes('40,000') && mrow('2027년 2월').textContent.includes('10,000'), '월별 합계 표: ' + $('#monthly').textContent);
set('#month', '2027-02');
assert(rows().length === 1 && sum('total') === '10,000', '2월 보기');
// 7) 수정: 공용차량 체크 → 0원
rows()[0].querySelector('[data-edit]').click();
assert($('#fPurpose').value === '=cmd|calc' && /수정/.test($('#addBtn').textContent), '수정 불러오기');
$('#fCar').checked = true; $('#addBtn').click();
assert(T.state().trips.length === 5 && amt(0) === '0', '수정 후 0원');
// 8) CSV 수식 방지
const csv = T.csv();
assert(csv.split('\n')[0] === '날짜,출발,복귀,출장 시간(분),용무,장소,공용차량,여비(원)' && csv.includes("2027-02-01,10:00,11:00,60,'=cmd|calc,교육지원청,O,0"), 'CSV: ' + csv);
// 9) 인쇄(선택한 달)
set('#month', '2027-01'); const p0 = window.__printed || 0;
$('#printBtn').click();
assert((window.__printed || 0) === p0 + 1 && $$('#printArea tbody tr').length === 4 && $('#printArea').textContent.includes('40,000'), '인쇄');
// 10) 삭제·이스케이프·저장
set('#month', '2027-02'); rows()[0].querySelector('[data-del]').click(); await wait(50);
assert(T.state().trips.length === 4, '삭제');
add('2027-03-02', '09:00', '10:00', '<b>굵게</b>', '<i>곳</i>', false);
set('#month', '2027-03');
assert(!$('#trips tbody b') && !$('#trips tbody i') && rows()[0].textContent.includes('<b>굵게</b>'), '이스케이프');
await wait(400);
const st = JSON.parse(localStorage.getItem('edu-expo.trip-expense.v1') || 'null');
assert(st && st.trips.length === 5 && st.cfg.hi === 20000 && st.cfg.th === 4 && st.cfg.mode === 'each', '저장: ' + JSON.stringify(st && st.cfg));
return 'ok 10';
