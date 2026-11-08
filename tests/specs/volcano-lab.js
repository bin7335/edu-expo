// 82 화산 실험실: 첫 화면(연기 나는 화산·마그마 거품) → 시작 → 점성·가스 조절 → 분출(흔들림·입자) → 결과 판정(순상/성층/용암돔/폭발)
// → 과학적 관계 확인(점성 낮을수록 용암이 멀리·경사 완만, 점성+가스 많을수록 화산재·흔들림 큼) → 실제 예 → 4가지 모두 찾으면 엔딩·저장
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
ok(text().includes('화산 실험실') && $('#intro').classList.contains('on') && $('#visc') && $('#gas') && $$('.goal').length === 4, '제목·슬라이더·목표 4개');
const t0 = S().t; __test.step(60);
ok(S().t > t0 + .9 && S().parts > 0, '첫 화면: 연기·거품이 움직임');
$('#start').click(); await wait(20);
ok(S().phase === 'idle' && !$('#intro').classList.contains('on'), '실험 시작');
const set = (v, gs) => { $('#visc').value = v; fire($('#visc'), 'input'); $('#gas').value = gs; fire($('#gas'), 'input'); };
const run = async (v, gs) => {
  set(v, gs); $('#erupt').click(); await wait(10);
  assert(S().phase === 'erupt', '분출 시작');
  let maxAsh = 0, maxShake = 0;
  for (let i = 0; i < 70; i++) { __test.step(10); maxAsh = Math.max(maxAsh, S().ash); maxShake = Math.max(maxShake, S().shake); if (S().phase === 'result') break; }
  const r = { ...S(), maxAsh, maxShake, card: $('#result').innerText };
  $('#resOk').click(); await wait(10);
  return r;
};
set(10, 30);
ok($('#viscTxt').textContent.includes('묽') && $('#gasTxt').textContent.length > 0, '슬라이더 값 글자: ' + $('#viscTxt').textContent);
const shield = await run(10, 30);
ok(shield.type === 'shield' && shield.card.includes('순상화산') && shield.card.includes('킬라우에아'), '낮은 점성 → 순상화산·킬라우에아');
ok($('.goal[data-k="shield"]').classList.contains('done'), '목표 체크');
const strato = await run(50, 50);
ok(strato.type === 'strato' && strato.card.includes('성층화산') && strato.card.includes('후지산'), '중간 점성 → 성층화산·후지산');
const dome = await run(90, 10);
ok(dome.type === 'dome' && dome.card.includes('용암돔') && dome.card.includes('산방산'), '높은 점성·가스 적음 → 용암돔·산방산');
ok(shield.reach > strato.reach && strato.reach > dome.reach, `점성이 낮을수록 용암이 멀리 흐름: ${shield.reach | 0} > ${strato.reach | 0} > ${dome.reach | 0}`);
ok(shield.steep < strato.steep && strato.steep < dome.steep, `점성이 높을수록 경사 급함: ${shield.steep.toFixed(2)} < ${strato.steep.toFixed(2)} < ${dome.steep.toFixed(2)}`);
ok(!$('#end').classList.contains('on'), '아직 엔딩 아님');
const boom = await run(92, 92);
ok(boom.type === 'explosive' && boom.card.includes('폭발') && boom.card.includes('세인트헬렌스'), '높은 점성+가스 많음 → 폭발적 분출');
ok(boom.maxAsh > strato.maxAsh && strato.maxAsh > shield.maxAsh, `화산재: 폭발 ${boom.maxAsh} > 성층 ${strato.maxAsh} > 순상 ${shield.maxAsh}`);
ok(boom.maxShake > dome.maxShake && boom.maxShake > shield.maxShake, '폭발 분출이 가장 크게 흔들림');
__test.step(30);
ok(S().phase === 'end' && $('#end').classList.contains('on'), '4가지 모두 → 엔딩');
const st = JSON.parse(localStorage.getItem('edu-expo-volcano-lab-v1'));
ok(st.found.length === 4 && st.done === 1, '실험 노트 저장');
$('#endOk').click(); await wait(10);
// 키보드: 스페이스로 분출
document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
ok(S().phase === 'erupt', '스페이스로 분출');
$('#snd').click();
ok($('#snd').getAttribute('aria-pressed') === 'true', '소리 켜기');
return 'ok ' + n;
