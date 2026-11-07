// 35 시간표: 칩 고르고 칸 누르기·지우개·칸 바꾸기·끌어 놓기, 시수 합계/목표 비교/연간 시수, 전담, 설정, TV 모드
// (예시 시간표 값에 기대지 않고, 모두 비운 뒤 직접 채워 검증)
const tt = window.__tt;
assert(tt, '__tt 가 있어야 함');
const cell = (d, p) => $(`.cell[data-d="${d}"][data-p="${p}"]`);
const chip = id => $(`[data-chip="${id}"]`);
const row = name => $$('#sumBody tr').find(r => r.querySelector('.nm').textContent.startsWith(name));
const filled = () => $$('#tt .cell.f').length;
// 1) 모두 비우기(확인 창은 러너가 수락)
$('#clearBtn').click(); await wait(100);
assert(filled() === 0 && $('#totA').textContent === '0' && $('#kAll').textContent === '0', '모두 비움');
// 2) 국어 칩 → 월1, 화1, 수2 (칩 선택 상태로 연속 배치)
chip('kor').click(); cell(0, 0).click(); cell(1, 0).click(); cell(2, 1).click();
assert(tt.counts().kor === 3 && filled() === 3, '국어 3칸: ' + tt.counts().kor);
assert(chip('kor').querySelector('.n').textContent === '3 / ' + tt.state().targets.kor, '칩 시수 표시: ' + chip('kor').querySelector('.n').textContent);
assert(cell(0, 0).textContent.includes('국어') && /국어 3\//.test($('#msg').textContent), '칸·안내 문구');
// 같은 칩 다시 누르면 선택 해제 → 빈 칸 눌러도 배치 안 됨
chip('kor').click(); cell(4, 5).click();
assert(filled() === 3 && /교과 칩/.test($('#msg').textContent), '선택 해제 후 빈 칸은 안내만');
// 3) 지우개
chip('erase').click(); cell(1, 0).click();
assert(tt.counts().kor === 2 && !cell(1, 0).classList.contains('f'), '지우개로 비우기');
chip('erase').click();
// 4) 탭으로 칸 바꾸기(채운 칸 → 빈 칸 = 옮기기), 같은 칸 두 번 = 취소
cell(0, 0).click(); assert(cell(0, 0).classList.contains('pick'), '칸 고름');
cell(0, 0).click(); assert(!cell(0, 0).classList.contains('pick') && /취소/.test($('#msg').textContent), '같은 칸 다시 누르면 취소');
cell(0, 0).click(); cell(4, 5).click();
assert(!tt.state().grid[0][0] && tt.state().grid[4][5] === 'kor', '월1 → 금6 옮기기');
// 5) 마우스로 끌어 놓기: 수학 칩 → 화3
const drag = (from, to) => {
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2, bx = b.left + b.width / 2, by = b.top + b.height / 2;
  from.dispatchEvent(new PointerEvent('pointerdown', { clientX: ax, clientY: ay, pointerType: 'mouse', bubbles: true }));
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: ax + 10, clientY: ay + 10, pointerType: 'mouse', bubbles: true }));
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: bx, clientY: by, pointerType: 'mouse', bubbles: true }));
  window.dispatchEvent(new PointerEvent('pointerup', { clientX: bx, clientY: by, pointerType: 'mouse', bubbles: true }));
  document.dispatchEvent(new MouseEvent('click', { bubbles: true })); // 끌기 뒤 따라오는 클릭은 무시돼야 함
};
cell(1, 2).scrollIntoView({ block: 'center' });
drag(chip('math'), cell(1, 2));
assert(tt.state().grid[1][2] === 'math', '칩 끌어 놓기: ' + tt.state().grid[1][2]);
assert(!$('.dragghost'), '끌기 그림자 정리');
// 칸끼리 끌어서 맞바꾸기
drag(cell(1, 2), cell(2, 1));
assert(tt.state().grid[1][2] === 'kor' && tt.state().grid[2][1] === 'math', '칸 끌어 맞바꾸기');
// 6) 시수 합계·목표 비교·연간 시수
const tgt = row('국어').querySelector('input[data-target]');
tgt.value = '2'; fire(tgt, 'input'); await wait(500);
assert(row('국어').textContent.includes('✓ 맞음'), '목표와 같으면 맞음: ' + row('국어').textContent);
const weeks = (+tt.state().w1) + (+tt.state().w2);
assert(row('국어').children[4].textContent === (2 * weeks) + '시간', '연간 시수 = 주당 × 주수');
const tm = row('수학').querySelector('input[data-target]'); tm.value = '0'; fire(tm, 'input'); await wait(500);
assert(row('수학').textContent.includes('+1 초과'), '초과 표시');
row('사회').querySelector('input[data-target]').value = '2'; fire(row('사회').querySelector('input[data-target]'), 'input'); await wait(500);
assert(row('사회').textContent.includes('-2 부족'), '부족 표시');
const totT = Object.values(tt.state().targets).reduce((a, b) => a + (+b), 0);
assert($('#totA').textContent === '3' && $('#totT').textContent === String(totT), '합계: ' + $('#totA').textContent + '/' + $('#totT').textContent);
$('#w1').value = '10'; fire($('#w1'), 'change'); $('#w2').value = '30'; fire($('#w2'), 'change');
assert(tt.state().w2 === 25 && $('#totY').textContent === (3 * 35) + '시간', '주수 제한(최대 25)·연간 합계: ' + $('#totY').textContent);
// 7) 설정: 반 이름·1교시 시각·전담(국어 전담 지정 → 전담 시간 = 국어 시수)
$('#setBtn').click();
assert($('#setModal').classList.contains('on'), '설정 창 열림');
$('#sClass').value = '테스트 6-1';
$('[data-time="0"]').value = '08:50';
$$('[data-jeon]').forEach(c => { c.checked = false; });
$('[data-jeon="kor"]').checked = true; $('[data-jt="kor"]').value = '국어실 테선생';
$('#sSave').click();
assert($('#clsName').textContent === '테스트 6-1' && $('#printTitle').textContent === '테스트 6-1 시간표', '반 이름');
assert($('.p small').textContent === '08:50', '1교시 시각');
assert($('#kJeon').textContent === '2' && $('#kHome').textContent === '1', '전담·담임 시간: ' + $('#kJeon').textContent + '/' + $('#kHome').textContent);
assert(cell(1, 2).querySelector('.jb') && cell(1, 2).textContent.includes('국어실 테선생'), '전담 칸 표시');
// 8) TV 모드: 6교시 목록, 끝 시각 = 시작 + 40분, Esc로 닫기
$('#tvBtn').click();
assert($('#tv').classList.contains('on') && $$('#tvList .tv-row').length === 6, 'TV 6교시');
assert($$('#tvList .tv-row')[0].querySelector('.tm').textContent === '08:50-09:30', '끝 시각 계산: ' + $$('#tvList .tv-row')[0].querySelector('.tm').textContent);
assert($('#tvClass').textContent.includes('테스트 6-1') && $('#tvNow').textContent.length > 0, 'TV 머리');
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
assert(!$('#tv').classList.contains('on'), 'Esc로 TV 닫기');
// 9) 저장 후 1학년 세트 불러오기: 칩이 1학년 교과로 바뀌고 합계 일치
const saved = JSON.parse(localStorage.getItem('timetable-v1'));
assert(saved.cls === '테스트 6-1' && saved.grid[4][5] === 'kor', '저장');
$('#angyeBtn').click(); await wait(100);
assert(tt.state().set === 'g1' && chip('jeul') && !chip('sci'), '1학년 교과 칩');
const sum = Object.values(tt.counts()).reduce((a, b) => a + b, 0);
assert(sum === filled() && $('#totA').textContent === String(sum), '1학년 합계 = 채운 칸 수: ' + sum);
return 'ok 9';
