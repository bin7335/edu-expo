// 48 콩콩 픽셀: 재료표 집계(도안 글자 수와 일치), 좌우 대칭 그리기, 대칭 끄기, 채우기·되돌리기, 판 크기 변경, 대칭 도안 판정
const cv = $('#cv');
const matMap = () => Object.fromEntries($$('#mat li').filter(li => li.querySelector('.no')).map(li => [+li.querySelector('.no').textContent, parseInt(li.querySelector('b').textContent)]));
// 1) 첫 화면 고양이 도안: 재료표 = 도안 문자 개수
const cat = SAMPLES[2], want = {};
cat.rows.join('').split('').forEach(ch => { const v = cat.legend[ch]; if (v) want[v] = (want[v] || 0) + 1; });
const got = matMap();
assert(JSON.stringify(Object.entries(want).sort()) === JSON.stringify(Object.entries(got).map(([k, v]) => [k, v]).sort()), '재료표 집계: 기대 ' + JSON.stringify(want) + ' / 화면 ' + JSON.stringify(got));
const sum = Object.values(want).reduce((a, b) => a + b, 0);
assert($('#tot').textContent === `모두 ${sum}개`, '합계: ' + $('#tot').textContent);
// 2) 비우기 → 0개
$('#clear').click(); await wait(50);
assert($('#tot').textContent === '모두 0개' && $('#mat').innerText.includes('아직 구슬이 없어요'), '비우기');
// 3) 대칭 켠 채 (3,4) 칸 찍기 → (14,4)도 같은 색
const at = (x, y, type = 'pointerdown') => {
  const r = cv.getBoundingClientRect(), s = r.width / (cv.width / (devicePixelRatio || 1));
  const o = { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientX: r.left + (M + x * CS + CS / 2) * s, clientY: r.top + (M + y * CS + CS / 2) * s };
  cv.dispatchEvent(new PointerEvent(type, o)); if (type === 'pointerdown') cv.dispatchEvent(new PointerEvent('pointerup', o));
};
$('#pal [data-c="10"]').click(); // 파랑
at(2, 3); await wait(50);
assert(cells[3 * 16 + 2] === 10 && cells[3 * 16 + 13] === 10, '대칭 칸도 칠해짐');
assert(isSymmetric(cells, 16), '대칭 유지');
assert(matMap()[10] === 2 && $('#tot').textContent === '모두 2개', '파랑 2개: ' + $('#tot').textContent);
// 4) 대칭 끄고 (1,1) 찍기 → 1개만
$('#sym').click(); await wait(50);
$('#pal [data-c="4"]').click(); at(0, 0); await wait(50);
assert(cells[0] === 4 && cells[15] === 0, '대칭 끄면 한 칸만');
assert(!isSymmetric(cells, 16) && $('#tot').textContent === '모두 3개', '대칭 깨짐·3개');
// 5) 채우기: 빈 칸 전체 → 256개, 되돌리기 → 3개
$('[data-tool="fill"]').click(); $('#pal [data-c="6"]').click(); at(8, 10); await wait(50);
assert($('#tot').textContent === '모두 256개' && matMap()[6] === 253, '채우기 253개 + 3 = 256: ' + JSON.stringify(matMap()));
$('#undo').click(); await wait(50);
assert($('#tot').textContent === '모두 3개', '되돌리기: ' + $('#tot').textContent);
// 6) 판 크기 16 → 20: 가운데 기준으로 2칸씩 이동
const size = $('#size'); size.value = '20'; fire(size, 'change'); await wait(100);
assert($('#dim').textContent.startsWith('20×20') && cells.length === 400, '20×20 판');
assert(cells[5 * 20 + 4] === 10 && cells[5 * 20 + 15] === 10 && cells[2 * 20 + 2] === 4, '구슬이 가운데 기준으로 옮겨짐');
assert($('#tot').textContent === '모두 3개', '크기 바꿔도 개수 유지');
// 7) 도안 불러오기: 별은 좌우 대칭, 하트는 하이라이트 때문에 비대칭
size.value = '16'; fire(size, 'change'); await wait(50);
$('#samples [data-s="1"]').click(); await wait(50);
assert($('#toast').textContent.includes('좌우 대칭'), '별 도안 대칭 안내: ' + $('#toast').textContent);
$('#samples [data-s="0"]').click(); await wait(50);
assert(!$('#toast').textContent.includes('좌우 대칭'), '하트 도안은 비대칭');
return 'ok 15';
