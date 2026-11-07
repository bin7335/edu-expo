// ==core:start== 출처 꼬리표 핵심 로직 (확장 cite-core.js 와 체험 페이지가 같은 코드)
// 이 코드는 어떤 데이터도 외부로 보내지 않습니다. 네트워크 요청이 전혀 없습니다.
const SourceTag = (() => {
  const MAX_HISTORY = 30;
  const FORMATS = {
    easy: { label: '초등 쉬운 형식', short: '쉬운 형식' },
    apa:  { label: 'APA 비슷한 형식', short: 'APA 비슷' },
  };
  const clean = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const norm = s => clean(s).toLowerCase().replace(/[\s.\-_]/g, '');

  // 'YYYY-MM-DD' 또는 Date → {y,m,d} (시간대 밀림 없이 그 지역 날짜 기준)
  function ymdParts(date){
    if (typeof date === 'string'){
      const m = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (m) return { y: +m[1], m: +m[2], d: +m[3] };
    }
    const dt = date instanceof Date ? date : new Date();
    return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
  }
  function ymd(date){
    const p = ymdParts(date);
    return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
  }
  const koDate = date => { const p = ymdParts(date); return `${p.y}년 ${p.m}월 ${p.d}일`; };

  // "글 제목 - 사이트" 처럼 끝(또는 앞)에 붙은 사이트 이름 떼기
  function stripSite(title, site){
    const parts = title.split(/\s+[-|·—–:]{1,2}\s+/);
    if (parts.length < 2 || !site) return title;
    const s = norm(site);
    const same = p => { const n = norm(p); return n && (n === s || n.includes(s) || s.includes(n)); };
    if (same(parts[parts.length - 1])) return parts.slice(0, -1).join(' - ');
    if (same(parts[0])) return parts.slice(1).join(' - ');
    return title;
  }

  // 주소 정리: 크롬 '텍스트 조각' 꼬리는 늘 떼고, 기본으로 ?쿼리·#해시도 뗌(검색어·로그인 토큰 등이 출처에 남지 않게)
  // fullUrl 이 true 면 ?쿼리·#해시를 그대로 둠 (게시판 글 번호처럼 주소에 꼭 필요한 경우)
  function cleanUrl(href, fullUrl){
    let url = String(href == null ? '' : href).replace(/:~:.*$/, '').replace(/#$/, '');
    if (fullUrl) return url;
    try { const u = new URL(url); u.search = ''; u.hash = ''; return u.href; }
    catch (_) { return url.replace(/[?#].*$/, ''); }
  }

  // 지금 보고 있는 문서에서 제목·사이트 이름·주소 읽기 (opt.fullUrl: 주소 전체 넣기)
  function readMeta(doc, loc, opt){
    const meta = sel => { const el = doc.querySelector(sel); return el ? clean(el.getAttribute('content')) : ''; };
    const host = (loc && loc.hostname || '').replace(/^www\./, '');
    const site = meta('meta[property="og:site_name"]') || meta('meta[name="application-name"]') || host || '이름 없는 사이트';
    let title = meta('meta[property="og:title"]') || clean(doc.title);
    if (!title){ const h1 = doc.querySelector('h1'); title = h1 ? clean(h1.textContent) : ''; }
    title = stripSite(title || '제목 없음', site);
    let author = meta('meta[name="author"]') || meta('meta[property="article:author"]');
    if (/^https?:/i.test(author)) author = '';
    const pub = meta('meta[property="article:published_time"]') || meta('meta[name="date"]') || meta('meta[itemprop="datePublished"]');
    const ym = pub.match(/(19|20)\d{2}/);
    const url = loc ? cleanUrl(loc.href, opt && opt.fullUrl) : '';
    return { title, site, url, author, year: ym ? ym[0] : '' };
  }

  const dot = s => /[.?!。]$/.test(s) ? s : s + '.';

  function buildCitation(meta, format, date){
    const title = clean(meta.title) || '제목 없음';
    const site = clean(meta.site) || '이름 없는 사이트';
    const url = clean(meta.url);
    const when = koDate(date);
    if (format === 'apa'){
      const year = `(${meta.year || 'n.d.'}).`;
      const head = meta.author ? `${dot(clean(meta.author))} ${year} ${dot(title)}` : `${dot(title)} ${year}`;
      return `${head} ${dot(site)} ${when} 확인, ${url}`;
    }
    return `[출처] 「${title}」, ${site}, ${url}, ${when} 확인`;
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const composeText = (text, cite) => `${String(text).replace(/\s+$/, '')}\n\n${cite}`;
  const composeHtml = (html, cite) => `${html}<p>${esc(cite)}</p>`;

  function selectionHtml(sel){
    if (!sel || !sel.rangeCount) return '';
    const box = document.createElement('div');
    for (let i = 0; i < sel.rangeCount; i++) box.appendChild(sel.getRangeAt(i).cloneContents());
    return box.innerHTML;
  }

  function isEditableTarget(t){
    let el = t && t.nodeType === 1 ? t : t && t.parentElement;
    if (!el) return false;
    return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
  }

  // copy 이벤트 하나를 처리: 클립보드에 '복사한 글 + 출처 한 줄'을 넣고 결과를 돌려줌
  function handleCopy(e, o){
    if (!o.enabled || e.defaultPrevented || !e.clipboardData) return null;   // 사이트가 직접 처리한 복사는 건드리지 않음
    if (isEditableTarget(e.target)) return null;                           // 글쓰기 칸 안의 복사는 그대로
    const sel = (o.win || window).getSelection();
    const text = sel ? sel.toString() : '';
    if (!text.trim()) return null;
    const meta = o.getMeta();
    const now = o.now || new Date();
    const cite = buildCitation(meta, o.format, now);
    const plain = composeText(text, cite);
    e.clipboardData.setData('text/plain', plain);
    e.clipboardData.setData('text/html', composeHtml(selectionHtml(sel), cite));
    e.preventDefault();
    return { meta, cite, plain, text, now };
  }

  const makeEntry = (meta, now) => ({
    title: clean(meta.title), site: clean(meta.site), url: clean(meta.url),
    author: clean(meta.author), year: clean(meta.year), checked: ymd(now),
  });
  function addHistory(list, entry){
    const out = (Array.isArray(list) ? list : []).filter(x => x && x.url !== entry.url);
    out.unshift(entry);
    return out.slice(0, MAX_HISTORY);
  }
  const historyText = (list, format) =>
    list.map((x, i) => `${i + 1}. ${buildCitation(x, format, x.checked)}`).join('\n');

  // 페이지 위에 잠깐 뜨는 알림 (사이트 디자인에 영향받지 않게 Shadow DOM 사용)
  function toast(doc, msg){
    try {
      const host = doc.createElement('div');
      host.style.cssText = 'position:fixed;z-index:2147483647;right:18px;bottom:18px;pointer-events:none';
      const root = host.attachShadow({ mode: 'closed' });
      root.innerHTML = '<div style="font:600 14px system-ui,\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;background:#0f766e;color:#fff;padding:10px 14px;border-radius:12px;box-shadow:0 6px 20px #0003;max-width:320px;line-height:1.4"></div>';
      root.firstChild.textContent = msg;
      (doc.body || doc.documentElement).appendChild(host);
      setTimeout(() => host.remove(), 1800);
    } catch (_) { /* 알림이 안 떠도 복사는 정상 */ }
  }

  return { FORMATS, MAX_HISTORY, cleanUrl, ymd, koDate, stripSite, readMeta, buildCitation, composeText, composeHtml,
    selectionHtml, isEditableTarget, handleCopy, makeEntry, addHistory, historyText, toast, esc };
})();
// ==core:end==
