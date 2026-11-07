// 37 법령 콕: 법령명 탐지(정식명·약칭·띄어쓰기·가운뎃점·「」·같은 법 시행령·조례), 조문 정규화, law.go.kr 주소 형식, 팝업 목록·고른 글자 열기
const L = window.LawLink || window.__demo.L;
assert(L, 'LawLink 가 있어야 함');
const B = 'https://www.law.go.kr';
const enc = encodeURIComponent;
// 1) 주소 형식
assert(L.lawUrl('교원지위법', '제15조') === B + '/법령/' + enc('교원의 지위 향상 및 교육활동 보호를 위한 특별법') + '/' + enc('제15조'), '약칭 → 정식명 주소');
assert(L.lawUrl('교육기본법', '제 12 조') === B + '/법령/' + enc('교육기본법') + '/' + enc('제12조'), '조문 띄어쓰기 정규화');
assert(L.lawUrl('학교보건법', '', '시행령') === B + '/법령/' + enc('학교보건법 시행령'), '시행령 주소');
assert(L.lawUrl('경상북도교육청 행정기구 설치 조례', '제2조') === B + '/자치법규/' + enc('경상북도교육청 행정기구 설치 조례'), '조례는 자치법규(조문 없이)');
assert(L.searchUrl('  그냥   글자 ') === B + '/lsSc.do?menuId=1&query=' + enc('그냥 글자'), '검색 주소');
// 2) 글에서 찾기
const t = '1. 관련: 「학교폭력예방 및 대책에 관한 법률」 제15조, 같은 법 시행령 제17조\n' +
  '초·중등교육법 제18조의4 및 교육기본법 제12조. 개인정보보호법, 청소년보호법 제2조. 학폭법 제15조.\n' +
  '「경상북도교육청 행정기구 설치 조례」 제2조. 교수학습방법과 문법, 이 법은 제외.';
const labels = L.findLaws(t).map(i => i.label);
const want = ['학교폭력예방 및 대책에 관한 법률 제15조', '학교폭력예방 및 대책에 관한 법률 시행령 제17조', '초ㆍ중등교육법 제18조의4', '교육기본법 제12조',
  '개인정보 보호법', '청소년 보호법 제2조', '경상북도교육청 행정기구 설치 조례 제2조'];
assert(JSON.stringify(labels) === JSON.stringify(want), '찾은 법령: ' + labels.join(' / '));
assert(L.findLaws(t)[0].count === 2, '같은 법령·조문(약칭 학폭법 포함) 2회');
assert(!labels.some(l => /방법|문법/.test(l)), '방법·문법은 법령 아님');
// 띄어 쓴 정식명(사전에 붙여 쓰는 이름)도 통째로 — 뒷부분(기본법·보건법)만 잘못 잡으면 안 됨
const sp = L.findLaws('교육 기본법 제3조와 학교 보건법 시행령').map(i => i.label);
assert(JSON.stringify(sp) === JSON.stringify(['교육기본법 제3조', '학교보건법 시행령']), '띄어 쓴 법령명: ' + sp.join(' / '));
// 묶기: 같은 법 조문 여러 개
const g = L.groupLaws(L.findLaws('교육기본법 제12조, 교육기본법 제3조, 교육기본법 제12조'));
assert(g.length === 1 && g[0].count === 3 && g[0].articles.map(a => a.article).join(',') === '제12조,제3조', '묶기: ' + JSON.stringify(g.map(x => [x.count, x.articles.length])));
// 3) 고른 글자 → 열 주소
let r = L.resolveSelection('「교원지위법 제19조」.');
assert(r.mode === 'direct' && r.item.label === '교원의 지위 향상 및 교육활동 보호를 위한 특별법 제19조' && r.item.abbr === '교원지위법', '고른 글자(약칭): ' + JSON.stringify(r.item));
r = L.resolveSelection('「학교폭력예방 및 대책에 관한 법률」 제15조');
assert(r.mode === 'direct' && r.item.label === '학교폭력예방 및 대책에 관한 법률 제15조', '「」 뒤 조문까지(노란 표시를 눌렀을 때와 같게): ' + (r.item && r.item.label));
r = L.resolveSelection('수업 나눔 주간');
assert(r.mode === 'search' && r.url === L.searchUrl('수업 나눔 주간'), '법령명이 아니면 검색');
assert(L.resolveSelection('   ') === null, '빈 글자');
// 4) 체험 페이지: 팝업 목록, 노란 표시, 버튼으로 열기
const opened = []; window.open = u => { opened.push(u); return null; };
const pg = $('#page');
const marks = $$('#page mark.law');
assert(marks.length >= 8 && marks.every(m => m.dataset.url.startsWith(B + '/')), '본문 법령 표시: ' + marks.length);
const popupNames = $$('#popup .ll-name').map(a => a.textContent);
assert(popupNames.length === L.groupLaws(L.findLaws(pg.innerText)).length && popupNames.includes('초ㆍ중등교육법'), '팝업 목록: ' + popupNames.join(','));
assert($('#popup .ll-cnt').textContent === popupNames.length + '개', '팝업 개수');
$$('#popup .ll-name')[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); // a.click()은 러너가 막아 둠
assert(opened.length === 1 && opened[0].startsWith(B + '/법령/'), '팝업 링크 열기: ' + opened[0]);
// 노란 법령명 누르면 말풍선 + 열릴 주소
marks[0].click();
assert($('#page .bubble'), '말풍선');
assert($('#outA').getAttribute('href') === marks[0].dataset.url, '열릴 주소: ' + $('#outA').getAttribute('href') + ' vs ' + marks[0].dataset.url);
// 글자 고르고 버튼
const tn = [...pg.querySelectorAll('li')].find(li => li.textContent.includes('교원지위법'));
const i0 = tn.textContent.indexOf('교원지위법 제19조');
const rg = document.createRange(); const tx = [...tn.childNodes].find(n => n.textContent.includes('교원지위법')) ;
const walker = document.createTreeWalker(tn, NodeFilter.SHOW_TEXT); let acc = 0, sNode, sOff, eNode, eOff;
while (walker.nextNode()) { const n = walker.currentNode, len = n.nodeValue.length; if (!sNode && i0 < acc + len) { sNode = n; sOff = i0 - acc; } if (!eNode && i0 + 10 <= acc + len) { eNode = n; eOff = i0 + 10 - acc; } acc += len; }
rg.setStart(sNode, sOff); rg.setEnd(eNode, eOff);
getSelection().removeAllRanges(); getSelection().addRange(rg);
assert(getSelection().toString() === '교원지위법 제19조', '고른 글자: ' + getSelection().toString());
$('#findSel').click();
assert(opened[opened.length - 1] === L.lawUrl('교원지위법', '제19조') && /교원의 지위 향상/.test($('#outQ').textContent), '고른 글자로 열기');
getSelection().removeAllRanges();
// 팝업 검색칸
const f = $('#popup .ll-search'); f.querySelector('input').value = '학교급식법 제10조'; f.dispatchEvent(new Event('submit', { cancelable: true }));
assert(opened[opened.length - 1] === B + '/법령/' + enc('학교급식법') + '/' + enc('제10조'), '팝업 검색: ' + opened[opened.length - 1]);
return 'ok 4';
