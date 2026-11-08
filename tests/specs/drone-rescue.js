// 85 구조 드론: 첫 화면 장면 → 이륙 → 관성 비행 → 열화상 켜기(온도 표시) → 사람 위 정지 비행으로 구조 → 강아지·불·자동차 구별 → 빠르게 지나가면 구조 안 됨 → 배터리(열화상이면 더 빨리 닳음) → 기지 귀환 결말·점수 저장 → 배터리 방전 결말 → 소리 기본 꺼짐
const T = __test, S = () => T.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
T.manual(true);
ok(text().includes('구조 드론') && $('#ready').classList.contains('on') && S().phase === 'ready', '제목·시작 카드');
ok(S().sound === false && $('#snd').getAttribute('aria-pressed') === 'false', '소리 처음엔 꺼짐');
const x0 = S().x; T.step(40); ok(Math.abs(S().x - x0) > 3, '첫 화면 드론이 날고 있음');
const info = T.info();
ok(info.people.length === 6 && info.decoys.some(d => d.kind === 'dog') && info.decoys.some(d => d.kind === 'fire') && info.decoys.some(d => d.kind === 'car'), '사람 6명·강아지·불·자동차');
$('#start').click(); await wait(20);
let s = S();
ok(s.phase === 'fly' && s.battery === 100 && s.rescued === 0 && Math.hypot(s.x - info.base.x, s.y - info.base.y) < 5, '기지에서 이륙');
// 관성
T.input({ x: 1, y: 0 }); T.step(10); const v1 = S().vx; T.step(10); const v2 = S().vx;
ok(v1 > 40 && v2 > v1, '서서히 빨라짐: ' + v1.toFixed(0) + '→' + v2.toFixed(0));
ok(S().tilt > 0.1, '드론이 진행 방향으로 기울어짐');
T.input(null); const xa = S().x; T.step(15); s = S();
ok(s.x > xa + 20 && s.vx > 10 && s.vx < v2, '손을 떼도 미끄러지다 느려짐');
T.step(200); ok(Math.hypot(S().vx, S().vy) < 15, '결국 정지 비행');
// 열화상
ok($('#temp').textContent.includes('-'), '일반 카메라에선 온도 모름');
$('#thermal').click(); ok(S().thermal === true && $('#thermal').getAttribute('aria-pressed') === 'true', '열화상 켜기');
const p0 = info.people[0];
T.place(p0.x, p0.y); T.step(1);
ok($('#temp').textContent.includes('36.5'), '사람 위 중심 온도 36.5°C: ' + $('#temp').textContent);
T.step(110); s = S();
ok(s.rescued === 1 && $('#toast').textContent.includes('구조') && $('#resN').textContent === '1', '정지 비행으로 구조 신호');
T.step(120); ok(S().rescued === 1, '같은 사람은 한 번만');
const dog = info.decoys.find(d => d.kind === 'dog');
T.place(dog.x, dog.y); T.step(1); ok($('#temp').textContent.includes('38'), '강아지 38°C 안팎');
T.step(110); ok(S().rescued === 1 && $('#toast').textContent.includes('강아지'), '강아지는 구조 대상 아님: ' + $('#toast').textContent);
const fr = info.decoys.find(d => d.kind === 'fire');
T.place(fr.x, fr.y); T.step(1); ok(parseFloat($('#temp').textContent) >= 500, '불길 수백 °C: ' + $('#temp').textContent);
const bf = S().battery; T.step(60); ok(S().rescued === 1 && $('#toast').textContent.includes('불') && bf - S().battery > 1.2, '불 위에선 과열·배터리 더 닳음');
const car = info.decoys.find(d => d.kind === 'car');
T.place(car.x, car.y); T.step(110); ok(S().rescued === 1 && $('#toast').textContent.includes('자동차'), '자동차 엔진 열 구별');
// 빠르게 지나가면 구조 안 됨
const p1 = info.people[1];
T.place(p1.x - 80, p1.y, 400, 0); T.input({ x: 1, y: 0 }); T.step(30); T.input(null);
ok(S().rescued === 1, '빠르게 지나가면 구조 안 됨');
// 배터리: 열화상 켜면 더 빨리 닳음
T.place(info.base.x + 300, info.base.y + 300);
let b0 = S().battery; T.step(120); const dOn = b0 - S().battery;
$('#thermal').click(); b0 = S().battery; T.step(120); const dOff = b0 - S().battery;
ok(dOn > dOff && dOff > 0, '열화상은 전력을 더 씀: ' + dOn.toFixed(2) + ' > ' + dOff.toFixed(2));
// 나머지 구조 후 기지 귀환
for (const p of info.people.slice(1)) { T.place(p.x, p.y); T.step(110); }
ok(S().rescued === 6, '6명 모두 구조');
T.place(info.base.x, info.base.y); T.step(30); s = S();
ok(s.phase === 'end' && $('#result').classList.contains('on') && $('#rTitle').textContent.includes('완료') && $('#result').innerText.includes('6/6'), '기지 귀환 결말');
ok(s.score >= 600 && $('#rScore').textContent.includes(String(s.score)), '점수: ' + s.score);
const rec = JSON.parse(localStorage.getItem('edu-expo-drone-rescue-v1'));
ok(rec && rec.best === s.score && rec.missions === 1, '최고 점수 저장');
$('#again').click(); await wait(10); s = S();
ok(s.phase === 'fly' && s.battery === 100 && s.rescued === 0, '다시 출동');
T.setBattery(0.05); T.step(5);
ok(S().phase === 'end' && $('#rTitle').textContent.includes('배터리'), '배터리 방전 결말');
$('#home').click(); ok(S().phase === 'ready' && $('#recLine').textContent.includes(String(rec.best)), '처음으로·최고 점수 표시');
return 'ok ' + n;
