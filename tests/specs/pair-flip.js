// 53 짝꿍 뒤집기: 미리보기 → 틀린 짝(다시 덮임) → 모든 짝 찾기 → 완료·별·최고 기록 → 쉬움 모드 완벽 클리어
__test.previewMs = 150; __test.missMs = 80;
const cards = () => $$('#board .c');
const card = i => $(`#board .c[data-i="${i}"]`);
const pairsOf = () => { const m = {}; G.deck.forEach((e, i) => (m[e] = m[e] || []).push(i)); return Object.values(m); };
assert(cards().length === 16 && G.phase === 'ready' && text().includes('짝꿍 뒤집기'), '첫 화면 16장 준비');
assert(new Set(G.deck).size === 8 && pairsOf().every(p => p.length === 2), '이모지 8쌍');
assert(!cards().some(c => c.classList.contains('up')), '처음엔 모두 뒷면');
// 시작 → 미리보기
$('#start').click(); await wait(30);
assert(G.phase === 'preview' && cards().every(c => c.classList.contains('up')), '미리보기: 전부 앞면');
card(0).click(); assert(G.moves === 0, '미리보기 중 누르기 무시');
await wait(220);
assert(G.phase === 'play' && !cards().some(c => c.classList.contains('up')), '미리보기 끝 → 덮고 시작');
// 틀린 짝
const ps = pairsOf();
const [a, b] = [ps[0][0], ps[1][0]];
card(a).click(); card(a).click(); await wait(10);
assert(G.moves === 0 && card(a).classList.contains('up'), '같은 카드 두 번은 횟수 아님');
card(b).click(); await wait(10);
assert(G.moves === 1 && $('#mv').textContent === '1' && card(b).classList.contains('up'), '틀린 짝 1회');
card(ps[2][0]).click(); assert(!card(ps[2][0]).classList.contains('up'), '덮이는 동안 잠금');
await wait(150);
assert(!card(a).classList.contains('up') && !card(b).classList.contains('up'), '틀린 짝은 다시 덮임');
// 모든 짝 찾기
for (const [x, y] of ps) { card(x).click(); card(y).click(); await wait(10); }
assert(G.found === 8 && $('#fd').textContent === '8/8' && $$('#board .c.ok').length === 16, '8쌍 모두 찾음');
assert(G.phase === 'done' && $('#modal').classList.contains('on') && text().includes('짝꿍을 다 찾았어요'), '완료 축하');
assert(G.moves === 9 && $('#mbox .st').textContent === '⭐⭐⭐' && text().includes('새 최고 기록'), '9회 → ★★★, 새 기록');
assert(G.elapsed > 0 && G.elapsed < 10, '시간 기록 ' + G.elapsed);
let best = JSON.parse(localStorage.getItem('edu-expo-pair-flip-v1'));
assert(best.normal.m === 9 && $('#best').textContent.includes('9회'), '최고 기록 저장');
card(0).click(); assert(G.moves === 9, '완료 후 카드 무시');
// 다시 하기 → 미리보기 끄고 일부러 많이 틀리기
$('#pv').click(); assert($('#pv').textContent.includes('끔'), '미리보기 끔');
$('#again').click(); await wait(20);
assert(G.phase === 'play' && !$('#modal').classList.contains('on') && G.moves === 0 && $$('#board .c.ok').length === 0, '다시 하기 → 바로 시작');
const q = pairsOf();
for (let k = 0; k < 7; k++) { card(q[k][0]).click(); card(q[k + 1][1]).click(); await wait(110); }
for (const [x, y] of q) { card(x).click(); card(y).click(); await wait(10); }
assert(G.phase === 'done' && G.moves === 15 && $('#mbox .st').textContent === '⭐☆☆', '15회 → ★');
assert(!text().includes('새 최고 기록') && JSON.parse(localStorage.getItem('edu-expo-pair-flip-v1')).normal.m === 9, '더 나쁜 기록은 저장 안 함');
// 쉬움 3×4
$('.seg .btn[data-mode="easy"]').click(); await wait(20);
assert(cards().length === 12 && new Set(G.deck).size === 6 && $('#fd').textContent === '0/6', '쉬움: 12장 6쌍');
card(0).click(); await wait(20);
assert(G.phase === 'play' && !card(0).classList.contains('up'), '카드 누르면 시작(뒤집지 않음)');
for (const [x, y] of pairsOf()) { card(x).click(); card(y).click(); await wait(10); }
assert(G.phase === 'done' && G.moves === 6 && $('#mbox .st').textContent === '⭐⭐⭐', '쉬움 완벽 6회');
best = JSON.parse(localStorage.getItem('edu-expo-pair-flip-v1'));
assert(best.easy.m === 6 && best.normal.m === 9, '모드별 기록');
// 시드 고정 섞기 재현
__test.seed = 7; newGame(); const d1 = G.deck.join(''); newGame(); assert(G.deck.join('') === d1, '시드 섞기 재현');
// 오염된 저장값 무시
localStorage.setItem('edu-expo-pair-flip-v1', '{"normal":{"m":"<img>","t":1},"easy":{"m":3,"t":2.5}}');
const lb = loadBest(); assert(!lb.normal && lb.easy.m === 3, '저장값 검증');
return 'ok 30';
