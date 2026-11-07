// 49 꿈길 찾기: 15쌍 구성, 선택 → 유형 점수 합, 최고 유형·동점 표시, 이전 버튼, 직업 탭
// 15쌍: 모든 유형이 정확히 5번, 같은 쌍 중복 없음
const mp = makePairs(), cnt = {}, seen = new Set();
mp.forEach(p => { p.forEach(t => cnt[t] = (cnt[t] || 0) + 1); seen.add([...p].sort().join('')); });
assert(mp.length === 15 && seen.size === 15 && ORDER.every(t => cnt[t] === 5), '15쌍·유형별 5번: ' + JSON.stringify(cnt));
const sc = score([{ pair: ['R', 'I'], pick: 0 }, { pair: ['A', 'S'], pick: 2 }, { pair: ['E', 'C'], pick: 1 }]);
assert(JSON.stringify(sc) === '{"R":1,"I":0,"A":1,"S":1,"E":0,"C":1}', '점수 합(둘 다=양쪽 1점): ' + JSON.stringify(sc));
// 화면에서 15문제: A가 있으면 A, 없으면 I>S>R>E>C 순으로 고르기
const PRI = ['A', 'I', 'S', 'R', 'E', 'C'];
$('#nick').value = '하늘'; $('#go').click(); await wait(100);
assert($('#v-quiz').classList.contains('on') && $('#qnum').textContent === '1 / 15', '퀴즈 시작');
// 이전 버튼: 1문제 답한 뒤 되돌리기
$$('#pair .card')[0].click(); await wait(500);
assert($('#qnum').textContent === '2 / 15', '2번째 문제');
$('#prev').click(); await wait(50);
assert($('#qnum').textContent === '1 / 15' && answers.length === 0, '이전 → 1번째, 답 지움');
for (let i = 0; i < 15; i++) {
  const p = pairs[qi].pair, want = PRI.find(t => p.includes(t));
  $$('#pair .card')[p.indexOf(want)].click(); await wait(450);
}
await wait(200);
assert($('#v-res').classList.contains('on'), '결과 화면');
const radar = $('#resRadar').textContent;
for (const [nm, v] of [['표현형', 5], ['탐구형', 4], ['도움형', 3], ['만들기형', 2], ['이끄는형', 1], ['정리형', 0]])
  assert(radar.includes(`${nm} ${v}`), `${nm} ${v}점: ` + radar);
const my = $('#mytype').innerText;
assert(my.includes('하늘의') && $('#mytype h2').textContent === '표현형' && my.includes('다음으로 탐구형'), '최고 유형 표현형: ' + my);
assert($('#jtabs button').dataset.t === 'A' && $('#jobs').innerText.includes('작곡가'), '첫 직업 탭 = 표현형');
$('#jtabs [data-t="C"]').click(); await wait(50);
assert($('#jobs').innerText.includes('사서'), '정리형 탭 직업');
// 모두 "둘 다" → 6유형 5점 동점 → 육각형 순서로 만들기형 + 탐구형
$('#again').click(); $('#go').click(); await wait(100);
for (let i = 0; i < 15; i++) { $('#both').click(); await wait(450); }
await wait(200);
assert($('#mytype h2').textContent === '만들기형 + 탐구형', '동점 표시: ' + $('#mytype h2').textContent);
assert(ORDER.every(t => score(answers)[t] === 5), '모두 5점');
return 'ok 15';
