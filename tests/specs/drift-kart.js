// 72 운동장 드리프트: 첫 화면 시연 → 카운트다운(너무 빨리 밟으면 멈칫 / 숫자 1에 밟으면 스타트 부스터) → 가속·조향 → 드리프트 미끄러짐·자국·불꽃
// → 미니/슈퍼 부스터 → 게이지 → 아이템 2개 저장·사용 → 벽·모래·잔디·콘 감속 → 키보드·멀티터치 → 3바퀴 완주·순위·결과·최고 기록 → 일시정지·소리
const T = __test, S = () => T.state(), K = () => S().kart;
const ang = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const at = (f, lat, v) => { const p = T.onTrack(f, lat || 0); T.place(p.x, p.y, p.a, v || 0); return p; };
const kd = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const ku = k => document.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }));
const pe = (el, t, id) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: r.left + 10, clientY: r.top + 10, bubbles: true, pointerType: 'touch', isPrimary: id === 1 })); };
assert(text().includes('운동장 드리프트') && $('#ready').classList.contains('on') && text().includes('Shift'), '제목·시작 카드·키 안내');
const x0 = K().x, y0 = K().y; await wait(700);
assert(S().state === 'ready' && Math.hypot(K().x - x0, K().y - y0) > 30, '첫 화면에서 카트들이 스스로 달림(시연)');
// 카운트다운: 너무 빨리 밟음
T.seed(5); $('#start').click(); await wait(30); T.manual(true);
assert(S().state === 'count' && $('#cd').classList.contains('on') && $('#cd').textContent.startsWith('3') && $('#ctlR').classList.contains('on'), '카운트다운 3 · 터치 버튼 표시');
T.input({ gas: true }); T.step(60);
assert(S().state === 'count' && K().v === 0 && $('#cd').textContent.startsWith('2'), '카운트다운 중엔 출발 못 함');
while (S().state === 'count') T.step(1);
assert(S().state === 'race' && K().stall > 0 && K().boostT === 0 && S().toast.includes('너무'), '숫자 3부터 밟으면 멈칫(스타트 실패)');
// 숫자 1에 밟으면 스타트 부스터
T.input(null); T.start(); T.input(null);
while (S().cd > 0.8) T.step(1);
assert($('#cd').textContent.startsWith('1') && $('#cd').textContent.includes('가속'), '숫자 1: 지금 가속 안내');
T.input({ gas: true }); while (S().state === 'count') T.step(1);
assert(K().boostT > 1 && S().toast.includes('스타트 부스터'), '숫자 1에 가속 → 스타트 부스터');
T.step(45);
assert(K().v > T.VMAX && S().t > 0.7, '부스터로 일반 최고 속도보다 빠름: ' + K().v.toFixed(0));
// 가속·조향 (AI 정지)
T.freezeAI(true); at(0.03, 0, 0); T.input({ gas: true }); T.step(40);
assert(K().v > 200 && K().surf === 'road', '가속: v=' + K().v.toFixed(0));
let a0 = K().a; T.input({ gas: true, steer: 1 }); T.step(20);
assert(ang(K().a, a0) > 0.3 && K().steer > 0.8 && !K().drifting, '오른쪽 조향 → 방향 바뀜(드리프트 아님)');
at(0.03, 0, 300); T.input({ gas: true, steer: -1 }); T.step(30);
const gripVl = Math.abs(K().vl);
// 드리프트 → 미끄러짐·자국·게이지 → 슈퍼 부스터
const sk0 = S().skids; at(0.05, 0, 300); T.input({ gas: true, steer: -1, drift: true }); T.step(10);
assert(K().drifting && S().parts > 0, '드리프트 시작(불꽃·연기)');
T.step(55);
assert(K().drifting && Math.abs(K().vl) > 100 && Math.abs(K().vl) > gripVl * 1.5 && S().skids > sk0 + 20, '드리프트는 옆으로 크게 미끄러지고 타이어 자국: vl=' + K().vl.toFixed(0) + ' grip=' + gripVl.toFixed(0));
assert(K().charge >= 1.2 && K().gauge > 20 && parseFloat($('#gfill').style.width) > 20, '드리프트로 부스터 게이지 충전: ' + K().gauge.toFixed(1));
T.input({ gas: true }); T.step(2);
assert(!K().drifting && K().boostT > 0.8 && S().toast.includes('슈퍼'), '오래 버티고 떼면 슈퍼 부스터');
// 미니 부스터 / 너무 짧으면 없음
at(0.05, 0, 300); T.input({ gas: true, steer: -1, drift: true }); T.step(36); T.input({ gas: true }); T.step(1);
assert(K().boostT > 0.3 && K().boostT < 0.6 && S().toast.includes('미니'), '조금 버티면 미니 부스터: ' + K().boostT.toFixed(2));
at(0.05, 0, 300); T.input({ gas: true, steer: -1, drift: true }); T.step(12); T.input({ gas: true }); T.step(1);
assert(K().boostT === 0 && !K().drifting, '아주 짧은 드리프트는 부스터 없음');
// 게이지가 차면 아이템(최대 2개)
T.give(95, 0); at(0.05, 0, 300); T.input({ gas: true, steer: -1, drift: true }); T.step(20);
assert(K().items === 1 && K().gauge < 20 && S().toast.includes('아이템'), '게이지 가득 → 부스터 아이템 1개');
T.give(99, 1); at(0.05, 0, 300); T.step(20); assert(K().items === 2, '아이템 2개');
T.give(99, 2); at(0.05, 0, 300); T.step(20); assert(K().items === 2 && K().gauge === 100, '아이템은 최대 2개(게이지 가득 유지)');
T.input(null); at(0.03, 0, 200); T.step(1);
assert($('#items').textContent === '⚡⚡' && !$('#tBoost').disabled, 'HUD에 아이템 2개 표시');
kd('Control'); ku('Control'); T.step(1);
assert(K().items === 1 && K().boostT > 1.3, 'Ctrl 키로 부스터 아이템 사용');
pe($('#tBoost'), 'pointerdown', 7); pe($('#tBoost'), 'pointerup', 7); T.step(1);
assert(K().items === 0 && $('#tBoost').disabled, '부스터 버튼(터치)으로 사용 → 0개, 버튼 비활성');
// 벽·모래·잔디·콘
T.place(1000, 140, -Math.PI / 2, 320); const b0 = S().bumps; T.input({ gas: true }); T.step(30);
assert(S().bumps === b0 + 1 && K().v < 150 && K().y > T.fence.y0, '울타리에 부딪히면 튕기고 감속: v=' + K().v.toFixed(0));
T.place(T.sand.x, T.sand.y + 100, -Math.PI / 2, 300); T.step(60);
assert(K().surf === 'sand' && K().v < T.VMAX * 0.32 + 10, '모래밭에선 느려짐: v=' + K().v.toFixed(0));
T.place(1000, 900, 0, 300); T.step(60);
assert(K().surf === 'grass' && K().v < T.VMAX * 0.5 + 10 && K().v > T.VMAX * 0.32 + 10, '잔디(트랙 밖)도 느려짐: v=' + K().v.toFixed(0));
at(0.195, 60, 250); const c0 = S().cones; T.step(30);
assert(S().cones > c0, '콘을 치면 날아감');
// 키보드
T.input(null); at(0.03, 0, 0);
kd('ArrowUp'); T.step(30); assert(K().v > 150, '↑ 가속');
a0 = K().a; kd('ArrowLeft'); T.step(15); assert(K().steer < -0.5 && ang(K().a, a0) < -0.1, '← 조향');
kd('Shift'); T.step(10); assert(K().drifting, '← + Shift 드리프트');
ku('Shift'); ku('ArrowLeft'); T.step(2); assert(!K().drifting, 'Shift 떼면 드리프트 끝');
kd('ArrowDown'); ku('ArrowUp'); T.step(60); assert(K().vf < 60, '↓ 브레이크(감속·후진)'); ku('ArrowDown');
// 멀티터치: 오른쪽 + 드리프트 동시, 자동 가속
at(0.03, 0, 250); pe($('#tR'), 'pointerdown', 1); pe($('#tDrift'), 'pointerdown', 2); T.step(20);
assert(S().touch && K().steer > 0.5 && K().drifting && $('#tR').classList.contains('on') && $('#tDrift').classList.contains('on'), '터치 ▶ + 드리프트 동시 누르기');
pe($('#tDrift'), 'pointerup', 2); pe($('#tR'), 'pointerup', 1); T.step(2);
assert(!K().drifting && !$('#tR').classList.contains('on'), '손 떼면 드리프트 끝');
at(0.03, 0, 0); T.step(40); assert(K().v > 150, '터치 모드는 자동 가속');
pe($('#tBrake'), 'pointerdown', 3); T.step(60); assert(K().vf < 30, '브레이크 버튼'); pe($('#tBrake'), 'pointerup', 3);
// 3바퀴 완주 (자동 주행, AI 웨이포인트 + 고무줄)
T.freezeAI(false); T.seed(11); T.start(); T.auto(true); T.input(null);
while (S().state === 'count') T.step(5);
let lapSeen = false, rankOk = true;
for (let i = 0; i < 400 && S().state !== 'result'; i++) {
  T.step(30);
  if (K().lap === 1 && !lapSeen) lapSeen = $('#lap').textContent === '2/3' && K().laps.length === 1 && K().laps[0] > 8;
  if (S().state === 'race' && $('#rank').textContent !== S().rank + '등') rankOk = false;
}
assert(lapSeen && rankOk, '바퀴 수·순위 HUD 갱신');
const s = S(), f = s.final;
assert(s.state === 'result' && $('#result').classList.contains('on') && K().laps.length === 3 && Math.abs(K().laps.reduce((a, b) => a + b, 0) - f.total) < 0.05, '3바퀴 완주 → 결과 화면: ' + f.total.toFixed(2));
assert(s.ai.every(a => a.prog > T.N * 2.5), 'AI 3명도 웨이포인트를 따라 완주 근처까지 달림');
assert(f.rank >= 1 && f.rank <= 4 && $('#rRank').textContent.includes(f.rank + '등') && $$('#rRows div').length === 4 && $('#rRows .me').textContent.includes('나'), '결과: 순위 ' + f.rank + '등, 4명 순위표');
assert(Math.abs(f.bestLap - Math.min(...K().laps)) < 1e-6 && $('#rLap').textContent.length > 3, '최고 랩 표시');
const st = JSON.parse(localStorage.getItem('edu-expo-drift-kart-v1'));
assert(!$('#newrec').hidden && Math.abs(st.time - f.total) < 0.01 && st.rank === f.rank && $('#best').textContent === $('#rTime').textContent, '최고 기록 저장·표시: ' + st.time);
// 일시정지·숨김·소리
$('#again').click(); await wait(20); T.input({ gas: true }); while (S().state === 'count') T.step(5);
$('#pauseBtn').click(); const t0 = S().t; T.step(60);
assert(S().state === 'paused' && S().t === t0 && $('#paused').classList.contains('on'), '일시정지 중엔 시간이 멈춤');
$('#resume').click(); assert(S().state === 'race', '계속 달리기');
Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden;
assert(S().state === 'paused', '탭이 숨으면 자동 일시정지');
$('#resume').click(); T.input(null); T.auto(false); T.manual(false);
$('#snd').click(); assert(JSON.parse(localStorage.getItem('edu-expo-drift-kart-v1')).sound === false && $('#snd').textContent === '🔇', '소리 끄기 저장');
return 'ok 45';
