# edu-expo 공통 규칙 (교육 박람회 "찍먹" 데모 모음)

배포: GitHub Pages `https://bin7335.github.io/edu-expo/<slug>/` (공개 저장소 bin7335/edu-expo)
관람객: 교사·학생·학부모 혼합. 갤러리(패들렛) 카드를 눌러 1-3분 시연.

## 파일 규칙
- 앱 하나 = 폴더 하나: `<slug>/index.html`. **단일 파일**(CSS·JS 인라인). 이미지는 SVG/CSS/이모지로 해결.
- 외부 CDN·API·서버·로그인 금지. 오프라인에서도 열려야 함. 저장은 `localStorage`만.
  - 꼭 필요한 소형 MIT 라이브러리는 파일 안에 인라인하고 라이선스 주석을 남긴다.
- 한국어 UI. 모바일(375px)과 노트북(1280px) 모두 깨지지 않게 반응형.
- 폰트: `font-family: system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;`
- `<title>`과 `<meta name="description">`, `<meta name="viewport">` 필수.
- 첫 화면(1280×720)이 그대로 썸네일이 됨 → 첫 화면에 앱 이름 + 핵심 기능이 바로 보이게. 빈 화면 금지(샘플 데이터 미리 채우기).
- 우측 하단 또는 푸터에 작은 링크: `← 전체 데모 보기` (`../`).

## 독창성
- 외부 에듀테크 도구는 "기능 아이디어"만 참고. 제품명·로고·고유 디자인·문구를 따라 하지 않는다. 앱 이름은 새로 짓는다.

## 콘셉트 페이지 (9-15번)
- 랜딩페이지형. 히어로 + 문제 → 해결 → 주요 기능 3-4개 → 사용 흐름 → 간단한 인터랙티브 미리보기(목업) 1개.
- 히어로 근처와 상단에 눈에 띄는 **"콘셉트"** 배지. 푸터에 "실제 운영 중인 서비스가 아닌 아이디어 시연용 페이지입니다." 명시.
- 실제 학교·학생·교사 실명, 연락처, 개인정보 넣지 않음. 예시는 가상의 "햇살초등학교" 등.

## 검증 (각 앱 완료 조건)
1. 헤드리스 크롬으로 열어 콘솔 오류 0, 1280×720 스크린샷이 정상 렌더링.
   `"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,720 --screenshot="<scratch경로>/<slug>.png" "file:///D:/OneDrive - 경상북도교육청/0bin/dev/edu-expo/<slug>/index.html"`
2. 375px 폭에서도 확인.
3. 핵심 버튼을 실제로 눌러 동작하는지 (가능하면 `--dump-dom` 또는 간단한 자체 테스트).

## 크롬 확장 (23번-)
갤러리에서 확장은 바로 실행되지 않으므로 **확장 본체 + 체험 페이지** 두 가지를 만든다.
- 본체: `extensions/<slug>/` — Manifest V3, 원격 코드·CDN·서버·외부 전송 0, 최소 권한(`activeTab`, `storage`, `scripting` 위주, `<all_urls>`는 꼭 필요할 때만). 아이콘 16/48/128 PNG(직접 생성), 한국어 이름·설명, `README.md`(설치법: zip 풀기 → chrome://extensions → 개발자 모드 → 압축해제된 확장 로드).
- 배포 zip: `extensions/<slug>.zip` (폴더 내용을 루트로 압축, PowerShell `Compress-Archive` 사용 가능).
- 체험 페이지: `ext-<slug>/index.html` — 확장을 설치하지 않아도 **같은 기능을 페이지 안에서 그대로 체험**(팝업 UI를 페이지에 띄우고, content script 로직을 예시 본문에 적용). 상단에 "크롬 확장" 배지, [zip 내려받기] 버튼(`../extensions/<slug>.zip`), 설치 3단계 안내. 첫 화면 1280×720이 썸네일.
- 체험 페이지와 확장은 핵심 로직 JS를 같은 코드로 유지(복붙 허용, 단 동작 동일).
- 검증: 체험 페이지는 위 검증 규칙 그대로. 확장은 manifest JSON 유효성, 모든 참조 파일 존재, JS 구문 검사(node --check). 가능하면 `--load-extension`으로 실제 로드해 보고, 크롬 정책상 막히면 그렇다고 보고.

## 목록·배포·테스트 (2026-11-07 추가)
- **목록 원본은 `catalog.json` 하나.** 새 앱을 넣거나 이름·소개를 고치면 `node tools/build-catalog.js` 실행 → 갤러리 `index.html`, `gallery-cards.md`, 각 페이지 OG 메타·CSP, `dist/act-board/`(개별 등록 패키지, git 제외)가 다시 만들어진다. `<!-- og:auto -->`, `<!-- csp:auto -->` 블록은 손으로 고치지 않는다.
- **개별 업로드 가능해야 한다**(act-board.com): 페이지는 다른 파일을 상대 경로로 읽지 않는다. 데이터는 HTML 안에 인라인(fetch 금지). 확장 zip·아이콘 링크는 빌드가 절대 주소·data URI로 바꿔 준다.
- **테스트**: `node tests/run-all.mjs [slug...]` — 정적 검사(외부 리소스·eval·lookbehind·noopener·CSP·메타), 로드 오류, 외부 요청, 375px 넘침, XSS(입력칸·붙여넣기·파일·주소·저장값 오염), 버튼 연타, `tests/specs/<slug>.js` 시나리오. 새 앱은 spec부터 쓰고(빨강) 앱을 만들어 통과(초록)시킨다.
- **보안 규칙**: 사용자 입력·localStorage·URL·파일 내용을 `innerHTML`/속성 문자열에 넣을 때는 반드시 이스케이프(또는 textContent). CSV 내보내기는 `= + - @`로 시작하는 셀 앞에 `'`. 개인정보를 저장하는 앱은 "이 PC 기록 모두 지우기" 버튼을 둔다. 정규식 lookbehind 금지(구형 iOS).
- 확장 체험 페이지 빌드: law-link `python tools/build-law.py`, page-qr `node tools/page-qr/build.js <저장소경로>`, pdf-tidy `node tools/pdf-tidy/build.js`(템플릿 `tools/pdf-tidy/template.html`을 고친다).
