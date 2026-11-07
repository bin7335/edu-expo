// 법령 콕 팝업 화면 (확장 팝업과 체험 페이지가 같은 코드)
// opts.getPage(): Promise<{title, text} | null>  — 지금 페이지의 글
// opts.open(url): 새 탭으로 열기
/* eslint-disable no-var */
var LawLinkPopup = (function () {
  var L = LawLink, esc = L.esc;
  function mount(root, opts) {
    root.classList.add('ll');
    root.innerHTML =
      '<div class="ll-head"><div class="ll-logo">⚖️</div><div><b>법령 콕</b><small>법령 이름을 콕 집어 국가법령정보센터로</small></div></div>' +
      '<form class="ll-search"><input type="search" placeholder="법령명·약칭 (예: 교원지위법 제15조)" aria-label="법령 찾기"><button type="submit" class="ll-btn ll-primary">찾기</button></form>' +
      '<div class="ll-sec-h"><span class="ll-title">📄 이 페이지의 법령</span><span class="ll-cnt"></span><span class="ll-sp"></span><button type="button" class="ll-btn ll-sm ll-re">다시 찾기</button></div>' +
      '<div class="ll-list" aria-live="polite"></div>' +
      '<div class="ll-tip">💡 웹페이지에서 법령명을 <b>드래그</b> → <b>우클릭</b> → <b>「' + esc(L.MENU_TITLE) + '」</b></div>' +
      '<div class="ll-msg"></div>';
    var q = function (s) { return root.querySelector(s); };
    var msg = function (t) { q('.ll-msg').textContent = t || ''; };

    q('.ll-search').addEventListener('submit', function (e) {
      e.preventDefault();
      var r = L.resolveSelection(q('.ll-search input').value);
      if (!r) { msg('찾을 법령 이름을 적어 주세요.'); return; }
      opts.open(r.url);
      msg(r.mode === 'direct' ? '📘 ' + r.item.label + ' 을(를) 열었어요.' : '🔍 "' + r.query + '" 검색 결과를 열었어요.');
    });
    root.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-url]');
      if (a) { e.preventDefault(); opts.open(a.dataset.url); }
    });
    q('.ll-re').addEventListener('click', function () { refresh(); });

    function render(page) {
      var list = q('.ll-list');
      if (!page) { list.innerHTML = '<div class="ll-empty">이 화면(크롬 설정·웹 스토어 등)에서는 글을 읽을 수 없어요.<br>위 검색칸을 써 주세요.</div>'; q('.ll-cnt').textContent = ''; return; }
      var groups = L.groupLaws(L.findLaws(page.text));
      q('.ll-cnt').textContent = groups.length ? groups.length + '개' : '';
      if (!groups.length) { list.innerHTML = '<div class="ll-empty">이 페이지에서 법령 이름을 찾지 못했어요 🙂</div>'; return; }
      list.innerHTML = groups.map(function (g) {
        return '<div class="ll-item"><div class="ll-row"><a class="ll-name" href="' + esc(g.url) + '" data-url="' + esc(g.url) + '" target="_blank" rel="noopener">' + esc(g.name) + '</a>' +
          (g.count > 1 ? '<span class="ll-n">×' + g.count + '</span>' : '') + '</div>' +
          '<div class="ll-meta">' + (g.abbr ? '<span class="ll-abbr">약칭 ' + esc(g.abbr) + '</span>' : '') +
          g.articles.map(function (a) { return '<a class="ll-art" href="' + esc(a.url) + '" data-url="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(a.article) + '</a>'; }).join('') +
          '<a class="ll-s" href="' + esc(g.search) + '" data-url="' + esc(g.search) + '" target="_blank" rel="noopener">🔍 검색</a></div></div>';
      }).join('');
    }
    function refresh() {
      q('.ll-list').innerHTML = '<div class="ll-empty">페이지 글을 살펴보는 중…</div>';
      return Promise.resolve(opts.getPage()).then(render, function () { render(null); });
    }
    refresh();
    return { refresh: refresh };
  }
  return { mount: mount };
})();
