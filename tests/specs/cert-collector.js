// 40 이수증 모으기(콘셉트): 카드 넣기 → 표·시간 합계·필수 연수 체크·파일 이름 규칙
assert($('#hrs').textContent === '18', '첫 화면 2장(3h+15h) = 18시간: ' + $('#hrs').textContent);
assert($$('#tb tr').length === 2, '표 2줄');
assert($('#left').textContent === '4장', '남은 이수증 4장: ' + $('#left').textContent);
const reqState = n => $$('#req li').find(li => li.textContent.includes(n));
assert(!reqState('청렴').classList.contains('ok'), '청렴 처음엔 미이수');
// 청렴 교육(2h) 카드 클릭
$$('#pile .card').find(c => c.textContent.includes('청렴')).click();
await wait(2500);
assert($('#hrs').textContent === '20', '청렴 2h 더해 20시간: ' + $('#hrs').textContent);
assert(reqState('청렴').classList.contains('ok'), '청렴 이수로 바뀜');
assert($$('#tb tr').pop().innerText.includes('햇살시교육연수원'), '표 마지막 줄에 기관: ' + $$('#tb tr').pop().innerText);
// 모두 넣기 → 3+2+15+30+2+1 = 53시간, 개인정보는 여전히 미이수
$('#all').click();
await wait(9000);
assert($('#hrs').textContent === '53' && $('#tot').textContent === '53h', '전체 53시간: ' + $('#hrs').textContent);
assert($$('#tb tr').length === 6, '표 6줄');
assert(!reqState('개인정보').classList.contains('ok'), '개인정보 보호는 이수증이 없어 미이수');
assert($('#all').disabled, '모두 넣은 뒤 버튼 비활성');
// 파일 이름 규칙
let fn = $('#fn').innerText;
assert(fn.includes('2026_김하늘_AI디지털수업설계_30h.pdf'), '규칙0 파일명: ' + fn);
const rule = $('#rule'); rule.value = '2'; fire(rule, 'change'); await wait(50);
fn = $('#fn').innerText;
assert(fn.includes('20260312_아동학대예방.pdf'), '규칙2 파일명: ' + fn);
rule.value = '1'; fire(rule, 'change'); await wait(50);
assert($('#fn').innerText.includes('김하늘_푸른교육연수원_20260520.pdf'), '규칙1 파일명: ' + $('#fn').innerText);
// 처음부터
$('#reset').click(); await wait(100);
assert($('#hrs').textContent === '0' && $$('#pile .card').length === 6, '처음부터 → 0시간·6장');
return 'ok 14';
