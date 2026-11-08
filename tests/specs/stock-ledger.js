// 99 교구 대장: 엑셀 붙여넣기 일괄 등록(제목 줄·오류 줄·같은 물품 갱신), 대여로 남은 수량·부족, 초과 대여 거부, 반납 지연, 필터·검색, 반납, 수정, CSV 수식 방지, 재물조사표 인쇄, 삭제, 저장
const S = window.__stock;
assert(S && typeof S.setData === 'function', '__stock 있어야 함');
S.setData({ items: [], loans: [] });
const set = (sel, v) => { const el = $(sel); el.value = v; fire(el, 'input'); fire(el, 'change'); };
const tab = n => $$('#tabs .tab').find(b => b.dataset.tab === n).click();
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const plus = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return ymd(d); };
const row = name => $$('#ledger tbody tr').find(r => r.querySelector('.nm') && r.querySelector('.nm').textContent === name);
const cellOf = (name, k) => row(name).querySelector('[data-k="' + k + '"]').textContent;
const item = name => S.state().items.find(i => i.name === name);
const sum = k => +$('#summary [data-k="' + k + '"] b').textContent;
// 1) 일괄 등록: 제목 줄 건너뜀, 오류 줄 표시
tab('bulk');
set('#bulk', '품명\t분류\t위치\t수량\t최소 수량\n테스트 비커\t과학\t과학실 A장\t10\t4\n테스트 공\t체육\t체육창고\t5\t2\n잘못된줄\t\t\t많이\t1\n\n=SUM(1)\t기타\t교무실\t1\t0');
assert($$('#bulkPreview tr.ok').length === 3 && $$('#bulkPreview tr.err').length === 1 && /수량/.test($('#bulkPreview tr.err').textContent), '미리보기 3개 정상·1개 오류');
assert(/3개 등록/.test($('#bulkAdd').textContent), '등록 버튼 개수: ' + $('#bulkAdd').textContent);
$('#bulkAdd').click();
assert(S.state().items.length === 3 && /추가 3/.test($('#toast').textContent), '3개 등록: ' + $('#toast').textContent);
// 같은 품명·위치는 갱신
set('#bulk', '테스트 공\t체육\t체육창고\t8\t2'); $('#bulkAdd').click();
assert(S.state().items.length === 3 && item('테스트 공').qty === 8 && /갱신 1/.test($('#toast').textContent), '같은 물품 갱신');
// 2) 대장 표시
tab('ledger');
assert(cellOf('테스트 비커', 'avail') === '10' && cellOf('테스트 비커', 'state') === '정상' && sum('items') === 3 && sum('low') === 0, '처음 상태');
// 3) 대여 → 남은 수량·부족
tab('loan');
const lend = (name, who, n, d, due) => { set('#lItem', item(name).id); set('#lWho', who); set('#lN', String(n)); set('#lDate', d); set('#lDue', due); $('#lSave').click(); };
lend('테스트 비커', '5-1 김선생', 7, plus(0), plus(7));
assert(S.state().loans.length === 1, '대여 1건');
lend('테스트 비커', '6-2 이선생', 4, plus(0), plus(7));
assert(S.state().loans.length === 1 && /남은 수량 3개/.test($('#toast').textContent), '남은 수량 초과 거부: ' + $('#toast').textContent);
lend('테스트 공', '체육부', 1, plus(-10), plus(-1));
lend('테스트 공', '', 1, plus(0), plus(1));
assert(S.state().loans.length === 2 && /누가/.test($('#toast').textContent), '빌린 사람 빈칸 거부');
lend('테스트 공', '3-1', 1, plus(0), plus(-1));
assert(S.state().loans.length === 2 && /반납 예정일/.test($('#toast').textContent), '반납 예정일이 빌린 날보다 앞이면 거부');
const late = $$('#loans tbody tr').find(r => r.textContent.includes('체육부'));
assert(late && late.classList.contains('late') && /1일 지남/.test(late.textContent), '반납 지연 표시: ' + (late && late.textContent));
tab('ledger');
assert(cellOf('테스트 비커', 'out') === '7' && cellOf('테스트 비커', 'avail') === '3' && cellOf('테스트 비커', 'state') === '부족' && row('테스트 비커').classList.contains('low'), '부족 강조');
assert(cellOf('테스트 공', 'state') === '반납 지연' && sum('low') === 1 && sum('late') === 1 && sum('out') === 2, '요약: 부족 1·지연 1·대여 2');
// 4) 필터·검색
set('#flt', 'low'); assert($$('#ledger tbody tr').length === 1 && row('테스트 비커'), '부족만');
set('#flt', 'late'); assert($$('#ledger tbody tr').length === 1 && row('테스트 공'), '지연만');
set('#flt', ''); set('#cat', '체육'); assert($$('#ledger tbody tr').length === 1, '분류 필터');
set('#cat', ''); set('#q', '비커'); assert($$('#ledger tbody tr').length === 1, '검색');
set('#q', '과학실'); assert($$('#ledger tbody tr').length === 1, '위치도 검색');
set('#q', '');
// 5) 반납
tab('loan');
$$('#loans tbody tr').find(r => r.textContent.includes('5-1 김선생')).querySelector('[data-ret]').click();
assert(S.state().loans.find(l => l.who === '5-1 김선생').ret === plus(0) && $('#history').textContent.includes('5-1 김선생'), '반납 기록');
tab('ledger');
assert(cellOf('테스트 비커', 'avail') === '10' && sum('low') === 0, '반납하면 다시 10');
// 6) 수정: 최소 수량 9로 → 남은 7 < 9 부족
row('테스트 공').querySelector('[data-edit]').click();
assert($('#iName').value === '테스트 공' && $('#iQty').value === '8', '수정 불러오기');
set('#iMin', '9'); $('#iSave').click();
assert(item('테스트 공').min === 9 && cellOf('테스트 공', 'avail') === '7' && row('테스트 공').classList.contains('low'), '수정 후 부족');
// 새 물품 직접 추가(수량 음수 거부)
set('#iName', '테스트 자'); set('#iCat', '수학'); set('#iLoc', '수학실'); set('#iQty', '-3'); set('#iMin', '0'); $('#iSave').click();
assert(!item('테스트 자') && /수량/.test($('#toast').textContent), '음수 수량 거부');
set('#iQty', '30'); $('#iSave').click();
assert(item('테스트 자') && item('테스트 자').qty === 30, '직접 추가');
// 7) CSV(수식 방지)
const csv = S.csv();
assert(csv.split('\n')[0] === '품명,분류,위치,총 수량,대여 중,남은 수량,최소 수량,상태,비고' && csv.includes("'=SUM(1),기타,교무실,1,0,1,0,정상,") && csv.includes('테스트 공,체육,체육창고,8,1,7,9,부족'), 'CSV: ' + csv);
// 8) 재물조사표 인쇄
const p0 = window.__printed || 0;
$('#printBtn').click();
assert((window.__printed || 0) === p0 + 1 && $$('#printArea tbody tr').length === 4 && /재물조사표/.test($('#printArea').textContent), '재물조사표: ' + $$('#printArea tbody tr').length);
// 9) 삭제(대여 기록도 함께)
row('테스트 공').querySelector('[data-del]').click(); await wait(50);
assert(!item('테스트 공') && !S.state().loans.some(l => l.who === '체육부'), '물품 삭제 시 대여 기록도 삭제');
// 10) 이스케이프·저장
set('#iName', '<b>굵게</b>'); set('#iQty', '1'); set('#iMin', '0'); $('#iSave').click();
assert(!$('#ledger tbody b') && row('<b>굵게</b>'), '이스케이프');
await wait(400);
const st = JSON.parse(localStorage.getItem('edu-expo.stock-ledger.v1') || 'null');
assert(st && st.items.length === 4 && st.loans.length === 1 && st.loans[0].ret, '저장: ' + JSON.stringify(st).slice(0, 120));
return 'ok 10';
