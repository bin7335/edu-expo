// 83 숲속 쉼표: 첫 화면(비 내리는 숲·기본 소리 섞기) → 슬라이더가 장면을 바꿈(비 0이면 빗방울 없어짐·바람이 세면 나무가 크게 흔들림)
// → AudioContext가 없어도 오류 없이 안내 → 소리 켜면 슬라이더가 음량을 바꿈 → 숨쉬기 4초 들이쉬기·4초 멈춤·6초 내쉬기 × 4번
// → 일시정지(스페이스) → 완료 카드·기록 저장·기분 고르기 → 다시 하기
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
ok(text().includes('숲속 쉼표') && $('#go') && $$('.mix input[type=range]').length === 4, '제목·시작 버튼·소리 슬라이더 4개');
ok(S().phase === 'idle' && S().mix.rain > 0 && S().mix.birds > 0, '기본 소리가 미리 섞여 있음');
const t0 = S().t; __test.step(90);
ok(S().t > t0 + 1.4 && S().drops > 0, '첫 화면에서 비가 내림: ' + S().drops);
const set = (id, v) => { const el = $('#' + id); el.value = v; fire(el, 'input'); };
const d40 = S().drops;
set('rain', 100); __test.step(120);
ok(S().drops > d40 * 1.5, `빗소리 크게 → 빗방울 많아짐 ${d40}→${S().drops}`);
set('rain', 0); __test.step(150);
ok(S().drops === 0, '비 0 → 빗방울 없음');
set('wind', 0); __test.step(30); const calm = S().sway;
set('wind', 100); __test.step(30); const windy = S().sway;
ok(windy > calm * 2 && windy > 0, `바람이 세면 나무가 크게 흔들림 ${calm.toFixed(3)}→${windy.toFixed(3)}`);
ok($('#rainV').textContent === '0' && $('#windV').textContent === '100', '슬라이더 값 표시');
// 소리 없는 브라우저에서도 오류 없이
const AC = window.AudioContext, WAC = window.webkitAudioContext;
window.AudioContext = undefined; window.webkitAudioContext = undefined;
$('#snd').click(); await wait(20);
ok(S().audio === 'unavailable' && $('#audioMsg').textContent.includes('소리'), '오디오 없음 안내: ' + $('#audioMsg').textContent);
window.AudioContext = AC; window.webkitAudioContext = WAC;
$('#snd').click(); await wait(20);
if (S().audio !== 'on') { $('#snd').click(); await wait(20); }
ok(S().audio === 'on' && $('#snd').getAttribute('aria-pressed') === 'true', '소리 켜기: ' + S().audio);
set('stream', 80); set('birds', 0); __test.step(20);
const gn = __test.gains();
ok(gn.stream > 0 && gn.rain === 0 && gn.wind > gn.stream * 0.5, '슬라이더가 음량을 바꿈: ' + JSON.stringify(gn));
// 숨쉬기
$('#go').click(); await wait(10);
ok(S().phase === 'breath' && S().stage === 'in' && S().cycle === 1 && $('#bText').textContent.includes('들이'), '들이쉬기 시작');
const sc0 = S().scale; __test.step(120);
ok(S().scale > sc0 + .1 && S().stage === 'in', '들이쉬면 원이 커짐');
__test.step(125);
ok(S().stage === 'hold' && $('#bText').textContent.includes('멈'), '4초 뒤 멈춤: ' + $('#bText').textContent);
const sh = S().scale; __test.step(120);
ok(Math.abs(S().scale - sh) < .02, '멈춤 동안 원 크기 유지');
__test.step(125);
ok(S().stage === 'out' && $('#bText').textContent.includes('내쉬'), '4초 뒤 내쉬기');
const so = S().scale; __test.step(180);
ok(S().scale < so - .1, '내쉬면 원이 작아짐');
// 일시정지
document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
const left = S().left; __test.step(120);
ok(S().paused && Math.abs(S().left - left) < 1e-6 && $('#bText').textContent.includes('쉬는 중'), '스페이스로 일시정지');
document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
ok(!S().paused, '다시 이어 가기');
__test.step(185);
ok(S().stage === 'in' && S().cycle === 2 && $('#cyc').textContent.includes('2'), '14초 한 번 → 두 번째 숨');
__test.step(14 * 60 * 3 + 30);
ok(S().phase === 'done' && $('#done').classList.contains('on') && $('#done').innerText.includes('완료'), '4번 숨쉬기(56초) → 완료 카드');
let st = JSON.parse(localStorage.getItem('edu-expo-forest-breath-v1'));
ok(st.sessions === 1 && st.seconds === 56 && st.mix && st.mix.stream === 80, '기록·소리 섞기 저장');
$$('#moods button')[0].click(); await wait(10);
st = JSON.parse(localStorage.getItem('edu-expo-forest-breath-v1'));
ok(st.moods && st.moods.length === 1 && $('#moodMsg').textContent.length > 0, '기분 기록');
$('#again').click(); await wait(10);
ok(S().phase === 'breath' && S().cycle === 1, '한 번 더');
document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok(S().phase === 'idle', 'Esc로 그만하기');
$('.preset').click(); await wait(10);
ok(S().mix.rain !== 0 || S().mix.birds !== 0, '분위기 버튼');
return 'ok ' + n;
