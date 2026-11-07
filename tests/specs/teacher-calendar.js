// 21 한해살이(콘셉트): 12달 타임라인(3월-2월), 이번 달 표시, 달 선택 → 할 일 패널, 체크 → 완료 수·막대, 알림 토글, 저장
const st = () => JSON.parse(localStorage.getItem('hanhaesari-v1'));
const months = () => $$('#tl .m');
const mon = m => $(`#tl .m[data-m="${m}"]`);
const now = new Date().getMonth() + 1;
assert(months().map(b => Number(b.dataset.m)).join() === '3,4,5,6,7,8,9,10,11,12,1,2', '학년도 순서 3월-2월');
assert(mon(now).classList.contains('now') && mon(now).classList.contains('on') && $$('#tl .m.now').length === 1, '이번 달 표시·선택');
// 3월: 예시 4/4 완료, 막대 100%
mon(3).click();
assert(mon(3).classList.contains('on') && $$('#tl .m.on').length === 1, '3월 선택');
assert($('#panel h3').textContent === '3월' && $('#panel .theme').textContent === '학급 세우기', '3월 패널');
assert($('#panel .pct').textContent === '4/4 완료' && mon(3).querySelector('.bar i').style.width === '100%', '3월 4/4, 100%');
// 11월: 1/4 → 두 개 더 체크 → 3/4, 막대 75%
mon(11).click();
const tasks = () => $$('#panel .task input[type=checkbox]');
assert(tasks().length === 4 && $('#panel .pct').textContent === '1/4 완료', '11월 1/4');
tasks()[0].click(); tasks()[2].click();
assert($('#panel .pct').textContent === '3/4 완료' && mon(11).querySelector('.bar i').style.width === '75%', '체크 → 3/4, 75%');
assert(st().done['11'].sort().join() === '0,1,2', '완료 저장');
tasks()[1].click();
assert($('#panel .pct').textContent === '2/4 완료', '해제 → 2/4');
// 라벨을 눌러도 체크
$$('#panel .task label')[3].click();
assert(tasks()[3].checked && $('#panel .pct').textContent === '3/4 완료', '라벨 클릭으로 체크');
// 알림 토글: 11월 예시 0·2번 켜짐
const bells = () => $$('#panel .bell');
assert(bells()[0].classList.contains('on') && !bells()[1].classList.contains('on'), '예시 알림 상태');
bells()[1].click();
assert(bells()[1].classList.contains('on') && bells()[1].textContent.includes('D-14'), '알림 켜기');
bells()[0].click();
assert(!bells()[0].classList.contains('on') && bells()[0].textContent.includes('끔'), '알림 끄기');
assert(st().bell['11'].join() === '2,1', '알림 저장: ' + st().bell['11']);
// 빈 달(2월)은 0%
mon(2).click();
assert($('#panel .pct').textContent === '0/3 완료' && mon(2).querySelector('.bar i').style.width === '0%', '2월 0/3');
// 달을 오가도 체크 유지
mon(11).click();
assert(tasks().filter(t => t.checked).length === 3, '11월 체크 유지');
return 'ok';
