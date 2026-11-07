// 52 번개 손: 시작 → 반칙(빨강에서 누름) → 5판 측정 → 평균·등급 → TOP5 저장 → 다시 하기
const A = $('#arena'), tapA = () => A.click();
const ph = () => st.phase;
const big = () => ($('#face .big') || {}).textContent || '';
assert(ph() === 'idle' && text().includes('번개 손') && text().includes('터치해서 시작'), '첫 화면 준비');
assert($$('#grades li').length === 5 && $$('#top li').length === 5, '등급표 5칸·TOP5 5칸');
__test.delay = 400; __test.guard = 0;
tapA(); await wait(30);
assert(ph() === 'wait' && A.classList.contains('wait'), '시작 → 빨강 기다림');
// 너무 빨리 누르면 반칙, 기록 안 됨
tapA(); await wait(30);
assert(ph() === 'foul' && text().includes('반칙') && st.times.length === 0, '빨강에서 누르면 반칙');
await wait(500);
assert(ph() === 'foul', '반칙 뒤 초록으로 바뀌지 않음(타이머 취소)');
tapA(); await wait(30);
assert(ph() === 'wait', '반칙 후 터치 → 같은 판 다시');
// 5판: 실제 측정 1판 + 고정값 4판
await wait(450);
assert(ph() === 'go' && A.classList.contains('go') && big() === '지금!', '대기 후 초록 "지금!"');
await wait(120); tapA(); await wait(30);
assert(ph() === 'shown' && st.times[0] >= 100 && st.times[0] < 600 && big() === st.times[0] + 'ms', '실측 ms 표시: ' + st.times[0]);
assert($$('#rounds .rd.ok').length === 1, '1번째 칸 기록');
for (const f of [200, 210, 220, 230]) {
  __test.fake = f; tapA(); await wait(30);
  assert(ph() === 'wait', '다음 판 대기');
  await wait(430); assert(ph() === 'go', '초록'); tapA(); await wait(30);
}
const avg = Math.round((st.times[0] + 860) / 5);
assert(ph() === 'done' && st.times.length === 5, '5판 끝 → 결과');
assert($('#face .avg').textContent.startsWith(String(avg)) && st.avg === avg, '평균 ' + avg + ' 표시');
const g = GRADES.find(x => avg < x.max);
assert($('#face .gname').textContent === g.n + ' 등급' && $('#grades li.me').textContent.includes(g.n), '등급 ' + g.n);
assert(text().includes('TOP5 중 1위'), '첫 기록 1위');
let saved = JSON.parse(localStorage.getItem('edu-expo-reaction-tap-v1'));
assert(saved.length === 1 && saved[0] === avg, '기록 저장(숫자만): ' + JSON.stringify(saved));
assert($('#top li.new') && $('#top li.new').textContent.includes(avg + ' ms'), 'TOP5에 새 기록 강조');
// 결과 화면에서 아레나 터치는 무시
tapA(); await wait(30); assert(ph() === 'done', '결과 화면 터치 무시');
// 다시 하기 → 전부 500ms(거북이)로 한 판 더
$('#again').click(); await wait(30);
assert(ph() === 'wait' && st.times.length === 0 && !$('#grades li.me'), '다시 하기 → 초기화 후 대기');
__test.fake = 500;
for (let i = 0; i < 5; i++) { await wait(430); tapA(); await wait(30); if (i < 4) tapA(); await wait(10); }
assert(ph() === 'done' && st.avg === 500 && $('#face .gname').textContent === '거북이 등급', '500ms → 거북이');
saved = JSON.parse(localStorage.getItem('edu-expo-reaction-tap-v1'));
assert(saved.length === 2 && saved[0] === avg && saved[1] === 500 && text().includes('2위'), 'TOP5 정렬 저장');
// 스페이스바로도 조작
$('#again').click(); await wait(30); __test.fake = null;
document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); await wait(30);
assert(ph() === 'foul', '스페이스바로 반칙 판정');
// 오염된 저장값은 무시
localStorage.setItem('edu-expo-reaction-tap-v1', '["<b>x</b>",-5,99999,"abc",321]');
assert(JSON.stringify(loadTop()) === '[321]', '저장값 검증');
return 'ok 25';
