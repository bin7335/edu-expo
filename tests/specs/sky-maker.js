// 88 하늘 만들기: 습도→구름(포화), 더 습함→비, 0℃ 이하→눈, 비 그친 뒤 해 나면 해 반대편 무지개, 바람이 구름을 옮김, 날씨 미션 5개·엔딩
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const set = o => __test.set(o);
const done = id => $(`.mission[data-m="${id}"]`).classList.contains('done');

ok(text().includes('하늘 만들기') && $$('.mission').length === 5 && !$$('.mission').some(m => m.classList.contains('done')), '제목·미션 카드 5개(처음엔 안 함)');
ok(S().cover > 0 && S().precip === 'none', '첫 화면 예시: 구름 조금 낀 하늘');
// 슬라이더로 바꾸기
const hum = $('#hum'); hum.value = '50'; fire(hum, 'input');
ok(S().hum === 50 && $('#humV').textContent.includes('50'), '습도 슬라이더');
__test.step(1);
ok(S().cover === 0 && S().precip === 'none' && /맑/.test($('#why').textContent), '습도 50% → 맑음: ' + $('#why').textContent);
// 1) 구름
set({ hum: 80, temp: 15 }); __test.step(2);
ok(S().cover > .3 && S().cover < .4 && S().precip === 'none' && done('cloud'), '습도 80% → 구름(비는 아직): ' + S().cover.toFixed(2));
ok(/구름/.test($('#why').textContent), '구름 설명');
// 2) 비
set({ hum: 95 }); __test.step(1);
ok(S().precip === 'rain' && done('rain') && /비/.test($('#why').textContent), '습도 95%·15℃ → 비');
ok(S().rainbow === false, '비 오는 중엔 무지개 없음');
// 3) 눈
set({ temp: -5 }); __test.step(1);
ok(S().precip === 'snow' && done('snow') && /눈/.test($('#why').textContent), '0℃ 이하 → 눈');
set({ temp: 0 }); __test.step(1); ok(S().precip === 'snow', '0℃도 눈');
set({ temp: 1 }); __test.step(1); ok(S().precip === 'rain', '1℃는 비');
// 4) 무지개: 눈이 그친 뒤엔 안 생김
set({ temp: -3 }); __test.step(1); set({ hum: 70, temp: 10 }); __test.step(1);
ok(!S().rainbow, '눈이 그친 뒤엔 무지개 없음(빗방울이 아님)');
// 비 그친 뒤에도 구름이 두꺼우면(해가 가려짐) 무지개 없음
set({ hum: 95, temp: 15 }); __test.step(2); set({ hum: 87 }); __test.step(1);
ok(S().precip === 'none' && !S().rainbow && S().cover >= .5, '구름이 해를 가리면 무지개 없음');
set({ hum: 75, time: 'am' }); __test.step(1);
ok(S().rainbow && S().sunSide === 'left' && S().rainbowSide === 'right' && done('rainbow'), '오전 해(왼쪽) → 무지개 오른쪽');
set({ time: 'pm' }); __test.step(.5);
ok(S().sunSide === 'right' && S().rainbowSide === 'left', '오후 해(오른쪽) → 무지개 왼쪽');
ok(/반대/.test($('#why').textContent), '무지개 설명(해 반대편): ' + $('#why').textContent);
__test.step(25);
ok(!S().rainbow, '시간이 지나 물방울이 마르면 무지개 사라짐');
// 5) 바람
set({ hum: 85, wind: 0 }); __test.step(1); const x0 = S().cloudX; __test.step(3);
ok(Math.abs(S().cloudX - x0) < 1e-9, '바람 0 → 구름 제자리');
ok(!$('#ending').classList.contains('on'), '아직 엔딩 아님');
set({ wind: 8 }); __test.step(3);
ok(S().cloudX !== x0 && S().cloudMove > 0, '바람 → 구름 이동');
__test.step(5);
ok(done('wind') && S().missionsDone === 5, '바람 미션·5개 모두 완료');
await wait(50);
ok($('#ending').classList.contains('on') && /5개/.test($('#ending').innerText), '엔딩 카드');
const sv = JSON.parse(localStorage.getItem('edu-expo-sky-maker-v1'));
ok(sv && sv.best > 0 && sv.clears === 1, '최고 기록 저장: ' + JSON.stringify(sv));
$('#againBtn').click(); await wait(20);
ok(!$('#ending').classList.contains('on') && S().missionsDone === 0 && !$$('.mission').some(m => m.classList.contains('done')), '다시 하기 → 미션 초기화');
$('#snd').click(); ok($('#snd').getAttribute('aria-pressed') === 'true', '소리 켜기'); $('#snd').click();
return 'ok ' + n;
