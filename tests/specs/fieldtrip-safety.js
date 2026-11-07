// 19 든든길(콘셉트): 점검표 체크 → 진행률(%·원), 탭 전환, 인원 카운터(+/−/전원/한계), 점검 시점 바꾸면 0명, 초기화, 저장
const st = () => JSON.parse(localStorage.getItem('deundeungil-v1'));
const boxes = () => $$('#list input[type=checkbox]');
const tab = k => $(`#tabs [data-k="${k}"]`).click();
// 1) 사전 점검: 예시 3/7 → 체크할수록 퍼센트 증가, 다 하면 100% 완료
tab('pre');
assert(boxes().length === 7 && boxes().filter(b => b.checked).length === 3, '사전 7개 중 3개 체크');
assert($('#pc').textContent === Math.round(3 / 7 * 100) + '%' && $('#pl').textContent.includes('3/7'), '진행률 43%: ' + $('#pc').textContent);
while (boxes().some(b => !b.checked)) boxes().find(b => !b.checked).click(); // 체크마다 목록을 다시 그리므로 매번 다시 찾는다
assert($('#pc').textContent === '100%' && $('#pl').textContent.includes('완료'), '모두 체크 → 100% 완료');
assert(Math.abs(parseFloat($('#fg').style.strokeDashoffset)) < 0.01, '원 그래프 가득');
boxes()[0].click();
assert($('#pc').textContent === '86%' && st().pre.length === 6, '하나 해제 → 86%, 저장');
// 2) 탭 전환: 당일 6개·0%, 사후 5개
tab('day');
assert($('#tabs [data-k="day"]').classList.contains('on') && boxes().length === 6 && $('#pc').textContent === '0%', '당일 탭 0%');
boxes()[1].click(); boxes()[2].click();
assert($('#pc').textContent === '33%', '당일 2/6 = 33%');
tab('post'); assert(boxes().length === 5, '사후 5개');
tab('day'); assert(boxes()[1].checked && boxes()[2].checked && !boxes()[0].checked, '탭을 오가도 체크 유지');
assert(st().tab === 'day', '보던 탭 저장');
// 3) 인원 카운터: 21명에서 시작, 24 넘지 않음, 전원이면 확인 완료
assert($('#n').textContent === '21' && $('#st').textContent === '미확인 3명', '21명, 미확인 3명');
$('#plus').click(); $('#plus').click();
assert($('#n').textContent === '23' && $('#st').textContent === '미확인 1명', '+2 → 23');
$('#plus').click(); $('#plus').click();
assert($('#n').textContent === '24' && $('#st').classList.contains('ok') && $('#st').textContent.includes('전원 확인'), '24 넘지 않고 전원 확인');
// 4) 점검 시점 바꾸면 0명부터, 0 아래로 안 내려감
const cp = $('#cp'); cp.selectedIndex = 2; fire(cp, 'change');
assert($('#n').textContent === '0' && $('#st').textContent === '미확인 24명', '시점 변경 → 0명');
$('#minus').click(); assert($('#n').textContent === '0', '0 아래로 안 내려감');
$('#all').click(); assert($('#n').textContent === '24' && st().n === 24, '전원 → 24, 저장');
// 5) 초기화
$('#reset').click();
assert($('#pc').textContent === '0%' && $('#n').textContent === '0' && st().pre.length === 0 && st().day.length === 0, '초기화');
return 'ok';
