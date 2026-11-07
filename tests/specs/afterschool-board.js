// 20 방과후 한눈에(콘셉트): 학년·요일·분야 필터 조합 결과가 정답과 같고, 개수 표시·빈 결과 안내·강사 소개 펼치기가 동작
const pickF = (row, v) => $$(`#${row} .f`).find(b => b.textContent === v).click();
const names = () => $$('#grid .card h4').map(h => h.textContent);
const cnt = () => Number($('#cnt').textContent);
const expect = (want, tag) => {
  const got = names();
  assert(cnt() === want.length && got.length === want.length && want.every(w => got.includes(w)), `${tag}: ${got.join(',')}`);
};
assert(cnt() === 11 && names().length === 11, '전체 11개');
pickF('fg', '3-4학년');
expect(['꼬마 로봇 코딩', '우쿨렐레 앙상블', '생활 과학 실험실', '바둑과 수 놀이', '줄넘기 챌린지', '토론 글쓰기 교실', '보드게임 전략반'], '3-4학년');
assert($$('#fg .f.on').length === 1 && $$('#fg .f.on')[0].textContent === '3-4학년', '선택 버튼 하나만 켜짐');
pickF('fd', '화');
expect(['우쿨렐레 앙상블', '바둑과 수 놀이'], '3-4학년·화');
assert($$('#grid .card .m').every(m => m.textContent.includes('화')), '화요일 강좌만');
pickF('fg', '전체');
expect(['우쿨렐레 앙상블', '바둑과 수 놀이', '앱 만들기 기초'], '화');
pickF('fd', '전체'); pickF('ff', '과학·코딩');
expect(['꼬마 로봇 코딩', '생활 과학 실험실', '앱 만들기 기초'], '과학·코딩');
pickF('fg', '5-6학년');
expect(['앱 만들기 기초'], '5-6학년·과학');
// 맞는 강좌가 없으면 안내
pickF('fg', '1-2학년'); pickF('fd', '목'); pickF('ff', '체육');
assert(cnt() === 0 && $('#grid .empty') && !$('#grid .card'), '빈 결과 안내');
// 전체로 되돌리기
pickF('fg', '전체'); pickF('fd', '전체'); pickF('ff', '전체');
assert(cnt() === 11, '전체 복귀');
// 마감 상태 배지
const card = n => $$('#grid .card').find(c => c.querySelector('h4').textContent === n);
assert(card('방송댄스 크루').querySelector('.st').textContent === '마감' && card('꼬마 로봇 코딩').querySelector('.st').textContent === '마감 임박', '상태 배지');
// 강사 소개 펼치기/접기
const b = card('바둑과 수 놀이').querySelector('button');
b.click();
assert(card('바둑과 수 놀이').classList.contains('show') && b.textContent.includes('접기'), '강사 소개 펼침');
assert(getComputedStyle(card('바둑과 수 놀이').querySelector('.tc')).display !== 'none', '강사 소개 보임');
b.click();
assert(!card('바둑과 수 놀이').classList.contains('show') && b.textContent.includes('강사 소개'), '접기');
return 'ok';
