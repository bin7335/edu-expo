// 42 분수 피자: 조각 칠하기 → 분수·약분, 두 분수 비교 정답, 같은 크기 분수 찾기, 주문 게임 채점
const tap = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const piece = (box, i) => $(`${box} .pc[data-i="${i}"] path, ${box} .pc[data-i="${i}"] rect`);
const frac = (a, b) => `<i>${a}</i><i>${b}</i>`;
// 만들기: 3/8 → 4/8 = 1/2
assert($('#mFrac').innerHTML.includes(frac(3, 8)), '첫 화면 3/8');
assert($('#mEq').innerHTML.includes(frac(5, 8)), '남은 조각 5/8: ' + $('#mEq').innerText);
tap(piece('#mFood', 3)); await wait(50);
assert($('#mFrac').innerHTML.includes(frac(4, 8)) && $('#mEq').innerHTML.includes(frac(1, 2)), '4/8 는 1/2 와 같음: ' + $('#mEq').innerText);
$('#mAll').click(); await wait(50);
assert($('#mEq').innerText.includes('한 판 전부'), '모두 칠하면 1판');
// 비교하기: 3/4 > 5/8
$$('.tab').find(t => t.dataset.v === 'vCmp').click(); await wait(50);
assert($('#cSign').innerText.startsWith('>') && $('#cSign').innerText.includes('왼쪽'), '3/4 > 5/8: ' + $('#cSign').innerText);
tap(piece('#cFoodR', 5)); await wait(50);
assert($('#cSign').innerText.startsWith('=') && $('#cMsg').innerHTML.includes(frac(6, 8)), '3/4 = 6/8: ' + $('#cSign').innerText);
tap(piece('#cFoodR', 6)); await wait(50);
assert($('#cSign').innerText.startsWith('<'), '3/4 < 7/8: ' + $('#cSign').innerText);
// 오른쪽 분모 8 → 6: 3/4는 6조각으로 못 만듦 → 8, 12 제안
const minusR = $('[data-d="R-"]'); minusR.click(); minusR.click(); await wait(50);
assert($('#cDenR').textContent === '6', '오른쪽 분모 6');
$('#cEquiv').click(); await wait(50);
assert($('#cMsg').innerText.includes('8, 12'), '3/4와 같은 분수는 분모 8, 12: ' + $('#cMsg').innerText);
$('[data-d="R+"]').click(); $('[data-d="R+"]').click(); $('#cEquiv').click(); await wait(50);
assert($('#cFracR').innerHTML.includes(frac(6, 8)) && $('#cSign').innerText.startsWith('='), '분모 8이면 6/8로 자동 칠함');
// 주문 게임
$$('.tab').find(t => t.dataset.v === 'vGame').click(); await wait(50);
assert($('#vGame').innerText.includes('주문 1 / 10'), '주문 1');
tap(piece('#gFood', 0)); $('#gGo').click(); await wait(50);
assert($('#vGame .gmsg').innerText.includes('정답') && $('.coins').innerText.includes('3냥'), '1/2 한 번에 정답 +3냥: ' + $('.coins').innerText);
$('#gNext').click(); await wait(50);
// 3/4 주문: 2조각만 → 모자람, 1조각 더 → 정답 +1냥
tap(piece('#gFood', 0)); tap(piece('#gFood', 1)); $('#gGo').click(); await wait(50);
assert($('#vGame .gmsg').innerText.includes('모자라요'), '2/4는 모자람: ' + $('#vGame .gmsg').innerText);
tap(piece('#gFood', 2)); $('#gGo').click(); await wait(50);
assert($('#vGame .gmsg').innerText.includes('+1냥') && $('.coins').innerText.includes('4냥'), '두 번째에 맞히면 +1냥, 합 4냥: ' + $('.coins').innerText);
$('#gNext').click(); await wait(50);
// 2/3 초콜릿: 3조각 다 칠하면 너무 많음
for (let i = 0; i < 3; i++) tap(piece('#gFood', i));
$('#gGo').click(); await wait(50);
assert($('#vGame .gmsg').innerText.includes('너무 많아요'), '3/3은 너무 많음: ' + $('#vGame .gmsg').innerText);
return 'ok 14';
