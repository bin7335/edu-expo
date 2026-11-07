// 전체 데모 자동 테스트
// 실행: node tests/run-all.mjs [slug필터...]   (저장소 루트에서, 크롬 필요)
// 결과: tests/report.json, 콘솔 요약. 실패가 있으면 exit code 1.
//
// 페이지마다 검사하는 것
//  1. 정적: 외부 script/link/img 로드 금지, eval/new Function 금지, target=_blank에 rel=noopener, title·description·viewport·og 메타, 정규식 lookbehind(구형 iOS 사파리 오류) 금지
//  2. 1280×720 로드: 콘솔 오류·예외 0, 외부 네트워크 요청 0, 본문 글자 있음
//  3. 375×812 모바일: 문서 가로 넘침 없음(scrollWidth ≤ 380)
//  4. XSS 주입: 모든 입력칸에 공격 문자열을 넣고 change/input/Enter 후 버튼을 눌러도 스크립트가 실행되지 않음
//  5. 버튼 연타(monkey): 보이는 버튼을 차례로 눌러도 예외가 나지 않음
//  6. 페이지별 시나리오: tests/specs/<slug>.js 가 있으면 실행(assert 실패 시 실패)
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
const filters = process.argv.slice(2);
const pages = cat.items.filter(i => i.path && (!filters.length || filters.some(f => i.path.includes(f) || i.slug.includes(f))));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const XSS = `"'><img src=x onerror="window.__xss=(window.__xss||0)+1"><svg onload="window.__xss=(window.__xss||0)+1"><script>window.__xss=(window.__xss||0)+1</script>`;

// ---------- 정적 서버 (Pages와 같은 http 환경) ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.zip': 'application/zip', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

// ---------- 크롬 + CDP ----------
const port = 9600 + Math.floor(Math.random() * 300);
const udd = path.join(process.env.TEMP || '/tmp', 'edu-expo-test-' + port);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`,
  `--user-data-dir=${udd}`, '--window-size=1280,720', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', 'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 100 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); wsUrl = j.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} if (!wsUrl) await sleep(200); }
if (!wsUrl) { console.error('크롬 연결 실패'); process.exit(2); }
const sock = new WebSocket(wsUrl);
await new Promise(r => sock.onopen = r);
let seq = 0; const pend = new Map(); let events = { errors: [], requests: [], dialogs: 0 };
sock.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  const p = m.params;
  if (m.method === 'Runtime.exceptionThrown') events.errors.push('예외: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text).split('\n')[0]);
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') events.errors.push('console.error: ' + p.args.map(a => a.value ?? a.description).join(' ').slice(0, 200));
  if (m.method === 'Log.entryAdded' && p.entry.level === 'error' && !/favicon/.test(p.entry.url || '')) events.errors.push('log: ' + p.entry.text + ' ' + (p.entry.url || ''));
  if (m.method === 'Network.requestWillBeSent') events.requests.push(p.request.url);
  if (m.method === 'Page.javascriptDialogOpening') { events.dialogs++; send('Page.handleJavaScriptDialog', { accept: true, promptText: 'test' }); }
};
const send = (method, params = {}) => new Promise((r, j) => { const i = ++seq; const t = setTimeout(() => { pend.delete(i); j(new Error('timeout ' + method)); }, 30000); pend.set(i, m => { clearTimeout(t); r(m); }); sock.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression, timeout = 20000) => {
  const r = await send('Runtime.evaluate', { expression: `Promise.race([(async()=>{${expression}})(), new Promise((_,j)=>setTimeout(()=>j(new Error('평가 시간 초과')),${timeout}))])`, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description?.split('\n')[0] || r.result.exceptionDetails.text);
  return r.result.result.value;
};
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Network.enable');
await send('Browser.setDownloadBehavior', { behavior: 'deny' }).catch(() => {});
// print/파일 선택/새 창은 헤드리스에서 멈추므로 막아 둔다
await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.print=()=>{window.__printed=(window.__printed||0)+1};window.open=()=>null;HTMLInputElement.prototype.showPicker=()=>{};if(window.showDirectoryPicker)window.showDirectoryPicker=()=>Promise.reject(new DOMException('test','AbortError'));(()=>{const c=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){const h=this.getAttribute('href')||'';if(!this.hasAttribute('download')&&(h===''||h.startsWith('#')))return c.call(this);window.__clicks=(window.__clicks||0)+1}})();` });
const metrics = (w, h, mobile) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
const load = async (url, wait = 1500) => {
  events = { errors: [], requests: [], dialogs: 0 };
  // 크롬이 막 뜬 직후 첫 이동이 느려 시간 초과가 나는 경우가 있어 한 번 더 시도
  try { await send('Page.navigate', { url }); } catch (e) { await sleep(1000); await send('Page.navigate', { url }); }
  await sleep(wait);
};

await load(ORIGIN + '/', 1000); // 예열

// ---------- 페이지 안에서 쓰는 도우미 ----------
const HELPERS = `
const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.disabled; };
const buttons = () => [...document.querySelectorAll('button, [role=button], input[type=button], input[type=submit], .btn, .tab, a[href^="#"], a[href="javascript:void(0)"]')].filter(vis)
  .filter(b => !/초기화|모두 지우기|전체 삭제|reset|삭제|지우기|비우기/i.test(b.textContent || b.value || ''));
const inputs = () => [...document.querySelectorAll('input:not([type]), input[type=text], input[type=search], input[type=url], input[type=email], input[type=tel], textarea, [contenteditable=true]')].filter(vis);
const fire = (el, t) => el.dispatchEvent(new Event(t, { bubbles: true }));
const key = (el, k) => { el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); el.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true })); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const assert = (c, msg) => { if (!c) throw new Error('assert 실패: ' + msg); };
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const text = () => document.body.innerText;
`;

// ---------- 정적 검사 ----------
function staticChecks(it) {
  const f = path.join(ROOT, it.path, 'index.html');
  const h = fs.readFileSync(f, 'utf8');
  const out = [];
  const scripts = h.match(/<script\b[^>]*\bsrc\s*=\s*["'][^"']+["']/gi) || [];
  if (scripts.length) out.push('외부 script 파일 로드: ' + scripts.join(' '));
  for (const m of h.matchAll(/<(link|img|iframe|audio|video|source)\b[^>]*\b(href|src)\s*=\s*["'](https?:)?\/\/[^"']+["'][^>]*>/gi)) {
    if (/^<link/i.test(m[0]) && !/stylesheet|icon|preload|modulepreload/i.test(m[0])) continue;
    out.push('외부 리소스: ' + m[0].slice(0, 120));
  }
  if (/@import\s+url\(\s*["']?https?:/i.test(h) || /url\(\s*["']?https?:\/\//i.test(h)) out.push('CSS 외부 url()');
  if (/[^.\w]eval\s*\(|new\s+Function\s*\(/.test(h)) out.push('eval/new Function 사용');
  for (const m of h.matchAll(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gi)) if (!/noopener|noreferrer/.test(m[0])) out.push('rel=noopener 없는 새 창 링크: ' + m[0].slice(0, 100));
  if (/target\s*=\s*\\?["']_blank\\?["']/.test(h) && /\+\s*['"]\s*target=/.test(h) && !/noopener/.test(h)) out.push('동적 새 창 링크에 noopener 없음');
  if (/\(\?<[=!]/.test(h)) out.push('정규식 lookbehind 사용(iOS 16.4 미만 사파리에서 스크립트 전체 오류)');
  if (!/<!-- csp:auto -->/.test(h)) out.push('CSP(외부 전송 차단) 없음 — node tools/build-catalog.js 실행 필요');
  for (const [re, name] of [[/<title>[^<]+<\/title>/i, 'title'], [/name="description"/, 'meta description'], [/name="viewport"/, 'meta viewport'], [/og:image/, 'og:image']]) if (!re.test(h)) out.push(name + ' 없음');
  if (/\b(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,})/.test(h)) out.push('API 키로 보이는 문자열');
  // 주민번호 형식: 뒷자리가 123456·000000처럼 누가 봐도 가짜인 샘플만 허용
  for (const m of h.matchAll(/\b\d{6}-[1-4](\d{6})\b/g)) if (!/^(123456|234567|000000|111111)$/.test(m[1])) out.push('주민등록번호 형식 문자열: ' + m[0]);
  return out;
}

// ---------- 확장 검사 ----------
function extensionChecks() {
  const out = [];
  const dir = path.join(ROOT, 'extensions');
  for (const name of fs.readdirSync(dir).filter(n => fs.statSync(path.join(dir, n)).isDirectory())) {
    const d = path.join(dir, name); const fail = [];
    let man;
    try { man = JSON.parse(fs.readFileSync(path.join(d, 'manifest.json'), 'utf8')); } catch (e) { out.push({ name, fail: ['manifest.json 파싱 실패 ' + e.message] }); continue; }
    if (man.manifest_version !== 3) fail.push('manifest_version 3 아님');
    const perms = [...(man.permissions || []), ...(man.host_permissions || [])];
    for (const p of perms) if (/<all_urls>|^\*:\/\/\*\/\*$|^https?:\/\/\*\/\*$/.test(p)) fail.push('넓은 호스트 권한: ' + p);
    // 검토 후 필요하다고 판단한 민감 권한 (이유 기록)
    const JUSTIFIED = { 'lesson-bag': { tabs: '창의 탭 목록(제목·주소)을 수업 세트로 저장하는 핵심 기능. activeTab으로는 다른 탭을 못 읽음' } };
    for (const p of (man.permissions || []).filter(p => !JUSTIFIED[name]?.[p])) if (['tabs', 'history', 'cookies', 'webRequest', 'debugger', 'downloads', 'management', 'nativeMessaging', 'proxy', 'privacy'].includes(p)) fail.push('민감 권한: ' + p);
    for (const cs of man.content_scripts || []) for (const mt of cs.matches || []) if (/<all_urls>|\*:\/\/\*\/\*/.test(mt)) fail.push('모든 사이트 content_script: ' + mt);
    const csp = man.content_security_policy?.extension_pages || '';
    if (/unsafe-eval|https?:/.test(csp)) fail.push('느슨한 CSP: ' + csp);
    const refs = [man.action?.default_popup, man.background?.service_worker, ...Object.values(man.icons || {}), ...Object.values(man.action?.default_icon || {}),
      ...(man.content_scripts || []).flatMap(c => [...(c.js || []), ...(c.css || [])])].filter(Boolean);
    for (const r of refs) if (!fs.existsSync(path.join(d, r))) fail.push('참조 파일 없음: ' + r);
    for (const f of fs.readdirSync(d).filter(f => /\.(js|html)$/.test(f))) {
      const s = fs.readFileSync(path.join(d, f), 'utf8');
      if (/<script\b[^>]*src\s*=\s*["']https?:/i.test(s)) fail.push(f + ': 원격 스크립트');
      if (/[^.\w]eval\s*\(|new\s+Function\s*\(/.test(s)) fail.push(f + ': eval/new Function');
      if (/\bfetch\s*\(|XMLHttpRequest|sendBeacon|new\s+WebSocket/.test(s)) fail.push(f + ': 네트워크 전송 코드');
      if (/\(\?<[=!]/.test(s)) fail.push(f + ': 정규식 lookbehind');
    }
    const zip = path.join(dir, name + '.zip');
    if (!fs.existsSync(zip)) fail.push('zip 없음');
    else if (fs.statSync(zip).mtimeMs + 1000 < Math.max(...fs.readdirSync(d).map(f => fs.statSync(path.join(d, f)).mtimeMs))) fail.push('zip이 폴더보다 오래됨(다시 압축 필요)');
    out.push({ name, permissions: perms, fail });
  }
  return out;
}

// ---------- 실행 ----------
const report = { when: new Date().toISOString(), pages: [], extensions: extensionChecks() };
for (const it of pages) {
  const url = ORIGIN + '/' + it.path;
  const r = { no: it.no, slug: it.slug, path: it.path, fail: [], warn: [], info: {} };
  const step = async (name, fn) => { try { await fn(); } catch (e) { r.fail.push(`${name}: ${e.message}`); } };
  r.fail.push(...staticChecks(it));

  await step('로드', async () => {
    await metrics(1280, 720, false);
    await send('Runtime.evaluate', { expression: 'try{localStorage.clear();sessionStorage.clear()}catch(e){}' });
    await load(url, 1800);
    const info = await evaluate(`return { len: document.body.innerText.trim().length, h: document.documentElement.scrollHeight }`);
    r.info.textLen = info.len;
    if (info.len < 30) r.fail.push('첫 화면 글자가 거의 없음');
    if (events.errors.length) r.fail.push('로드 중 오류: ' + [...new Set(events.errors)].join(' / '));
    const ext = events.requests.filter(u => !u.startsWith(ORIGIN) && !/^(data|blob|about|chrome-extension):/.test(u));
    if (ext.length) r.fail.push('외부 네트워크 요청: ' + [...new Set(ext)].slice(0, 5).join(' '));
  });

  await step('모바일 375', async () => {
    await metrics(375, 812, true); await load(url, 1500);
    const w = await evaluate(`return document.documentElement.scrollWidth`);
    r.info.mobileWidth = w;
    if (w > 380) r.fail.push(`375px에서 가로 넘침 (scrollWidth ${w})`);
    if (events.errors.length) r.fail.push('모바일 로드 오류: ' + [...new Set(events.errors)].join(' / '));
  });

  await step('XSS 주입', async () => {
    await metrics(1280, 720, false); await load(url, 1500);
    const n = await evaluate(`${HELPERS}
      let filled = 0;
      for (const el of inputs()) { try { if (el.isContentEditable) el.textContent = ${JSON.stringify(XSS)}; else el.value = ${JSON.stringify(XSS)}; fire(el,'input'); fire(el,'change'); key(el,'Enter'); filled++; } catch(e){} }
      await wait(200);
      for (const b of buttons().slice(0, 40)) { try { b.click(); } catch(e){} await wait(60); }
      await wait(500);
      // 저장된 값을 다시 읽어 그리는 경로도 확인
      return { filled, xss: window.__xss || 0 };`, 30000);
    r.info.xssInputs = n.filled;
    if (n.xss) r.fail.push(`XSS: 입력값의 스크립트가 실행됨 (${n.xss}회)`);
    await load(url, 1500);
    const again = await evaluate(`await new Promise(r=>setTimeout(r,500)); return window.__xss || 0`);
    if (again) r.fail.push(`XSS(저장 후 다시 열기): 스크립트 실행 ${again}회`);
    const errs = events.errors.filter(e => !/net::ERR|Failed to load resource|x:1/.test(e));
    if (errs.length) r.warn.push('XSS 입력 후 오류: ' + [...new Set(errs)].slice(0, 3).join(' / '));
  });

  // 입력칸 말고 들어오는 경로: 붙여넣기·끌어놓기(파일 이름/내용)·주소 #해시·?쿼리
  await step('XSS 붙여넣기·파일·주소', async () => {
    await send('Runtime.evaluate', { expression: 'try{localStorage.clear()}catch(e){}' });
    await load(url + '#' + encodeURIComponent(XSS), 1500);
    await load(url + '?q=' + encodeURIComponent(XSS) + '&url=javascript:window.__xss=1#w=' + encodeURIComponent(XSS), 1500);
    const n = await evaluate(`${HELPERS}
      const name = 'x"><img src=x onerror="window.__xss=(window.__xss||0)+1">.csv';
      const body = '이름,메모\\n' + ${JSON.stringify(XSS)} + ',' + ${JSON.stringify(XSS)} + '\\n';
      const file = new File([body], name, { type: 'text/csv' });
      const dt = new DataTransfer(); dt.items.add(file); dt.setData('text/plain', ${JSON.stringify(XSS)}); dt.setData('text/html', ${JSON.stringify(XSS)});
      for (const fi of $$('input[type=file]')) { try { fi.files = dt.files; fire(fi, 'change'); } catch(e){} }
      for (const el of [document.body, ...$$('textarea, [contenteditable=true], .drop, .dropzone, [class*=drop]')]) {
        try { el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); } catch(e){}
        for (const t of ['dragenter','dragover','drop']) { try { el.dispatchEvent(new DragEvent(t, { dataTransfer: dt, bubbles: true, cancelable: true })); } catch(e){} }
      }
      await wait(1200);
      for (const b of buttons().slice(0, 30)) { try { b.click(); } catch(e){} await wait(40); }
      await wait(500);
      const bad = $$('a[href^="javascript:"]').filter(a => /xss/.test(a.getAttribute('href'))).length;
      return (window.__xss || 0) + bad;`, 30000);
    if (n) r.fail.push(`XSS(붙여넣기·파일·주소 경로): 스크립트 실행/위험 링크 ${n}건`);
  });

  // 저장값 오염: 평소처럼 쓴 뒤 localStorage의 모든 문자열을 공격 문자열로 바꾸고 다시 열기
  await step('XSS 저장값 오염', async () => {
    await send('Runtime.evaluate', { expression: 'try{localStorage.clear()}catch(e){}' });
    await load(url, 1500);
    await evaluate(`${HELPERS} for (const el of inputs().slice(0, 10)) { try { el.value = el.value || '테스트'; fire(el,'input'); fire(el,'change'); } catch(e){} }
      for (const b of buttons().slice(0, 25)) { try { b.click(); } catch(e){} await wait(40); } await wait(800); return 1;`, 30000);
    const keys = await evaluate(`const P = ${JSON.stringify(XSS)};
      const poison = v => typeof v === 'string' ? (/^\\d{2}:\\d{2}$/.test(v) || v.length < 200 ? P : v) : Array.isArray(v) ? v.map(poison) : (v && typeof v === 'object') ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, poison(x)])) : v;
      const ks = Object.keys(localStorage);
      for (const k of ks) { const raw = localStorage.getItem(k); let v; try { v = JSON.parse(raw); localStorage.setItem(k, JSON.stringify(poison(v))); } catch(e) { localStorage.setItem(k, P); } }
      return ks.length;`);
    r.info.storageKeys = keys;
    if (!keys) return;
    await load(url, 1800);
    const n = await evaluate(`${HELPERS} for (const b of buttons().slice(0, 30)) { try { b.click(); } catch(e){} await wait(40); } await wait(500); return window.__xss || 0;`, 30000);
    if (n) r.fail.push(`XSS(저장값을 다시 그릴 때): 스크립트 실행 ${n}회`);
    await send('Runtime.evaluate', { expression: 'try{localStorage.clear()}catch(e){}' });
  });

  await step('버튼 연타', async () => {
    await send('Runtime.evaluate', { expression: 'try{localStorage.clear()}catch(e){}' });
    await load(url, 1500);
    const n = await evaluate(`${HELPERS}
      let clicked = 0; const seen = new Set();
      for (let round = 0; round < 2; round++) for (const b of buttons()) { const k = (b.textContent||b.value||'') + b.className; if (seen.has(k) && round === 0) continue; seen.add(k); try { b.click(); clicked++; } catch(e){} await wait(40); if (clicked > 120) break; }
      await wait(600); return clicked;`, 40000);
    r.info.clicked = n;
    const errs = [...new Set(events.errors)].filter(e => !/NotAllowedError|AbortError|Permission|getUserMedia|speechSynthesis|AudioContext|clipboard/i.test(e));
    if (errs.length) r.fail.push('버튼을 누르다 오류: ' + errs.slice(0, 4).join(' / '));
  });

  const spec = path.join(ROOT, 'tests', 'specs', it.slug + '.js');
  if (fs.existsSync(spec)) await step('시나리오', async () => {
    await send('Runtime.evaluate', { expression: 'try{localStorage.clear()}catch(e){}' });
    await metrics(1280, 720, false); await load(url, 1800);
    const res = await evaluate(HELPERS + fs.readFileSync(spec, 'utf8'), 60000);
    r.info.spec = res;
    const errs = [...new Set(events.errors)].filter(e => !/NotAllowedError|AbortError/.test(e));
    if (errs.length) r.fail.push('시나리오 중 오류: ' + errs.slice(0, 3).join(' / '));
  });
  else r.warn.push('시나리오 테스트 없음(tests/specs/' + it.slug + '.js)');

  report.pages.push(r);
  console.log(`${r.fail.length ? '✗' : '✓'} ${String(it.no).padStart(2, '0')} ${it.slug}${r.fail.length ? '\n    - ' + r.fail.join('\n    - ') : ''}`);
}

for (const e of report.extensions) console.log(`${e.fail.length ? '✗' : '✓'} 확장 ${e.name} [${e.permissions?.join(', ')}]${e.fail.length ? '\n    - ' + e.fail.join('\n    - ') : ''}`);
const nFail = report.pages.filter(p => p.fail.length).length + report.extensions.filter(e => e.fail.length).length;
const nSpec = report.pages.filter(p => p.info.spec !== undefined).length;
console.log(`\n페이지 ${report.pages.length}개 · 확장 ${report.extensions.length}개 · 시나리오 ${nSpec}개 · 실패 ${nFail}건`);
fs.writeFileSync(path.join(ROOT, 'tests', 'report.json'), JSON.stringify(report, null, 1));
sock.close(); chrome.kill(); server.close();
await sleep(500); try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(nFail ? 1 : 0);
