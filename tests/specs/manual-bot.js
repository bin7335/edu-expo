// 39 업무 매뉴얼 봇(콘셉트): 키워드 질문 → 근거 있는 답, 모르는 질문 → 답하지 않음, 서식 미리보기, 입력 이스케이프
const ask = async s => { $('#q').value = s; $('#f').requestSubmit(); await wait(700); };
const lastBot = () => $$('#log .msg.bot').pop();
await ask('학폭 생기면 어떻게 해요?');
assert(lastBot().querySelector('h5')?.textContent.includes('학교폭력 초기 대응'), '학폭 질문 → 학교폭력 초기 대응: ' + lastBot().innerText);
assert(lastBot().innerText.includes('근거:'), '답에 근거 표시');
await ask('육아시간 신청');
assert(lastBot().querySelector('h5')?.textContent.includes('육아시간'), '육아시간 질문(연수 이수 시간과 헷갈리지 않음): ' + lastBot().innerText);
await ask('오늘 점심 메뉴 알려줘');
assert(!lastBot().querySelector('h5') && lastBot().innerText.includes('찾지 못했어요'), '모르는 질문은 답하지 않음: ' + lastBot().innerText);
assert(lastBot().querySelectorAll('.fb[data-q]').length === 3, '대신 질문 3개 제안');
// 서식 버튼 → 미리보기 창
await ask('질병결석 증빙');
lastBot().querySelector('.fb[data-form]').click(); await wait(100);
assert($('#modal').classList.contains('show') && $('#paper').innerText.includes('결석계'), '서식 미리보기: ' + $('#paper').innerText);
$('#cl').click(); await wait(50);
assert(!$('#modal').classList.contains('show'), '닫기');
// 입력 태그는 글자로
await ask('<b>굵게</b> 체험학습');
assert(!$$('#log .msg.me').pop().querySelector('b'), '입력한 태그가 HTML로 해석되면 안 됨');
return 'ok 7';
