// 80 한옥 한 바퀴: 첫 화면 자동 회전 → 시작 → 방향키·끌기로 둘러보기(360° 이어짐) → 핫스팟이 화면 방향에 따라 보였다 숨음
// → 핫스팟 열기(설명 정확·도장 1개, 중복 없음) → 7곳 모두 찾기 → 엔딩·기록 저장
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
ok(text().includes('한옥 한 바퀴') && $('#intro').classList.contains('on'), '제목·시작 카드');
ok($$('.hs').length === 7 && $$('.stamp').length === 7, '핫스팟 7곳·도장 7칸');
const y0 = S().yaw; __test.step(60);
ok(Math.abs(S().yaw - y0) > 0.5, '첫 화면에서 천천히 돌아감');
$('#start').click(); await wait(30);
ok(S().phase === 'look' && !$('#intro').classList.contains('on'), '둘러보기 시작');
// 방향키
__test.face('daecheong'); const ya = S().yaw;
document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
__test.step(10);
document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
ok(S().yaw > ya + 2, '오른쪽 방향키로 오른쪽 보기: ' + ya.toFixed(1) + '→' + S().yaw.toFixed(1));
// 끌기: 왼쪽으로 끌면 오른쪽을 봄
const cv = $('#cv'); const yb = S().yaw;
const pe = (t, x) => cv.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: 400, bubbles: true, pointerId: 1, isPrimary: true, pointerType: 'mouse', buttons: t === 'pointerup' ? 0 : 1 }));
pe('pointerdown', 800); for (let x = 780; x >= 500; x -= 20) pe('pointermove', x); pe('pointerup', 500);
__test.step(1);
ok(S().yaw > yb + 10, '끌어서 둘러보기: ' + yb.toFixed(1) + '→' + S().yaw.toFixed(1));
// 360° 이어짐
__test.setYaw(359); __test.step(1); __test.setYaw(S().yaw + 3); __test.step(1);
ok(S().yaw >= 0 && S().yaw < 5, '360°를 넘으면 0°로 이어짐: ' + S().yaw.toFixed(1));
// 보이는 방향의 핫스팟만 보임
__test.face('daecheong'); __test.step(2);
const shown = id => { const b = $(`.hs[data-id="${id}"]`); return getComputedStyle(b).display !== 'none'; };
ok(shown('daecheong') && !shown('daemun'), '앞의 대청은 보이고 뒤의 대문은 숨음');
const r = $('.hs[data-id="daecheong"]').getBoundingClientRect();
ok(Math.abs(r.left + r.width / 2 - innerWidth / 2) < 30, '정면 핫스팟은 화면 가운데');
// 열기
$('.hs[data-id="daecheong"]').click(); await wait(20);
ok($('#info').classList.contains('on') && $('#infoTitle').textContent.includes('대청') && $('#infoText').textContent.includes('바람'), '대청마루 설명');
ok(S().found.length === 1 && $$('.stamp.on').length === 1 && $('#count').textContent.includes('1/7'), '도장 1개');
$('#infoOk').click(); await wait(20);
__test.face('daecheong'); __test.step(2); $('.hs[data-id="daecheong"]').click(); $('#infoOk').click();
ok(S().found.length === 1, '같은 곳은 도장 한 번만');
// 사실 확인
const facts = { ondol: ['아궁이', '구들장', '굴뚝'], cheoma: ['여름', '겨울', '햇빛'], jangdok: ['옹기', '된장'], changho: ['한지'], daemun: ['솟을대문'], madang: ['마당'] };
for (const id of ['cheoma', 'jangdok', 'daemun', 'madang', 'ondol', 'changho']) {
  __test.face(id); __test.step(2);
  ok(shown(id), id + ' 보임');
  $(`.hs[data-id="${id}"]`).click(); await wait(10);
  const t = $('#infoText').textContent + $('#infoTitle').textContent;
  ok(facts[id].every(k => t.includes(k)), id + ' 설명 확인');
  $('#infoOk').click(); await wait(10);
}
__test.step(80);
ok(S().phase === 'end' && $('#end').classList.contains('on') && $$('.stamp.on').length === 7, '7곳 모두 → 엔딩');
const st = JSON.parse(localStorage.getItem('edu-expo-hanok-360-v1'));
ok(st.done === 1 && st.best > 0, '완주 기록 저장');
ok($('#end').innerText.includes('한옥'), '엔딩 문구');
$('#again').click(); await wait(20);
ok(S().phase === 'look' && S().found.length === 0 && $$('.stamp.on').length === 0, '다시 둘러보기');
$('#snd').click();
ok($('#snd').getAttribute('aria-pressed') === 'true', '소리 켜기');
return 'ok ' + n;
