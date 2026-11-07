// 68 차곡차곡 탑: 시연 화면 → 시작 → 딱 맞춤(폭 유지·연속) → 어긋남(잘림·조각 낙하) → 3연속 딱(다시 커짐) → 키보드·터치 → 일시정지 → 빗나감·결과 → 최고 기록 → 다시 하기
const S = () => __test.state();
assert(text().includes('차곡차곡 탑') && $('#ready').classList.contains('on'), '제목·준비 카드');
assert(S().phase === 'attract' && S().height >= 5, '첫 화면 시연 탑: ' + S().height);
__test.seed(3);
$('#start').click(); await wait(30);
assert(S().phase === 'play' && S().height === 0 && !$('#ov').classList.contains('on'), '게임 시작');
assert(!$('#pauseBtn').disabled && $('#score').textContent === '0', '점수 0·멈춤 버튼');
const ax0 = S().axis;
__test.step(10);
const o1 = S().cur.o; __test.step(5);
assert(S().cur.o !== o1, '블록이 움직임');
// 딱 맞춤: 폭 유지, 위치 고정
__test.aim(1.5); __test.drop();
let s = S();
assert(s.height === 1 && s.top.w === 100 && s.top.d === 100 && s.top.x === 0 && s.top.z === 0, '딱 맞춤 → 크기 유지·제자리: ' + JSON.stringify(s.top));
assert(s.combo === 1 && s.debris.length === 0 && s.axis !== ax0, '연속 1, 조각 없음, 축 전환');
assert($('#score').textContent === '1', '높이 1 표시');
// 어긋남: 잘림
__test.aim(-20); __test.drop();
s = S();
const sz = s.axis === 'x' ? 'd' : 'w'; // 방금 놓인 블록의 이동 축 크기
assert(s.height === 2 && Math.abs(s.top[sz] - 80) < 1e-6 && s.combo === 0, '20 어긋남 → 80으로 잘림: ' + JSON.stringify(s.top));
assert(s.debris.length === 1, '잘린 조각 1개');
const y0 = s.debris[0].y; __test.step(20);
assert(S().debris[0].y < y0 - 5, '잘린 조각이 떨어짐');
// 3연속 딱 → 다시 커짐
__test.aim(0); __test.drop(); __test.aim(0); __test.drop();
const before = S().top; __test.aim(2); __test.drop();
s = S();
assert(s.combo === 3 && (s.top.w + s.top.d) === (before.w + before.d) + 5, '3연속 딱 → 5만큼 커짐: ' + JSON.stringify(s.top));
assert(s.perfects === 4 && s.maxCombo === 3, '딱 횟수·최대 연속');
// 키보드(스페이스)·터치로 떨어뜨리기
let h = s.height; __test.aim(0);
document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
assert(S().height === h + 1, '스페이스로 떨어뜨림');
__test.aim(0);
$('#cv').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
assert(S().height === h + 2, '화면 터치로 떨어뜨림');
// 일시정지
$('#pauseBtn').click();
assert(S().phase === 'paused' && $('#paused').classList.contains('on'), '일시정지 카드');
const op = S().cur.o; __test.step(30);
assert(S().cur.o === op, '멈춘 동안 블록 정지');
document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
assert(S().height === h + 2, '멈춘 동안 떨어뜨리기 안 됨');
$('#resume').click();
assert(S().phase === 'play', '계속하기');
// 완전히 빗나감 → 게임 끝
h = S().height; __test.aim(115); __test.drop();
assert(S().phase === 'over' && S().height === h, '빗나감 → 와르르');
__test.step(90); await wait(30);
assert(S().phase === 'result' && $('#result').classList.contains('on'), '결과 카드');
assert($('#rScore').textContent === h + '층' && $('#rStat').textContent.includes('딱! 6번 · 최대 5연속'), '결과: ' + $('#rScore').textContent + ' ' + $('#rStat').textContent);
assert(!$('#newrec').hidden && $('#best').textContent === String(h), '새 최고 기록 표시');
assert(JSON.parse(localStorage.getItem('edu-expo-stack-tower-v1')).best === h, '최고 기록 저장');
// 다시 하기 → 낮은 기록은 최고 아님
$('#again').click(); await wait(20);
assert(S().phase === 'play' && S().height === 0 && $('#score').textContent === '0', '다시 하기');
__test.aim(115); __test.drop(); __test.step(90);
assert($('#newrec').hidden && $('#best').textContent === String(h), '0층은 새 기록 아님');
$('#snd').click();
assert(JSON.parse(localStorage.getItem('edu-expo-stack-tower-v1')).sound === false && $('#snd').getAttribute('aria-pressed') === 'false', '소리 끄기 저장');
return 'ok 28';
