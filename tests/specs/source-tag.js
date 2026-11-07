// 25 출처 꼬리표: 메타 읽기·출처 문자열 형식·복사 시 꼬리표·목록 중복 제거·삭제
const T = window.SourceTag || SourceTag, D = window.__demo;
assert(T && D, 'SourceTag 와 __demo 가 있어야 함');
// 1) 가상 페이지 메타 읽기(사이트 이름 떼기, 저자, 연도)
const m0 = D.metaOf(0), m1 = D.metaOf(1);
assert(m0.title === '물은 어떻게 지구를 돌고 돌까?' && m0.site === '햇살 과학 신문' && m0.author === '김햇살 기자' && m0.year === '2026', '1쪽 메타: ' + JSON.stringify(m0));
assert(m1.title === '꿀벌' && m1.site === '어린이 열린 백과' && !m1.author && !m1.year, '2쪽 메타(| 구분자 떼기): ' + JSON.stringify(m1));
const tdoc = new DOMParser().parseFromString('<title>글</title>', 'text/html');
const frag = T.readMeta(tdoc, new URL('https://www.ex.com/a?q=비밀&token=x#part'));
assert(frag.url === 'https://www.ex.com/a' && frag.site === 'ex.com', '기본은 ?쿼리·#해시 떼기, www 떼기: ' + JSON.stringify(frag));
const full = T.readMeta(tdoc, new URL('https://www.ex.com/a?b=1#c:~:text=foo'), { fullUrl: true });
assert(full.url === 'https://www.ex.com/a?b=1#c', '주소 전체 옵션: 쿼리·해시 유지, 텍스트 조각만 떼기: ' + full.url);
assert(T.cleanUrl('https://ex.com/p?id=3#x') === 'https://ex.com/p' && T.cleanUrl('https://ex.com/p?id=3', true) === 'https://ex.com/p?id=3', 'cleanUrl');
// 2) 출처 문자열 형식(정답 문자열)
const U0 = 'https://example.org/science/water-cycle';
assert(T.buildCitation(m0, 'easy', '2026-11-07') === `[출처] 「물은 어떻게 지구를 돌고 돌까?」, 햇살 과학 신문, ${U0}, 2026년 11월 7일 확인`, '쉬운 형식: ' + T.buildCitation(m0, 'easy', '2026-11-07'));
assert(T.buildCitation(m0, 'apa', '2026-11-07') === `김햇살 기자. (2026). 물은 어떻게 지구를 돌고 돌까? 햇살 과학 신문. 2026년 11월 7일 확인, ${U0}`, 'APA(저자 있음): ' + T.buildCitation(m0, 'apa', '2026-11-07'));
assert(T.buildCitation(m1, 'apa', '2026-01-05') === '꿀벌. (n.d.). 어린이 열린 백과. 2026년 1월 5일 확인, https://example.org/kids-wiki/honeybee', 'APA(저자·연도 없음): ' + T.buildCitation(m1, 'apa', '2026-01-05'));
assert(T.historyText([T.makeEntry(m0, '2026-11-07'), T.makeEntry(m1, '2026-11-06')], 'easy').split('\n')[1].startsWith('2. [출처] 「꿀벌」'), '모두 복사는 번호 목록');
// 3) 복사 이벤트 처리: 켜짐이면 글+빈 줄+출처, 꺼짐/입력칸이면 손대지 않음
const data = {}; let prevented = false;
const sel = getSelection(); const rg = document.createRange(); rg.selectNodeContents($('#pick')); sel.removeAllRanges(); sel.addRange(rg);
const fake = (target) => ({ clipboardData: { setData: (k, v) => { data[k] = v; } }, preventDefault: () => { prevented = true; }, defaultPrevented: false, target });
const r = T.handleCopy(fake($('#pick')), { enabled: true, format: 'easy', getMeta: () => m0, now: new Date(2026, 10, 7) });
assert(r && prevented && data['text/plain'] === $('#pick').textContent + '\n\n' + T.buildCitation(m0, 'easy', '2026-11-07'), '복사 결과: ' + data['text/plain']);
assert(/<p>\[출처\]/.test(data['text/html']) && data['text/html'].startsWith($('#pick').textContent),'HTML 복사본에도 출처 문단');
assert(T.handleCopy(fake($('#pick')), { enabled: false, format: 'easy', getMeta: () => m0 }) === null, '꺼짐이면 그대로');
assert(T.handleCopy(fake($('#paste')), { enabled: true, format: 'easy', getMeta: () => m0 }) === null, '입력칸 안 복사는 그대로');
const xs = T.composeHtml('x', '<img src=x onerror=alert(1)>');
assert(!xs.includes('<img'), '출처 HTML 이스케이프');
// 4) [복사하기] 버튼 → 클립보드 미리보기 마지막 줄이 출처, 목록 맨 위에 추가
sel.removeAllRanges();
const n0 = D.state().history.length;
$('#copyBtn').click(); await wait(200);
const clipLines = $('#clip').textContent.split('\n');
assert(clipLines[0] === $('#pick').textContent && /^\[출처\] 「물은 어떻게 지구를 돌고 돌까\?」, 햇살 과학 신문, https:\/\/example\.org\/science\/water-cycle, \d{4}년 \d{1,2}월 \d{1,2}일 확인$/.test(clipLines[clipLines.length - 1]), '미리보기: ' + $('#clip').textContent);
assert(D.state().history.length === n0 + 1 && D.state().history[0].url === U0, '목록에 추가: ' + D.state().history.length);
$('#copyBtn').click(); await wait(200);
assert(D.state().history.length === n0 + 1, '같은 주소는 한 번만');
// 5) 두 번째 탭(이미 목록에 있는 꿀벌) 복사 → 개수 그대로, 맨 위로 이동
$$('#tabs .tab')[1].click(); await wait(100);
assert($('#addr').textContent === 'https://example.org/kids-wiki/honeybee', '탭 전환 주소');
$('#copyBtn').click(); await wait(200);
assert(D.state().history.length === n0 + 1 && D.state().history[0].title === '꿀벌', '기존 항목은 맨 위로 이동');
const list = () => $$('#popup [data-r=list] li:not(.st-empty)');
assert(list().length === n0 + 1 && $('#popup [data-r=count]').textContent === `${n0 + 1}/30`, '팝업 목록 개수 표시');
// 6) 형식 APA로 바꾸면 팝업의 이 페이지 출처도 APA
$('#popup [data-f=apa]').click(); await wait(100);
assert(/^꿀벌\. \(n\.d\.\)\. 어린이 열린 백과\./.test($('#popup [data-r=pageCite]').textContent), '팝업 APA: ' + $('#popup [data-r=pageCite]').textContent);
assert(JSON.parse(localStorage.getItem('source-tag-demo-v1')).format === 'apa', '형식 저장');
// 7) × 로 한 개 빼기, 지우기는 두 번 눌러야 비워짐
list()[0].querySelector('[data-del]').click(); await wait(100);
assert(D.state().history.length === n0 && list().length === n0, '× 로 한 개 삭제');
const clr = $('#popup [data-r=clear]');
clr.click(); await wait(50);
assert(D.state().history.length === n0, '지우기 첫 클릭은 확인만');
clr.click(); await wait(100);
assert(D.state().history.length === 0 && $('#popup .st-empty'), '두 번째 클릭에 비움');
// 8) 목록 최대 30개
let h = []; for (let i = 0; i < 35; i++) h = T.addHistory(h, { url: 'u' + i });
assert(h.length === 30 && h[0].url === 'u34', '최대 30개, 최신이 위');
// 9) 팝업 '주소 전체' 옵션: 기본 꺼짐, 켜면 저장되고 메타 읽기에 반영
const fu = $('#popup [data-r=fullUrl]');
assert(fu && !fu.checked, '주소 전체 옵션 기본 꺼짐');
fu.click(); await wait(100);
assert(D.state().fullUrl === true && JSON.parse(localStorage.getItem('source-tag-demo-v1')).fullUrl === true, '주소 전체 옵션 저장');
fu.click(); await wait(100);
assert(D.state().fullUrl === false, '주소 전체 옵션 끄기');
return 'ok 9';
