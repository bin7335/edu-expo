// 18 마주봄(콘셉트): 달력 25칸(가능 11·예약됨 6·미개설 8), 예약된 칸은 못 고름, 고르면 확인 카드, 상담 방식 반영, 예약 완료
const slots = () => $$('#cal .slot');
const open = () => slots().filter(s => !s.disabled);
assert(slots().length === 25, '5요일×5시간 = 25칸');
assert(open().length === 11 && $$('#cal .slot.taken').length === 6 && $$('#cal .slot.off').length === 8, `가능 11·예약됨 6·미개설 8: ${open().length}`);
assert($$('#cal .slot.taken').every(s => s.disabled && s.textContent === '예약됨'), '예약된 칸은 비활성');
assert($('#side').textContent.includes('눌러 보세요'), '처음엔 안내');
// 예약된 칸을 눌러도 아무 일 없음
$('#cal .slot.taken').dispatchEvent(new MouseEvent('click', { bubbles: true }));
assert(!$('#cal .slot.sel'), '예약된 칸은 선택 안 됨');
// 수요일 14:30 고르기(MAP[시간][요일])
const slot = (t, d) => $(`#cal .slot[data-t="${t}"][data-d="${d}"]`);
slot(0, 2).click();
assert(slot(0, 2).classList.contains('sel') && slot(0, 2).textContent === '선택됨', '선택 표시');
assert($$('#cal .slot.sel').length === 1, '선택은 하나');
assert($('#side .big').textContent.includes('11/18(수)') && $('#side .big').textContent.includes('14:30'), '확인 카드 날짜·시간: ' + $('#side .big').textContent);
assert($('#side').textContent.includes('대면 상담'), '기본 대면');
// 상담 방식 바꾸기
$$('#seg button')[1].click();
assert($$('#seg button')[1].classList.contains('on') && $('#side').textContent.includes('전화 상담'), '전화 상담 반영');
$$('#seg button')[2].click();
assert($('#side').textContent.includes('화상 상담'), '화상 상담 반영');
// 예약 완료
$('#ok').click();
assert($('#side .done') && !$('#ok'), '예약 완료 표시');
// 다른 칸을 고르면 다시 예약 버튼
slot(1, 4).click();
assert($('#ok') && $('#side .big').textContent.includes('11/20(금)') && $('#side .big').textContent.includes('15:10'), '다른 칸 선택 시 새 확인 카드');
assert(!slot(0, 2).classList.contains('sel'), '이전 선택 해제');
return 'ok';
