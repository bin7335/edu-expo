// 94 모둠척척: 여러 시드로 편성해도 인원·성비·수준·떼어 놓기·같이 두기·모둠장 조건이 지켜지고, 시드 재현, 눌러서 바꾸기 → 위반 경고, 역할 배정, 모둠당 인원 모드, 저장
const gm = window.__gm;
assert(gm, '__gm 가 있어야 함');
const roster = $('#roster').value.trim().split('\n').map(l => l.split(/\t|,|\s+/).filter(Boolean));
const info = {}; roster.forEach(r => { info[r[1]] = { g: r[2], l: r[3] }; });
const N = roster.length;
assert(N === 26, '예시 26명: ' + N);
const groups = () => $$('#groups .grp').map(g => ({ names: [...g.querySelectorAll('.mem .nm')].map(x => x.textContent), leaders: [...g.querySelectorAll('.mem.leader .nm')].map(x => x.textContent), roles: [...g.querySelectorAll('.mem .role')].map(x => x.textContent) }));
const sep = [['박지호', '최민준'], ['강시우', '윤도현'], ['김하늘', '정예린']], tog = [['이서준', '한유찬']], fixedLeaders = ['김하늘', '장서아'];
const M = Object.values(info).filter(x => x.g === '남').length;
const LV = { 상: 0, 중: 0, 하: 0 }; Object.values(info).forEach(x => LV[x.l]++);
function check(tag) {
  const G = groups(), where = {};
  assert(G.length === 6, tag + ': 모둠 6개');
  assert(G.map(g => g.names.length).join() === '5,5,4,4,4,4', tag + ': 인원 ' + G.map(g => g.names.length));
  G.forEach((g, i) => g.names.forEach(n => { assert(!(n in where), tag + ': 중복 ' + n); where[n] = i; }));
  assert(Object.keys(where).length === N, tag + ': 모두 한 번씩');
  for (const [a, b] of sep) assert(where[a] !== where[b], `${tag}: 떼어 놓기 ${a}·${b}`);
  for (const [a, b] of tog) assert(where[a] === where[b], `${tag}: 같이 두기 ${a}·${b}`);
  G.forEach((g, i) => {
    const s = g.names.length, m = g.names.filter(n => info[n].g === '남').length, ideal = s * M / N;
    assert(m >= Math.floor(ideal) && m <= Math.ceil(ideal), `${tag}: ${i + 1}모둠 남 ${m}명 (기대 ${ideal.toFixed(2)})`);
    for (const l of ['상', '중', '하']) { const c = g.names.filter(n => info[n].l === l).length, id = s * LV[l] / N; assert(c >= Math.floor(id) && c <= Math.ceil(id), `${tag}: ${i + 1}모둠 ${l} ${c}명 (기대 ${id.toFixed(2)})`); }
    assert(g.leaders.length === 1, `${tag}: ${i + 1}모둠 모둠장 1명 (${g.leaders})`);
    assert(new Set(g.roles).size === g.roles.length && g.roles.includes('모둠장'), `${tag}: 역할 겹치지 않음 ${g.roles}`);
  });
  for (const n of fixedLeaders) assert(G[where[n]].leaders[0] === n, `${tag}: 지정 모둠장 ${n}`);
  assert($$('#verify .ok').length >= 5 && !$('#verify .bad'), tag + ': 검증 표시 ' + $('#verify').textContent);
}
check('처음');
const seen = new Set();
const snap = () => groups().map(g => g.names.join('/')).join('|');
for (let k = 0; k < 6; k++) { $('#shuffle').click(); await wait(80); check(`${k + 1}번째 섞기`); seen.add(snap()); }
assert(seen.size >= 5, '섞을 때마다 달라야 함: ' + seen.size);
// 시드 재현
$('#seed').value = '햇살2026'; $('#make').click(); await wait(50);
const a1 = snap(); check('시드');
$('#shuffle').click(); await wait(50);
assert(snap() !== a1 && $('#seed').value !== '햇살2026', '다시 섞기는 새 시드');
$('#seed').value = '햇살2026'; $('#make').click(); await wait(50);
assert(snap() === a1, '같은 시드 → 같은 편성');
// 모둠 이름 자동(동물)
assert(/사자/.test($$('#groups .grp .gname')[0].value), '모둠 이름: ' + $$('#groups .grp .gname')[0].value);
// 눌러서 바꾸기: 박지호를 최민준 모둠 사람과 맞바꾸면 떼어 놓기 위반 경고
const G0 = groups(), where = {}; G0.forEach((g, i) => g.names.forEach(n => where[n] = i));
const chip = n => $$('#groups .mem').find(c => c.querySelector('.nm').textContent === n);
const other = G0[where['최민준']].names.find(n => n !== '최민준' && !fixedLeaders.includes(n) && !tog.flat().includes(n) && info[n].g === '남' && info[n].l === '중') || G0[where['최민준']].names.find(n => n !== '최민준' && !fixedLeaders.includes(n) && !tog.flat().includes(n));
chip('박지호').click();
assert(chip('박지호').classList.contains('sel'), '선택 표시');
chip(other).click();
const G1 = groups();
assert(G1[where['최민준']].names.includes('박지호') && G1[where['박지호']].names.includes(other), '맞바꾸기');
assert($('#verify .bad') && /박지호/.test($('#verify .bad').textContent), '위반 경고: ' + $('#verify').textContent);
// 같은 모둠 안에서 누르면 선택만 바뀜
// 역할 다시 나누기는 위반을 없애지 않음(사람은 그대로)
$('#reroles').click();
assert(groups()[where['최민준']].names.includes('박지호'), '역할 다시 나누기는 사람 그대로');
// 역할 목록 바꾸기
$('#roles').value = '모둠장, 기록이, 발표이'; fire($('#roles'), 'change');
const rs = groups()[0].roles;
assert(rs.includes('모둠장') && rs.includes('기록이') && rs.includes('발표이') && (rs.length < 4 || rs.includes('도우미')), '역할 목록 반영: ' + rs);
// 모둠당 인원 모드: 4명씩 → 6모둠(5,5,4,4,4,4)
$('#modeSize').checked = true; fire($('#modeSize'), 'change'); $('#size').value = '5'; fire($('#size'), 'change');
$('#make').click(); await wait(50);
assert(groups().map(g => g.names.length).join() === '6,5,5,5,5', '5명씩 → 5모둠: ' + groups().map(g => g.names.length));
$('#size').value = '4'; fire($('#size'), 'change'); $('#make').click(); await wait(50);
$('#roles').value = '모둠장, 기록이, 발표이, 칭찬이, 시간지기'; fire($('#roles'), 'change');
check('4명씩');
// 명단에 없는 이름이 조건에 있으면 알려 줌
$('#sep').value = '박지호-최민준\n없는사람-김하늘'; fire($('#sep'), 'change'); $('#make').click(); await wait(50);
assert(/없는사람/.test($('#verify').textContent), '명단에 없는 이름 안내: ' + $('#verify').textContent);
// 인쇄
$('#printBtn').click();
assert(window.__printed >= 1, '인쇄');
// 저장
await wait(400);
const st = JSON.parse(localStorage.getItem('edu-expo.group-maker.v1') || 'null');
assert(st && st.groups.length === 6 && st.mode === 'size' && /없는사람/.test(st.sep), '저장');
return 'ok 9';
