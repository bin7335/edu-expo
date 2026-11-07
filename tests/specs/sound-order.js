// 56 순서 기억 패드: 출발 → 순서대로 눌러 단계 올리기 → 틀리면 정답 다시 보여 주기 → 결과·최고 기록 저장 → 어려움 6색·소리 토글
const T = window.__test;
const until = async (fn, ms = 8000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error('대기 시간 초과: ' + fn); await wait(10); } };
const pad = i => $(`#pads .pad[data-i="${i}"]`);
T.seed(7); T.speed(0.03);
assert($$('#pads .pad').length === 4, '보통 모드 패드 4개');
assert(T.phase() === 'idle' && $('#best').textContent === '0', '처음은 대기·최고 0');
$('#start').click();
await until(() => T.phase() === 'input');
assert(T.seq().length === 1 && $('#lvl').textContent === '1', '1단계 신호 1개');
// 4단계까지 정답 입력
for (let round = 1; round <= 4; round++) {
  const s = T.seq();
  assert(s.length === round, `${round}단계 신호 ${s.length}개`);
  for (const k of s) { pad(k).click(); await wait(5); }
  assert($$('#dots i.ok').length === round || T.phase() !== 'input', '입력 진행 표시');
  await until(() => T.phase() === 'input' && T.seq().length === round + 1);
  assert(T.seq().slice(0, round).join() === s.join(), '이전 순서는 유지되고 한 칸 늘어남');
}
assert($('#best').textContent === '4', '최고 기록 4단계: ' + $('#best').textContent);
assert(JSON.parse(localStorage.getItem('edu-expo-sound-order-v1')).easy === 4, '최고 기록 저장');
// 첫 칸에서 일부러 틀리기
const s5 = T.seq();
pad((s5[0] + 1) % 4).click();
assert(T.phase() === 'replay', '틀리면 정답 다시 보여 주기 단계');
assert($('#msg').textContent.includes('다시 보여'), '틀림 안내: ' + $('#msg').textContent);
assert($$('#mChips .chip').length === 5 && $$('#mChips .chip.miss').length === 1, '정답 순서 칩 5개, 틀린 위치 표시');
await until(() => T.phase() === 'over');
assert($('#modal').classList.contains('on') && $('#mTitle').textContent === '4단계까지 성공!', '결과: ' + $('#mTitle').textContent);
assert($('#mNew').textContent.includes('최고 기록'), '최고 기록 배지');
// 대기 중 입력은 무시(입력 단계가 아님)
pad(0).click(); assert(T.phase() === 'over', '결과 중 패드 눌러도 그대로');
// 다시 하기 → 1단계부터, 최고 기록은 유지
$('#again').click();
assert(!$('#modal').classList.contains('on') && T.seq().length === 1, '다시 하기 → 1단계');
await until(() => T.phase() === 'input');
pad((T.seq()[0] + 1) % 4).click();
await until(() => T.phase() === 'over');
assert($('#mTitle').textContent === '0단계까지 성공!' && $('#best').textContent === '4', '낮은 기록이 최고 기록을 덮지 않음');
// 어려움 6색
$('#mHard').click();
assert($$('#pads .pad').length === 6 && $('#pads').classList.contains('hard'), '어려움 6개 패드');
assert($('#best').textContent === '0' && $('#bestMode').textContent === '어려움', '어려움 최고 기록 따로');
$('#start').click(); await until(() => T.phase() === 'input');
for (const k of T.seq()) pad(k).click();
await until(() => T.seq().length === 2);
assert(JSON.parse(localStorage.getItem('edu-expo-sound-order-v1')).hard === 1, '어려움 기록 저장');
// 소리 끄기 토글(불빛만으로 플레이)
$('#snd').click();
assert($('#snd').textContent.includes('꺼짐') && JSON.parse(localStorage.getItem('edu-expo-sound-order-v1')).sound === false, '소리 끄기 저장');
await until(() => T.phase() === 'input');
for (const k of T.seq()) pad(k).click();
await until(() => T.seq().length === 3);
assert(true, '소리 꺼도 진행');
$('#snd').click(); $('#mEasy').click();
assert($$('#pads .pad').length === 4 && $('#best').textContent === '4', '보통으로 돌아오면 4단계 기록');
return 'ok 26';
