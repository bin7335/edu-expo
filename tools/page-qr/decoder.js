// 검증용 최소 QR 디코더 (오류 정정 M, 바이트/ECI 모드). mod[y][x] (true=검정) → 문자열
// 형식 정보 BCH 검사 + 블록별 RS 신드롬 0 검사까지 해서 구조가 표준대로인지 확인
function decodeMatrix(mod){
  const size = mod.length, ver = (size - 17) / 4;
  if (!Number.isInteger(ver) || ver < 1 || ver > 40) throw new Error('size');
  const at = (x, y) => mod[y][x];
  // 형식 정보 (왼쪽 위 사본)
  let fb = 0;
  const fpos = [];
  for (let i = 0; i <= 5; i++) fpos.push([8, i]);
  fpos.push([8, 7], [8, 8], [7, 8]);
  for (let i = 9; i < 15; i++) fpos.push([14 - i, 8]);
  fpos.forEach(([x, y], i) => { if (at(x, y)) fb |= 1 << i; });
  // 두 번째 사본
  let fb2 = 0;
  for (let i = 0; i < 8; i++) if (at(size - 1 - i, 8)) fb2 |= 1 << i;
  for (let i = 8; i < 15; i++) if (at(8, size - 15 + i)) fb2 |= 1 << i;
  if (fb !== fb2) throw new Error('format copies differ');
  const f = fb ^ 0x5412, data5 = f >>> 10;
  let r = data5; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
  if ((((data5 << 10) | r) ^ 0x5412) !== fb) throw new Error('format BCH');
  const ecl = data5 >>> 3, mask = data5 & 7;
  if (ecl !== 0) throw new Error('not level M: ' + ecl);
  // 함수 영역
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const mark = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < size && y < size) fn[y][x] = true; };
  mark(0, 0, 9, 9); mark(size - 8, 0, 8, 9); mark(0, size - 8, 9, 8);
  mark(6, 0, 1, size); mark(0, 6, size, 1);
  if (ver > 1){
    const n = Math.floor(ver / 7) + 2;
    const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    const al = [6]; for (let p = size - 7; al.length < n; p -= step) al.splice(1, 0, p);
    for (const a of al) for (const b of al){
      if ((a === 6 && b === 6) || (a === 6 && b === al[al.length - 1]) || (a === al[al.length - 1] && b === 6)) continue;
      mark(a - 2, b - 2, 5, 5);
    }
  }
  if (ver >= 7){ mark(size - 11, 0, 3, 6); mark(0, size - 11, 6, 3); }
  // 버전 정보 검사
  if (ver >= 7){
    let v = 0;
    for (let i = 0; i < 18; i++) if (at(size - 11 + i % 3, Math.floor(i / 3))) v |= 1 << i;
    if ((v >>> 12) !== ver) throw new Error('version info');
  }
  const MF = [(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0][mask];
  const bits = [];
  for (let right = size - 1; right >= 1; right -= 2){
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++){
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if (!fn[y][x]) bits.push(at(x, y) !== MF(x, y) ? 1 : 0);
    }
  }
  const raw = Math.floor(bits.length / 8), cws = [];
  for (let i = 0; i < raw; i++){ let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j]; cws.push(b); }
  const ECC = [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28];
  const NB = [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49];
  const nb = NB[ver], el = ECC[ver], nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
  const blocks = Array.from({ length: nb }, (_, j) => []);
  let k = 0;
  for (let i = 0; i < shortLen + 1; i++) for (let j = 0; j < nb; j++){
    const len = j < nShort ? shortLen : shortLen + 1;
    if (i < len) blocks[j].push(cws[k++]);
  }
  // 인터리브 순서: 데이터 부분(짧은 블록 길이-el까지) 후 긴 블록의 마지막 데이터, 그 다음 ECC
  // 위 단순 분배는 ECC 위치가 섞이므로 표준 방식으로 다시 분배
  const lens = Array.from({ length: nb }, (_, j) => (j < nShort ? shortLen : shortLen + 1) - el);
  const dataB = lens.map(() => []), eccB = lens.map(() => []);
  k = 0;
  for (let i = 0; i < Math.max(...lens); i++) for (let j = 0; j < nb; j++) if (i < lens[j]) dataB[j].push(cws[k++]);
  for (let i = 0; i < el; i++) for (let j = 0; j < nb; j++) eccB[j].push(cws[k++]);
  // RS 신드롬 검사
  const EXP = new Array(512), LOG = new Array(256); let x = 1;
  for (let i = 0; i < 255; i++){ EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const mul = (a, b) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;
  for (let j = 0; j < nb; j++){
    const cw = dataB[j].concat(eccB[j]);
    for (let s = 0; s < el; s++){
      let acc = 0; const a = EXP[s];
      for (const c of cw) acc = mul(acc, a) ^ c;
      if (acc !== 0) throw new Error('RS syndrome block ' + j);
    }
  }
  const data = [].concat(...dataB);
  // 비트 파싱
  let bp = 0;
  const read = n => { let v = 0; for (let i = 0; i < n; i++){ v = (v << 1) | ((data[bp >> 3] >> (7 - (bp & 7))) & 1); bp++; } return v; };
  const out = [];
  let utf8 = false;
  while (bp + 4 <= data.length * 8){
    const mode = read(4);
    if (mode === 0) break;
    if (mode === 7){ const e = read(8); utf8 = e === 26; continue; }
    if (mode !== 4) throw new Error('mode ' + mode);
    const n = read(ver < 10 ? 8 : 16);
    for (let i = 0; i < n; i++) out.push(read(8));
  }
  return { text: new TextDecoder().decode(new Uint8Array(out)), ver, mask, utf8 };
}
if (typeof module !== 'undefined') module.exports = { decodeMatrix };
