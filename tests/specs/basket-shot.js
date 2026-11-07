// 70 교실 농구: 첫 화면(시연 장면) → 시작 → 계산된 슛 성공·약한 슛 실패 → 키보드 조준·충전 슛 → 손가락 쓸기 슛 → 5골 뒤 골대 이동 → 일시정지 → 시간 종료·최고 기록 → 다시 하기
const S = () => __test.state();
// 공 위치에서 골대 중심을 T초 뒤 위에서 아래로 지나가는 속도
const aim = (T = 1.0) => { const s = S(); return [(s.hoop.x - s.ball.x) / T, (s.hoop.y - s.ball.y - 0.5 * s.g * T * T) / T]; };
assert(text().includes('교실 농구') && $('#ready').classList.contains('on'), '제목·준비 카드');
assert($('a[href="../"]') && $('#cv').width > 0, '캔버스·전체 데모 링크');
await wait(1600);
assert(S().state === 'ready' && (S().ball.mode === 'fly' || S().ball.x > 0), '첫 화면 시연 장면이 움직임');
__test.seed(3); __test.manual(true);
$('#start').click(); await wait(30);
assert(S().state === 'play' && !$('#ready').classList.contains('on') && S().ball.mode === 'hold', '게임 시작, 공 준비');
// 1) 계산된 슛 → 골
let [vx, vy] = aim(); assert(__test.shoot(vx, vy), '슛 발사');
assert(S().ball.mode === 'fly' && S().shots === 1, '공이 날아감');
__test.step(60); assert(S().baskets === 1 && S().score >= 2, '정확한 슛은 골: ' + JSON.stringify(S()));
assert(S().swishes === 1 && S().score === 3, '림에 안 닿으면 스위시 +3: ' + S().score);
__test.step(150); assert(S().ball.mode === 'hold', '공이 다시 손에');
// 2) 약한 슛 → 실패, 연속 초기화
__test.shoot(150, -350); __test.step(240);
assert(S().baskets === 1 && S().streak === 0 && S().shots === 2 && S().ball.mode === 'hold', '약한 슛은 실패: ' + JSON.stringify(S()));
// 3) 림 맞고 튕김(앞 림을 겨냥) → 스위시 아님
{ const s = S(); const T = 1.0; const tx = s.hoop.x - 46; __test.shoot((tx - s.ball.x) / T, (s.hoop.y - 10 - s.ball.y - 0.5 * s.g * T * T) / T); __test.step(300);
  assert(S().swishes === 1, '림을 맞은 공은 스위시가 아님'); }
// 4) 키보드: 각도 바꾸고 스페이스 충전 → 발사
const a0 = S().aim.ang;
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); __test.step(20);
document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft', bubbles: true }));
assert(S().aim.ang > a0, '← 로 각도 올림: ' + a0 + '→' + S().aim.ang);
const n0 = S().shots;
document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); __test.step(30);
assert(S().aim.charging && S().aim.power > 0.3, '스페이스로 힘 충전: ' + S().aim.power);
document.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
assert(S().ball.mode === 'fly' && S().shots === n0 + 1 && S().ball.vy < 0, '스페이스를 떼면 슛');
__test.step(360);
// 5) 손가락(포인터)으로 위로 쓸기
const cv = $('#cv'), r = cv.getBoundingClientRect();
const pe = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: 7, clientX: x, clientY: y, bubbles: true, isPrimary: true, pointerType: 'touch' }));
const n1 = S().shots;
pe('pointerdown', r.left + 300, r.top + 450); await wait(30); pe('pointermove', r.left + 330, r.top + 380); await wait(30); pe('pointermove', r.left + 360, r.top + 300); pe('pointerup', r.left + 360, r.top + 300);
assert(S().shots === n1 + 1 && S().ball.mode === 'fly' && S().ball.vy < 0 && S().ball.vx > 0, '위로 쓸면 오른쪽 위로 던짐');
__test.step(360);
// 아래로 쓸면 던지지 않음
pe('pointerdown', r.left + 300, r.top + 300); await wait(30); pe('pointermove', r.left + 300, r.top + 400); pe('pointerup', r.left + 300, r.top + 400);
assert(S().shots === n1 + 1 && S().ball.mode === 'hold', '아래로 쓸면 슛 안 됨');
// 6) 연속 골 → 불꽃, 5골 뒤 골대 이동
for (let g = 0; g < 20 && S().baskets < 5; g++) { [vx, vy] = aim(); __test.shoot(vx, vy); __test.step(240); }
assert(S().streak >= 3 && $('#streakP').classList.contains('fire'), '3연속 불꽃 표시');
assert(S().hoop.moving, '5골 뒤 골대 움직임');
const hx = S().hoop.x; __test.step(40); assert(Math.abs(S().hoop.x - hx) > 3, '골대 x 변화');
// 7) 일시정지
$('#pauseBtn').click(); assert(S().state === 'paused' && $('#paused').classList.contains('on'), '일시정지');
const tp = S().time; __test.step(120); assert(S().time === tp, '멈춘 동안 시간 정지');
$('#resume').click(); assert(S().state === 'play', '계속하기');
// 8) 시간 종료 → 결과·최고 기록
const sc = S().score;
__test.step(60 * 65); await wait(30);
assert(S().state === 'result' && $('#result').classList.contains('on'), '시간 종료 → 결과');
assert($('#rScore').textContent === sc + '점' && $('#rStat').textContent.includes('성공 5/'), '결과 점수·통계: ' + $('#rStat').textContent);
assert(!$('#newrec').hidden && JSON.parse(localStorage.getItem('edu-expo-basket-shot-v1')).best === sc, '최고 기록 저장');
$('#again').click(); await wait(30);
assert(S().state === 'play' && S().score === 0 && $('#best').textContent === String(sc) && !S().hoop.moving, '다시 하기 → 새 게임, 최고 기록 표시');
__test.end(); assert($('#newrec').hidden, '0점은 새 기록 아님');
$('#snd').click(); assert(JSON.parse(localStorage.getItem('edu-expo-basket-shot-v1')).sound === false, '소리 끄기 저장');
__test.manual(false);
return 'ok 27';
