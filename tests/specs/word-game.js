// 09 낱말 놀이터: 짝 맞추기 완주, 퀴즈 만점, 돌림판 결과·뜻, 공유 링크로 단어장 복원, 편집 반영
const rowPairs = () => $$('#rows .r').map(r => [...r.querySelectorAll('input')].map(i => i.value.trim())).filter(p => p[0] && p[1]);
let P = rowPairs();
assert(P.length === 8, '기본 단어장 8짝: ' + P.length);
const meanOf = Object.fromEntries(P), wordOf = Object.fromEntries(P.map(p => [p[1], p[0]]));

// 1) 짝 맞추기: 정답 짝만 골라 뒤집어 8번 만에 완료
const cards = $$('#stage .fc');
assert(cards.length === 16, '카드 16장: ' + cards.length);
const txt = c => c.querySelector('.face').textContent;
const used = new Set();
for (const c of cards) {
  if (used.has(c)) continue;
  const t = txt(c), partner = cards.find(d => d !== c && !used.has(d) && (meanOf[t] === txt(d) || wordOf[t] === txt(d)));
  assert(partner, '짝 카드가 있어야 함: ' + t);
  c.click(); partner.click(); used.add(c); used.add(partner);
}
await wait(1000);
assert($('#mLeft').textContent.includes('0'), '남은 짝 0: ' + $('#mLeft').textContent);
assert($('#mTry').textContent === '시도 8', '시도 8: ' + $('#mTry').textContent);
assert($('#mWin').classList.contains('on'), '완료 화면');
// 틀린 짝은 다시 덮인다
$('#mAgain').click();
const c2 = $$('#stage .fc'); const a = c2[0], b = c2.find(d => d !== a && meanOf[txt(a)] !== txt(d) && wordOf[txt(a)] !== txt(d));
a.click(); b.click(); await wait(1300);
assert(!a.classList.contains('open') && !b.classList.contains('open'), '틀린 짝은 다시 덮여야 함');

// 2) 빠른 퀴즈: 정답만 눌러 8문제 만점
$('#modes .mode[data-g="quiz"]').click(); await wait(50);
for (let i = 0; i < 8; i++) {
  const w = $('.q-word').textContent, ans = meanOf[w];
  const opts = $$('.opt');
  assert(opts.length === 4 && new Set(opts.map(o => o.textContent)).size === 4, '보기 4개, 중복 없음');
  const right = opts.find(o => o.textContent === ans);
  assert(right, `정답 보기가 있어야 함: ${w}→${ans}`);
  right.click(); await wait(1000);
}
assert(text().includes('8문제 중 8개 정답'), '만점 결과: ' + $('#stage').innerText.slice(0, 80));

// 3) 돌림판: 멈추면 단어가 나오고 뜻 보기가 그 단어의 뜻
$('#modes .mode[data-g="wheel"]').click(); await wait(50);
$('#wSpin').click(); await wait(4200);
const w = $('#wWord').textContent;
assert(meanOf[w], '돌림판 결과가 단어장 단어: ' + w);
assert(!$('#wShow').disabled, '뜻 보기 활성');
$('#wShow').click();
assert($('#wMean').textContent.includes(meanOf[w]), '뜻 표시: ' + $('#wMean').textContent);

// 4) 편집 → 공유 링크 → 다른 단어장으로 바꾼 뒤 링크로 복원
const first = $('#rows input[data-i="0"][data-k="0"]');
first.value = 'dog'; fire(first, 'input');
const firstM = $('#rows input[data-i="0"][data-k="1"]');
firstM.value = '개'; fire(firstM, 'input');
assert(rowPairs()[0].join() === 'dog,개', '편집 반영');
$('#share').click();
const url = $('#shareUrl').value;
assert(/#w=[\w-]+$/.test(url), '공유 주소에 단어장: ' + url);
$('#modal').click();
const pre = $('#preset'); pre.value = 'capital'; fire(pre, 'change');
assert(rowPairs()[0][0] === '대한민국', '예시 단어장 불러오기');
location.hash = '#x'; await wait(50);
location.hash = url.split('#')[1]; await wait(200);
assert(rowPairs()[0].join() === 'dog,개' && rowPairs().length === 8, '공유 링크로 단어장 복원: ' + rowPairs()[0]);
return 'ok';
