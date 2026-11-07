// 15 척척 QR 이름표: QR 개수, 번호 빠르게 만들기(바꾸기·추가), 크기·제목·저장, 너무 긴 줄 안내, 확대 보기, QR 구조(버전·파인더·타이밍·형식 비트) 검증
const tags = () => $$('#grid .tag[data-i]');
const st = () => JSON.parse(localStorage.getItem('qr-maker-v1'));
assert(tags().length === 12 && $('#count').textContent.startsWith('QR 12개'), '예시 12개: ' + $('#count').textContent);
// 1) QR 구조 검증
function check(text, expVer) {
  const q = QR.encode(text), m = q.modules, n = q.size;
  assert(n === q.ver * 4 + 17, '크기 = 버전×4+17');
  if (expVer) assert(q.ver === expVer, `"${text.slice(0, 20)}" 버전 ${expVer}: ${q.ver}`);
  const finder = (x0, y0) => { for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 7; dx++) { const d = Math.max(Math.abs(dx - 3), Math.abs(dy - 3)); if (m[y0 + dy][x0 + dx] !== (d !== 2)) return false; } return true; };
  assert(finder(0, 0) && finder(n - 7, 0) && finder(0, n - 7), '파인더 패턴 3개');
  for (let i = 8; i < n - 8; i++) assert(m[6][i] === (i % 2 === 0) && m[i][6] === (i % 2 === 0), '타이밍 패턴');
  assert(m[n - 8][8] === true, '다크 모듈');
  // 형식 비트 두 벌이 같고, BCH 검사 통과, 오류 정정 레벨 M(00)
  let a = 0, b = 0;
  const A = []; for (let i = 0; i <= 5; i++) A.push(m[i][8]); A.push(m[7][8], m[8][8], m[8][7]); for (let i = 9; i < 15; i++) A.push(m[8][14 - i]);
  const B = []; for (let i = 0; i < 8; i++) B.push(m[8][n - 1 - i]); for (let i = 8; i < 15; i++) B.push(m[n - 15 + i][8]);
  A.forEach((v, i) => a |= (v ? 1 : 0) << i); B.forEach((v, i) => b |= (v ? 1 : 0) << i);
  assert(a === b, '형식 비트 두 벌 일치');
  const f = a ^ 0x5412; let r = f; for (let i = 14; i >= 10; i--) if (r >> i & 1) r ^= 0x537 << (i - 10);
  assert(r === 0, '형식 비트 BCH');
  assert((f >> 13) === 0 && (f >> 10 & 7) === q.mask, '레벨 M, 마스크 번호 일치');
  return q;
}
check('https://example.org/class/group-1', 3); // 33바이트 → M 버전 3
check('A', 1);
check('3학년 2반 사물함 1번');
assert(check('가'.repeat(100)).ver >= 7, '긴 한글은 버전 7 이상(버전 정보 포함)');
// 화면의 첫 QR이 같은 내용으로 만들어졌는지(모듈 수)
const vb = tags()[0].querySelector('svg').getAttribute('viewBox').split(' ').map(Number);
assert(vb[2] === 29 + 8, '첫 QR viewBox = 버전3(29) + 여백 8: ' + vb);
// 2) 번호 빠르게 만들기
$('#qPrefix').value = '사물함'; $('#qFrom').value = 30; $('#qTo').value = 1;
$('#qReplace').click();
assert(tags().length === 30 && $('#input').value.split('\n')[0] === '사물함 1번 | 사물함 1번', '범위 뒤집혀도 1-30번 30개');
$('#qFrom').value = 1; $('#qTo').value = 3; $('#qAppend').click();
assert(tags().length === 33 && $('#count').textContent.startsWith('QR 33개'), '아래에 추가 → 33개');
// 3) 크기·제목·저장
$$('#sizeSeg button').find(b => b.dataset.c === '3').click();
assert($('#grid').style.gridTemplateColumns.startsWith('repeat(3') && st().cols === 3, '크게 → 3칸, 저장');
$('#sheetTitle').value = '우리 반 QR'; fire($('#sheetTitle'), 'input');
assert($('#titleOut').textContent === '우리 반 QR' && st().title === '우리 반 QR', '제목 반영·저장');
// 4) | 없이 적으면 이름표=내용, 너무 긴 줄은 안내
$('#input').value = '안녕하세요\n긴줄 | ' + 'x'.repeat(3000); fire($('#input'), 'input'); await wait(300);
assert(tags().length === 1 && !tags()[0].querySelector('.sub'), '| 없는 줄은 내용 줄 없음');
assert($('#grid .tag.bad') && $('#count').textContent.includes('1개는 너무 길어서'), '너무 긴 줄 안내: ' + $('#count').textContent);
assert(st().text.startsWith('안녕하세요'), '목록 저장');
// 5) 확대 보기
$('#sample').click();
tags()[4].click();
assert($('#modal').classList.contains('show') && $('#mLb').textContent === '도서 코너' && $('#mSub').textContent.includes('마당을 나온'), '확대 보기');
assert($('#mQr svg'), '확대 QR');
$('#mClose').click();
assert(!$('#modal').classList.contains('show'), '닫기');
// 6) 태그 입력은 글자로
$('#input').value = '<b>굵게</b> | <i>x</i>'; fire($('#input'), 'input'); await wait(300);
assert(!$('#grid b') && !$('#grid i') && $('#grid').textContent.includes('<b>굵게</b>'), '이름표 이스케이프');
return 'ok';
