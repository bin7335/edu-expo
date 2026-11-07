// 14 쉿쉿 신호등: 기준값 조절·연동·저장, 기준을 낮추면 빨간불(횟수 증가), 높이면 초록불(유지 시간 증가), 초기화, 체험 끄기, 마이크 켜기
const st = window.__noiseLight;
const setR = (id, v) => { const el = $('#' + id); el.value = v; fire(el, 'input'); };
const lit = () => ['R', 'Y', 'G'].filter(k => $('#lamp' + k).classList.contains('on'));
const until = async (fn, ms) => { for (let t = 0; t < ms; t += 100) { if (fn()) return true; await wait(100); } return false; };
// 1) 기준값: 빨강을 노랑 가까이 내리면 노랑이 따라 내려가고(최소 5 차이), 눈금·저장 반영
setR('thY', 45); setR('thR', 30);
assert(Number($('#thRv').textContent) === 30 && Number($('#thYv').textContent) === 25, '빨강 30 → 노랑 25: ' + $('#thYv').textContent);
setR('thY', 60);
assert(Number($('#thRv').textContent) === 65, '노랑 60 → 빨강 65로 밀림: ' + $('#thRv').textContent);
assert($('#tickY').style.left === '60%' && $('#tickR').style.left === '65%', '눈금 위치');
const sv = JSON.parse(localStorage.getItem('noise-light-v1'));
assert(sv.thY === 60 && sv.thR === 65, '기준값 저장');
// 2) 기준을 아주 낮추면 빨간불·경고 문구·빨간불 횟수 증가, 유지 시간 0
$('#resetBtn').click();
assert(st.redCount === 0 && st.best === 0 && st.hist.length === 0, '초기화 → 기록 0');
// 이미 빨간불인 채로 초기화되면 횟수가 안 늘어나므로, 먼저 초록불로 내린 뒤 기준을 낮춘다
setR('thR', 100); setR('thY', 90);
assert(await until(() => st.light === 'green', 5000), '먼저 초록불');
const rc0 = st.redCount;
setR('thY', 10); setR('thR', 15);
assert(await until(() => st.light === 'red', 4000), '빨간불이 켜져야 함');
assert(st.redCount === rc0 + 1, `빨간불이 켜지면 횟수 +1: ${rc0}→${st.redCount}`);
await wait(100);
assert(lit().join() === 'R', '빨간 램프만 켜짐: ' + lit());
assert($('#status').textContent.includes('시끄러워요') && Number($('#redCount').textContent) >= 1, '빨간불 문구·횟수: ' + $('#redCount').textContent);
assert($('#streak').textContent === '0:00', '빨간불이면 유지 시간 0');
assert($('#meterFill').style.background.includes('--red') || Number($('#levelNum').textContent) < 15, '미터 색');
// 3) 기준을 아주 높이면 (1.2초 뒤) 초록불, 유지 시간이 늘어난다
setR('thR', 100); setR('thY', 90);
assert(await until(() => st.light === 'green', 5000), '초록불로 내려와야 함');
const s0 = st.streak; await wait(1200);
assert(st.light !== 'green' || st.streak > s0 + 0.8, `초록이면 유지 시간 증가 ${s0}→${st.streak}`);
assert(/^\d+:\d\d$/.test($('#streak').textContent) && $('#fullTimerV').textContent === $('#streak').textContent, '유지 시간 표시');
// 4) 체험 끄기 → 멈춤, 조용한 상태 버튼은 안내만
$('#demoToggle').click();
await wait(100);
assert($('#modeBadge').textContent.includes('멈춤') && $('#status').textContent.includes('마이크를 켜'), '체험 끄면 멈춤');
assert(lit().length === 0, '멈추면 램프 꺼짐');
$('#calBtn').click();
assert($('#hint').textContent.includes('먼저 마이크'), '멈춤 상태 보정 안내');
// 5) 다시 체험 켜기 → 기록 초기화되고 다시 움직임
$('#demoToggle').click();
assert($('#modeBadge').textContent.includes('체험') && st.hist.length === 0, '체험 다시 켜기');
await wait(600);
assert(st.hist.length >= 1, '그래프 기록이 다시 쌓임');
// 6) 마이크 켜기(가짜 장치) → 측정 중, 다시 누르면 끔
$('#micBtn').click();
await until(() => st.mode === 'mic' || $('#hint').classList.contains('err'), 3000);
if (st.mode === 'mic') {
  assert($('#modeBadge').textContent.includes('마이크 측정') && $('#micBtn').textContent.includes('끄기'), '마이크 모드 표시');
  $('#micBtn').click();
  assert(st.mode === 'off' && $('#micBtn').textContent.includes('켜기'), '마이크 끄기');
}
return 'ok mode=' + st.mode;
