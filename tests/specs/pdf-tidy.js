// 28 PDF 정리: 합치기 쪽수·회전·삭제·범위 추출·쪽번호·원래 순서 (저장된 bytes를 PDFDocument.load로 다시 읽어 확인)
for (let i = 0; i < 50 && !window.__tidyReady; i++) await wait(100);
assert(window.__tidyReady, '샘플 준비 완료');
const Core = TidyCore(PDFLib);
const saved = [];
const origURL = URL.createObjectURL;
URL.createObjectURL = b => { saved.push({ blob: b }); return origURL.call(URL, b); };
HTMLAnchorElement.prototype.click = function () { if (saved.length) saved[saved.length - 1].name = this.download; };
const lastPdf = async () => { const s = saved[saved.length - 1]; return { name: s.name, doc: await PDFLib.PDFDocument.load(new Uint8Array(await s.blob.arrayBuffer())) }; };
const waitSave = async n => { for (let i = 0; i < 100 && saved.length < n; i++) await wait(50); assert(saved.length >= n, '저장 파일 생성: ' + $('#msg').textContent); };
// 페이지 내용 스트림(압축 풀기)에서 쪽번호 글자 찾기
const pageText = async (doc, i) => {
  const page = doc.getPage(i), ctx = doc.context, C = page.node.Contents();
  const refs = C instanceof PDFLib.PDFArray ? C.asArray() : [C];
  let out = '';
  for (const r of refs) {
    const st = ctx.lookup(r); let bytes = st.contents;
    if (String(st.dict.get(PDFLib.PDFName.of('Filter')) || '').includes('Flate')) bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    out += new TextDecoder('latin1').decode(bytes);
  }
  return out;
};
const hex = s => [...s].map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).join('');
// 1) 첫 화면 5쪽, 카드 순서(안내문 1쪽이 두 번째)
assert($('#pageCount').textContent === '5' && $$('#pages .card').length === 5, '첫 화면 5쪽');
assert($$('#pages .card .nm')[1].textContent === '현장체험학습_안내문.pdf', '두 번째 카드는 안내문');
// 2) 전체 합치기 → 5쪽, A4, 파일명
$('#outName').value = '합친문서';
$('#mergeBtn').click(); await waitSave(1);
let r = await lastPdf();
assert(r.doc.getPageCount() === 5, '합친 PDF 5쪽: ' + r.doc.getPageCount());
assert(Math.round(r.doc.getPage(0).getWidth()) === 595, 'A4 너비');
assert(r.name === '합친문서.pdf', '파일명: ' + r.name);
assert((await pageText(r.doc, 2)).includes('<' + hex('- 3 -') + '>'), '3쪽에 "- 3 -" 쪽번호');
// 3) 쪽번호 형식·시작 번호: slash, 시작 10 → 마지막 쪽 "14 / 14"
$('#numFmt').value = 'slash'; $('#numStart').value = '10';
$('#mergeBtn').click(); await waitSave(2);
r = await lastPdf();
assert((await pageText(r.doc, 4)).includes('<' + hex('14 / 14') + '>'), '마지막 쪽 "14 / 14"');
$('#numOn').checked = false;
$('#mergeBtn').click(); await waitSave(3);
r = await lastPdf();
assert(!(await pageText(r.doc, 0)).includes('<' + hex('10 / 14') + '>'), '쪽번호 끄면 안 찍힘');
$('#numOn').checked = true; $('#numFmt').value = 'dash'; $('#numStart').value = '1';
// 4) 첫 쪽 오른쪽 회전, 두 번째 쪽 삭제 → 4쪽, 첫 쪽 90도
$('#pages [data-a="r"]').click();
$$('#pages [data-a="d"]')[1].click();
assert($('#pageCount').textContent === '4', '삭제 후 4쪽');
assert($$('#pages .card .meta')[0].textContent.includes('+90°'), '회전 표시');
$('#mergeBtn').click(); await waitSave(4);
r = await lastPdf();
assert(r.doc.getPageCount() === 4 && r.doc.getPage(0).getRotation().angle === 90 && r.doc.getPage(1).getRotation().angle === 0, '회전·삭제 반영: ' + r.doc.getPageCount() + ' ' + r.doc.getPage(0).getRotation().angle);
// 5) 범위 추출 "1-2, 4" → 3쪽, 파일명에 범위
$('#range').value = '1-2, 4';
$('#extractBtn').click(); await waitSave(5);
r = await lastPdf();
assert(r.doc.getPageCount() === 3 && r.name === '합친문서_1-2_4.pdf', '범위 추출: ' + r.doc.getPageCount() + ' ' + r.name);
assert(r.doc.getPage(0).getRotation().angle === 90, '추출에도 회전 유지');
// 6) 범위 해석 규칙
assert(JSON.stringify(Core.parseRange('3-1, 2, 5', 5)) === '[2,1,0,4]', '거꾸로 범위·중복 제거');
assert(JSON.stringify(Core.parseRange('1~2', 5)) === '[0,1]', '물결표 범위');
assert(JSON.stringify(Core.parseRange('1 - 3', 5)) === '[0,1,2]', '띄어 쓴 범위 "1 - 3"');
for (const bad of ['0', '6', 'abc', '']) { let e = ''; try { Core.parseRange(bad, 5); } catch (x) { e = x.message; } assert(e, '잘못된 범위 거부: ' + JSON.stringify(bad)); }
const n0 = saved.length;
$('#range').value = '7'; $('#extractBtn').click(); await wait(200);
assert(saved.length === n0 && /쪽 밖/.test($('#msg').textContent), '범위 밖이면 저장 안 함: ' + $('#msg').textContent);
// 7) 원래 순서: 파일·쪽 순서, 회전 0
$('#sortBtn').click();
const metas = $$('#pages .card .meta').map(x => x.textContent);
assert(metas.join('|') === '1 / 3쪽|2 / 3쪽|3 / 3쪽|2 / 2쪽', '원래 순서(지운 쪽 제외): ' + metas.join('|'));
// 8) 파일 칩 ✕ → 그 파일 쪽 모두 빠짐
$$('#files .chip button')[1].click();
assert($('#pageCount').textContent === '3' &&$$('#files .chip').length === 1, '파일 빼기');
return 'ok 8';
