// 86 교실 탈출: 시작 → 칠판(수학 기호 식) → 사물함 3자리 → 손전등으로 책장 → 가나다순 4자리 서랍 → 시계 시각 계산 → 열쇠+4자리 문 → 탈출·최고 기록
const S = () => __test.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const modalText = () => $('#modal').classList.contains('on') ? $('#mBody').innerText : '';
const close = () => { if ($('#modal').classList.contains('on')) $('#mClose').click(); };
const spot = k => { close(); $(`[data-spot="${k}"]`).click(); };
const setCode = code => { const ds = $$('#mBody .dial'); assert(ds.length === code.length, '다이얼 개수 ' + ds.length + ' ≠ ' + code.length);
  ds.forEach((d, i) => { for (let k = 0; k < 12 && d.querySelector('.dv').textContent !== code[i]; k++) d.querySelector('.up').click(); });
  $('#tryBtn').click(); };
const pick = id => { const b = $(`#inv [data-item="${id}"]`); assert(b, '가방에 ' + id + ' 없음'); if (!b.classList.contains('sel')) b.click(); };

ok(text().includes('교실 탈출') && $('#intro').classList.contains('on') && S().phase === 'intro', '제목·시작 카드');
ok($$('[data-spot]').length >= 6, '눌러 볼 곳 6곳 이상');
$('#startBtn').click(); await wait(30);
ok(S().phase === 'play' && S().stage === 0 && $('#intro').classList.contains('on') === false, '게임 시작');

// 퍼즐이 논리적으로 풀리는지 데이터로 직접 계산
const P = __test.puzzle();
const [A, B, C] = P.locker.split('').map(Number);
ok(A + A === 14 && A * B === 21 && B + C === 9, '칠판 식이 사물함 번호(' + P.locker + ')를 하나로 정함');
const sorted = P.books.slice().sort((x, y) => x.title.localeCompare(y.title, 'ko')).map(b => b.num).join('');
ok(sorted === P.drawer, '책 제목 가나다순 → 서랍 번호: ' + sorted + ' / ' + P.drawer);
const [hh, mm] = P.clock.split(':').map(Number); let m2 = hh * 60 + mm + 80; const want = String(Math.floor(m2 / 60) % 12 || 12).padStart(2, '0') + String(m2 % 60).padStart(2, '0');
ok(want === P.door, '시계 ' + P.clock + ' + 1시간 20분 = ' + want + ' / ' + P.door);

// 1) 칠판 단서
spot('board');
ok(/◆ \+ ◆ = 14/.test(modalText()) && /◆ × ● = 21/.test(modalText()) && /● \+ ▲ = 9/.test(modalText()) && /◆●▲/.test(modalText()), '칠판 식 3개: ' + modalText().slice(0, 80));
ok(S().clues.includes('board'), '단서 기록');
// 힌트
const h0 = S().hints; $('#hintBtn').click();
ok(S().hints === h0 + 1 && /◆/.test($('#toast').textContent + modalText()), '힌트 1회(지금 단계 안내)');
// 2) 사물함: 틀린 번호 → 안 열림, 맞는 번호 → 손전등·쪽지
spot('locker');
setCode('000');
ok(!S().opened.locker && /열리지/.test(modalText()), '틀린 번호는 안 열림');
setCode(P.locker);
ok(S().opened.locker && S().inv.includes('flash') && S().stage === 1, '사물함 열림 → 손전등: ' + S().inv.join(','));
ok(/가나다/.test(modalText()), '사물함 쪽지(가나다순 안내)');
// 3) 책장: 어두우면 번호 안 보임, 손전등을 들면 보임
spot('shelf');
ok(/어두/.test(modalText()) && !$('#mBody .book .num'), '손전등 없이 어두움');
pick('flash'); spot('shelf');
const nums = $$('#mBody .book .num').map(x => x.textContent);
ok(nums.length === 4 && $$('#mBody .book .tt').map(x => x.textContent).join(',') === P.books.map(b => b.title).join(','), '손전등으로 책 제목·번호 보임: ' + nums.join(''));
// 4) 서랍
spot('desk');
setCode('1234');
ok(!S().opened.drawer, '서랍 틀린 번호');
setCode(P.drawer);
ok(S().opened.drawer && S().inv.includes('key') && S().stage === 2 && /1시간 20분/.test(modalText()), '서랍 열림 → 열쇠·쪽지');
// 5) 시계
spot('clock');
ok(modalText().includes('시계') && $('#mBody svg') && __test.clockAngles().h > 300 && __test.clockAngles().m === 300, '시계 바늘 10시 50분(분침 300°): ' + JSON.stringify(__test.clockAngles()));
// 6) 문: 열쇠 없이 → 잠김, 열쇠 들고 → 번호판
close(); $('#inv [data-item="key"]').classList.contains('sel') && $('#inv [data-item="key"]').click();
pick('flash'); spot('door');
ok(/열쇠/.test(modalText()) && !$('#mBody .dial'), '열쇠가 있어야 번호판');
pick('key'); spot('door');
setCode('1150');
ok(S().phase === 'play' && !S().opened.door, '문 틀린 번호');
setCode(P.door);
await wait(50);
ok(S().phase === 'won' && S().opened.door && $('#ending').classList.contains('on'), '탈출 성공');
const sv = JSON.parse(localStorage.getItem('edu-expo-escape-class-v1'));
ok(sv && sv.best > 0 && Math.abs(sv.best - S().score) < 0.01 && S().score >= 30, '최고 기록 저장(힌트 1회 +30초): ' + JSON.stringify(sv));
ok(/탈출/.test($('#ending').innerText) && /힌트\s*1회/.test($('#ending').innerText), '엔딩 카드');
// 다시 하기 → 처음 상태, 최고 기록 표시
$('#againBtn').click(); await wait(30);
ok(S().phase === 'play' && S().stage === 0 && S().inv.length === 0 && !S().opened.locker && S().hints === 0, '다시 하기 초기화');
ok($('#bestLbl').textContent.includes(':'), '최고 기록 표시: ' + $('#bestLbl').textContent);
$('#snd').click(); ok($('#snd').getAttribute('aria-pressed') === 'true', '소리 켜기'); $('#snd').click();
return 'ok ' + n;
