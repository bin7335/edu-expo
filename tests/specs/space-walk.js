// 76 우주 산책: 첫 화면 장면 → 출발 → 흔들림(조준 이탈 시 감속) → 조준해 접근 → 행성 도착·정보(지름·온도·하루) → 도장 → 8개 행성 순서대로 → 여행 완료·기록 저장 → 소리(기본 꺼짐)
const T = __test, S = () => T.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const cl = v => Math.max(-1, Math.min(1, v));
T.manual(true);
ok(text().includes('우주 산책') && $('#ready').classList.contains('on') && S().phase === 'ready', '제목·시작 카드');
ok(S().sound === false && $('#snd').getAttribute('aria-pressed') === 'false', '소리는 처음에 꺼짐(자동 재생 없음)');
const z0 = S().starSum; T.step(30);
ok(S().starSum !== z0, '첫 화면부터 별이 흘러감');
$('#start').click(); await wait(20);
let s = S();
ok(s.phase === 'fly' && s.target === '수성' && s.idx === 0 && $('#dest').textContent === '수성', '출발: 첫 목적지 수성');
// 조종하지 않으면 행성이 조준선에서 벗어나고 속도가 줄어듦
T.input(null); T.step(300); s = S();
ok(Math.hypot(s.ox, s.oy) > 60 && s.align < 0.8, '흔들려 조준 이탈: ' + Math.hypot(s.ox, s.oy).toFixed(0));
const fly = (boost, max = 4000) => { for (let f = 0; f < max; f++) { const q = S(); if (q.phase !== 'fly') { T.input(null); return f; }
  T.input({ x: cl(q.ox / 60 + q.vx / 200), y: cl(q.oy / 60 + q.vy / 200), boost }); T.step(1); } return max; };
// 부스터가 더 빠름
for (let i = 0; i < 40; i++) { const q = S(); T.input({ x: cl(q.ox / 60 + q.vx / 200), y: cl(q.oy / 60 + q.vy / 200) }); T.step(1); }
const d1 = S().dist; for (let i = 0; i < 45; i++) { const q = S(); T.input({ x: cl(q.ox / 60 + q.vx / 200), y: cl(q.oy / 60 + q.vy / 200) }); T.step(1); }
const slow = d1 - S().dist; const d2 = S().dist;
for (let i = 0; i < 45; i++) { const q = S(); T.input({ x: cl(q.ox / 60 + q.vx / 200), y: cl(q.oy / 60 + q.vy / 200), boost: true }); T.step(1); }
const fast = d2 - S().dist;
ok(fast > slow * 1.5 && slow > 0, '부스터로 더 빨리 접근: ' + slow.toFixed(1) + '→' + fast.toFixed(1));
const FACTS = {
  수성: ['4,879 km', '167°C', '58.6일', '0.38배'], 금성: ['12,104 km', '464°C', '243일', '0.95배'], 지구: ['12,756 km', '15°C', '23시간 56분', '1배'],
  화성: ['6,792 km', '-65°C', '24시간 37분', '0.53배'], 목성: ['142,984 km', '-110°C', '9시간 56분', '11.2배'], 토성: ['120,536 km', '-140°C', '10시간 34분', '9.45배'],
  천왕성: ['51,118 km', '-195°C', '17시간 14분', '4.01배'], 해왕성: ['49,528 km', '-200°C', '16시간 6분', '3.88배']
};
const ORDER = ['수성', '금성', '지구', '화성', '목성', '토성', '천왕성', '해왕성'];
for (let i = 0; i < 8; i++) {
  const f = fly(i % 2 === 1);
  s = S();
  ok(s.phase === 'orbit' && s.idx === i && $('#info').classList.contains('on') && $('#infoName').textContent === ORDER[i], ORDER[i] + ' 도착(' + f + '프레임)');
  const tx = $('#info').innerText;
  for (const k of FACTS[ORDER[i]]) assert(tx.includes(k), ORDER[i] + ' 정보에 ' + k + ' 없음: ' + tx.slice(0, 200));
  n++;
  ok($('#stamp').disabled === false && $('#next').hidden, '도장 먼저');
  $('#stamp').click(); await wait(10);
  ok(S().stamps === i + 1 && $('#stampN').textContent === String(i + 1) && !$('#next').hidden, ORDER[i] + ' 도장');
  if (i === 2) ok($('#info').innerText.includes('달'), '지구에서는 달도 소개');
  if (i < 7) { $('#next').click(); await wait(10); ok(S().phase === 'fly' && S().target === ORDER[i + 1], '다음 목적지 ' + ORDER[i + 1]); }
}
ok($('#next').textContent.includes('마치기'), '마지막 행성: 여행 마치기');
$('#next').click(); await wait(20); s = S();
ok(s.phase === 'end' && $('#result').classList.contains('on') && $$('#rStamps .st.got').length === 8, '여행 완료 카드·도장 8개');
const rt = $('#result').innerText;
ok(rt.includes('목성') && rt.includes('금성'), '정리: 가장 큰 행성 목성, 가장 뜨거운 금성');
const rec = JSON.parse(localStorage.getItem('edu-expo-space-walk-v1'));
ok(rec && rec.stamps.length === 8 && rec.best > 0 && rec.trips === 1, '도장·최고 기록 저장');
$('#again').click(); await wait(20);
ok(S().phase === 'fly' && S().stamps === 0 && S().target === '수성', '다시 여행');
$('#snd').click(); ok(S().sound === true && $('#snd').getAttribute('aria-pressed') === 'true', '소리 켜기');
$('#snd').click(); ok(S().sound === false, '소리 끄기');
return 'ok ' + n;
