// 23 투명 판서판: 펜으로 그리면 획이 생기고, 되돌리기·지우개·도형·단축키·켜기/끄기가 동작한다
const bp = window.__boardPen;
assert(bp, '__boardPen 이 있어야 함');
const host = $('#board-pen-host'), root = host.shadowRoot;
const ink = root.querySelector('.ink');
const S = bp.state;
assert(S.on && host.style.display === 'block', '처음에 판서가 켜져 있어야 함');
const seeded = S.strokes.length;
assert(seeded >= 3, '예시 필기가 3개 이상 그려져 있어야 함: ' + seeded);
assert(S.history.length === 0, '예시 필기는 되돌리기 기록에 없어야 함');
const pe = (t, x, y) => ink.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, button: 0, pointerId: 1, pointerType: 'pen', bubbles: true, cancelable: true }));
const drag = (pts) => { pe('pointerdown', ...pts[0]); for (const p of pts.slice(1)) pe('pointermove', ...p); pe('pointerup', ...pts[pts.length - 1]); };
const btn = sel => root.querySelector(sel);
// 1) 파랑 + 굵게 펜으로 긋기 → 획 1개 추가, 색·굵기 반영
btn('[data-tool=pen]').click(); btn('[data-color="#1e66f5"]').click(); btn('[data-size="2"]').click();
drag([[100, 600], [140, 600], [180, 600], [220, 600]]);
assert(S.strokes.length === seeded + 1, '펜 획 1개 추가: ' + S.strokes.length);
const st = S.strokes[S.strokes.length - 1];
assert(st.type === 'pen' && st.color === '#1e66f5' && st.w === 10, '펜 획 속성(파랑·10): ' + JSON.stringify({ t: st.type, c: st.color, w: st.w }));
assert(st.pts[0][0] === 100 + scrollX && st.pts[0][1] === 600 + scrollY, '획은 문서 좌표로 저장');
// 2) 되돌리기 버튼 → 원래 개수
btn('[data-act=undo]').click();
assert(S.strokes.length === seeded, '되돌리기 후 획 수 복귀');
// 3) 네모: 너무 작으면 저장 안 함, 충분히 크면 저장
btn('[data-tool=rect]').click();
drag([[300, 300], [302, 302]]);
assert(S.strokes.length === seeded, '6px 미만 네모는 저장하지 않음');
drag([[300, 300], [400, 380]]);
const rc = S.strokes[S.strokes.length - 1];
assert(S.strokes.length === seeded + 1 && rc.type === 'rect' && rc.box[2] - rc.box[0] === 100 && rc.box[3] - rc.box[1] === 80, '네모 저장(100×80)');
// 4) 지우개로 네모 변을 문지르면 그 획만 지워지고, 되돌리면 돌아온다
btn('[data-tool=erase]').click();
drag([[350, 300], [351, 301]]);
assert(S.strokes.length === seeded && !S.strokes.includes(rc), '지우개로 네모 삭제: ' + S.strokes.length);
bp.undo();
assert(S.strokes.includes(rc), '지운 획 되돌리기');
// 지우개로 빈 곳을 문지르면 기록이 늘지 않음
const h0 = S.history.length; drag([[5, 5], [6, 6]]);
assert(S.history.length === h0, '빈 곳 지우기는 기록을 남기지 않음');
// 5) 전체 지우기 → 0, 되돌리기 → 복구
btn('[data-act=clear]').click();
assert(S.strokes.length === 0, '전체 지우기');
bp.undo();
assert(S.strokes.length === seeded + 1, '전체 지우기 되돌리기');
// 6) 단축키: H → 형광펜, ] → 굵기 증가 제한, Esc → 통과, 다시 Esc → 끄기
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }));
assert(S.tool === 'hl' && ink.className.includes('hl'), 'H 키로 형광펜');
btn('[data-size="1"]').click();
window.dispatchEvent(new KeyboardEvent('keydown', { key: ']' })); window.dispatchEvent(new KeyboardEvent('keydown', { key: ']' }));
assert(S.sizeIdx === 2, '] 키 굵기는 최대 2: ' + S.sizeIdx);
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
assert(S.tool === 'pass' && getComputedStyle(ink).pointerEvents === 'none', 'Esc → 통과 모드(클릭 통과)');
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
assert(!S.on && host.style.display === 'none', '통과 모드에서 Esc → 판서 끄기');
// 꺼진 동안 단축키 무시, 페이지 버튼으로 다시 켜기
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
assert(S.tool === 'pass', '꺼진 상태에서는 단축키 무시');
$('#toggle').click();
assert(S.on && host.style.display === 'block' && S.strokes.length === seeded + 1, '다시 켜면 필기가 그대로');
return 'ok 9';
