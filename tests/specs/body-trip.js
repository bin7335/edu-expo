// 78 혈관 속 여행: 첫 화면 장면 → 출발(우심방) → 관성 조종 → 갈림길 오답(중격)·정답 → 순환 순서 10곳 → 폐에서 산소 받기(색 변화) → 온몸 세포에 산소 주기 → 한 바퀴 완주 결말·기록 → 소리 기본 꺼짐
const T = __test, S = () => T.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const cl = v => Math.max(-1, Math.min(1, v));
T.manual(true);
ok(text().includes('혈관 속 여행') && $('#ready').classList.contains('on') && S().phase === 'ready', '제목·시작 카드');
ok(S().sound === false && $('#snd').getAttribute('aria-pressed') === 'false', '소리 처음엔 꺼짐');
const z0 = S().z; T.step(30); ok(S().z !== z0, '첫 화면부터 혈관 속을 흘러감');
$('#start').click(); await wait(20);
let s = S();
ok(s.phase === 'go' && s.seg === '우심방' && s.o2 === 0 && $('#where').textContent === '우심방', '출발: 우심방, 산소 0');
ok(s.sat < 0.3, '처음엔 산소가 적은 검붉은 적혈구');
// 관성 조종
T.input({ x: 1, y: 0 }); T.step(12); const a = S();
ok(a.vx > 0.3 && a.px > 0.05, '오른쪽으로 가속');
T.input(null); T.step(6); ok(S().px > a.px, '손을 떼도 조금 더 미끄러짐');
const route = ['우심방'];
let wrongDone = false, msgSeen = '', labelsSeen = {};
const drive = (max = 12000) => {
  for (let f = 0; f < max; f++) {
    const q = S(); if (q.phase !== 'go') { T.input(null); return f; }
    if (route[route.length - 1] !== q.seg) route.push(q.seg);
    const j = q.junction; let tx = 0, ty = 0;
    if (j) { labelsSeen[q.seg] = j.labels.slice(); tx = (q.seg === '우심방' && !wrongDone ? -j.side : j.side) * 0.5; }
    else if (q.next) { tx = q.next.x; ty = q.next.y; }
    T.input({ x: cl((tx - q.px) * 5 - q.vx * 0.9), y: cl((ty - q.py) * 5 - q.vy * 0.9) });
    T.step(1);
    const r = S();
    if (!wrongDone && r.mistakes === 1) { wrongDone = true; msgSeen = $('#toast').textContent; ok(r.seg === '우심방', '오답이면 다음 칸으로 못 감'); }
    if (r.seg === '대동맥' && q.seg === '좌심실') { ok(r.o2 >= 5 && r.sat > 0.6, '폐에서 산소를 받아 선홍색: O2 ' + r.o2); }
  }
  return max;
};
const f = drive();
s = S();
ok(wrongDone && msgSeen.includes('중격'), '우심방에서 좌심실 쪽은 중격으로 막힘: ' + msgSeen);
ok(JSON.stringify(route) === JSON.stringify(['우심방', '우심실', '폐동맥', '폐', '폐정맥', '좌심방', '좌심실', '대동맥', '온몸', '대정맥']), '순환 순서: ' + route.join('→'));
ok(labelsSeen['우심실'] && labelsSeen['우심실'].includes('폐동맥') && labelsSeen['좌심실'].includes('대동맥') && labelsSeen['대정맥'].includes('우심방'), '갈림길 이름');
ok(s.phase === 'end' && $('#result').classList.contains('on'), '한 바퀴 완주: ' + f + '프레임');
ok(s.delivered >= 4 && s.mistakes === 1, '세포에 산소 전달 ' + s.delivered + '개, 실수 1');
ok(s.sat < 0.6, '산소를 주고 나면 다시 검붉게');
ok($('#result').innerText.includes('산소 ' + s.delivered + '개') && $$('#rRoute .ok').length === 10, '결과 카드: 전달 수·경로 10곳');
const rec = JSON.parse(localStorage.getItem('edu-expo-body-trip-v1'));
ok(rec && rec.laps === 1 && rec.best > 0 && rec.bestO2 === s.delivered, '기록 저장');
$('#again').click(); await wait(10); s = S();
ok(s.phase === 'go' && s.seg === '우심방' && s.o2 === 0 && s.delivered === 0, '다시 하기');
$('#snd').click(); ok(S().sound === true, '소리 켜기'); $('#snd').click();
return 'ok ' + n;
