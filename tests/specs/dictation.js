// 13 귀쫑긋 받아쓰기: 정답 가리기/보기, 답 쓰고 Enter로 넘기기, 채점 점수·틀린 글자 표시, 띄어쓰기 옵션, 문장 편집·섞기
const SENT = ['나는 학교에 갑니다.', '하늘이 참 맑아요.', '강아지가 멍멍 짖어요.', '친구와 같이 놀았어요.', '꽃밭에 나비가 날아요.', '닭이 알을 낳았어요.', '엄마께 편지를 썼어요.', '동생이 활짝 웃어요.', '옷을 깨끗이 빨았어요.', '비가 와서 우산을 썼어요.'];
assert($('#cnt').textContent === '10문장', '예시 10문장');
// 1) 정답은 가려져 있다가 보기 누르면 보임
assert(!$('#ansTxt').textContent.includes('학교') && $('#ansTxt').textContent.includes('●'), '처음엔 가림');
$('#showBtn').click();
assert($('#ansTxt').textContent === SENT[0], '정답 보기: ' + $('#ansTxt').textContent);
$('#showBtn').click();
assert(!$('#ansTxt').textContent.includes('학교'), '다시 가림');
// 2) 답 쓰고 Enter → 다음 문제. 1번은 틀리게(학교애), 2번은 띄어쓰기 틀리게(하늘이참), 나머지는 마침표 없이 정답
const inp = $('#stuInput');
const answers = ['나는 학교애 갑니다', '하늘이참 맑아요', ...SENT.slice(2).map(s => s.replace('.', ''))];
answers.forEach((a, i) => {
  assert($('#qno').textContent.startsWith(String(i + 1)), `${i + 1}번 문제 표시: ` + $('#qno').textContent);
  inp.value = a; fire(inp, 'input');
  if (i < 9) key(inp, 'Enter');
});
assert($('#nextBtn').textContent.includes('채점'), '마지막 문제에서는 채점하기 버튼');
assert($('#doneInfo').textContent.startsWith('10 / 10'), '10문제 다 씀: ' + $('#doneInfo').textContent);
$('#nextBtn').click();
assert($('#result').classList.contains('show'), '결과 표시');
assert($('#result .big').textContent === '80점' && $('#result').textContent.includes('10문제 중 8문제'), '80점: ' + $('#result .big').textContent);
const items = $$('#result .ritem');
assert(items[0].querySelector('.mk').textContent === '❌' && items[1].querySelector('.mk').textContent === '❌' && items[2].querySelector('.mk').textContent === '⭕', '틀린 문제 표시');
assert(items[0].querySelector('.miss').textContent.includes('에'), '틀린 글자(에) 빨간 칸: ' + items[0].innerHTML);
assert(items[0].querySelector('.extra').textContent.includes('애'), '잘못 쓴 글자(애) 표시');
assert(items[1].querySelector('.sp'), '띄어쓰기 표시 ∨');
assert($('#stuInput').disabled, '채점 후 입력 잠금');
// 3) 띄어쓰기 채점 끄면 2번은 정답 → 90점
$('#optSpace').click();
assert($('#result .big').textContent === '90점', '띄어쓰기 무시 → 90점: ' + $('#result .big').textContent);
$('#optSpace').click();
// 4) 다시 풀기 → 답 비움
$('#retryBtn').click();
assert(!$('#result').classList.contains('show') && $('#stuInput').value === '' && !$('#stuInput').disabled, '다시 풀기');
// 5) 문장 편집(번호 형식 제거) → 3문장
const ta = $('#sentences');
ta.value = '1) 사과가 빨개요.\n\n2번: 바다가 넓어요.\n3. 별이 반짝여요.'; fire(ta, 'input');
await wait(700);
assert($('#cnt').textContent === '3문장', '편집 → 3문장: ' + $('#cnt').textContent);
$('#showBtn').click();
assert($('#ansTxt').textContent === '사과가 빨개요.', '번호 떼고 문장만: ' + $('#ansTxt').textContent);
assert(JSON.parse(localStorage.getItem('dictation-v1')).text.includes('바다가'), '문장 저장');
// 6) 섞기 → 원래 번호 표시, 3문장이 모두 한 번씩
$('#optRandom').click();
assert(!$('#orig').hidden && /원래 [123]번/.test($('#orig').textContent), '섞으면 원래 번호 표시');
const seen = [];
for (let i = 0; i < 3; i++) { $$('#dots button')[i].click(); $('#showBtn').click(); seen.push($('#ansTxt').textContent); }
assert(new Set(seen).size === 3, '섞어도 3문장 모두: ' + seen);
return 'ok';
