// 51 딸깍 QR(체험): 추적 꼬리표 제거·QR 칸 수 변화, javascript:/data: 차단, 주소 보정, 특수 페이지 안내, 크게 보기
const R = k => $(`#popup [data-r="${k}"]`);
const size = () => +(R('meta').textContent.match(/(\d+)×\d+칸/) || [])[1];
const setInput = async v => { R('input').value = v; fire(R('input'), 'input'); await wait(50); };
await wait(200);
// 1) 첫 탭: utm_·fbclid 꼬리표가 지워진 주소로 QR
assert(!$('#popwrap').hidden, '팝업 열림');
assert(R('url').textContent === 'https://example.org/class/4-2/notice', '꼬리표 지운 주소: ' + R('url').textContent);
assert(!R('stripRow').hidden && R('stripKeys').textContent === '(utm_source 외 3개)', '지운 꼬리표 안내: ' + R('stripKeys').textContent);
const cleanSize = size();
assert(cleanSize > 0 && !R('canvas').hidden, 'QR 그려짐: ' + R('meta').textContent);
// 2) 꼬리표 지우기 끄면 원래 주소 → QR 칸이 더 많아짐
R('strip').click(); await wait(50);
assert(R('url').textContent.includes('utm_source=newsletter') && R('url').textContent.includes('fbclid='), '끄면 원래 주소');
assert(size() > cleanSize, `칸 수 증가 ${cleanSize} → ${size()}`);
R('strip').click(); await wait(50);
// 3) 꼬리표 제거 규칙: 다른 값·#해시는 남김, 유튜브 si 제거
const c = PageQR.clean('https://ex.com/p?id=7&utm_source=x&gclid=abc#sec');
assert(c.url === 'https://ex.com/p?id=7#sec' && c.removed.join() === 'utm_source,gclid', 'clean: ' + JSON.stringify(c));
assert(PageQR.clean('https://youtu.be/abc?si=XYZ&t=30').url === 'https://youtu.be/abc?t=30', '유튜브 si 제거');
assert(PageQR.clean('https://ex.com/?si=keep').url === 'https://ex.com/?si=keep', '유튜브 아니면 si 유지');
// 4) javascript:·data: 주소는 QR 안 만듦
for (const bad of ['javascript:alert(1)', 'JavaScript:alert(document.cookie)', 'data:text/html,<script>alert(1)</script>', 'ftp://ex.com/a']) {
  await setInput(bad);
  assert(R('canvas').hidden && !R('empty').hidden && R('empty').textContent.includes('http://'), '차단: ' + bad);
  assert(R('big').disabled && R('png').disabled && R('copy').disabled, '차단 시 버튼 비활성: ' + bad);
}
assert(PageQR.readBigQuery('?u=' + encodeURIComponent('javascript:alert(1)')) === null, '크게 보기도 javascript: 거부');
assert(PageQR.readBigQuery('?u=' + encodeURIComponent('example.org')) === null, '크게 보기는 자동 보정 없이 http(s)만');
// 5) 스킴 없는 주소는 https:// 보정, 꼬리표 제거, 다른 사이트면 "직접 넣은 주소"
await setInput('  example.com/a?gclid=1&b=2 ');
assert(R('url').textContent === 'https://example.com/a?b=2' && R('title').textContent === '직접 넣은 주소', '보정: ' + R('url').textContent + ' / ' + R('title').textContent);
assert(!R('reset').hidden, '고친 주소 → 되돌리기 버튼');
R('reset').click(); await wait(50);
assert(R('url').textContent === 'https://example.org/class/4-2/notice' && R('reset').hidden, '되돌리기');
// 5-1) 로그인 정보로 보이는 쿼리 → QR 아래 경고, 평범한 쿼리는 경고 없음
assert(R('secret').hidden, '첫 주소는 경고 없음');
for (const [u, k] of [['https://lms.example.org/join?token=abc123', 'token'], ['https://ex.com/a?session_id=9&x=1', 'session_id'], ['https://ex.com/cb?code=XYZ&state=1', 'code'],
  ['https://ex.com/?api_key=k1', 'api_key'], ['https://ex.com/login?password=1234', 'password'], ['https://ex.com/p#access_token=t', 'access_token'], ['https://ex.com/?SID=1', 'SID'], ['https://ex.com/?auth=1', 'auth']]) {
  await setInput(u);
  assert(!R('secret').hidden && R('secret').textContent.includes('로그인 정보가 있을 수 있어요') && R('secret').textContent.includes(k), '민감 쿼리 경고: ' + u + ' → ' + R('secret').textContent);
  assert(!R('canvas').hidden, 'QR은 그대로 만들어짐: ' + u);
}
for (const u of ['https://ex.com/search?keyword=물&page=2', 'https://ex.com/?monkey=1&id=7', 'https://ex.com/video?v=abc']) {
  await setInput(u);
  assert(R('secret').hidden, '평범한 쿼리는 경고 없음: ' + u);
}
await setInput('javascript:alert(1)?token=1');
assert(R('secret').hidden, '주소가 안 되면 경고도 숨김');
R('reset').click(); await wait(50);
// 6) 특수 페이지(chrome://) 탭 → 안내 문구, QR 없음
$$('#tabs .tab')[3].click(); await wait(100);
assert(R('canvas').hidden && R('empty').textContent.includes('특수 페이지') && R('input').value === '', '설정 탭 안내: ' + R('empty').textContent);
// 7) 짧은 주소 탭 → 크게 보기
$$('#tabs .tab')[1].click(); await wait(100);
assert(R('url').textContent === 'https://example.org/science/water-cycle-video' && R('stripRow').hidden, '꼬리표 없는 주소');
assert(R('meta').textContent.includes('멀리서도 잘 찍혀요'), '짧은 주소 안내: ' + R('meta').textContent);
R('big').click(); await wait(150);
assert(!$('#bigwrap').hidden && $('#big .pq-big-title').textContent === '물의 순환 실험 영상 - 햇살 과학관', '크게 보기 제목');
assert($('#big .pq-big-url').textContent === 'example.org/science/water-cycle-video', '짧은 주소 표시: ' + $('#big .pq-big-url').textContent);
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait(50);
assert($('#bigwrap').hidden, 'Esc로 닫힘');
return 'ok 36';
