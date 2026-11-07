// 47 달 모양 관찰: 2026-11 보름(24일 무렵)·삭(9일 무렵)·상현(17일 무렵), 음력 초하루, 날짜 고르기·달력 클릭·이동
// 날짜 경계(한국 시각)는 보정 중이라 ±1일 허용
const pick = async (y, m, d) => { const p = $('#picker'); p.value = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; fire(p, 'change'); await wait(50); };
const near = (d, want) => Math.abs(d - want) <= 1;
const keyDays = k => $$('#keys div').filter(x => x.innerText.includes(k)).map(x => parseInt(x.querySelector('b').textContent));
// 보름 2026-11-24 무렵
await pick(2026, 11, 24);
assert($('#dateLbl').textContent.startsWith('2026년 11월 24일'), '날짜 표시: ' + $('#dateLbl').textContent);
assert($('#calTitle').textContent === '2026년 11월 달 모양', '달력 제목');
assert($('#pname').textContent === '보름달', '11/24 보름달: ' + $('#pname').textContent);
const il = +($('#facts').innerText.match(/밝은 부분\s*(\d+)%/) || [])[1];
assert(il >= 97, '11/24 밝은 부분 97% 이상: ' + il);
const full = keyDays('보름'); assert(full.length === 1 && near(full[0], 24), '11월 보름 날짜: ' + full);
const nw = keyDays('삭'); assert(nw.length === 1 && near(nw[0], 9), '11월 삭 날짜: ' + nw);
const fq = keyDays('상현'); assert(fq.length === 1 && near(fq[0], 17), '11월 상현 날짜: ' + fq);
// 삭 2026-11-09 무렵: 그날(또는 ±1일) 이름이 삭, 음력 초하루
const nd = nw[0];
$(`#cal .day[data-d="${nd}"]`).click(); await wait(50);
assert($('#dateLbl').textContent.startsWith(`2026년 11월 ${nd}일`), '달력 클릭으로 날짜 이동');
assert($('#facts').innerText.includes('음력 1일'), '삭이 든 날 = 음력 1일: ' + $('#facts').innerText);
assert($('#facts').innerText.includes('이날 삭'), '그날 삭 시각 표시: ' + $('#facts').innerText);
await pick(2026, 11, 9);
assert(['삭 (안 보여요)', '초승달'].includes($('#pname').textContent) && +($('#facts').innerText.match(/밝은 부분\s*(\d+)%/) || [])[1] <= 3, '11/9 밤 달은 거의 안 보임: ' + $('#facts').innerText);
// 차오르는 동안은 이각 0-180, 기우는 동안 180-360
const e13 = elong(kst(2026, 10, 13)), e28 = elong(kst(2026, 10, 28));
assert(e13 > 0 && e13 < 180 && e28 > 180 && e28 < 360, `이각 11/13 ${e13.toFixed(0)}° 차오름, 11/28 ${e28.toFixed(0)}° 기움`);
// 보름 다음 날 ▶, 다음 달 ▶
await pick(2026, 11, 24); $('#next').click(); await wait(50);
assert($('#dateLbl').textContent.startsWith('2026년 11월 25일') && $('#pname').textContent !== '삭 (안 보여요)', '하루 뒤');
$('#mNext').click(); await wait(50);
assert($('#calTitle').textContent === '2026년 12월 달 모양' && $$('#cal .day[data-d]').length === 31, '12월 달력 31칸');
const decFull = keyDays('보름'); assert(decFull.length === 1 && near(decFull[0], 24), '12월 보름(24일 무렵, 삭망월 29.5일 뒤): ' + decFull);
return 'ok 16';
