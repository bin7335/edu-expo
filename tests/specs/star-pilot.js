// 67 별똥별 비행: 데모 화면 → 출발 → 키보드 가속·관성·기울기 → 별 모으기 → 운석 충돌·무적 시간 → 방어막 → 아슬아슬 보너스 → 부스터·재사용 대기 → 가상 조이스틱 → 일시정지 → 60초 완주·최고 기록 → 생명 0 → 처음으로·모드·소리
const T = __test, S = () => T.state();
const kd = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const ku = k => document.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }));
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const home = { x: 300, y: 580, vx: 0, vy: 0, bank: 0 };
ok(text().includes('별똥별 비행'), '제목 보임');
ok($('#ready').classList.contains('on') && S().phase === 'ready' && !$('#boost').classList.contains('on'), '준비 카드');
ok(S().meteors + S().stars > 0, '첫 화면 데모 장면(운석·별)');
T.manual(true); T.seed(5); T.spawn(false);
$('#start').click();
let s = S();
ok(s.phase === 'play' && s.lives === 3 && s.score === 0 && s.time === 60 && $('#boost').classList.contains('on'), '출발: 생명 3, 60초, 부스터 버튼');
// 키보드: 가속 → 관성 → 감속
T.place({ ship: home });
kd('ArrowRight'); T.step(6); const v1 = S().ship.vx; T.step(8); s = S();
ok(v1 > 80 && s.ship.vx > v1, '누르고 있으면 점점 빨라짐 ' + (v1 | 0) + '→' + (s.ship.vx | 0));
ok(s.ship.bank > 0.2, '오른쪽으로 기울어짐(뱅킹): ' + s.ship.bank.toFixed(2));
ku('ArrowRight'); const x1 = S().ship.x; T.step(5); s = S();
ok(s.ship.vx > 100 && s.ship.x > x1 + 10, '손을 떼도 미끄러짐(관성)');
T.step(100); ok(Math.abs(S().ship.vx) < 5 && Math.abs(S().ship.bank) < 0.05, '서서히 멈추고 수평으로 돌아옴');
kd('ArrowUp'); T.step(10); ok(S().ship.vy < -100, '위로 비행'); ku('ArrowUp'); T.step(80);
// 별 모으기
T.place({ ship: home, stars: [{ x: 300, y: 500 }] }); const sc0 = S().score; T.step(20); s = S();
ok(s.starsN === 1 && s.stars === 0 && s.score - sc0 >= 10, '별 먹기 +10: ' + (s.score - sc0));
// 운석 충돌 → 생명 -1, 무적 시간
T.place({ ship: home, meteors: [{ x: 300, y: 510, r: 20, vy: 300 }] }); T.step(20); s = S();
ok(s.lives === 2 && s.ship.inv > 0 && $('#lives').textContent === '♥♥', '운석에 부딪히면 생명 -1');
T.place({ ship: home, meteors: [{ x: 300, y: 510, r: 20, vy: 300 }] }); T.step(20);
ok(S().lives === 2, '깜빡이는 무적 시간엔 안 다침');
T.step(100);
// 방어막
T.place({ ship: home, shield: { x: 300, y: 545 } }); T.step(10);
ok(S().ship.shield === true, '방어막 먹기');
T.place({ ship: home, meteors: [{ x: 300, y: 510, r: 20, vy: 300 }] }); T.step(20); s = S();
ok(s.lives === 2 && !s.ship.shield, '방어막이 운석 한 번 막음');
T.step(80);
// 아슬아슬
const sc1 = S().score;
T.place({ ship: home, meteors: [{ x: 345, y: 440, r: 20, vy: 320 }] }); T.step(60); s = S();
ok(s.nearN === 1 && s.lives === 2 && s.score - sc1 >= 5, '스치듯 피하면 아슬아슬 +5');
T.place({ ship: home, meteors: [{ x: 420, y: 440, r: 20, vy: 320 }] }); T.step(60);
ok(S().nearN === 1, '멀리 지나가면 보너스 없음');
// 부스터
T.place({ ship: home }); $('#boost').click(); s = S();
ok(s.ship.boostT > 0 && s.ship.cd > 0 && s.ship.vy < -400, '부스터: 위로 돌진');
ok($('#boost').classList.contains('cd') || (T.step(1), $('#boost').classList.contains('cd')), '부스터 재사용 대기 표시');
T.step(5); const cd = S().ship.cd; $('#boost').click(); ok(S().ship.cd === cd, '대기 중엔 다시 안 됨');
T.place({ ship: { x: 300, y: 400 }, meteors: [{ x: 300, y: 330, r: 20, vy: 300 }] }); T.step(10);
ok(S().lives === 2, '부스터 중엔 무적');
T.step(200);
// 가상 조이스틱 (끌기)
T.place({ ship: home });
const r = $('#cv').getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.6;
const pe = (t, x) => $('#cv').dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: x, clientY: cy }));
pe('pointerdown', cx); pe('pointermove', cx + 50); T.step(12); s = S();
ok(s.joy && s.ship.vx > 150, '조이스틱을 오른쪽으로 끌면 오른쪽 비행: ' + (s.ship.vx | 0));
pe('pointerup', cx + 50); ok(!S().joy, '손 떼면 조이스틱 사라짐');
// 일시정지
$('#pauseBtn').click(); const tp = S().time; T.step(60);
ok(S().phase === 'paused' && $('#paused').classList.contains('on') && S().time === tp, '일시정지 중엔 멈춤');
$('#resume').click(); ok(S().phase === 'play', '계속하기');
// 60초 완주
T.place({ time: 0.02 }); T.step(3); const fin = S().score;
ok(S().phase === 'result' && $('#rTitle').textContent.includes('완주') && $('#rScore').textContent === fin + '점', '시간 끝 → 결과');
ok(!$('#newrec').hidden && JSON.parse(localStorage.getItem('edu-expo-star-pilot-v1')).best.normal === fin && $('#best').textContent === String(fin), '최고 기록 저장: ' + fin);
ok($('#rStat').textContent.includes('별 1개') && $('#rStat').textContent.includes('아슬아슬 1번'), '결과 통계: ' + $('#rStat').textContent);
// 다시 하기 → 생명 0
$('#again').click(); s = S();
ok(s.phase === 'play' && s.score === 0 && s.lives === 3 && s.meteors === 0, '다시 하기');
T.place({ lives: 1, ship: home, meteors: [{ x: 300, y: 510, r: 20, vy: 300 }] }); T.step(20);
ok(S().phase === 'result' && $('#rTitle').textContent.includes('비행 끝') && $('#newrec').hidden, '생명 0 → 비행 끝, 낮은 점수는 기록 아님');
$('#home').click(); ok(S().phase === 'ready' && $('#ready').classList.contains('on') && !$('#boost').classList.contains('on'), '처음으로');
$('.mode[data-m="hard"]').click(); ok($('#best').textContent === '0' && $('#bN').textContent === String(fin), '모드별 최고 기록');
$('#start').click(); ok(S().mode === 'hard' && S().phase === 'play', '운석 폭풍 모드 시작');
T.spawn(true); T.step(180); ok(S().meteors > 0, '운석이 쏟아짐');
T.end();
$('#snd').click();
ok($('#snd').getAttribute('aria-pressed') === 'false' && JSON.parse(localStorage.getItem('edu-expo-star-pilot-v1')).sound === false, '소리 끄기 저장');
return 'ok ' + n;
