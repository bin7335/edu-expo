// 32 체험학습 서식: 수업일수(주말·공휴일·재량휴업일 제외) 정답값, 학년도 누적·허용 초과, 누적표 저장/수정/삭제, 서식 반영
// (샘플 값에 기대지 않고 직접 넣은 학생으로 검증)
const set = (id, v) => { $('#' + id).value = v; };
const apply = () => $('#form').dispatchEvent(new Event('input', { bubbles: true }));
const days = (a, b) => { set('start', a); set('end', b); apply(); return +$('#calc .big').firstChild.textContent; };
set('grade', '5'); set('cls', '3'); set('no', '9'); set('name', '테스트학생'); set('place', '테스트 장소'); set('type', '진로 탐색'); set('guardian', '테보호'); set('teacher', '테담임');
set('limit', '20'); fire($('#limit'), 'input'); set('extra', ''); fire($('#extra'), 'input');
// 1) 수업일수 정답값
assert(days('2026-11-23', '2026-11-27') === 5, '평일 5일');
assert(days('2026-11-28', '2026-11-29') === 0, '주말만 0일');
assert(days('2026-09-21', '2026-10-09') === 11, '추석·개천절 대체·한글날 제외 11일: ' + $('#calc .det').textContent);
assert(/주말 4일/.test($('#calc .det').textContent) && /공휴일 4일/.test($('#calc .det').textContent), '제외 내역(주말 4·공휴일 4): ' + $('#calc .det').textContent);
assert(days('2026-05-01', '2026-05-08') === 4, '노동절·어린이날 제외 4일');
assert(days('2026-06-01', '2026-06-05') === 4, '지방선거일 제외 4일');
assert(days('2027-02-08', '2027-02-12') === 3, '설 연휴·대체공휴일 제외 3일');
assert(days('2026-11-27', '2026-11-23') === 0 && /기간을 입력/.test($('#calc .det').textContent), '끝이 시작보다 앞이면 0일');
// 재량휴업일 추가
set('extra', '2026-11-25\n잘못된줄'); fire($('#extra'), 'input');
assert(days('2026-11-23', '2026-11-27') === 4 && /재량휴업일/.test($('#calc .det').textContent), '재량휴업일 제외 4일');
set('extra', ''); fire($('#extra'), 'input');
assert(+$('#calc .big').firstChild.textContent === 5, '재량휴업일 지우면 5일');
// 2) 누적표 저장 → 같은 기간 다시 저장하면 고침(중복 안 생김)
const myRows = () => $$('#ledger tr.stu').filter(r => r.textContent.includes('테스트학생'));
$('#addBtn').click();
assert(myRows().length === 1 && /1건/.test(myRows()[0].textContent) && /5일/.test(myRows()[0].textContent), '누적표 저장: ' + (myRows()[0] || {}).textContent);
set('place', '바뀐 장소'); apply(); $('#addBtn').click();
assert(/1건/.test(myRows()[0].textContent) && $('#ledger').textContent.includes('바뀐 장소') && /기록을 고쳤어요/.test($('#toast').textContent), '같은 기간은 고침');
// 3) 같은 학년도(3월-이듬해 2월) 누적: 2027-02 신청은 앞의 5일 + 3일 = 8일
days('2027-02-08', '2027-02-12');
assert(/이미 사용 5일 \+ 이번 3일 = 8일/.test($('#calc .lbl').textContent), '학년도 누적: ' + $('#calc .lbl').textContent);
assert($('#calc .alert').classList.contains('ok') && /남은 일수 12일/.test($('#calc .alert').textContent), '남은 12일');
// 새 학년도(2027-03)는 0부터
days('2027-03-03', '2027-03-05');
assert(/이미 사용 0일/.test($('#calc .lbl').textContent), '새 학년도는 0부터: ' + $('#calc .lbl').textContent);
// 다른 학생(번호만 다름)은 따로
set('no', '10'); days('2027-02-08', '2027-02-12');
assert(/이미 사용 0일/.test($('#calc .lbl').textContent), '다른 번호는 다른 학생');
set('no', '9'); apply();
// 4) 허용 일수 경고: 허용 9 → 8일은 80% 이상(주의), 허용 6 → 2일 초과
days('2027-02-08', '2027-02-12');
set('limit', '9'); fire($('#limit'), 'input');
assert($('#calc .alert').classList.contains('mid') && /남은 일수 1일/.test($('#calc .alert').textContent), '허용 근접 경고: ' + $('#calc .alert').textContent);
set('limit', '6'); fire($('#limit'), 'input');
assert($('#calc .alert').classList.contains('bad') && /6일을 2일 넘어요/.test($('#calc .alert').textContent), '허용 초과: ' + $('#calc .alert').textContent);
$('#addBtn').click();
assert(/2건/.test(myRows()[0].textContent) && /8일/.test(myRows()[0].textContent) && /초과 2일/.test(myRows()[0].textContent), '누적표 초과 표시: ' + myRows()[0].textContent);
// 5) 서식 반영: 학생·기간·수업일수·체험 형태 체크·연간 사용
const sh = i => $$('#zoomer .sheet')[i].textContent.replace(/\s+/g, ' ');
assert(sh(0).includes('5학년 3반 9번 테스트학생') && sh(0).includes('2027. 2. 8.(월) - 2027. 2. 12.(금) (수업일수 3일)'), '신청서 학생·기간: ' + sh(0).slice(0, 160));
assert(sh(0).includes('✔진로 탐색') && !sh(0).includes('✔가족 동반 여행'), '체험 형태 체크');
assert(sh(0).includes('올해 이미 5일 + 이번 3일 = 8일 (허용 6일)'), '연간 사용 줄');
assert(sh(1).includes('테담임') && sh(1).includes('진로 탐색') && sh(2).includes('테보호'), '승인 통지서·결과 보고서');
// 6) 누적표 탭: 서식 숨기고 누적표 보이기, 기록 삭제
$$('#tabs .tab')[3].click();
assert($('#viewer').style.display === 'none' && $('#ledger').classList.contains('on'), '누적표 탭');
const delBtns = () => $$('#ledger tr').filter(r => !r.classList.contains('stu') && r.textContent.includes('바뀐 장소')).map(r => r.querySelector('[data-del]'));
delBtns()[0].click(); await wait(50);
assert(/1건/.test(myRows()[0].textContent) && /3일/.test(myRows()[0].textContent), '기록 1건 삭제 후 3일');
$$('#tabs .tab')[0].click();
assert($('#viewer').style.display === '' && !$('#ledger').classList.contains('on'), '서식 탭 복귀');
// 7) 저장(localStorage)
await wait(400);
const st = JSON.parse(localStorage.getItem('edu-expo.fieldtrip-form.v1') || 'null');
assert(st && st.limit === 6 && st.ledger.filter(r => r.name === '테스트학생').length === 1 && st.form.name === '테스트학생', '저장: ' + JSON.stringify(st && { l: st.limit }));
return 'ok 7';
