// 54 합쳐서 10: 시작 → 정답 쌍(점수·콤보·새 숫자·항상 쌍 존재) → 오답(흔들림·콤보 끊김) → 종료·최고 기록 → 20 모드 → 다시 하기
const T = window.__test;
const tile = i => $(`#board .tile[data-i="${i}"]`);
const wrongPair = () => { const v = T.vals(), t = T.target(); for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) if (v[i] + v[j] !== t) return [i, j]; };
let n = 0; const ok = (c, m) => { assert(c, m); n++; };

ok($$('#board .tile').length === 16, '4×4 타일 16개');
ok(T.pair() !== null, '첫 화면에도 합 10 쌍 존재');
T.seed(7);
$('#start').click(); await wait(30);
ok(T.state().playing && $('#time').textContent === '60', '시작하면 60초');
ok($('#start').disabled && $$('.mode').every(b => b.disabled), '게임 중 시작·모드 버튼 잠김');

// 정답 쌍 20번: 점수·콤보 증가, 매번 판에 쌍이 남아 있음, 값 범위 1-9
for (let k = 0; k < 20; k++) {
  const [a, b] = T.pair();
  tile(a).click(); ok(tile(a).classList.contains('sel'), '첫 타일 선택 표시');
  tile(b).click();
  ok(T.pair() !== null, `정답 후에도 쌍 존재 (${k})`);
}
let s = T.state();
ok(s.combo === 20 && s.pairs === 20, '콤보 20, 맞힌 쌍 20: ' + JSON.stringify(s));
ok(s.score > 200 && $('#score').textContent === String(s.score), '콤보 보너스 포함 점수 표시: ' + s.score);
ok(T.vals().every(v => v >= 1 && v <= 9), '10 모드 숫자는 1-9');
ok($('#msg').textContent.includes('정답'), '정답 메시지');

// 같은 타일 두 번 → 선택 해제
const [p] = T.pair(); tile(p).click(); tile(p).click();
ok(T.state().sel === -1 && !tile(p).classList.contains('sel'), '같은 타일 다시 누르면 선택 해제');

// 오답 → 흔들림, 콤보 0, 점수 그대로
const before = T.state().score;
const [w1, w2] = wrongPair(); const v = T.vals();
tile(w1).click(); tile(w2).click();
ok(tile(w1).classList.contains('no') && tile(w2).classList.contains('no'), '틀리면 흔들림');
ok(T.state().combo === 0 && T.state().score === before, '틀리면 콤보 0, 점수 유지');
ok($('#msg').textContent.includes(String(v[w1] + v[w2])), '틀린 합 안내: ' + $('#msg').textContent);

// 종료 → 결과·최고 기록 저장
T.end(); await wait(50);
ok($('#result').classList.contains('on'), '결과 창 표시');
ok($('#rScore').textContent === before + '점' && $('#rPairs').textContent === '20', '결과 점수·쌍: ' + $('#rScore').textContent);
ok(JSON.parse(localStorage.getItem('edu-expo-make-ten-v1'))[10] === before, '최고 기록 저장');
ok($('#rNew').classList.contains('on') && $('#best').textContent === before + '점', '신기록 표시');

// 다시 하기 → 점수 0으로 새 판
$('#again').click(); await wait(30);
ok(T.state().playing && T.state().score === 0 && !$('#result').classList.contains('on'), '다시 하기로 새 게임');
const [a2, b2] = T.pair(); tile(a2).click(); tile(b2).click();
T.end(); await wait(30);
ok(!$('#rNew').classList.contains('on') && JSON.parse(localStorage.getItem('edu-expo-make-ten-v1'))[10] === before, '낮은 점수는 기록 유지');
$('#close').click(); await wait(30);

// 20 모드
$('.mode[data-t="20"]').click(); await wait(30);
ok(T.target() === 20 && $('header .tgt').textContent === '20', '20 모드 전환');
T.seed(3); $('#start').click(); await wait(30);
for (let k = 0; k < 10; k++) { const [a, b] = T.pair(); ok(T.vals()[a] + T.vals()[b] === 20, '20 쌍'); tile(a).click(); tile(b).click(); }
ok(T.vals().every(x => x >= 1 && x <= 19), '20 모드 숫자는 1-19');
ok(T.state().pairs === 10, '20 모드 10쌍');
T.end(); await wait(30);
const saved = JSON.parse(localStorage.getItem('edu-expo-make-ten-v1'));
ok(saved[20] === T.state().score && saved[10] === before, '모드별 최고 기록 따로 저장');
$('#close').click();
return 'ok ' + n;
