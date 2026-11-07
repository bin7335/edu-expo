// 46 다함께 퀴즈쇼: 스프레드시트 붙여넣기 파싱(번호·①·OX·단답·오류), 정답 공개, 모둠 점수, 동점 공동 순위
// 파싱 규칙
const p = parseQuiz('# 주석\n가장 큰 수는?\t2\t3\t9\t5\n두 번째는?|③|가|나|다\n해는 동쪽에서 뜬다|o\n7×8=?|56\n틀린 줄|없는답|가|나');
assert(p.qs.length === 4 && p.errors.length === 1, '4문제·오류 1: ' + JSON.stringify(p));
assert(p.qs[0].type === 'mc' && p.qs[0].answer === '9', '정답 번호 2 → 두 번째 보기 9');
assert(p.qs[1].correct === 2 && p.qs[1].answer === '다', '③ → 세 번째 보기');
assert(p.qs[2].type === 'ox' && p.qs[2].answer === 'O', '소문자 o → OX 정답 O');
assert(p.qs[3].type === 'sa' && p.qs[3].answer === '56', '보기 없으면 단답형');
assert(p.errors[0].includes('6번째 줄'), '오류 줄 번호: ' + p.errors[0]);
const r = ranking([{ name: 'A', score: 3 }, { name: 'B', score: 5 }, { name: 'C', score: 5 }, { name: 'D', score: 1 }]);
assert(r.map(t => t.name + t.rank).join() === 'B1,C1,A3,D4', '동점 공동 순위 1,1,3,4: ' + r.map(t => t.name + t.rank).join());
// 문제 넣기: 엑셀에서 탭으로 복사한 내용 붙여넣기
$('#edit').click(); await wait(50);
const src = $('#src');
src.value = '가장 큰 수는?\t2\t3\t9\t5\n해는 동쪽에서 뜬다\tO\n7×8=?\t56\n틀린 줄\t없는답\t가\t나';
src.dispatchEvent(new Event('paste', { bubbles: true })); await wait(100);
assert(!src.value.includes('\t') && src.value.includes('가장 큰 수는?|2|3|9|5'), '붙여넣은 탭 → |');
assert($('#chk').innerText.includes('3문제 인식 (OX 1 · 보기 1 · 단답 1)') && $('#chk').innerText.includes('보기에 없어요'), '인식 결과: ' + $('#chk').innerText);
$('#sname').value = '테스트 세트'; $('#teams').value = '3';
$('#mApply').click(); await wait(100);
assert($('#setName').textContent === '테스트 세트' && $('#qtot').textContent === '3', '세트 적용: 3문제');
assert($$('#board .team').length === 3, '3모둠');
// 1번(보기형): 제한 시간 15초, 정답 공개 시 9 표시
assert($('#tnum').textContent === '15', '보기형 자동 15초: ' + $('#tnum').textContent);
$('#bReveal').click(); await wait(50);
assert($('#opts').classList.contains('revealed') && $('#opts .opt.right').innerText.includes('9'), '정답 9 공개');
$('#bNext').click(); await wait(50);
assert($('#qtype').textContent === 'OX 퀴즈' && $('#tnum').textContent === '10', 'OX 10초');
// 점수: 1모둠 2점, 2모둠 2점, 3모둠 1점 → 공동 1위
const plus = i => $(`#board button[data-d="1"][data-i="${i}"]`).click();
plus(0); plus(0); plus(1); plus(1); plus(2);
$(`#board button[data-d="-1"][data-i="2"]`).click(); plus(2);
assert($$('#board .ts').map(e => e.textContent).join() === '2,2,1', '점수 2,2,1: ' + $$('#board .ts').map(e => e.textContent).join());
assert($$('#board .team.lead').length === 2, '선두 2모둠 강조');
$('#bNext').click(); await wait(50);
assert($('#bNext').textContent.includes('순위'), '마지막 문제에서 순위 버튼');
$('#bNext').click(); await wait(100);
assert($('#rank').classList.contains('on'), '순위 발표 화면');
const ranks = $$('#podium .pcol').map(c => c.dataset.r).sort().join();
assert(ranks === '1,1,3', '시상대 순위 1,1,3: ' + ranks);
// 새로 고침 후에도 세트·점수 유지
const saved = JSON.parse(localStorage.getItem('quiz-show-goldenbell-v1'));
assert(saved.name === '테스트 세트' && saved.teams.map(t => t.score).join() === '2,2,1', '저장됨');
return 'ok 19';
