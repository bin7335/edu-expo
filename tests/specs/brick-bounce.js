// 66 통통 벽돌깨기: 데모 화면 → 시작 → 패들 위치별 반사각 → 벽돌 깨기·단단한 벽돌 → 낱말 순서 → 단계 클리어 → 키보드 관성·포인터 → 아이템 → 공 놓침 → 일시정지 → 게임 끝·최고 기록 → 다시 하기·시간 끝·처음으로·소리
const T = __test, S = () => T.state();
const kd = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const ku = k => document.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }));
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
ok(text().includes('통통 벽돌깨기'), '제목 보임');
ok($('#ready').classList.contains('on') && S().phase === 'ready', '준비 카드');
ok(S().bricks > 10 && S().balls.length >= 1, '첫 화면 데모 장면(벽돌·공)');
T.manual(true); T.seed(3);
$('#start').click();
let s = S();
ok(s.phase === 'play' && s.lives === 3 && s.score === 0 && s.bricks === 40 && s.balls[0].stuck && !$('#ready').classList.contains('on'), '게임 시작: 1단계 40개, 공은 패들 위');
// 반사각: 패들 왼쪽/가운데/오른쪽
const hitAt = off => { T.place({ paddle: { x: 320, vx: 0 }, ball: { x: 320 + off, y: 610, vx: 0, vy: 420 } }); for (let i = 0; i < 12 && S().balls[0].vy > 0; i++) T.step(1); return S().balls[0]; };
const L = hitAt(-50), C = hitAt(0), R = hitAt(50), E = hitAt(64);
ok(L.vy < 0 && R.vy < 0 && C.vy < 0, '패들에 맞으면 위로 튕김');
ok(L.vx < -150 && R.vx > 150 && Math.abs(C.vx) < 20, `패들 위치에 따라 각도가 바뀜 L${L.vx | 0} C${C.vx | 0} R${R.vx | 0}`);
ok(E.vx > R.vx, '끝에 맞을수록 더 비스듬히');
// 벽돌 깨기
T.place({ bricks: [{ x: 291, y: 300, hp: 1 }, { x: 12, y: 92, hp: 3 }], ball: { x: 320, y: 380, vx: 0, vy: -420 } });
T.step(15); s = S();
ok(s.bricks === 1 && s.score === 10 && s.balls[0].vy > 0, '벽돌 깨짐 +10, 공이 튕겨 내려옴: ' + s.score);
T.place({ ball: { x: 41, y: 170, vx: 0, vy: -420 } }); T.step(10); s = S();
ok(s.bricks === 1 && s.hpSum === 2 && s.score === 10, '3번 벽돌은 한 번 맞으면 금만 감');
// 낱말 벽돌: 순서가 아니면 안 깨짐
T.place({ word: '나가', bricks: [{ x: 100, y: 300, ch: '가', li: 1 }, { x: 400, y: 300, ch: '나', li: 0 }], ball: { x: 129, y: 380, vx: 0, vy: -420 } });
T.step(15); ok(S().bricks === 2 && S().wi === 0, '순서가 아닌 글자 벽돌은 튕겨 냄');
T.place({ ball: { x: 429, y: 380, vx: 0, vy: -420 } }); T.step(15);
ok(S().bricks === 1 && S().wi === 1, '첫 글자 깨짐');
const sc0 = S().score;
T.place({ ball: { x: 129, y: 380, vx: 0, vy: -420 } }); T.step(15); s = S();
ok(s.score - sc0 === 10 + 5 + 150 + 200 - 0 || s.score - sc0 >= 360, '낱말 완성 +150·단계 클리어 +200: ' + (s.score - sc0));
ok(s.stage === 2 && s.bricks > 30 && s.balls[0].stuck, '2단계로 넘어감');
// 키보드 가속·관성
T.place({ paddle: { x: 200, vx: 0 } });
kd('ArrowRight'); T.step(10); const v1 = S().paddle.vx; T.step(10); const v2 = S().paddle.vx;
ok(v1 > 100 && v2 > v1, '키를 누르고 있으면 점점 빨라짐(가속) ' + (v1 | 0) + '→' + (v2 | 0));
ku('ArrowRight'); const x1 = S().paddle.x; T.step(3); s = S();
ok(s.paddle.vx > 0 && s.paddle.x > x1 + 5, '손을 떼도 조금 미끄러짐(관성)');
T.step(40); ok(Math.abs(S().paddle.vx) < 5, '마찰로 멈춤');
// 포인터(마우스) 따라가기
const r = $('#cv').getBoundingClientRect();
$('#stage').dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: r.left + 150 / 640 * r.width, clientY: r.top + r.height * 0.8 }));
T.step(2); const px2 = S().paddle.x; T.step(30); s = S();
ok(Math.abs(s.paddle.x - 150) < 4 && Math.abs(px2 - 150) > 4, '마우스를 따라 부드럽게 이동: ' + (s.paddle.x | 0));
// 발사
kd(' '); ku(' '); T.step(1); ok(!S().balls[0].stuck && S().balls[0].vy < 0, '스페이스로 발사');
// 아이템
T.place({ ball: { x: 600, y: 200, vx: 100, vy: -400 }, power: { x: 150, y: 620, t: 'wide' } }); T.step(20); s = S();
ok(s.wideT > 0 && s.paddle.w > 160, '넓은 패들 아이템: ' + (s.paddle.w | 0));
T.place({ power: { x: 150, y: 620, t: 'multi' } }); T.step(10);
ok(S().balls.length === 2, '공 2개 아이템');
T.place({ power: { x: 150, y: 620, t: 'slow' } }); T.step(10);
ok(S().slowT > 0, '느리게 아이템');
// 공 놓침
T.place({ paddle: { x: 500, vx: 0 }, ball: { x: 100, y: 700, vx: 0, vy: 400 } }); T.input({ release: 1 }); T.step(5); s = S();
ok(s.lives === 2 && s.balls[0].stuck, '공 놓치면 생명 -1, 다시 패들 위');
ok($('#lives').textContent === '♥♥', 'HUD 생명 표시');
// 일시정지
$('#pauseBtn').click(); const tp = S().time; T.step(60);
ok(S().phase === 'paused' && $('#paused').classList.contains('on') && S().time === tp, '일시정지 중엔 멈춤');
$('#resume').click(); ok(S().phase === 'play', '계속하기');
// 게임 끝
const fin = S().score;
T.place({ lives: 1, ball: { x: 100, y: 700, vx: 0, vy: 400 } }); T.step(5);
ok(S().phase === 'result' && $('#result').classList.contains('on') && $('#rTitle').textContent.includes('게임 끝'), '생명 0 → 결과');
ok($('#rScore').textContent === fin + '점' && !$('#newrec').hidden, '결과 점수·새 기록 표시');
ok(JSON.parse(localStorage.getItem('edu-expo-brick-bounce-v1')).best.normal === fin && $('#best').textContent === String(fin), '최고 기록 저장');
// 다시 하기 → 시간 끝
$('#again').click(); s = S();
ok(s.phase === 'play' && s.score === 0 && s.lives === 3 && s.stage === 1, '다시 하기');
T.place({ time: 0.02 }); T.step(3);
ok(S().phase === 'result' && $('#rTitle').textContent.includes('시간') && $('#newrec').hidden, '시간 끝, 0점은 기록 아님');
// 처음으로 · 모드별 기록
$('#home').click(); ok(S().phase === 'ready' && $('#ready').classList.contains('on'), '처음으로');
$('.mode[data-m="fast"]').click(); ok($('#best').textContent === '0' && $('#bN').textContent === String(fin), '모드별 최고 기록');
$('#start').click(); ok(S().mode === 'fast' && S().phase === 'play', '빠른 공 모드 시작');
T.end();
$('#snd').click();
ok($('#snd').getAttribute('aria-pressed') === 'false' && JSON.parse(localStorage.getItem('edu-expo-brick-bounce-v1')).sound === false, '소리 끄기 저장');
return 'ok ' + n;
