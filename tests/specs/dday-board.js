// 36 교무실 알림판: 편집 → 저장하면 D-day 계산·정렬·지난 행사 숨김, 마감 공문 배지, 당번·회의 정렬, 급식 직접 입력, 공지 띠, 테마
// (예시 값에 기대지 않고 오늘 기준 날짜를 직접 넣어 검증)
const B = window.__board;
assert(B, '__board 가 있어야 함');
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const plus = n => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return ymd(d); };
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const md = n => { const d = new Date(); d.setDate(d.getDate() + n); return (d.getMonth() + 1) + '/' + d.getDate() + '(' + WD[d.getDay()] + ')'; };
$('#editBtn').click();
assert($('#editor').classList.contains('on'), '편집 창 열림');
$('#eSchool').value = '테스트학교';
// 행사: 기존 행 모두 지우고 6개 넣기(어제·오늘·+3·+10·+20·+30)
$$('#eEvents .ev .x').forEach(x => x.click());
assert($$('#eEvents .ev').length === 0, '행사 행 삭제');
const evs = [['어제 행사', -1], ['한 달 뒤', 30], ['오늘 행사', 0], ['열흘 뒤', 10], ['사흘 뒤', 3], ['스무날 뒤', 20], ['', 1]];
for (const [name, n] of evs) { $('#addEv').click(); const r = $$('#eEvents .ev').pop().querySelectorAll('input'); r[1].value = name; r[2].value = plus(n); }
// 공문: 어제·오늘·+2·+5
$$('#eDue .dl .x').forEach(x => x.click());
for (const [t, n] of [['지난 공문', -1], ['닷새 뒤 공문', 5], ['오늘 공문', 0], ['모레 공문', 2]]) { $('#addDue').click(); const r = $$('#eDue .dl').pop().querySelectorAll('input'); r[0].value = t; r[1].value = plus(n); }
$('#eDuty').value = '교무실 당번 · 가선생\n\n급식 지도';
$('#eMeet').value = '15:00 | 오후 회의\n08:40 | 아침 회의\n시각 없는 회의';
$$('[data-meal]').forEach((m, i) => { m.value = '테스트급식' + i; });
$('#eQuote').value = '한 마디 하나';
$('#eNotice').value = '공지 A\n공지 B';
$('#edSave').click();
assert(!$('#editor').classList.contains('on'), '저장하면 편집 창 닫힘');
// 1) D-day: 지난 행사·이름 없는 행사 숨김, 가까운 순, 최대 5개
const dd = $$('#ddays .dd:not(.empty)');
assert(dd.map(d => d.querySelector('.nm').textContent).join('|') === '오늘 행사|사흘 뒤|열흘 뒤|스무날 뒤|한 달 뒤', 'D-day 순서: ' + dd.map(d => d.querySelector('.nm').textContent).join('|'));
assert(dd[0].querySelector('.d').textContent === 'D-DAY' && dd[0].classList.contains('today') && dd[1].querySelector('.d').textContent === 'D-3' && dd[4].querySelector('.d').textContent === 'D-30', 'D-day 숫자');
assert(dd[1].querySelector('.dt').textContent === md(3), '날짜 표시(월/일(요일)): ' + dd[1].querySelector('.dt').textContent);
// 2) 마감 공문: 지난 것 숨김, 가까운 순, 배지
const due = $$('#due li');
assert(due.map(l => l.querySelector('.tx').textContent).join('|') === '오늘 공문|모레 공문|닷새 뒤 공문', '공문 순서: ' + due.map(l => l.textContent).join('|'));
assert(due[0].querySelector('.badge.hot').textContent === '오늘 마감' && due[1].querySelector('.badge.soon').textContent === 'D-2' && due[2].querySelector('.badge').textContent === md(5), '공문 배지');
assert($('#dueCnt').textContent === '1건 오늘 마감', '오늘 마감 개수');
// 3) 당번(· 앞을 머리로), 회의(시각 순)
const duty = $$('#duty li');
assert(duty.length === 2 && duty[0].querySelector('.tm').textContent === '교무실 당번' && duty[0].querySelector('.tx').textContent === '가선생' && $('#dutyCnt').textContent === '2건', '당번');
const meet = $$('#meet li .tm').map(x => x.textContent);
assert(meet.join('|') === '—|08:40|15:00' && $('#meetCnt').textContent === '3건', '회의 정렬: ' + meet.join('|'));
// 4) 급식 직접 입력 → 자동 갱신 꺼짐, 5일 모두 표시
assert(B.state().mealAuto === false && $$('#meal .dy').filter(d => /테스트급식/.test(d.textContent)).length === 5, '급식 직접 입력');
// 5) 한 마디·공지 띠(끊김 없이 두 번)·학교 이름·출처 숨김
assert($('#quote').textContent === '한 마디 하나' && $('#school').textContent === '테스트학교', '한 마디·학교');
assert($$('#track span').map(s => s.textContent).join('|') === '공지 A|공지 B|공지 A|공지 B', '공지 띠');
assert($('#src').style.display === 'none', '다른 학교면 출처 줄 숨김');
// 6) 저장·다시 그리기
const st = JSON.parse(localStorage.getItem('dday-board-v1'));
assert(st.school === '테스트학교' && st.events.length === 6 && st.due.length === 4, '저장(이름 없는 행사 제외): ' + st.events.length);
// 7) 테마 전환
const light = document.body.classList.contains('light');
$('#themeBtn').click();
assert(document.body.classList.contains('light') !== light && JSON.parse(localStorage.getItem('dday-board-v1')).theme === (light ? 'dark' : 'light'), '테마 전환');
// 8) 편집 취소·Esc는 반영 안 함
$('#editBtn').click(); $('#eSchool').value = '바뀌면 안 됨'; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
assert(!$('#editor').classList.contains('on') && $('#school').textContent === '테스트학교', 'Esc 취소');
// 9) 급식을 실제 자료 그대로 두면 자동 갱신 유지
$('#editBtn').click(); $('#edReset').click();
$('#edSave').click();
assert(B.state().mealAuto === true, '예시(실제) 급식 그대로면 자동 갱신');
return 'ok 9';
