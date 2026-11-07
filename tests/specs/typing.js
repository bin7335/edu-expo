// 44 딸깍 타자: 자모 분해 타수·조합, 줄 넘김, 정확도·오타, 영문 자판 → 한글 변환, 단계 완료
// 자모 분해(두벌식 타수): 겹받침·겹모음은 2타, 쌍자음은 Shift+1타
assert(keyCount('닭') === 4, '닭 = ㄷㅏㄹㄱ 4타: ' + keyCount('닭'));
assert(keyCount('과') === 3, '과 = ㄱㅗㅏ 3타');
assert(keyCount('까') === 2, '까 = ㄲㅏ 2타');
assert(keyCount('읽었습니다') === 14, '읽었습니다 14타: ' + keyCount('읽었습니다'));
assert(compose(toKeys('읽었습니다')) === '읽었습니다', '자모 → 다시 조합');
assert(compose(['ㄷ', 'ㅏ', 'ㄹ', 'ㄱ', 'ㅏ']) === '달가', '받침이 다음 글자로 넘어감: ' + compose(['ㄷ', 'ㅏ', 'ㄹ', 'ㄱ', 'ㅏ']));
assert(cpm(300, 60000) === 300 && accuracy(34, 1) === 97, '타수·정확도 공식');
const inp = $('#inp');
const type = async v => { inp.value = v; fire(inp, 'input'); await wait(60); };
// 자리 연습 1줄: 정확히 치고 띄어쓰기 → 다음 줄
$$('#tabs button').find(b => b.dataset.m === 'home').click(); await wait(50);
assert($('#target').innerText.replace(/\s/g, '') === '아나나라마라어머아이이리', '자리 연습 첫 줄: ' + $('#target').innerText);
await type('아나 나라 마라');
assert($('#sErr').textContent === '0' && $('#sAcc').textContent === '100%', '맞게 치는 중 오타 0');
await type('아나 나라 마라 어머 아이 이리 ');
assert($('#prog').textContent === '2 / 6' && inp.value === '', '줄 끝 띄어쓰기 → 2번째 줄: ' + $('#prog').textContent);
// 2번째 줄 마지막 글자를 틀림 → 오타 1, 정확도 33/34 = 97%
await type('하나 머리 허리 나이 라마 하허');
assert($('#target .curbad') || $('#target .bad'), '틀린 글자 표시');
await type('하나 머리 허리 나이 라마 하허 ');
assert($('#prog').textContent === '3 / 6', '3번째 줄');
assert($('#sErr').textContent === '1' && $('#sAcc').textContent === '97%', '오타 1·정확도 97%: ' + $('#sErr').textContent + '/' + $('#sAcc').textContent);
// 타수: 맞힌 자모 키(29+1 + 27+1 = 58) ÷ 걸린 시간
await wait(2700);
const shown = +$('#sCpm').textContent, expect = 58 * 60000 / (performance.now() - startAt);
assert(Math.abs(shown - expect) / expect < 0.15, `타수 ≈ 58타/경과시간: 화면 ${shown}, 기대 ${Math.round(expect)}`);
// 한/영이 영문일 때 dkssud → 안녕
await type('dkssud');
assert(inp.value === '안녕', '영문 자판 입력을 한글로 바꿈: ' + inp.value);
await type('');
// 남은 줄 모두 치면 완료 창
for (let i = 2; i < 6; i++) await type(HOME[i].text + ' ');
assert($('#modal').classList.contains('on') && $('#box').innerText.includes('자리 연습 완료'), '6줄 완료 → 완료 창: ' + $('#box').innerText);
assert($('#box').innerText.includes('1') && inp.disabled, '완료 후 입력 잠김');
$('[data-a="go"]').click(); await wait(50);
assert($$('#tabs button.on')[0].dataset.m === 'word', '다음 단계(낱말)로 이동');
return 'ok 16';
