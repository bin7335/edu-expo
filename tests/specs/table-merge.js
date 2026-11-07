// 29 표 모으미: 합치기 행·열 수, 열 이름 맞춤, 중복·빈칸 개수, 묶음 나누기, CSV(BOM·따옴표·CRLF)
const tm = window.__tm;
assert(tm, '__tm 이 있어야 함');
const blobs = [];
const origURL = URL.createObjectURL;
URL.createObjectURL = b => { blobs.push(b); return origURL.call(URL, b); };
HTMLAnchorElement.prototype.click = function () { blobs[blobs.length - 1].name = this.download; };
const lastCsv = async () => { const b = blobs[blobs.length - 1]; const buf = new Uint8Array(await b.arrayBuffer()); return { name: b.name, buf, text: new TextDecoder('utf-8', { ignoreBOM: true }).decode(buf) }; };
const tab = v => document.querySelector(`.tab[data-v="${v}"]`).click();
// 1) 합치기: 3개 표(6+5+5행) → 16행, 열 6개 + 출처
tab('merge');
let t = tm.table;
assert(t.rows.length === 16, '합친 행 16: ' + t.rows.length);
assert(t.head.join(',') === '출처,번호,이름,성별,보호자 연락처,방과후 신청,비고', '열 순서: ' + t.head.join(','));
assert(/3\D+16\D+7/.test($('#opts .stat').textContent), '요약 문구: ' + $('#opts .stat').textContent);
// 2반은 '성명'→'이름', 열 순서가 달라도 같은 열로
const r2 = t.rows.find(r => r.cells[0] === '3학년 2반');
assert(r2.cells[2] === '강시우' && r2.cells[5] === '축구' && r2.cells[4] === '010-0000-0201', '2반 열 맞춤: ' + r2.cells.join('|'));
assert(/성명.+이름/.test($('#notes').textContent) && /비고/.test($('#notes').textContent), '열 맞춤 안내: ' + $('#notes').textContent);
// 출처 열 빼기
const os = $('#optSrc'); os.checked = false; fire(os, 'change');
assert(tm.table.head[0] === '번호' && tm.table.head.length === 6, '출처 열 빼기');
$('#optSrc').checked = true; fire($('#optSrc'), 'change');
// 2) CSV: BOM, CRLF, 헤더
$('#csvBtn').click(); await wait(50);
let c = await lastCsv();
assert(c.buf[0] === 0xEF && c.buf[1] === 0xBB && c.buf[2] === 0xBF, 'CSV 첫 3바이트 UTF-8 BOM');
const lines = c.text.replace(/^﻿/, '').split('\r\n');
assert(lines[0] === '출처,번호,이름,성별,보호자 연락처,방과후 신청,비고' && lines.length === 18 && lines[17] === '', 'CSV 줄 수·CRLF: ' + lines.length);
assert(c.name === '합친명단.csv', 'CSV 파일명: ' + c.name);
// 3) 중복: 이름+보호자 연락처가 같은 윤하은(1반·3반) → 1건, 중복 빼면 15행
assert($('#bDup').textContent === '1', '중복 1건: ' + $('#bDup').textContent);
tab('dup');
assert(tm.table.rows.length === 2 && tm.table.rows.every(r => r.cells[2] === '윤하은'), '중복 행 2개(윤하은)');
$('#dedupBtn').click(); await wait(50);
c = await lastCsv();
assert(c.text.split('\r\n').filter(Boolean).length === 16 && c.name === '중복제거_합친명단.csv', '중복 뺀 CSV 15행+머리');
// 기준에서 연락처를 빼고 이름만 → 여전히 1건, 이름 기준 해제 + 연락처만 → 1건(같은 번호)
const keyBox = k => $(`#opts input[data-key="${k}"]`);
keyBox('보호자연락처').checked = false; fire(keyBox('보호자연락처'), 'change');
assert($('#bDup').textContent === '1', '이름만 기준 1건');
keyBox('이름').checked = false; fire(keyBox('이름'), 'change');
assert($('#bDup').textContent === '0' && /골라/.test($('#tableWrap').textContent), '기준 없으면 0건');
keyBox('이름').checked = true; fire(keyBox('이름'), 'change');
keyBox('보호자연락처').checked = true; fire(keyBox('보호자연락처'), 'change');
// 4) 빈칸: 비고는 기본 제외 → 3개(최민준 신청, 오다온 성별, 배수아 연락처)
assert($('#bBlank').textContent === '3', '빈칸 3개: ' + $('#bBlank').textContent);
tab('blank');
assert(tm.table.rows.map(r => r.cells[2]).sort().join(',') === ['배수아', '오다온', '최민준'].sort().join(','), '빈칸 행: ' + tm.table.rows.map(r => r.cells[2]));
assert($$('#tableWrap td.blank').length === 3, '빈칸 강조 3칸');
const bk = $('#opts input[data-bk="비고"]'); bk.checked = true; fire(bk, 'change');
assert($('#bBlank').textContent === String(3 + 11 + 3), '비고 포함 빈칸 17: ' + $('#bBlank').textContent);
// 5) 나누기: 방과후 신청 기준 4묶음 (로봇과학 6, 축구 5, 빈칸 1, 바이올린 4)
tab('split');
const chips = $$('#groups .gchip').map(b => b.textContent);
assert(chips.join('|') === '로봇과학 (6)|축구 (5)|(빈칸) (1)|바이올린 (4)', '묶음: ' + chips.join('|'));
$$('#groups .gchip')[1].click();
assert(tm.table.rows.length === 5 && tm.table.rows.every(r => r.cells[5] === '축구'), '축구 묶음 5행');
assert(!$('#allBtn').hidden, '그룹별 모두 받기 버튼');
const ss = $('#splitSel'); ss.value = '성별'; fire(ss, 'change');
assert($$('#groups .gchip').map(b => b.textContent).join('|') === '여 (8)|남 (7)|(빈칸) (1)', '성별 묶음: ' + $$('#groups .gchip').map(b => b.textContent).join('|'));
// 6) CSV 해석: 따옴표 안 쉼표·줄바꿈·"" 이스케이프, BOM 제거
const p = tm.parse('﻿학생명,휴대폰,메모\r\n"김, 철수",010-1,"줄1\n줄2"\r\n"따옴""표",010-2,\r\n,,\r\n');
assert(p.length === 3 && p[1][0] === '김, 철수' && p[1][2] === '줄1\n줄2' && p[2][0] === '따옴"표', 'CSV 해석: ' + JSON.stringify(p));
// 7) 표 추가: 별칭 열(학생명→이름, 휴대폰→연락처 새 열), 쉼표 들어간 값은 CSV에서 따옴표
tab('merge');
$('#addBtn').click(); await wait(50);
const tas = $$('#srcList textarea'), ta = tas[tas.length - 1];
ta.value = '학생명,휴대폰,방과후\n"김, 철수",010-9,"로봇,과학"'; fire(ta, 'input'); await wait(300);
t = tm.table;
assert(t.rows.length === 17 && t.head.includes('휴대폰'), '표 추가 후 17행, 새 열: ' + t.head.join(','));
const nr = t.rows[16];
assert(nr.cells[2] === '김, 철수' && nr.cells[5] === '로봇,과학', '별칭 열 맞춤: ' + nr.cells.join('|'));
$('#csvBtn').click(); await wait(50);
c = await lastCsv();
assert(c.text.includes('"김, 철수"') && c.text.includes('"로봇,과학"'), 'CSV 쉼표 값 따옴표');
// CSV 수식 주입 막기: =, +, -, @ 로 시작하는 값은 앞에 ' 를 붙여 글자로
ta.value = '학생명,메모\n=HYPERLINK("http://x"),+1\n@SUM(A1),-2'; fire(ta, 'input'); await wait(300);
$('#csvBtn').click(); await wait(50);
c = await lastCsv();
const cl = c.text.split('\r\n');
assert(cl.some(l => l.includes(`"'=HYPERLINK(""http://x"")"`)) && cl.some(l => l.includes(`'@SUM(A1)`)), 'CSV 수식 주입 방지(=, @): ' + cl.slice(-3).join(' / '));
assert(cl.some(l => /,'\+1$/.test(l)) && cl.some(l => /,'-2$/.test(l)), 'CSV 수식 주입 방지(+, -): ' + cl.slice(-3).join(' / '));
assert(!cl.some(l => /(^|,)[=+\-@]/.test(l)), '수식으로 시작하는 칸이 없어야 함');
// 8) 표 빼기
$$('#srcList [data-del]')[3].click(); await wait(50);
assert(tm.table.rows.length === 16 && $('#srcCount').textContent === '3개', '표 빼기');
return 'ok 8';
