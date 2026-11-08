// 75 번개 타임어택: 첫 화면(트랙 선택·데모) → 카운트다운·출발 부스터/너무 일찍 → R 다시 → 핸들 → 드리프트 미니 터보 2단계·부스터 → 부스터 패드 → 벽 튕김
// → 구간 기록(+/-) → 3바퀴 완주·메달·NEW RECORD 저장 → 선택 화면 기록 표시 → 다음 판 내 유령 재생 → 일시정지 → 터치(멀티터치·출발 탭) → 키보드 → 소리
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const KEY = 'edu-expo-ghost-lap-v1';
const kd = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const ku = k => document.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }));
const pe = (el, t, id) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, pointerType: 'touch', isPrimary: id === 1 })); };
// 첫 화면
ok(text().includes('번개 타임어택') && $('#sel').classList.contains('on') && $$('.trk').length === 3, '제목·트랙 선택 3곳');
ok($$('.trk').every(b => b.textContent.includes('선생님 유령') && b.textContent.includes('🥇') && b.textContent.includes('🥉')), '기록 없음 → 선생님 유령·메달 기준 표시');
__test.seed(3);
const d0 = S().dist; await wait(600);
ok(S().state === 'title' && S().dist > d0 + 30 && S().ghost.kind === 'teacher', '첫 화면 데모 카트·선생님 유령이 달림');
__test.manual(true);
$$('.trk')[0].click(); await wait(20);
ok(S().state === 'count' && S().track === 0 && $('#cd').textContent === '3' && !$('#sel').classList.contains('on') && $('#ctlL').classList.contains('on'), '트랙 1 선택 → 카운트다운 3');
ok(S().ghost.kind === 'teacher' && $('#lap').textContent === '1/3' && $('#best').textContent === '-', '선생님 유령과 대기');
// 출발 부스터
while (S().cd > 0.25) __test.step(1);
ok($('#cd').textContent === '1' && S().car.v === 0, '카운트 1, 아직 출발 전');
__test.input({ gas: true }); __test.step(20);
ok(S().state === 'race' && S().sb && S().car.boost > 0 && S().toast.includes('출발 부스터'), '타이밍 맞춰 누르면 출발 부스터');
// R 다시 → 너무 일찍 밟기
__test.input(null); kd('r'); ku('r');
ok(S().state === 'count' && S().t === 0 && S().car.v === 0 && S().dist === -40 && $('#cd').textContent === '3', 'R 키로 즉시 처음부터');
__test.input({ gas: true }); __test.step(160);
ok(S().state === 'race' && !S().sb && S().car.stall > 0 && S().toast.includes('너무 일찍'), '너무 일찍 밟고 있으면 헛바퀴');
// 핸들
kd('R'); ku('R'); __test.go(); __test.input({});
__test.at(60, 40, 250); const a0 = S().car.a; __test.input({ steer: -1 }); __test.step(20);
ok(S().car.a < a0 - 0.3, '왼쪽 핸들 → 왼쪽으로 돎');
__test.at(60, -40, 250); __test.input({ steer: 1 }); __test.step(20);
ok(S().car.a > a0 + 0.3 && S().car.steer > 0.9 && Math.abs(S().car.vl) > 15, '오른쪽 핸들 → 오른쪽으로 돎(살짝 미끄러짐): ' + (S().car.a - a0).toFixed(2));
__test.input({}); __test.step(30);
ok(Math.abs(S().car.vl) < 15 && S().car.v > 200, '핸들을 풀면 접지력으로 미끄러짐이 잦아듦(관성) ' + JSON.stringify([S().car.vl, S().car.v, S().d, S().wallHits]));
// 드리프트 → 미니 터보 2단계 → 부스터
__test.at(600, 0, 300); __test.input({ auto: true, drift: true });
let maxSlip = 0, maxLv = 0, entered = false;
for (let i = 0; i < 300; i++) { __test.step(1); const c = S().car; if (c.drift) entered = true; else if (entered) break; maxSlip = Math.max(maxSlip, Math.abs(c.vl)); maxLv = Math.max(maxLv, c.level); if (c.level === 2) break; }
ok(entered && maxSlip > 40 && S().skids > 10 && S().parts > 5, '드리프트: 옆으로 미끄러짐·타이어 자국·불꽃 (slip ' + maxSlip.toFixed(0) + ')');
ok(maxLv === 2 && S().car.drift, '드리프트 유지 → 미니 터보 2단계');
__test.input({ auto: true }); __test.step(2);
ok(!S().car.drift && S().car.boost > 1 && S().driftBoosts === 1, '드리프트를 떼면 부스터');
__test.step(30); await wait(250);
const inf = __test.info();
ok(S().car.v > inf.VMAX && S().fov > 0.3, '부스터로 최고 속도 돌파·속도선 효과: ' + S().car.v.toFixed(0));
// 1단계에서 떼면 짧은 부스터
__test.at(600, 0, 300); __test.input({ auto: true, drift: true });
for (let i = 0; i < 200 && S().car.level < 1; i++) __test.step(1);
__test.input({ auto: true }); __test.step(1);
ok(S().car.boost > 0.5 && S().car.boost < 0.8 && S().driftBoosts === 2, '1단계(파랑)에서 떼면 짧은 부스터');
// 부스터 패드
const pad = inf.pads[0];
__test.at(pad.s - 120, pad.u, 200); __test.input({}); const ph = S().padHits;
__test.step(40);
ok(S().padHits === ph + 1 && S().car.boost > 0 && S().car.v > 380, '부스터 패드 → 순간 가속: ' + S().car.v.toFixed(0));
// 벽 튕김
const lim = inf.W / 2 - 10, wh = S().wallHits;
__test.at(150, 40, 260, 1.0); __test.input({});
for (let i = 0; i < 60 && S().wallHits === wh; i++) __test.step(1);
const dHit = S().d;
ok(S().wallHits === wh + 1 && Math.abs(dHit) <= lim + 0.01 && S().car.v < 200, '벽에 부딪히면 막히고 느려짐: v=' + S().car.v.toFixed(0));
__test.step(3);
ok(S().d < dHit - 1, '벽에서 튕겨 나옴');
// 구간 기록 → 3바퀴 → 결과
kd('r'); ku('r'); __test.go(); __test.input(null); __test.auto(true);
while (S().k < 1) __test.step(5);
const sp1 = S().split;
ok(/^[+-]\d+\.\d\d$/.test(sp1) && $('#split').classList.contains(sp1[0] === '+' ? 'pos' : 'neg'), '체크포인트 구간 기록 비교(빨강+/초록-): ' + sp1);
while (S().k < 3) __test.step(5);
ok(S().laps.length === 1 && $('#lap').textContent === '2/3', '1바퀴 → 바퀴 2/3');
while (S().state === 'race') __test.step(5);
const s = S();
ok(s.state === 'finish' && s.laps.length === 3 && Math.abs(s.laps.reduce((a, b) => a + b, 0) - s.t) < 0.02 && $('#res').classList.contains('on') && $$('#rLaps div').length === 3, '3바퀴 완주 → 결과(랩 3개): ' + s.t.toFixed(2));
ok(s.medal >= 0 && s.t <= inf.md[s.medal] && $('#rMedal').textContent.includes(['금', '은', '동'][s.medal]), '메달 판정: ' + $('#rMedal').textContent);
ok(s.isNew && !$('#newrec').hidden && $('#rTitle').textContent.includes('새 기록'), 'NEW RECORD 축하');
const st = JSON.parse(localStorage.getItem(KEY));
ok(Math.abs(st.r[0].t - s.t) < 1e-6 && st.r[0].g.length / 3 > 100 && st.r[0].sp.length === 9 && $('#best').textContent.startsWith('0:'), '최고 기록·유령 경로 저장: ' + st.r[0].g.length / 3 + '점');
ok($('#rNote').textContent.includes('선생님 유령보다'), '유령과 비교 문구');
// 선택 화면 기록 표시 → 다음 판 내 유령
$('#menu').click(); await wait(20);
ok(S().state === 'title' && $('#sel').classList.contains('on') && $$('.trk')[0].textContent.includes($('#rTotal').textContent) && $$('.trk')[0].textContent.includes(['🥇', '🥈', '🥉'][s.medal]), '트랙 선택에 내 기록·메달 표시');
$$('.trk')[0].click(); await wait(20);
ok(S().state === 'count' && S().ghost.kind === 'me', '다음 판은 내 최고 기록 유령');
__test.go(); __test.input({}); __test.step(120);
const g = st.r[0].g;
ok(Math.abs(S().ghost.x - g[120]) < 0.01 && Math.abs(S().ghost.y - g[121]) < 0.01 && Math.hypot(g[120] - g[0], g[121] - g[1]) > 100, '유령이 저장된 경로를 그대로 재생');
// 일시정지
$('#pauseBtn').click(); const tp = S().t; __test.step(30);
ok(S().state === 'paused' && S().t === tp && $('#paused').classList.contains('on'), '일시정지 중 시간 멈춤');
$('#resume').click(); __test.step(1);
ok(S().state === 'race' && S().t > tp, '계속 달리기');
// 터치: 출발 탭 → 오른쪽 + 드리프트 동시 → 브레이크
__test.input(null); __test.track(1);
while (S().cd > 0.3) __test.step(1);
pe($('#cv'), 'pointerdown', 5); pe($('#cv'), 'pointerup', 5); __test.step(20);
ok(S().track === 1 && S().state === 'race' && S().sb, '터치: 1 끝나기 직전 화면 탭 → 출발 부스터');
__test.at(100, -30, 280);
pe($('#bR'), 'pointerdown', 1); __test.step(10); pe($('#bD'), 'pointerdown', 2); __test.step(10);
ok(S().car.steer > 0.5 && S().car.drift && $('#bR').classList.contains('on') && $('#bD').classList.contains('on'), '터치: 오른쪽 + 드리프트 동시(멀티터치)');
pe($('#bD'), 'pointerup', 2); pe($('#bR'), 'pointerup', 1); __test.step(2);
ok(!S().car.drift && !$('#bD').classList.contains('on'), '손을 떼면 드리프트 끝');
const vt = S().car.v; pe($('#bB'), 'pointerdown', 3); __test.step(20); pe($('#bB'), 'pointerup', 3);
ok(S().car.v < vt - 100, '브레이크 버튼으로 감속');
// 키보드
__test.at(100, -30, 280);
kd('ArrowRight'); __test.step(10); kd('Shift'); __test.step(10);
ok(S().car.steer > 0.5 && S().car.drift, '키보드: → + Shift 드리프트');
ku('Shift'); ku('ArrowRight'); __test.step(2);
__test.at(100, 0, 280); kd('ArrowLeft'); __test.step(10); kd(' '); __test.step(10);
ok(S().car.steer < -0.5 && S().car.drift && S().car.dir === -1, '키보드: ← + Space 왼쪽 드리프트');
ku(' '); ku('ArrowLeft'); __test.step(2);
const vk = S().car.v; kd('ArrowDown'); __test.step(20); ku('ArrowDown');
ok(S().car.v < vk - 100, '↓ 브레이크');
kd('p'); ok(S().state === 'paused', 'P 일시정지'); kd('p');
__test.manual(false);
$('#snd').click();
ok(JSON.parse(localStorage.getItem(KEY)).sound === false && $('#snd').getAttribute('aria-pressed') === 'false', '소리 끄기 저장');
return 'ok ' + n;
