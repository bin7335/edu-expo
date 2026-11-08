// 73 달려라 그랑프리: 첫 화면 자동 주행 → 카운트다운(출발 부스터·너무 이른 출발·보통 출발) → 가속·핸들·관성 → 원심력 → 드리프트 불꽃 단계·부스터 → 잔디 감속·울타리 → 라이벌 충돌 → 바퀴 수 → 결승·순위·최고 기록 → 키보드·터치(멀티터치)·출발 탭 → 일시정지·소리
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const I = __test.info(), L = I.L, MAX = I.MAXV;
const kd = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const ku = k => document.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }));
const pe = (el, t, id) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, pointerType: 'touch', isPrimary: id === 1 })); };
// 곡선이 없는 긴 직선, 오른쪽 급커브 찾기
let straight = -1, run = 0, hardR = -1;
for (let d = 0, s0 = 0; d < L; d += I.SEGL) { run = __test.curve(d) === 0 ? run + 1 : 0; if (run === 1) s0 = d; if (run >= 150) { straight = s0; break; } }
for (let d = 0; d < L; d += I.SEGL) if (__test.curve(d) >= 5 && __test.curve(d + I.SEGL * 20) >= 5) { hardR = d; break; }
ok(straight >= 0 && hardR >= 0 && L / MAX > 45 && L / MAX < 60, '코스: 직선·급커브 있음, 한 바퀴 약 1분 길이 ' + (L / MAX).toFixed(0) + 's');
const far = () => __test.place({ rivals: [0, 1, 2, 3, 4].map(i => ({ dist: S().dist - 20000 - i * 900, v: 0 })) });
const reset = (x = 0, v = MAX * 0.9, d = straight + I.SEGL * 5) => { __test.input(null); __test.place({ dist: d, x, v, boostT: 0 }); far(); };

// 1. 첫 화면
ok(text().includes('달려라 그랑프리') && $('#ready').classList.contains('on') && $('a[href="../"]'), '제목·시작 카드·전체 데모 링크');
__test.manual(true); __test.seed(3);
const d0 = S().dist; __test.step(90);
ok(S().state === 'ready' && S().dist > d0 + 5000 && S().rivals.every(r => r.v > 0), '첫 화면에서 카트들이 스스로 달림(시연)');

// 2. 카운트다운 + 출발 부스터
$('#start').click(); await wait(20);
ok(S().state === 'count' && S().rank === 6 && !$('#pauseBtn').disabled && S().v === 0 && $('#pos').textContent === '6/6', '카운트다운 시작, 맨 뒤 6/6에서 출발');
__test.step(60); ok(S().state === 'count' && S().v === 0 && S().rivals.every(r => r.v === 0), '카운트다운 중엔 아무도 출발하지 않음');
__test.step(84); __test.input({ gas: true }); __test.step(40);
ok(S().state === 'race' && S().startBoost && S().boostT > 0.5 && S().v > MAX * 0.45 && $('#big').textContent === '출발!', '"1"일 때 가속 → 출발 부스터: v=' + S().v.toFixed(0));
__test.step(30);
ok(S().v > MAX * 1.05 && S().rank < 6, '부스터 속도로 라이벌 추월: ' + S().kmh + 'km/h, ' + S().rank + '위');
// 너무 이른 출발
__test.input(null); __test.start(); __test.input({ gas: true }); __test.step(181);
ok(S().state === 'race' && S().stalled && !S().startBoost && S().v === 0, '너무 일찍 누르면 엔진이 헛돎');
__test.step(30); ok(S().v === 0, '헛도는 동안 출발 못 함');
__test.step(40); ok(S().v > 0, '잠시 뒤 출발');
// 보통 출발(GO 뒤에 누름)
__test.input(null); __test.start(); __test.step(181); __test.input({ gas: true }); __test.step(1);
ok(!S().stalled && !S().startBoost && S().boostT === 0, '늦게 누르면 보통 출발');

// 3. 가속·핸들·관성
__test.step(59); const v1 = S().v; __test.step(60);
ok(v1 > MAX * 0.25 && S().v > v1 && S().v < MAX * 1.01 && $('#spd').textContent === String(S().kmh), '가속 페달로 점점 빨라짐(즉시 최고 속도 아님): ' + S().kmh + 'km/h');
reset(0); __test.input({ gas: true, steer: 1 }); __test.step(30);
ok(S().x > 0.5 && S().ang > 0.05, '오른쪽 핸들 → 오른쪽으로 이동·카트 기울어짐: x=' + S().x.toFixed(2));
__test.input({ gas: true }); const xa = S().x; __test.step(6);
ok(S().x > xa + 0.05 && S().vx > 0, '손을 떼도 관성으로 조금 더 미끄러짐');
reset(0); __test.input({ gas: true, steer: -1 }); __test.step(30);
ok(S().x < -0.5, '왼쪽 핸들 → 왼쪽');
// 원심력
reset(0, MAX, hardR); __test.input({ gas: true }); __test.step(40);
ok(S().x < -0.4, '급커브에서 핸들을 안 꺾으면 바깥으로 밀림: x=' + S().x.toFixed(2));

// 4. 드리프트 → 게이지 → 부스터
reset(-0.5); __test.input({ gas: true, steer: 1, drift: true }); __test.step(20);
ok(S().drift === 1 && S().ang > 0.3 && S().parts > 5 && S().trail > 5, '드리프트: 카트가 옆으로 미끄러지며 불꽃·타이어 자국');
let lv1At = -1, lv2At = -1;
for (let f = 0; f < 150 && lv2At < 0; f++) { if (f % 15 === 0) __test.place({ x: -0.5 }); __test.step(1); if (S().lv === 1 && lv1At < 0) lv1At = f; if (S().lv === 2) lv2At = f; }
ok(lv1At > 10 && lv2At > lv1At + 20, '오래 미끄러질수록 불꽃 단계 상승(파랑 → 주황): ' + lv1At + '→' + lv2At);
ok(parseFloat($('#gauge i').style.width) >= 99 && $('#gauge i').style.background.includes('255, 157, 46'), '부스터 게이지 가득·주황색');
const vBefore = S().v; __test.input({ gas: true }); __test.step(1);
ok(S().drift === 0 && S().boostT > 1.1, '드리프트 버튼을 떼면 슈퍼 부스터: ' + S().boostT.toFixed(2) + 's');
__test.step(40);
ok(S().v > MAX * 1.2 && S().v > vBefore + 2000, '부스터 속도: ' + S().kmh + 'km/h');
reset(-0.5); __test.input({ gas: true, steer: 1, drift: true }); __test.step(52); __test.input({ gas: true }); __test.step(1);
ok(S().boostT > 0.4 && S().boostT < 0.8, '짧은 드리프트는 작은 부스터: ' + S().boostT.toFixed(2));
reset(-0.5); __test.input({ gas: true, steer: 1, drift: true }); __test.step(15); __test.input({ gas: true }); __test.step(1);
ok(S().boostT === 0, '너무 짧으면 부스터 없음');
reset(0, MAX * 0.2); __test.input({ gas: true, steer: 1, drift: true }); __test.step(5);
ok(S().drift === 0, '느릴 때는 드리프트 안 됨');

// 5. 잔디·울타리
reset(1.35, MAX); __test.input({ gas: true }); __test.step(60);
ok(S().off && S().v < MAX * 0.55, '잔디로 나가면 느려짐: ' + S().kmh + 'km/h');
reset(1.5, MAX); const w0 = S().wall; __test.input({ gas: true, steer: 1 }); __test.step(20);
ok(S().wall === w0 + 1 && S().x <= 1.75 && S().v < MAX * 0.6 && $('#toast').textContent.includes('울타리'), '울타리에 부딪히면 튕기고 크게 감속');

// 6. 라이벌과 부딪힘
reset(0, MAX); __test.place({ rivals: [{ dist: S().dist + 150, x: 0.05, v: MAX * 0.5, lane: 0.05 }] }); const b0 = S().bumps;
__test.input({ gas: true }); __test.step(2);
ok(S().bumps === b0 + 1 && S().v < MAX * 0.5 && $('#toast').textContent.includes('곰돌이'), '앞 라이벌에 부딪히면 느려짐');

// 7. 바퀴 수
reset(0, MAX, L - 600); __test.input({ gas: true }); __test.step(10);
ok(S().lap === 2 && S().lapTimes.length >= 1 && $('#lap').textContent === '2/3', '결승선 통과 → 2바퀴째');
reset(0, MAX, 2 * L - 600); __test.input({ gas: true }); __test.step(10);
ok(S().lap === 3 && $('#big').textContent === '마지막 바퀴!', '마지막 바퀴 안내');

// 8. 결승·순위·최고 기록
const side = d => ({ dist: d, x: -0.9, lane: -0.9, laneT: 9 });
__test.place({ rivals: [side(3 * L + 100), side(2 * L), side(2 * L), side(2 * L), side(2 * L)] }); __test.place({ dist: 3 * L - 600 });
ok(S().rank === 2 && $('#pos').textContent === '2/6', '먼저 들어온 라이벌이 있으면 2위');
__test.step(10);
ok(S().state === 'result' && $('#result').classList.contains('on') && $('#rRank').textContent.includes('2등'), '결승 → 결과: 2등');
const st = JSON.parse(localStorage.getItem('edu-expo-road-rally-v1'));
ok(st.bestTime === S().total && st.bestTime > 0 && st.bestRank === 2 && !$('#newrec').hidden && $('#rRows').textContent.includes('총 시간'), '최고 기록 저장: ' + S().total.toFixed(2) + 's');
ok(S().state === 'result' && (__test.step(30), S().v > 0), '결과 화면 뒤에서도 카트가 계속 달림');
$('#again').click(); await wait(20);
ok(S().state === 'count' && S().lap === 1 && S().rank === 6, '다시 달리기');
__test.go(); __test.step(5 * 60);
__test.place({ rivals: [0, 1, 2, 3, 4].map(() => side(2 * L)) }); __test.place({ dist: 3 * L - 600, v: MAX }); __test.input({ gas: true }); __test.step(10);
ok(S().state === 'result' && S().rank === 1 && $('#rRank').textContent.includes('1등') && JSON.parse(localStorage.getItem('edu-expo-road-rally-v1')).bestRank === 1, '라이벌보다 먼저 → 1등, 최고 순위 저장');
const faster = S().total < st.bestTime;
ok(faster === !$('#newrec').hidden && S().best.time === Math.min(st.bestTime, S().total) && $('#bestR').textContent.includes('1등'), '더 빠를 때만 최고 기록 갱신: ' + st.bestTime.toFixed(2) + ' vs ' + S().total.toFixed(2));

// 9. 키보드
__test.input(null); __test.start(); __test.go(); __test.step(1);
kd('ArrowUp'); __test.step(60);
ok(S().v > MAX * 0.3, '↑ 키로 가속');
__test.place({ dist: straight + I.SEGL * 5, x: 0 }); far(); kd('ArrowRight'); __test.step(20);
ok(S().x > 0.3, '→ 키로 오른쪽');
__test.place({ x: -0.5, v: MAX * 0.8 }); kd(' '); __test.step(20);
ok(S().drift === 1, '→ + 스페이스로 드리프트');
ku(' '); ku('ArrowRight'); __test.step(1); ok(S().drift === 0, '스페이스를 떼면 드리프트 끝');
kd('ArrowDown'); ku('ArrowUp'); const vb = S().v; __test.step(20); ku('ArrowDown');
ok(S().v < vb - 2000, '↓ 키로 브레이크');
kd('p'); ok(S().state === 'paused' && $('#paused').classList.contains('on'), 'P 키로 일시정지');
const pd = S().dist; __test.step(30); ok(S().dist === pd, '일시정지 중엔 멈춤');
$('#resume').click(); ok(S().state === 'race', '계속 달리기');

// 10. 터치(자동 가속 + 방향·드리프트 동시 누르기) + 출발 탭
__test.start();
const tl = $('#tLeft'), tr = $('#tRight'), td = $('#tDrift'), tb = $('#tBrake');
__test.step(140); cv.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, clientX: 300, clientY: 300, bubbles: true, pointerType: 'touch' }));
ok(S().touch && $('#tc').classList.contains('on'), '화면을 터치하면 터치 버튼이 보임');
__test.step(45);
ok(S().state === 'race' && S().startBoost, '카운트다운 "1"에서 화면 탭 → 출발 부스터');
__test.step(60);
ok(S().v > MAX * 0.6, '터치 모드는 자동으로 달림');
__test.place({ dist: straight + I.SEGL * 5, x: -0.6 }); far();
pe(tr, 'pointerdown', 1); __test.step(20);
ok(S().x > -0.3 && tr.classList.contains('on'), '▶ 버튼으로 오른쪽');
pe(td, 'pointerdown', 2); __test.step(20);
ok(S().drift === 1 && td.classList.contains('on') && tr.classList.contains('on'), '▶ 누른 채 드리프트 버튼(멀티터치) → 드리프트');
__test.place({ x: -0.5 }); __test.step(40); pe(td, 'pointerup', 2); __test.step(1);
ok(S().drift === 0 && S().boostT > 0, '드리프트 버튼 떼면 부스터');
pe(tr, 'pointerup', 1); __test.place({ x: 0 }); pe(tl, 'pointerdown', 3); const xl = S().x; __test.step(30); pe(tl, 'pointerup', 3);
ok(S().x < xl && !tl.classList.contains('on'), '◀ 버튼으로 왼쪽, 떼면 버튼 꺼짐 ' + xl.toFixed(2) + '→' + S().x.toFixed(2) + JSON.stringify([S().steer, S().v, S().drift]));
__test.step(60); pe(tb, 'pointerdown', 4); const vt = S().v; __test.step(20); pe(tb, 'pointerup', 4);
ok(S().v < vt - 3000, '브레이크 버튼으로 감속');

// 11. 일시정지 버튼·소리
$('#pauseBtn').click(); ok(S().state === 'paused', '⏸ 버튼으로 일시정지'); $('#pauseBtn').click(); ok(S().state === 'race', '다시 누르면 계속');
__test.manual(false);
$('#snd').click(); ok(JSON.parse(localStorage.getItem('edu-expo-road-rally-v1')).sound === false && $('#snd').textContent === '🔇', '소리 끄기 저장');
return 'ok ' + n;
