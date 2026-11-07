// 63 급식 바구니: 첫 화면(시연) → 시작 → 키보드 관성 이동 → 끌기 이동 → 받기 점수 → 5콤보 → 불량 간식(생명) → 놓침 → 제철 과일 → 시간 종료·식판 요약·최고 기록 → 생명 0 종료
const T = window.__test, st = () => T.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const drop = (kind, x, cat) => { T.spawn(kind, x == null ? st().bx : x, cat, 70); T.step(40); };
ok(text().includes('급식 바구니') && $('#titleCard').classList.contains('on'), '제목·안내 카드');
ok(st().phase === 'title' && st().foods > 0, '첫 화면 시연(음식 떨어짐)');
T.seed(9);
$('#start').click(); T.auto(false);
ok(st().phase === 'play' && st().lives === 3 && st().score === 0 && $('#hearts').textContent === '❤️❤️❤️', '게임 시작');
// 키보드: 가속(1프레임에 순간이동 아님) → 떼면 관성으로 미끄러지다 멈춤
const x0 = st().bx;
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); T.step(1);
const x1 = st().bx; T.step(18);
ok(x1 > x0 && x1 - x0 < 1 && st().bx > x0 + 15, `→ 가속 ${x0.toFixed(1)}→${x1.toFixed(2)}→${st().bx.toFixed(1)}`);
document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
const x2 = st().bx; T.step(4);
ok(st().bx > x2 + 1 && st().bv > 0, '키를 떼도 관성으로 조금 더 미끄러짐');
T.step(60);
ok(Math.abs(st().bv) < 2, '마찰로 멈춤');
// 끌기: 화면 왼쪽 25% 지점으로 스프링처럼 따라옴
const cv = $('#cv'), r = cv.getBoundingClientRect(), fw = st().fw, ox = (r.width - fw * r.height / 100) / 2, tx = fw * .25;
cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + ox + tx * r.height / 100, clientY: r.top + 200, pointerId: 3, bubbles: true, cancelable: true }));
T.step(2);
ok(Math.abs(st().bx - tx) > 5, '끌기도 순간이동 아님');
T.step(45);
ok(Math.abs(st().bx - tx) < 1.5, '끌기 위치로 이동: ' + st().bx.toFixed(1) + ' / ' + tx.toFixed(1));
cv.dispatchEvent(new PointerEvent('pointerup', { clientX: 0, clientY: 0, pointerId: 3, bubbles: true }));
// 받기
drop('good', null, 'veg');
ok(st().score === 10 && st().combo === 1 && st().counts.veg === 1 && $('#score').textContent === '10', '채소 받기 +10');
for (const c of ['grain', 'protein', 'fruit', 'grain']) drop('good', null, c);
ok(st().combo === 5 && st().score === 80, '5콤보 보너스(10×4 + 20 + 20): ' + st().score);
// 불량 간식
drop('junk');
ok(st().lives === 2 && st().combo === 0 && st().counts.junk === 1 && st().shake > 0 && $('#hearts').textContent.includes('🤍'), '불량 간식: 생명 -1·콤보 초기화·흔들림');
// 좋은 음식 놓치기: 생명은 그대로, 콤보만 초기화
drop('good', st().bx < fw / 2 ? fw - 6 : 6); T.step(60);
ok(st().counts.miss === 1 && st().lives === 2 && st().score === 80, '놓침: 콤보만 초기화');
// 제철 과일
drop('gold');
ok(st().lives === 3 && st().score === 140 && st().counts.gold === 1 && st().counts.fruit === 2, '제철 과일 +60·생명 회복');
// 시간 종료
for (let i = 0; i < 80 && st().phase === 'play'; i++) T.step(60);
ok(st().phase === 'over' && st().time === 0, '60초 후 종료');
ok($('#resultCard').classList.contains('on') && $('#rScore').textContent === '140' && $$('#plate div').length === 4, '결과: 점수·식판 4칸');
ok($('#plate [data-cat=grain] b').textContent === '2' && $('#plate [data-cat=veg]').classList.contains('low') && $('#verdict').textContent.includes('부족'), '식판 요약·부족한 영양군 안내');
ok(JSON.parse(localStorage.getItem('lunchCatch.v1')).easy === 140 && $('#rNew').textContent.includes('새 기록'), '최고 기록 저장');
// 다시 하기(빠르게 모드) → 불량 간식 3개면 끝
$$('#modes2 .md')[1].click(); $('#again').click(); T.auto(false);
ok(st().phase === 'play' && st().mode === 'hard' && st().best === 0 && st().score === 0, '빠르게 모드 다시 하기(모드별 기록)');
drop('junk'); drop('junk'); drop('junk');
ok(st().phase === 'over' && st().lives === 0 && $('#resultCard').classList.contains('on'), '생명 0이면 종료');
ok(JSON.parse(localStorage.getItem('lunchCatch.v1')).easy === 140, '다른 모드 기록 유지');
return 'ok ' + n;
