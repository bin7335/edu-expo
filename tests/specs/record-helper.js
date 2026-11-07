// 34 생기부 도우미: 나이스 바이트 수(한글 3·영숫자 1·줄바꿈 2), 넘침 경고, 조심할 표현 강조, 어미 분포·연속 경고, 내 규칙, 문장 뼈대
const ta = $('#txt');
const put = v => { ta.value = v; fire(ta, 'input'); };
const bytes = () => +$('#bytes').textContent.replace(/,/g, '');
const setMax = v => { $('#maxB').value = v; fire($('#maxB'), 'input'); };
setMax('1500');
// 1) 바이트 정답값
put('가A 1\n'); assert(bytes() === 8, '"가A 1\\n" = 3+1+1+1+2 = 8: ' + bytes());
put('가\r\n나'); assert(bytes() === 8, '\\r\\n 은 줄바꿈 하나(2바이트): ' + bytes());
put('😀'); assert(bytes() === 3, '이모지(서로게이트 쌍)는 3바이트: ' + bytes());
put('생활기록부 기재요령.'); assert(bytes() === 3 * 9 + 2, '한글 9자+공백+마침표 = 29: ' + bytes());
assert(/글자 11자/.test($('#sub').textContent), '글자 수: ' + $('#sub').textContent);
// 2) 최대 바이트·경고 단계
setMax('30');
assert(/남은 1바이트/.test($('#sub').textContent) && $('#bar').className === 'mid', '90% 이상 주의: ' + $('#bar').className);
setMax('20');
assert(/9바이트 넘침/.test($('#sub').textContent) && $('#bar').className === 'bad' && $('#bytes').classList.contains('bad'), '넘침 경고: ' + $('#sub').textContent);
setMax('100');
assert($('#bar').className === '' && $('#bar').style.width === '29%', '여유: ' + $('#bar').style.width);
// 항목 바꾸면 최대 바이트 1500
const it = $('#item'); it.selectedIndex = 1; fire(it, 'change');
assert($('#maxB').value === '1500' && $('#of').textContent === '/ 1,500 바이트', '항목 선택 → 1,500');
// 3) 조심할 표현 강조(종류별)
put('교내 과학탐구대회에서 금상을 수상함. 어머니와 학원에서 선행 학습함. TOEIC 점수가 높음. 한국대학교 캠프에 참여함. 수업 중 산만함.');
const marks = () => $$('#preview mark').map(m => m.className + ':' + m.textContent);
const ms = marks();
for (const want of ['award:과학탐구대회', 'award:금상', 'award:수상', 'par:어머니', 'pri:학원', 'pri:선행 학습', 'abr:TOEIC', 'org:한국대학교', 'neg:산만함'])
  assert(ms.includes(want), '강조 ' + want + ' 없음: ' + ms.join(' '));
assert(!ms.some(m => m.startsWith('en:TOEIC')), '같은 자리는 한 번만(영문 규칙과 겹치지 않음)');
assert($('#sumLine').textContent === '조심할 표현 ' + ms.length + '곳', '요약 줄: ' + $('#sumLine').textContent);
assert($$('#issues .iss').length >= 7, '규칙별 묶음 목록');
// 입력한 태그는 글자로
put('<img src=x>발표함.');
assert(!$('#preview img') && $('#preview').textContent.startsWith('<img'), '미리보기 이스케이프');
put('친구를 잘 도움. 모둠을 이끔.');
assert(/걸리는 표현이 없어요/.test($('#issues').textContent), '문제 없음 안내');
// 4) 어미 분포·경고
put('친구를 도와줌. 발표를 잘함. 정리를 잘함. 실험을 잘함. 청소를 잘함');
const ends = $$('#endings span').map(s => s.textContent);
assert(ends[0] === '~함. 4' && ends.includes('~줌. 1') && ends.includes('문장 5개'), '어미 분포: ' + ends.join(','));
assert($('#endings .hot'), '함 4개·50% 초과 강조');
const warns = $$('#endWarn .warn').map(w => w.textContent);
assert(warns.length === 3 && /4개\(80%\)/.test(warns[0]) && /4문장 연달아/.test(warns[1]) && /마침표 없이 끝난 문장이 1개/.test(warns[2]), '경고 3개: ' + warns.join(' / '));
// 5) 문장 뼈대: 가장 적게 쓴 어미로 끝맺고, 받침에 맞는 조사
$$('#c0 .chip')[1].click(); $$('#c1 .chip')[0].click(); $$('#c2 .chip')[1].click();
assert($('#built').textContent === '과학 실험 시간에서 자기 생각을 근거를 들어 발표하며 배려심이 돋보임.', '뼈대(받침 있음): ' + $('#built').textContent);
$$('#c2 .chip')[5].click();
assert($('#built').textContent.endsWith('끈기가 돋보임.'), '뼈대(받침 없음): ' + $('#built').textContent);
const before = ta.value.replace(/\s+$/, '');
$('#insBtn').click();
assert(ta.value === before + ' ' + '과학 실험 시간에서 자기 생각을 근거를 들어 발표하며 끈기가 돋보임.', '문장 넣기: ' + ta.value);
// '임' 어미가 생겼으니 다음 뼈대는 다른(덜 쓴) 어미
assert(!$('#built').textContent.endsWith('돋보임.'), '어미 돌려쓰기: ' + $('#built').textContent);
// 6) 내 규칙 추가·삭제
$('#newWord').value = '1등'; $('#newTip').value = '석차 표현'; $('#addRule').click();
put('달리기에서 1등을 함.');
assert(marks().includes('user:1등'), '내 규칙 강조: ' + marks().join(' '));
$('#addRule').click();
const ub = $$('#rules [data-u]');
assert(ub.length === 1, '빈 입력·중복 규칙은 추가 안 됨');
ub[0].click();
assert(!marks().some(m => m.startsWith('user:')), '내 규칙 삭제');
// 7) 저장
await wait(450);
const st = JSON.parse(localStorage.getItem('edu-expo.record-helper.v1') || 'null');
assert(st && st.txt === '달리기에서 1등을 함.' && st.max === 1500 && st.user.length === 0, '저장(항목을 바꾸면 최대 바이트도 1500으로 저장돼야 함): ' + JSON.stringify(st));
return 'ok 7';
