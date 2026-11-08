// 97 상담 기록장: 기록 저장·수정·삭제, 최신순, 월·학생·검색 필터, 학생별 묶음, 후속 조치 미완료·완료, 통계, 인쇄(학생별), JSON 백업·가져오기 검증, 저장
const C = window.__callLog;
assert(C && typeof C.setRecords === 'function', '__callLog 있어야 함');
C.setRecords([]);
assert($$('#list .rec').length === 0, '빈 목록');
const set = (id, v) => { const el = $('#' + id); el.value = v; fire(el, 'input'); fire(el, 'change'); };
const tags = ts => { $$('#fTags .chip').forEach(c => { if (c.classList.contains('on') !== ts.includes(c.dataset.tag)) c.click(); }); };
const add = (d, t, stu, target, method, tg, content, follow, done) => {
  set('fDate', d); set('fTime', t); set('fStudent', stu); set('fTarget', target); set('fMethod', method); tags(tg);
  set('fContent', content); set('fFollow', follow); $('#fDone').checked = !!done; $('#saveBtn').click();
};
const tab = name => $$('#tabs .tab').find(b => b.dataset.tab === name).click();
const recs = () => $$('#list .rec');
// 1) 저장 3건 + 빈 학생 거부
add('2026-10-05', '10:00', '테스트A', '학부모', '전화', ['학업', '교우관계'], '수학 숙제 관련 상담', '다음 주 다시 통화', false);
add('2026-11-02', '13:30', '테스트A', '학생', '대면', ['교우관계'], '쉬는 시간 갈등 이야기', '', false);
add('2026-11-03', '16:10', '테스트B', '학부모', '문자', ['건강'], '알레르기 확인', '보건실 안내', true);
assert($('#fStudent').value === '' && $('#fContent').value === '' && $('#fDate').value === '2026-11-03', '저장 후 폼 비우기');
add('2026-11-04', '09:00', '  ', '학생', '대면', [], '이름 없음', '', false);
assert(C.records().length === 3 && /학생 이름/.test($('#toast').textContent), '빈 학생 거부: ' + C.records().length);
tab('list');
assert(recs().length === 3 && recs()[0].querySelector('.when').textContent.startsWith('2026-11-03'), '최신순: ' + recs()[0].textContent.slice(0, 40));
assert(recs()[2].querySelector('.tags').textContent.includes('학업') && recs()[2].textContent.includes('다음 주 다시 통화'), '태그·후속 표시');
// 2) 필터
set('month', '2026-11'); assert(recs().length === 2, '11월 2건');
set('stu', '테스트A'); assert(recs().length === 1 && recs()[0].textContent.includes('갈등'), '11월+테스트A 1건');
set('month', ''); assert(recs().length === 2, '테스트A 전체 2건');
set('stu', ''); set('q', '숙제'); assert(recs().length === 1, '검색 숙제 1건');
set('q', '교우관계'); assert(recs().length === 2, '태그도 검색');
set('q', '');
// 3) 학생별
tab('students');
const groups = $$('#students .grp');
assert(groups.length === 2 && groups[0].querySelector('.gname').textContent.includes('테스트A') && /2건/.test(groups[0].querySelector('.gmeta').textContent) && /2026-11-02/.test(groups[0].querySelector('.gmeta').textContent), '학생별 묶음: ' + groups.map(g => g.textContent.slice(0, 30)).join('|'));
// 4) 후속 조치
assert($('#followCnt').textContent === '1', '미완료 1: ' + $('#followCnt').textContent);
tab('follow');
assert($$('#follow .rec').length === 1 && $('#follow').textContent.includes('다음 주 다시 통화'), '후속 목록');
$('#follow [data-done]').click();
assert($('#followCnt').textContent === '0' && $$('#follow .rec').length === 0 && /남은 후속 조치가 없어요/.test($('#follow').textContent), '완료 처리');
// 5) 통계
tab('stats');
const stat = (g, k) => { const r = $$('#stats [data-g="' + g + '"] .srow').find(x => x.querySelector('.sk').textContent === k); return r ? +r.querySelector('.sv').textContent : 0; };
assert(stat('method', '전화') === 1 && stat('method', '대면') === 1 && stat('method', '문자') === 1 && stat('method', '온라인') === 0, '방법별');
assert(stat('tag', '교우관계') === 2 && stat('tag', '건강') === 1 && stat('target', '학부모') === 2 && stat('month', '2026-11') === 2 && stat('month', '2026-10') === 1, '주제·대상·월별');
// 6) 수정·삭제
tab('list');
recs()[0].querySelector('[data-edit]').click();
assert($('#fStudent').value === '테스트B' && $('#fContent').value === '알레르기 확인' && $('#fDone').checked && /수정/.test($('#saveBtn').textContent), '수정 불러오기');
set('fContent', '알레르기 확인 - 고친 내용'); $('#saveBtn').click();
assert(C.records().length === 3 && recs()[0].textContent.includes('고친 내용') && !/수정/.test($('#saveBtn').textContent), '수정 저장');
recs()[0].querySelector('[data-del]').click(); await wait(50);
assert(C.records().length === 2, '삭제');
// 7) 이스케이프
add('2026-11-05', '10:00', '<i>태그</i>', '학생', '온라인', [], '<b>굵게</b>', '', false);
assert(!$('#list .rec i') && !$('#list .rec b') && recs()[0].textContent.includes('<i>태그</i>'), '이스케이프');
// 8) JSON 내보내기·가져오기(검증)
const js = JSON.parse(C.exportJson());
assert(js.app === 'call-log' && js.records.length === 3, 'JSON 백업');
const dupId = js.records[0].id;
const imp = JSON.stringify({ app: 'call-log', records: [
  { id: 'n1', date: '2026-09-01', time: '09:00', student: '가져온학생', target: '학부모', method: '전화', tags: ['진로'], content: '<img src=x onerror="window.__xss=1">', follow: '', done: false },
  { id: 'n2', date: '2026-13-45', student: '날짜틀림', target: '학생', method: '대면', content: 'x' },
  { id: 'n3', date: '2026-09-02', student: '', method: '대면', content: '학생없음' },
  { id: dupId, date: '2026-09-03', student: '중복', method: '대면', content: '중복 id' },
  { id: 'n5', date: '2026-09-04', student: '방법이상', method: '<script>', target: '??', tags: 'x', content: 'ok' },
  'not-an-object'] });
const fi = $('#importFile'); const dt = new DataTransfer(); dt.items.add(new File([imp], 'backup.json', { type: 'application/json' }));
fi.files = dt.files; fire(fi, 'change'); await wait(400);
assert(C.records().length === 5 && /2건 가져옴/.test($('#toast').textContent) && /4건 건너뜀/.test($('#toast').textContent), '가져오기 2건, 건너뜀 4: ' + $('#toast').textContent + ' / ' + C.records().length);
const weird = C.records().find(r => r.student === '방법이상');
assert(weird && weird.method === '기타' && weird.target === '기타' && Array.isArray(weird.tags) && weird.tags.length === 0, '잘못된 값은 기본값으로');
assert(!window.__xss && !$('#list img'), '가져온 내용 이스케이프');
const bad = new DataTransfer(); bad.items.add(new File(['{not json'], 'bad.json')); fi.files = bad.files; fire(fi, 'change'); await wait(300);
assert(/읽을 수 없/.test($('#toast').textContent) && C.records().length === 5, '깨진 파일 거부');
// 9) 학생별 인쇄
set('stu', '테스트A'); const p0 = window.__printed || 0;
$('#printBtn').click();
assert((window.__printed || 0) === p0 + 1 && $('#printArea').textContent.includes('테스트A') && !$('#printArea').textContent.includes('가져온학생') && $$('#printArea tbody tr').length === 2, '학생별 일지 인쇄: ' + $$('#printArea tbody tr').length);
set('stu', '');
// 10) 저장
await wait(400);
const st = JSON.parse(localStorage.getItem('edu-expo.call-log.v1') || 'null');
assert(st && st.records.length === 5 && st.records.some(r => r.student === '가져온학생'), '저장');
return 'ok 10';
