// ==ui:start== 딸깍 QR 화면 (확장 팝업·크게 보기 페이지와 체험 페이지가 같은 코드, 탭 읽기·열기만 adapter로 바꿔 끼움)
// 페이지 제목·주소는 모두 textContent로만 넣습니다 (innerHTML에 넣지 않음).
const PageQRPopup = (() => {
  const TEMPLATE = `
    <div class="pq-head"><span class="pq-logo" aria-hidden="true"></span><div><b>딸깍 QR</b><small>지금 보는 페이지를 학생 폰으로</small></div></div>
    <div class="pq-page">
      <div class="pq-title" data-r="title"></div>
      <div class="pq-url" data-r="url"></div>
    </div>
    <div class="pq-box" data-r="box">
      <canvas class="pq-canvas" data-r="canvas" role="img" aria-label="이 페이지 주소 QR 코드"></canvas>
      <div class="pq-empty" data-r="empty" hidden></div>
    </div>
    <div class="pq-meta" data-r="meta"></div>
    <div class="pq-secret" data-r="secret" role="alert" hidden></div>
    <button type="button" class="pq-btn pq-primary" data-r="big">🖥️ 전체 화면으로 크게 보기</button>
    <div class="pq-row">
      <button type="button" class="pq-btn" data-r="png">⬇ PNG 저장</button>
      <button type="button" class="pq-btn" data-r="copy">📋 주소 복사</button>
    </div>
    <label class="pq-check" data-r="stripRow" hidden><input type="checkbox" data-r="strip" checked>
      <span>추적 꼬리표 지우기 <small data-r="stripKeys"></small></span></label>
    <div class="pq-edit">
      <label for="pq-input">주소 고치기 <small>(고치면 QR이 바로 바뀌어요)</small></label>
      <div class="pq-edit-row">
        <input id="pq-input" type="url" data-r="input" spellcheck="false" autocomplete="off" placeholder="https://… 주소를 넣어 보세요">
        <button type="button" class="pq-btn pq-sm" data-r="reset" title="이 탭 주소로 되돌리기" hidden>↺</button>
      </div>
    </div>
    <div class="pq-msg" data-r="msg" aria-live="polite"></div>`;

  function mount(root, adapter){
    const P = PageQR, doc = root.ownerDocument;
    root.classList.add('pq');
    root.innerHTML = TEMPLATE;   // 고정 틀만 넣고, 바뀌는 값은 아래에서 textContent로
    const $ = k => root.querySelector(`[data-r="${k}"]`);
    let tab = null, notice = '', current = null, msgT;
    const say = m => { $('msg').textContent = m; clearTimeout(msgT); msgT = setTimeout(() => { $('msg').textContent = ''; }, 2400); };

    // 지금 QR로 만들 주소 계산 (입력칸 값 → http/https 확인 → 추적 꼬리표 지우기)
    function compute(){
      const raw = $('input').value;
      const u = P.parseWeb(raw);
      if (!u) return null;
      const c = P.clean(u.href);
      const strip = $('strip').checked;
      const url = strip && c.removed.length ? c.url : u.href;
      const same = tab && P.parseWeb(tab.url) && P.parseWeb(tab.url).hostname === u.hostname;
      return { url, removed: c.removed, same: !!same, title: same ? (tab.title || '') : '' };
    }

    function render(){
      current = compute();
      const edited = !!tab && P.isWeb(tab.url) && $('input').value.trim() !== tab.url;
      $('reset').hidden = !edited;
      $('stripRow').hidden = !(current && current.removed.length);
      if (current && current.removed.length){
        const r = current.removed;
        $('stripKeys').textContent = `(${r[0]}${r.length > 1 ? ` 외 ${r.length - 1}개` : ''})`;
        $('stripRow').title = '지우는 꼬리표: ' + r.join(', ');
      }

      if (!current){
        $('secret').hidden = true;
        const empty = $('empty');
        empty.hidden = false; $('canvas').hidden = true;
        empty.textContent = $('input').value.trim()
          ? '웹 주소(http:// 또는 https://)를 넣으면 QR이 생겨요.'
          : (notice || '아래 칸에 주소를 넣으면 QR이 생겨요.');
        $('title').textContent = tab && tab.title ? tab.title : '이 페이지';
        $('url').textContent = tab && tab.url && !$('input').value.trim() ? tab.url : '';
        $('meta').textContent = '';
        ['big', 'png', 'copy'].forEach(k => { $(k).disabled = true; });
        root.classList.add('pq-off');
        return;
      }
      root.classList.remove('pq-off');
      ['big', 'png', 'copy'].forEach(k => { $(k).disabled = false; });
      $('title').textContent = current.title || (current.same ? '제목 없는 페이지' : '직접 넣은 주소');
      $('url').textContent = P.pretty(current.url);
      const sec = P.secrets(current.url);
      $('secret').hidden = !sec.length;
      $('secret').textContent = sec.length ? `⚠️ 주소에 로그인 정보가 있을 수 있어요 (${sec.slice(0, 3).join(', ')}${sec.length > 3 ? ' …' : ''}). 학생과 나누기 전에 확인하세요.` : '';
      $('empty').hidden = true; $('canvas').hidden = false;
      try {
        const q = P.draw($('canvas'), current.url, 520);
        const long = current.url.length > P.LONG;
        $('meta').textContent = `${current.url.length}자 · ${q.size}×${q.size}칸` +
          (long ? ' · 주소가 길어 촘촘해요. 꼬리표를 지우거나 짧은 주소를 써 보세요.' : (q.size <= 33 ? ' · 멀리서도 잘 찍혀요' : ''));
        $('meta').classList.toggle('pq-warn', long);
      } catch (_) {
        $('canvas').hidden = true; $('empty').hidden = false;
        $('empty').textContent = '주소가 너무 길어 QR로 만들 수 없어요.';
        ['big', 'png', 'copy'].forEach(k => { $(k).disabled = true; });
      }
    }

    $('input').addEventListener('input', render);
    $('strip').addEventListener('change', render);
    $('reset').addEventListener('click', () => { $('input').value = tab ? tab.url : ''; render(); $('input').focus(); });
    $('big').addEventListener('click', () => { if (current) adapter.openBig(current.url, current.title); });
    $('copy').addEventListener('click', async () => {
      if (!current) return;
      const ok = await adapter.copyText(current.url);
      say(ok ? '✅ 주소를 복사했어요' : '복사에 실패했어요. 다시 눌러 주세요.');
    });
    $('png').addEventListener('click', () => {
      if (!current) return;
      const data = P.pngDataUrl(doc, current.url, current.title);
      (adapter.savePng || savePng)(data, P.fileName(current.title, current.url));
      say('✅ QR 그림(PNG)을 저장했어요');
    });
    function savePng(data, name){
      const a = doc.createElement('a'); a.href = data; a.download = name;
      doc.body.appendChild(a); a.click(); a.remove();
    }

    async function refresh(){
      try { tab = await adapter.getTab(); } catch (_) { tab = null; }
      notice = tab ? P.why(tab.url) : '이 탭의 주소를 읽을 수 없어요.';
      $('input').value = tab && !notice ? tab.url : '';
      $('strip').checked = true;
      render();
    }
    const ready = refresh();
    return { refresh, ready, current: () => current };
  }
  return { mount };
})();

// 전체 화면 QR (교실 TV용): 제목 + 화면 가득 QR + 짧은 주소
const PageQRBig = (() => {
  function mount(root, data, adapter = {}){
    const P = PageQR, doc = root.ownerDocument, win = doc.defaultView;
    root.classList.add('pq-big');
    root.innerHTML = `
      <div class="pq-big-bar">
        <button type="button" class="pq-btn pq-sm" data-r="png">⬇ PNG 저장</button>
        <button type="button" class="pq-btn pq-sm" data-r="close" hidden>✕ 닫기</button>
      </div>
      <h1 class="pq-big-title" data-r="title"></h1>
      <canvas class="pq-big-canvas" data-r="canvas" role="img" aria-label="QR 코드"></canvas>
      <div class="pq-big-url" data-r="url"></div>
      <div class="pq-big-tip">📱 휴대폰 카메라를 QR에 비추면 이 페이지가 열려요</div>`;
    const $ = k => root.querySelector(`[data-r="${k}"]`);
    if (!data){
      $('title').textContent = '보여 줄 주소가 없어요';
      $('url').textContent = 'http:// 또는 https:// 로 시작하는 웹 주소만 크게 보여 줄 수 있어요.';
      $('canvas').hidden = true; $('png').hidden = true;
      return { layout(){}, destroy(){} };
    }
    $('title').textContent = data.title || P.shortUrl(data.url, 40);
    $('url').textContent = P.shortUrl(data.url, 60);
    if (adapter.close){ $('close').hidden = false; $('close').addEventListener('click', adapter.close); }
    $('png').addEventListener('click', () => {
      const a = doc.createElement('a');
      a.href = P.pngDataUrl(doc, data.url, data.title); a.download = P.fileName(data.title, data.url);
      doc.body.appendChild(a); a.click(); a.remove();
    });
    function layout(){
      const W = root.clientWidth, H = root.clientHeight;
      const used = $('title').offsetHeight + $('url').offsetHeight + root.querySelector('.pq-big-tip').offsetHeight + 56;
      const side = Math.max(140, Math.floor(Math.min(W * 0.92, H - used)));
      const dpr = win.devicePixelRatio || 1;
      P.draw($('canvas'), data.url, side * dpr, 3);
      $('canvas').style.width = $('canvas').style.height = side + 'px';
    }
    layout();
    win.addEventListener('resize', layout);
    return { layout, destroy(){ win.removeEventListener('resize', layout); } };
  }
  return { mount };
})();
// ==ui:end==
