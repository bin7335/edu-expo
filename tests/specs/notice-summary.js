// 17 세줄쏙(콘셉트): 요약하기 → 3줄이 타이핑되고 칩 4개 켜짐, 연타해도 글자 중복 없음, 요약 날짜가 원문·칩과 일치, 다시 요약
const go = $('#go'), lis = () => $$('#sum li'), chips = () => $$('#chips .chip');
assert(lis().every(l => l.classList.contains('sk') && !l.textContent), '처음엔 빈 자리표시');
assert(chips().every(c => !c.classList.contains('on')), '처음엔 칩 꺼짐');
go.click(); go.click(); // 연타
assert(go.disabled && go.textContent.includes('요약 중'), '요약 중 버튼 잠금');
for (let t = 0; t < 80 && go.textContent !== '다시 요약'; t++) await wait(100);
assert(go.textContent === '다시 요약' && !go.disabled, '요약 완료');
const lines = lis().map(l => l.textContent);
assert(lines.length === 3 && lines.every(l => l.length > 15), '3줄: ' + lines.join(' / '));
assert(lis().every(l => !l.classList.contains('sk') && !l.classList.contains('caret')), '자리표시·커서 제거');
assert(lines[0].startsWith('11월 20일') && !lines[0].includes('11월 20일11월'), '연타해도 글자 중복 없음: ' + lines[0]);
assert(chips().length === 4 && chips().every(c => c.classList.contains('on')), '칩 4개 켜짐');
assert($('#hint').textContent.includes('칩 4개'), '완료 안내');
// 요약과 칩의 날짜가 원문에 실제로 있는 날짜인지
const paper = $('.paper').textContent;
for (const d of ['11월 20일', '11월 13일', '11월 19일']) assert(paper.includes(d) && lines.join(' ').includes(d), '원문·요약 날짜 일치: ' + d);
const chipDays = chips().map(c => c.querySelector('.cal b').textContent).filter(x => /^\d+$/.test(x)).map(Number);
assert(chipDays.join() === '13,19,20', '칩 날짜 13·19·20: ' + chipDays);
// 다시 요약 → 지웠다가 다시 채움
go.click(); await wait(100);
assert(chips().every(c => !c.classList.contains('on')) && lis()[2].textContent === '', '다시 요약 시작하면 초기화');
for (let t = 0; t < 80 && go.textContent !== '다시 요약'; t++) await wait(100);
assert(lis().map(l => l.textContent).join() === lines.join(), '다시 요약 결과 동일');
return 'ok';
