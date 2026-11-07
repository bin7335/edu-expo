// ==ui:start== 수업 가방 화면 (확장 팝업·편집 페이지·체험 페이지가 같은 코드, 저장·탭 다루기만 adapter로 바꿔 끼움)
// adapter: mode('popup'|'full'), load() → sets, save(sets), getTabs() → [{title,url,highlighted}],
//          open(set) → {blocked}, openFull() (popup 모드에서 큰 편집 화면 열기)
const LessonBagUI = (() => {
  function mount(root, adapter){
    const B = BagCore, esc = B.esc;
    let sets = [], tabs = [], picked = new Set();
    let view = { id: null, kind: null };     // 펼친 카드: 편집(edit) / QR(qr)
    const qrChoice = {};                      // 세트별 QR 선택
    let delArmed = { id: null, at: 0 };
    root.classList.add('lb');
    if (adapter.mode === 'full') root.classList.add('lb-full');

    root.innerHTML = `
      <div class="lb-head"><span class="lb-logo">🎒</span><div><b>수업 가방</b><small>지금 열린 탭들을 수업 세트로 담아 두고, 한 번에 다시 열어요</small></div></div>
      <section class="lb-save">
        <input class="lb-in" data-r="name" maxlength="60" placeholder="세트 이름 (예: 3교시 과학 - 물의 순환)">
        <details data-r="box"><summary data-r="sum"></summary><div class="lb-tabs" data-r="tabs"></div>
          <div class="lb-mini"><button type="button" class="lb-btn lb-sm" data-r="all">모두 고르기</button><button type="button" class="lb-btn lb-sm" data-r="none">모두 빼기</button></div>
        </details>
        <button type="button" class="lb-btn lb-primary" data-r="saveBtn">🎒 가방에 담기</button>
      </section>
      <div class="lb-sets-h" data-r="setsH"></div>
      <div class="lb-sets" data-r="sets"></div>
      <div class="lb-foot" data-r="foot">${adapter.mode === 'full'
        ? `<button type="button" class="lb-btn lb-sm" data-r="exp">⬇ JSON 내보내기</button><button type="button" class="lb-btn lb-sm" data-r="imp">⬆ JSON 가져오기</button><input type="file" accept=".json,application/json" data-r="file" hidden>`
        : `<button type="button" class="lb-btn lb-sm" data-r="full">⚙ 크게 편집 · JSON 백업</button>`}</div>
      <div class="lb-msg" data-r="msg" aria-live="polite"></div>`;
    const $ = k => root.querySelector(`[data-r="${k}"]`);
    let msgT;
    const say = m => { $('msg').textContent = m; clearTimeout(msgT); msgT = setTimeout(() => { $('msg').textContent = ''; }, 3500); };
    const persist = () => adapter.save(sets);
    const find = id => sets.find(s => s.id === id);

    function renderTabs(){
      $('sum').innerHTML = `지금 창의 탭 <b>${tabs.length}개 중 ${picked.size}개</b> 담기 <span>(눌러서 고르기)</span>`;
      $('tabs').innerHTML = tabs.length ? tabs.map((t, i) =>
        `<label><input type="checkbox" data-tab="${i}" ${picked.has(i) ? 'checked' : ''}><span>${esc(t.title || t.url)}<small>${esc(B.hostOf(t.url))}</small></span></label>`).join('')
        : '<p class="lb-empty">담을 수 있는 웹페이지 탭이 없어요</p>';
    }

    function cardHtml(s){
      const open = view.id === s.id ? view.kind : null;
      const armed = delArmed.id === s.id && Date.now() - delArmed.at < 3000;
      let body = '';
      if (open === 'edit'){
        body = `<div class="lb-edit">
          <input class="lb-in" data-f="rename" maxlength="60" value="${esc(s.name)}" aria-label="세트 이름">
          <ol>${s.links.map((l, i) => `<li><span class="lb-lt">${esc(l.title)}<small>${esc(B.displayUrl(l.url))}</small></span>
            <button type="button" class="lb-ic" data-act="up" data-i="${i}" ${i ? '' : 'disabled'} aria-label="위로">▲</button>
            <button type="button" class="lb-ic" data-act="down" data-i="${i}" ${i < s.links.length - 1 ? '' : 'disabled'} aria-label="아래로">▼</button>
            <button type="button" class="lb-ic lb-rm" data-act="rm" data-i="${i}" aria-label="링크 지우기">×</button></li>`).join('')}</ol>
          <div class="lb-add"><input class="lb-in" data-f="addUrl" placeholder="링크 주소 붙여넣기 (https://…)"><button type="button" class="lb-btn lb-sm" data-act="add">+ 추가</button></div>
          <button type="button" class="lb-btn lb-sm" data-act="close">완료</button></div>`;
      } else if (open === 'qr'){
        const ch = qrChoice[s.id] ?? '0';
        const text = B.qrText(s, ch), svg = text ? B.qrSvg(text) : '';
        body = `<div class="lb-qr">
          <select class="lb-in" data-f="qrSel" aria-label="QR에 담을 내용">
            ${s.links.map((l, i) => `<option value="${i}" ${String(i) === String(ch) ? 'selected' : ''}>🔗 ${i + 1}. ${esc(l.title.slice(0, 40))}</option>`).join('')}
            <option value="list" ${ch === 'list' ? 'selected' : ''}>📝 목록 전체 (글자로)</option>
          </select>
          ${svg ? `<div class="lb-qrimg">${svg}</div>` : '<p class="lb-warn">링크가 많아 QR 하나에 다 안 들어가요. 링크 하나를 골라 주세요.</p>'}
          <p class="lb-cap">${ch === 'list'
            ? '카메라로 찍으면 세트 이름과 링크 목록이 <b>글자</b>로 보여요. 주소를 눌러 하나씩 열어요.'
            : '휴대폰·태블릿 카메라로 찍으면 <b>이 링크가 바로 열려요</b>. 수업 시작 링크로 가장 편해요.'}</p></div>`;
      }
      return `<article class="lb-card${open ? ' lb-open' : ''}" data-id="${s.id}">
        <div class="lb-top"><div class="lb-tt"><b>${esc(s.name)}</b><small>링크 ${s.links.length}개 · ${B.fmtDate(s.createdAt)}</small></div>
          <button type="button" class="lb-btn lb-go" data-act="open">▶ 열기</button></div>
        <div class="lb-acts">
          <button type="button" class="lb-btn lb-sm${open === 'edit' ? ' on' : ''}" data-act="edit">✏️ 편집</button>
          <button type="button" class="lb-btn lb-sm${open === 'qr' ? ' on' : ''}" data-act="qr">▦ QR</button>
          <button type="button" class="lb-btn lb-sm lb-danger" data-act="del">${armed ? '정말 지울까요?' : '🗑 삭제'}</button>
        </div>${body}</article>`;
    }
    function renderSets(){
      $('setsH').innerHTML = `📚 내 수업 세트 <span>${sets.length}개</span>`;
      $('sets').innerHTML = sets.length ? sets.map(cardHtml).join('')
        : '<p class="lb-empty">아직 세트가 없어요. 위에서 이름을 적고 [가방에 담기]를 눌러 보세요.</p>';
    }
    const render = () => { renderTabs(); renderSets(); };

    $('tabs').addEventListener('change', e => {
      const i = e.target.dataset.tab; if (i == null) return;
      e.target.checked ? picked.add(+i) : picked.delete(+i);
      renderTabs();
    });
    $('all').addEventListener('click', () => { picked = new Set(tabs.map((_, i) => i)); renderTabs(); });
    $('none').addEventListener('click', () => { picked = new Set(); renderTabs(); });
    $('saveBtn').addEventListener('click', async () => {
      const chosen = tabs.filter((_, i) => picked.has(i));
      if (!chosen.length) return say('담을 탭을 하나 이상 골라 주세요');
      const s = B.makeSet($('name').value, chosen);
      sets.unshift(s); $('name').value = '';
      await persist(); renderSets();
      say(`✅ '${s.name}' 세트에 링크 ${s.links.length}개를 담았어요`);
    });
    $('name').addEventListener('keydown', e => { if (e.key === 'Enter') $('saveBtn').click(); });

    $('sets').addEventListener('click', async e => {
      const btn = e.target.closest('button[data-act]'); if (!btn) return;
      const card = btn.closest('.lb-card'), s = find(card.dataset.id); if (!s) return;
      const act = btn.dataset.act, i = +btn.dataset.i;
      if (act === 'open'){
        const r = (await adapter.open(s)) || {};
        say(r.blocked ? `⚠ 브라우저가 새 탭 ${r.blocked}개를 막았어요. 주소창 오른쪽 팝업 아이콘에서 '항상 허용'을 눌러 주세요.` : `▶ '${s.name}' 링크 ${s.links.length}개를 열었어요`);
        return;
      }
      if (act === 'edit' || act === 'qr'){ view = view.id === s.id && view.kind === act ? { id: null } : { id: s.id, kind: act }; return renderSets(); }
      if (act === 'close'){ view = { id: null }; return renderSets(); }
      if (act === 'del'){
        if (delArmed.id !== s.id || Date.now() - delArmed.at > 3000){ delArmed = { id: s.id, at: Date.now() }; renderSets(); setTimeout(renderSets, 3100); return; }
        sets = sets.filter(x => x !== s); delArmed = { id: null }; await persist(); renderSets();
        return say(`🗑 '${s.name}' 세트를 지웠어요`);
      }
      if (act === 'up' || act === 'down') s.links = B.move(s.links, i, act === 'up' ? -1 : 1);
      if (act === 'rm'){
        if (s.links.length === 1) return say('링크가 하나뿐이에요. 세트를 지우려면 [삭제]를 눌러 주세요');
        s.links = s.links.filter((_, k) => k !== i);
      }
      if (act === 'add'){
        const inp = card.querySelector('[data-f="addUrl"]');
        const links = B.makeLinks([{ url: inp.value }]);
        if (!links.length) return say('http:// 또는 https:// 로 시작하는 웹 주소를 넣어 주세요');
        s.links.push(links[0]);
      }
      await persist(); renderSets();
    });
    $('sets').addEventListener('input', e => {
      if (e.target.dataset.f !== 'rename') return;
      const card = e.target.closest('.lb-card'), s = find(card.dataset.id); if (!s) return;
      s.name = e.target.value.trim() || B.defaultName(new Date(s.createdAt));
      card.querySelector('.lb-tt b').textContent = s.name;
      persist();
    });
    $('sets').addEventListener('change', e => {
      if (e.target.dataset.f !== 'qrSel') return;
      qrChoice[e.target.closest('.lb-card').dataset.id] = e.target.value; renderSets();
    });
    $('sets').addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.dataset.f === 'addUrl') e.target.closest('.lb-add').querySelector('button').click();
    });

    if (adapter.mode === 'full'){
      $('exp').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([B.exportJson(sets)], { type: 'application/json' }));
        a.download = `수업가방-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        say(`⬇ 세트 ${sets.length}개를 JSON 파일로 저장했어요`);
      });
      $('imp').addEventListener('click', () => $('file').click());
      $('file').addEventListener('change', async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        try { await importText(await f.text()); } catch (err) { say('⚠ ' + (err.message || '읽을 수 없는 파일이에요')); }
      });
    } else {
      $('full').addEventListener('click', () => adapter.openFull());
    }
    async function importText(text){
      let r;
      try { r = B.parseImport(text); } catch (err) { throw new Error(err instanceof SyntaxError ? 'JSON 형식이 아니에요' : err.message); }
      sets = r.sets.concat(sets); await persist(); renderSets();
      say(`⬆ 세트 ${r.sets.length}개를 가져왔어요${r.skipped ? ` (이상한 링크 ${r.skipped}개는 건너뜀)` : ''}`);
      return r;
    }

    async function refresh(){
      sets = (await adapter.load()) || [];
      tabs = ((await adapter.getTabs()) || []).filter(t => B.normalizeUrl(t.url) && /^https?:/i.test(t.url));
      const hi = tabs.map((t, i) => t.highlighted ? i : -1).filter(i => i >= 0);
      picked = new Set(hi.length > 1 ? hi : tabs.map((_, i) => i));   // 탭을 여러 개 골라 두었으면 그것만
      render();
    }
    const ready = refresh();
    return { ready, refresh, importText, get sets(){ return sets; }, showQr(id){ view = { id, kind: 'qr' }; renderSets(); } };
  }
  return { mount };
})();
// ==ui:end==
