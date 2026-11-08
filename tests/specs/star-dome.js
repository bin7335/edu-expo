// 84 별빛 돔: 첫 화면 하늘이 돎 → 실제 별 위치(고도) 검증 → 겨울 선택·시작 → 끌어서 둘러보기 → 틀린 별 → 순서대로 이어 오리온 완성 → 겨울철 대삼각형 → 계절 완성 결말·저장 → 처음으로 ✓ 표시 → 소리 기본 꺼짐
const T = __test, S = () => T.state();
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const cv = $('#cv');
const pe = (type, x, y) => cv.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', bubbles: true, isPrimary: true, button: 0 }));
const tap = id => { const p = T.screenOf(id); assert(p && p.x > 0 && p.x < innerWidth && p.y > 0 && p.y < innerHeight, id + ' 화면 밖: ' + JSON.stringify(p)); pe('pointerdown', p.x, p.y); pe('pointerup', p.x, p.y); };
T.manual(true);
ok(text().includes('별빛 돔') && $('#ready').classList.contains('on') && S().phase === 'ready', '제목·시작 카드');
ok(S().sound === false && $('#snd').getAttribute('aria-pressed') === 'false', '소리 처음엔 꺼짐');
const az0 = S().az; T.step(60); ok(Math.abs(S().az - az0) > 0.5, '첫 화면 하늘이 천천히 돎');
// 실제 별 위치: 위도 36.5°에서 북극성 고도 ≈ 위도, 계절별 별자리는 그 계절 저녁 하늘 위
ok(Math.abs(T.altOf('polaris', 'winter') - 36.5) < 1.5 && Math.abs(T.altOf('polaris', 'summer') - 36.5) < 1.5, '북극성 고도 ≈ 위도: ' + T.altOf('polaris', 'winter').toFixed(1));
for (const se of ['spring', 'summer', 'autumn', 'winter']) for (const id of T.starsOf(se)) assert(T.altOf(id, se) > 12, se + ' ' + id + ' 고도 ' + T.altOf(id, se).toFixed(1));
n++;
ok(T.altOf('betelgeuse', 'summer') < 0 && T.altOf('vega', 'winter') < 25, '여름엔 오리온이 지평선 아래');
ok(T.azOf('sirius', 'winter') > 100 && T.azOf('sirius', 'winter') < 180, '겨울 저녁 시리우스는 남동쪽: ' + T.azOf('sirius', 'winter').toFixed(0));
// 겨울 고르고 시작
$('.season[data-s="winter"]').click(); $('#start').click(); await wait(20);
let s = S();
ok(s.phase === 'play' && s.season === 'winter' && s.target === '오리온자리' && $('#mName').textContent === '오리온자리', '겨울 시작: 오리온자리 찾기');
ok($('#mHint').textContent.includes('남') , '방향 힌트: ' + $('#mHint').textContent);
// 끌어서 둘러보기
const a1 = S().az; pe('pointerdown', 600, 400); for (let i = 1; i <= 10; i++) pe('pointermove', 600 - i * 20, 400 - i * 5); pe('pointerup', 400, 350);
ok(Math.abs(S().az - a1) > 5 && S().drags === 1, '끌어서 하늘 돌리기: ' + (S().az - a1).toFixed(1));
T.lookAt('orion'); T.step(5);
ok(T.screenOf('betelgeuse').vis, '오리온 쪽 보기');
tap('rigel'); ok(S().wrong === 1 && S().links === 0 && $('#toast').textContent.includes('베텔게우스'), '틀린 별: 시작 별 안내 ' + $('#toast').textContent);
const ORI = T.seqOf('orion');
let links = 0;
for (const seq of ORI) for (let i = 0; i < seq.length; i++) { tap(seq[i]); if (i) links++; assert(S().links === links, '연결 ' + seq[i] + ' ' + S().links + '/' + links); }
n++;
s = S();
ok(s.done.includes('orion') && s.target === '겨울철 대삼각형' && $('#toast').textContent.includes('오리온'), '오리온자리 완성 → 다음 별자리');
ok($('#mFact').textContent.length > 10 || $('#toast').textContent.length > 5, '별자리 설명');
T.lookAt('wintertri'); T.step(5);
const TRI = T.seqOf('wintertri');
for (const seq of TRI) for (const id of seq) tap(id);
s = S();
ok(s.phase === 'end' && $('#result').classList.contains('on') && $('#result').innerText.includes('겨울') && $('#result').innerText.includes('시리우스'), '겨울 밤하늘 완성 결말');
const rec = JSON.parse(localStorage.getItem('edu-expo-star-dome-v1'));
ok(rec && rec.done.includes('orion') && rec.done.includes('wintertri') && rec.seasons.includes('winter'), '완성 기록 저장');
$('#home').click(); await wait(10);
ok(S().phase === 'ready' && $('.season[data-s="winter"]').textContent.includes('✓') && $('#recLine').textContent.includes('2/8'), '처음으로: 겨울 ✓, 2/8');
// 다른 계절: 봄 북두칠성
$('.season[data-s="spring"]').click(); $('#start').click(); await wait(10);
ok(S().season === 'spring' && S().target === '북두칠성' && $('#mHint').textContent.includes('북'), '봄: 북두칠성은 북쪽 하늘');
$('#hint').click(); ok(S().hintOn === true, '힌트 켜기');
$('#snd').click(); ok(S().sound === true, '소리 켜기'); $('#snd').click();
return 'ok ' + n;
