// 71 꼬마 운전 연습: 첫 화면(자동 운전 시연) → 페달·핸들(동시 터치)·키보드 조작 → 콘·연석 감점 → S자 결승 → 빨간불 위반 감점 / 정지선 앞 정지·보행자 양보 → 주차 판정 → 최종 결과·최고 기록
const S = () => __test.state();
const front = () => S().car.x + Math.cos(S().car.a) * 31;
assert(text().includes('꼬마 운전 연습') && $('#ready').classList.contains('on'), '제목·준비 카드');
const x0 = S().car.x; await wait(600);
assert(S().state === 'ready' && Math.abs(S().car.x - x0) > 5, '첫 화면에서 차가 스스로 달림(시연)');
$('#start').click(); await wait(30); __test.manual(true);
assert(S().state === 'play' && S().mission === 1 && $('#ctlL').classList.contains('on'), '미션 1 시작, 핸들·페달 보임');
// 페달 + 핸들 동시 터치
const pe = (el, t, x, y, id) => el.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: x, clientY: y, bubbles: true, pointerType: 'touch', isPrimary: id === 1 }));
const gas = $('#gas'), wh = $('#wheel'), gr = gas.getBoundingClientRect(), wr = wh.getBoundingClientRect();
const wcx = wr.left + wr.width / 2, wcy = wr.top + wr.height / 2;
const sx = S().car.x;
pe(gas, 'pointerdown', gr.left + 20, gr.top + 20, 1);
__test.step(30);
assert(S().car.v > 20 && S().car.x > sx + 10 && gas.classList.contains('on'), '가속 페달로 전진: v=' + S().car.v.toFixed(1));
const a0 = S().car.a;
pe(wh, 'pointerdown', wcx, wcy - 50, 2); pe(wh, 'pointermove', wcx + 35, wcy - 35, 2); pe(wh, 'pointermove', wcx + 50, wcy, 2);
__test.step(20);
assert(S().car.steer > 0.05 && S().car.a > a0 + 0.05, '페달 누른 채 핸들 오른쪽(멀티터치) → 방향 바뀜');
pe(wh, 'pointerup', wcx + 50, wcy, 2); pe(gas, 'pointerup', gr.left + 20, gr.top + 20, 1);
__test.input({ brake: true }); __test.step(60); __test.input(null); assert(Math.abs(S().car.steer) < 0.05 && !gas.classList.contains('on'), '손을 떼면 핸들 복귀');
// 속도가 빠를수록 덜 꺾임
__test.place(900, 180, Math.PI); __test.input({ gas: true }); __test.step(10); const sl = S().car.v; __test.input({ steer: 1 }); __test.step(30); const lowSteer = S().car.steer;
__test.place(900, 180, Math.PI); __test.input({ gas: true }); __test.step(80); const sh = S().car.v; __test.input({ gas: true, steer: 1 }); __test.step(30); const highSteer = S().car.steer;
assert(S().pen === 0 && sh > sl && highSteer < lowSteer, '속도에 따라 핸들 각도 제한: ' + lowSteer.toFixed(2) + ' > ' + highSteer.toFixed(2));
// 키보드
__test.input(null); __test.place(150, 280, 0);
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })); __test.step(30);
document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true }));
assert(S().car.v > 20, '↑ 키로 가속');
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); __test.step(60);
assert(S().car.v === 0, '↓ 키로 정지(누르고 있으면 그대로 섬)');
document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true })); __test.step(2);
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); __test.step(30);
document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true }));
assert(S().car.v < -5 && $('#spd').textContent.indexOf('R') === 0, '멈춘 뒤 다시 누르면 후진(R 표시)');
// 콘·연석 감점
__test.place(230, 320, 0); __test.input({ gas: true }); __test.step(40);
assert(S().pen === 1 && S().cones === 1 && $('#stars').textContent === '★★☆', '콘을 치면 감점: ' + JSON.stringify(S()));
__test.place(400, 110, -Math.PI / 2); __test.input({ gas: true }); __test.step(40);
assert(S().pen === 2 && S().car.y > 60 + 14 && S().toast.includes('연석'), '연석 충돌 감점·튕김');
// 빈틈 통과 → 결승
__test.place(250, 180, 0); __test.input({ gas: true }); __test.step(55);
assert(S().gates === 1, 'S자 첫 빈틈 통과');
__test.place(860, 280, 0); __test.step(70);
assert(S().state === 'mdone' && S().res[0].stars === 2 && $('#mcard').classList.contains('on'), '결승 → 미션 결과(감점 2 → 별 2)');
// 미션 2: 빨간불 무시
__test.mission(2); __test.input({ gas: true });
assert(S().mission === 2 && S().light === 'green', '미션 2 초록불 시작');
__test.step(60 * 8);
assert(S().crossed && S().pen >= 3 && S().state === 'mdone' && S().res[1].stars <= 1, '빨간불 통과는 신호 위반 감점: ' + JSON.stringify(S().res[1]));
// 미션 2: 정지선 앞 정지 → 보행자 건넘 → 초록불 출발
__test.mission(2);
for (let i = 0; i < 1500 && !(S().car.v === 0 && front() >= 548); i++) { const f = front(); __test.input(f < 548 ? { gas: S().car.v < 100 } : { brake: true }); __test.step(1); }
assert(S().light === 'red' && front() < 600 && front() >= 548, '빨간불, 정지선 앞에 정지: front=' + front().toFixed(1));
__test.step(60);
assert(S().light === 'walk' && S().ped.walk && S().toast.includes('정지선'), '정지 확인 → 보행자 건너기 시작');
__test.step(240);
assert(S().light === 'green2' && S().ped.done && S().car.v === 0, '보행자가 다 건넌 뒤 초록불');
__test.input({ gas: true }); __test.step(240);
assert(S().state === 'mdone' && S().res[1].stars === 3 && !S().crossed && !S().pedHit, '신호·양보 지킴 → 별 3');
// 미션 3: 주차된 차에 부딪힘, 칸 밖 정지는 판정 안 함, 비뚤게 주차 → 별 2
$('#next').click(); await wait(20);
assert(S().mission === 3 && S().state === 'play', '미션 3 시작');
__test.place(388, 300, -Math.PI / 2); __test.input({ gas: true }); __test.step(80);
assert(S().pen === 1 && S().toast.includes('주차'), '주차된 차에 부딪히면 감점');
__test.input(null); __test.place(400, 300, 0); __test.step(150);
assert(S().state === 'play', '주차 칸 밖에 멈추면 판정 안 함');
__test.mission(3); __test.place(546, 112, -Math.PI / 2 + 0.2); __test.step(150);
assert(S().state === 'mdone' && S().res[2].stars === 2, '비뚤게 주차 → 별 2: ' + JSON.stringify(S().res[2]));
__test.mission(3); __test.place(533, 101, -Math.PI / 2); __test.step(150);
assert(S().res[2].stars === 3 && $('#mDetail').textContent.includes('각도 오차 0°'), '반듯하게 주차 → 별 3');
// 최종 결과
$('#next').click(); await wait(20);
const total = S().res.reduce((a, r) => a + r.score, 0);
assert(S().state === 'result' && $('#rTotal').textContent === total + '점' && $$('#rRows div').length === 3, '최종 결과·미션별 점수');
assert($$('#tips li').length >= 4 && $('#tips').textContent.includes('횡단보도'), '교통안전 수칙 표시');
assert(!$('#newrec').hidden && JSON.parse(localStorage.getItem('edu-expo-mini-driver-v1')).best === total, '최고 기록 저장: ' + total);
// 다시 하기·일시정지
$('#again').click(); await wait(20);
assert(S().state === 'play' && S().mission === 1 && S().pen === 0 && $('#best').textContent === String(total), '다시 하기 → 미션 1');
__test.input({ gas: true }); $('#pauseBtn').click(); const px = S().car.x; __test.step(60);
assert(S().state === 'paused' && S().car.x === px, '일시정지 중엔 차가 멈춤');
$('#resume').click(); assert(S().state === 'play', '계속 운전');
__test.input(null); __test.manual(false);
$('#snd').click(); assert(JSON.parse(localStorage.getItem('edu-expo-mini-driver-v1')).sound === false, '소리 끄기 저장');
return 'ok 31';
