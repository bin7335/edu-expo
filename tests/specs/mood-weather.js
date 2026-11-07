// 45 마음 날씨: 학생 체크인, 학생 화면에 다른 학생 응답 미노출, 처음 PIN 정하기, 틀린 PIN 거부·5회 잠금, 교사 집계·연속 흐림 알림,
// PIN 변경, 체험 모드(1234)는 설정 안에서만, 이 기기의 기록 모두 지우기
const KEY = 'mood-weather-v1';
const pinPress = async s => { for (const k of s) $(`#pad [data-k="${k}"]`).click(); await wait(250); };
const hidden = el => getComputedStyle(el).display === 'none' || !el.offsetParent;
assert(!/1234/.test($('#stu').textContent + $('header').textContent + $('#pinTitle').textContent + $('#pinSub').textContent + $('#pinMsg').textContent), '학생이 보는 화면·PIN 창에 기본 PIN 안내 없음');
assert($('#doneCnt').textContent.startsWith('17'), '예시: 오늘 17명 체크: ' + $('#doneCnt').textContent);
// 2번 학생이 천둥 + 친구 선택 후 보내기
$('#nums [data-n="2"]').click(); await wait(50);
assert($('#ckBox [data-act="send"]').disabled, '날씨·이유 고르기 전엔 보내기 비활성');
$('#ckBox [data-w="storm"]').click(); $('#ckBox [data-r="친구"]').click(); await wait(50);
$('#ckBox [data-act="send"]').click(); await wait(50);
assert($('#ckBox').innerText.includes('고마워요') && $('#ckBox').innerText.includes('선생님께 말해'), '흐린 날 감사 문구: ' + $('#ckBox').innerText);
$('#ckModal').click(); await wait(50);
assert($('#nums [data-n="2"]').classList.contains('done') && $('#doneCnt').textContent.startsWith('18'), '2번 완료, 18명');
// 학생 화면: 다른 학생의 날씨·이유가 보이지 않음
assert(hidden($('#tch')), '학생 화면에서 교사 영역 숨김');
const stuText = $('#stu').innerText;
assert(!/\d+번\s*\(/.test(stuText) && !stuText.includes('일째') && !$('#stu').querySelector('#dist, #watch'), '학생 화면에 응답 목록 없음');
$('#nums [data-n="1"]').click(); await wait(50);
assert($('#ckBox').innerText.includes('벌써 체크') && !$('#ckBox .wx'), '이미 한 번호는 이전 응답을 보여 주지 않음: ' + $('#ckBox').innerText);
$('#ckBox [data-act="close"]').click(); await wait(50);
// 처음 열 때: PIN 정하기(두 번 입력, 다르면 다시)
$('#teachBtn').click(); await wait(50);
assert($('#pinTitle').textContent.includes('정하기') && !document.body.classList.contains('teacher'), '처음엔 PIN 정하기: ' + $('#pinTitle').textContent);
await pinPress('1234');
assert(!document.body.classList.contains('teacher'), '1234로 바로 열리지 않음(확인 입력 필요)');
await pinPress('4321');
assert(!document.body.classList.contains('teacher') && $('#pinMsg').textContent.includes('달라요'), '두 번 다르면 거부');
await pinPress('2580'); await pinPress('2580');
assert(document.body.classList.contains('teacher') && JSON.parse(localStorage.getItem(KEY)).pin === '2580', '새 PIN 2580으로 교사 화면');
// 교사 집계
assert($('#kResp').textContent === '18/24', '체크인 18/24: ' + $('#kResp').textContent);
assert($('#dist').innerText.includes('2번(친구)'), '분포에 2번(친구)');
assert($('#missing').innerText.includes('6, 9, 14, 17, 20, 23'), '미체크 번호: ' + $('#missing').innerText);
const watch = $('#watch').innerText;
assert(/3번[\s\S]*흐린 날 4일째/.test(watch), '3번 흐림 4일 연속: ' + watch);
assert(/11번[\s\S]*흐린 날 3일째/.test(watch), '11번 흐림 3일 연속: ' + watch);
assert(!hidden($('#sWipe')) && $('#tch').innerText.includes('공용'), '교사 화면에 공용 PC 안내·모두 지우기 버튼');
// 잠그고 틀린 PIN 거부, 5번 틀리면 30초 잠금(맞는 PIN도 거부)
$('#lockBtn').click(); await wait(50);
$('#teachBtn').click(); await wait(50);
assert($('#pinTitle').textContent === '🔒 선생님 PIN', '두 번째부터는 PIN 입력');
await pinPress('0000');
assert(!document.body.classList.contains('teacher') && $('#pinMsg').textContent.includes('PIN이 달라요'), '틀린 PIN 거부');
for (let i = 0; i < 4; i++) await pinPress('1111');
assert($('#pinMsg').textContent.includes('잠겼어요'), '5번 틀리면 잠김: ' + $('#pinMsg').textContent);
const until = +localStorage.getItem(KEY + '-lock');
assert(until - Date.now() > 25000 && until - Date.now() <= 30000, '30초 잠금: ' + (until - Date.now()));
await pinPress('2580');
assert(!document.body.classList.contains('teacher'), '잠긴 동안 맞는 PIN도 거부');
localStorage.setItem(KEY + '-lock', String(Date.now() - 1)); // 30초 지남
await pinPress('2580');
assert(document.body.classList.contains('teacher'), '잠금 풀린 뒤 맞는 PIN 통과');
// PIN 변경 → 옛 PIN 거부, 새 PIN 통과
$('#setBtn').click(); $('#sPin').value = '5678'; $('#sSave').click(); await wait(50);
$('#lockBtn').click(); await wait(50);
$('#teachBtn').click(); await pinPress('2580');
assert(!document.body.classList.contains('teacher'), '바꾼 뒤 옛 PIN 거부');
await pinPress('5678');
assert(document.body.classList.contains('teacher'), '새 PIN 통과');
// 체험 모드 안내는 설정 안에만, 누르면 1234
$('#setBtn').click(); await wait(50);
assert($('#setCard').innerText.includes('체험 모드') && $('#setCard').innerText.includes('1234'), '설정 안 체험 모드');
$('#sDemo').click(); await wait(50);
assert(JSON.parse(localStorage.getItem(KEY)).pin === '1234', '체험 모드 PIN 1234');
// 이 기기의 기록 모두 지우기 → 저장 삭제, 학생 화면, 다음엔 PIN 다시 정하기
$('#sWipe').click(); await wait(100);
assert(localStorage.getItem(KEY) === null && !document.body.classList.contains('teacher'), '기록·PIN 삭제 후 학생 화면');
assert($('#doneCnt').textContent.startsWith('0'), '체크 0명');
$('#teachBtn').click(); await wait(50);
assert($('#pinTitle').textContent.includes('정하기'), '지운 뒤엔 PIN 다시 정하기');
$('#pinCancel').click();
return 'ok 31';
