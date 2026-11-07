// 12 별총총 칭찬판: 톡 +1(고른 항목), 꾹 −1, 되돌리기, 모둠·학급 합계, 목표 달성 축하, 설정 저장
const cards = () => $$('#grid .card');
const pt = i => parseInt(cards()[i].querySelector('.pt').textContent);
const sum = () => Number($('#sum').textContent);
const st = () => JSON.parse(localStorage.getItem('praiseboard-v1'));
const tap = i => { const c = cards()[i]; const o = { bubbles: true, clientX: 10, clientY: 10, button: 0 }; c.dispatchEvent(new PointerEvent('pointerdown', o)); c.dispatchEvent(new PointerEvent('pointerup', o)); };
const teamTotals = () => $$('#teams .tp').map(t => Number(t.textContent));
const check = tag => {
  const pts = cards().map((c, i) => pt(i));
  assert(sum() === pts.reduce((a, b) => a + b, 0), `${tag}: 학급 합계 = 학생 점수 합`);
  const n = teamTotals().length, exp = Array(n).fill(0);
  pts.forEach((p, i) => exp[i % n] += p);
  assert(teamTotals().join() === exp.join(), `${tag}: 모둠 합계 ${teamTotals()} ≠ ${exp}`);
  const pct = Math.min(100, Math.round(sum() / 80 * 100));
  assert($('#barPct').textContent === pct + '%', `${tag}: 진행률 ${$('#barPct').textContent}`);
};
assert(sum() === 70 && cards().length === 24, '예시 24명 70점');
check('처음');
// 1) '도전' 항목 고르고 톡 → +1, 배지에 🔥 반영
$$('#cats .chip').find(c => c.dataset.k === 'ch').click();
const p0 = pt(2), ch0 = st().students[2].p.ch;
tap(2);
assert(pt(2) === p0 + 1 && st().students[2].p.ch === ch0 + 1, '도전 +1');
assert(cards()[2].querySelector('.bd').textContent.includes('🔥' + (ch0 + 1)), '배지 🔥 표시');
check('톡 후');
// 2) − 버튼으로 −1, 0점에서는 더 안 내려감
cards()[2].querySelector('.minus').click();
assert(pt(2) === p0, '− 버튼 −1');
$('#resetBtn').click(); $('#doReset').click();
assert(sum() === 0, '초기화 → 0점');
cards()[0].querySelector('.minus').click();
assert(pt(0) === 0, '0점 아래로 내려가지 않음');
// 3) 꾹 누르기(0.6초) → −1
tap(0); tap(0); assert(pt(0) === 2, '톡 두 번 → 2');
const c0 = cards()[0];
c0.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10, button: 0 }));
await wait(750);
cards()[0].dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 10, clientY: 10 }));
assert(pt(0) === 1, '꾹 누르면 −1: ' + pt(0));
// 4) 되돌리기
tap(1); assert(pt(1) === 1, '톡 +1');
$('#undoBtn').click(); assert(pt(1) === 0, '되돌리기');
check('되돌리기 후');
// 5) 목표 달성 → 축하 창, 다음 목표 +50
$('#setBtn').click(); $('#sGoal').value = 5; $('#saveSet').click();
for (let i = 0; i < 4; i++) tap(3 + i);
assert(sum() === 5, '합계 5');
await wait(700);
assert($('#winM').classList.contains('show'), '목표 달성 축하 창');
$('#nextGoal').click();
assert($('#goalTxt').textContent === '/ 55점', '다음 목표 55: ' + $('#goalTxt').textContent);
// 6) 설정: 이름 바꾸고 모둠 2개, 기존 학생 점수 유지
$('#setBtn').click();
$('#sNames').value = '김하늘\n새친구'; $('#sTeams').value = '2'; $('#saveSet').click();
assert(cards().length === 2 && pt(0) === 1 && pt(1) === 0, '설정 저장(기존 점수 유지): ' + pt(0));
assert(teamTotals().length === 2, '모둠 2개');
assert(st().students.map(s => s.name).join() === '김하늘,새친구' && st().teams === 2, 'localStorage 저장');
return 'ok';
