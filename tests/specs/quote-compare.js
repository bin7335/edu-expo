// 33 견적 비교: 업체별 합계·부가세(포함/별도 견적 환산)·최저가·미견적 제외·조합 절감·품의 문구·한글 금액
const qc = window.__qc;
assert(qc, '__qc 가 있어야 함');
const t = id => $('#' + id).textContent;
// 1) 샘플 합계 (정답값 손계산)
// 햇살과학(별도): 387,600 + 38,760 = 426,360 / 푸른교구사(포함): 423,060 = 384,600 + 38,460 / 새싹(별도, 전자저울 미견적): 313,200 + 31,320 = 344,520
assert(t('fsupply_0') === '387,600' && t('fvat_0') === '38,760' && t('ftotal_0') === '426,360', '햇살과학 합계: ' + [t('fsupply_0'), t('fvat_0'), t('ftotal_0')]);
assert(t('fsupply_1') === '384,600' && t('fvat_1') === '38,460' && t('ftotal_1') === '423,060', '푸른교구사 합계(포함 견적 역산): ' + [t('fsupply_1'), t('fvat_1'), t('ftotal_1')]);
assert(t('ftotal_2') === '344,520 (미견적 1)', '새싹 합계·미견적: ' + t('ftotal_2'));
// 2) 최저가: 미견적 업체(더 싸도)는 제외 → 푸른교구사
let C = qc.calc();
assert(C.win === 1 && $('#ftotal_1').classList.contains('best'), '최저 업체 = 푸른교구사');
const cards = $$('#cards .card');
assert(cards[1].classList.contains('win') && cards[0].querySelector('.gap').textContent === '최저가보다 3,300원 비쌈', '카드 차액: ' + cards[0].textContent);
assert(cards[2].querySelector('.miss') && !cards[2].classList.contains('win'), '미견적 업체 경고');
// 3) 품목별 최저 조합: 375,600 × 1.1 = 413,160, 최저 업체보다 9,900원 적음
assert(Math.round(C.combo) === 413160 && /413,160원/.test(t('combo')) && /9,900원 적어요/.test(t('combo')), '조합: ' + t('combo'));
// 품목별 최저 칸 강조: 비커는 새싹(60,000×1.1=66,000), 보안경은 햇살·푸른 동률
assert($('#a0_2').classList.contains('best') && !$('#a0_0').classList.contains('best') && $('#a0_2').textContent === '66,000', '비커 최저: ' + $('#a0_2').textContent);
assert($('#a5_0').classList.contains('best') && $('#a5_1').classList.contains('best'), '보안경 동률 둘 다 강조');
assert(t('a6_2') === '미견적', '미견적 칸');
// 4) 품의 문구
const memo = qc.memo();
assert(memo.includes('푸른교구사가 최저가로') && memo.includes('재료 구입을 위하여') && memo.includes('3개 업체'), '조사: ' + memo.split('\n')[1]);
assert(memo.includes('다. 소요 예산: 금423,060원(금사십이만삼천육십원), 부가세 포함'), '소요 예산 줄: ' + memo);
assert(memo.includes('라. 품    목: 비커 외 6종') && memo.includes('새싹사이언스 344,520원(일부 미견적)'), '품목·비교 줄');
// 한글 금액
assert(qc.korMoney(100000000) === '일억' && qc.korMoney(10010) === '일만일십' && qc.korMoney(1234567) === '일백이십삼만사천오백육십칠' && qc.korMoney(0) === '영', '한글 금액: ' + qc.korMoney(1234567));
// 5) 부가세 별도로 보기 → 칸·카드가 공급가 기준
$('#vatSeg [data-v="excl"]').click();
assert(t('a0_1') === '66,000' && $$('#cards .card')[1].querySelector('.big').textContent.startsWith('384,600'), '별도 보기: ' + t('a0_1'));
assert($$('#cards .card')[0].querySelector('.gap').textContent === '최저가보다 3,000원 비쌈', '별도 보기 차액(공급가 기준)');
$('#vatSeg [data-v="incl"]').click();
assert(t('a0_1') === '72,600', '포함 보기 복귀');
// 6) 푸른교구사를 '부가세 별도 견적'으로 바꾸면 합계 465,366 → 최저는 햇살과학
const vs = $('#tbl select[data-v="1"]'); vs.value = 'excl'; fire(vs, 'change');
assert(t('ftotal_1') === '465,366' && t('fvat_1') === '42,306' && qc.calc().win === 0, '별도 견적 전환: ' + t('ftotal_1'));
vs.value = 'incl'; fire(vs, 'change');
// 7) 새싹 전자저울 30,000 입력 → 미견적 해소, 373,200+37,320=410,520 으로 최저
const pin = $('#tbl tr[data-r="6"] input[data-k="p"][data-v="2"]');
pin.value = '30,000'; fire(pin, 'input');
assert(t('ftotal_2') === '410,520' && qc.calc().win === 2 && qc.memo().includes('새싹사이언스가 최저가로'), '미견적 채우면 최저: ' + t('ftotal_2'));
// 수량 바꾸기: 전자저울 1대 → 새싹 377,520
const qin = $('#tbl tr[data-r="6"] input[data-k="qty"]'); qin.value = '1'; fire(qin, 'input');
assert(t('ftotal_2') === '377,520', '수량 반영: ' + t('ftotal_2'));
// 8) 품목 삭제·추가, 저장
$('#tbl [data-del="6"]').click();
assert($$('#tbl tbody tr').length === 6 && qc.state().items.length === 6, '품목 삭제');
$('#addRow').click();
assert($$('#tbl tbody tr').length === 7 && t('a6_0') === '미견적', '빈 품목 추가 → 미견적');
assert(qc.calc().win === -1 && /정할 수 없어요/.test(qc.memo()), '모든 업체 미견적이면 최저 없음');
assert(JSON.parse(localStorage.getItem('quote-compare-v1')).items.length === 7, '저장');
// 비교표 TSV 머리줄
assert(qc.tsv().split('\n')[0].split('\t').length === 4 + 3 * 2, '비교표 TSV 열 수');
return 'ok 8';
