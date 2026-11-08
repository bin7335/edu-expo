// 93 설문 한눈에: 구글폼 TSV(따옴표 안 줄바꿈) 예시 → 문항 유형 자동 판별, 객관식·복수응답·척도 집계 정답값, 서술형 모음·키워드, CSV 따옴표 파싱, 유형 바꾸기, 결과 표 복사, 저장
const st = window.__st;
assert(st, '__st 가 있어야 함');
const cards = () => $$('#cards .qcard');
const card = i => cards()[i];
const bar = (c, lab) => [...c.querySelectorAll('.brow')].find(r => r.querySelector('.lab').textContent === lab);
// 1) 예시: 타임스탬프 열은 제외, 문항 5개, 응답 20명
assert(/응답 20명/.test($('#summary').textContent) && /문항 5개/.test($('#summary').textContent), '요약: ' + $('#summary').textContent);
assert(/타임스탬프/.test($('#skipped').textContent), '제외한 열 표시: ' + $('#skipped').textContent);
assert(cards().length === 5, '문항 카드 5개: ' + cards().length);
assert(cards().map(c => c.dataset.type).join() === 'single,scale,multi,single,text', '유형 판별: ' + cards().map(c => c.dataset.type));
// 2) 객관식: 자녀 학년(1학년 4명 20%), 상담 방식(대면 8명 40%, 많은 순)
assert(bar(card(0), '1학년').querySelector('.cnt').textContent === '4명 (20%)' && bar(card(0), '6학년').querySelector('.cnt').textContent === '3명 (15%)', '학년: ' + bar(card(0), '1학년').textContent);
const c3 = [...card(3).querySelectorAll('.brow')].map(r => r.querySelector('.lab').textContent + ' ' + r.querySelector('.cnt').textContent);
assert(c3.join(' | ') === '대면 8명 (40%) | 전화 7명 (35%) | 온라인(화상) 3명 (15%) | 문자·메신저 2명 (10%)', '상담 방식(많은 순): ' + c3.join(' | '));
assert(bar(card(3), '대면').querySelector('.track i').style.width === '40%', '막대 너비 40%');
// 3) 척도: 평균 82/20 = 4.10, 5점 7명(35%), 1점 0명
assert(card(1).querySelector('.avg').textContent === '4.10', '척도 평균: ' + card(1).querySelector('.avg').textContent);
assert(bar(card(1), '5점').querySelector('.cnt').textContent === '7명 (35%)' && bar(card(1), '1점').querySelector('.cnt').textContent === '0명 (0%)', '척도 분포');
assert([...card(1).querySelectorAll('.brow .lab')].map(l => l.textContent).join() === '5점,4점,3점,2점,1점', '척도는 5→1 순서');
// 4) 복수응답: 응답자 대비 비율, 체험학습 11명 55% 가장 위
const c2 = [...card(2).querySelectorAll('.brow')].map(r => r.querySelector('.lab').textContent + ' ' + r.querySelector('.cnt').textContent);
assert(c2[0] === '체험학습 11명 (55%)' && c2.includes('독서 교육 8명 (40%)') && c2.includes('생태 교육 4명 (20%)') && c2.length === 5, '복수응답: ' + c2.join(' | '));
// 5) 서술형: 빈 응답 제외 13건, 줄바꿈 응답 보존, 키워드
assert(card(4).querySelectorAll('.ans li').length === 13 && /13건/.test(card(4).textContent), '서술형 13건');
assert([...card(4).querySelectorAll('.ans li')].some(li => li.textContent === '도서관 개방 시간을\n늘려 주세요'), '따옴표 안 줄바꿈 보존');
const kw = [...card(4).querySelectorAll('.kw span')].map(s => s.textContent);
assert(kw[0] === '감사합니다 3' && kw.includes('교통 2') && kw.includes('체험학습 2') && kw.includes('방과후학교 2') && !kw.some(k => /^주세요/.test(k)), '키워드: ' + kw.join(','));
// 6) CSV 파싱: 따옴표 안 쉼표·줄바꿈·이중 따옴표
const P = st.parse('이름,의견,점수\r\n"김, 하늘","좋아요, 정말\n최고",5\n"이""별""",보통,4\n');
assert(JSON.stringify(P) === JSON.stringify([['이름', '의견', '점수'], ['김, 하늘', '좋아요, 정말\n최고', '5'], ['이"별"', '보통', '4']]), 'CSV 파싱: ' + JSON.stringify(P));
assert(JSON.stringify(st.parse('a\tb\n"x\ty"\t2')) === JSON.stringify([['a', 'b'], ['x\ty', '2']]), 'TSV 따옴표');
// 붙여넣기 → 이름 열은 개인정보로 제외, 점수는 척도
$('#raw').value = '이름,의견,점수\n"김, 하늘","좋아요",5\n"이별",보통,4\n박하늘,좋아요,3\n'; fire($('#raw'), 'input');
await wait(450);
assert(cards().length === 2 && /이름/.test($('#skipped').textContent) && /응답 3명/.test($('#summary').textContent), '이름 열 제외: ' + $('#skipped').textContent);
assert(card(1).dataset.type === 'scale' && card(1).querySelector('.avg').textContent === '4.00', '점수 척도 평균 4.00');
assert(!/김, 하늘/.test($('#cards').textContent), '제외한 열 값은 화면에 안 나옴');
// 7) 유형 바꾸기: 의견을 서술형으로
const sel = card(0).querySelector('select'); sel.value = 'text'; fire(sel, 'change');
assert(card(0).dataset.type === 'text' && card(0).querySelectorAll('.ans li').length === 3, '유형 바꾸기');
// 제외 → 열 목록으로
const sel2 = card(0).querySelector('select'); sel2.value = 'skip'; fire(sel2, 'change');
assert(cards().length === 1 && /의견/.test($('#skipped').textContent), '제외로 바꾸기');
// 다시 넣기
$('#skipped [data-col]').click();
assert(cards().length >= 2, '제외 열 다시 넣기');
// 8) 예시 → 결과 표(TSV)
$('#sample').click(); await wait(100);
const tsv = st.tsv();
assert(tsv.includes('Q3. 도움이 된 교육활동(복수 선택)') && tsv.includes('체험학습\t11\t55%') && tsv.includes('평균\t4.10'), '결과 표: ' + tsv.slice(0, 200));
assert(/설문 결과/.test($('#ptitle').textContent), '인쇄 제목');
// 9) 저장
$('#title').value = '학부모 만족도 테스트'; fire($('#title'), 'input');
await wait(450);
const s = JSON.parse(localStorage.getItem('edu-expo.survey-tally.v1') || 'null');
assert(s && s.title === '학부모 만족도 테스트' && /자녀 학년/.test(s.raw), '저장');
return 'ok 9';
