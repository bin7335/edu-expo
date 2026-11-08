// 92 학급비 장부: 항목별 집행·잔액·집행률, 초과 경고, 월별 합계, 지출 추가·엑셀 붙여넣기(새 항목 자동)·삭제·필터, CSV 수식 방지, 저장
const cb = window.__cb;
assert(cb, '__cb 가 있어야 함');
const t = s => $(s).textContent.trim();
const row = name => $$('#items .irow').find(r => r.querySelector('.iname').value === name);
// 1) 샘플 정답값 (손계산)
// 학습 준비물 86,400+64,000+58,800=209,200 / 학급 행사 38,500+96,000+31,000=165,500(초과 15,500) / 환경 꾸미기 42,000+55,000=97,000 / 학생 격려 27,300+52,000=79,300
assert(t('#sumBudget') === '600,000' && t('#sumSpent') === '551,000' && t('#sumLeft') === '49,000' && t('#sumRate') === '91.8%', '합계 카드: ' + [t('#sumBudget'), t('#sumSpent'), t('#sumLeft'), t('#sumRate')]);
assert(row('학습 준비물').querySelector('.ispent').textContent === '209,200' && row('학습 준비물').querySelector('.ileft').textContent === '40,800' && row('학습 준비물').querySelector('.irate').textContent === '83.7%', '학습 준비물: ' + row('학습 준비물').textContent);
assert(row('학급 행사').classList.contains('over') && /15,500원 초과/.test(row('학급 행사').textContent) && row('학급 행사').querySelector('.irate').textContent === '110.3%', '학급 행사 초과: ' + row('학급 행사').textContent);
assert(!row('환경 꾸미기').classList.contains('over') && row('학생 격려').querySelector('.ispent').textContent === '79,300', '나머지 항목');
assert(/학급 행사/.test(t('#warn')) && /15,500원/.test(t('#warn')), '초과 경고 띠: ' + t('#warn'));
// 막대 너비 = 집행률(최대 100%)
assert(row('학습 준비물').querySelector('.fill').style.width === '83.7%' && row('학급 행사').querySelector('.fill').style.width === '100%', '막대 너비');
// 월별 합계
const mon = m => $('#m-' + m + ' .mv').textContent;
assert(mon(3) === '128,400' && mon(4) === '102,500' && mon(5) === '123,300' && mon(6) === '55,000' && mon(8) === '0' && mon(10) === '31,000', '월별: ' + [3, 4, 5, 6, 8, 10].map(mon));
assert($$('#list tbody tr').length === 10, '지출 10건');
// 2) 지출 추가 → 학습 준비물 초과 4,200
$('#fDate').value = '2026-11-02'; $('#fItem').value = '학습 준비물'; $('#fDesc').value = '겨울 독서 활동지 인쇄'; $('#fAmt').value = '45,000원'; $('#fProof').value = '세금계산서';
$('#addBtn').click();
assert(row('학습 준비물').querySelector('.ispent').textContent === '254,200' && row('학습 준비물').classList.contains('over') && /4,200원 초과/.test(row('학습 준비물').textContent), '추가 후 초과: ' + row('학습 준비물').textContent);
assert(/학습 준비물 예산을 4,200원 넘었어요/.test(t('#toast')), '초과 알림: ' + t('#toast'));
assert(t('#sumSpent') === '596,000' && t('#sumLeft') === '4,000' && t('#sumRate') === '99.3%' && mon(11) === '45,000', '추가 후 합계');
assert($('#fDesc').value === '' && $('#fAmt').value === '', '입력칸 비움');
// 금액 없으면 추가 안 됨
$('#fDesc').value = '금액 없음'; $('#addBtn').click();
assert($$('#list tbody tr').length === 11, '금액 없으면 추가 안 됨');
// 3) 엑셀 붙여넣기: 날짜 형식 정리, 없는 항목은 새로 만듦(예산 0)
$('#paste').value = '날짜\t항목\t내용\t금액\t증빙\n2026-11-05\t학생 격려\t학기말 간식\t12,000\t카드영수증\n2026.11.6\t졸업 준비\t앨범 꾸미기\t3000\t\n잘못된 줄';
$('#pasteBtn').click();
assert($$('#list tbody tr').length === 13, '붙여넣기 2건 추가(머리줄·잘못된 줄 제외): ' + $$('#list tbody tr').length);
assert(cb.state().spends.some(s => s.date === '2026-11-06' && s.item === '졸업 준비' && s.amount === 3000), '날짜 정리 2026.11.6 → 2026-11-06');
assert(row('졸업 준비') && row('졸업 준비').querySelector('.ibud').value === '0' && row('졸업 준비').classList.contains('over'), '새 항목 자동 추가(예산 0)');
assert(/2건을 넣었어요/.test(t('#toast')) && /1줄은 건너뜀/.test(t('#toast')), '붙여넣기 결과: ' + t('#toast'));
// 4) 예산 바꾸기 → 초과 해소
const bud = row('학급 행사').querySelector('.ibud'); bud.value = '170,000'; fire(bud, 'change');
assert(!row('학급 행사').classList.contains('over') && row('학급 행사').querySelector('.ileft').textContent === '4,500', '예산 수정: ' + row('학급 행사').textContent);
assert(t('#sumBudget') === '620,000', '총 예산 620,000: ' + t('#sumBudget'));
// 5) 필터
$('#filter').value = '학생 격려'; fire($('#filter'), 'change');
assert($$('#list tbody tr').length === 3 && /91,300/.test(t('#listSum')), '항목 필터 3건·합계 91,300: ' + t('#listSum'));
$('#filter').value = ''; fire($('#filter'), 'change');
// 6) CSV: 수식 방지, 머리줄
$('#fDate').value = '2026-11-07'; $('#fItem').value = '학생 격려'; $('#fDesc').value = '=SUM(A1)'; $('#fAmt').value = '1000'; $('#addBtn').click();
const csv = cb.csv();
const lines = csv.replace(/^﻿/, '').split('\r\n');
assert(lines[0] === '날짜,항목,내용,금액,증빙', 'CSV 머리줄: ' + lines[0]);
assert(csv.includes("'=SUM(A1)") && !/(^|,)=SUM/m.test(csv), 'CSV 수식 방지');
assert(lines.includes('2026-03-05,학습 준비물,색연필·스케치북 32인분,86400,카드영수증'), 'CSV 행: ' + lines[1]);
// 7) 삭제 (목록은 날짜순)
const n0 = $$('#list tbody tr').length;
const dates = $$('#list tbody tr').map(r => r.querySelector('input[type=date]').value);
assert(dates.join() === [...dates].sort().join(), '날짜순 정렬');
$('#list tbody tr [data-del]').click();
assert($$('#list tbody tr').length === n0 - 1 && !cb.state().spends.some(s => s.desc === '색연필·스케치북 32인분'), '삭제');
// 8) 저장
await wait(400);
const st = JSON.parse(localStorage.getItem('edu-expo.class-budget.v1') || 'null');
assert(st && st.spends.length === n0 - 1 && st.items.some(i => i.name === '졸업 준비'), '저장');
return 'ok 8';
