// 50 다국어 가정통신문(콘셉트): 언어 탭 전환, 비용·회신 기한이 모든 언어에 같은 값으로 반영, 회신 버튼
const doc = () => $('#doc').innerText;
const tab = l => $(`#tabs [data-l="${l}"]`).click();
// 첫 화면 베트남어: 12,000원·11/13(금)
assert($('#doc').lang === 'vi' && doc().includes('12.000 won') && doc().includes('Thứ Sáu, 13/11'), '베트남어 첫 화면: ' + doc());
assert($('#trn').textContent.includes('전문 검수'), '번역 검수 안내');
// 비용 + → 13,000원, 아이콘·원문에 반영
$('#plus').click(); await wait(50);
assert($('#costK').textContent === '13,000원' && doc().includes('13.000 won') && $('#icons').innerText.includes('13,000'), '비용 13,000: ' + doc());
// 영어 탭
tab('en'); await wait(300);
assert($('#doc').lang === 'en' && doc().includes('KRW 13,000') && doc().includes('Fri, Nov 13'), '영어: ' + doc());
// 회신 기한 11/16(월)
const rep = $('#reply'); rep.value = '2'; fire(rep, 'change'); await wait(50);
assert(doc().includes('Mon, Nov 16') && $('#icons').innerText.includes('11.16'), '회신 기한 11/16(월): ' + doc());
// 중국어: 같은 값
tab('zh'); await wait(300);
assert(doc().includes('13,000韩元') && doc().includes('11月16日（星期一）') && doc().includes('11月20日（星期五）'), '중국어: ' + doc());
// 회신 버튼 → 교사 화면 도착 안내
$('#doc button[data-a="1"]').click(); await wait(50);
assert(doc().includes('참가 동의 (中文로 응답)') && !$('#doc button[data-a]'), '회신 결과: ' + doc());
// 언어 바꾸면 회신 초기화, 한국어는 원문
tab('ko'); await wait(300);
assert($('#doc button[data-a="0"]') && doc().includes('13,000원') && doc().includes('11월 16일(월)') && $('#trn').textContent.includes('원문'), '한국어 원문: ' + doc());
$('#doc button[data-a="0"]').click(); await wait(50);
assert(doc().includes('미동의 (한국어로 응답)'), '미동의 회신');
// 비용 하한 0원, 준비 중 언어는 비활성
for (let i = 0; i < 20; i++) $('#minus').click();
await wait(50);
assert($('#costK').textContent === '0원', '비용 0원 아래로 안 내려감: ' + $('#costK').textContent);
assert($$('#tabs button[disabled]').length === 2, '검수 전 언어 2개 비활성');
return 'ok 11';
