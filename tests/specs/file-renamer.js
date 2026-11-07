// 30 이름척척: 규칙 적용 결과(정답 이름)·겹침/금지 글자 검사·ZIP 바이트(CRC·UTF-8 플래그·중앙 디렉터리)
const fr = window.__fr;
assert(fr, '__fr 이 있어야 함');
const ruleEl = i => $$('#rules .rule')[i];
const setRule = (i, k, v) => { const el = ruleEl(i).querySelector(`[data-k="${k}"]`); if (el.type === 'checkbox') el.checked = v; else el.value = v; fire(el, el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input'); };
const names = () => fr.plan.map(p => p.newName);
// 1) 기본 규칙 + 날짜 2026-11-20, 이름 가나다순 번호
assert(fr.rules().length === 5 && fr.rules()[4].type === 'date', '기본 규칙 5개');
setRule(4, 'day', '2026-11-20');
const want = ['01_강시우_독서감상문_20261120.hwp', '02_김하늘_독서감상문_20261120.hwp', '03_박지호_독서감상문_20261120.hwpx', '04_윤하은_독서감상문_20261120.hwp',
  '05_이서준_독서감상문_20261120.hwp', '06_정예린_독서감상문_20261120.pdf', '07_최민준_독서감상문_20261120.docx', '08_한도윤_독서감상문_20261120.pdf'];
assert(JSON.stringify(names()) === JSON.stringify(want), '기본 규칙 결과: ' + names().join(' / '));
assert($('#pChanged').textContent === '바뀜 8' && $('#pBad').hidden, '바뀜 8, 문제 없음');
// 2) 날짜 형식·위치, 번호 자릿수·시작
setRule(4, 'fmt', 'YYMMDD'); setRule(4, 'pos', 'front');
setRule(3, 'digits', '3'); setRule(3, 'start', '7');
assert(names()[0] === '261120_007_강시우_독서감상문.hwp', '날짜 앞·번호 3자리: ' + names()[0]);
setRule(4, 'fmt', 'YYYY-MM-DD'); setRule(4, 'pos', 'back');
assert(names()[1] === '008_김하늘_독서감상문_2026-11-20.hwp', 'YYYY-MM-DD: ' + names()[1]);
// 3) 파일 수정일 날짜 + 수정한 날짜순(샘플 수정일: 2026-11-03 09시부터 7시간 간격)
setRule(4, 'src', 'mtime'); setRule(4, 'fmt', 'MMDD');
const ss = $('#sortSel'); ss.value = 'date'; fire(ss, 'change');
assert(names()[0] === '007_김하늘_독서감상문_1103.hwp' && names()[7] === '014_한도윤_독서감상문_1105.pdf', '수정일 순·MMDD: ' + names()[0] + ' ' + names()[7]);
// 4) 확장자 유지 끄기 → 확장자까지 이름으로 보고 공백 정리
$('#keepExt').checked = false; fire($('#keepExt'), 'change');
assert(names()[0] === '007_김하늘_독서감상문.hwp_1103', '확장자 유지 끄기: ' + names()[0]);
$('#keepExt').checked = true; fire($('#keepExt'), 'change');
// 5) 문제 검사: 금지 글자, 이름 겹침, 정규식 오류 → 저장 버튼 꺼짐
document.querySelector('[data-add="prefix"]').click();
const last = () => $$('#rules .rule').length - 1;
setRule(last(), 'text', 'a:b');
assert($('#pBad').textContent === '문제 8' && $('#saveBtn').disabled && $('#zipBtn').disabled, '금지 글자 → 문제 8');
ruleEl(last()).querySelector('[data-act=del]').click();
assert($('#pBad').hidden && !$('#zipBtn').disabled, '규칙 삭제 후 문제 없음');
setRule(3, 'on', false); setRule(4, 'on', false);
document.querySelector('[data-add="replace"]').click();
setRule(last(), 'find', '^[^_]+_'); setRule(last(), 'regex', true);
// 이름이 지워지면 hwp 4개·pdf 2개가 같은 이름
assert($('#pBad').textContent === '문제 6', '겹침 6: ' + $('#pBad').textContent);
assert(fr.plan.filter(p => p.err === '이름이 겹쳐요').length === 6, '겹침 사유');
setRule(last(), 'find', '(');
assert(fr.plan.every(p => p.err === '규칙 식 오류'), '정규식 오류 표시');
setRule(last(), 'regex', false); setRule(last(), 'find', ''); setRule(3, 'on', true); setRule(4, 'on', true);
// 6) CRC32 정답값과 ZIP 구조
assert(fr.crc32(new TextEncoder().encode('123456789')) === 0xCBF43926, 'CRC32("123456789") = CBF43926');
const data = new TextEncoder().encode('안녕 zip');
const zb = new Uint8Array(await fr.makeZip([{ name: '가_1.txt', data, date: new Date(2026, 10, 20, 13, 45, 30) }, { name: 'b.txt', data: new Uint8Array(0), date: new Date(2026, 0, 1) }]).arrayBuffer());
const dv = new DataView(zb.buffer), nb = new TextEncoder().encode('가_1.txt');
assert(dv.getUint32(0, true) === 0x04034b50, '로컬 헤더 서명');
assert(dv.getUint16(6, true) === 0x0800, 'UTF-8 파일명 플래그(0x0800)');
assert(dv.getUint16(8, true) === 0, '무압축(store)');
assert(dv.getUint32(14, true) === fr.crc32(data) && dv.getUint32(18, true) === data.length && dv.getUint32(22, true) === data.length, 'CRC·크기');
assert(dv.getUint16(26, true) === nb.length && new TextDecoder().decode(zb.slice(30, 30 + nb.length)) === '가_1.txt', '파일명 바이트');
assert(new TextDecoder().decode(zb.slice(30 + nb.length, 30 + nb.length + data.length)) === '안녕 zip', '본문 바이트');
assert(dv.getUint16(10, true) === ((13 << 11) | (45 << 5) | 15) && dv.getUint16(12, true) === (((2026 - 1980) << 9) | (11 << 5) | 20), 'DOS 날짜·시간');
const eo = zb.length - 22;
assert(dv.getUint32(eo, true) === 0x06054b50 && dv.getUint16(eo + 10, true) === 2, '끝 레코드·항목 2개');
const cdOff = dv.getUint32(eo + 16, true), cdSize = dv.getUint32(eo + 12, true);
assert(cdOff + cdSize === eo && dv.getUint32(cdOff, true) === 0x02014b50 && dv.getUint16(cdOff + 8, true) === 0x0800, '중앙 디렉터리 위치·플래그');
const off2 = dv.getUint32(cdOff + 46 + nb.length + 42, true);
assert(off2 === 30 + nb.length + data.length && dv.getUint32(off2, true) === 0x04034b50, '두 번째 항목 오프셋');
// 7) 실제 파일을 넣으면 샘플이 빠지고, ZIP 버튼으로 받은 파일 내용·이름이 맞음
const dt = new DataTransfer();
dt.items.add(new File(['첫째 파일'], '독후감 1.txt', { lastModified: new Date(2026, 10, 1).getTime() }));
dt.items.add(new File(['둘째'], '독후감-2.txt', { lastModified: new Date(2026, 10, 2).getTime() }));
const fi = $('#fileIn'); fi.files = dt.files; fire(fi, 'change'); await wait(100);
ss.value = 'name'; fire(ss, 'change');
assert(fr.plan.length === 2 && JSON.stringify(names()) === JSON.stringify(['007_독서감상문_1_1101.txt', '008_독서감상문_2_1102.txt']), '실제 파일 이름: ' + names().join(' / '));
let got = null; const ou = URL.createObjectURL; URL.createObjectURL = b => { got = b; return ou.call(URL, b); };
HTMLAnchorElement.prototype.click = function () { got.name = this.download; };
$('#zipBtn').click(); for (let i = 0; i < 40 && !got; i++) await wait(50);
assert(got && /^이름척척_\d{8}\.zip$/.test(got.name), 'ZIP 파일명: ' + (got && got.name));
const z = new Uint8Array(await got.arrayBuffer()), zv = new DataView(z.buffer);
const n1 = zv.getUint16(26, true), s1 = zv.getUint32(18, true);
assert(new TextDecoder().decode(z.slice(30, 30 + n1)) === '007_독서감상문_1_1101.txt' && new TextDecoder().decode(z.slice(30 + n1, 30 + n1 + s1)) === '첫째 파일', 'ZIP 안 첫 파일');
assert(zv.getUint32(14, true) === fr.crc32(new TextEncoder().encode('첫째 파일')), 'ZIP 안 CRC');
return 'ok 7';
