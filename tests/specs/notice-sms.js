// 96 문자 알림 틀: EUC-KR 바이트(한글 2·영숫자 1·줄바꿈 1), SMS 90/LMS 2000 구분·넘침, 명단 TSV 변수 치환, 공통 값, 빈 변수 경고, 틀 모음, 내보내기, 저장
const S = window.__sms;
assert(S && typeof S.bytes === 'function', '__sms.bytes 있어야 함');
const tpl = $('#tpl'), roster = $('#roster');
const setTpl = v => { tpl.value = v; fire(tpl, 'input'); };
const setRoster = v => { roster.value = v; fire(roster, 'input'); };
const cards = () => $$('#list .card');
const sum = k => +$('#sum [data-k="' + k + '"] b').textContent;
// 1) 바이트 정답값
assert(S.bytes('가A 1\n') === 6, '"가A 1\\n" = 2+1+1+1+1 = 6: ' + S.bytes('가A 1\n'));
assert(S.bytes('가\r\n나') === 5, '\\r\\n은 줄바꿈 하나(1바이트): ' + S.bytes('가\r\n나'));
assert(S.bytes('😀') === 2 && S.bytes('') === 0, '이모지 한 글자 2바이트');
// 2) 명단 TSV + 공통 값 치환
setRoster('이름\t전화\n김하늘\t010-1111-2222\n\n이바다\t010-3333-4444\n');
setTpl('{이름} 학부모님, {날짜} 안내');
const ci = $('#commons input[data-var="날짜"]');
assert(ci && !$('#commons input[data-var="이름"]'), '명단에 없는 변수만 공통 값 칸: ' + $('#commons').textContent);
ci.value = '5/7'; fire(ci, 'input');
assert(cards().length === 2 && /2명/.test($('#rosterInfo').textContent), '빈 줄 건너뛰고 2명: ' + $('#rosterInfo').textContent);
assert(cards()[0].querySelector('.body').textContent === '김하늘 학부모님, 5/7 안내', '치환: ' + cards()[0].querySelector('.body').textContent);
assert(cards()[0].querySelector('.bytes').textContent === '25 / 90바이트' && cards()[0].querySelector('.type').textContent === 'SMS', '25바이트 SMS: ' + cards()[0].querySelector('.bytes').textContent);
assert(cards()[1].querySelector('.who').textContent.includes('010-3333-4444'), '전화번호 표시');
assert(sum('all') === 2 && sum('sms') === 2 && sum('lms') === 0 && sum('over') === 0 && sum('warn') === 0, '요약 SMS 2');
// 3) 빈 변수 경고(명단 칸 비어 있음 / 공통 값 비어 있음)
setRoster('이름\t보호자\t전화\n김하늘\t김엄마\t010-1111-2222\n이바다\t\t010-3333-4444');
setTpl('{보호자}님, {이름} 학생 {날짜} {행사} 안내');
const ev = $('#commons input[data-var="행사"]'); ev.value = ''; fire(ev, 'input');
assert(sum('warn') === 2, '행사 공통 값이 비어 둘 다 경고: ' + sum('warn'));
ev.value = '현장체험학습'; fire(ev, 'input');
assert(sum('warn') === 1 && /\{보호자\}/.test(cards()[1].querySelector('.warn').textContent) && !cards()[0].querySelector('.warn'), '보호자 빈 칸만 경고');
assert(cards()[1].querySelector('.body mark') && cards()[1].querySelector('.body mark').textContent === '{보호자}', '빈 변수는 강조 표시');
// 4) SMS/LMS/넘침 경계
setRoster('이름\n가\n나\n다');
setTpl('{이름}' + '가'.repeat(44)); // 2 + 88 = 90
assert(sum('sms') === 3 && cards()[0].querySelector('.bytes').textContent === '90 / 90바이트', '90바이트까지 SMS');
setTpl('{이름}' + '가'.repeat(44) + 'A');
assert(sum('lms') === 3 && sum('sms') === 0 && cards()[0].querySelector('.type').textContent === 'LMS' && cards()[0].querySelector('.bytes').textContent === '91 / 2,000바이트', '91바이트는 LMS: ' + cards()[0].querySelector('.bytes').textContent);
setTpl('{이름}' + '가'.repeat(999) + 'A');
assert(sum('over') === 3 && cards()[0].classList.contains('over') && cards()[0].querySelector('.type').textContent === '넘침' && /1바이트 넘침/.test(cards()[0].querySelector('.warn').textContent), '2001바이트 넘침');
// 5) 이스케이프
setRoster('이름\n<b>굵게</b>');
setTpl('{이름} 안내');
assert(!$('#list .card .body b') && cards()[0].querySelector('.body').textContent === '<b>굵게</b> 안내', '이름 태그는 글자로');
// 6) 틀 모음 → 틀 바뀜, 변수 칩 넣기
const pre = $$('#presets .chip').find(b => b.textContent.includes('하교 지연'));
assert(pre, '하교 지연 틀 있음'); pre.click();
assert(/하교/.test(tpl.value) && /\{이름\}/.test(tpl.value), '틀 적용: ' + tpl.value);
setRoster('이름\t반\n김하늘\t3반');
setTpl('안녕 ');
tpl.selectionStart = tpl.selectionEnd = tpl.value.length;
const vb = $$('#vars .chip').find(b => b.textContent === '{반}');
assert(vb, '명단 열 이름 칩'); vb.click();
assert(tpl.value === '안녕 {반}' && cards()[0].querySelector('.body').textContent === '안녕 3반', '변수 칩 넣기: ' + tpl.value);
// 7) 내 틀 저장
const before = $$('#presets .chip.mine').length;
$('#saveMine').click();
assert($$('#presets .chip.mine').length === before + 1, '내 틀 저장');
// 8) 내보내기 텍스트·CSV(수식 방지)
setRoster('이름\t전화\n김하늘\t010-1111-2222\n=SUM(1)\t010');
setTpl('{이름} 안내');
const tx = S.exportText();
assert(tx.split('\n')[0] === '김하늘 (010-1111-2222) [SMS 11바이트]' && tx.split('\n')[1] === '김하늘 안내', '텍스트 내보내기: ' + tx.slice(0, 80));
const csv = S.exportCsv();
assert(csv.split('\n')[0] === '이름,전화,종류,바이트,문구' && csv.includes("'=SUM(1),010,SMS,") , 'CSV 수식 방지: ' + csv);
// 9) 복사 버튼
cards()[0].querySelector('[data-copy]').click(); await wait(300);
assert(/복사/.test($('#toast').textContent), '복사 안내: ' + $('#toast').textContent);
// 10) 저장
await wait(500);
const st = JSON.parse(localStorage.getItem('edu-expo.notice-sms.v1') || 'null');
assert(st && st.tpl === '{이름} 안내' && /=SUM/.test(st.roster) && st.commons['행사'] === '현장체험학습' && st.mine.length === before + 1, '저장: ' + JSON.stringify(st).slice(0, 200));
return 'ok 10';
