// 59 밀어 퍼즐: 섞기는 합법 이동 → 2번 섞고 클릭으로 풀기 → 완성·최고 기록 → 방향키 → 줄 밀기 → 4×4·그림·힌트 → 다시 하기
const KEY = 'edu-expo-slide-puzzle-v1';
const tile = v => $(`#grid .tile[data-v="${v}"]`);
assert(text().includes('밀어 퍼즐'), '제목');
assert($$('#grid .tile').length === 8 && $('#board').classList.contains('pic'), '첫 화면 3×3 그림 퍼즐');
assert(!__test.solved(), '첫 화면은 섞인 상태');
assert(getComputedStyle(tile(1).firstChild).backgroundImage.includes('svg'), '그림 조각 배경');
// 숫자 모드에서 2번 섞고 클릭으로 풀기
$('#modeSeg [data-m="num"]').click();
assert($('#board').classList.contains('num') && tile(5).textContent.includes('5'), '숫자 모드');
let path = __test.shuffle(2, 11);
assert(path.length === 2 && !__test.solved(), '2번 섞기: ' + path);
assert($('#moves').textContent === '0' && $('#time').textContent === '0:00', '이동·시간 초기화');
// 빈칸과 다른 줄의 조각은 움직이지 않음
const p0 = __test.pos, e0 = p0.indexOf(0), far = p0.find((v, i) => v && Math.floor(i / 3) !== Math.floor(e0 / 3) && i % 3 !== e0 % 3);
tile(far).click();
assert(JSON.stringify(__test.pos) === JSON.stringify(p0) && $('#moves').textContent === '0', '멀리 있는 조각은 그대로');
for (const v of path.slice().reverse()) { tile(v).click(); await wait(40); }
assert(__test.solved() && __test.won, '클릭으로 완성');
assert($('#moves').textContent === '2', '이동 2번: ' + $('#moves').textContent);
await wait(500);
assert($('#win').classList.contains('on') && $('#wStat').textContent.includes('2번'), '완성 축하: ' + $('#wStat').textContent);
assert(!$('#newrec').hidden && $$('#conf i').length > 0, '신기록 배지·색종이');
assert(JSON.parse(localStorage.getItem(KEY)).best['3-num'].m === 2 && $('#best').textContent.startsWith('2번'), '최고 기록 저장: ' + $('#best').textContent);
// 완성 후 조각은 잠김
const pw = __test.pos; tile(8).click(); assert(JSON.stringify(__test.pos) === JSON.stringify(pw), '완성 후 잠금');
// 다시 하기
$('#again').click();
assert(!__test.solved() && !$('#win').classList.contains('on') && $('#moves').textContent === '0', '다시 하기 → 새로 섞임');
// 방향키: 1번 섞고 키로 되돌리기
path = __test.shuffle(1, 3);
const e1 = __test.pos.indexOf(0), c1 = __test.pos.indexOf(path[0]);
const k = { 1: 'ArrowLeft', '-1': 'ArrowRight', 3: 'ArrowUp', '-3': 'ArrowDown' }[c1 - e1];
document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
assert(__test.solved() && $('#moves').textContent === '1', '방향키 ' + k + '로 완성');
await wait(500);
assert($('#newrec').hidden === false && $('#best').textContent.startsWith('1번'), '더 적은 이동 → 기록 갱신');
// 한 줄 밀기: 빈칸이 오른쪽 아래일 때 맨 왼쪽 조각(7)을 누르면 2칸 이동
__test.shuffle(0);
tile(7).click();
assert(JSON.stringify(__test.pos.slice(6)) === JSON.stringify([0, 7, 8]) && $('#moves').textContent === '2', '줄 밀기 2칸');
tile(7).click(); tile(8).click(); await wait(50);
assert(__test.won && $('#moves').textContent === '4', '줄 밀기 후 되돌려 완성(4번)');
await wait(450);
assert($('#newrec').hidden && $('#best').textContent.startsWith('1번'), '기록보다 나쁘면 유지');
// 4×4 그림 모드 + 힌트
$('#sizeSeg [data-n="4"]').click(); $('#modeSeg [data-m="pic"]').click();
assert(__test.n === 4 && $$('#grid .tile').length === 15 && $('#board').classList.contains('pic') && !__test.solved(), '4×4 그림 퍼즐');
assert($('#bestLbl').textContent.includes('4×4') && $('#best').textContent === '아직 없어요', '크기별 기록');
$('#hint').click();
assert($('#board').classList.contains('hint') && $('#hint').getAttribute('aria-pressed') === 'true', '힌트 켜기');
await wait(350);
assert(+getComputedStyle($('#full')).opacity > 0.5, '완성 그림 보임');
$('#hint').click();
assert(!$('#board').classList.contains('hint'), '힌트 끄기');
// 4×4도 2번 섞고 풀기
path = __test.shuffle(2, 99);
for (const v of path.slice().reverse()) tile(v).click();
assert(__test.won && JSON.parse(localStorage.getItem(KEY)).best['4-pic'].m === 2, '4×4 완성·기록');
$('#snd').click();
assert(JSON.parse(localStorage.getItem(KEY)).sound === false && $('#snd').textContent === '🔇', '소리 끄기 저장');
return 'ok 31';
