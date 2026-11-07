const fs = require('fs'), path = require('path');
const root = process.argv[2], E = path.join(root, 'extensions', 'page-qr');
let html = fs.readFileSync(path.join(__dirname, 'demo.template.html'), 'utf8');
const rd = f => fs.readFileSync(path.join(E, f), 'utf8').replace(/\s+$/, '');
html = html.replace('/*@@CSS@@*/', () => rd('popup.css'))
           .replace('/*@@CORE@@*/', () => rd('qr-core.js'))
           .replace('/*@@UI@@*/', () => rd('popup-ui.js'));
fs.mkdirSync(path.join(root, 'ext-page-qr'), { recursive: true });
// tools/build-catalog.js가 넣은 og:auto·csp:auto 블록은 이전 파일에서 그대로 옮겨 둠 (다시 빌드해도 빠지지 않게)
const out = path.join(root, 'ext-page-qr', 'index.html');
if (fs.existsSync(out)) {
  const old = fs.readFileSync(out, 'utf8');
  const og = old.match(/<!-- og:auto -->[\s\S]*?<!-- \/og:auto -->/), csp = old.match(/<!-- csp:auto -->[\s\S]*?<!-- \/csp:auto -->/);
  if (og) html = html.replace(/<\/head>/i, () => og[0] + '\n</head>');
  if (csp) html = html.replace(/(<meta\s+charset=["']?[\w-]+["']?\s*\/?>)/i, (m) => m + '\n' + csp[0]);
}
fs.writeFileSync(out, html);
console.log('built', html.length);
