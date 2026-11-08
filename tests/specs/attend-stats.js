// 89 출결 모으미: 예시 명단·기록 → 학생별 집계(구분×종류), 월별 집계, 개근 후보, 경고(중복·이름 다름·못 읽은 줄), 기간 필터, CSV(BOM·CRLF·수식 방지), 저장·지우기
const A = window.__as;
assert(A, '__as 가 있어야 함');
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const cell = (no, c) => { const td = $(`#stuTable tr[data-no="${no}"] td[data-c="${c}"]`); return td ? td.textContent.trim() : null; };
const blobs = [];
const origURL = URL.createObjectURL;
URL.createObjectURL = b => { blobs.push(b); return origURL.call(URL, b); };
HTMLAnchorElement.prototype.click = function () { if (blobs.length) blobs[blobs.length - 1].name = this.download; };
const lastCsv = async () => { const b = blobs[blobs.length - 1]; const buf = new Uint8Array(await b.arrayBuffer()); return { name: b.name, buf, text: new TextDecoder('utf-8', { ignoreBOM: true }).decode(buf) }; };

ok(text().includes('출결 모으미') && $$('#stuTable tbody tr').length === 12, '첫 화면: 예시 12명 집계표');
// 1) 학생별 집계 (정답값)
ok(cell(2, '결석-질병') === '2' && cell(2, '조퇴-질병') === '1' && cell(2, '결과-질병') === '1' && cell(2, '합계') === '4', '박서준: 질병결석 2·질병조퇴 1·질병결과 1(번호 없이 이름만 쓴 줄 포함)');
ok(cell(5, '지각-미인정') === '2' && cell(5, '결석-미인정') === '1' && cell(5, '지각-계') === '2', '정하은: 미인정 지각 2·결석 1');
ok(cell(11, '결석-기타') === '2', '한소율: "2일" → 기타 결석 2');
ok(cell(3, '지각-질병') === '1', '이도윤: 같은 줄 중복은 한 번만');
ok(cell(12, '결석-질병') === '1' && $('#stuTable tr[data-no="12"] td[data-c="이름"]').textContent === '오지호', '이름 빈칸 → 명단에서 이름 채움');
ok(cell(4, '결석-질병') === '1' && $('#stuTable tr[data-no="4"] td[data-c="이름"]').textContent === '최지우', '번호 기준(명단 이름 사용)');
ok(cell(7, '조퇴-기타') === '1' && cell(9, '결과-질병') === '1', '조서아 9/22 형식·장예린 10월 13일 형식');
ok(cell(1, '합계') === '0' && cell(1, '결석-계') === '0', '김하늘 0');
const tot = c => $(`#stuTable tfoot td[data-c="${c}"]`).textContent.trim();
ok(tot('결석-계') === '7' && tot('지각-계') === '3' && tot('조퇴-계') === '2' && tot('결과-계') === '2' && tot('합계') === '14', '전체 합계 7·3·2·2: ' + ['결석-계', '지각-계', '조퇴-계', '결과-계', '합계'].map(tot).join(','));
// 2) 월별
const mrow = m => $$(`#monthTable tr[data-m="${m}"] td`).map(td => td.textContent.trim());
ok(mrow(9).slice(1, 6).join(',') === '2,1,1,0,4', '9월: ' + mrow(9).join(','));
ok(mrow(10).slice(1, 6).join(',') === '1,1,1,1,4', '10월: ' + mrow(10).join(','));
ok(mrow(11).slice(1, 6).join(',') === '4,1,0,1,6', '11월: ' + mrow(11).join(','));
// 3) 개근 후보
const perf = () => $$('#perfect .chip').map(c => c.textContent.trim());
ok(perf().join(',') === '1 김하늘,6 강민준,8 윤시우,10 임건우', '개근 후보 4명: ' + perf().join(','));
// 4) 경고
const iss = $('#issues').textContent;
ok(/중복/.test(iss) && /최지오/.test(iss) && /최지우/.test(iss) && /그냥 메모/.test(iss), '경고: 중복·이름 다름·못 읽은 줄: ' + iss.slice(0, 160));
ok(A.result().errors.length === 1, '못 읽은 줄 1개');
// 5) 기간 필터: 10월만
const ps = $('#period'); ps.value = '10'; fire(ps, 'change');
ok(cell(2, '합계') === '1' && cell(5, '합계') === '2' && cell(9, '합계') === '1' && perf().length === 9, '10월만: 박서준 1·정하은 2·장예린 1·개근 9명');
ps.value = 'all'; fire(ps, 'change');
// 6) 붙여넣기 형식: 엑셀(탭) + 머리줄 + 합친 구분("미인정지각")
const rec = $('#records'), ros = $('#roster');
rec.value = '날짜\t번호\t이름\t구분\t종류\n2026-03-05\t1\t김하늘\t\t미인정지각\n2026-03-06\t1\t김하늘\t질병\t결석\n'; fire(rec, 'input'); await wait(50);
ok(cell(1, '지각-미인정') === '1' && cell(1, '결석-질병') === '1' && A.result().errors.length === 0, '탭 붙여넣기·머리줄 무시·합친 표기');
ok(perf().length === 11 && $$('#monthTable tbody tr').length === 1 && mrow(3).length > 0, '3월 기록만');
// 명단에 없는 학생
rec.value = '2026-04-01 13 새학생 질병 결석'; fire(rec, 'input'); await wait(50);
ok($('#stuTable tr[data-no="13"]') && /명단에 없/.test($('#issues').textContent), '명단에 없는 학생도 표에 넣고 경고');
// 7) CSV: BOM·CRLF·수식 방지
ros.value = '1 =SUM(A1)\n2 @김'; fire(ros, 'input');
rec.value = '2026-05-01 1 질병 결석'; fire(rec, 'input'); await wait(50);
$('#csvBtn').click(); await wait(50);
const c = await lastCsv();
ok(c.buf[0] === 0xEF && c.buf[1] === 0xBB && c.buf[2] === 0xBF && c.name.endsWith('.csv'), 'CSV BOM·이름: ' + c.name);
const L = c.text.replace(/^﻿/, '').split('\r\n');
ok(L[0].startsWith('번호,이름,결석-질병,결석-미인정,결석-기타,결석-계,지각-질병') && L[0].endsWith(',합계'), 'CSV 머리줄: ' + L[0]);
ok(L[1] === "1,'=SUM(A1),1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1" && L[2].startsWith("2,'@김,"), 'CSV 수식 방지·값: ' + L[1] + ' / ' + L[2]);
// 인쇄
$('#printBtn').click(); ok(window.__printed >= 1, '인쇄');
// 8) 저장 → 예시 다시 넣기
await wait(400);
const sv = JSON.parse(localStorage.getItem('edu-expo.attend-stats.v1'));
ok(sv && sv.records === '2026-05-01 1 질병 결석' && sv.roster.startsWith('1 =SUM'), '저장: ' + JSON.stringify(sv).slice(0, 80));
$('#sampleBtn').click(); await wait(50);
ok($$('#stuTable tbody tr').length === 12 && cell(2, '합계') === '4', '예시 다시 넣기');
ok($('#wipeAll') && /이 PC 기록 모두 지우기/.test($('#wipeAll').textContent), '이 PC 기록 모두 지우기 버튼');
return 'ok ' + n;
