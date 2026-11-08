// 79 화석 발굴단: 첫 화면(살아 있는 장면) → 시작 → 붓질(한 번은 덜 드러남, 여러 번 털면 발견) → 실제 포인터 붓질 → 뼈 5개 발견 → 맞추기(남의 자리 거절·제자리 고정)
// → 정체 맞히기(오답 힌트·정답) → 사실 카드(시대·먹이·크기 정확) → 발굴 노트 저장 → 3곳 완료 엔딩·수료 기록
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
ok(text().includes('화석 발굴단') && $('#intro').classList.contains('on') && $('#start'), '제목·시작 카드');
ok(S().phase === 'intro' && S().site === 0 && S().pieces === 5, '1번 발굴지·뼈 5개');
const d0 = S().dust; __test.step(60);
ok(S().t > 0.9, '첫 화면 장면이 움직임(시간 흐름)');
ok($('#snd').getAttribute('aria-pressed') === 'false', '소리는 꺼진 채 시작');
$('#start').click(); await wait(30);
ok(S().phase === 'dig' && !$('#intro').classList.contains('on'), '발굴 시작');
// 한 번 붓질로는 덜 드러남
__test.brushPiece(0, 1);
const r1 = S().reveal[0];
ok(!S().found[0] && r1 > 0.2 && r1 < 0.92, '한 번 털면 일부만 드러남: ' + r1.toFixed(2));
__test.brushPiece(0, 3);
ok(S().found[0] && S().reveal[0] >= 0.92, '여러 번 털면 발견');
ok($('#toast').textContent.includes('발견') && $('#status').textContent.includes('1/5'), '발견 알림·진행 표시: ' + $('#status').textContent);
// 실제 포인터 이벤트로 붓질
const cv = $('#cv'), before = S().dirt;
const p = __test.toScreen(__test.pieceCenter(1));
const pe = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, bubbles: true, pointerId: 1, isPrimary: true, pointerType: 'mouse', buttons: t === 'pointerup' ? 0 : 1 }));
pe('pointerdown', p.x - 40, p.y);
for (let i = 0; i <= 16; i++) pe('pointermove', p.x - 40 + i * 5, p.y + (i % 2 ? 6 : -6));
pe('pointerup', p.x + 40, p.y);
ok(S().dirt < before - 0.001 && S().dust > 0, '드래그로 흙이 털리고 흙먼지가 날림');
for (let i = 1; i < 5; i++) __test.brushPiece(i, 4);
ok(S().found.every(Boolean) && $('#status').textContent.includes('5/5'), '뼈 5개 모두 발견');
__test.step(100);
ok(S().phase === 'assemble', '맞추기 단계로');
// 남의 자리에 놓으면 거절
ok(__test.drop(0, 1) === false && !S().placed[0], '다른 뼈 자리에는 안 들어감');
ok($('#toast').textContent.includes('자리'), '자리 안내: ' + $('#toast').textContent);
for (let i = 0; i < 5; i++) ok(__test.drop(i, i) === true && S().placed[i], (i + 1) + '번 뼈 제자리 고정');
__test.step(80);
ok(S().phase === 'identify' && $('#quiz').classList.contains('on') && $$('#choices button').length === 3, '정체 맞히기 3지선다');
const answer = S().dino;
ok(answer === '트리케라톱스', '1번 발굴지 공룡: ' + answer);
const wrong = $$('#choices button').find(b => b.dataset.name !== answer);
wrong.click(); await wait(20);
ok(S().phase === 'identify' && $('#qfb').textContent.length > 5 && S().tries === 1, '오답 힌트: ' + $('#qfb').textContent);
$$('#choices button').find(b => b.dataset.name === answer).click(); await wait(20);
ok(S().phase === 'fact' && $('#fact').classList.contains('on'), '사실 카드');
const ft = $('#fact').innerText;
ok(ft.includes('백악기 후기') && ft.includes('초식') && ft.includes('8-9m'), '트리케라톱스 사실(시대·먹이·크기): ' + ft.slice(0, 120));
let st = JSON.parse(localStorage.getItem('edu-expo-dino-dig-v1'));
ok(st.notes.length === 1 && st.notes[0] === 'tri', '발굴 노트 저장');
// 나머지 두 곳
const facts = { '스테고사우루스': ['쥐라기 후기', '초식'], '티라노사우루스': ['백악기 후기', '육식'] };
for (let s = 1; s < 3; s++) {
  $('#next').click(); await wait(20);
  ok(S().phase === 'dig' && S().site === s && S().found.every(f => !f), (s + 1) + '번 발굴지 시작');
  for (let i = 0; i < 5; i++) __test.brushPiece(i, 4);
  __test.step(100);
  for (let i = 0; i < 5; i++) __test.drop(i, i);
  __test.step(80);
  const a = S().dino;
  $$('#choices button').find(b => b.dataset.name === a).click(); await wait(20);
  const t2 = $('#fact').innerText;
  ok(facts[a] && facts[a].every(k => t2.includes(k)), a + ' 사실 확인');
}
ok(S().site === 2 && $('#next').textContent.includes('수료'), '마지막은 수료 버튼');
$('#next').click(); await wait(20);
ok(S().phase === 'end' && $('#end').classList.contains('on') && $('#end').innerText.includes('수료'), '엔딩 카드');
st = JSON.parse(localStorage.getItem('edu-expo-dino-dig-v1'));
ok(st.notes.length === 3 && st.done === 1, '노트 3개·수료 1회 저장');
$('#notesBtn').click(); await wait(20);
ok($('#notes').classList.contains('on') && $$('#notes .note').length === 3, '발굴 노트 3장');
$('#notesClose').click();
$('#snd').click();
ok($('#snd').getAttribute('aria-pressed') === 'true', '소리 켜기');
$('#again').click(); await wait(20);
ok(S().phase === 'dig' && S().site === 0, '다시 발굴');
return 'ok ' + n;
