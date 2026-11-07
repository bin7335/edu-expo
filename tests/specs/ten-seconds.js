// 61 딱 10초: 시작 → 3초 뒤 숫자 숨김 → 스페이스/탭/버튼으로 멈춤 → 실제 시간·오차·등급 → 3번 평균 → 최고 기록 저장 → 다시 하기, 목표 5초
const T = window.__test;
const space = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
const runTo = ms => T.skip(ms - T.elapsed());
assert(text().includes('딱 10초') && $('#clock').textContent === '10.00' && $$('#slots .slot').length === 3, '첫 화면: 이름·10.00·3칸');
assert($('#tg button.on').dataset.t === '10', '기본 목표 10초');
// 1번째: 버튼으로 시작, 3초 뒤 숨김, 스페이스로 10.00초에 멈춤
$('#act').click(); await wait(50);
assert(T.state().state === 'run' && !$('#dial').classList.contains('hidden'), '시작하면 숫자 보임');
assert($$('#tg button').every(b => b.disabled), '진행 중 목표 변경 잠금');
T.skip(3100); await wait(60);
assert($('#dial').classList.contains('hidden') && $('#clock').classList.contains('gone'), '3초 뒤 숫자 사라짐');
runTo(10000); space(); await wait(30);
let s = T.state();
assert(s.state === 'shown' && Math.abs(s.res[0] - 10) < 0.02, '스페이스로 멈춤 ≈10초: ' + s.res[0]);
assert(/^10\.0[0-2]$/.test($('#clock').textContent) && $('#verdict').innerText.includes('인간 시계'), '실제 시간 공개 + 인간 시계: ' + $('#clock').textContent);
assert($('#slots .slot.done b').textContent === $('#clock').textContent, '1번째 칸 기록');
// 멈춤 직후 같은 동작은 무시(실수로 바로 다음 판 시작 방지)
space(); await wait(10);
assert(T.state().state === 'shown', '멈춘 직후 스페이스는 무시');
// 2번째: 8초에 시계 탭 → 너무 빨랐어요
T.unlock(); $('#act').click(); await wait(20);
runTo(8000); $('#dial').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(20);
assert(Math.abs(T.state().res[1] - 8) < 0.03 && $('#verdict').innerText.includes('빨랐어요'), '8초 → 빨랐어요: ' + $('#verdict').innerText);
// 3번째: 10.5초에 버튼 → 늦었어요
T.unlock(); $('#act').click(); await wait(20);
runTo(10500); $('#act').click(); await wait(20);
s = T.state();
assert(s.state === 'done' && $('#verdict').innerText.includes('늦었어요'), '10.5초 → 늦었어요');
assert($('#sum').classList.contains('on'), '3번 끝나면 평균 결과');
const avg = (Math.abs(s.res[0] - 10) + Math.abs(s.res[1] - 10) + Math.abs(s.res[2] - 10)) / 3;
assert($('#avg').textContent === '±' + avg.toFixed(2) + '초', '평균 오차 ' + $('#avg').textContent + ' = ' + avg.toFixed(2));
let saved = JSON.parse(localStorage.getItem('edu-expo-ten-seconds-v1'));
assert(saved['10'] < 0.02, '10초 최고 기록(가장 작은 오차) 저장: ' + JSON.stringify(saved));
assert($('#bestPill').textContent.includes('±0.0'), '상단 최고 기록 표시: ' + $('#bestPill').textContent);
// 다시 하기 → 새 판이 바로 시작
T.unlock(); $('#act').textContent.includes('다시') && $('#act').click(); await wait(20);
assert(T.state().state === 'run' && T.state().tries === 0, '다시 하기 → 새 3번 도전');
runTo(11000); T.stop(); await wait(10);
assert(JSON.parse(localStorage.getItem('edu-expo-ten-seconds-v1'))['10'] === saved['10'], '더 큰 오차는 최고 기록 유지');
// 목표 5초
$('#tg button[data-t="5"]').click(); await wait(20);
assert(T.state().target === 5 && $('#clock').textContent === '5.00' && T.state().tries === 0, '목표 5초로 바꾸면 새 판');
T.unlock(); $('#act').click(); runTo(5100); space(); await wait(20);
saved = JSON.parse(localStorage.getItem('edu-expo-ten-seconds-v1'));
assert(Math.abs(saved['5'] - 0.1) < 0.02 && saved['10'] < 0.02, '목표별 기록 따로 저장: ' + JSON.stringify(saved));
return 'ok 21';
