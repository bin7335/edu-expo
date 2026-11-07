// 55 색깔 함정: 시작 → 글자 색 버튼 정답/오답 → 정답 수·정확도·반응시간 → 결과·스트룹 설명 → 최고 기록 → 다시 하기
const T = window.__test;
const pad = i => $(`#pads .pad[data-c="${i}"]`);
let n = 0; const ok = (c, m) => { assert(c, m); n++; };

ok($$('#pads .pad').length === 5, '색 버튼 5개');
ok(['빨강', '파랑', '초록', '노랑', '보라'].every((c, i) => pad(i).textContent.includes(c)), '버튼에 색 이름 글자 표기(색맹 배려)');
ok($('#word').textContent === '파랑' && getComputedStyle($('#word')).color === 'rgb(229, 56, 59)', '첫 화면 예시: 빨간색 "파랑"');
T.seed(11);
$('#start').click(); await wait(30);
ok(T.playing() && $('#time').textContent === '30' && $('#start').disabled, '시작하면 30초');

// 정답 12번: 글자 "색" 버튼
let incon = 0;
for (let k = 0; k < 12; k++) {
  const c = T.cur();
  if (c.word !== c.ink) incon++;
  ok($('#word').textContent === c.wordName, '글자 표시');
  await wait(15);
  pad(c.ink).click();
}
ok(incon >= 6, '대부분 뜻과 색이 다른 함정 문제: ' + incon);
let s = T.stats();
ok(s.correct === 12 && s.acc === 100 && $('#score').textContent === '12', '정답 12, 정확도 100%: ' + JSON.stringify(s));
ok($('#streak').textContent === '12', '연속 정답 12');

// 함정 문제에서 글자 "뜻" 버튼 → 오답
let guard = 0; while (T.cur().word === T.cur().ink && guard++ < 20) pad(T.cur().ink).click();
const c = T.cur(); pad(c.word).click();
ok($('#stage').classList.contains('no') && $('#fb').textContent.includes(c.inkName), '오답: 흔들림 + 정답 색 안내: ' + $('#fb').textContent);
s = T.stats();
ok(s.total === s.correct + 1 && $('#streak').textContent === '0', '오답은 정답 수에 안 들어가고 연속 0');
ok($('#acc').textContent === s.acc + '%' && s.acc < 100, '정확도 갱신: ' + s.acc);
const prevCorrect = s.correct;

// 종료 → 결과·설명·기록 저장
T.end(); await wait(50);
ok($('#result').classList.contains('on') && !T.playing(), '결과 창');
ok($('#rScore').textContent === prevCorrect + '개' && $('#rAcc').textContent === s.acc + '%', '결과 정답 수·정확도');
ok(/\d\.\d\d초/.test($('#rRt').textContent), '평균 반응시간 표시: ' + $('#rRt').textContent);
ok($('.why').innerText.includes('스트룹 효과') && $('.why h3').textContent.includes('왜 헷갈릴까'), '왜 헷갈릴까? 설명');
const saved = JSON.parse(localStorage.getItem('edu-expo-color-trick-v1'));
ok(saved.correct === prevCorrect && saved.acc === s.acc, '최고 기록 저장: ' + JSON.stringify(saved));
ok($('#rNew').classList.contains('on') && $('#best').textContent.startsWith(prevCorrect + '개'), '신기록 표시');

// 다시 하기 → 새 게임, 정답 2개만 → 기록 유지
$('#again').click(); await wait(30);
ok(T.playing() && $('#score').textContent === '0' && !$('#result').classList.contains('on'), '다시 하기로 새 게임');
pad(T.cur().ink).click(); pad(T.cur().ink).click();
// 키보드 1-5
const kc = T.cur(); document.dispatchEvent(new KeyboardEvent('keydown', { key: String(kc.ink + 1), bubbles: true }));
ok(T.stats().correct === 3, '숫자키로 답하기');
T.end(); await wait(30);
ok(!$('#rNew').classList.contains('on') && JSON.parse(localStorage.getItem('edu-expo-color-trick-v1')).correct === prevCorrect, '낮은 기록은 덮어쓰지 않음');
$('#close').click(); await wait(20);
ok(!$('#result').classList.contains('on') && !$('#start').disabled, '닫기 후 다시 시작 가능');
return 'ok ' + n;
