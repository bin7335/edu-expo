// 24 술술 읽기: 글자 크기 배율·줄 간격·배경·줄 가리개·문장 나누기·저장·끄기
const er = window.__easyReader;
assert(er, '__easyReader 가 있어야 함');
const root = $('#easy-reader-host').shadowRoot, H = document.documentElement;
const panelBtn = s => root.querySelector(s);
const range = (id, v) => { const i = root.getElementById(id); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };
assert(er.state.on && er.state.size === 110 && H.classList.contains('er-cream'), '체험 기본값(110%, 크림)으로 켜져 있어야 함');
// 1) 글자 크기: 원래 크기 × 배율
const p = $('#art p:not(.by)');
range('size', 100); await wait(50);
const base = parseFloat(getComputedStyle(p).fontSize);
assert(!p.style.fontSize, '100%면 인라인 글자 크기가 없어야 함');
range('size', 150); await wait(50);
const big = parseFloat(getComputedStyle(p).fontSize);
assert(Math.abs(big - base * 1.5) < 0.05, `150% 글자 크기 ${big} = ${base}x1.5`);
assert(root.querySelector('output[data-for=size]').textContent === '150%', '크기 표시 150%');
range('size', 120); await wait(50);
assert(Math.abs(parseFloat(getComputedStyle(p).fontSize) - base * 1.2) < 0.05, '배율은 누적되지 않고 원래 크기 기준');
// 2) 줄 간격 5 → --er-lh 2.05, 클래스 켜짐
range('lh', 5);
assert(H.classList.contains('er-lh') && H.style.getPropertyValue('--er-lh') === '2.05', '줄 간격 2.05: ' + H.style.getPropertyValue('--er-lh'));
assert(Math.abs(parseFloat(getComputedStyle(p).lineHeight) / parseFloat(getComputedStyle(p).fontSize) - 2.05) < 0.02, '문단 줄 간격이 실제로 2.05배');
// 3) 배경: 어두움으로 바꾸면 크림이 빠짐
panelBtn('[data-theme=dark]').click();
assert(H.classList.contains('er-dark') && !H.classList.contains('er-cream'), '어두움 배경');
// 4) 줄 가리개: 마우스 y=300, 띠 90 → 띠 위쪽 255
assert(er.state.ruler, '줄 가리개 켜짐');
window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 300 }));
const band = root.querySelector('.band');
assert(band.style.top === '255px' && band.style.height === '90px', '띠 위치: ' + band.style.top + ' ' + band.style.height);
assert(root.querySelector('.shade.top').style.height === '255px', '위 가림막 높이 255');
// 5) 문장 나누기(읽어 주기 단위)
const ch = er._test.splitChunks('꿀벌은 춤을 춰요. 왜 그럴까요? 친구에게 알려요');
assert(ch.length === 3, '문장 3개로 나눔: ' + JSON.stringify(ch));
const long = '가나다라마 '.repeat(60);
assert(er._test.splitChunks(long).every(([a, b]) => b - a <= 181), '180자 넘는 문장은 잘라서 읽음');
// 범위 글자 지도: 문단이 바뀌면 줄바꿈, 위치로 범위 되찾기
const ps = $$('#art p'); const idx = ps.findIndex(x => x.textContent.startsWith('봄이 되면'));
const rg = document.createRange(); rg.setStart(ps[idx], 0); rg.setEnd(ps[idx + 1], ps[idx + 1].childNodes.length);
const map = er._test.textMap(rg);
assert(map.text.includes('\n') && map.text.startsWith('봄이 되면'), '문단 사이 줄바꿈: ' + map.text.slice(0, 20));
const sub = er._test.rangeAt(map, 0, 2);
assert(sub && sub.toString() === '봄이', 'rangeAt 으로 글자 위치 되찾기: ' + (sub && sub.toString()));
// 6) 설정 저장(localStorage)
await wait(400);
const g = JSON.parse(localStorage.getItem('easy-reader:global') || 'null');
assert(g && g.size === 120 && g.lh === 5 && g.theme === 'dark', '설정 저장: ' + JSON.stringify(g));
// 7) 처음대로 → 기본값, 인라인 크기 복원
panelBtn('[data-act=reset]').click();
assert(er.state.size === 100 && !H.classList.contains('er-dark') && !p.style.fontSize, '처음대로');
range('size', 140);
// 8) 끄기 → 효과가 모두 사라지고 원래 크기, 다시 켜면 복원
panelBtn('[data-act=off]').click();
assert(!er.state.on && !/er-/.test(H.className) && !p.style.fontSize && Math.abs(parseFloat(getComputedStyle(p).fontSize) - base) < 0.05, '끄면 원래 페이지로');
er.show();
assert(er.state.on && Math.abs(parseFloat(getComputedStyle(p).fontSize) - base * 1.4) < 0.05, '다시 켜면 설정 복원');
return 'ok 8';
