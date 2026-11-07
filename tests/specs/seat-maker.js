// 11 자리척척: 여러 번 섞어도 짝 고정·떨어뜨리기·앞자리 조건이 지켜지고, 모두 한 번씩 앉으며, 자리 바꾸기·저장이 된다
const COLS = () => Number($('#cols').value);
const seatNames = () => $$('#grid .seat').map(s => s.classList.contains('empty') ? null : s.childNodes[1].nodeValue);
const names = $('#names').value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
const rc = (i, c) => ({ r: Math.floor(i / c), c: i % c });
const near = (i, j, c) => { const a = rc(i, c), b = rc(j, c); return Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1; };
const desk = (i, j, c) => { const a = rc(i, c), b = rc(j, c); return a.r === b.r && Math.floor(a.c / 2) === Math.floor(b.c / 2) && a.c !== b.c; };
const fix = [['김하늘', '이서준'], ['정예린', '조하윤']], sep = [['박지호', '최민준'], ['강시우', '윤도현']], front = ['장서아', '한유찬'];
function check(tag) {
  const s = seatNames(), c = COLS(), pos = {};
  s.forEach((n, i) => { if (n) pos[n] = i; });
  const placed = s.filter(Boolean);
  assert(placed.length === names.length && new Set(placed).size === names.length, `${tag}: 모든 학생이 한 번씩 (${placed.length}/${names.length})`);
  for (const [a, b] of fix) assert(desk(pos[a], pos[b], c), `${tag}: 짝 고정 ${a}·${b} (${pos[a]},${pos[b]})`);
  for (const [a, b] of sep) assert(!near(pos[a], pos[b], c), `${tag}: 떨어뜨리기 ${a}·${b} (${pos[a]},${pos[b]})`);
  for (const n of front) assert(pos[n] < 2 * c, `${tag}: 앞자리 ${n} (${pos[n]})`);
}
check('처음');
const layouts = new Set();
for (let k = 0; k < 8; k++) {
  $('#shuffleBtn').click(); await wait(1350);
  assert($('#msg').textContent.includes('조건을 모두 지켜'), '섞기 완료 메시지: ' + $('#msg').textContent);
  check(`${k + 1}번째 섞기`);
  layouts.add(seatNames().join());
}
assert(layouts.size >= 6, '섞을 때마다 배치가 달라야 함: ' + layouts.size);
// 저장
const st = JSON.parse(localStorage.getItem('seatmaker-v1'));
assert(st.seats.join() === seatNames().map(n => n ?? '').join() || st.seats.map(n => n ?? '').join() === seatNames().map(n => n ?? '').join(), '마지막 배치 저장');
// 두 자리 차례로 눌러 바꾸기
const before = seatNames();
const tapSeat = i => { const s = $$('#grid .seat')[i]; s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 5, clientY: 5 })); window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 5, clientY: 5 })); };
const free = before.map((n, i) => i).filter(i => i >= 2 * COLS() && before[i] && ![...fix.flat(), ...sep.flat()].includes(before[i]));
const a = free[0], b = free[free.length - 1];
tapSeat(a);
assert($$('#grid .seat')[a].classList.contains('sel'), '첫 자리 선택 표시');
tapSeat(b);
const after = seatNames();
assert(after[a] === before[b] && after[b] === before[a], `자리 바꾸기 ${a}↔${b}`);
assert(JSON.parse(localStorage.getItem('seatmaker-v1')).seats[a] === after[a], '바꾼 자리 저장');
// 떨어뜨리기 학생을 붙여 놓으면 경고
const s2 = seatNames(), c = COLS();
const pA = s2.indexOf('박지호'), pB = s2.indexOf('최민준');
const nb = [pA - 1, pA + 1, pA - c, pA + c].find(i => i >= 0 && i < s2.length && near(i, pA, c) && i !== pB && !fix.flat().includes(s2[i]));
tapSeat(pB); tapSeat(nb);
assert($('#msg').textContent.includes('가까움') && $('#msg').classList.contains('bad'), '가까이 두면 경고: ' + $('#msg').textContent);
// 교실 크기 바꾸기
$('#rows').value = 7; $('#cols').value = 4; fire($('#cols'), 'change');
assert($$('#grid .seat').length === 28, '7×4 = 28자리');
$('#shuffleBtn').click(); await wait(1350);
check('7×4 섞기');
return 'ok';
