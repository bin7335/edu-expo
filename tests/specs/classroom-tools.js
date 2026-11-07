// 08 척척 교실판: 타이머 설정·진행, 번호 뽑기 중복 없음, 모둠 편성 인원 균등
const tab = t => $(`#tabs button[data-t="${t}"]`).click();
// 1) 타이머 프리셋·조절·시작/정지
tab('timer');
$('.presets .btn[data-m="1"]').click();
assert($('#tDisp').textContent === '01:00', '1분 프리셋: ' + $('#tDisp').textContent);
$('.adj .btn[data-a="10"]').click();
assert($('#tDisp').textContent === '01:10', '+10초: ' + $('#tDisp').textContent);
$('.adj .btn[data-a="-60"]').click(); $('.adj .btn[data-a="-60"]').click();
assert($('#tDisp').textContent === '00:10', '최소 10초로 막혀야 함: ' + $('#tDisp').textContent);
$('.presets .btn[data-m="3"]').click();
$('#tStart').click(); await wait(1300);
const shown = $('#tDisp').textContent;
assert(shown === '02:58' || shown === '02:59', '1.3초 뒤 2:58-2:59: ' + shown);
assert($('#tStart').textContent.includes('일시정지'), '진행 중 버튼은 일시정지');
$('#tStart').click(); await wait(1100);
assert($('#tDisp').textContent === shown, '일시정지하면 멈춰야 함');
$('#tReset').click();
assert($('#tDisp').textContent === '03:00', '다시 → 03:00');

// 2) 번호 뽑기: 1-3번을 중복 없이 모두 뽑고 나면 "모두 뽑았어요"
tab('pick');
$('#nFrom').value = 1; $('#nTo').value = 3; fire($('#nTo'), 'input');
assert($('#remain').textContent.includes('3명'), '남은 후보 3명: ' + $('#remain').textContent);
const got = [];
for (let i = 0; i < 3; i++) {
  $('#pGo').click();
  for (let t = 0; t < 60 && !$('#pRes').classList.contains('done'); t++) await wait(100);
  assert($('#pRes').classList.contains('done'), '뽑기가 끝나야 함');
  got.push($('#pRes').textContent);
  $('#pRes').className = 'result';
}
assert(new Set(got).size === 3 && got.every(g => /^[123]번$/.test(g)), '1-3번이 한 번씩: ' + got.join(','));
assert($$('#pHist .chip').length === 3, '기록 칩 3개');
$('#pGo').click(); await wait(100);
assert($('#pRes').textContent.includes('모두 뽑았'), '다 뽑으면 안내: ' + $('#pRes').textContent);
$('#pClear').click();
assert($$('#pHist .chip').length === 0 && $('#remain').textContent.includes('남은 후보 3명'), '기록 지우기');

// 3) 모둠 편성: 24명 → 4모둠 6명씩, 5모둠이면 5/5/5/5/4, 이름 누락·중복 없음
tab('group');
const names = $('#gNames').value.split('\n').map(s => s.trim()).filter(Boolean);
for (const n of [4, 5]) {
  while (Number($('#gN').textContent) < n) $('#gPlus').click();
  while (Number($('#gN').textContent) > n) $('#gMinus').click();
  $('#gGo').click(); await wait(50);
  const teams = $$('#gBoard .team');
  assert(teams.length === n, `${n}모둠: ` + teams.length);
  const sizes = teams.map(t => t.querySelectorAll('li').length);
  assert(Math.max(...sizes) - Math.min(...sizes) <= 1, '모둠 인원 차이 1 이하: ' + sizes);
  const all = $$('#gBoard li').map(l => l.textContent);
  assert(all.length === names.length && new Set(all).size === names.length && names.every(x => all.includes(x)), '모든 이름이 한 번씩');
}
// 이름에 태그를 넣어도 글자로 표시
$('#gNames').value = '<b>철수</b>,영희'; fire($('#gNames'), 'input'); $('#gGo').click(); await wait(50);
assert(!$('#gBoard b') && $('#gBoard').textContent.includes('<b>철수</b>'), '이름 태그 이스케이프');
return 'ok';
