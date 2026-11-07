// 57 안전 OX 챔피언: 문제 은행 검사 → 7개 맞히고 3개 틀리기(지킴이) → 틀린 문제 다시 보기 → 최고 점수 저장 → 10개 모두 정답(챔피언) → 3개(새싹)
const T = window.__test;
const bank = T.bank();
assert(bank.length >= 20, '문제 은행 20개 이상: ' + bank.length);
assert(new Set(bank.map(q => q.q)).size === bank.length, '문제 중복 없음');
assert(bank.every(q => typeof q.a === 'boolean' && q.ex.length > 10), '모든 문제에 정답·해설');
assert(bank.filter(q => q.a).length >= 8 && bank.filter(q => !q.a).length >= 8, 'O·X 정답이 고르게 섞임');
for (const c of ['생활', '교통', '화재', '지진', '물놀이']) assert(bank.some(q => q.cat.includes(c)), '분류 포함: ' + c);
assert($('#sHome').classList.contains('on') && $('#best').textContent === '0', '시작 화면·최고 0점');
// 한 판 플레이: correctMask[i]가 true면 정답, false면 오답
const play = async (correct) => {
  const seen = new Set();
  for (let i = 0; i < 10; i++) {
    const c = T.current();
    seen.add(c.q);
    assert($('#qNo').textContent === `${i + 1} / 10`, '문제 번호 ' + $('#qNo').textContent);
    const pick = correct(i) ? c.a : !c.a;
    (pick ? $('#bO') : $('#bX')).click();
    assert($('#fb').classList.contains('on') && $('#fbTitle').textContent.includes('정답은 ' + (c.a ? 'O' : 'X')), '정답 후 해설 표시');
    assert($('#fb').classList.contains(correct(i) ? 'good' : 'bad'), '맞음/틀림 표시');
    assert($('#bO').disabled && $('#bX').disabled, '답한 뒤 버튼 잠김');
    (pick ? $('#bX') : $('#bO')).click(); // 두 번 눌러도 점수 그대로
    $('#next').click(); await wait(10);
  }
  assert(seen.size === 10, '한 판 10문제 서로 다름');
};
T.seed(3);
$('#start').click();
assert($('#sQuiz').classList.contains('on'), '퀴즈 화면');
await play(i => i >= 3);
assert($('#sRes').classList.contains('on'), '결과 화면');
assert($('#rScore').textContent === '7' && $('#rTitle').textContent === '안전 지킴이', '7점 지킴이: ' + $('#rTitle').textContent);
assert($('#best').textContent === '7' && JSON.parse(localStorage.getItem('edu-expo-safety-ox-v1')).best === 7, '최고 점수 7 저장');
assert($('#rNew').textContent.includes('최고'), '새 최고 점수 표시');
$('#review').click();
assert($('#wrongList').classList.contains('on') && $$('#wrongList .wq').length === 3, '틀린 문제 3개 다시 보기');
assert($('#wrongList .wq p').textContent.length > 10, '틀린 문제 해설 표시');
// 다시 하기 → 모두 정답
$('#again').click();
assert($('#sQuiz').classList.contains('on') && $('#qNo').textContent === '1 / 10' && $('#qScore').textContent === '0', '다시 하기로 처음부터');
await play(() => true);
assert($('#rScore').textContent === '10' && $('#rTitle').textContent === '안전 챔피언' && $('#rMedal').textContent === '🏆', '10점 챔피언');
assert($('#review').style.display === 'none', '틀린 문제 없으면 다시 보기 숨김');
assert($('#best').textContent === '10', '최고 10점');
// 낮은 점수는 최고 점수를 덮지 않음
$('#again').click();
await play(i => i < 3);
assert($('#rTitle').textContent === '안전 새싹' && $('#rMedal').textContent === '🌱', '3점 새싹');
assert($('#best').textContent === '10' && !$('#rNew').textContent, '최고 점수 유지');
// 새로 열어도 최고 점수 유지는 저장값으로 확인
assert(JSON.parse(localStorage.getItem('edu-expo-safety-ox-v1')).best === 10, '저장된 최고 10');
$('#snd').click();
assert($('#snd').textContent.includes('끔') && JSON.parse(localStorage.getItem('edu-expo-safety-ox-v1')).sound === false, '소리 끄기 저장');
return 'ok 24';
