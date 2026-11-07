// 69 얼음 과녁: 시연 화면 → 시작 → 정확한 힘(가운데 10점) → 같은 길로 던져 충돌(앞 스톤 밀림) → 회전(휨) → 닦기(더 멀리) → 약한 투구(호그선 전 아웃) → 끌어 놓기 투구 → 라운드 전환(방해 스톤) → 키보드 투구 → 일시정지 → 결과·최고 기록 → 다시 하기
const S = () => __test.state();
const mine = () => S().stones.filter(s => s.team === 'me');
const toAim = () => { __test.settle(); __test.step(40); };
assert(text().includes('얼음 과녁') && $('#ready').classList.contains('on'), '제목·준비 카드');
assert(S().phase === 'attract' && S().stones.length >= 4, '첫 화면 시연 스톤: ' + S().stones.length);
__test.seed(11);
$('#start').click(); await wait(30);
let s = S();
assert(s.phase === 'aim' && s.round === 1 && s.throwsLeft === 6 && s.stones.length === 0, '게임 시작: 1라운드, 스톤 6개');
assert(!document.body.classList.contains('attract') && $('#sweep').disabled, '조작 막대 보임·닦기는 미끄러질 때만');
// 1) 정확한 힘 → 가운데
__test.throw(0, __test.powerFor(s.tee - s.u0), 0);
assert(S().phase === 'move' && S().throwsLeft === 5 && !$('#sweep').disabled, '던짐 → 미끄러짐, 닦기 버튼 켜짐');
__test.step(30);
assert(mine()[0].u > s.u0 + 100 && mine()[0].speed > 0, '스톤이 앞으로 미끄러짐');
__test.settle();
let m = mine()[0];
assert(Math.abs(m.u - s.tee) < 6 && Math.abs(m.v) < 1 && m.pts === 10, '가운데 정지 10점: ' + JSON.stringify(m));
assert(S().roundScore === 10 && $('#score').textContent === '10', '점수 10 표시');
assert(S().phase === 'wait', '정지 후 잠깐 대기');
__test.step(40); assert(S().phase === 'aim', '다음 겨누기');
// 2) 같은 길 → 충돌, 앞 스톤이 밀려남
const u1 = m.u;
__test.throw(0, __test.powerFor(s.tee - s.u0), 0); __test.settle();
const ms = mine();
assert(ms.length === 2 && ms[0].u > u1 + 5, '충돌로 앞 스톤 밀림: ' + u1.toFixed(1) + ' → ' + ms[0].u.toFixed(1));
assert(ms[1].u < ms[0].u && S().roundScore >= 12, '두 스톤 점수 합: ' + S().roundScore);
__test.step(40);
// 3) 회전 → 오른쪽으로 휨
$('#curl').click();
assert(S().spin === 1 && $('#curl').textContent.includes('오른쪽'), '회전 버튼: 오른쪽');
__test.throw(0, __test.powerFor(420), 1); __test.settle();
m = mine()[2];
assert(m.v > 15, '오른쪽 회전 → 휘어 감 v=' + m.v.toFixed(1));
$('#curl').click(); $('#curl').click();
assert(S().spin === 0, '회전 끄기');
toAim();
// 4) 닦기 → 더 멀리
__test.sweep(true); __test.throw(-6, __test.powerFor(300), 0); __test.settle(); __test.sweep(false);
m = mine()[3];
assert(m.u > s.u0 + 300 + 60, '닦기로 더 멀리: ' + m.u.toFixed(1));
toAim();
// 5) 너무 약하면 호그선 전 → 아웃
const before = S().stones.filter(x => !x.out).length;
__test.throw(0, 0.02, 0); __test.settle();
assert(S().stones.filter(x => !x.out).length === before, '호그선 못 넘으면 빠짐');
toAim();
// 6) 화면을 뒤로 끌었다 놓아서 던지기
const [sx, sy] = __test.screen(s.u0, 0);
const cvs = $('#cv');
cvs.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: sx + 300, clientY: sy }));
window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: sx + 150, clientY: sy }));
__test.step(1);
window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: sx + 150, clientY: sy }));
assert(S().phase === 'move' && S().throwsLeft === 0, '끌어 놓기로 던짐(마지막 스톤)');
__test.settle();
assert(S().phase === 'between' && $('#banner').classList.contains('on') && $('#banner').textContent.includes('1라운드'), '1라운드 끝 안내');
const r1 = S().total;
assert(r1 >= 12, '1라운드 점수 누적: ' + r1);
__test.step(120);
s = S();
assert(s.phase === 'aim' && s.round === 2 && s.stones.filter(x => x.team === 'obs').length === 2 && $('#round').textContent === '2', '2라운드: 방해 스톤 2개');
// 키보드: 오른쪽 화살표(힘↑)·스페이스(던지기)
for (let i = 0; i < 5; i++) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
document.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
assert(S().phase === 'move' && S().throwsLeft === 5, '스페이스로 던지기');
// 일시정지
$('#pauseBtn').click();
assert(S().phase === 'paused' && $('#paused').classList.contains('on'), '일시정지 카드');
const p0 = mine()[0].u; __test.step(30);
assert(mine()[0].u === p0, '멈춘 동안 스톤 정지');
$('#resume').click(); assert(S().phase === 'move', '계속하기');
__test.settle();
for (let r = 0; r < 20 && S().phase !== 'result'; r++) {
  __test.step(150);
  if (S().phase === 'aim') { __test.throw(0, __test.powerFor(560), 0); __test.settle(); }
}
await wait(30);
s = S();
assert(s.phase === 'result' && $('#result').classList.contains('on'), '3라운드 끝 → 결과');
assert($('#rScore').textContent === s.total + '점' && $('#rStat').textContent.includes('3라운드'), '결과: ' + $('#rScore').textContent + ' / ' + $('#rStat').textContent);
assert(s.total > r1 && !$('#newrec').hidden && $('#best').textContent === String(s.total), '새 최고 기록 ' + s.total);
assert(JSON.parse(localStorage.getItem('edu-expo-ice-curling-v1')).best === s.total, '최고 기록 저장');
$('#again').click(); await wait(20);
assert(S().phase === 'aim' && S().round === 1 && S().total === 0 && $('#score').textContent === '0', '다시 하기');
$('#snd').click();
assert(JSON.parse(localStorage.getItem('edu-expo-ice-curling-v1')).sound === false, '소리 끄기 저장');
return 'ok 33';
