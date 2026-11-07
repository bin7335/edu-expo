// 31 운영위 서식: 한 번 입력 → 5종 서식(공고·방청 안내·출석부·안건 처리표·회의록)에 같은 값이 들어간다
// (샘플 값에 기대지 않고, 직접 넣은 값으로 동작만 검증)
const set = (id, v) => { $('#' + id).value = v; };
const apply = () => { $('#form').dispatchEvent(new Event('input', { bubbles: true })); };
set('school', '테스트초등학교'); set('round', '3'); set('kind', '임시회');
set('date', '2026-12-02'); set('time', '09:05'); set('place', '시청각실'); set('notice', '2026-11-25');
set('agenda', '첫째 안건 | 교무부\n\n  둘째 <b>안건</b> |  행정실  \n셋째 안건');
set('members', '가부위 | 학부모위원 | 부위원장\n나위장 | 지역위원 | 위원장\n다교원 | 교원위원\n라교원 | 교원위원 | 위원');
set('secretary', '마간사'); set('deadline', '2026-11-30');
apply();
const sheets = $$('#zoomer .sheet');
assert(sheets.length === 5, '서식 5종: ' + sheets.length);
assert($('#agCount').textContent === '3건' && $('#memCount').textContent === '4명', '안건·위원 수(빈 줄 무시): ' + $('#agCount').textContent + ' ' + $('#memCount').textContent);
// 숨은 서식은 innerText가 비므로 textContent, 다시 그리면 새 요소이므로 매번 찾기
const s = i => $$('#zoomer .sheet')[i].textContent.replace(/\s+/g, ' ');
// 1) 공고: 제목·일시(요일·오전 시각)·장소·방청 마감·공고일
assert(s(0).includes('제3차 테스트초등학교운영위원회 임시회 개최 공고'), '공고 제목: ' + s(0).slice(0, 80));
assert(s(0).includes('2026년 12월 2일(수) 오전 9시 5분'), '일시 형식: ' + s(0));
assert(s(0).includes('테스트초등학교 시청각실') && s(0).includes('2026년 11월 30일까지') && s(0).includes('(마간사)'), '장소·방청 마감·간사');
assert(s(0).includes('2026년 11월 25일') && s(0).includes('공고 제2026-3호'), '공고일·공고 번호');
assert(sheets[0].querySelectorAll('ol li').length === 3, '공고 안건 3개');
// 입력한 태그는 글자로
assert(!sheets[0].querySelector('ol b') && s(0).includes('둘째 <b>안건</b>'), '안건의 태그가 글자로 보여야 함');
// 2) 방청 안내: 주요 안건 번호 목록, 신청 기한, 학교장
assert(s(1).includes('1. 첫째 안건') && s(1).includes('3. 셋째 안건') && s(1).includes('테스트초등학교장'), '방청 안내: ' + s(1).slice(0, 200));
// 3) 출석부: 위원 4행, 직위 없으면 '위원', 재적 4명
const att = sheets[2].querySelectorAll('tbody')[0].querySelectorAll('tr');
assert(att.length === 4, '출석부 4행: ' + att.length);
assert([...att[2].children].map(c => c.textContent).join(' ').includes('교원위원 위원 다교원'), '직위 기본값 위원: ' + att[2].textContent);
assert(/재적 위원\s*4명/.test(s(2)), '재적 4명');
assert(s(2).includes('간사 마간사'), '출석부 간사');
// 4) 안건 처리표: 3행, 제안자, 위원장은 '부위원장'이 아닌 '위원장'
const ag = sheets[3].querySelectorAll('tbody tr');
assert(ag.length === 3 && ag[0].children[2].textContent === '교무부' && ag[1].children[2].textContent === '행정실' && ag[2].children[2].textContent === '', '안건 처리표 제안자');
assert(s(3).includes('위원장 나위장') && !s(3).includes('위원장 가부위'), '위원장 찾기(부위원장 제외): ' + s(3).slice(-60));
// 5) 회의록: 안건 블록 3개, 재적 4명, 위원장·간사
assert(sheets[4].querySelectorAll('.blk').length === 3 && /안건 1\. 첫째 안건 \(제안: 교무부\)/.test(s(4)), '회의록 안건 블록');
assert(/재적 위원\s*4명/.test(s(4)) && s(4).includes('나위장') && s(4).includes('간사 마간사'), '회의록 머리');
// 6) 시각 변환: 정오·자정·오후
set('time', '12:00'); apply(); assert(s(0).includes('오후 12시'), '정오 → 오후 12시');
set('time', '00:30'); apply(); assert($$('#zoomer .sheet')[0].innerText.includes('오전 12시 30분'), '자정 → 오전 12시 30분');
set('time', '17:40'); apply(); assert($$('#zoomer .sheet')[0].innerText.includes('오후 5시 40분'), '17:40 → 오후 5시 40분');
// 날짜 비우면 빈칸 표시
set('date', ''); apply(); assert($$('#zoomer .sheet')[0].innerText.includes('____년 __월 __일'), '날짜 빈칸');
set('date', '2026-12-02'); apply();
// 7) 탭: 누른 서식만 보임
$$('#tabs .tab')[3].click();
const on = $$('#zoomer .sheet').map((x, i) => x.classList.contains('on') ? i : -1).filter(i => i >= 0);
assert(on.length === 1 && on[0] === 3, '탭 전환: ' + on);
set('round', '4'); apply();
assert($$('#zoomer .sheet')[3].classList.contains('on'), '다시 그려도 고른 탭 유지');
// 8) 자동 저장
await wait(450);
const saved = JSON.parse(localStorage.getItem('edu-expo.committee-forms.v1') || 'null');
assert(saved && saved.school === '테스트초등학교' && saved.round === '4' && saved.kind === '임시회', '자동 저장: ' + JSON.stringify(saved));
// 9) 인쇄: 하나/모두
window.__printed = 0;
$('#printAll').click();
assert(window.__printed === 1 && document.body.classList.contains('print-all'), '5종 모두 인쇄');
$('#printOne').click();
assert(window.__printed === 2 && !document.body.classList.contains('print-all'), '이 서식만 인쇄');
return 'ok 9';
