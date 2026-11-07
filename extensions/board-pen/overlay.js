/* 투명 판서판 - 투명 판서 오버레이 (확장 content script · 체험 페이지 공용 코드)
 * 한 번 주입되면 window.__boardPen 에 남고, 다시 주입하면 켜기/끄기만 바꾼다.
 * 외부 전송·저장 없음. 필기는 페이지(문서) 좌표로 저장되어 스크롤해도 글자에 붙어 있다. */
(() => {
  'use strict';
  if (window.__boardPen) { window.__boardPen.toggle(); return; }

  const COLORS = [['#e53935', '빨강'], ['#1e66f5', '파랑'], ['#1b1b1b', '검정']];
  const SIZES = [[2, '가늘게'], [5, '보통'], [10, '굵게']];
  const SPOT_R = [90, 140, 210];
  const HL_COLOR = '#ffd400';
  const LASER_LIFE = 750;
  const TOOLS = [
    ['pass', '🖱️', '통과', 'V'], ['pen', '✏️', '펜', 'P'], ['hl', '🖍️', '형광펜', 'H'],
    ['erase', '🧽', '지우개', 'E'], ['laser', '🔴', '레이저', 'L'], ['arrow', '↗️', '화살표', 'A'],
    ['rect', '⬜', '네모', 'R'], ['spot', '🔦', '조명', 'S']
  ];

  const S = {
    on: false, tool: 'pen', color: COLORS[0][0], sizeIdx: 1,
    strokes: [], history: [], laser: [], cur: null,
    ptr: { x: -9999, y: -9999, inside: false }, raf: 0, inkDirty: false
  };

  const host = document.createElement('div');
  host.id = 'board-pen-host';
  host.setAttribute('style', 'all:initial;position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147483646;pointer-events:none;display:none;');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
<style>
  :host{all:initial}
  *{box-sizing:border-box;font-family:system-ui,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}
  canvas{position:fixed;left:0;top:0;width:100vw;height:100vh;display:block}
  .ink{pointer-events:auto;touch-action:none;cursor:crosshair}
  .ink.pass{pointer-events:none}
  .ink.spot,.ink.laser{cursor:none}
  .ink.erase{cursor:cell}
  .fx{pointer-events:none}
  .bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);pointer-events:auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:3px;
    width:max-content;max-width:calc(100vw - 12px);padding:6px 8px;border-radius:18px;background:rgba(28,30,38,.94);color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.35);user-select:none;-webkit-user-select:none;touch-action:none}
  .grip{cursor:grab;color:#9aa0ad;font-size:16px;padding:0 4px;align-self:stretch;display:flex;align-items:center}
  .sep{width:1px;align-self:stretch;background:rgba(255,255,255,.15);margin:2px 3px}
  button{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-width:44px;height:46px;padding:0 3px;border-radius:12px;color:#e9ebf1;font-size:10.5px;font-weight:700;line-height:1.1;text-align:center}
  button .i{font-size:19px;line-height:1}
  button:hover{background:rgba(255,255,255,.1)}
  button.on{background:#ffd84d;color:#1c1e26}
  button:focus-visible{outline:2px solid #8ab4ff}
  .sw{min-width:30px}
  .sw .dot{width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,.55)}
  .sw.on{background:rgba(255,255,255,.18);color:#fff}
  .sw.on .dot{border-color:#fff;box-shadow:0 0 0 2px #ffd84d}
  .sz{min-width:30px}
  .sz .ln{width:20px;border-radius:9px;background:#fff}
  .sz.on{background:rgba(255,255,255,.18);color:#fff}
  .tip{position:fixed;left:50%;top:14px;transform:translateX(-50%);background:rgba(28,30,38,.9);color:#fff;padding:7px 14px;border-radius:12px;font-size:13px;font-weight:700;opacity:0;transition:opacity .25s;pointer-events:none;white-space:nowrap}
  .tip.show{opacity:1}
  @media (max-width:560px){
    button{min-width:36px;height:36px}
    button .t{display:none}
    button .i{font-size:18px}
    .sw,.sz{min-width:30px}
    .sep{display:none}
    .bar{bottom:8px;gap:2px;padding:5px}
  }
</style>
<canvas class="ink"></canvas>
<canvas class="fx"></canvas>
<div class="tip"></div>
<div class="bar" role="toolbar" aria-label="판서 도구">
  <span class="grip" title="끌어서 옮기기">⠿</span>
  ${TOOLS.map(([id, ic, label, key]) => `<button data-tool="${id}" title="${label} (${key})"><span class="i">${ic}</span><span class="t">${label}</span></button>`).join('')}
  <span class="sep"></span>
  ${COLORS.map(([c, n]) => `<button class="sw" data-color="${c}" title="${n}"><span class="dot" style="background:${c}"></span><span class="t">${n}</span></button>`).join('')}
  <span class="sep"></span>
  ${SIZES.map(([w, n], i) => `<button class="sz" data-size="${i}" title="${n}"><span class="ln" style="height:${Math.max(2, w * .8)}px"></span><span class="t">${n}</span></button>`).join('')}
  <span class="sep"></span>
  <button data-act="undo" title="되돌리기 (Ctrl+Z)"><span class="i">↶</span><span class="t">되돌리기</span></button>
  <button data-act="clear" title="전체 지우기"><span class="i">🗑️</span><span class="t">전체</span></button>
  <button data-act="close" title="판서 끄기 (Alt+Shift+D)"><span class="i">✕</span><span class="t">끄기</span></button>
</div>`;

  const ink = root.querySelector('.ink');
  const fx = root.querySelector('.fx');
  const bar = root.querySelector('.bar');
  const tip = root.querySelector('.tip');
  const ictx = ink.getContext('2d');
  const fctx = fx.getContext('2d');
  let dpr = 1, W = 0, H = 0;

  /* ---------- 캔버스 크기 · 다시 그리기 ---------- */
  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    for (const c of [ink, fx]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    redrawInk(); drawFx();
  }
  function redrawInk() {
    S.inkDirty = false;
    ictx.setTransform(1, 0, 0, 1, 0, 0);
    ictx.clearRect(0, 0, ink.width, ink.height);
    ictx.setTransform(dpr, 0, 0, dpr, -window.scrollX * dpr, -window.scrollY * dpr);
    for (const s of S.strokes) drawItem(ictx, s);
  }
  function drawItem(ctx, s) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = s.color; ctx.lineWidth = s.w;
    if (s.type === 'hl') ctx.globalAlpha = .38;
    if (s.type === 'arrow') {
      const [x1, y1, x2, y2] = s.box;
      const ang = Math.atan2(y2 - y1, x2 - x1), head = 12 + s.w * 2.4;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2 - head * Math.cos(ang - .45), y2 - head * Math.sin(ang - .45));
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - head * Math.cos(ang + .45), y2 - head * Math.sin(ang + .45));
      ctx.stroke();
    } else if (s.type === 'rect') {
      const [x1, y1, x2, y2] = s.box;
      ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    } else {
      const p = s.pts;
      ctx.beginPath();
      if (p.length < 3) {
        ctx.moveTo(p[0][0], p[0][1]);
        ctx.lineTo(p[p.length - 1][0] + .01, p[p.length - 1][1]);
      } else {
        ctx.moveTo(p[0][0], p[0][1]);
        for (let i = 1; i < p.length - 1; i++) {
          const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
          ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
        }
        ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* 효과 레이어: 그리는 중인 획, 레이저 꼬리, 스포트라이트, 지우개 커서 */
  function drawFx() {
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, fx.width, fx.height);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (S.cur && (S.cur.pts || S.cur.box)) {
      fctx.save(); fctx.translate(-window.scrollX, -window.scrollY); drawItem(fctx, S.cur); fctx.restore();
    }
    const now = performance.now();
    S.laser = S.laser.filter(p => now - p.t < LASER_LIFE);
    if (S.laser.length) {
      const base = 3 + SIZES[S.sizeIdx][0] * .9;
      fctx.lineCap = 'round';
      for (let i = 1; i < S.laser.length; i++) {
        const a = S.laser[i - 1], b = S.laser[i], k = 1 - (now - b.t) / LASER_LIFE;
        fctx.strokeStyle = `rgba(255,40,40,${k * .85})`;
        fctx.lineWidth = base * (.35 + .65 * k);
        fctx.shadowColor = 'rgba(255,0,0,.8)'; fctx.shadowBlur = 10 * k;
        fctx.beginPath(); fctx.moveTo(a.x, a.y); fctx.lineTo(b.x, b.y); fctx.stroke();
      }
      fctx.shadowBlur = 0;
    }
    if (S.tool === 'laser' && S.ptr.inside) {
      const r = 5 + SIZES[S.sizeIdx][0] * .5;
      fctx.fillStyle = '#ff2a2a'; fctx.shadowColor = '#ff0000'; fctx.shadowBlur = 14;
      fctx.beginPath(); fctx.arc(S.ptr.x, S.ptr.y, r, 0, Math.PI * 2); fctx.fill();
      fctx.shadowBlur = 0;
    }
    if (S.tool === 'spot') {
      const r = SPOT_R[S.sizeIdx];
      const x = S.ptr.inside ? S.ptr.x : W / 2, y = S.ptr.inside ? S.ptr.y : H / 2;
      fctx.fillStyle = 'rgba(0,0,0,.72)';
      fctx.fillRect(0, 0, W, H);
      fctx.globalCompositeOperation = 'destination-out';
      const g = fctx.createRadialGradient(x, y, r * .82, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      fctx.fillStyle = g;
      fctx.beginPath(); fctx.arc(x, y, r, 0, Math.PI * 2); fctx.fill();
      fctx.globalCompositeOperation = 'source-over';
    }
    if (S.tool === 'erase' && S.ptr.inside) {
      fctx.strokeStyle = 'rgba(0,0,0,.55)'; fctx.lineWidth = 1.5; fctx.setLineDash([4, 3]);
      fctx.beginPath(); fctx.arc(S.ptr.x, S.ptr.y, eraseR(), 0, Math.PI * 2); fctx.stroke();
      fctx.setLineDash([]);
    }
  }
  function loop() {
    S.raf = 0;
    if (S.inkDirty) redrawInk();
    drawFx();
    if (S.on && S.laser.length) S.raf = requestAnimationFrame(loop);
  }
  function kick() { if (!S.raf) S.raf = requestAnimationFrame(loop); }

  /* ---------- 기록 / 되돌리기 ---------- */
  function commit(next) {
    S.history.push(S.strokes);
    if (S.history.length > 200) S.history.shift();
    S.strokes = next;
    S.inkDirty = true; kick();
  }
  function undo() {
    if (!S.history.length) { toast('되돌릴 필기가 없어요'); return; }
    S.strokes = S.history.pop(); S.inkDirty = true; kick();
  }
  function clearAll() {
    if (!S.strokes.length) { toast('지울 필기가 없어요'); return; }
    commit([]); toast('전체 지움 · 되돌리기로 살릴 수 있어요');
  }

  /* ---------- 지우개 (획 단위) ---------- */
  const eraseR = () => 8 + SIZES[S.sizeIdx][0] * 1.6;
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }
  function hits(s, x, y, r) {
    const rr = r + s.w / 2;
    let segs = [];
    if (s.type === 'arrow') segs = [s.box];
    else if (s.type === 'rect') {
      const [a, b, c, d] = s.box;
      segs = [[a, b, c, b], [c, b, c, d], [c, d, a, d], [a, d, a, b]];
    } else {
      if (s.pts.length === 1) return Math.hypot(s.pts[0][0] - x, s.pts[0][1] - y) < rr;
      for (let i = 1; i < s.pts.length; i++) segs.push([s.pts[i - 1][0], s.pts[i - 1][1], s.pts[i][0], s.pts[i][1]]);
    }
    return segs.some(g => segDist(x, y, g[0], g[1], g[2], g[3]) < rr);
  }
  function eraseAt(x, y) {
    const keep = S.strokes.filter(s => !hits(s, x, y, eraseR()));
    if (keep.length !== S.strokes.length) {
      if (!S.cur.committed) { commit(keep); S.cur.committed = true; }
      else { S.strokes = keep; S.inkDirty = true; kick(); }
    }
  }

  /* ---------- 포인터 ---------- */
  const docPt = e => [e.clientX + window.scrollX, e.clientY + window.scrollY];
  ink.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    try { ink.setPointerCapture(e.pointerId); } catch (_) {}
    S.ptr = { x: e.clientX, y: e.clientY, inside: true };
    const [x, y] = docPt(e), w = SIZES[S.sizeIdx][0];
    if (S.tool === 'pen') S.cur = { type: 'pen', color: S.color, w, pts: [[x, y]] };
    else if (S.tool === 'hl') S.cur = { type: 'hl', color: HL_COLOR, w: w * 3 + 10, pts: [[x, y]] };
    else if (S.tool === 'arrow' || S.tool === 'rect') S.cur = { type: S.tool, color: S.color, w: Math.max(3, w), box: [x, y, x, y] };
    else if (S.tool === 'erase') { S.cur = { erasing: true, committed: false, type: 'none' }; eraseAt(x, y); }
    else if (S.tool === 'laser') S.laser.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    kick();
  });
  ink.addEventListener('pointermove', e => {
    S.ptr = { x: e.clientX, y: e.clientY, inside: true };
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (S.tool === 'laser') {
      for (const c of (evs.length ? evs : [e])) S.laser.push({ x: c.clientX, y: c.clientY, t: performance.now() });
    } else if (S.cur && S.cur.pts) {
      for (const c of (evs.length ? evs : [e])) {
        const [x, y] = docPt(c), last = S.cur.pts[S.cur.pts.length - 1];
        if (Math.hypot(x - last[0], y - last[1]) > .8) S.cur.pts.push([x, y]);
      }
    } else if (S.cur && S.cur.box) {
      const [x, y] = docPt(e); S.cur.box[2] = x; S.cur.box[3] = y;
    } else if (S.cur && S.cur.erasing) {
      const [x, y] = docPt(e); eraseAt(x, y);
    }
    kick();
  });
  function endStroke() {
    const c = S.cur; S.cur = null;
    if (c && (c.pts || c.box)) {
      const tiny = c.box && Math.hypot(c.box[2] - c.box[0], c.box[3] - c.box[1]) < 6;
      if (!tiny) commit(S.strokes.concat([c]));
    }
    kick();
  }
  ink.addEventListener('pointerup', endStroke);
  ink.addEventListener('pointercancel', endStroke);
  ink.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse' || !S.cur) { S.ptr.inside = false; kick(); } });

  /* ---------- 도구 모음 ---------- */
  function setTool(t) {
    S.tool = t;
    ink.className = 'ink ' + t;
    root.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    const label = TOOLS.find(x => x[0] === t)[2];
    if (t === 'pass') toast('통과 모드: 필기는 남기고 페이지를 그대로 클릭·스크롤해요');
    else if (t === 'spot') toast('조명: 굵기 버튼으로 동그라미 크기를 바꿔요');
    else toast(label);
    kick();
  }
  function setColor(c) {
    S.color = c;
    root.querySelectorAll('[data-color]').forEach(b => b.classList.toggle('on', b.dataset.color === c));
    if (['pass', 'erase', 'laser', 'spot', 'hl'].includes(S.tool)) setTool('pen');
  }
  function setSize(i) {
    S.sizeIdx = i;
    root.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('on', +b.dataset.size === i));
    kick();
  }
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) setTool(b.dataset.tool);
    else if (b.dataset.color) setColor(b.dataset.color);
    else if (b.dataset.size) setSize(+b.dataset.size);
    else if (b.dataset.act === 'undo') undo();
    else if (b.dataset.act === 'clear') clearAll();
    else if (b.dataset.act === 'close') hide();
  });
  // 도구 모음 끌어 옮기기
  const grip = root.querySelector('.grip');
  grip.addEventListener('pointerdown', e => {
    e.preventDefault();
    const r = bar.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
    grip.setPointerCapture(e.pointerId);
    const mv = ev => {
      const x = Math.max(0, Math.min(window.innerWidth - r.width, ev.clientX - ox));
      const y = Math.max(0, Math.min(window.innerHeight - r.height, ev.clientY - oy));
      Object.assign(bar.style, { left: x + 'px', top: y + 'px', bottom: 'auto', transform: 'none' });
    };
    const up = () => { grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); };
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up);
  });

  let tipTimer = 0;
  function toast(msg) {
    tip.textContent = msg; tip.classList.add('show');
    clearTimeout(tipTimer); tipTimer = setTimeout(() => tip.classList.remove('show'), 1600);
  }

  /* ---------- 키보드 ---------- */
  const KEYMAP = Object.fromEntries(TOOLS.map(t => [t[3].toLowerCase(), t[0]]));
  function onKey(e) {
    if (!S.on) return;
    const t = e.composedPath()[0];
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { if (S.tool === 'pass') hide(); else setTool('pass'); return; }
    const k = KEYMAP[e.key.toLowerCase()];
    if (k) { setTool(k); e.preventDefault(); }
    else if (e.key === '[' || e.key === ']') setSize(Math.max(0, Math.min(2, S.sizeIdx + (e.key === ']' ? 1 : -1))));
  }

  /* ---------- 켜기 / 끄기 ---------- */
  function onScroll() { if (S.on) { S.inkDirty = true; kick(); } }
  function show() {
    if (!host.isConnected) (document.body || document.documentElement).appendChild(host);
    host.style.display = 'block'; S.on = true; resize();
    toast('판서 켜짐 · 끄기: Alt+Shift+D 또는 ✕');
  }
  function hide() { S.on = false; S.laser = []; S.cur = null; host.style.display = 'none'; }
  function toggle() { S.on ? hide() : show(); }

  window.addEventListener('resize', () => { if (S.on) resize(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', onKey);

  setTool('pen'); setColor(S.color); setSize(1);
  window.__boardPen = {
    toggle, show, hide, setTool, setColor, setSize, undo, clear: clearAll,
    add(item) { commit(S.strokes.concat([item])); },
    get state() { return S; }
  };
  show();
})();
