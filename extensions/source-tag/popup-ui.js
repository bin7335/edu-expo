// ==ui:start== 출처 꼬리표 팝업 화면 (확장 팝업과 체험 페이지가 같은 코드, 저장소만 adapter로 바꿔 끼움)
// adapter: getState() → {enabled, format, history}, set(patch), getPageMeta() → meta|null, copyText(text) → bool
const SourceTagPopup = (() => {
  function mount(root, adapter){
    const T = SourceTag;
    let st = { enabled: true, format: 'easy', fullUrl: false, history: [] };
    let pageMeta = null, clearArmed = 0;
    root.classList.add('st');
    root.innerHTML = `
      <div class="st-head"><span class="st-logo">🏷️</span><div><b>출처 꼬리표</b><small>복사하면 출처가 따라와요</small></div></div>
      <label class="st-switch"><input type="checkbox" data-r="enabled"><span class="st-knob" aria-hidden="true"></span><span class="st-sw-text">복사할 때 출처 붙이기 <b data-r="onoff"></b></span></label>
      <div class="st-row"><span class="st-lab">형식</span><div class="st-seg" data-r="seg">
        ${Object.entries(T.FORMATS).map(([k, f]) => `<button type="button" data-f="${k}">${f.label}</button>`).join('')}
      </div></div>
      <label class="st-opt"><input type="checkbox" data-r="fullUrl"> 주소의 ?·# 뒷부분까지 넣기 <small>(기본: 떼고 넣어요)</small></label>
      <div class="st-card">
        <div class="st-card-h">📄 지금 이 페이지</div>
        <p class="st-cite" data-r="pageCite">읽는 중…</p>
        <button type="button" class="st-btn st-primary" data-r="copyPage">📋 이 페이지 출처 복사</button>
      </div>
      <div class="st-hist">
        <div class="st-hist-h"><b>🗂 출처 목록</b> <span data-r="count"></span>
          <span class="st-sp"></span>
          <button type="button" class="st-btn st-sm" data-r="copyAll">모두 복사</button>
          <button type="button" class="st-btn st-sm st-danger" data-r="clear">지우기</button>
        </div>
        <ol data-r="list"></ol>
      </div>
      <div class="st-msg" data-r="msg" aria-live="polite"></div>`;
    const $ = k => root.querySelector(`[data-r="${k}"]`);
    let msgT;
    const say = m => { $('msg').textContent = m; clearTimeout(msgT); msgT = setTimeout(() => { $('msg').textContent = ''; }, 2200); };

    function render(){
      $('enabled').checked = !!st.enabled;
      $('fullUrl').checked = !!st.fullUrl;
      $('onoff').textContent = st.enabled ? '켜짐' : '꺼짐';
      root.classList.toggle('st-off', !st.enabled);
      [...$('seg').children].forEach(b => b.classList.toggle('on', b.dataset.f === st.format));
      $('pageCite').textContent = pageMeta ? T.buildCitation(pageMeta, st.format, new Date()) : '이 페이지에서는 출처를 읽을 수 없어요 (크롬 설정 화면 등)';
      $('copyPage').disabled = !pageMeta;
      $('count').textContent = `${st.history.length}/${T.MAX_HISTORY}`;
      $('copyAll').disabled = $('clear').disabled = !st.history.length;
      $('list').innerHTML = st.history.length
        ? st.history.map((x, i) => `<li><span>${T.esc(T.buildCitation(x, st.format, x.checked))}</span><button type="button" class="st-x" data-del="${i}" title="목록에서 빼기" aria-label="목록에서 빼기">×</button></li>`).join('')
        : '<li class="st-empty">아직 없어요. 웹페이지 글을 복사하면 여기에 쌓여요.</li>';
    }
    async function save(patch){ Object.assign(st, patch); render(); await adapter.set(patch); }

    $('enabled').addEventListener('change', e => save({ enabled: e.target.checked }));
    $('fullUrl').addEventListener('change', async e => { await save({ fullUrl: e.target.checked }); try { pageMeta = await adapter.getPageMeta(); } catch (_) { pageMeta = null; } render(); });
    $('seg').addEventListener('click', e => { const b = e.target.closest('button[data-f]'); if (b) save({ format: b.dataset.f }); });
    $('copyPage').addEventListener('click', async () => {
      if (!pageMeta) return;
      const now = new Date();
      const ok = await adapter.copyText(T.buildCitation(pageMeta, st.format, now));
      await save({ history: T.addHistory(st.history, T.makeEntry(pageMeta, now)) });
      say(ok ? '✅ 출처를 복사했어요. 붙여넣기(Ctrl+V) 해 보세요!' : '복사에 실패했어요. 다시 눌러 주세요.');
    });
    $('copyAll').addEventListener('click', async () => {
      const ok = await adapter.copyText(T.historyText(st.history, st.format));
      say(ok ? `✅ 출처 ${st.history.length}개를 번호 목록으로 복사했어요` : '복사에 실패했어요.');
    });
    $('clear').addEventListener('click', async () => {
      if (Date.now() - clearArmed > 3000){ clearArmed = Date.now(); $('clear').textContent = '정말 지울까요?'; setTimeout(() => { $('clear').textContent = '지우기'; }, 3000); return; }
      clearArmed = 0; $('clear').textContent = '지우기';
      await save({ history: [] }); say('출처 목록을 비웠어요');
    });
    $('list').addEventListener('click', e => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      const h = st.history.slice(); h.splice(+b.dataset.del, 1); save({ history: h });
    });

    async function refresh(){
      st = Object.assign(st, await adapter.getState());
      try { pageMeta = await adapter.getPageMeta(); } catch (_) { pageMeta = null; }
      render();
    }
    const ready = refresh();
    return { refresh, ready };
  }
  return { mount };
})();
// ==ui:end==
