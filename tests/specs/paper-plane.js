// 62 슝 종이비행기: 첫 화면(시연 비행) → 시작 → 키보드 각도 → 끌어서 발사 → 착지·거리 → 링 보너스 → 기수 올리기 → 일시정지 → 5번 후 결과·최고 기록 → 다시 하기
const T = window.__test, st = () => T.state();
const until = (f, max = 3000) => { for (let i = 0; i < max && !f(); i += 10) T.step(10); return f(); };
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
ok(text().includes('슝 종이비행기') && $('#titleCard').classList.contains('on'), '제목·안내 카드');
ok(st().phase === 'title' && st().fly, '첫 화면 시연 비행 중');
T.seed(5);
$('#start').click(); T.rings([]);
ok(st().phase === 'aim' && st().throwNo === 1 && !$('#titleCard').classList.contains('on'), '게임 시작: 1번째 던지기 조준');
// 키보드: ↑ 누르고 있으면 각도가 서서히 커짐(즉시 점프 아님)
const a0 = st().ang;
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })); T.step(1);
const a1 = st().ang; T.step(20);
document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true }));
ok(a1 > a0 && a1 - a0 < 2 && st().ang > a1 + 5, `↑ 키로 각도 증가 ${a0.toFixed(1)}→${a1.toFixed(1)}→${st().ang.toFixed(1)}`);
// 끌어서 조준(뒤로 150px, 아래로 80px) → 약 28°
const cv = $('#cv'), r = cv.getBoundingClientRect(), pe = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { clientX: r.left + x, clientY: r.top + y, pointerId: 1, bubbles: true, cancelable: true }));
pe('pointerdown', 500, 300); pe('pointermove', 420, 340); pe('pointermove', 350, 380); T.step(1);
ok(Math.abs(st().ang - 28.1) < 1.5 && st().pow > .5, '끌기로 각도·힘: ' + st().ang.toFixed(1) + '° ' + st().pow.toFixed(2));
ok(T.predict(14).length >= 8 && st().phase === 'aim', '예상 경로 점');
pe('pointerup', 350, 380);
ok(st().phase === 'fly' && st().vx > 5, '놓으면 발사');
T.step(20);
ok(st().x > 3 && st().y > 3, '비행 중 이동: x=' + st().x.toFixed(1));
ok(until(() => st().phase === 'landed') && st().throws.length === 1, '착지');
const d1 = st().throws[0].dist;
ok(d1 > 10 && st().total === Math.round(d1) && $('#total').textContent === String(st().total), '거리 점수 ' + d1);
ok(st().best.dist === d1 && JSON.parse(localStorage.getItem('paperPlane.v1')).calm.dist === d1, '최고 거리 저장');
// 2번째: 바람 0, 예상 경로 위에 링 → +10
ok(until(() => st().phase === 'aim') && st().throwNo === 2, '다음 던지기(바람 바뀜)');
T.wind(0); T.aim(25, .8);
const pr = T.predict(14);
T.rings([pr[6], [pr[6][0] + 15, 40]]);
const tot1 = st().total;
T.launch(25, .8);
ok(until(() => st().phase === 'landed'), '2번째 착지');
ok(st().throws[1].rings === 1 && st().throws[1].score === Math.round(st().throws[1].dist) + 10 && st().total === tot1 + st().throws[1].score, '링 통과 +10: ' + JSON.stringify(st().throws[1]));
const plain = st().throws[1].dist;
// 3번째: 같은 조건에서 내려올 때 꾹 누르면(기수 올리기) 더 멀리, 숨 게이지 소모
ok(until(() => st().phase === 'aim'), '3번째 조준');
T.wind(0); T.rings([]); T.launch(25, .8);
until(() => st().vy < 0, 600);
T.input({ pitch: true });
ok(until(() => st().phase === 'landed'), '3번째 착지');
T.input({ pitch: false });
ok(st().breath < .2 && st().throws[2].dist > plain + 1, `기수 올리기 효과 ${plain}→${st().throws[2].dist}m, 숨 ${st().breath.toFixed(2)}`);
// 일시정지: 멈춘 동안 시뮬레이션 진행 없음
ok(until(() => st().phase === 'aim'), '4번째 조준');
$('#pauseBtn').click();
ok(st().phase === 'paused' && $('#pauseCard').classList.contains('on'), '일시정지 카드');
document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); T.step(30);
ok(st().phase === 'paused' && !st().fly, '멈춘 동안 발사 안 됨');
$('#resume').click();
ok(st().phase === 'aim', '계속하기');
// 4번째: 스페이스로 발사
document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
document.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
ok(st().phase === 'fly', '스페이스 발사');
until(() => st().phase === 'aim');
T.launch(30, .9);
ok(until(() => st().phase === 'over') && st().throws.length === 5, '5번 던지고 끝');
ok($('#resultCard').classList.contains('on') && $$('#rRows div').length === 5 && $('#rTotal').textContent === String(st().total), '결과 카드 5줄·합계');
const saved = JSON.parse(localStorage.getItem('paperPlane.v1'));
ok(saved.calm.total === st().total && $('#rNew').textContent.includes('새 기록'), '최고 점수 저장·새 기록 표시');
ok(saved.calm.dist === Math.max(...st().throws.map(t => t.dist)), '최고 거리 = 5번 중 최대');
// 모드 바꿔 다시 하기
$$('#modes2 .md')[1].click(); $('#again').click();
ok(st().phase === 'aim' && st().mode === 'gust' && st().throwNo === 1 && st().total === 0 && st().best.dist === 0, '돌풍 모드 다시 하기(모드별 기록)');
return 'ok ' + n;
