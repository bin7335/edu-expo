// 22 프롬프트 서랍(콘셉트): 교과·활동·학년 필터와 검색 결과가 정답과 같고, 빈칸 강조, 빈 결과 안내, 복사 버튼 피드백
const titles = () => $$('#grid .pc h4').map(h => h.textContent.replace(/^\S+\s/, ''));
const cnt = () => Number($('#cnt').textContent);
const chip = (id, v) => $$(`#${id} .chip`).find(b => b.textContent === v).click();
const search = v => { $('#q').value = v; fire($('#q'), 'input'); };
const grade = v => { $('#gr').value = v; fire($('#gr'), 'change'); };
const expect = (want, tag) => { const got = titles(); assert(cnt() === want.length && got.length === want.length && want.every(w => got.includes(w)), `${tag}: ${got.join(',')}`); };
assert(cnt() === 12 && titles().length === 12, '전체 12장');
// 빈칸 강조: [ ]가 mark로 감싸짐
assert($$('#grid pre mark').length >= 12 && $$('#grid pre mark').every(m => /^\[.+\]$/.test(m.textContent)), '빈칸 [ ] 강조');
// 교과·활동 필터
chip('sub', '과학');
expect(['서술형 평가 채점 기준', '실험 안전 수칙 퀴즈'], '과학');
assert($$('#sub .chip.on').length === 1, '교과 칩 하나만 켜짐');
chip('act', '활동지');
assert(cnt() === 0 && $('#grid .empty'), '과학·활동지 → 빈 결과 안내');
chip('act', '평가'); expect(['서술형 평가 채점 기준', '실험 안전 수칙 퀴즈'], '과학·평가');
chip('sub', '전체'); chip('act', '전체');
// 학년: 3-4학년 + 전 학년 카드
grade('3-4');
expect(['분수 개념 오개념 찾기', '수준별 읽기 자료 3단계', '실험 안전 수칙 퀴즈', '영어 역할극 대본', '성장 중심 피드백 문장', '알림장 쉬운 말 다듬기'], '3-4학년');
grade('');
// 검색(제목·본문·태그), 대소문자 무시, 앞뒤 공백 무시
search('토론'); expect(['찬반 토론 근거 카드'], '토론');
search('  분수 '); expect(['분수 개념 오개념 찾기'], '분수');
search('피드백'); expect(['성장 중심 피드백 문장', '알림장 쉬운 말 다듬기'], '피드백');
search('없는말xyz'); assert(cnt() === 0 && $('#grid .empty'), '검색 결과 없음 안내');
search('');
assert(cnt() === 12, '검색 지우면 전체');
// 복사 버튼
const b = $$('#grid .cp')[0];
b.click(); await wait(300);
assert(b.textContent === '✓ 복사됨' && b.classList.contains('done') && $('#toast').classList.contains('on'), '복사 피드백: ' + b.textContent);
await wait(1700);
assert(b.textContent === '복사' && !b.classList.contains('done'), '잠시 뒤 원래대로');
return 'ok';
