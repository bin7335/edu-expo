// 87 생태 수조: 모형 결과(균형·산소 부족·먹이 부족·물 더러움·이끼) → 개수 조절 → 7일 버티기(낮밤 산소 변화) → 성공·실패 이유 → 빨리 감기 → 저장
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const cnt = k => +$(`#n${k}`).textContent;
const press = (k, d, times = 1) => { for (let i = 0; i < times; i++) $(`[data-k="${k}"][data-d="${d}"]`).click(); };

ok(text().includes('생태 수조') && S().phase === 'setup' && cnt('P') === 2 && cnt('F') === 5 && cnt('S') === 1, '첫 화면 예시 설정 2·5·1');
ok($('#tank') && $('#tank').width > 200, '수조 캔버스');
// 1) 모형 결과(정답값)
const R = c => __test.run(c).end;
ok(R({ P: 2, F: 5, S: 1, L: true }) === 'o2', '물고기 많음 → 산소 부족');
ok(R({ P: 3, F: 3, S: 2, L: true }) === 'win', '수초3·물고기3·달팽이2 → 7일 성공');
ok(R({ P: 3, F: 3, S: 2, L: false }) === 'o2', '조명 끔 → 광합성 없음 → 산소 부족');
ok(R({ P: 3, F: 3, S: 0, L: true }) === 'waste', '달팽이 0 → 물이 더러워짐');
ok(R({ P: 1, F: 2, S: 1, L: true }) === 'food', '수초 1 → 먹이 부족');
ok(R({ P: 6, F: 1, S: 0, L: true }) === 'algae', '빛·찌꺼기 많고 달팽이 0 → 이끼');
const r = __test.run({ P: 3, F: 3, S: 2, L: true });
ok(r.h === 168, '7일 = 168시간: ' + r.h);
// 2) 개수 조절(범위 제한)
press('P', 1); press('F', -1, 2); press('S', 1);
ok(cnt('P') === 3 && cnt('F') === 3 && cnt('S') === 2, '3·3·2로 바꿈');
press('F', -1, 5); ok(cnt('F') === 1, '물고기는 최소 1마리'); press('F', 1, 2);
press('S', 1, 9); ok(cnt('S') === 6, '달팽이 최대 6'); press('S', -1, 4);
ok(cnt('F') === 3 && cnt('S') === 2, '다시 3·2');
// 3) 시작 → 낮에는 산소↑, 밤에는 산소↓
$('#startBtn').click(); await wait(30);
ok(S().phase === 'run' && S().h === 0 && $$('[data-k]').every(b => b.disabled), '시작하면 개수 잠김');
__test.step(18); const dusk = S().o2; ok(S().h === 18 && !S().light, '18시 밤');
__test.step(12); const dawn = S().o2;
ok(dawn < dusk, '밤에는 산소가 줄어듦: ' + dusk.toFixed(1) + '→' + dawn.toFixed(1));
__test.step(6); ok(S().o2 > dawn && S().light, '낮에는 광합성으로 산소가 늘어남');
ok(/2일째/.test($('#day').textContent), '날짜 표시: ' + $('#day').textContent);
ok(Math.abs(+$('#vO2').textContent - Math.round(S().o2)) <= 1, '산소 게이지 표시');
// 빨리 감기
$('#ffBtn').click(); ok(S().speed > 1 && $('#ffBtn').getAttribute('aria-pressed') === 'true', '빨리 감기');
__test.step(200);
ok(S().phase === 'end' && S().end === 'win' && $('#result').classList.contains('on'), '7일 버티기 성공');
ok(/성공/.test($('#rTitle').textContent) && /산소/.test($('#rWhy').textContent) && /달팽이/.test($('#rWhy').textContent), '성공 이유 설명: ' + $('#rWhy').textContent.slice(0, 80));
const sv = JSON.parse(localStorage.getItem('edu-expo-eco-tank-v1'));
ok(sv && sv.wins === 1 && sv.P === 3 && sv.F === 3 && sv.S === 2, '성공 횟수·설정 저장: ' + JSON.stringify(sv));
// 4) 실패: 물고기 6마리 → 산소 부족, 이유와 고칠 방법
$('#againBtn').click(); await wait(20);
ok(S().phase === 'setup' && !$('#result').classList.contains('on'), '설정으로 돌아감');
press('F', 1, 3); ok(cnt('F') === 6, '물고기 6');
$('#startBtn').click(); __test.step(200);
ok(S().end === 'o2' && /산소/.test($('#rTitle').textContent) && /물고기를 줄이|수초를 늘/.test($('#rWhy').textContent), '산소 부족 실패 이유: ' + $('#rWhy').textContent.slice(0, 80));
ok(S().day < 7, '7일 전에 끝남: ' + S().day);
// 5) 조명 끄기 → 빛 이야기
$('#againBtn').click(); press('F', -1, 3); $('#lightBtn').click();
ok(S().L === false && /꺼짐/.test($('#lightBtn').textContent), '조명 끔');
$('#startBtn').click(); __test.step(200);
ok(S().end === 'o2' && /빛|조명/.test($('#rWhy').textContent), '조명 꺼서 실패: ' + $('#rWhy').textContent.slice(0, 80));
$('#againBtn').click(); $('#lightBtn').click();
// 6) 달팽이 0 → 물이 더러워짐
press('S', -1, 2); $('#startBtn').click(); __test.step(200);
ok(S().end === 'waste' && /달팽이/.test($('#rWhy').textContent), '달팽이 없어 실패');
$('#againBtn').click();
$('#snd').click(); ok($('#snd').getAttribute('aria-pressed') === 'true', '소리 켜기'); $('#snd').click();
return 'ok ' + n;
