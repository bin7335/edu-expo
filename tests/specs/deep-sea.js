// 77 심해 잠수정: 첫 화면 장면 → 잠수 시작 → 관성 조종 → 수심별 구역·밝기·수압·수온 → 손전등으로 생물 발견(도감) → 손전등 끄면 심해에서 못 찾음 → 전력 감소 → 바닥 도착 결말·기록 저장 → 전력 바닥 결말 → 소리 기본 꺼짐
const T = __test, S = () => T.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
T.manual(true);
ok(text().includes('심해 잠수정') && $('#ready').classList.contains('on') && S().phase === 'ready', '제목·시작 카드');
ok(S().sound === false && $('#snd').getAttribute('aria-pressed') === 'false', '소리 처음엔 꺼짐');
const a0 = S().anim; T.step(30); ok(S().anim !== a0, '첫 화면부터 물고기가 움직임');
// 생물 배치가 실제 서식 수심 범위 안
const info = T.info();
ok(info.creatures.length === 13, '생물 13종');
for (const c of info.creatures) assert(c.depth >= c.min && c.depth <= c.max, c.name + ' 배치 수심 ' + c.depth + '이 서식 범위 밖');
n++;
const zoneOf = d => T.zoneAt(d);
ok(zoneOf(100) === '표층' && zoneOf(500) === '중층' && zoneOf(3000) === '심해층' && zoneOf(8000) === '초심해층', '수심별 구역 이름');
for (const c of info.creatures) assert(c.zone === zoneOf(c.depth), c.name + ' 구역 불일치');
n++;
$('#start').click(); await wait(20);
let s = S();
ok(s.phase === 'dive' && s.depth < 5 && $('#zone').textContent === '표층' && s.light > 0.9, '잠수 시작: 표층, 밝음');
// 관성: 아래로 누르면 점점 빨라지고, 떼어도 한동안 내려감
T.input({ x: 0, y: 1 }); T.step(10); const v1 = S().vy; T.step(20); const v2 = S().vy;
ok(v1 > 30 && v2 > v1, '아래로 가속: ' + v1.toFixed(0) + '→' + v2.toFixed(0));
T.input(null); const y1 = S().y; T.step(20);
ok(S().vy > 20 && S().y > y1 + 10, '손을 떼도 관성으로 내려감');
// 수심에 따라 어둡고 수압·수온 변화
T.place(1200, T.yAt(500)); T.step(1); s = S();
ok($('#zone').textContent === '중층' && s.light < 0.5 && s.light > 0, '500m 중층: 어스름 ' + s.light.toFixed(2));
T.place(1200, T.yAt(1500)); T.step(1); s = S();
ok(s.light === 0 && $('#zone').textContent === '심해층', '1500m: 햇빛 0');
ok($('#press').textContent === '151 기압' && Math.abs(s.depth - 1500) < 3, '1500m 수압 151기압: ' + $('#press').textContent);
ok(parseFloat($('#temp').textContent) < 5, '심해 수온 4°C 안팎: ' + $('#temp').textContent);
// 손전등으로 발견
const angler = info.creatures.find(c => c.name === '초롱아귀');
T.place(angler.x - 160, angler.y); T.aim(0); T.step(60); s = S();
ok(s.found.includes(angler.id) && $('#found').classList.contains('on') && $('#found').innerText.includes('초롱아귀') && $('#dexN').textContent === '1', '손전등 비추면 초롱아귀 발견');
// 손전등을 끄면 심해에서는 안 보임
const dumbo = info.creatures.find(c => c.name === '덤보문어');
$('#lamp').click(); ok(S().lamp === false && $('#lamp').getAttribute('aria-pressed') === 'false', '손전등 끄기');
T.place(dumbo.x - 160, dumbo.y); T.aim(0); T.step(90);
ok(!S().found.includes(dumbo.id), '불 끄면 덤보문어를 못 찾음');
$('#lamp').click(); T.step(60);
ok(S().found.includes(dumbo.id), '다시 켜니 발견');
// 다른 쪽을 비추면 못 찾음
const snail = info.creatures.find(c => c.name === '마리아나꼼치');
T.place(snail.x - 160, snail.y); T.aim(Math.PI); T.step(60);
ok(!S().found.includes(snail.id), '반대쪽 비추면 못 찾음');
T.aim(0); T.step(60); ok(S().found.includes(snail.id), '바로 비추면 발견');
// 표층은 햇빛만으로도 보임
const turtle = info.creatures.find(c => c.name === '푸른바다거북');
T.place(turtle.x - 120, turtle.y); T.aim(Math.PI); T.step(60);
ok(S().found.includes(turtle.id), '표층은 햇빛으로 발견');
// 도감
$('#dexBtn').click(); await wait(10);
ok($('#dex').classList.contains('on') && $$('#dexGrid .dx.got').length === 4 && $$('#dexGrid .dx').length === 13, '도감 4/13');
ok($('#dexGrid').innerText.includes('???'), '못 찾은 생물은 ???');
$('#dexClose').click(); ok(!$('#dex').classList.contains('on'), '도감 닫기');
// 전력 감소
const p0 = S().power; T.step(120); ok(S().power < p0, '전력 감소');
// 바닥까지
T.aim(null); T.place(1200, T.yAt(10800)); T.input({ x: 0, y: 1 }); T.step(120); s = S();
ok(s.phase === 'end' && $('#result').classList.contains('on') && $('#rTitle').textContent.includes('바닥'), '해구 바닥 도착 결말');
ok($('#result').innerText.includes('10,900') && $('#result').innerText.includes('1,091 기압'), '최대 수심·수압 표시');
const rec = JSON.parse(localStorage.getItem('edu-expo-deep-sea-v1'));
ok(rec && rec.dex.length === 4 && rec.deepest >= 10890 && rec.dives === 1, '도감·최대 수심 저장');
T.input(null);
$('#again').click(); await wait(10); s = S();
ok(s.phase === 'dive' && s.depth < 5 && s.power === 100 && s.found.length === 0, '다시 잠수');
T.setPower(0.05); T.step(10);
ok(S().phase === 'end' && $('#rTitle').textContent.includes('전력'), '전력이 다 떨어지면 끝');
$('#home').click(); ok(S().phase === 'ready' && $('#ready').classList.contains('on'), '처음으로');
ok($('#recLine').textContent.includes('4/13'), '모은 도감 기록 표시: ' + $('#recLine').textContent);
return 'ok ' + n;
