/* 술술 읽기 - 읽기 도우미 패널 (확장 content script · 체험 페이지 공용 코드)
 * 한 번 주입되면 window.__easyReader 에 남고, 다시 주입하면 켜기/끄기만 바꾼다.
 * 설정은 chrome.storage.local(확장) 또는 localStorage(체험 페이지)에만 저장. 외부 전송 없음. */
(() => {
  'use strict';
  if (window.__easyReader) { window.__easyReader.toggle(); return; }

  const DEFAULTS = { size: 100, lh: 0, ls: 0, font: false, theme: 'none', ruler: false, band: 70, rate: 1, perSite: false };
  const HOST_ID = 'easy-reader-host';
  const SITE = location.hostname || 'local-file';

  /* ---------- 저장소 (확장: chrome.storage / 체험: localStorage) ---------- */
  const hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  const store = {
    async get(k) {
      if (hasChrome) return (await chrome.storage.local.get(k))[k];
      try { return JSON.parse(localStorage.getItem('easy-reader:' + k)); } catch (_) { return null; }
    },
    async set(k, v) {
      if (hasChrome) return chrome.storage.local.set({ [k]: v });
      try { localStorage.setItem('easy-reader:' + k, JSON.stringify(v)); } catch (_) {}
    },
    async del(k) {
      if (hasChrome) return chrome.storage.local.remove(k);
      try { localStorage.removeItem('easy-reader:' + k); } catch (_) {}
    }
  };

  let S = { ...DEFAULTS, ...(window.__easyReaderDefaults || {}) };
  let on = false, collapsed = false;

  /* ---------- 페이지에 넣는 스타일 ---------- */
  const pageStyle = document.createElement('style');
  pageStyle.id = 'easy-reader-style';
  const ALL = `body *:not(#${HOST_ID})`;
  const PAINT = `body *:not(#${HOST_ID}):not([data-er-keep]):not([data-er-keep] *)`; // data-er-keep: 색을 지킬 영역
  pageStyle.textContent = `
html.er-lh ${ALL}{line-height:var(--er-lh) !important}
html.er-ls ${ALL}{letter-spacing:var(--er-ls) !important;word-spacing:var(--er-ws) !important}
html.er-font ${ALL}:not(i):not(code):not(pre):not(kbd):not([class*="icon"]):not([class*="Icon"]):not([aria-hidden="true"]){font-family:"Malgun Gothic","맑은 고딕","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif !important;font-weight:500 !important}
html.er-cream,html.er-cream body{background:#fbf3dc !important;color:#2d2a24 !important}
html.er-cream ${PAINT}{background-color:transparent !important;color:#2d2a24 !important;border-color:#e3d6b4 !important}
html.er-cream a:not([data-er-keep] *), html.er-cream a:not([data-er-keep] *) *{color:#1a56b5 !important}
html.er-dark,html.er-dark body{background:#1f2126 !important;color:#ece8dc !important}
html.er-dark ${PAINT}{background-color:transparent !important;color:#ece8dc !important;border-color:#454850 !important}
html.er-dark a:not([data-er-keep] *), html.er-dark a:not([data-er-keep] *) *{color:#8ab4ff !important}
html.er-dark img,html.er-dark video{opacity:.9}
::highlight(er-sent){background-color:rgba(255,216,77,.38)}
::highlight(er-word){background-color:#ffcf33;color:#111}
`;

  /* ---------- 패널 (Shadow DOM: 페이지 스타일과 섞이지 않음) ---------- */
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.setAttribute('style', 'all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483646;');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
<style>
  :host{all:initial}
  *{box-sizing:border-box;font-family:system-ui,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}
  .shade{position:fixed;left:0;width:100vw;background:rgba(20,18,30,.58);pointer-events:none;display:none}
  .shade.top{top:0}.shade.bot{bottom:0}
  .band{position:fixed;left:0;width:100vw;pointer-events:none;display:none;border-top:2px solid #ffcf33;border-bottom:2px solid #ffcf33}
  .panel{position:fixed;top:12px;right:12px;width:300px;max-height:calc(100vh - 24px);overflow:auto;background:#fffdf7;color:#2b2620;border:1px solid #ecdcb8;border-radius:18px;
    box-shadow:0 14px 40px rgba(60,40,10,.25);font-size:13.5px;line-height:1.4;display:none}
  .hd{display:flex;align-items:center;gap:8px;padding:10px 10px 8px 14px;background:#ff8a3d;color:#fff;border-radius:17px 17px 0 0;cursor:grab;user-select:none;touch-action:none;position:sticky;top:0;z-index:1}
  .hd b{font-size:15.5px;flex:1}
  .hd button{all:unset;cursor:pointer;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;font-size:15px;font-weight:800;background:rgba(255,255,255,.2)}
  .hd button:hover{background:rgba(255,255,255,.35)}
  .bd{padding:10px 14px 14px;display:flex;flex-direction:column;gap:9px}
  .row{display:grid;grid-template-columns:78px 1fr 46px;align-items:center;gap:6px}
  .row label{font-weight:700}
  .row output{text-align:right;font-weight:800;color:#b4561c;font-size:12.5px}
  input[type=range]{width:100%;accent-color:#ff8a3d;margin:0}
  .sec{font-size:11.5px;font-weight:800;color:#9a8a70;letter-spacing:.3px;margin-top:2px}
  .tg{display:flex;gap:6px;flex-wrap:wrap}
  .btn{all:unset;cursor:pointer;flex:1;text-align:center;padding:8px 6px;border-radius:11px;border:1.5px solid #ecdcb8;background:#fff;font-weight:800;font-size:13px;white-space:nowrap}
  .btn:hover{border-color:#ff8a3d}
  .btn.on{background:#ff8a3d;border-color:#ff8a3d;color:#fff}
  .btn:focus-visible{outline:2px solid #1a56b5}
  .theme-cream{background:#fbf3dc}.theme-dark{background:#2a2c33;color:#ece8dc;border-color:#2a2c33}
  .theme-cream.on,.theme-dark.on{box-shadow:0 0 0 2px #ff8a3d inset;border-color:#ff8a3d}
  .theme-cream.on{background:#fbf3dc;color:#2b2620}.theme-dark.on{background:#2a2c33;color:#fff}
  .speak{display:flex;gap:6px}
  .speak .play{flex:2;background:#2f7d5b;border-color:#2f7d5b;color:#fff}
  .speak .play.busy{background:#c2410c;border-color:#c2410c}
  .status{font-size:12px;color:#7a6b55;min-height:16px}
  .chk{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#5c5040;cursor:pointer}
  .chk input{accent-color:#ff8a3d;width:16px;height:16px;margin:0}
  .foot{display:flex;justify-content:space-between;align-items:center;gap:6px;border-top:1px dashed #ecdcb8;padding-top:9px}
  .foot .btn{flex:0 0 auto;padding:6px 10px;font-size:12px}
  .pill{all:unset;position:fixed;top:12px;right:12px;display:none;cursor:pointer;background:#ff8a3d;color:#fff;font-weight:800;font-size:14px;padding:10px 14px;border-radius:999px;box-shadow:0 8px 24px rgba(60,40,10,.3)}
  .toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:rgba(40,32,20,.92);color:#fff;padding:8px 14px;border-radius:12px;font-size:13px;font-weight:700;opacity:0;transition:opacity .25s;pointer-events:none;max-width:calc(100vw - 24px);text-align:center}
  .toast.show{opacity:1}
  @media (max-width:600px){
    .panel{top:auto;bottom:8px;right:8px;left:8px;width:auto;max-height:46vh}
    .pill{top:auto;bottom:12px}
  }
</style>
<div class="shade top"></div><div class="band"></div><div class="shade bot"></div>
<button class="pill" title="읽기 도우미 펼치기">📖 술술 읽기</button>
<section class="panel" role="dialog" aria-label="술술 읽기 도우미">
  <div class="hd"><span>📖</span><b>술술 읽기</b><button data-act="min" title="접기 (효과는 그대로)">—</button><button data-act="off" title="끄기 (원래 페이지로)">✕</button></div>
  <div class="bd">
    <div class="sec">글자 보기</div>
    <div class="row"><label for="size">가 글자 크기</label><input id="size" type="range" min="100" max="200" step="10"><output data-for="size"></output></div>
    <div class="row"><label for="lh">↕ 줄 간격</label><input id="lh" type="range" min="0" max="10" step="1"><output data-for="lh"></output></div>
    <div class="row"><label for="ls">↔ 글자 간격</label><input id="ls" type="range" min="0" max="10" step="1"><output data-for="ls"></output></div>
    <div class="tg"><button class="btn" data-tog="font" title="또렷한 고딕체로 바꾸기">🅰 읽기 쉬운 글꼴</button><button class="btn" data-tog="ruler" title="마우스를 따라가는 띠만 밝게">📏 줄 가리개</button></div>
    <div class="row" data-show="ruler"><label for="band">띠 높이</label><input id="band" type="range" min="40" max="160" step="10"><output data-for="band"></output></div>
    <div class="sec">배경색</div>
    <div class="tg"><button class="btn" data-theme="none">기본</button><button class="btn theme-cream" data-theme="cream">🍞 크림</button><button class="btn theme-dark" data-theme="dark">🌙 어두움</button></div>
    <div class="sec">소리 내어 읽기</div>
    <div class="speak"><button class="btn play" data-act="speak">🔊 선택한 글 읽어 주기</button><button class="btn" data-act="stop">■ 멈춤</button></div>
    <div class="row"><label for="rate">빠르기</label><input id="rate" type="range" min="0.6" max="1.6" step="0.1"><output data-for="rate"></output></div>
    <div class="status" aria-live="polite">글을 드래그해 고르고 🔊를 눌러요. 안 고르면 화면 가운데 문단을 읽어요.</div>
    <div class="foot"><label class="chk"><input type="checkbox" data-tog="perSite">이 사이트만 따로 기억</label><button class="btn" data-act="reset">↺ 처음대로</button></div>
  </div>
</section>
<div class="toast"></div>`;

  const $ = s => root.querySelector(s);
  const panel = $('.panel'), pill = $('.pill'), statusEl = $('.status');
  const shadeT = $('.shade.top'), shadeB = $('.shade.bot'), band = $('.band');

  /* ---------- 효과 적용 ---------- */
  const H = document.documentElement;
  const origSize = new Map();
  function applySize() {
    const k = S.size / 100;
    if (k === 1 || !on) {
      for (const [el, o] of origSize) {
        if (o.inline) el.style.setProperty('font-size', o.inline, o.pri); else el.style.removeProperty('font-size');
      }
      origSize.clear(); return;
    }
    // 글자를 직접 가진 요소만 골라 원래 크기 x 배율 로 바꾼다 (처음 크기를 기억했다가 되돌림)
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeValue.trim() ? 1 : 3 });
    const fresh = [];
    let count = 0;
    while (tw.nextNode() && count < 8000) {
      const el = tw.currentNode.parentElement;
      if (!el || el.closest('#' + HOST_ID) || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(el.tagName)) continue;
      if (!origSize.has(el) && !fresh.includes(el)) { fresh.push(el); count++; }
    }
    for (const el of fresh) origSize.set(el, { px: parseFloat(getComputedStyle(el).fontSize) || 16, inline: el.style.getPropertyValue('font-size'), pri: el.style.getPropertyPriority('font-size') });
    for (const [el, o] of origSize) if (el.isConnected) el.style.setProperty('font-size', (o.px * k).toFixed(2) + 'px', 'important');
  }
  function applyAll() {
    const act = on;
    H.classList.toggle('er-lh', act && S.lh > 0);
    H.style.setProperty('--er-lh', (1.45 + S.lh * 0.12).toFixed(2));
    H.classList.toggle('er-ls', act && S.ls > 0);
    H.style.setProperty('--er-ls', (S.ls * 0.012).toFixed(3) + 'em');
    H.style.setProperty('--er-ws', (S.ls * 0.04).toFixed(2) + 'em');
    H.classList.toggle('er-font', act && S.font);
    H.classList.toggle('er-cream', act && S.theme === 'cream');
    H.classList.toggle('er-dark', act && S.theme === 'dark');
    applySize();
    const r = act && S.ruler;
    [shadeT, shadeB, band].forEach(e => e.style.display = r ? 'block' : 'none');
    if (r) placeRuler(rulerY);
    syncUI();
  }

  /* ---------- 줄 가리개 ---------- */
  let rulerY = Math.round(window.innerHeight * 0.42);
  function placeRuler(y) {
    rulerY = y;
    const h = S.band, top = Math.max(0, y - h / 2);
    shadeT.style.height = top + 'px';
    band.style.top = top + 'px'; band.style.height = h + 'px';
    shadeB.style.height = Math.max(0, window.innerHeight - top - h) + 'px';
  }
  const onMove = e => { if (on && S.ruler) placeRuler(e.clientY); };
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', e => { if (e.touches[0]) onMove(e.touches[0]); }, { passive: true });
  window.addEventListener('resize', () => { if (on && S.ruler) placeRuler(Math.min(rulerY, window.innerHeight - 10)); });

  /* ---------- 패널 UI ---------- */
  const fmt = {
    size: v => v + '%', lh: v => v == 0 ? '기본' : (1.45 + v * 0.12).toFixed(1), ls: v => v == 0 ? '기본' : '+' + v,
    band: v => v + 'px', rate: v => (+v).toFixed(1) + '배'
  };
  function syncUI() {
    for (const k of Object.keys(fmt)) { const i = root.getElementById(k); i.value = S[k]; root.querySelector(`output[data-for="${k}"]`).textContent = fmt[k](S[k]); }
    root.querySelectorAll('[data-tog]').forEach(b => { if (b.type === 'checkbox') b.checked = !!S[b.dataset.tog]; else b.classList.toggle('on', !!S[b.dataset.tog]); });
    root.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('on', S.theme === b.dataset.theme));
    root.querySelector('[data-show="ruler"]').style.display = S.ruler ? '' : 'none';
    panel.style.display = on && !collapsed ? 'block' : 'none';
    pill.style.display = on && collapsed ? 'block' : 'none';
  }
  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const data = { ...S }; delete data.perSite;
      await store.set('prefs', { perSite: S.perSite });
      if (S.perSite) await store.set('site:' + SITE, data);
      else { await store.set('global', data); await store.del('site:' + SITE); }
    }, 250);
  }
  function set(k, v) { S[k] = v; applyAll(); save(); }

  for (const k of Object.keys(fmt)) root.getElementById(k).addEventListener('input', e => set(k, +e.target.value));
  // 패널 버튼을 눌러도 페이지의 글 선택이 풀리지 않게
  panel.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
  panel.addEventListener('click', e => {
    const b = e.target.closest('button, input[type=checkbox]'); if (!b) return;
    if (b.dataset.tog) set(b.dataset.tog, b.type === 'checkbox' ? b.checked : !S[b.dataset.tog]);
    else if (b.dataset.theme) set('theme', b.dataset.theme);
    else if (b.dataset.act === 'speak') speak();
    else if (b.dataset.act === 'stop') stopSpeak(true);
    else if (b.dataset.act === 'min') { collapsed = true; syncUI(); }
    else if (b.dataset.act === 'off') hide();
    else if (b.dataset.act === 'reset') { const p = S.perSite; S = { ...DEFAULTS, perSite: p }; applyAll(); save(); toast('처음 설정으로 되돌렸어요'); }
  });
  pill.addEventListener('click', () => { collapsed = false; syncUI(); });
  // 머리줄 끌어 옮기기
  const hd = $('.hd');
  hd.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const r = panel.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
    hd.setPointerCapture(e.pointerId);
    const mv = ev => Object.assign(panel.style, {
      left: Math.max(0, Math.min(window.innerWidth - r.width, ev.clientX - ox)) + 'px',
      top: Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - oy)) + 'px', right: 'auto', bottom: 'auto'
    });
    const up = () => { hd.removeEventListener('pointermove', mv); hd.removeEventListener('pointerup', up); };
    hd.addEventListener('pointermove', mv); hd.addEventListener('pointerup', up);
  });
  let toastTimer = 0;
  function toast(m) { const t = $('.toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800); }

  /* ---------- 읽어 주기 (speechSynthesis + 단어 하이라이트) ---------- */
  const synth = window.speechSynthesis;
  const canHL = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';
  let lastSel = null, reading = null;
  document.addEventListener('selectionchange', () => {
    const s = document.getSelection();
    if (s && s.rangeCount && !s.isCollapsed && s.toString().trim()) {
      const r = s.getRangeAt(0);
      if (!host.contains(r.commonAncestorContainer)) lastSel = r.cloneRange();
    }
  });
  function pickVoice() {
    const vs = synth ? synth.getVoices() : [];
    const ko = vs.filter(v => /^ko/i.test(v.lang));
    return ko.find(v => v.localService) || ko[0] || null; // 내 컴퓨터 음성이 단어 위치(onboundary)를 잘 알려 줌
  }
  if (synth && 'onvoiceschanged' in synth) synth.addEventListener('voiceschanged', () => {});
  function centerRange() {
    const xs = [0.35, 0.5, 0.2], ys = [0.45, 0.35, 0.55];
    for (const fy of ys) for (const fx of xs) {
      let el = document.elementFromPoint(window.innerWidth * fx, window.innerHeight * fy);
      if (!el || el.closest('#' + HOST_ID)) continue;
      el = el.closest('p,li,h1,h2,h3,h4,h5,h6,blockquote,dd,dt,td,figcaption') || el;
      if (el.textContent.trim().length > 1 && el !== document.body && el !== H) { const r = document.createRange(); r.selectNodeContents(el); return r; }
    }
    return null;
  }
  // 범위 안의 글자와 "글자 위치 → (텍스트 노드, 오프셋)" 지도를 만든다
  function textMap(range) {
    const segs = []; let text = '';
    const rootNode = range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
    const tw = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
    let lastBlock = null;
    while (tw.nextNode()) {
      const n = tw.currentNode;
      if (!range.intersectsNode(n)) continue;
      const pe = n.parentElement;
      if (!pe || pe.closest('script,style,noscript,#' + HOST_ID)) continue;
      let s = 0, e = n.nodeValue.length;
      if (n === range.startContainer) s = range.startOffset;
      if (n === range.endContainer) e = range.endOffset;
      if (e <= s) continue;
      const blk = pe.closest('p,li,h1,h2,h3,h4,h5,h6,div,td,blockquote,section,article');
      if (lastBlock && blk !== lastBlock && !/\s$/.test(text)) text += '\n';
      lastBlock = blk;
      segs.push({ node: n, ns: s, ts: text.length, len: e - s });
      text += n.nodeValue.slice(s, e);
    }
    return { text, segs };
  }
  function rangeAt(map, a, b) {
    const find = (pos, end) => map.segs.find(g => end ? (pos > g.ts && pos <= g.ts + g.len) : (pos >= g.ts && pos < g.ts + g.len));
    const A = find(a, false), B = find(b, true);
    if (!A || !B) return null;
    const r = document.createRange();
    r.setStart(A.node, A.ns + (a - A.ts)); r.setEnd(B.node, B.ns + (b - B.ts));
    return r;
  }
  function splitChunks(text) {
    const out = [], re = /[^.!?。\n]+[.!?。]*["'”’)]*\s*/g; let m;
    while ((m = re.exec(text))) {
      let s = m.index; const end = m.index + m[0].length;
      while (end - s > 180) { // 너무 긴 문장은 쉼표·띄어쓰기에서 나눔
        let cut = text.lastIndexOf(',', s + 180); if (cut <= s + 40) cut = text.lastIndexOf(' ', s + 180); if (cut <= s + 40) cut = s + 180;
        out.push([s, cut + 1]); s = cut + 1;
      }
      if (text.slice(s, end).trim()) out.push([s, end]);
    }
    return out;
  }
  function mark(name, r) { if (!canHL) return; if (r) CSS.highlights.set(name, new Highlight(r)); else CSS.highlights.delete(name); }
  function stopSpeak(manual) {
    if (reading) reading.cancelled = true;
    reading = null;
    if (synth) synth.cancel();
    mark('er-sent'); mark('er-word');
    const p = root.querySelector('.play'); p.classList.remove('busy'); p.textContent = '🔊 선택한 글 읽어 주기';
    if (manual) statusEl.textContent = '멈췄어요.';
  }
  function speak() {
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { statusEl.textContent = '이 브라우저는 소리 내어 읽기를 지원하지 않아요.'; return; }
    const wasReading = !!reading;
    stopSpeak(false);
    if (wasReading) { statusEl.textContent = '멈췄어요.'; return; }
    let range = lastSel && !lastSel.collapsed && lastSel.toString().trim() ? lastSel : null, from = '선택한 글';
    if (!range) { range = centerRange(); from = '화면 가운데 문단'; }
    if (!range) { statusEl.textContent = '읽을 글을 먼저 드래그해서 골라 주세요.'; return; }
    const map = textMap(range);
    const chunks = splitChunks(map.text);
    if (!chunks.length) { statusEl.textContent = '읽을 글자가 없어요.'; return; }
    const voice = pickVoice(), job = { cancelled: false, map };
    reading = job;
    let gotBoundary = false;
    statusEl.textContent = `${from}을(를) 읽는 중…` + (voice ? '' : ' (한국어 음성이 없으면 기본 음성으로 읽어요)');
    const p = root.querySelector('.play'); p.classList.add('busy'); p.textContent = '⏸ 그만 읽기';
    chunks.forEach(([a, b], i) => {
      const u = new SpeechSynthesisUtterance(map.text.slice(a, b));
      u.lang = 'ko-KR'; if (voice) u.voice = voice; u.rate = S.rate;
      u.onstart = () => {
        if (job.cancelled) return;
        const r = rangeAt(map, a, b); mark('er-sent', r); mark('er-word');
        if (r) { const rc = r.getBoundingClientRect(); if (rc.top < 40 || rc.bottom > window.innerHeight - 40) r.startContainer.parentElement.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      };
      u.onboundary = e => {
        if (job.cancelled || (e.name && e.name !== 'word')) return;
        gotBoundary = true;
        const s = a + e.charIndex;
        let len = e.charLength;
        if (!len) { const m = /^[^\s.,!?…"'“”‘’()]+/.exec(map.text.slice(s)); len = m ? m[0].length : 1; }
        mark('er-word', rangeAt(map, s, Math.min(b, s + len)));
      };
      u.onend = () => {
        if (job.cancelled || i !== chunks.length - 1) return;
        reading = null; stopSpeak(false);
        statusEl.textContent = gotBoundary ? '다 읽었어요. 단어마다 노랗게 따라갔어요.' : '다 읽었어요. (이 음성은 단어 위치를 알려 주지 않아 문장 단위로 표시했어요)';
      };
      u.onerror = ev => { if (!job.cancelled && ev.error !== 'interrupted' && ev.error !== 'canceled') { statusEl.textContent = '읽기 오류: ' + ev.error; stopSpeak(false); } };
      synth.speak(u);
    });
  }

  /* ---------- 켜기 / 끄기 ---------- */
  async function load() {
    const prefs = (await store.get('prefs')) || {};
    const site = await store.get('site:' + SITE);
    const glob = await store.get('global');
    const saved = (prefs.perSite && site) || glob;
    S = { ...DEFAULTS, ...(saved ? saved : (window.__easyReaderDefaults || {})), perSite: !!prefs.perSite };
  }
  function show() {
    if (!pageStyle.isConnected) (document.head || document.documentElement).appendChild(pageStyle);
    if (!host.isConnected) (document.body || document.documentElement).appendChild(host);
    on = true; collapsed = false; applyAll();
  }
  function hide() { stopSpeak(false); on = false; applyAll(); }
  function toggle() { on ? hide() : show(); }

  window.__easyReader = {
    toggle, show, hide, speak, stop: () => stopSpeak(true), collapse: () => { collapsed = true; syncUI(); },
    set, get state() { return { ...S, on, collapsed }; },
    _test: { textMap, rangeAt, splitChunks, mark, centerRange }
  };
  load().then(show, show);
})();
