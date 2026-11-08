// 74 물풍선 카트 대작전: 첫 화면 데모 레이스 → 카운트다운·스타트 부스트(성공/너무 빠름) → 키보드 조작·관성 → 드리프트 미끄러짐·타이어 자국·미니 터보
// → 터치 멀티터치(방향+드리프트, 아이템 버튼) → 아이템 상자 룰렛·재생성 → 물풍선 명중 / 우산 방패 막기 / 비눗물 미끄덩 / 우유 부스터 / 자석
// → 순위별 아이템 확률 → AI 아이템 사용 → 바퀴 세기·결승 순위 → 결과·최고 기록 저장 → 일시정지·소리
const S = () => __test.state(), P = () => S().karts[0], K = i => S().karts[i];
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const kd = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const ku = k => document.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }));
const pe = (el, t, id) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, pointerType: 'touch', isPrimary: id === 1 })); };
const L = S().L, VMAX = 420, park = () => { for (let i = 1; i < 6; i++) __test.place(L * 0.5 + i * 40, 0, 0, i); };
const sc = __test.near(2150, 330), ctl = () => ({ gas: true, drift: true, steer: Math.max(-1, Math.min(1, (-20 - P().lat) / 40)) }); // 긴 오른쪽 커브 입구
ok(text().includes('물풍선 카트 대작전') && $('#ready').classList.contains('on') && $('a[href="../"]'), '제목·시작 카드·전체 데모 링크');
const d0 = P(); await wait(500);
ok(S().state === 'ready' && Math.hypot(P().x - d0.x, P().y - d0.y) > 30, '첫 화면에서 카트들이 스스로 달림(데모)');
// 카운트다운 + 스타트 부스트 성공
__test.seed(3); $('#start').click(); __test.step(1);
ok(S().state === 'count' && S().cd > 2.5 && $('#ctlL').classList.contains('on') && $('#cd').textContent === '3', '카운트다운 시작·터치 버튼 보임');
const x0 = P().x; __test.input({ gas: true }); __test.step(30); __test.input(null);
ok(P().x === x0 && S().state === 'count', '카운트다운 중엔 출발 안 함');
__test.step(Math.round((S().cd - 0.3) * 60));
__test.input({ gas: true }); __test.step(30);
ok(S().state === 'play' && P().boost > 0 && S().toast.includes('스타트 부스트') && P().v > 150, '"1"이 꺼질 때 가속 → 스타트 부스트: v=' + P().v.toFixed(0));
// 너무 빨리 누르면 삐끗
$('#start').click(); __test.input({ gas: true }); __test.step(200);
ok(S().state === 'play' && P().boost === 0 && S().toast.includes('너무 빨랐') && P().v < 60, '너무 일찍 가속 → 삐끗(출발 늦음)');
__test.input(null); __test.ai(false); park();
// 키보드: ↑ 가속, 관성
__test.place(60, 0, 0);
kd('ArrowUp'); __test.step(60);
const v1 = P().v;
ok(v1 > 200 && v1 < VMAX * 1.01, '↑ 키로 가속(관성: 바로 최고 속도 아님): ' + v1.toFixed(0));
ku('ArrowUp'); __test.step(20);
ok(P().v > 100 && P().v < v1, '키를 떼도 미끄러지듯 굴러가며 느려짐');
// 일반 회전은 접지력이 높아 옆미끄럼 작음
__test.place(sc, -60, 0, 0, 380); __test.input({ gas: true, steer: 1 }); __test.step(25);
const slipN = Math.abs(P().vl);
kd('ArrowLeft'); __test.input(null); const a0 = P().a; __test.step(15); ku('ArrowLeft');
ok(P().a < a0 - 0.2, '← 키로 방향 전환');
// 드리프트: 옆으로 미끄러지며 타이어 자국·불꽃, 길게 → 슈퍼 부스트
__test.place(sc, -60, 0, 0, 380); const sk0 = S().skids;
for (let i = 0; i < 30; i++) { __test.input(ctl()); __test.step(1); }
const slipD = Math.abs(P().vl);
ok(P().drift === 1 && slipD > slipN * 2 && slipD > 40, '드리프트는 옆으로 미끄러짐: 일반 ' + slipN.toFixed(0) + ' / 드리프트 ' + slipD.toFixed(0));
ok(S().skids > sk0 + 20 && S().parts > 5, '타이어 자국·드리프트 불꽃');
for (let i = 0; i < 70; i++) { __test.input(ctl()); __test.step(1); }
ok(P().drift === 1 && P().charge >= 1.5 && Math.abs(P().lat) < 100, '드리프트를 길게 유지하며 커브를 돌면 주황 불꽃(2단계)');
__test.input({ gas: true }); __test.step(1);
ok(P().boost > 0.9 && S().toast.includes('슈퍼 부스트'), '놓으면 미니 터보 발동');
// 짧은 드리프트는 작은 부스트, 너무 짧으면 없음
__test.place(60, 0, 0, 0, 380); __test.input({ gas: true, steer: -1, drift: true }); __test.step(20); __test.input({ gas: true }); __test.step(1);
ok(P().boost === 0, '아주 짧은 드리프트는 부스트 없음');
// 부스트: 최고 속도 넘김 + 화면 넓어짐(FOV)
__test.place(30, 0, 0, 0, 380); __test.giveItem('milk'); kd(' '); ku(' '); __test.step(40);
ok(P().item === null && P().boost > 0 && P().v > VMAX * 1.1 && S().zf < 0.97, '🥛 우유 부스터(Space): 최고 속도 돌파·시야 넓어짐 v=' + P().v.toFixed(0));
__test.input(null);
// 터치: 방향 + 드리프트 동시(멀티터치), 자동 가속
__test.place(60, -30, 0, 0, 380);
pe($('#tr'), 'pointerdown', 1); pe($('#dr'), 'pointerdown', 2); __test.step(20);
ok(S().autoGas && P().steer === 1 && P().drift === 1 && $('#tr').classList.contains('on') && $('#dr').classList.contains('on'), '▶ + 드리프트 동시 터치(자동 가속)');
pe($('#dr'), 'pointerup', 2); pe($('#tr'), 'pointerup', 1); __test.step(2);
ok(P().drift === 0 && P().steer === 0 && !$('#tr').classList.contains('on'), '손을 떼면 드리프트·방향 해제');
__test.giveItem('umbrella'); pe($('#it'), 'pointerdown', 3); pe($('#it'), 'pointerup', 3);
ok(P().item === null && P().shield > 4.9, '아이템 버튼 터치 → ☂️ 우산 방패 5초');
__test.step(310);
ok(P().shield === 0, '방패는 5초 뒤 사라짐');
// 아이템 상자 룰렛 → 아이템 1개, 상자 재생성
const bs = L * 0.17; __test.place(bs - 120, -18, 0, 0, 300); __test.input({ gas: true });
let f = 0; while (!(P().roll > 0) && f++ < 120) __test.step(1);
ok(P().roll > 0 && P().item === null && S().boxes.includes(0) && $('#slot').classList.contains('roll'), '아이템 상자 → 룰렛 돌아감');
__test.step(65);
ok(P().roll === 0 && ['balloon', 'soap', 'umbrella', 'milk', 'magnet'].includes(P().item) && S().slot.length > 0, '룰렛 멈추면 아이템 1개: ' + P().item);
const it1 = P().item; __test.place(bs - 120, 18, 0, 0, 300); f = 0; while (S().boxes.every(b => b) && f++ < 120) __test.step(1);
ok(P().item === it1 && P().roll === 0, '이미 들고 있으면 새 아이템 안 받음(1개만)');
__test.step(200);
ok(S().boxes.every(b => b), '먹은 상자는 잠시 뒤 다시 생김');
__test.input(null);
// 물풍선 명중
park();
__test.place(80, 0, 0, 0, 0); __test.place(380, 0, 0, 1, 0); __test.giveItem('balloon'); kd('Control'); ku('Control');
ok(S().shots === 1 && P().item === null, '🎈 물풍선 던짐(Ctrl)');
__test.step(40);
ok(K(1).spin > 0 && S().hits === 1 && S().toast.includes('명중'), '앞 카트에 명중 → 빙글 돌며 느려짐');
// 우산 방패로 막기
__test.step(80); __test.place(80, 0, 0, 0, 0); __test.place(380, 0, 0, 1, 0); __test.giveItem('umbrella', 1); __test.use(1);
ok(K(1).shield > 4.9, 'AI 카트도 우산 방패 사용');
__test.giveItem('balloon'); __test.use(); __test.step(40);
ok(K(1).spin === 0 && K(1).shield === 0 && S().hits === 1 && S().toast.includes('막혔다'), '방패가 물풍선 한 번 막음(방패 사라짐)');
// 내 방패가 AI 물풍선을 막음
park();
__test.place(400, 0, 0, 0, 0); __test.place(100, 0, 0, 2, 0); __test.giveItem('umbrella'); __test.use(); __test.giveItem('balloon', 2); __test.use(2); __test.step(40);
ok(P().spin === 0 && P().shield === 0 && S().toast.includes('막았다'), '내 우산 방패로 막았다!');
// 비눗물: 뒤에 떨어뜨림 → 밟으면 미끄덩
park();
__test.place(300, 0, 0, 0, 0); __test.giveItem('soap'); __test.use();
ok(S().puddles === 1 && P().item === null, '🧼 비눗물 웅덩이를 뒤에 놓음');
__test.place(150, 0, 0, 3, 250); __test.step(1); __test.input(null); f = 0; while (!(K(3).spin > 0) && f++ < 90) __test.step(1);
ok(K(3).spin > 0 && S().puddles === 0 && S().hits === 1 + 1, '뒤 카트가 비눗물 밟고 미끄덩');
__test.place(300, 0, 0, 0, 0); __test.giveItem('soap'); __test.use(); __test.step(60); __test.place(150, 0, 0, 0, 250); __test.input({ gas: true }); f = 0; while (!(P().spin > 0) && f++ < 90) __test.step(1);
ok(P().spin > 0 && S().toast.includes('미끄덩'), '내 비눗물도 나중엔 나를 미끄러뜨림');
__test.input(null); __test.step(80);
// 자석: 바로 앞 순위 카트에게 끌려감
park();
__test.place(60, 0, 0, 0, 200); __test.place(700, 30, 0, 4, 0); __test.step(1);
const dist = () => Math.hypot(P().x - K(4).x, P().y - K(4).y), dm0 = dist();
__test.giveItem('magnet'); __test.use(); __test.input({ gas: true }); __test.step(55);
ok(P().v > VMAX * 1.05 && dist() < dm0 - 300, '🧲 자석: 앞 카트 쪽으로 빠르게 끌려감 ' + dm0.toFixed(0) + '→' + dist().toFixed(0));
__test.input(null);
// 순위별 아이템 확률(꼴찌일수록 좋은 아이템)
const o1 = __test.odds(1), o6 = __test.odds(6);
ok(o1[3] + o1[4] === 0 && o6[3] + o6[4] >= 60 && o6.reduce((a, b) => a + b) === 100, '1위는 우유·자석 없음, 꼴찌는 우유·자석 70%');
// AI도 아이템 상자 먹고 사용
__test.seed(5); $('#start').click(); __test.ai(true); __test.step(200); __test.input({ gas: true }); __test.step(2400);
ok(S().aiUses >= 3, 'AI 카트들이 아이템을 먹고 사용: ' + S().aiUses + '회');
const ranks = S().karts.map(k => k.rank).sort().join('');
ok(ranks === '123456' && $('#pos').textContent === P().rank + '위', '실시간 순위 1-6위 표시');
// 바퀴 세기
__test.ai(false); __test.input({ gas: true });
for (let i = 1; i < 6; i++) __test.place(L * 0.3 + i * 40, 0, 0, i);
__test.place(L - 100, 0, 0, 0, 300); __test.step(40);
ok(S().lap === 2 && $('#lap').textContent === '2/3' && S().toast.includes('2바퀴'), '출발선 통과 → 2바퀴째');
__test.place(L - 100, 0, 1, 0, 300); __test.step(40);
ok(S().lap === 3 && S().toast.includes('마지막'), '마지막 바퀴');
__test.place(200, 0, 2, 0, 0); const pr = P().prog; __test.input({ brake: true }); __test.step(90);
ok(P().prog < pr && S().lap === 3, '거꾸로 가면 진행도 줄어듦(바퀴 속이기 불가)');
// 결승: AI 1대가 먼저 들어오면 2위
__test.place(L - 40, 40, 2, 1, 300); __test.place(L - 90, -40, 2, 0, 300); __test.input({ gas: true }); __test.step(40);
ok(S().state === 'finish' && S().order.join() === '1,0' && S().rank === 2 && S().toast.includes('2위'), '결승선 순서대로 순위 → 2위');
__test.step(130);
ok(S().state === 'result' && $('#result').classList.contains('on') && $('#rRank').textContent === '2위' && $('#rHits').textContent === '0번', '결과 화면: 순위·명중 수');
const st = JSON.parse(localStorage.getItem('edu-expo-item-kart-v1'));
ok(st.bestRank === 2 && st.bestT > 0 && !$('#newrec').hidden && $('#rTime').textContent.includes(':') && $('#rBest').textContent.includes('2위'), '최고 기록 저장: ' + JSON.stringify(st));
// 다시 달리기·일시정지·소리
$('#again').click();
ok(S().state === 'count' && P().prog < 0 && $('#bestR').textContent.includes('2위'), '다시 달리기 → 카운트다운');
__test.step(200); $('#pauseBtn').click(); const px = P().x; __test.step(30);
ok(S().state === 'paused' && P().x === px && $('#paused').classList.contains('on'), '일시정지 중엔 멈춤');
$('#resume').click(); ok(S().state === 'play', '계속 달리기');
__test.input(null); __test.manual(false);
$('#snd').click(); ok(JSON.parse(localStorage.getItem('edu-expo-item-kart-v1')).sound === false && $('#snd').textContent === '🔇', '소리 끄기 저장');
return 'ok ' + n;
