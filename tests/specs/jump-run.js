// 64 폴짝 달리기: 첫 화면 데모 → 시작 → 가변 점프 → 콘 넘기 → 부딪힘 → 코요테 타임 → 점프 버퍼 → 깃털 2단 점프 → 코인 → 일시정지 → 결과·최고 기록 → 하트 0 → 모드 바꾸기
const S = () => __test.state();
const until = (f, max = 400) => { for (let i = 0; i < max && !f(); i++) __test.step(1); return f(); };
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
ok(text().includes('폴짝 달리기') && $('#ready').classList.contains('on'), '제목·시작 카드');
__test.seed(5);
const w0 = S().wx; __test.step(60);
ok(S().phase === 'title' && S().demo && S().wx > w0 + 200, '첫 화면 데모 달리기: ' + S().wx);
$('#start').click(); await wait(30);
ok(S().phase === 'play' && !S().demo && S().hearts === 3 && !$('#ready').classList.contains('on') && !$('#pauseBtn').disabled, '게임 시작');
ok($$('.md').every(b => b.disabled), '게임 중 모드 잠김');
// 가변 점프 높이: 살짝 vs 꾹
const peak = hold => { __test.place('none'); __test.step(20); __test.input({ jump: true }); let p = 0; for (let i = 0; i < 80; i++) { if (i === hold) __test.input({ jump: false }); __test.step(1); p = Math.max(p, S().h); } __test.input({ jump: false }); __test.step(20); return p; };
const tap = peak(1), big = peak(30);
ok(tap > 30 && big > tap * 1.8 && big < 200, `가변 점프 살짝 ${tap.toFixed(0)} / 꾹 ${big.toFixed(0)}`);
ok(S().on && S().h === 0, '착지');
// 콘을 점프로 넘기
__test.place('cone', 300);
ok(until(() => S().next <= 60), '콘 접근');
__test.input({ jump: true }); __test.step(20); __test.input({ jump: false }); __test.step(60);
ok(S().hearts === 3 && S().cleared === 1, '콘 넘기 성공 (하트 유지·통과 1)');
// 안 뛰면 부딪힘
__test.place('cone', 150); __test.step(40);
ok(S().hearts === 2 && S().hits === 1 && S().inv > 0, '콘에 부딪힘 → 하트 2·무적 시간');
ok($('#hearts').textContent.includes('🤍'), '하트 표시 줄어듦');
__test.step(100);
// 코요테 타임: 웅덩이 가장자리를 지나친 뒤 3프레임 늦게 눌러도 점프
__test.place('puddle', 60);
ok(until(() => !S().on), '웅덩이 가장자리에서 발이 떨어짐');
__test.step(3); __test.input({ jump: true }); __test.step(1);
ok(S().vy < 0, '코요테 타임 점프');
__test.step(24); __test.input({ jump: false }); __test.step(60);
ok(S().hearts === 2 && S().on, '웅덩이 건넘(첨벙 없음)');
// 점프 버퍼: 착지 직전에 누르면 착지하자마자 다시 뜀
__test.place('none'); __test.input({ jump: true }); __test.step(30); __test.input({ jump: false });
ok(until(() => S().vy > 0 && S().h < 25, 120), '내려오는 중');
__test.input({ jump: true }); __test.step(8);
ok(S().vy < 0 && S().h > 10 && S().jumps === 1, '점프 버퍼로 바로 다시 점프');
__test.input({ jump: false }); __test.step(70);
// 깃털 → 2단 점프
__test.place('feather', 10, 20); __test.step(15);
ok(S().wings > 0, '깃털 먹음');
__test.input({ jump: true }); __test.step(10); __test.input({ jump: false }); __test.step(4);
ok(S().jumps === 1 && !S().on, '1단 점프 중');
__test.input({ jump: true }); __test.step(1);
ok(S().jumps === 2 && S().vy < 0, '공중에서 2단 점프');
__test.input({ jump: false }); __test.step(90);
// 코인
const sc = S().score;
__test.place('coin', 10, 20); __test.step(15);
ok(S().coins === 1 && S().score >= sc + 5 && $('#coins').textContent === '1', '코인 +1 (점수 +5)');
// 일시정지
$('#pauseBtn').click();
const tp = S().t; __test.step(60);
ok(S().phase === 'paused' && $('#paused').classList.contains('on') && S().t === tp, '일시정지 중 시간 멈춤');
$('#resume').click(); __test.step(1);
ok(S().phase === 'play' && S().t > tp, '계속하기');
// 결과·최고 기록
__test.end(); await wait(20);
const fin = S();
ok(fin.phase === 'result' && $('#result').classList.contains('on') && $('#rScore').textContent === fin.score + '점', '결과 화면');
ok(!$('#newrec').hidden && JSON.parse(localStorage.getItem('edu-expo-jump-run-v1')).best.slow === fin.score && $('#best').textContent === String(fin.score), '최고 기록 저장: ' + fin.score);
// 다시 하기 → 하트 0이면 끝
$('#again').click(); await wait(20);
ok(S().phase === 'play' && S().hearts === 3 && S().coins === 0, '다시 하기');
for (let i = 0; i < 3; i++) { __test.place('cone', 150); __test.step(115); }
ok(S().phase === 'result' && $('#rTitle').textContent.includes('꽈당'), '하트 0 → 게임 끝');
ok($('#newrec').hidden || S().score > fin.score, '낮은 점수는 기록 아님');
// 모드 바꾸기 → 모드별 기록
$('.md[data-m="fast"]').click(); await wait(20);
ok(S().phase === 'title' && S().mode === 'fast' && $('#best').textContent === '0' && $('#ready').classList.contains('on'), '빠르게 모드: 기록 따로');
$('#snd').click();
ok(JSON.parse(localStorage.getItem('edu-expo-jump-run-v1')).sound === false && $('#snd').getAttribute('aria-pressed') === 'false', '소리 끄기 저장');
return 'ok ' + n;
