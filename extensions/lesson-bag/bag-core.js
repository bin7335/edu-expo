// ==core:start== 수업 가방 핵심 로직 (확장 bag-core.js 와 체험 페이지가 같은 코드)
// 네트워크 요청 없음. QR도 이 파일 안에서 직접 그립니다.

/*
 * 작은 QR 코드 인코더 (바이트 모드, 오류 정정 M, 버전 1-40)
 * 이 앱을 위해 새로 작성. 알고리즘 구조는 ISO/IEC 18004 표준 및
 * Project Nayuki "QR Code generator library"(MIT License, Copyright (c) Project Nayuki)의
 * 공개된 설계를 참고했습니다.
 * (edu-expo "척척 QR 이름표"의 인코더를 그대로 옮겨 씀)
 */
const QR = (() => {
  // [버전] 블록당 ECC 코드워드 수 / 블록 수 (오류 정정 레벨 M)
  const ECC_PER_BLOCK = [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28];
  const NUM_BLOCKS    = [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49];
  const FORMAT_M = 0; // 레벨 M의 형식 비트 값

  function rawModules(v){
    let r = (16*v + 128)*v + 64;
    if (v >= 2){ const n = Math.floor(v/7) + 2; r -= (25*n - 10)*n - 55; if (v >= 7) r -= 36; }
    return r;
  }
  const dataCodewords = v => Math.floor(rawModules(v)/8) - ECC_PER_BLOCK[v]*NUM_BLOCKS[v];

  function gfMul(x, y){ let z = 0; for (let i = 7; i >= 0; i--){ z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; }
  function rsDivisor(deg){
    const r = new Array(deg).fill(0); r[deg-1] = 1; let root = 1;
    for (let i = 0; i < deg; i++){
      for (let j = 0; j < r.length; j++){ r[j] = gfMul(r[j], root); if (j+1 < r.length) r[j] ^= r[j+1]; }
      root = gfMul(root, 2);
    }
    return r;
  }
  function rsRemainder(data, div){
    const r = div.map(() => 0);
    for (const b of data){ const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => r[i] ^= gfMul(c, f)); }
    return r;
  }

  function encode(text){
    const bytes = Array.from(new TextEncoder().encode(text));
    const nonAscii = bytes.some(b => b > 127);
    // 버전 결정
    let ver = 0, bitsNeeded = 0;
    for (let v = 1; v <= 40; v++){
      const cc = v < 10 ? 8 : 16;
      bitsNeeded = (nonAscii ? 12 : 0) + 4 + cc + bytes.length*8;
      if (bitsNeeded <= dataCodewords(v)*8){ ver = v; break; }
    }
    if (!ver) throw new Error('너무 길어요');
    // 비트열
    const bb = [];
    const put = (val, len) => { for (let i = len-1; i >= 0; i--) bb.push((val >>> i) & 1); };
    if (nonAscii){ put(0b0111, 4); put(26, 8); }   // ECI 26 = UTF-8
    put(0b0100, 4); put(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(b => put(b, 8));
    const cap = dataCodewords(ver)*8;
    put(0, Math.min(4, cap - bb.length));
    put(0, (8 - bb.length % 8) % 8);
    for (let p = 0xEC; bb.length < cap; p ^= 0xEC ^ 0x11) put(p, 8);
    const data = [];
    for (let i = 0; i < bb.length; i += 8){ let x = 0; for (let j = 0; j < 8; j++) x = (x << 1) | bb[i+j]; data.push(x); }

    // ECC + 인터리브
    const nb = NUM_BLOCKS[ver], el = ECC_PER_BLOCK[ver], raw = Math.floor(rawModules(ver)/8);
    const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
    const div = rsDivisor(el), blocks = [];
    for (let i = 0, k = 0; i < nb; i++){
      const d = data.slice(k, k + shortLen - el + (i < nShort ? 0 : 1)); k += d.length;
      const e = rsRemainder(d, div);
      if (i < nShort) d.push(0);
      blocks.push(d.concat(e));
    }
    const cw = [];
    for (let i = 0; i < blocks[0].length; i++)
      for (let j = 0; j < nb; j++)
        if (i !== shortLen - el || j >= nShort) cw.push(blocks[j][i]);

    // 행렬
    const size = ver*4 + 17;
    const mod = Array.from({length:size}, () => new Array(size).fill(false));
    const fn  = Array.from({length:size}, () => new Array(size).fill(false));
    const set = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };

    for (let i = 0; i < size; i++){ set(6, i, i%2 === 0); set(i, 6, i%2 === 0); }
    const finder = (cx, cy) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++){
        const x = cx+dx, y = cy+dy, d = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    };
    finder(3,3); finder(size-4,3); finder(3,size-4);
    // 정렬 패턴
    let al = [];
    if (ver > 1){
      const n = Math.floor(ver/7) + 2;
      const step = ver === 32 ? 26 : Math.ceil((ver*4 + 4) / (n*2 - 2)) * 2;
      al = [6];
      for (let p = size - 7; al.length < n; p -= step) al.splice(1, 0, p);
    }
    al.forEach((ax, i) => al.forEach((ay, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === al.length-1) || (i === al.length-1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
        set(ax+dx, ay+dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    const drawFormat = mask => {
      const d = (FORMAT_M << 3) | mask; let r = d;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const bits = ((d << 10) | r) ^ 0x5412;
      const g = i => ((bits >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) set(8, i, g(i));
      set(8, 7, g(6)); set(8, 8, g(7)); set(7, 8, g(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, g(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, g(i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, g(i));
      set(8, size - 8, true);
    };
    drawFormat(0);
    if (ver >= 7){
      let r = ver;
      for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      const bits = (ver << 12) | r;
      for (let i = 0; i < 18; i++){
        const b = ((bits >>> i) & 1) !== 0, a = size - 11 + i % 3, c = Math.floor(i / 3);
        set(a, c, b); set(c, a, b);
      }
    }
    // 데이터 배치 (지그재그)
    let bi = 0;
    for (let right = size - 1; right >= 1; right -= 2){
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++){
        for (let j = 0; j < 2; j++){
          const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
          if (!fn[y][x] && bi < cw.length*8){ mod[y][x] = ((cw[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0; bi++; }
        }
      }
    }
    // 마스크 선택
    const maskFn = [
      (x,y) => (x+y)%2 === 0, (x,y) => y%2 === 0, (x,y) => x%3 === 0, (x,y) => (x+y)%3 === 0,
      (x,y) => (Math.floor(x/3)+Math.floor(y/2))%2 === 0, (x,y) => x*y%2 + x*y%3 === 0,
      (x,y) => (x*y%2 + x*y%3)%2 === 0, (x,y) => ((x+y)%2 + x*y%3)%2 === 0,
    ];
    const applyMask = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && maskFn[m](x,y)) mod[y][x] = !mod[y][x]; };
    const penalty = () => {
      let p = 0, dark = 0;
      const lineScore = get => {
        for (let a = 0; a < size; a++){
          let run = 1, s = '';
          for (let b = 0; b < size; b++){
            const v = get(a, b); s += v ? '1' : '0';
            if (b > 0){ if (v === get(a, b-1)){ run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
          }
          const t = '0000' + s + '0000';
          for (let i = t.indexOf('1011101'); i !== -1; i = t.indexOf('1011101', i + 1))
            if (t.substr(i-4, 4) === '0000' || t.substr(i+7, 4) === '0000') p += 40;
        }
      };
      lineScore((a,b) => mod[a][b]); lineScore((a,b) => mod[b][a]);
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++){
        if (mod[y][x]) dark++;
        if (x < size-1 && y < size-1){ const c = mod[y][x]; if (c === mod[y][x+1] && c === mod[y+1][x] && c === mod[y+1][x+1]) p += 3; }
      }
      const total = size*size;
      p += Math.max(0, Math.ceil(Math.abs(dark*20 - total*10) / total) - 1) * 10;
      return p;
    };
    let best = 0, bestP = Infinity;
    for (let m = 0; m < 8; m++){
      applyMask(m); drawFormat(m);
      const pv = penalty();
      if (pv < bestP){ bestP = pv; best = m; }
      applyMask(m);
    }
    applyMask(best); drawFormat(best);
    return { size, ver, mask: best, modules: mod };
  }

  function toSvg(text, quiet = 4){
    const q = encode(text), n = q.size + quiet*2;
    let d = '';
    for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++)
      if (q.modules[y][x]) d += `M${x+quiet} ${y+quiet}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  return { encode, toSvg };
})();

const BagCore = (() => {
  const clean = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // http/https 주소만 담기 (크롬 설정 화면·확장 페이지 등은 뺌)
  function normalizeUrl(u){
    let s = clean(u);
    if (!s) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s;
    try { const x = new URL(s); return /^https?:$/.test(x.protocol) ? x.href : null; } catch (_) { return null; }
  }
  function displayUrl(u){ try { return decodeURI(u); } catch (_) { return u; } }
  function hostOf(u){ try { return new URL(u).hostname.replace(/^www\./, ''); } catch (_) { return ''; } }

  // 제목 없이 주소만 넣었을 때: 주소 끝부분으로 제목 짐작 (예: …/wiki/수증기 → '수증기 - ko.wikipedia.org')
  function guessTitle(url){
    const host = hostOf(url);
    try {
      const seg = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '').replace(/_/g, ' ').trim();
      return seg ? `${seg.slice(0, 60)} - ${host}` : host || url;
    } catch (_) { return host || url; }
  }
  function makeLinks(list){
    const out = [];
    (list || []).forEach(x => {
      const url = normalizeUrl(x && x.url);
      if (url) out.push({ title: clean(x.title) || guessTitle(url), url });
    });
    return out;
  }
  const defaultName = (now = new Date()) => `${now.getMonth() + 1}월 ${now.getDate()}일 수업 세트`;
  const makeSet = (name, links, now = new Date()) =>
    ({ id: uid(), name: clean(name) || defaultName(now), createdAt: now.toISOString(), links: makeLinks(links) });

  function move(arr, i, d){
    const j = i + d;
    if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return arr;
    const a = arr.slice(); [a[i], a[j]] = [a[j], a[i]]; return a;
  }

  const exportJson = sets => JSON.stringify({
    app: 'lesson-bag', version: 1, exportedAt: new Date().toISOString(),
    sets: sets.map(s => ({ name: s.name, createdAt: s.createdAt, links: s.links })),
  }, null, 2);

  // 내보낸 JSON(또는 세트 배열)을 읽어 새 세트 목록으로. 이상한 주소는 건너뜀
  function parseImport(text){
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data && Array.isArray(data.sets) ? data.sets : null;
    if (!arr) throw new Error('수업 가방에서 내보낸 JSON이 아니에요');
    let skipped = 0;
    const sets = [];
    arr.forEach(s => {
      if (!s || !Array.isArray(s.links)) { skipped++; return; }
      const links = makeLinks(s.links);
      skipped += s.links.length - links.length;
      if (!links.length) return;
      const set = makeSet(s.name, [], s.createdAt ? new Date(s.createdAt) : new Date());
      if (isNaN(new Date(set.createdAt))) set.createdAt = new Date().toISOString();
      set.links = links;
      sets.push(set);
    });
    return { sets, skipped };
  }

  // QR에 넣을 글: 링크 하나(카메라로 찍으면 바로 열림) 또는 목록 전체(글자)
  function qrText(set, choice){
    if (choice === 'list')
      return `[수업 가방] ${set.name}\n` + set.links.map((l, i) => `${i + 1}. ${l.title}\n${l.url}`).join('\n');
    const l = set.links[+choice] || set.links[0];
    return l ? l.url : '';
  }
  function qrSvg(text){ try { return QR.toSvg(text); } catch (_) { return ''; } }

  const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? '' : `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  return { normalizeUrl, displayUrl, hostOf, makeLinks, defaultName, makeSet, move, exportJson, parseImport, qrText, qrSvg, fmtDate, esc };
})();
// ==core:end==
