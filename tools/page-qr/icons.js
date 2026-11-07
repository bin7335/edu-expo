// 딸깍 QR 아이콘 16/48/128 PNG 생성 (의존성 없음)
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const out = process.argv[2];

const BRAND = [79, 70, 229], WHITE = [255, 255, 255], DARK = [30, 27, 75], ACC = [250, 204, 21];
function inRound(x, y, x0, y0, x1, y1, r){
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r), cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
// 128 기준 좌표계의 한 점 색
function colorAt(x, y, small){
  if (!inRound(x, y, 2, 2, 126, 126, 28)) return null;
  if (!inRound(x, y, 18, 18, 110, 110, 12)) return BRAND;
  // 안쪽 흰 판 위 QR 모양
  if (small){
    if (!inRound(x, y, 16, 16, 112, 112, 6)) return BRAND;
    for (const [fx, fy] of [[24, 24], [80, 24], [24, 80]])
      if (x >= fx && x < fx + 24 && y >= fy && y < fy + 24) return (x >= fx + 8 && x < fx + 16 && y >= fy + 8 && y < fy + 16) ? WHITE : DARK;
    if (x >= 80 && x < 104 && y >= 80 && y < 104) return ACC;
    return WHITE;
  }
  const fin = (fx, fy) => {
    const s = 34, t = 7, c = 12;
    if (x >= fx && x < fx + s && y >= fy && y < fy + s){
      const ix = x - fx, iy = y - fy;
      if (ix < t || iy < t || ix >= s - t || iy >= s - t) return DARK;
      const m = (s - c) / 2;
      if (ix >= m && ix < m + c && iy >= m && iy < m + c) return DARK;
      return WHITE;
    }
    return undefined;
  };
  for (const [fx, fy] of [[26, 26], [68, 26], [26, 68]]){ const r = fin(fx, fy); if (r) return r; }
  if (!small){
    // 오른쪽 아래: 데이터 칸 몇 개
    const cells = [[0,0],[2,0],[1,1],[3,1],[0,2],[2,2],[3,3],[1,3]];
    for (const [i, j] of cells){ const cx = 70 + i * 8, cy = 70 + j * 8; if (x >= cx && x < cx + 7 && y >= cy && y < cy + 7) return DARK; }
  } else {
    if (x >= 74 && x < 100 && y >= 74 && y < 100) return ACC;
  }
  return WHITE;
}
function crc32(buf){
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++){
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size){
  const SS = 4, small = size <= 16;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++){
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++){
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++){
        const px = (x + (sx + 0.5) / SS) * 128 / size, py = (y + (sy + 0.5) / SS) * 128 / size;
        const c = colorAt(px, py, small);
        if (c){ r += c[0]; g += c[1]; b += c[2]; a++; }
      }
      const o = y * (size * 4 + 1) + 1 + x * 4, n = SS * SS;
      raw[o] = a ? Math.round(r / a) : 0; raw[o + 1] = a ? Math.round(g / a) : 0; raw[o + 2] = a ? Math.round(b / a) : 0;
      raw[o + 3] = Math.round(255 * a / n);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
for (const s of [16, 48, 128]){ fs.writeFileSync(path.join(out, `icon${s}.png`), png(s)); console.log('icon' + s, 'ok'); }
