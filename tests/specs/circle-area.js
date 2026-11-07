// 06 원의 넓이: 슬라이더 값마다 r×r×3.14가 맞고, 원 크기가 바뀌며, 퀴즈 정답/오답 피드백이 갈린다
const s = $('#radius-slider');
const sizes = [];
for (const r of [1, 5, 7, 10, 15]) {
  s.value = r; fire(s, 'input'); await wait(50);
  assert($('#val-r').textContent.trim() === String(r), `반지름 표시 ${r}: ` + $('#val-r').textContent);
  assert(Number($('#val-r2').textContent) === r * r, `r×r = ${r * r}: ` + $('#val-r2').textContent);
  const area = Number($('#val-area').textContent);
  assert(Math.abs(area - r * r * 3.14) < 0.001, `넓이 ${r}cm = ${r * r * 3.14}: ` + $('#val-area').textContent);
  assert($('#radius-label').textContent === r + 'cm', '반지름 라벨');
  sizes.push($('#dynamic-circle').getBoundingClientRect().width);
}
assert(sizes.every((w, i) => i === 0 || w > sizes[i - 1]), '반지름이 커지면 원도 커져야 함: ' + sizes.join(','));
// 퀴즈: 오답 → 빨간 피드백, 정답(③ 314) → 초록 피드백
const opts = $$('#quiz-options button');
assert(opts.length === 4, '보기 4개');
opts[0].click(); await wait(50);
const fb = $('#quiz-feedback');
assert(!fb.classList.contains('hidden') && fb.classList.contains('bg-red-100'), '오답 피드백');
opts[2].click(); await wait(50);
assert(fb.classList.contains('bg-green-100') && !fb.classList.contains('bg-red-100') && fb.textContent.includes('314'), '정답 피드백: ' + fb.textContent);
return 'ok';
