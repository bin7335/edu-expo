// 81 역사 타임머신: 첫 화면(시간 터널) → 시대 고르기 → 이동 연출 → 그때 사람과 대화(질문 3개·사실 확인) → 질문을 다 해야 퀴즈
// → 오답 힌트·정답 도장 → 4개 시대 → 수료증·기록 저장 / 키보드 숫자 선택
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
ok(text().includes('역사 타임머신') && $('#hub').classList.contains('on') && $$('.era').length === 4, '제목·시대 4개');
const t0 = S().t; __test.step(60);
ok(S().t > t0 + .9 && S().phase === 'hub', '첫 화면 시간 터널이 움직임');
const skip = () => { $('#say').click(); };
const qs = () => $$('#opts button.q');
const talkAll = async () => {
  const texts = [];
  skip();
  for (let k = 0; k < 3; k++) {
    const b = qs()[0]; b.click(); await wait(5); skip(); texts.push($('#sayText').textContent);
    $('#opts button').click(); await wait(5); skip();
  }
  return texts.join(' ');
};
// 1. 신석기
$('.era[data-i="0"]').click(); await wait(20);
ok(S().phase === 'warp', '시간 이동 연출');
__test.step(150);
ok(S().phase === 'talk' && S().era === 0 && $('#eraTag').textContent.includes('신석기'), '신석기 도착: ' + $('#eraTag').textContent);
ok(S().typing, '대사가 한 글자씩 나옴');
skip();
ok(!S().typing && qs().length === 3 && !$('#opts .quiz'), '질문 3개, 아직 퀴즈 없음');
qs()[0].click(); await wait(5); skip();
const a1 = $('#sayText').textContent;
ok(a1.length > 30 && $('#opts button').textContent.includes('다른'), '대답과 이어 묻기');
$('#opts button').click(); await wait(5); skip();
ok(qs().length === 2, '물어본 질문은 빠짐');
// 키보드 숫자로 고르기
document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true })); await wait(5); skip();
ok(S().asked.length === 2, '숫자 키로 질문 고르기');
document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true })); await wait(5); skip();
qs()[0].click(); await wait(5); skip();
const allNeo = a1 + ' ' + S().log.join(' ');
ok(['움집', '빗살무늬', '간석기'].every(k => allNeo.includes(k)), '신석기 사실(움집·빗살무늬 토기·간석기)');
$('#opts button').click(); await wait(5); skip();
ok($('#opts .quiz'), '질문을 다 하면 퀴즈 버튼');
$('#opts .quiz').click(); await wait(10);
ok(S().phase === 'quiz' && $('#quiz').classList.contains('on') && $$('#qOpts button').length === 3, '퀴즈 3지선다');
const ans = () => $$('#qOpts button').find(b => b.dataset.ok === '1');
$$('#qOpts button').find(b => b.dataset.ok !== '1').click(); await wait(10);
ok(S().phase === 'quiz' && $('#qfb').textContent.length > 4, '오답 힌트');
ok(ans().textContent.includes('빗살무늬'), '신석기 정답은 빗살무늬 토기');
ans().click(); await wait(10);
ok(S().stamps.includes(0) && $('#stampMsg').textContent.length > 0, '도장 받음');
$('#qNext').click(); await wait(10);
ok(S().phase === 'hub' && $('.era[data-i="0"]').classList.contains('done'), '시대 고르기로 돌아오고 도장 표시');
// 나머지 시대
const facts = { 1: ['첨성대', '골품제', '선덕여왕'], 2: ['1443', '훈민정음', '세종'], 3: ['1899', '전차', '신식 학교'] };
const answers = { 1: '골품제', 2: '훈민정음', 3: '전차' };
for (const i of [1, 2, 3]) {
  $(`.era[data-i="${i}"]`).click(); __test.step(150);
  ok(S().phase === 'talk' && S().era === i, i + '번 시대 도착');
  const tx = await talkAll();
  ok(facts[i].every(k => tx.includes(k)), i + '번 시대 사실: ' + facts[i].join(','));
  $('#opts .quiz').click(); await wait(10);
  ok(ans().textContent.includes(answers[i]), i + '번 퀴즈 정답 ' + answers[i]);
  ans().click(); await wait(10); $('#qNext').click(); await wait(10);
}
__test.step(30);
ok(S().phase === 'end' && $('#end').classList.contains('on') && $('#end').innerText.includes('수료'), '4개 시대 → 수료증');
const st = JSON.parse(localStorage.getItem('edu-expo-time-machine-v1'));
ok(st.stamps.length === 4 && st.done === 1, '도장·수료 저장');
$('#again').click(); await wait(10);
ok(S().phase === 'hub' && S().stamps.length === 0, '다시 여행');
$('#snd').click();
ok($('#snd').getAttribute('aria-pressed') === 'true', '소리 켜기');
return 'ok ' + n;
