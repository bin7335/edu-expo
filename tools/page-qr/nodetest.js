// node: 확장 qr-core.js 와 qr-maker 인코더 출력 비교 + 디코딩 왕복 + 주소 정리 로직 테스트
const fs = require('fs'), vm = require('vm'), path = require('path');
const { decodeMatrix } = require('./decoder.js');
const root = process.argv[2];
const NL = String.fromCharCode(10);
const ctx = vm.createContext({ TextEncoder, URL, URLSearchParams, console });
vm.runInContext(fs.readFileSync(path.join(root, 'extensions/page-qr/qr-core.js'), 'utf8') + NL + 'globalThis.QR=QR;globalThis.PageQR=PageQR;', ctx);
const html = fs.readFileSync(path.join(root, 'qr-maker/index.html'), 'utf8');
const a0 = html.indexOf('const QR = (() => {'), a1 = html.indexOf('return { encode, toSvg };', a0);
const enc = html.slice(a0, html.indexOf('})();', a1) + 5);
const ctx2 = vm.createContext({ TextEncoder });
vm.runInContext(enc + NL + 'globalThis.QR=QR;', ctx2);
// 체험 페이지에 들어간 코드가 확장 파일과 같은지
const demo = fs.readFileSync(path.join(root, 'ext-page-qr/index.html'), 'utf8');
const same = ['qr-core.js', 'popup-ui.js', 'popup.css'].map(f => [f, demo.includes(fs.readFileSync(path.join(root, 'extensions/page-qr', f), 'utf8').trimEnd())]);
console.log('demo embeds same code:', JSON.stringify(same));

let fail = 0;
const ok = (c, m) => { if (!c){ fail++; console.log('FAIL', m); } };
const samples = ['https://example.org/class/4-2/notice', 'https://bin7335.github.io/edu-expo/ext-page-qr/',
  'https://example.org/검색?q=물의 순환&x=1', 'http://a.b', 'https://example.org/' + 'x'.repeat(400), 'https://example.org/' + 'y'.repeat(1500)];
for (const s of samples){
  const a = ctx.QR.encode(s), b = ctx2.QR.encode(s);
  ok(JSON.stringify(a.modules) === JSON.stringify(b.modules), 'same as qr-maker: ' + s.slice(0, 40));
  const d = decodeMatrix(a.modules);
  ok(d.text === s, 'decode roundtrip: ' + s.slice(0, 40));
  console.log(`v${a.ver} ${a.size}x${a.size} mask${a.mask} len${s.length} decode=${d.text === s}`);
}
const P = ctx.PageQR;
const c1 = P.clean('https://example.org/class/4-2/notice?utm_source=newsletter&utm_medium=email&utm_campaign=nov&fbclid=IwAR0dEmO123');
ok(c1.url === 'https://example.org/class/4-2/notice' && c1.removed.length === 4, 'clean ' + JSON.stringify(c1));
const c2 = P.clean('https://example.org/a?id=7&gclid=x&utm_term=y#sec?z');
ok(c2.url === 'https://example.org/a?id=7#sec?z', 'clean keep ' + c2.url);
const c3 = P.clean('https://youtu.be/abc?si=TRACK&t=30');
ok(c3.url === 'https://youtu.be/abc?t=30', 'youtube si ' + c3.url);
const c4 = P.clean('https://example.org/x?si=keep');
ok(c4.url === 'https://example.org/x?si=keep' && !c4.removed.length, 'si non-youtube kept');
ok(P.parseWeb('example.org/abc').href === 'https://example.org/abc', 'auto https');
ok(!P.parseWeb('javascript:alert(1)') && !P.parseWeb('chrome://settings') && !P.parseWeb('file:///C:/a.html') && !P.parseWeb('data:text/html,hi'), 'reject non-web');
ok(P.why('chrome://settings/').includes('특수'), 'why chrome');
ok(P.why('file:///C:/a.html').includes('file'), 'why file');
ok(P.why('https://example.org/') === '', 'why web');
ok(P.readBigQuery('?u=' + encodeURIComponent('javascript:alert(1)')) === null, 'big rejects javascript');
ok(P.readBigQuery('?u=' + encodeURIComponent('example.org')) === null, 'big rejects schemeless');
ok(P.readBigQuery('?u=' + encodeURIComponent('data:text/html,<b>x')) === null, 'big rejects data');
const bq = P.readBigQuery(P.bigQuery('https://example.org/a?b=1&c=2', '<img src=x onerror=alert(1)> 제목'));
ok(bq && bq.url === 'https://example.org/a?b=1&c=2' && bq.title.startsWith('<img'), 'big roundtrip ' + JSON.stringify(bq));
ok(P.shortUrl('https://www.example.org/') === 'example.org', 'short ' + P.shortUrl('https://www.example.org/'));
ok(P.fileName('a/b:c*?', '') === 'QR-a b c.png', 'filename ' + P.fileName('a/b:c*?', ''));
ok(P.parseWeb('example.org:8080/x').href === 'https://example.org:8080/x', 'port'); ok(P.parseWeb('localhost:3000').href === 'https://localhost:3000/', 'localhost'); ok(!P.parseWeb('mailto:a@b.c'), 'mailto');
console.log(fail ? `${fail} FAIL` : 'ALL PASS');
