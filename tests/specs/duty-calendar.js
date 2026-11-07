// 38 복무 달력(콘셉트): 11월 복무 건수·보결 필요일 집계, 종류 필터·대상자 선택, 날짜 상세, 달 이동
assert($('#mlabel').textContent.includes('11월'), '첫 화면은 2026년 11월: ' + $('#mlabel').textContent);
assert($('#kAll').textContent === '16', '11월 복무 16건: ' + $('#kAll').textContent);
// 보결 필요일 = 담임이 수업 시간에 빠지는 날 3·6·10·11·18·24·27일
assert($('#kNeed').textContent === '7', '11월 보결 필요 7일: ' + $('#kNeed').textContent);
// 18일 상세(첫 화면 선택): 김하늘 연가 + 박솔 출장 → 보결 필요
const side = $('#side').innerText;
assert(side.includes('11월 18일') && side.includes('김하늘') && side.includes('박솔') && side.includes('보결 필요'), '18일 상세: ' + side);
// 연가 끄기 → 3건(3·13·18일) 빠짐, 3일은 보결 불필요
const yeonga = () => $$('#filters .fc').find(b => b.dataset.t === '연가');
yeonga().click(); await wait(100);
assert($('#kAll').textContent === '13', '연가 끄면 13건: ' + $('#kAll').textContent);
assert($('#kNeed').textContent === '6', '연가 끄면 보결 6일: ' + $('#kNeed').textContent);
yeonga().click(); await wait(100);
assert($('#kAll').textContent === '16', '연가 다시 켜면 16건');
// 대상자: 정다온(영어 전담) → 2건, 담임이 아니라 보결 0일
const who = $('#who'); who.value = '4'; fire(who, 'change'); await wait(100);
assert($('#kAll').textContent === '2' && $('#kNeed').textContent === '0', '정다온만: 2건·보결 0일 — ' + $('#kAll').textContent + '/' + $('#kNeed').textContent);
who.value = '-1'; fire(who, 'change'); await wait(100);
// 복무 없는 날 클릭 → 없음 안내
$$('#grid button.cell').find(c => c.dataset.d === '2').click(); await wait(100);
assert($('#side').innerText.includes('11월 2일') && $('#side').innerText.includes('복무가 없습니다'), '2일 상세: ' + $('#side').innerText);
// 다음 달 → 12월(마지막), 25일 성탄절 휴업일
$('#next').click(); await wait(100);
assert($('#mlabel').textContent.includes('12월'), '다음 달 12월');
assert($('#next').disabled, '12월이 마지막 달');
$$('#grid button.cell').find(c => c.dataset.d === '25').click(); await wait(100);
assert($('#side').innerText.includes('성탄절') && $('#side').innerText.includes('휴업일'), '12/25 휴업일: ' + $('#side').innerText);
return 'ok 9';
