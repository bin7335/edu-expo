// 90 회의록 뚝딱: 메모 → 일시·장소·참석자, 안건별 논의/결정/할 일(담당·기한), 상대 날짜(이번 주·다음 주 금요일), 다음 회의, 직접 고치기, 복사·인쇄, 저장
const M = window.__mm;
assert(M, '__mm 이 있어야 함');
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const memo = $('#memo');
const put = async v => { memo.value = v; fire(memo, 'input'); await wait(400); };

ok(text().includes('회의록 뚝딱') && memo.value.length > 50 && $$('#sheet .agenda').length === 3, '첫 화면: 예시 메모 → 안건 3개 회의록');
// 1) 해석 결과(정답값)
const r = M.parse(memo.value);
ok(r.meta.date === '2026-11-10' && r.meta.time === '15:30' && r.meta.place === '3층 회의실', '일시·장소: ' + JSON.stringify(r.meta));
ok(r.meta.people.join(',') === '김민지,박현수,이수진,최영호', '참석자: ' + r.meta.people.join(','));
ok(r.agendas.map(a => a.title).join('|') === '학예회 준비|겨울방학 방과후|교실 안전 점검', '안건 제목: ' + r.agendas.map(a => a.title).join('|'));
const [a1, a2, a3] = r.agendas;
ok(a1.decisions.join('|') === '날짜는 12월 5일 금요일로 확정|무대 배경은 6학년이 만들기로 함', '안건1 결정: ' + a1.decisions.join('|'));
ok(a1.notes.join('|') === '학년별 공연 시간 10분 이내', '안건1 논의: ' + a1.notes.join('|'));
const td = t => t.task + '/' + t.who + '/' + t.due;
ok(a1.todos.map(td).join('|') === '리허설 일정 정리/박현수/2026-11-27', '안건1 할 일(– 이름 선생님 11/27까지): ' + a1.todos.map(td).join('|'));
ok(a2.notes.join('|') === '신청 인원이 작년보다 적음|강사 계약은 다음 회의에서 다시 논의' && a2.decisions.length === 0, '안건2 논의: ' + a2.notes.join('|'));
ok(a2.todos.map(td).join('|') === '가정통신문 발송/이수진/2026-11-20', '안건2 할 일(→ 이름 다음 주 금요일까지 = 11/20): ' + a2.todos.map(td).join('|'));
ok(a3.decisions.join('|') === '매월 첫째 주 월요일 점검' && a3.todos.map(td).join('|') === '점검표 양식 만들기/최영호/2026-11-13', '안건3(안건:/결정:/할 일: 머리말, 이번 주까지 = 11/13): ' + a3.todos.map(td).join('|'));
ok(r.next === '2026-11-24', '다음 회의: ' + r.next);
// 2) 상대 날짜 계산 (기준 2026-11-10 화)
const D = s => M.due(s, '2026-11-10');
ok(D('내일까지') === '2026-11-11' && D('금요일까지') === '2026-11-13' && D('다음 주 월요일까지') === '2026-11-16' && D('15일까지') === '2026-11-15' && D('3일까지') === '2026-12-03' && D('12월 1일까지') === '2026-12-01' && D('이번 달까지') === '2026-11-30', '상대 날짜');
ok(D('2027.1.5까지') === '2027-01-05' && D('없음') === '', '연도 있는 날짜·없음');
// 3) 양식 칸 자동 채움 + 화면
ok($('#fDate').value === '2026-11-10' && $('#fTime').value === '15:30' && $('#fPlace').value === '3층 회의실' && $('#fPeople').value === '김민지, 박현수, 이수진, 최영호', '양식 칸 자동 채움');
const rows = $$('#todoTable tbody tr').map(tr => [...tr.cells].map(c => c.textContent.trim()).join('/'));
ok(rows.length === 3 && rows[0] === '1/리허설 일정 정리/박현수/11/27(금)/학예회 준비' && rows[1].includes('11/20(금)') && rows[2].includes('11/13(금)'), '할 일 표: ' + rows.join(' | '));
ok(/2026년 11월 10일\(화\) 15:30/.test($('#sheet').innerText) && /다음 회의/.test($('#sheet').innerText), '회의록 머리·다음 회의');
ok($('#stat').textContent.includes('안건 3') && $('#stat').textContent.includes('결정 3') && $('#stat').textContent.includes('할 일 3'), '요약: ' + $('#stat').textContent);
// 4) 직접 입력한 양식 칸은 덮어쓰지 않음
$('#fPlace').value = '도서실'; fire($('#fPlace'), 'input');
await put(memo.value + '\n');
ok($('#fPlace').value === '도서실' && /도서실/.test($('#sheet').innerText), '직접 고친 장소 유지');
// 5) 다른 메모 형식: [제목], ■, 담당: 이름, 결론
await put('[체육대회]\n• 우천 시 강당에서 진행하기로 결정\n• 반별 응원도구 준비 담당: 정다은 (11월 20일까지)\n■ 급식 개선\n결론: 잔반 줄이기 캠페인 진행\n의견이 다양했음');
const r2 = M.parse(memo.value, { base: '2026-11-10' });
ok(r2.agendas.map(a => a.title).join('|') === '체육대회|급식 개선', '[ ]·■ 안건: ' + r2.agendas.map(a => a.title).join('|'));
ok(r2.agendas[0].decisions[0] === '우천 시 강당에서 진행하기로 결정' && r2.agendas[0].todos.map(td).join('|') === '반별 응원도구 준비/정다은/2026-11-20', '담당: 형식: ' + r2.agendas[0].todos.map(td).join('|'));
ok(r2.agendas[1].decisions[0] === '잔반 줄이기 캠페인 진행' && r2.agendas[1].notes[0] === '의견이 다양했음', '결론: 형식');
// 6) 이스케이프
await put('1. <img src=x onerror=alert(1)>\n- <b>굵게</b> 하기로 함');
ok(!$('#sheet img') && !$('#sheet .agenda b') && /<img/.test($('#sheet').innerText), '메모 내용은 글자로 표시');
// 7) 직접 고치기
await put(M.SAMPLE);
$('#editBtn').click();
ok($('#sheet').isContentEditable && $('#editBtn').getAttribute('aria-pressed') === 'true', '직접 고치기 켜짐');
$('#sheet .agenda h3').textContent = '안건 1. 학예회 최종 준비';
memo.value += '\n'; fire(memo, 'input'); await wait(400);
ok(/학예회 최종 준비/.test($('#sheet').innerText), '고치는 중엔 메모가 바뀌어도 덮어쓰지 않음');
// 8) 복사
let copied = '';
try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { copied = t; } }, configurable: true }); } catch (e) {}
$('#copyBtn').click(); await wait(100);
ok(/학예회 최종 준비/.test(copied) && /리허설 일정 정리/.test(copied) && /회의록/.test(copied), '복사(고친 내용 포함): ' + copied.slice(0, 60));
$('#editBtn').click();
ok(!$('#sheet').isContentEditable, '고치기 끝');
$('#printBtn').click(); ok(window.__printed >= 1, '인쇄');
// 9) 저장
await wait(400);
const sv = JSON.parse(localStorage.getItem('edu-expo.minutes-maker.v1'));
ok(sv && sv.memo.startsWith(M.SAMPLE.slice(0, 20)) && sv.f.place === '도서실', '메모·양식 칸 저장');
ok($('#wipeAll') && /이 PC 기록 모두 지우기/.test($('#wipeAll').textContent), '지우기 버튼');
return 'ok ' + n;
