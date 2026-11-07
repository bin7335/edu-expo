// catalog.json 하나로 갤러리·패들렛 카드·OG 메타·act-board 개별 등록 패키지를 만든다.
// 실행: node tools/build-catalog.js   (저장소 루트에서)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
const BASE = cat.base, items = cat.items;
const pad = n => String(n).padStart(2, '0');
const thumbName = it => `${pad(it.no)}-${it.slug}`;
const pageUrl = it => it.url || BASE + it.path;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true }); fs.writeFileSync(path.join(ROOT, p), s); };
const problems = [];

// 0. 기본 검사
for (const it of items) {
  if (!fs.existsSync(path.join(ROOT, 'thumbnails', thumbName(it) + '.png'))) problems.push(`썸네일 없음: ${thumbName(it)}.png`);
  if (it.path && !fs.existsSync(path.join(ROOT, it.path, 'index.html'))) problems.push(`페이지 없음: ${it.path}`);
  if (it.zip && !fs.existsSync(path.join(ROOT, it.zip))) problems.push(`zip 없음: ${it.zip}`);
}

// 1. 각 페이지에 OG 메타 (링크 공유·작품 등록 미리보기용). 표시 사이 블록만 교체해 여러 번 실행해도 같다.
for (const it of items.filter(i => i.path)) {
  const f = it.path + 'index.html';
  let h = read(f);
  const block = `<!-- og:auto -->
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(it.name)}">
<meta property="og:description" content="${esc(it.desc)}">
<meta property="og:image" content="${BASE}thumbnails/${thumbName(it)}.png">
<meta property="og:url" content="${pageUrl(it)}">
<meta name="twitter:card" content="summary_large_image">
<!-- /og:auto -->`;
  if (h.includes('<!-- og:auto -->')) h = h.replace(/<!-- og:auto -->[\s\S]*?<!-- \/og:auto -->/, block);
  else h = h.replace(/<\/head>/i, block + '\n</head>');
  // "외부 전송 없음"을 브라우저가 강제하도록 CSP: 다른 서버로 요청(fetch·이미지·폼 전송)을 못 보냄.
  // 인라인 스크립트는 단일 파일 구조라 허용. 'self'는 이 파일이 놓인 곳(Pages 또는 act-board).
  const csp = `<!-- csp:auto --><meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data: blob:; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><!-- /csp:auto -->`;
  if (h.includes('<!-- csp:auto -->')) h = h.replace(/<!-- csp:auto -->[\s\S]*?<!-- \/csp:auto -->/, csp);
  else h = h.replace(/(<meta\s+charset=["']?[\w-]+["']?\s*\/?>)/i, `$1\n${csp}`);
  if (!h.includes('<!-- csp:auto -->')) problems.push(`${it.path}: charset 메타가 없어 CSP를 넣지 못함`);
  write(f, h);
}

// 2. 갤러리 index.html의 APPS 배열과 제목 숫자
{
  let h = read('index.html');
  const rows = items.map(it => `  ${JSON.stringify([thumbName(it), it.name, it.kind, it.desc, it.who, it.url || it.path])},`).join('\n');
  h = h.replace(/const APPS = \[[\s\S]*?\n\];/, `const APPS = [\n  // [썸네일, 이름, 종류, 한 줄 소개, 대상, 링크]  ← catalog.json에서 생성\n${rows}\n];`);
  h = h.replace(/웹 도구 \d+/g, `웹 도구 ${items.length}`);
  write('index.html', h);
}

// 3. 패들렛 카드 문구
{
  let md = `# 패들렛·작품 등록용 카드 문구 (${items.length}개)\n\n- catalog.json에서 생성(tools/build-catalog.js). 직접 고치지 말고 catalog.json을 고친 뒤 다시 실행.\n- 썸네일: \`thumbnails/\` 같은 번호 PNG (1280×720)\n- 전체 갤러리: ${BASE}\n\n---\n\n`;
  for (const it of items) {
    md += `**${pad(it.no)}. ${it.name}${it.kind === '콘셉트' ? ' [콘셉트]' : ''}**\n${it.desc}\n대상: ${it.who} · ${it.kind}\n${pageUrl(it)}\n`;
    if (it.zip) md += `설치 파일: ${BASE}${it.zip}\n`;
    md += '\n';
  }
  write('gallery-cards.md', md);
}

// 4. act-board 개별 등록 패키지: dist/act-board/NN-이름/ (갤러리 없이 하나씩 올릴 수 있게)
const DIST = 'dist/act-board/';
fs.rmSync(path.join(ROOT, DIST), { recursive: true, force: true });
const csv = [['번호', '이름', '종류', '한 줄 소개', '대상', '링크', '썸네일 주소', '설치 파일', '자세한 설명']];
for (const it of items) {
  const dir = `${DIST}${pad(it.no)}-${it.name.replace(/[\\/:*?"<>|!]/g, '').replace(/\s+/g, '_')}/`;
  fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'thumbnails', thumbName(it) + '.png'), path.join(ROOT, dir, 'thumbnail.png'));
  let long = it.desc;
  if (it.path) {
    let h = read(it.path + 'index.html');
    long = ((h.match(/name="description"\s+content="([^"]*)"/) || [])[1] || it.desc).replace(/&amp;/g, '&');
    // 단독 파일로 동작하게: 갤러리로 돌아가는 링크 제거, 상대 경로를 절대 주소·data URI로
    h = h.replace(/<a\b[^>]*href="\.\.\/"[^>]*>[\s\S]*?<\/a>/g, '');
    h = h.replace(/(["'(])\.\.\/extensions\/([\w-]+)\/(icon\d+\.png)/g, (m, q, ext, icon) =>
      q + 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'extensions', ext, icon)).toString('base64'));
    h = h.replace(/(["'])\.\.\/extensions\//g, `$1${BASE}extensions/`);
    h = h.replace(/href="proof\.html"/g, `href="${BASE}${it.path}proof.html"`);
    const left = h.match(/(?:src|href)=["'](?!https?:|data:|mailto:|tel:|#|javascript:|blob:|\$\{|'\s*\+)[^"']+["']/g);
    if (left) problems.push(`${it.path}: 단독 패키지에 상대 경로 남음 ${[...new Set(left)].slice(0, 3).join(' ')}`);
    write(dir + 'index.html', h);
  }
  if (it.zip) fs.copyFileSync(path.join(ROOT, it.zip), path.join(ROOT, dir, path.basename(it.zip)));
  const info = [`제목: ${it.name}`, `종류: ${it.kind}`, `대상: ${it.who}`, `한 줄 소개: ${it.desc}`, `자세한 설명: ${long}`,
    `바로 체험: ${pageUrl(it)}`, it.zip ? `설치 파일: ${BASE}${it.zip}` : '', `썸네일: ${BASE}thumbnails/${thumbName(it)}.png`,
    it.path ? '파일: index.html 하나로 동작(외부 서버·로그인 없음). 그대로 업로드 가능.' : '외부에서 운영 중인 앱: 링크로 등록.',
    it.kind === '콘셉트' ? '※ 실제 운영 서비스가 아닌 아이디어 시연 페이지' : '', `제작: ${cat.author}`].filter(Boolean).join('\n');
  write(dir + '소개.txt', info + '\n');
  csv.push([pad(it.no), it.name, it.kind, it.desc, it.who, pageUrl(it), `${BASE}thumbnails/${thumbName(it)}.png`, it.zip ? BASE + it.zip : '', long]);
}
write(DIST + '목록.csv', '﻿' + csv.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n') + '\r\n');

console.log(`항목 ${items.length}개 처리. 패키지: ${DIST}`);
if (problems.length) { console.log('문제:\n- ' + problems.join('\n- ')); process.exitCode = 1; }
