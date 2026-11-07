// 60 분리배출 챔피언: 시작 → 정답(탭)·오답(팁 표시)·끌어다 놓기 → 15개 끝 → 결과·등급·최고 기록 저장 → 다시 하기 → 시간 초과
const T = window.__test;
assert(T && T.pool >= 20, '쓰레기 20종 이상: ' + (T && T.pool));
assert($$('.bin[data-bin]').length === 9 && !$('#cover').classList.contains('hide'), '첫 화면: 통 9개 + 시작 안내');
assert(text().includes('분리배출 챔피언'), '첫 화면에 게임 이름');
T.setSeed(7); T.setDelay(0);
$('#start').click(); await wait(30);
assert(T.state().on && $('#cover').classList.contains('hide'), '시작하면 게임 진행');
// 1번: 정답(탭)
let c = T.current();
assert(c && $('#item .n').textContent === c.name, '보이는 쓰레기 = 현재 문제: ' + c.name);
$(`.bin[data-bin="${c.bin}"]`).click(); await wait(30);
assert(T.state().ok === 1 && $('#score').textContent === '10', '정답 → 10점');
// 2번: 오답 → 올바른 통 이름과 팁
c = T.current();
const wrongBin = T.bins.find(b => b !== c.bin);
T.setDelay(5000);
$(`.bin[data-bin="${wrongBin}"]`).click(); await wait(30);
assert($('#fb').classList.contains('no') && $('#fb').innerText.includes(c.name) && $(`.bin[data-bin="${c.bin}"]`).classList.contains('ans'), '오답 → 정답 통 강조·팁: ' + $('#fb').innerText);
assert(T.state().lock, '팁 보는 동안 잠금');
$('#skip').click(); await wait(30);
assert(T.state().i === 2 && !T.state().lock, '다음 ▶으로 넘어감');
T.setDelay(0);
// 3번: 끌어다 놓기
c = T.current();
const ir = $('#item').getBoundingClientRect(), br = $(`.bin[data-bin="${c.bin}"]`).getBoundingClientRect();
const pe = (t, x, y) => $('#item').dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, pointerId: 1, bubbles: true }));
pe('pointerdown', ir.left + 20, ir.top + 20); pe('pointermove', ir.left + 60, ir.top + 60);
pe('pointermove', br.left + br.width / 2, br.top + br.height / 2); pe('pointerup', br.left + br.width / 2, br.top + br.height / 2);
await wait(30);
assert(T.state().ok === 2, '끌어다 놓기 정답');
// 나머지 모두 정답
for (let k = 0; k < 20 && T.state().on; k++) { $(`.bin[data-bin="${T.current().bin}"]`).click(); await wait(20); }
assert($('#modal').classList.contains('on'), '15개 끝나면 결과');
assert($('#rAcc').textContent === '93%' && $('#mbox').innerText.includes('지구 수호 챔피언'), '14/15 → 93% 지구 수호 챔피언: ' + $('#rAcc').textContent);
assert($('#mbox .rev') && $('#mbox .rev').innerText.includes('→'), '틀린 것 복습 목록');
const saved = JSON.parse(localStorage.getItem('edu-expo-recycle-sort-v1'));
assert(saved.score === +$('#rScore').textContent && saved.score > 140, '최고 기록 저장: ' + JSON.stringify(saved));
assert($('#bestPill').textContent.includes(saved.score), '상단 최고 점수 표시');
// 다시 하기 → 시간 초과
$('#again').click(); await wait(30);
assert(T.state().on && T.state().i === 0 && $('#score').textContent === '0', '다시 하기 → 새 판');
$(`.bin[data-bin="${T.current().bin}"]`).click(); await wait(30);
T.skip(61000); await wait(30);
assert($('#modal').classList.contains('on') && $('#rScore').textContent === '10', '60초 지나면 끝: ' + $('#rScore').textContent);
assert(JSON.parse(localStorage.getItem('edu-expo-recycle-sort-v1')).score === saved.score, '낮은 점수는 최고 기록 덮지 않음');
return 'ok 17';
