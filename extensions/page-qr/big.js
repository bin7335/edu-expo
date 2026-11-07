// 크게 보기 페이지: big.html?u=<주소>&t=<제목>
// u 는 http:// 또는 https:// 주소만 받아들이고(PageQR.readBigQuery), 제목·주소는 textContent로만 화면에 넣습니다.
const data = PageQR.readBigQuery(location.search);
if (data) document.title = '딸깍 QR - ' + (data.title || PageQR.shortUrl(data.url, 40));
PageQRBig.mount(document.getElementById('app'), data, { close: () => window.close() });
