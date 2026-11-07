// 58 풍선 계산 팡팡: 시작 → 정답(+10)·오답(−5, 흔들림) → 3연속 보너스 → 놓침 → 일시정지 → 시간 종료·최고 기록 → 단계 바꾸기 → 다시 하기
const live = () => $$('#bals button.bal');
const right = () => live().find(b => +b.dataset.v === __test.answer());
assert(text().includes('풍선 계산 팡팡'), '제목 보임');
assert($$('#bals .bal.demo').length === 5 && $('#q').textContent === '7 + 5', '첫 화면 미리보기 풍선·문제');
assert($('#ready').classList.contains('on'), '준비 카드');
__test.seed(7);
$('#start').click(); await wait(80);
assert(__test.state === 'play' && !$('#ov').classList.contains('on'), '게임 시작');
assert($$('.stg').every(b => b.disabled), '게임 중 단계 버튼 잠김');
let bs = live();
assert(bs.length >= 4 && bs.length <= 6, '풍선 4-6개: ' + bs.length);
const [a, b] = $('#q').textContent.split(' + ').map(Number);
assert(a + b === __test.answer(), '덧셈 정답 계산: ' + $('#q').textContent);
assert(bs.filter(x => +x.dataset.v === __test.answer()).length === 1, '정답 풍선은 하나');
assert(new Set(bs.map(x => x.dataset.v)).size === bs.length, '풍선 숫자 중복 없음');
right().click(); await wait(50);
assert($('#score').textContent === '10', '정답 +10: ' + $('#score').textContent);
assert($$('#bals .bal.pop').length === 1, '팡 애니메이션');
await wait(450);
assert(live().length >= 4 && $$('#bals .bal.pop').length === 0, '다음 문제 풍선');
live().find(x => +x.dataset.v !== __test.answer()).click(); await wait(30);
assert($('#score').textContent === '5', '오답 −5: ' + $('#score').textContent);
assert($('#field').classList.contains('shake') && $$('#bals .bal.bad').length === 1, '오답 흔들림');
for (let i = 0; i < 3; i++) { right().click(); await wait(450); }
assert($('#score').textContent === '40', '3연속 보너스(10+10+15): ' + $('#score').textContent);
assert($('#combo').classList.contains('on') && $('#combo').textContent.includes('3연속'), '연속 표시');
// 정답 풍선을 놓치면 다음 문제
const t0 = __test.time;
__test.step(12000);
assert($('#toast').textContent.includes('놓쳤어요') && !$('#combo').classList.contains('on'), '놓침 안내·연속 초기화');
assert(__test.time < t0 - 11, '시간 흐름');
await wait(750);
assert(live().length >= 4 && !live().some(x => x.classList.contains('away')), '놓친 뒤 다음 문제');
// 일시정지
$('#pauseBtn').click();
assert(__test.state === 'paused' && $('#paused').classList.contains('on'), '일시정지 카드');
const tp = __test.time; __test.step(2000);
assert(__test.time === tp, '멈춘 동안 시간 정지');
$('#resume').click(); assert(__test.state === 'play', '계속하기');
// 시간 종료
__test.step(70000); await wait(50);
assert(__test.state === 'result' && $('#result').classList.contains('on'), '시간 종료 → 결과');
assert($('#rScore').textContent === '40점' && $('#rStat').textContent.includes('맞힘 4') && $('#rStat').textContent.includes('틀림 1'), '결과 점수·통계: ' + $('#rStat').textContent);
assert(!$('#newrec').hidden && $('#best').textContent === '40', '새 최고 기록 표시');
assert(JSON.parse(localStorage.getItem('edu-expo-balloon-math-v1')).add === 40, '최고 기록 저장');
// 뺄셈 단계
$('.stg[data-s="sub"]').click(); await wait(30);
assert($('#ready').classList.contains('on') && $('#best').textContent === '0', '뺄셈 준비, 단계별 기록');
$('#start').click(); await wait(30);
const [c, d] = $('#q').textContent.split(' − ').map(Number);
assert(c - d === __test.answer() && __test.answer() > 0, '뺄셈 문제: ' + $('#q').textContent);
__test.end();
assert($('#newrec').hidden && $('#rScore').textContent === '0점', '0점은 기록 아님');
// 곱셈구구
$('.stg[data-s="mul"]').click(); $('#start').click(); await wait(30);
const [e, f] = $('#q').textContent.split(' × ').map(Number);
assert(e * f === __test.answer() && e >= 2 && e <= 9 && f <= 9, '곱셈구구 문제: ' + $('#q').textContent);
right().click(); await wait(30); __test.end();
assert($('#best').textContent === '10', '곱셈 기록 10');
// 다시 하기
$('#again').click(); await wait(30);
assert(__test.state === 'play' && $('#score').textContent === '0' && live().length >= 4, '다시 하기 → 새 게임');
__test.end();
// 소리 끄기 저장
$('#snd').click();
assert($('#snd').getAttribute('aria-pressed') === 'false' && JSON.parse(localStorage.getItem('edu-expo-balloon-math-v1')).sound === false, '소리 끄기 저장');
return 'ok 36';
