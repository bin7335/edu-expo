// 10 생각꽃밭: 단어 추가·정규화·크기 반영, 겹침 없음, 지우기, 투표 집계, localStorage 저장
await wait(500);
const send = w => { $('#word').value = w; $('#sendForm').requestSubmit(); };
const span = w => $(`#cloud span[data-w="${w}"]`);
const fs = w => parseFloat(span(w).style.fontSize);
const saved = () => JSON.parse(localStorage.getItem('saenggak-kkotbat-v1'));
// 1) 새 단어 → 구름에 나타나고, 영어는 소문자·앞뒤 기호 제거
send('  Hello!! ');
assert(span('hello'), "'hello'로 정규화되어 나타나야 함");
assert(saved().words.hello === 1, '저장 1회');
send('hello'); send('HELLO');
assert(saved().words.hello === 3, '같은 단어는 누적 3: ' + saved().words.hello);
assert(span('hello').title.includes('3번'), '툴팁 3번');
// 2) 많이 나온 단어가 더 크다
const before = fs('걱정');
for (let i = 0; i < 6; i++) send('걱정');
await wait(100);
assert(fs('걱정') > before, `걱정 크기 커짐 ${before}→${fs('걱정')}`);
assert(fs('창의력') >= fs('자기주도'), '6번 단어 ≥ 1번 단어 크기');
// 3) 단어끼리 겹치지 않고 상자 안
await wait(800);
const box = $('#cloud').getBoundingClientRect();
const rs = $$('#cloud span[data-w]').map(s => ({ w: s.dataset.w, r: s.getBoundingClientRect() }));
for (const a of rs) {
  assert(a.r.left >= box.left - 1 && a.r.right <= box.right + 1 && a.r.top >= box.top - 1 && a.r.bottom <= box.bottom + 1, '상자 밖: ' + a.w);
  for (const b of rs) if (a !== b) {
    const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    assert(!(ox > 4 && oy > 4), `겹침: ${a.w} / ${b.w}`);
  }
}
const n0 = Object.keys(saved().words).length;
assert($('#stats').textContent.includes(`단어 ${n0}개`), '통계 단어 수: ' + $('#stats').textContent);
// 4) 단어 눌러 하나 줄이기 / 완전히 지우기
assert(span('hello'), 'hello 단어가 구름에 있어야 함: ' + $$('#cloud span[data-w]').map(x => x.dataset.w).join(','));
span('hello').click();
assert($('#m1'), '단어 누르면 메뉴: ' + $('#box').innerHTML.slice(0, 80));
$('#m1').click();
assert(saved().words.hello === 2, '하나 줄이기 → 2');
span('hello').click(); $('#mDel').click();
assert(!span('hello') && !('hello' in saved().words), '완전히 지우기');
// 5) 투표: 누르면 표 수·퍼센트·총표 갱신
$('#tabs button[data-v="vote"]').click();
const v0 = saved().votes.slice(), tot0 = v0.reduce((a, b) => a + b, 0);
const btns = $$('.vbtn');
assert(btns.length === 4, '선택지 4개');
btns[3].click(); btns[3].click();
const v1 = saved().votes;
assert(v1[3] === v0[3] + 2, '4번 선택지 +2');
assert($('#vTotal').textContent === `총 ${tot0 + 2}표`, '총표: ' + $('#vTotal').textContent);
const pct = Math.round(v1[3] / (tot0 + 2) * 100);
assert($$('.barrow')[3].textContent.includes(`${v1[3]}표 · ${pct}%`), '퍼센트 표시');
// 6) 선택지 바꾸면 0표부터
// 러너가 a.click()을 막아 두므로 이벤트로 누른다
$('#optEdit').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const ois = $$('.oi'); ois.forEach((o, i) => o.value = ['찬성', '반대', '', '', ''][i]);
$('#oSave').click();
assert($$('.vbtn').length === 2 && saved().votes.join() === '0,0', '새 선택지 2개, 0표');
assert(saved().view === 'vote', '보던 화면 저장');
return 'ok';
