// 16 냠냠가드(콘셉트): 고른 알레르기 번호가 들어간 메뉴만 빨갛게, 요약 개수·요일 탭 경고가 화면 메뉴와 일치, 요일·주 이동, 선택 해제, 저장
// 식단 데이터 값은 바뀔 수 있으므로 화면에 보이는 번호로 정답을 계산해 비교한다
const sel = () => $$('#chips input:checked').map(x => +x.value);
const setSel = arr => { $$('#chips input').forEach(c => { c.checked = arr.includes(+c.value); }); fire($('#chips'), 'change'); };
const dishes = () => $$('#menu .dish');
const nums = d => { const t = d.querySelector('sup').textContent.split(' · ')[0]; return t === '-' ? [] : t.split('.').map(Number); };
function check(tag) {
  const s = sel();
  const bad = dishes().filter(d => nums(d).some(n => s.includes(n)));
  dishes().forEach(d => assert(d.classList.contains('bad') === bad.includes(d), `${tag}: ${d.firstChild.textContent} 표시 오류`));
  bad.forEach(d => { const hits = nums(d).filter(n => s.includes(n)); assert(d.querySelector('sup').textContent.includes(' · ') && d.title.split(', ').length === hits.length, `${tag}: 알레르기 이름 표시`); });
  const on = $('#days button.on');
  assert(on, `${tag}: 선택된 요일`);
  if (s.length) {
    assert($('#summary b').textContent === bad.length + '개', `${tag}: 요약 ${$('#summary b').textContent} ≠ ${bad.length}개`);
    assert(on.classList.contains('warn') === (bad.length > 0) && on.textContent.includes(bad.length ? '주의 ' + bad.length : '안심'), `${tag}: 요일 탭 경고`);
  } else assert($('#summary').textContent.includes('선택해 보세요') && !bad.length, `${tag}: 선택 없음 안내`);
  return bad.length;
}
assert($$('#chips input').length === 19, '알레르기 19종');
assert(dishes().length > 0 && $('#days button.on'), '첫 화면 식단');
check('처음');
// 1) 우유(2)만 고르면 '우유' 메뉴는 반드시 주의
setSel([2]);
assert(check('우유') >= 1, '우유 메뉴 주의');
assert(dishes().filter(d => d.firstChild.textContent === '우유').every(d => d.classList.contains('bad')), '우유는 빨갛게');
assert(JSON.parse(localStorage.getItem('nyamguard')).join() === '2', '선택 저장');
// 2) 모두 해제 → 주의 없음·안내 문구
setSel([]);
check('선택 없음');
assert(!$('#menu .dish.bad') && !$('#days button.warn'), '해제하면 경고 없음');
// 3) 여러 개 선택 → 요일마다 탭 경고 수 = 그날 메뉴의 주의 수
setSel([1, 5, 6]);
const tabs = () => $$('#days button[data-i]');
for (let i = 0; i < 5; i++) {
  const b = tabs()[i];
  if (b.disabled) { assert(b.textContent.includes('급식 없음'), '급식 없는 날 표시'); continue; }
  const label = b.querySelector('small').textContent;
  b.click();
  assert(tabs()[i].classList.contains('on'), '요일 선택');
  const n = check('요일 ' + i);
  assert(label === (n ? '⚠ 주의 ' + n : '✓ 안심'), `요일 탭 라벨 ${label} ≠ ${n}`);
}
// 4) 주 이동: 끝에서는 버튼 비활성, 라벨이 바뀜
const lbl = () => $('#wLbl').textContent;
while (!$('#wPrev').disabled) $('#wPrev').click();
const first = lbl(); check('첫 주');
$('#wNext').click();
assert(lbl() !== first && !$('#wPrev').disabled, '다음 주 이동');
check('둘째 주');
let guard = 0; while (!$('#wNext').disabled && guard++ < 20) { $('#wNext').click(); check('주 ' + guard); }
assert($('#wNext').disabled && guard >= 1, '마지막 주에서 다음 비활성');
// 5) 주의 메뉴 이름이 요약에 나옴(최대 3개)
const bad = dishes().filter(d => d.classList.contains('bad')).map(d => d.firstChild.textContent);
if (bad.length) assert(bad.slice(0, 3).every(n => $('#summary').textContent.includes(n)), '요약에 주의 메뉴 이름');
return 'ok';
