// 43 로봇 길찾기: 8개 레벨 모두 최소 블록(par) 해답으로 성공 ★★★, 나무·바위 충돌, 길 밖, 보석 안 모으면 실패, 별 개수
const blk = t => $(`.palette .blk[data-t="${t}"]`).click();
const lvBtn = i => $(`#levels .lv[data-l="${i}"]`).click();
const runAll = async () => { for (let k = 0; k < 80 && !st.done; k++) { $('#step').click(); await wait(5); } await wait(550); };
const build = (prog, n) => { for (const t of prog) blk(t); if (n) { const b = () => $('#prog .n'); while (+b().textContent !== n) b().click(); } };
// [레벨, 블록, 반복 횟수] — 각 레벨의 최소 블록 해답
const SOL = [
  [0, 'FFF'], [1, 'FFLFFF'], [2, 'LFRFF'], [3, 'PF', 6],
  [4, 'PFRFL', 4], [5, 'PFFFFR', 3], [6, 'PFFRFL', 3], [7, 'PFFFFL', 3]
];
for (const [lv, prog, n] of SOL) {
  lvBtn(lv); await wait(50);
  build(prog, n);
  assert(blockCount() === LEVELS[lv].par, `레벨 ${lv + 1} 블록 수 ${blockCount()} = par ${LEVELS[lv].par}`);
  await runAll();
  assert($('#modal').classList.contains('on') && $('#mbox h2').textContent === `레벨 ${lv + 1} 성공!`, `레벨 ${lv + 1} 성공: ` + $('#msg').innerText);
  assert($('#mbox .st').textContent === '⭐⭐⭐', `레벨 ${lv + 1} 최소 블록 ★★★: ` + $('#mbox .st').textContent);
  $('#again').click(); await wait(50);
}
assert(JSON.parse(localStorage.getItem('edu-expo-robot-path-v1'))[7] === 3, '별 기록 저장');
// 바위 충돌: 레벨 3에서 바로 앞으로
lvBtn(2); await wait(50); blk('F'); await runAll();
assert($('#msg').innerText.includes('바위에 부딪혔어요') && !$('#modal').classList.contains('on'), '바위 충돌 실패: ' + $('#msg').innerText);
// 나무 충돌: 레벨 1에서 왼쪽(위) 돌고 앞으로 → 🌳
lvBtn(0); await wait(50); blk('L'); blk('F'); await runAll();
assert($('#msg').innerText.includes('나무에 부딪혔어요'), '나무 충돌: ' + $('#msg').innerText);
// 길 밖: 오른쪽(아래) 돌고 앞으로 2번
$('#clear').click(); blk('R'); blk('F'); blk('F'); await runAll();
assert($('#msg').innerText.includes('길 밖'), '길 밖 실패: ' + $('#msg').innerText);
// 보석 안 모으고 깃발: 레벨 6에서 오른쪽으로 4칸
lvBtn(5); await wait(50); for (const t of 'RFFFF') blk(t); await runAll();
assert($('#msg').innerText.includes('보석을 다 모아야') && !$('#modal').classList.contains('on'), '보석 미수집 실패: ' + $('#msg').innerText);
// 블록 5개(par+2)로 레벨 1 성공 → ★★
lvBtn(0); await wait(50); for (const t of 'FFLRF') blk(t); await runAll();
assert($('#mbox .st').textContent === '⭐⭐☆', 'par+2개 → ★★: ' + $('#mbox .st').textContent);
$('#again').click();
// 반복 블록은 레벨 4부터
lvBtn(0); await wait(50);
assert($('#repBtn').disabled, '레벨 1에서 반복 잠김');
return 'ok 30';
