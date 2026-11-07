// 법령 콕 - 핵심 로직 (확장 background·popup과 체험 페이지가 같은 코드)
// 하는 일: 글자 속 법령 이름을 알아보고 국가법령정보센터(law.go.kr) 주소를 만든다.
// 하지 않는 일: 네트워크 요청, 데이터 저장·전송. (주소 문자열만 만듦)
/* eslint-disable no-var */
var LawLink = (function () {
  var BASE = 'https://www.law.go.kr';

  // 자주 쓰는 약칭 → 정식 법령명 (국가법령정보센터 표기)
  var ABBR = {
    '학교폭력예방법': '학교폭력예방 및 대책에 관한 법률',
    '학폭법': '학교폭력예방 및 대책에 관한 법률',
    '교원지위법': '교원의 지위 향상 및 교육활동 보호를 위한 특별법',
    '교권보호법': '교원의 지위 향상 및 교육활동 보호를 위한 특별법',
    '청탁금지법': '부정청탁 및 금품등 수수의 금지에 관한 법률',
    '김영란법': '부정청탁 및 금품등 수수의 금지에 관한 법률',
    '이해충돌방지법': '공직자의 이해충돌 방지법',
    '개인정보보호법': '개인정보 보호법',
    '아동학대처벌법': '아동학대범죄의 처벌 등에 관한 특례법',
    '아동학대특례법': '아동학대범죄의 처벌 등에 관한 특례법',
    '정보공개법': '공공기관의 정보공개에 관한 법률',
    '학교안전법': '학교안전사고 예방 및 보상에 관한 법률',
    '특수교육법': '장애인 등에 대한 특수교육법',
    '초중등교육법': '초ㆍ중등교육법',
    '지방교육자치법': '지방교육자치에 관한 법률',
    '교육환경법': '교육환경 보호에 관한 법률',
    '학원법': '학원의 설립ㆍ운영 및 과외교습에 관한 법률',
    '청소년성보호법': '아동ㆍ청소년의 성보호에 관한 법률',
    '아청법': '아동ㆍ청소년의 성보호에 관한 법률',
    '성폭력처벌법': '성폭력범죄의 처벌 등에 관한 특례법',
    '장애인차별금지법': '장애인차별금지 및 권리구제 등에 관한 법률',
    '재난안전법': '재난 및 안전관리 기본법',
    '지방계약법': '지방자치단체를 당사자로 하는 계약에 관한 법률',
    '기초학력보장법': '기초학력 보장법',
    '영재교육법': '영재교육 진흥법',
    '공무원행동강령': '공무원 행동강령',
    '복무규정': '국가공무원 복무규정'
  };
  // 교육 현장에서 자주 보는 정식 법령명 (띄어쓰기·가운뎃점이 달라도 찾음)
  var KNOWN = [
    '교육기본법', '초ㆍ중등교육법', '유아교육법', '고등교육법', '평생교육법', '교육공무원법', '국가공무원법', '지방공무원법',
    '사립학교법', '학교보건법', '학교급식법', '학교체육진흥법', '인성교육진흥법', '학교도서관진흥법', '아동복지법', '청소년 보호법',
    '공직자윤리법', '행정절차법', '공무원연금법', '근로기준법', '저작권법', '도로교통법', '다문화가족지원법', '교원자격검정령',
    '교육공무원 승진규정', '감염병의 예방 및 관리에 관한 법률'
  ];
  Object.keys(ABBR).forEach(function (k) { if (KNOWN.indexOf(ABBR[k]) < 0) KNOWN.push(ABBR[k]); });

  // '법'으로 끝나지만 법령이 아닌 낱말
  var NOT_LAW = /(방법|문법|기법|수법|해법|용법|화법|요법|공법|불법|위법|적법|편법|비법|필법|작법|어법|합법|사법|입법|탈법|준법|헌법재판|교수법|학습법|지도법|계산법|표기법|작성법|사용법|활용법|접근법|평가법|분석법|측정법|연구법|관찰법|발표법|토론법|설명법|공부법|마법|만법|변법|병법|비례법|대화법)$/;

  var DOT = '[·ㆍ・.]?';
  function looseRe(name) {
    // 띄어쓰기는 있어도 없어도(글자 사이 어디든: '학교 보건법' = '학교보건법'), 가운뎃점은 어떤 모양이든 찾기
    return name.replace(/[·ㆍ・]/g, '\u0000').split('').map(function (ch) {
      if (ch === '\u0000') return DOT;
      if (ch === ' ') return '\\s*';
      return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '';
    }).join('\\s*').replace(/(\\s\*)+/g, '\\s*');
  }
  var squash = function (s) { return String(s).replace(/[\s·ㆍ・.]/g, ''); };
  var CANON = {};   // 띄어쓰기 없앤 이름 → 정식 이름
  KNOWN.forEach(function (n) { CANON[squash(n)] = n; });
  Object.keys(ABBR).forEach(function (k) { CANON[squash(k)] = ABBR[k]; });

  var ARTICLE = '(?:\\s*(제\\s*\\d+\\s*조(?:\\s*의\\s*\\d+)?))?';
  var SUB = '(?:\\s*(시행령|시행규칙))?';
  var namesSorted = KNOWN.concat(Object.keys(ABBR)).sort(function (a, b) { return b.length - a.length; });
  var KNOWN_RE = new RegExp('(' + namesSorted.map(looseRe).join('|') + ')' + SUB + ARTICLE, 'g');
  var QUOTE_RE = new RegExp('[「『]([^」』\\n]{2,60})[」』]' + ARTICLE, 'g');
  var GENERIC_RE = new RegExp('([가-힣ㆍ·]{2,24}(?:법률|법|령|규칙|규정|조례))' + SUB + ARTICLE, 'g');

  var clean = function (s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); };
  function normArticle(a) {
    if (!a) return '';
    var m = /제\s*(\d+)\s*조(?:\s*의\s*(\d+))?/.exec(a);
    return m ? '제' + m[1] + '조' + (m[2] ? '의' + m[2] : '') : '';
  }
  function looksLikeLaw(name) {
    var n = clean(name);
    if (!/(법률|법|시행령|시행규칙|령|규칙|규정|조례|강령)$/.test(n)) return false;
    if (NOT_LAW.test(squash(n))) return false;
    return n.length >= 3;
  }
  function canonical(name) {
    var n = clean(name);
    return CANON[squash(n)] || n;
  }
  function isLocal(name) { return /(조례|교육규칙)$/.test(name); }

  // 법령명(+시행령)+조문 → 국가법령정보센터 주소
  function lawUrl(name, article, sub) {
    var full = canonical(name) + (sub ? ' ' + sub : '');
    var path = (isLocal(full) ? '/자치법규/' : '/법령/') + encodeURIComponent(full);
    var art = normArticle(article);
    if (art && !isLocal(full)) path += '/' + encodeURIComponent(art);
    return BASE + path;
  }
  function searchUrl(q) {
    return BASE + '/lsSc.do?menuId=1&query=' + encodeURIComponent(clean(q).slice(0, 80));
  }

  function makeItem(name, sub, article, known) {
    var full = canonical(name) + (sub ? ' ' + sub : '');
    var art = normArticle(article);
    return {
      name: full, base: canonical(name), article: art, known: !!known, abbr: CANON[squash(name)] && squash(name) !== squash(canonical(name)) ? clean(name) : '',
      label: full + (art ? ' ' + art : ''), url: lawUrl(name, art, sub), search: searchUrl(full)
    };
  }

  // 드래그한 글자 하나 → 열 주소 (우클릭 메뉴용)
  function resolveSelection(text) {
    var t = clean(text).replace(/^[「『"'“‘(\[]+|[」』"'”’)\].,]+$/g, '').slice(0, 120);
    if (!t) return null;
    // 「법령명」 제N조처럼 따옴표가 가운데 있으면 떼지 않은 글자로 먼저 찾음 (조문까지 살리기)
    var found = findLaws(clean(text).slice(0, 120));
    if (!found.length) found = findLaws(t);
    if (found.length) {
      var f = found[0];
      return { url: f.url, item: f, mode: 'direct' };
    }
    return { url: searchUrl(t), item: null, mode: 'search', query: t };
  }

  // 글 전체에서 법령명이 나온 자리 모두 → [{index, len, item}] (나온 순서)
  function scan(text) {
    var src = String(text || '').slice(0, 300000);
    var hits = [];
    function add(index, len, item) {
      for (var i = 0; i < hits.length; i++) {
        var h = hits[i];
        if (index < h.index + h.len && h.index < index + len) return;   // 이미 찾은 자리와 겹침
      }
      hits.push({ index: index, len: len, item: item });
    }
    var m;
    QUOTE_RE.lastIndex = 0;
    while ((m = QUOTE_RE.exec(src))) {
      var inner = clean(m[1]), sm = /^(.*?)\s*(시행령|시행규칙)$/.exec(inner);
      var base = sm ? sm[1] : inner;
      if (looksLikeLaw(inner) || CANON[squash(base)]) add(m.index, m[0].length, makeItem(base, sm ? sm[2] : '', m[2], !!CANON[squash(base)]));
    }
    KNOWN_RE.lastIndex = 0;
    while ((m = KNOWN_RE.exec(src))) {
      var prev = src.charAt(m.index - 1);
      if (/[가-힣]/.test(prev) && !CANON[squash(m[1])]) continue;
      add(m.index, m[0].length, makeItem(m[1], m[2], m[3], true));
    }
    GENERIC_RE.lastIndex = 0;
    while ((m = GENERIC_RE.exec(src))) {
      // lookbehind(앞 글자 부정 조건) 대신: 앞 글자가 한글·가운뎃점이면 다음 자리부터 다시 찾기 (iOS 16.4 미만 Safari 호환)
      if (m.index > 0 && /[가-힣ㆍ·]/.test(src.charAt(m.index - 1))) { GENERIC_RE.lastIndex = m.index + 1; continue; }
      if (!looksLikeLaw(m[1]) || /^(이|그|저|본|동|각|해당|관련|위|아래|같은)/.test(m[1]) && !CANON[squash(m[1])]) continue;
      if (!/(법률|법|조례)$/.test(m[1]) && !m[2]) continue;   // '…령/규칙/규정'은 「」 안이나 사전에 있을 때만
      add(m.index, m[0].length, makeItem(m[1], m[2], m[3], !!CANON[squash(m[1])]));
    }
    hits.sort(function (a, b) { return a.index - b.index; });
    // "같은 법 시행령 제17조" → 바로 앞에 나온 법령을 가리킴
    var SAME_RE = new RegExp('같은\\s*법' + SUB + ARTICLE, 'g');
    while ((m = SAME_RE.exec(src))) {
      if (!m[1] && !m[2]) continue;
      var before = null;
      for (var i = 0; i < hits.length; i++) if (hits[i].index < m.index && (!before || hits[i].index > before.index)) before = hits[i];
      if (before) add(m.index, m[0].length, makeItem(before.item.base, m[1], m[2], before.item.known));
    }
    hits.sort(function (a, b) { return a.index - b.index; });
    return hits;
  }

  // 글 전체에서 법령명 찾기 → 중복 없는 목록 (먼저 나온 순)
  function findLaws(text) {
    var seen = {}, out = [];
    scan(text).forEach(function (h) {
      var key = h.item.label;
      if (seen[key]) { seen[key].count++; return; }
      h.item.count = 1; h.item.index = h.index; h.item.len = h.len;
      seen[key] = h.item; out.push(h.item);
    });
    return out;
  }

  // 같은 법령(조문 무시)끼리 묶기 — 팝업 목록용
  function groupLaws(items) {
    var map = {}, out = [];
    items.forEach(function (it) {
      var g = map[it.name];
      if (!g) { g = map[it.name] = { name: it.name, url: lawUrl(it.name), search: it.search, known: it.known, abbr: it.abbr, articles: [], count: 0 }; out.push(g); }
      g.count += it.count || 1;
      if (it.abbr && !g.abbr) g.abbr = it.abbr;
      if (it.article && !g.articles.some(function (a) { return a.article === it.article; })) g.articles.push({ article: it.article, url: it.url });
    });
    return out;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  return { ABBR: ABBR, KNOWN: KNOWN, scan: scan, findLaws: findLaws, groupLaws: groupLaws, resolveSelection: resolveSelection, lawUrl: lawUrl, searchUrl: searchUrl, canonical: canonical, esc: esc, MENU_TITLE: '법령 콕: 국가법령정보센터에서 찾기' };
})();
if (typeof module !== 'undefined') module.exports = LawLink;
