// 95 채점표 척척: 루브릭 총점·성취 수준·반 분포·평균 정답값, 칸 눌러 채점/취소, 피드백 문장 조합, 점수·구간·평가요소 수정, 명단 붙여넣기(점수 유지), CSV 수식 방지, 저장
const rs = window.__rs;
assert(rs, '__rs 가 있어야 함');
const t = s => $(s).textContent.trim();
const row = n => $$('#sheet tbody tr').find(r => r.querySelector('.sn').textContent === n);
const lvBtn = (n, c, l) => row(n).querySelectorAll('td.c')[c].querySelectorAll('button.lv')[l];
// 1) 예시 정답값: 20명 중 18명 채점, 합 169 → 평균 9.4 / 12, 최고 12, 최저 6
assert(t('#done') === '18/20' && t('#avg') === '9.4' && t('#max') === '12' && t('#hi') === '12' && t('#lo') === '6', '통계: ' + [t('#done'), t('#avg'), t('#max'), t('#hi'), t('#lo')]);
assert(row('김하늘').querySelector('.tot').textContent === '12' && row('김하늘').querySelector('.band').textContent === '잘함', '김하늘 12 잘함');
assert(row('최민준').querySelector('.tot').textContent === '7' && row('최민준').querySelector('.band').textContent === '노력요함', '최민준 7 노력요함');
assert(row('송채아').querySelector('.band').textContent === '미채점', '미채점 표시');
// 분포: 잘함 6, 보통 8, 노력요함 4
const bc = () => $$('#dist .drow').map(r => r.querySelector('.dl').textContent + ' ' + r.querySelector('.dc').textContent);
assert(bc().join(' | ') === '잘함 6명 | 보통 8명 | 노력요함 4명', '분포: ' + bc().join(' | '));
// 평가요소별 분포(주장: 상 8 중 7 하 3)
assert(/상 8 · 중 7 · 하 3/.test($$('#cdist .cd')[0].textContent), '요소별 분포: ' + $$('#cdist .cd')[0].textContent);
// 2) 칸 눌러 채점: 송채아 상·상·중 → 11 잘함, 평균 180/19 = 9.5
lvBtn('송채아', 0, 0).click(); lvBtn('송채아', 1, 0).click();
assert(row('송채아').querySelector('.band').textContent === '채점 중' && row('송채아').querySelector('.tot').textContent === '8', '일부만 채점: ' + row('송채아').textContent);
lvBtn('송채아', 2, 1).click();
assert(row('송채아').querySelector('.tot').textContent === '11' && row('송채아').querySelector('.band').textContent === '잘함', '송채아 11 잘함');
assert(t('#done') === '19/20' && t('#avg') === '9.5' && bc()[0] === '잘함 7명', '채점 후 통계: ' + t('#avg') + ' ' + bc()[0]);
assert(lvBtn('송채아', 0, 0).classList.contains('on'), '선택 표시');
// 피드백 문장
const fb = rs.feedback(rs.state().students.findIndex(s => s.name === '송채아'));
assert(fb === '주장이 분명하고 글 전체에서 일관되게 드러남. 주장을 뒷받침하는 알맞은 근거를 두 가지 이상 제시함. 문단 구성은 알맞으나 맞춤법을 조금 더 살피면 좋겠음.', '피드백: ' + fb);
assert($$('#fbList li').some(li => li.textContent.includes('송채아') && li.textContent.includes('두 가지 이상 제시함')), '피드백 목록');
// 같은 칸 다시 누르면 취소
lvBtn('송채아', 2, 1).click();
assert(row('송채아').querySelector('.band').textContent === '채점 중' && t('#done') === '18/20', '취소');
lvBtn('송채아', 2, 1).click();
// 3) 점수 바꾸기: 주장 상 4 → 5 → 최고 13, 김하늘 13
const sc = $('#crit [data-c="0"][data-l="0"].score'); sc.value = '5'; fire(sc, 'change');
assert(t('#max') === '13' && row('김하늘').querySelector('.tot').textContent === '13', '점수 수정: ' + t('#max'));
const sc2 = $('#crit [data-c="0"][data-l="0"].score'); sc2.value = '4'; fire(sc2, 'change');
assert(t('#max') === '12', '점수 되돌리기');
// 구간 바꾸기: 잘함 12점 이상 → 정예린(11) 보통
const b0 = $('#bands [data-b="0"].bmin'); b0.value = '12'; fire(b0, 'change');
assert(row('정예린').querySelector('.band').textContent === '보통' && row('김하늘').querySelector('.band').textContent === '잘함', '구간 수정');
assert(bc()[0] === '잘함 2명', '구간 수정 후 분포: ' + bc()[0]);
const b1 = $('#bands [data-b="0"].bmin'); b1.value = '11'; fire(b1, 'change');
// 기준 문장 바꾸면 피드백도
const d = $('#crit [data-c="2"][data-l="1"].desc'); d.value = '맞춤법을 조금 더 살피면 좋겠음'; fire(d, 'change');
assert(rs.feedback(rs.state().students.findIndex(s => s.name === '송채아')).endsWith('맞춤법을 조금 더 살피면 좋겠음.'), '기준 문장 반영');
// 4) 평가요소 추가·삭제
$('#addCrit').click();
assert($$('#sheet thead th.c').length === 4 && t('#max') === '16', '요소 추가 → 4개, 만점 16: ' + t('#max'));
assert(t('#done') === '0/20', '새 요소는 미채점이라 채점 완료 0');
$$('#crit [data-delc]')[3].click();
assert($$('#sheet thead th.c').length === 3 && t('#done') === '19/20', '요소 삭제');
// 5) 명단 붙여넣기: 같은 이름 점수는 유지
$('#roster').value = '1\t김하늘\n2 새학생\n=cmd'; $('#rosterBtn').click();
assert($$('#sheet tbody tr').length === 3 && row('김하늘').querySelector('.tot').textContent === '12' && row('새학생').querySelector('.band').textContent === '미채점', '명단 붙여넣기: ' + $$('#sheet tbody tr').length);
// 6) CSV
lvBtn('=cmd', 0, 2).click();
const csv = rs.csv().replace(/^﻿/, '').split('\r\n');
assert(csv[0] === '번호,이름,주장,근거,표현,총점,성취 수준,피드백', 'CSV 머리줄: ' + csv[0]);
assert(csv[1].startsWith('1,김하늘,상(4),상(4),상(4),12,잘함,'), 'CSV 1행: ' + csv[1]);
assert(csv.some(l => l.includes("'=cmd")) && !csv.some(l => /(^|,)=cmd/.test(l)), 'CSV 수식 방지');
// 7) 인쇄·저장
$('#printBtn').click();
assert(window.__printed >= 1, '인쇄');
await wait(400);
const st = JSON.parse(localStorage.getItem('edu-expo.rubric-score.v1') || 'null');
assert(st && st.students.length === 3 && st.criteria.length === 3 && st.criteria[2].levels[1].desc === '맞춤법을 조금 더 살피면 좋겠음', '저장');
return 'ok 7';
