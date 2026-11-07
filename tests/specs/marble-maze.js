// 65 구슬 미로: 첫 화면 데모 → 시작 → 관성·마찰 → 벽 튕김 → 1단계 깃발 도착(조작 입력) → 별·최고 기록 → 2단계 구멍·체크포인트 → 시간 초과 → 일시정지 → 단계 버튼
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const drive = (max = 4000) => { let path = __test.path(), i = 0, falls = S().falls;
  for (let f = 0; f < max; f++) { const s = S(); if (s.phase !== 'play') { __test.input(null); return f; }
    if (s.falling) { __test.input(null); __test.step(1); continue; }
    if (s.falls !== falls) { falls = s.falls; path = __test.path(); i = 0; }
    let tg = path[i], dx = tg.x - s.x, dy = tg.y - s.y, d = Math.hypot(dx, dy);
    if (d < 12 && i < path.length - 1) { i++; tg = path[i]; dx = tg.x - s.x; dy = tg.y - s.y; d = Math.hypot(dx, dy); }
    const sp = Math.min(230, 50 + d * 2.2), k = d || 1, cl = v => Math.max(-1, Math.min(1, v));
    __test.input({ x: cl((dx / k * sp - s.vx) / 150), y: cl((dy / k * sp - s.vy) / 150) }); __test.step(1); }
  return max; };
ok(text().includes('구슬 미로') && $('#ready').classList.contains('on') && $$('.lv').length === 5, '제목·시작 카드·단계 버튼 5개');
__test.seed(2);
const d0 = S(); __test.step(90);
ok(S().phase === 'title' && S().demo && Math.hypot(S().x - d0.x, S().y - d0.y) > 40, '첫 화면 데모 구슬이 굴러감');
$('#start').click(); await wait(30);
ok(S().phase === 'play' && S().level === 1 && !S().demo && S().t === 0 && !$('#pauseBtn').disabled, '1단계 시작');
ok($$('.lv').every(b => b.disabled), '게임 중 단계 버튼 잠김');
// 관성과 마찰: 손을 떼도 한동안 굴러가다 멈춤
__test.input({ x: 1, y: 0 }); __test.step(15);
const a = S();
ok(a.vx > 150 && a.vx < 400 && Math.abs(a.vy) < 1, '가속(즉시 최고 속도 아님): ' + a.vx.toFixed(0));
__test.input({ x: 0, y: 0 }); __test.step(10);
const b = S();
ok(b.vx > 50 && b.vx < a.vx && b.x > a.x + 20, '관성으로 계속 굴러감·마찰로 느려짐: ' + b.vx.toFixed(0));
__test.step(240);
ok(Math.abs(S().vx) < 15, '결국 멈춤');
// 벽에 튕김: 왼쪽 벽으로 굴리기
const st = __test.info().start;
__test.place(st.x + 96, st.y + 48); __test.input({ x: -1, y: 0 });
let bounced = false, sh = 0;
for (let i = 0; i < 120 && !bounced; i++) { const v = S().vx; __test.step(1); if (v < -100 && S().vx > 0) { bounced = true; sh = S().shake; } }
ok(bounced && S().bounces >= 1 && sh > 0, '벽에 부딪혀 튕겨 나옴·화면 흔들림');
ok(S().x > 48 + 14 - 0.5, '벽을 뚫지 않음: ' + S().x.toFixed(1));
__test.input(null);
// 1단계를 조작 입력만으로 도착
__test.level(1);
const f1 = drive();
const s1 = S();
ok(s1.phase === 'clear' && $('#result').classList.contains('on') && !$('#next').hidden, '1단계 깃발 도착: ' + f1 + '프레임');
ok(s1.stars >= 1 && $('#rStars').textContent.length === 3 && $('#rTime').textContent === s1.t.toFixed(2) + '초', '별·시간 표시: ' + $('#rTime').textContent);
const saved = JSON.parse(localStorage.getItem('edu-expo-marble-maze-v1'));
ok(Math.abs(saved.best[0] - s1.t) < 0.01 && saved.stars[0] === s1.stars && !$('#newrec').hidden, '최고 기록·별 저장');
// 다음 단계 → 구멍에 빠지면 출발점, 체크포인트를 밟으면 거기로
$('#next').click(); await wait(20);
ok(S().phase === 'play' && S().level === 2 && $('#lvN').textContent === '2', '2단계 시작');
const inf = __test.info();
__test.place(inf.holes[0].x + 10, inf.holes[0].y); __test.step(2);
ok(S().falling && S().falls === 1, '구멍에 빠짐');
__test.step(50);
ok(!S().falling && Math.hypot(S().x - inf.start.x, S().y - inf.start.y) < 1 && $('#falls').textContent === '1', '출발점으로 돌아옴');
__test.place(inf.cps[0].x, inf.cps[0].y); __test.step(2);
ok(S().cp.x === inf.cps[0].x && S().cp.y === inf.cps[0].y, '체크포인트 저장');
const h = inf.holes.reduce((p, q) => Math.hypot(q.x - inf.cps[0].x, q.y - inf.cps[0].y) < Math.hypot(p.x - inf.cps[0].x, p.y - inf.cps[0].y) ? q : p);
__test.place(h.x, h.y); __test.step(50);
ok(S().falls === 2 && Math.hypot(S().x - inf.cps[0].x, S().y - inf.cps[0].y) < 1, '체크포인트에서 다시 시작');
// 일시정지
$('#pauseBtn').click();
const tp = S().t; __test.step(60);
ok(S().phase === 'paused' && $('#paused').classList.contains('on') && S().t === tp, '일시정지 중 시간 멈춤');
$('#resume').click(); __test.step(1);
ok(S().phase === 'play' && S().t > tp, '계속하기');
// 시간 초과
__test.step(inf.limit * 60);
ok(S().phase === 'fail' && $('#rTitle').textContent.includes('시간 초과') && $('#next').hidden, '시간 초과');
ok(!JSON.parse(localStorage.getItem('edu-expo-marble-maze-v1')).best[1], '실패는 기록 안 됨');
$('#again').click(); await wait(20);
ok(S().phase === 'play' && S().level === 2 && S().falls === 0 && S().t === 0, '다시 하기');
// 처음으로 → 단계 버튼 별 표시
$('#pauseBtn').click(); $('#resume').click(); __test.step(1);
__test.level(1); drive(); $('#home').click(); await wait(20);
ok(S().phase === 'title' && $('#ready').classList.contains('on') && $$('.lv')[0].textContent.includes('★'), '처음으로·단계 별 표시');
$$('.lv')[3].click(); await wait(20);
ok(S().level === 4 && $('#start').textContent.includes('4단계') && $('#best').textContent === '-', '단계 고르기(기록 따로)');
$('#snd').click();
ok(JSON.parse(localStorage.getItem('edu-expo-marble-maze-v1')).sound === false && $('#snd').getAttribute('aria-pressed') === 'false', '소리 끄기 저장');
return 'ok ' + n;
