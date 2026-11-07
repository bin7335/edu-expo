// 41 역사 연표: 샘플 12개 표시, 사건 추가(기원전) 저장, 카드 상세·빼기, 순서 맞히기 게임 채점
assert($$('#layer .ev').length === 12, '샘플 사건 12개 표시: ' + $$('#layer .ev').length);
// 기원전 57년 신라 건국 추가
$('#fBC').checked = true; $('#fYear').value = '57'; $('#fName').value = '신라 건국'; $('#fDesc').value = '박혁거세';
$('#addForm').requestSubmit(); await wait(200);
const stored = JSON.parse(localStorage.getItem('edu-expo-timeline-v1'));
const silla = stored.find(e => e.n === '신라 건국');
assert(silla && silla.y === -57, '기원전 57년은 -57로 저장: ' + JSON.stringify(silla));
const card = $$('#layer .ev').find(e => e.textContent.includes('신라 건국'));
assert(card && card.textContent.includes('기원전 57년'), '연표에 기원전 57년 카드: ' + (card && card.textContent));
// 카드 누르기 → 상세
const r = card.getBoundingClientRect(), opt = { bubbles: true, pointerId: 1, isPrimary: true, clientX: r.left + 5, clientY: r.top + 5 };
card.dispatchEvent(new PointerEvent('pointerdown', opt));
$('#vp').dispatchEvent(new PointerEvent('pointerup', opt)); await wait(100);
assert($('#detail').classList.contains('on') && $('#detail').innerText.includes('박혁거세'), '상세 열림: ' + $('#detail').innerText);
// 빼기 → 저장에서도 사라짐
$('#detail [data-a=del]').click(); await wait(100);
assert(!JSON.parse(localStorage.getItem('edu-expo-timeline-v1')).some(e => e.n === '신라 건국'), '빼면 저장에서 사라짐');
assert(!$$('#layer .ev').some(e => e.textContent.includes('신라 건국')) && !$('#detail').classList.contains('on'), '빼면 화면에서 사라짐');
// 게임: 정답 순서로 놓으면 모두 정답
$('#bGame').click(); await wait(100);
assert(document.body.classList.contains('playing'), '게임 화면');
const yearOf = el => SAMPLE.find(s => s.n === el.querySelector('b').textContent).y;
const cards = $$('#game .tray .gc'); assert(cards.length === 6, '카드 6장: ' + cards.length);
const order = cards.map(c => [+c.dataset.c, yearOf(c)]).sort((a, b) => a[1] - b[1]);
for (let i = 0; i < order.length; i++) {
  $(`#game .gc[data-c="${order[i][0]}"]`).click();
  $(`#game .slot[data-s="${i}"]`).click();
}
$('#gCheck').click(); await wait(100);
assert($('#game .msg').textContent.includes('6개 모두 정답'), '정답 순서 → 모두 정답: ' + $('#game .msg').textContent);
// 앞 두 칸을 바꾸면 4개 정답
// (놓인 칸을 누르면 카드가 트레이로 돌아감 → 서로 바꿔 다시 놓기)
$(`#game .slot[data-s="0"]`).click(); $(`#game .slot[data-s="1"]`).click();
$(`#game .gc[data-c="${order[0][0]}"]`).click(); $(`#game .slot[data-s="1"]`).click();
$(`#game .gc[data-c="${order[1][0]}"]`).click(); $(`#game .slot[data-s="0"]`).click();
$('#gCheck').click(); await wait(100);
assert($('#game .msg').textContent.includes('6개 중 4개 정답'), '두 칸 바꾸면 4개 정답: ' + $('#game .msg').textContent);
assert($$('#game .slot.bad').length === 2, '틀린 칸 2개 표시');
// 빈칸 있으면 채점 안 함
$('#gNew').click(); await wait(50); $('#gCheck').click(); await wait(50);
assert($('#game .msg').textContent.includes('모든 칸에'), '빈칸 경고');
return 'ok 11';
