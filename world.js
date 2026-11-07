/* =====================================================================
   Фон страницы: мир сверху вниз — космос, небо, поверхность, недра,
   бедрок, пустота и ад. Рисуется кодом один раз (без картинок),
   при прокрутке медленно уезжает вверх.
   Всё своё: блоки, деревья, животные и постройки нарисованы с нуля.
   ===================================================================== */
(function () {
  "use strict";
  const cv = document.getElementById("world");
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const T = 2;          // 1 пиксель мира = 2 px экрана
  // ширина подложки берётся из index.html (--panel-w), менять только там
  const PANEL = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--panel-w")) || 1260;

  /* ---------- утилиты ---------- */
  const hx = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const PAL = o => { const r = {}; for (const k in o) r[k] = Array.isArray(o[k]) ? o[k].map(hx) : hx(o[k]); return r; };
  function hash(x, y, s) {
    let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 1, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296;
  }
  function vn(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const f1 = (x, s) => vn(x, 0, s) * .62 + vn(x * 2.3, 1, s + 7) * .27 + vn(x * 5.1, 2, s + 13) * .11;
  const f2 = (x, y, s) => vn(x, y, s) * .6 + vn(x * 2.2, y * 2.2, s + 5) * .28 + vn(x * 4.7, y * 4.7, s + 9) * .12;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const G = a => a.map(([t, c]) => [t, hx(c)]);
  function grad(st, t) {
    if (t <= st[0][0]) return st[0][1];
    for (let i = 1; i < st.length; i++) if (t <= st[i][0]) { const a = st[i - 1], b = st[i]; return mix(a[1], b[1], (t - a[0]) / ((b[0] - a[0]) || 1)); }
    return st[st.length - 1][1];
  }

  /* ---------- палитра (приглушённая, близкая к блокам игры) ---------- */
  const C = PAL({
    grass: ["#7a9b55", "#82a25b", "#74934f", "#89a862"], grassD: ["#6b8949", "#668247"],
    dirt: ["#7b5b41", "#826146", "#74563d", "#896a4e"], sand: ["#d6c597", "#ddcda1", "#cdbb8c", "#e2d4ab"],
    stone: ["#7f7f7d", "#848482", "#7a7a78", "#8a8a87"], andes: ["#868886", "#7f817f", "#8d8f8d", "#7a7c7a"],
    dior: ["#a9a8a4", "#b3b2ae", "#a1a09c", "#bbbab6"], gran: ["#917566", "#98796a", "#8a6f61", "#9f8172"],
    grav: ["#7f7975", "#8d8784", "#706a66", "#99938f"], tuff: ["#64655f", "#696a64", "#60615b", "#6e6f69"],
    deep: ["#56575c", "#5b5c61", "#515257", "#606166"], calc: ["#d8d8d4", "#e2e2de", "#cfcfcb"],
    sbas: ["#4b4b51", "#525258", "#45454b"], ameth: ["#8c66b9", "#9a75c8", "#7f5aa9", "#ad8bd4"],
    drip: ["#8a6c55", "#92745c", "#80634d", "#9a7c63"], moss: ["#5f7e3b", "#678645", "#587438", "#6f8e4b"],
    bed: ["#575758", "#444445", "#646465", "#393939"],
    lava: ["#cf6f2c", "#d77b35", "#c86727", "#df8a41"], lavaB: "#eeab5e",
    water: "#5579ae", waterD: "#3d5b8c", waterH: "#86a8d2",
    rack: ["#6d3735", "#733b38", "#683330", "#7a4340"], rackD: "#5a2c2b",
    black: ["#302c33", "#37323b", "#2b282e", "#3d3842"], basalt: ["#4f4f55", "#57575d", "#48484e"],
    soul: ["#4d3c2f", "#55433a", "#46362b", "#5b483c"],
    cnyl: ["#8a3130", "#963834", "#7d2a2a"], wnyl: ["#2f6d66", "#367870", "#29625b"],
    magma: ["#863a1e", "#974321", "#7a331b"], magmaB: "#dc8a3e",
    glow: ["#d8b766", "#cba85d", "#e5cb88", "#bd9850"],
    nb: ["#3e1f25", "#45232b", "#381b21"], nbM: "#26131a",
    cstem: ["#6b3949", "#764152"], cwart: ["#7f2121", "#8c2828", "#721c1c"], shroom: ["#e6a052", "#efb468"],
    wstem: ["#3a5d68", "#426a76"], wwart: ["#1f7a70", "#25867b", "#1b6b62"],
    log: ["#6a5236", "#5f492f", "#735a3c"], leaf: ["#5d8541", "#56793b", "#668e48", "#4f7137"],
    blog: ["#d9d5c9", "#cdc9bc"], bmark: "#46423d", bleaf: ["#7c9f55", "#84a75d", "#74974f", "#8cab63"],
    slog: ["#4f3b27", "#47341f"], sleaf: ["#40603c", "#476b43", "#3a5637", "#4f734a"],
    plank: ["#8b6a44", "#94724b", "#80613e"], rail: "#8a8a8c", bone: "#d9d4c5", boneS: "#a9a395"
  });
  const ORE = [null, "#3a3a3c", "#c7a68d", "#b47a54", "#d7bc5f", "#a6433b", "#4a63a4", "#76c5be", "#4fae6b", "#e6dfd6", "#e0bf5e"].map(c => c && hx(c));
  const SKYG = G([[0, "#0a0d1a"], [.18, "#111933"], [.38, "#2c3f66"], [.58, "#6383b1"], [.8, "#97b3d6"], [1, "#bdd0e5"]]);
  const VOIDG = G([[0, "#16141b"], [.5, "#0e0d12"], [1, "#151018"]]);
  const NAIRG = G([[0, "#261514"], [.45, "#3b1e1c"], [.8, "#552a20"], [1, "#723820"]]);
  const FLOWERS = ["#c0473e", "#dcc04f", "#5a78c8", "#9a6ac0", "#ece8e0", "#d9853a", "#d98fae"].map(hx);

  /* ---------- материалы ---------- */
  const SKY = 0, GRASS = 1, DIRT = 2, STONE = 3, AND = 4, DIO = 5, GRA = 6, TUFF = 7, DEEP = 8, GRAV = 9, BED = 10,
    VOID = 11, CAVE = 12, WATER = 13, LAVA = 14, DRIP = 15, RACK = 16, BLACK = 17, BASALT = 18, SOUL = 19, CNYL = 20,
    WNYL = 21, MAGMA = 22, GLOW = 23, NB = 24, NAIR = 25, MOSS = 26, SAND = 27, CALC = 28, AMETH = 29, SBAS = 30,
    CWART = 31, WWART = 32, CSTEM = 33, WSTEM = 34, SHROOM = 35;
  const AIR = new Uint8Array(64); [SKY, VOID, CAVE, NAIR].forEach(m => AIR[m] = 1);
  const FLUID = new Uint8Array(64); [WATER, LAVA].forEach(m => FLUID[m] = 1);
  const ROCK = new Uint8Array(64); [DIRT, STONE, AND, DIO, GRA, TUFF, DEEP, GRAV, DRIP, CALC].forEach(m => ROCK[m] = 1);

  let Hs = 0, builtW = 0;

  function build() {
    const vw = window.innerWidth, vh = window.innerHeight;
    Hs = Math.round(Math.max(vh * 4.2, 3800));
    const W = Math.ceil(vw / T), H = Math.ceil(Hs / T);
    cv.width = W; cv.height = H; cv.style.width = W * T + "px"; cv.style.height = H * T + "px";

    // поля по бокам от подложки — туда ставим самое интересное
    const gut = Math.max(0, (vw - PANEL) / 2) / T;
    const wide = gut >= 70;
    const Lx = f => Math.round(wide ? f * gut : f * W * .24);
    const Rx = f => W - 1 - Lx(f);

    const mat = new Uint8Array(W * H), ore = new Uint8Array(W * H);
    const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const get = (x, y) => inb(x, y) ? mat[y * W + x] : 255;
    const set = (x, y, m) => { if (inb(x, y)) mat[y * W + x] = m; };
    const lights = [];
    const light = (x, y, r, col, s) => lights.push([x | 0, y | 0, r, typeof col === "string" ? hx(col) : col, s]);

    const surf = Math.round(H * .255), deepY = Math.round(H * .47), bedY = Math.round(H * .635),
      voidEnd = Math.round(H * .705), lavaY = Math.round(H * .935);

    /* ---------- рельеф по столбцам ---------- */
    const tY = new Int32Array(W), gD = new Int32Array(W), dB = new Int32Array(W), sB = new Int32Array(W),
      bT = new Int32Array(W), bB = new Int32Array(W), nT = new Int32Array(W), nB = new Int32Array(W),
      rB = new Int32Array(W), fT = new Int32Array(W);
    const hillX = Rx(.45), pondX = Lx(.62), pondR = Math.max(16, Math.min(26, Math.round(W * .03)));
    for (let x = 0; x < W; x++) {
      let h = surf + (f1(x * .011, 1) - .5) * 44;
      const dh = (x - hillX) / 42; h -= Math.exp(-dh * dh) * 26;
      tY[x] = Math.round(h / 2) * 2;
    }
    let pondTop = 0;
    for (let x = pondX - pondR - 10; x <= pondX + pondR + 10; x++) if (x >= 0 && x < W) pondTop = Math.max(pondTop, tY[x]);
    for (let x = pondX - pondR - 18; x <= pondX + pondR + 18; x++) if (x >= 0 && x < W) {
      const e = Math.abs(x - pondX) - pondR - 8;
      tY[x] = e <= 0 ? pondTop : Math.round(lerp(pondTop, tY[x], smooth(e / 10)) / 2) * 2;
    }
    for (let x = 0; x < W; x++) {
      gD[x] = 3 + (hash(x, 0, 13) < .45 ? 1 : 0) + (hash(x, 1, 14) < .12 ? 1 : 0);
      dB[x] = tY[x] + 24 + Math.round(f1(x * .03, 2) * 16);
      sB[x] = deepY + Math.round((f1(x * .007, 3) - .5) * 70);
      bT[x] = bedY + Math.round((f1(x * .02, 4) - .5) * 16) + Math.floor(hash(x >> 1, 0, 5) * 7);
      bB[x] = bT[x] + 22 + Math.round(f1(x * .03, 6) * 12) + Math.floor(hash(x >> 1, 1, 7) * 7);
      nT[x] = voidEnd + Math.round((f1(x * .02, 9) - .5) * 12) + Math.floor(hash(x >> 1, 2, 8) * 7);
      nB[x] = nT[x] + 12 + Math.floor(hash(x >> 1, 3, 10) * 7);
      rB[x] = nB[x] + 12 + Math.round(Math.pow(f1(x * .022, 11), 1.4) * 60);
      { const n = f1(x * .014, 12); fT[x] = lavaY + 18 - Math.round(Math.max(0, n - .46) * 2 * 70 + (n - .46) * 12); }
    }
    // ад: под крепостью — лавовое море, под грибными лесами — твёрдая земля
    const fortEnd = Math.min(Math.max(Lx(1) + 28, 90), Math.round(W * .38));
    const crimX = Rx(.7), warpX = Rx(.3);
    for (let x = 0; x < W; x++) {
      if (x < fortEnd + 10) fT[x] = Math.max(fT[x], lavaY + 14);
      for (const [cx, r] of [[crimX, 46], [warpX, 40]]) {
        const w = smooth(1 - (Math.abs(x - cx) - r) / 24);
        if (w > 0) fT[x] = Math.round(lerp(fT[x], lavaY - 24 - Math.round(f1(x * .05, 41) * 8), w));
      }
    }

    /* ---------- заливка слоёв с неровными переходами ---------- */
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        let m;
        if (y < tY[x]) m = SKY;
        else if (y < tY[x] + gD[x]) m = GRASS;
        else if (y < dB[x]) m = (y >= dB[x] - 5 && hash(x >> 1, y >> 1, 15) < (y - (dB[x] - 5)) / 6) ? STONE : DIRT;
        else if (y < sB[x] + 10) { const p = (y - (sB[x] - 10)) / 20; m = (p > 0 && hash(x >> 1, y >> 1, 16) < p) ? DEEP : STONE; }
        else if (y < bT[x]) { const p = (y - (bT[x] - 22)) / 22; m = (p > 0 && hash(x >> 1, y >> 1, 17) < p * p) ? BED : DEEP; }
        else if (y < bB[x]) m = (y > bB[x] - 7 && hash(x >> 1, y >> 1, 18) < (y - (bB[x] - 7)) / 9) ? VOID : BED;
        else if (y < nT[x]) m = VOID;
        else if (y < nB[x]) m = (y < nT[x] + 5 && hash(x >> 1, y >> 1, 19) < (nT[x] + 5 - y) / 7) ? VOID : BED;
        else if (y < rB[x]) m = (y > rB[x] - 6 && hash(x >> 1, y >> 1, 20) < (y - (rB[x] - 6)) / 8) ? NAIR : RACK;
        else if (y < fT[x]) m = y >= lavaY ? LAVA : NAIR;
        else m = RACK;
        mat[y * W + x] = m;
      }
    }

    /* ---------- разные породы пятнами ---------- */
    for (let y = surf; y < bedY + 24 && y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const m0 = mat[y * W + x]; if (m0 !== STONE && m0 !== DEEP && m0 !== DIRT) continue;
      let nm = 0;
      if (m0 === STONE) {
        if (f2(x * .018, y * .026, 30) > .76) nm = GRA;
        else if (f2(x * .02, y * .03, 31) > .77) nm = DIO;
        else if (f2(x * .017, y * .025, 32) > .73) nm = AND;
        else if (f2(x * .03, y * .04, 33) > .76 && y < deepY - 40) nm = GRAV;
        else if (f2(x * .03, y * .04, 33) < .24 && y < dB[x] + 50) nm = DIRT;
      } else if (m0 === DEEP) {
        if (f2(x * .02, y * .028, 34) > .74) nm = TUFF;
        else if (f2(x * .025, y * .03, 35) > .78) nm = GRAV;
      } else if (m0 === DIRT && y > tY[x] + 10 && f2(x * .04, y * .05, 36) > .72) nm = GRAV;
      if (nm) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const xx = x + dx, yy = y + dy; if (xx >= W || yy >= H) continue;
        const k = yy * W + xx; if (mat[k] === m0) mat[k] = nm;
      }
    }
    // ад: чёрный камень и магма пятнами
    for (let y = voidEnd; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      if (mat[y * W + x] !== RACK) continue;
      let nm = 0;
      if (f2(x * .025, y * .03, 37) > .72) nm = BLACK;
      else if (y > lavaY - 8 && (get(x, y + 4) === LAVA || get(x + 4, y) === LAVA || get(x - 4, y) === LAVA) && f2(x * .06, y * .08, 38) > .5) nm = MAGMA;
      if (nm) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (mat[(y + dy) * W + x + dx] === RACK) mat[(y + dy) * W + x + dx] = nm;
    }

    /* ---------- руды: немного и небольшими гнёздами ---------- */
    const nOre = Math.round(W * (bedY - surf) / 4200);
    for (let i = 0; i < nOre; i++) {
      const x = Math.floor(hash(i, 0, 40) * W), y = surf + 30 + Math.floor(hash(i, 1, 40) * (bedY - surf - 40));
      const df = (y - surf) / (bedY - surf), r = hash(i, 2, 40);
      let t;
      if (df < .35) t = r < .45 ? 1 : r < .7 ? 3 : r < .9 ? 2 : 8;
      else if (df < .6) t = r < .35 ? 1 : r < .6 ? 2 : r < .78 ? 3 : r < .9 ? 6 : 4;
      else t = r < .3 ? 2 : r < .52 ? 5 : r < .7 ? 6 : r < .85 ? 4 : 7;
      const rad = 2 + Math.floor(hash(i, 3, 40) * 2.5);
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (dx * dx + dy * dy > rad * rad) continue;
        const xx = x + dx, yy = y + dy; if (!inb(xx, yy)) continue;
        const m = mat[yy * W + xx];
        if ((m === STONE || m === AND || m === DEEP || m === TUFF || m === GRA || m === DIO) && hash(xx, yy, 41) < .45) ore[yy * W + xx] = t;
      }
    }
    for (let i = 0; i < Math.round(W / 10); i++) { // кварц и золото в аду
      const x = Math.floor(hash(i, 0, 42) * W), y = voidEnd + 20 + Math.floor(hash(i, 1, 42) * (H - voidEnd - 20));
      const t = hash(i, 2, 42) < .7 ? 9 : 10;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy;
        if (inb(xx, yy) && mat[yy * W + xx] === RACK && hash(xx, yy, 43) < .35) ore[yy * W + xx] = t;
      }
    }

    /* ---------- пещеры ---------- */
    function carve(x0, y0, steps, r0, dir, s, straight) {
      const pts = []; let x = x0, y = y0, a = 0;
      for (let i = 0; i < steps; i++) {
        const r = r0 * (straight ? .95 + .1 * vn(i * .3, 0, s) : .6 + .75 * vn(i * .35, 0, s));
        pts.push([x, y, r]);
        a += straight ? (vn(i * .5, 1, s) - .5) * .08 : (vn(i * .45, 1, s) - .5) * .8;
        a = clamp(a, straight ? -.06 : -.45, straight ? .06 : .45);
        x += dir * Math.cos(a) * 5; y += Math.sin(a) * 5;
      }
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      for (const [px, py, r] of pts) { minX = Math.min(minX, px - r * 1.3); maxX = Math.max(maxX, px + r * 1.3); minY = Math.min(minY, py - r); maxY = Math.max(maxY, py + r); }
      minX = Math.max(0, minX | 0); maxX = Math.min(W - 1, maxX | 0); minY = Math.max(0, minY | 0); maxY = Math.min(H - 1, maxY | 0);
      const cells = [];
      for (let yy = minY; yy <= maxY; yy++) for (let xx = minX; xx <= maxX; xx++) {
        let dmin = 9;
        for (const [px, py, r] of pts) {
          const dx = (xx - px) / (r * 1.2), dy = (yy - py) / (r * (straight ? .95 : .85));
          const dd = dx * dx + dy * dy; if (dd < dmin) dmin = dd;
        }
        const wob = straight ? 0 : (vn(xx * .13, yy * .13, s + 3) - .5) * .5;
        if (Math.sqrt(dmin) + wob < 1) {
          const k = yy * W + xx; const m = mat[k];
          if (ROCK[m] || m === TUFF) { mat[k] = CAVE; ore[k] = 0; cells.push(k); }
        }
      }
      // верх и низ полости по столбцам
      const ceil = {}, floor = {};
      for (let xx = minX; xx <= maxX; xx++) {
        for (let yy = minY; yy <= maxY; yy++) if (mat[yy * W + xx] === CAVE) { if (!AIR[get(xx, yy - 1)]) { ceil[xx] = yy; } break; }
        for (let yy = maxY; yy >= minY; yy--) if (mat[yy * W + xx] === CAVE) { if (!AIR[get(xx, yy + 1)] && !FLUID[get(xx, yy + 1)]) { floor[xx] = yy; } break; }
      }
      return { cells, minX, maxX, minY, maxY, ceil, floor };
    }
    function fill(cave, depth, m) {
      let lo = 0; for (const k of cave.cells) lo = Math.max(lo, (k / W) | 0);
      const lvl = lo - depth;
      for (const k of cave.cells) if (mat[k] === CAVE && ((k / W) | 0) >= lvl) mat[k] = m;
      for (const x in cave.floor) if (cave.floor[x] >= lvl) delete cave.floor[x];
      return lvl;
    }
    function spikes(cave, s, fromTop, fromBottom) {
      for (let x = cave.minX + 3; x < cave.maxX - 3; x++) {
        if (hash(x, 0, s) > .14) continue;
        const len = 4 + Math.floor(hash(x, 1, s) * 11), w = hash(x, 2, s) < .5 ? 3 : 5;
        if (fromTop && cave.ceil[x] !== undefined) {
          const y0 = cave.ceil[x];
          for (let k = 0; k < len; k++) { const ww = Math.max(1, Math.round(w * (1 - k / len))); for (let i = 0; i < ww; i++) { const xx = x + i - (ww >> 1); if (get(xx, y0 + k) === CAVE) set(xx, y0 + k, DRIP); } }
        }
        if (fromBottom && cave.floor[x] !== undefined && hash(x, 3, s) < .6) {
          const y0 = cave.floor[x], l2 = Math.round(len * .7);
          for (let k = 0; k < l2; k++) { const ww = Math.max(1, Math.round(w * (1 - k / l2))); for (let i = 0; i < ww; i++) { const xx = x + i - (ww >> 1); if (get(xx, y0 - k) === CAVE) set(xx, y0 - k, DRIP); } }
        }
      }
    }
    const later = []; // спрайты, которые рисуются поверх цвета
    const sd = deepY - surf, dd = bedY - deepY;

    // 1. пещера с подземным озером
    const cWater = carve(Lx(.1), surf + sd * .42, 12, 19, 1, 101);
    fill(cWater, 9, WATER); spikes(cWater, 102, true, false);
    // 2. пещера со сталактитами и старыми костями
    const cDrip = carve(Rx(.08), surf + sd * .64, 12, 19, -1, 103);
    spikes(cDrip, 104, true, true);
    later.push(() => bonesAt(cDrip));
    // 3. заброшенная шахта
    const cMine = carve(-6, surf + sd * .86, 20, 11, 1, 105, true);
    later.push(() => mineshaft(cMine));
    // 4. пышная пещера с мхом и лианами
    const cLush = carve(Lx(.08), deepY + dd * .3, 12, 20, 1, 106);
    for (const x in cLush.floor) for (let k = 1; k <= 3; k++) { const y = cLush.floor[x] + k; if (ROCK[get(+x, y)] || get(+x, y) === TUFF) set(+x, y, MOSS); }
    for (const x in cLush.ceil) for (let k = 1; k <= 2; k++) { const y = cLush.ceil[x] - k; if (ROCK[get(+x, y)] || get(+x, y) === TUFF) set(+x, y, MOSS); }
    later.push(() => lush(cLush));
    // 5. пещера с лавой
    const cLava = carve(Rx(.06), deepY + dd * .58, 11, 18, -1, 107);
    const lvl = fill(cLava, 8, LAVA);
    for (let x = cLava.minX; x <= cLava.maxX; x += 9) if (get(x, lvl) === LAVA) light(x, lvl, 44, "#ff8a3a", .42);
    spikes(cLava, 108, true, false);
    // 6. жеода с аметистом
    geode(Lx(.6), Math.round(deepY + dd * .76), 19);
    // 7. пара небольших пещер за подложкой
    spikes(carve(Math.round(W * .44), surf + sd * .5, 8, 13, 1, 109), 112, true, true);
    spikes(carve(Math.round(W * .62), deepY + dd * .42, 9, 14, -1, 110), 111, true, true);

    function geode(gx, gy, R) {
      for (let y = gy - R - 2; y <= gy + R + 2; y++) for (let x = gx - R - 2; x <= gx + R + 2; x++) {
        if (!inb(x, y)) continue;
        const d = Math.hypot(x - gx, (y - gy) * 1.1) + (vn(x * .3, y * .3, 112) - .5) * 2.2;
        const m = get(x, y); if (!(ROCK[m] || m === TUFF)) continue;
        ore[y * W + x] = 0;
        if (d < R - 9) set(x, y, CAVE); else if (d < R - 6) set(x, y, AMETH); else if (d < R - 3.5) set(x, y, CALC); else if (d < R) set(x, y, SBAS);
      }
      later.push(() => {
        for (let a = 0; a < 6.28; a += .55) {
          const x0 = gx + Math.cos(a) * (R - 9), y0 = gy + Math.sin(a) * (R - 9) / 1.1, len = 3 + Math.floor(hash(a * 10 | 0, 0, 113) * 3);
          for (let k = 0; k < len; k++) px(x0 - Math.cos(a) * k, y0 - Math.sin(a) * k, k === len - 1 ? hx("#c9adeb") : C.ameth[k % 4]);
        }
        light(gx, gy, 26, "#9a6ad0", .25);
      });
    }

    /* ---------- поверхность: пруд и песок ---------- */
    for (let x = pondX - pondR; x <= pondX + pondR; x++) {
      if (x < 0 || x >= W) continue;
      const e = 1 - ((x - pondX) / pondR) ** 2; if (e <= 0) continue;
      const bot = pondTop + Math.round(14 * Math.sqrt(e));
      for (let y = pondTop; y < bot; y++) set(x, y, WATER);
      for (let y = bot; y < bot + 4; y++) set(x, y, SAND);
    }
    for (let x = pondX - pondR - 8; x <= pondX + pondR + 8; x++) {
      if (x < 0 || x >= W || Math.abs(x - pondX) < pondR) continue;
      for (let y = tY[x]; y < tY[x] + 5; y++) if (get(x, y) === GRASS || get(x, y) === DIRT) set(x, y, SAND);
    }

    /* ---------- ад: биомы, светокамень, лавопады ---------- */
    const topOf = x => fT[x];
    const region = (a, b, fn) => { for (let x = Math.max(0, a | 0); x < Math.min(W, b | 0); x++) fn(x); };
    region(W * .38, W * .5, x => { for (let k = 0; k < 6; k++) if (get(x, topOf(x) + k) === RACK || get(x, topOf(x) + k) === BLACK) set(x, topOf(x) + k, SOUL); });
    region(W * .5, W * .62, x => {
      for (let k = 0; k < 4; k++) if (get(x, topOf(x) + k) !== LAVA) set(x, topOf(x) + k, BLACK);
    });
    for (let x = Math.round(W * .5); x < W * .62; x += 7 + Math.floor(hash(x, 0, 120) * 6)) {
      const w = 4 + Math.floor(hash(x, 1, 120) * 4), h = 6 + Math.floor(hash(x, 2, 120) * 30);
      for (let i = 0; i < w; i++) for (let k = 1; k <= h - (i === 0 || i === w - 1 ? 2 : 0); k++) if (get(x + i, topOf(x + i) - k) === NAIR) set(x + i, topOf(x + i) - k, BASALT);
    }
    region(crimX - 46, crimX + 46, x => { for (let k = 0; k < 3; k++) if (get(x, topOf(x) + k) === RACK || get(x, topOf(x) + k) === BLACK) set(x, topOf(x) + k, CNYL); });
    region(warpX - 40, warpX + 40, x => { for (let k = 0; k < 3; k++) if (get(x, topOf(x) + k) === RACK || get(x, topOf(x) + k) === BLACK) set(x, topOf(x) + k, WNYL); });
    fungus(crimX, CSTEM, CWART, 58, 26, 14, 130);
    fungus(crimX - 36, CSTEM, CWART, 30, 14, 8, 131);
    fungus(warpX, WSTEM, WWART, 48, 22, 12, 132);
    fungus(warpX + 32, WSTEM, WWART, 24, 12, 7, 133);
    function fungus(cx, stem, wart, h, rx, ry, s) {
      const base = topOf(clamp(cx, 0, W - 1));
      for (let y = base - h; y < base; y++) for (let i = 0; i < 4; i++) if (get(cx + i, y) === NAIR) set(cx + i, y, stem);
      const cy = base - h, ccx = cx + 2;
      for (let y = cy - ry; y <= cy + 3; y++) for (let x = ccx - rx - 2; x <= ccx + rx + 2; x++) {
        const e = ((x - ccx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (vn(x * .3, y * .3, s) - .5) * .35;
        if (e < 1 && get(x, y) === NAIR) set(x, y, wart);
      }
      for (let i = 0; i < 4; i++) {
        const x = ccx - rx + 4 + Math.floor(hash(i, 0, s) * (rx * 2 - 8)), y = cy - Math.floor(hash(i, 1, s) * ry * .7);
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if (get(x + a, y + b) === wart) set(x + a, y + b, SHROOM);
        light(x, y, 30, "#ffaa55", .28);
      }
      later.push(() => {
        const vine = wart === CWART ? hx("#8f2b2b") : hx("#2a8a7c");
        for (let x = ccx - rx; x <= ccx + rx; x += 2 + Math.floor(hash(x, 0, s + 1) * 4)) {
          let y = cy + 3; while (get(x, y) === NAIR && y > cy - ry) y--; if (get(x, y) === NAIR) continue;
          if (wart !== CWART) continue;
          const len = 3 + Math.floor(hash(x, 1, s + 1) * 12);
          for (let k = 1; k <= len; k++) if (get(x, y + k) === NAIR) px(x, y + k, k === len ? hx("#c25a3a") : vine);
        }
        if (wart === WWART) for (let x = cx - 30; x < cx + 34; x += 5 + Math.floor(hash(x, 2, s) * 6)) {
          const yb = topOf(clamp(x, 0, W - 1)); const len = 4 + Math.floor(hash(x, 3, s) * 10);
          for (let k = 1; k <= len; k++) if (get(x + (k % 4 === 0 ? 1 : 0), yb - k) === NAIR) px(x + (k % 4 === 0 ? 1 : 0), yb - k, vine);
        }
      });
    }
    // светокамень на потолке
    for (let i = 0; i < Math.max(4, Math.round(W / 70)); i++) {
      const x = Math.floor(hash(i, 0, 140) * W), y = rB[x], r = 4 + Math.floor(hash(i, 1, 140) * 4);
      for (let yy = y - 2; yy < y + r * 1.6; yy++) for (let xx = x - r - 2; xx <= x + r + 2; xx++) {
        const e = ((xx - x) / r) ** 2 + ((yy - y - r * .4) / (r * 1.1)) ** 2 + (vn(xx * .4, yy * .4, 141) - .5) * .5;
        if (e < 1 && (get(xx, yy) === NAIR || get(xx, yy) === RACK)) set(xx, yy, GLOW);
      }
      light(x, y + r, 54, "#ffd27a", .3);
    }
    // лавопады
    for (const x0 of [Rx(.5), Math.round(W * .47)]) {
      if (x0 < 0 || x0 >= W) continue;
      for (let y = rB[x0] - 2; y < lavaY + 2; y++) for (let i = 0; i < 4; i++) if (get(x0 + i, y) === NAIR) set(x0 + i, y, LAVA);
      for (let y = rB[x0]; y < lavaY; y += 18) light(x0 + 2, y, 28, "#ff8a3a", .2);
    }
    for (let x = 0; x < W; x += 22) if (get(x, lavaY) === LAVA) light(x, lavaY, 60, "#ff7a30", .2);

    /* ---------- адская крепость слева ---------- */
    const platY = lavaY - 74;
    for (let x = 0; x < fortEnd; x++) for (let y = platY; y < platY + 10; y++) set(x, y, NB);
    const pillars = [];
    for (let x = 12; x < fortEnd - 14; x += 46) pillars.push(x);
    for (const p of pillars) for (let x = p; x < p + 12; x++) for (let y = platY + 10; y < H; y++) set(x, y, NB);
    for (let i = 0; i < pillars.length; i++) {
      const a = pillars[i] + 12, b = i + 1 < pillars.length ? pillars[i + 1] : fortEnd;
      const mid = (a + b) / 2, half = (b - a) / 2;
      for (let x = a; x < b; x++) {
        const t = (x - mid) / half, depth = 3 + Math.round(13 * (1 - Math.sqrt(Math.max(0, 1 - t * t))));
        for (let y = platY + 10; y < platY + 10 + depth; y++) set(x, y, NB);
      }
    }
    const towX = 6, towW = 34, towH = 56;
    for (let x = towX; x < towX + towW; x++) for (let y = platY - towH; y < platY; y++) set(x, y, NB);
    for (let x = towX; x < towX + towW; x += 8) for (let y = platY - towH - 5; y < platY - towH; y++) for (let i = 0; i < 4; i++) set(x + i, y, NB);
    const windows = [[towX + 9, platY - 44], [towX + 21, platY - 44], [towX + 15, platY - 24]];
    for (const [wx, wy] of windows) { for (let x = wx; x < wx + 4; x++) for (let y = wy; y < wy + 10; y++) set(x, y, NAIR); light(wx + 2, wy + 6, 30, "#ff9a4a", .3); }
    later.push(() => {
      const fence = hx("#331920");
      for (let x = towX + towW + 2; x < fortEnd - 2; x += 7) for (let k = 1; k <= 8; k++) px(x, platY - k, fence), px(x + 1, platY - k, fence);
      for (let x = towX + towW; x < fortEnd; x++) { px(x, platY - 7, fence); px(x, platY - 4, fence); }
      for (const [wx, wy] of windows) for (let x = wx; x < wx + 4; x++) for (let y = wy; y < wy + 10; y++) px(x, y, mix(hx("#7a3a22"), hx("#c46a32"), (y - wy) / 10));
    });

    /* ---------- цвет ---------- */
    const img = ctx.createImageData(W, H), d = img.data;
    const pk = (arr, x, y, s) => arr[(hash(x, y, s) * arr.length) | 0];
    for (let y = 0; y < H; y++) {
      const skyC = grad(SKYG, y / surf), voidC = grad(VOIDG, (y - bedY) / (voidEnd - bedY)), nairC = grad(NAIRG, (y - voidEnd) / (lavaY - voidEnd));
      const depth = y < surf ? 0 : Math.min(1, (y - surf) / (bedY - surf)), dk = 1 - depth * .2;
      const ty = y / surf;
      for (let x = 0; x < W; x++) {
        const k = y * W + x, m = mat[k]; let c;
        switch (m) {
          case SKY: c = skyC;
            if (ty < .55) { const r = hash(x, y, 50), p = .0042 * (1 - ty / .55); if (r < p) c = mix(c, [238, 236, 246], r < p * .3 ? 1 : .55); }
            break;
          case GRASS: { const t = y - tY[x]; c = t < 3 ? pk(C.grass, x >> 1, y, 51) : pk(C.grassD, x, y, 52); break; }
          case DIRT: c = mul(pk(C.dirt, x >> 1, y >> 1, 53), dk); break;
          case SAND: c = pk(C.sand, x >> 1, y >> 1, 54); break;
          case STONE: c = mul(pk(C.stone, x >> 1, y >> 1, 55), dk); break;
          case AND: c = mul(pk(C.andes, x, y, 56), dk); break;
          case DIO: c = mul(pk(C.dior, x, y, 57), dk); break;
          case GRA: c = mul(pk(C.gran, x >> 1, y, 58), dk); break;
          case GRAV: c = mul(pk(C.grav, x, y, 59), dk); break;
          case TUFF: c = mul(pk(C.tuff, x >> 1, y >> 1, 60), dk); break;
          case DEEP: c = mul(C.deep[(hash(x >> 2, y, 61) * 4) | 0], dk); break;
          case CALC: c = pk(C.calc, x, y, 62); break;
          case SBAS: c = pk(C.sbas, x >> 1, y >> 1, 63); break;
          case AMETH: c = pk(C.ameth, x, y, 64); break;
          case DRIP: c = mul(C.drip[(hash(x, y >> 1, 65) * 4) | 0], dk); break;
          case MOSS: c = pk(C.moss, x >> 1, y >> 1, 66); break;
          case BED: c = pk(C.bed, x >> 1, y >> 1, 67); break;
          case VOID: c = voidC; if (hash(x, y, 68) < .002) c = [66, 56, 88]; break;
          case CAVE: c = mul([44, 42, 44], 1 - depth * .2); break;
          case WATER: { let s = 0; while (s < 14 && get(x, y - s - 1) === WATER) s++; c = s === 0 ? C.waterH : mix(C.water, C.waterD, Math.min(1, s / 12)); if (s > 0 && s < 5 && hash(x >> 2, y, 69) < .07) c = mix(c, C.waterH, .35); break; }
          case LAVA: c = pk(C.lava, x >> 1, y >> 1, 70); if (hash(x >> 1, y >> 1, 71) < .06) c = C.lavaB; break;
          case NAIR: c = nairC; break;
          case RACK: c = pk(C.rack, x, y >> 1, 72); if (hash(x, y, 73) < .05) c = C.rackD; break;
          case BLACK: c = pk(C.black, x >> 1, y >> 1, 74); break;
          case BASALT: c = C.basalt[(hash(x, y >> 2, 75) * 3) | 0]; if (x % 4 === 0) c = mul(c, .88); break;
          case SOUL: c = pk(C.soul, x >> 1, y >> 1, 76); break;
          case CNYL: c = pk(C.cnyl, x, y, 77); break;
          case WNYL: c = pk(C.wnyl, x, y, 78); break;
          case MAGMA: c = pk(C.magma, x >> 1, y >> 1, 79); if (hash(x, y, 80) < .12) c = C.magmaB; break;
          case GLOW: c = pk(C.glow, x >> 1, y >> 1, 81); break;
          case NB: { const row = y >> 2, off = (row & 1) * 4, mortar = (y % 4 === 3) || ((x + off) % 8 === 7); c = mortar ? C.nbM : pk(C.nb, (x + off) >> 3, row, 82); break; }
          case CSTEM: c = C.cstem[(hash(x, y >> 1, 83) * 2) | 0]; break;
          case WSTEM: c = C.wstem[(hash(x, y >> 1, 84) * 2) | 0]; break;
          case CWART: c = pk(C.cwart, x >> 1, y >> 1, 85); break;
          case WWART: c = pk(C.wwart, x >> 1, y >> 1, 86); break;
          case SHROOM: c = C.shroom[(hash(x, y, 87) * 2) | 0]; break;
          default: c = [128, 128, 128];
        }
        const o = ore[k];
        if (o) { c = ORE[o]; if (hash(x, y, 88) < .3) c = mix(c, [255, 255, 255], .16); if (o < 9) c = mul(c, dk); }
        const i = k * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
    }

    /* ---------- пещеры: мягкий полумрак у стен ---------- */
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
      const k = y * W + x; if (mat[k] !== CAVE) continue;
      let n = 0;
      for (let r = 1; r <= 4; r++) { if (!AIR[mat[k - r]]) n++; if (!AIR[mat[k + r]]) n++; if (!AIR[mat[k - r * W]]) n++; if (!AIR[mat[k + r * W]]) n += 1.5; }
      const f = Math.min(1, n / 7), i = k * 4, wall = [92, 88, 84];
      d[i] = lerp(d[i], wall[0], f * .55); d[i + 1] = lerp(d[i + 1], wall[1], f * .55); d[i + 2] = lerp(d[i + 2], wall[2], f * .55);
    }

    /* ---------- светлые края сверху, тени снизу ---------- */
    for (let y = 2; y < H - 2; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x, m = mat[k]; if (AIR[m] || FLUID[m]) continue;
      let f = 1;
      if (AIR[mat[k - W]] || mat[k - W] === WATER) f = 1.16; else if (AIR[mat[k - 2 * W]]) f = 1.07;
      else if (AIR[mat[k + W]]) f = .76; else if (AIR[mat[k + 2 * W]]) f = .89;
      if (x > 0 && x < W - 1 && (AIR[mat[k - 1]] || AIR[mat[k + 1]])) f *= .92;
      if (f !== 1) { const i = k * 4; d[i] = Math.min(255, d[i] * f); d[i + 1] = Math.min(255, d[i + 1] * f); d[i + 2] = Math.min(255, d[i + 2] * f); }
    }

    /* ---------- рисование спрайтов ---------- */
    function px(x, y, c, a) {
      x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = (y * W + x) * 4;
      if (a === undefined || a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
      else { d[i] = lerp(d[i], c[0], a); d[i + 1] = lerp(d[i + 1], c[1], a); d[i + 2] = lerp(d[i + 2], c[2], a); }
    }
    const rect = (x, y, w, h, c, a) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c, a); };

    // облака: три формы, с объёмом и мягкой тенью снизу
    const CL = {
      big: { rx: 30, ry: 6, bumps: [[-18, -3, 8], [-6, -8, 11], [8, -9, 10], [20, -4, 7]] },
      mid: { rx: 19, ry: 5, bumps: [[-8, -4, 7], [3, -7, 8], [12, -3, 5]] },
      small: { rx: 13, ry: 3, bumps: [[-4, -3, 5], [5, -2, 4]] }
    };
    const cTop = hx("#ffffff"), cMid = hx("#eef2f7"), cBot = hx("#c9d4e2"), cRim = hx("#b5c2d3");
    function cloud(cx, cy, sp, u, flip) {
      const on = new Set(), pts = []; let minY = 99, maxY = -99;
      for (let j = -24; j <= 4; j++) for (let i = -sp.rx - 6; i <= sp.rx + 6; i++) {
        const ii = flip ? -i : i;
        let inside = j <= 3 && (ii * ii) / (sp.rx * sp.rx) + (j * j) / (sp.ry * sp.ry) <= 1;
        if (!inside) for (const [bx, by, br] of sp.bumps) if ((ii - bx) ** 2 + (j - by) ** 2 <= br * br) { inside = j <= 3; break; }
        if (inside) { on.add(i + "," + j); pts.push([i, j]); minY = Math.min(minY, j); maxY = Math.max(maxY, j); }
      }
      for (const [i, j] of pts) {
        const t = (j - minY) / ((maxY - minY) || 1);
        let c = t < .55 ? mix(cTop, cMid, t / .55) : mix(cMid, cBot, (t - .55) / .45);
        if (!on.has(i + "," + (j + 1))) c = cRim;
        else if (!on.has(i + "," + (j - 1))) c = mix(c, cTop, .7);
        rect(cx + i * u, cy + j * u, u, u, c, .93);
      }
    }
    cloud(Lx(.5), Math.round(surf * .6), CL.big, 2, false);
    cloud(Rx(.45), Math.round(surf * .52), CL.mid, 2, true);
    cloud(Rx(.16), Math.round(surf * .74), CL.small, 2, false);
    cloud(Math.round(W * .36), Math.round(surf * .7), CL.mid, 2, false);
    cloud(Math.round(W * .62), Math.round(surf * .48), CL.small, 2, true);
    cloud(Lx(.22), Math.round(surf * .82), CL.small, 2, true);

    // деревья: дуб, берёза, ель и куст — листва закрывает верх ствола
    function leafBlock(x0, y0, B, palette, t) {
      for (let j = 0; j < B; j++) for (let i = 0; i < B; i++) {
        let c = palette[(hash((x0 + i) >> 1, (y0 + j) >> 1, 95) * palette.length) | 0];
        if (hash(x0 + i, y0 + j, 96) < .1) c = mul(c, .74);
        if (i === 0 || j === 0) c = mul(c, 1.07);
        if (i === B - 1 || j === B - 1) c = mul(c, .88);
        px(x0 + i, y0 + j, mul(c, 1.06 - t * .16));
      }
    }
    function tree(type, x, s) {
      x = clamp(x, 6, W - 14);
      const gy = tY[x + 4], B = 8;
      if (get(x + 4, gy) === WATER || get(x + 4, gy) === SAND) return;
      let rows, trunk, logP, leafP, stripe;
      if (type === "oak") { rows = hash(s, 0, 90) < .5 ? [3, 3, 5, 5] : [3, 5, 5, 5, 3]; trunk = 5 + (hash(s, 1, 90) < .5 ? 0 : 1); logP = C.log; leafP = C.leaf; }
      else if (type === "birch") { rows = [3, 3, 3, 3]; trunk = 6 + (hash(s, 1, 90) < .5 ? 0 : 1); logP = C.blog; leafP = C.bleaf; stripe = true; }
      else if (type === "spruce") { rows = [1, 3, 1, 3, 5, 3, 5]; trunk = 7; logP = C.slog; leafP = C.sleaf; }
      else { rows = [3, 5]; trunk = 0; leafP = C.leaf; }
      const th = trunk * B;
      for (let y = gy - th; y < gy; y++) for (let i = 0; i < B; i++) {
        let c = logP[(hash(x + i, y >> 1, 93) * logP.length) | 0];
        if (stripe) { if (hash((x + i) >> 1, y >> 1, 92) < .13) c = C.bmark; } else if (i % 3 === 0) c = mul(c, .86);
        if (i === 0) c = mul(c, 1.08); if (i === B - 1) c = mul(c, .82);
        px(x + i, y, c);
      }
      const cover = type === "spruce" ? rows.length - 1 : type === "bush" ? 0 : 2;
      const top = gy - th - (rows.length - cover) * B;
      rows.forEach((wb, ri) => {
        const y0 = top + ri * B, x0 = x - ((wb - 1) / 2) * B;
        for (let b = 0; b < wb; b++) {
          const edge = (b === 0 || b === wb - 1) && wb > 1;
          if (edge && type !== "spruce" && hash(s * 7, ri, 94) < (ri === 0 ? .8 : ri === rows.length - 1 ? .45 : .15)) continue;
          leafBlock(x0 + b * B, y0, B, leafP, ri / rows.length);
        }
      });
    }
    const avoid = x => Math.abs(x - pondX) < pondR + 22;
    const trees = [["oak", Lx(.12)], ["birch", Lx(.95)], ["spruce", Rx(.14)], ["oak", Rx(.86)], ["birch", Math.round(W * .38)], ["oak", Math.round(W * .63)], ["bush", Math.round(W * .5)]];
    if (gut > 170) trees.push(["bush", Rx(.42)]);
    trees.forEach(([t, x], i) => { if (!avoid(x)) tree(t, x, i + 1); });

    // трава, цветы, папоротники
    for (let x = 2; x < W - 8;) {
      const inGut = !wide || x < gut || x > W - gut;
      x += inGut ? 4 + Math.floor(hash(x, 0, 97) * 7) : 9 + Math.floor(hash(x, 0, 97) * 14);
      const gy = tY[x]; if (get(x, gy) !== GRASS || get(x + 6, tY[x + 6]) !== GRASS) continue;
      const r = hash(x, 1, 97);
      if (r < .5) for (const [dx, h] of [[0, 3], [2, 5], [3, 4], [5, 6], [6, 3]]) for (let k = 1; k <= h; k++) px(x + dx, gy - k, k > h - 2 ? C.grass[3] : C.grass[2]);
      else if (r < .82) {
        const h = 4 + Math.floor(hash(x, 2, 97) * 4), col = FLOWERS[(hash(x, 3, 97) * FLOWERS.length) | 0];
        for (let k = 1; k <= h; k++) px(x + 1, gy - k, C.grassD[0]);
        px(x + 2, gy - 3, C.grass[2]); px(x, gy - 2, C.grass[2]);
        px(x, gy - h - 1, col); px(x + 2, gy - h - 1, col); px(x + 1, gy - h - 2, col); px(x + 1, gy - h, col);
        px(x + 1, gy - h - 1, col[0] > 220 && col[2] > 200 ? hx("#e2c24e") : mul(col, .7));
      } else {
        for (let k = 1; k <= 6; k++) { px(x + 3, gy - k, C.grassD[1]); if (k > 1 && k % 2 === 0) { px(x + 1, gy - k - 1, C.grass[2]); px(x + 2, gy - k, C.grass[2]); px(x + 4, gy - k, C.grass[2]); px(x + 5, gy - k - 1, C.grass[2]); } }
      }
    }

    // камыш и кувшинки у пруда
    for (const [cx, h] of [[pondX + pondR + 3, 20], [pondX + pondR + 6, 14]]) if (cx < W) for (let k = 1; k <= h; k++) { px(cx, tY[cx] - k, k % 5 === 0 ? hx("#7a9a52") : hx("#93b66a")); px(cx + 1, tY[cx] - k, hx("#86a85e")); }
    rect(pondX - 10, pondTop, 5, 1, hx("#5e8a3e")); rect(pondX + 7, pondTop, 4, 1, hx("#6a9446")); px(pondX - 8, pondTop - 1, hx("#e9a0b8"));

    // животные (свой рисунок): овцы, корова, курица
    function sheep(x, face, sc) {
      const gy = tY[clamp(x + 8, 0, W - 1)];
      const wool = hx("#e8e5de"), woolS = hx("#d1cdc4"), woolH = hx("#f6f4ef"), skin = hx("#c5b39d"), dark = hx("#3a3633"), leg = hx("#a8977f");
      for (const lx of [2, 5, 11, 14]) rect(x + lx, gy - 4, 2, 4, leg);
      for (let j = 0; j < 9; j++) for (let i = 0; i < 18; i++) {
        if ((j === 0 || j === 8) && (i < 2 || i > 15)) continue;
        if ((j === 1 || j === 7) && (i === 0 || i === 17)) continue;
        let c = j < 2 ? woolH : j > 6 ? woolS : wool; if (hash(x + i, j, 99) < .2) c = mul(c, .95);
        px(x + i, gy - 13 + j, c);
      }
      const hxp = face > 0 ? x + 15 : x - 3;
      for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) px(hxp + i, gy - 15 + j, j < 2 ? wool : skin);
      px(face > 0 ? hxp + 4 : hxp + 1, gy - 12, dark);
    }
    function cow(x, face) {
      const gy = tY[clamp(x + 10, 0, W - 1)];
      const b = hx("#5f4330"), bD = hx("#4a3323"), w = hx("#e4ded4"), sn = hx("#cfa38c"), hn = hx("#d9d2c2"), dark = hx("#2c2622");
      for (const lx of [2, 5, 15, 18]) { rect(x + lx, gy - 5, 2, 5, bD); px(x + lx, gy - 1, w); px(x + lx + 1, gy - 1, w); }
      for (let j = 0; j < 9; j++) for (let i = 0; i < 21; i++) {
        let c = f2((x + i) * .22, j * .3, 150) > .58 ? w : b; if (j === 8) c = mul(c, .9); if (j === 0) c = mul(c, 1.06);
        px(x + i, gy - 14 + j, c);
      }
      const hxp = face > 0 ? x + 19 : x - 5;
      for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) px(hxp + i, gy - 17 + j, j > 4 ? sn : (i + j) % 5 === 0 ? w : b);
      px(hxp, gy - 18, hn); px(hxp + 6, gy - 18, hn);
      px(face > 0 ? hxp + 5 : hxp + 1, gy - 14, dark);
      rect(face > 0 ? x + 6 : x + 12, gy - 5, 3, 1, hx("#d79a9a"));
    }
    function chicken(x, face) {
      const gy = tY[clamp(x + 3, 0, W - 1)];
      const wh = hx("#efece6"), sh = hx("#d6d2ca");
      rect(x + 2, gy - 2, 1, 2, hx("#d7a14a")); rect(x + 5, gy - 2, 1, 2, hx("#d7a14a"));
      for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) px(x + i, gy - 7 + j, j > 3 ? sh : wh);
      const h0 = face > 0 ? x + 6 : x - 2;
      rect(h0, gy - 10, 3, 4, wh); px(face > 0 ? h0 + 3 : h0 - 1, gy - 8, hx("#e0b048")); px(h0 + 1, gy - 11, hx("#c0473e")); px(face > 0 ? h0 + 2 : h0, gy - 9, hx("#2c2622"));
    }
    sheep(Lx(.26), 1);
    if (gut > 170) sheep(Lx(.82), -1);
    cow(Rx(.66), -1);
    chicken(Rx(.36), 1);

    // отложенные детали пещер и ада
    later.forEach(fn => fn());
    function bonesAt(cave) {
      const xs = Object.keys(cave.floor).map(Number); if (!xs.length) return;
      const x = xs[(xs.length / 2) | 0], y = cave.floor[x];
      const b = C.bone, s = C.boneS;
      rect(x, y - 3, 5, 4, b); px(x + 1, y - 2, s); px(x + 3, y - 2, s); rect(x + 1, y, 3, 1, s);
      rect(x + 7, y, 8, 1, b); px(x + 7, y - 1, b); px(x + 14, y - 1, b);
      rect(x - 9, y, 6, 1, s); px(x - 9, y - 1, b); px(x - 4, y - 1, b);
    }
    function mineshaft(cave) {
      const xs = Object.keys(cave.floor).map(Number).sort((a, b) => a - b); if (!xs.length) return;
      const pl = C.plank;
      for (let x = xs[0] + 4; x <= xs[xs.length - 1] - 2; x++) {
        const fy = cave.floor[x]; if (fy === undefined) continue;
        px(x, fy, C.rail); if (x % 4 === 0) px(x, fy, pl[1]); else px(x, fy - 1, mul(C.rail, 1.1));
      }
      for (let x = xs[0] + 14; x < xs[xs.length - 1] - 8; x += 26) {
        const fy = cave.floor[x], cy = cave.ceil[x]; if (fy === undefined || cy === undefined) continue;
        for (const ox of [-6, 5]) for (let y = cy; y <= fy; y++) { px(x + ox, y, pl[0]); px(x + ox + 1, y, pl[2]); }
        for (let i = -6; i <= 6; i++) { px(x + i, cy, pl[1]); px(x + i, cy + 1, pl[2]); }
      }
      const tx = xs[0] + 20, tcy = cave.ceil[tx], tfy = cave.floor[tx];
      if (tcy !== undefined && tfy !== undefined) {
        const ty0 = Math.round((tcy + tfy) / 2);
        rect(tx, ty0, 1, 3, pl[0]); px(tx, ty0 - 1, hx("#f2b552")); px(tx, ty0 - 2, hx("#f6d27a"));
        light(tx, ty0 - 1, 36, "#ffb25a", .42);
      }
      const wx = xs[xs.length - 1] - 10, wy = cave.ceil[wx];
      if (wy !== undefined) { const web = hx("#d8d8d8"); for (let k = 0; k < 7; k++) { px(wx + k, wy + 1 + (k >> 1), web, .6); px(wx + 3, wy + 1 + k, web, .5); px(wx + 6 - k, wy + 1 + (k >> 1), web, .5); } }
    }
    function lush(cave) {
      const vine = hx("#4f7a34"), berry = hx("#e6a24a");
      for (const x in cave.ceil) {
        if (hash(+x, 0, 160) > .12) continue;
        const y0 = cave.ceil[x], len = 5 + Math.floor(hash(+x, 1, 160) * 14);
        for (let k = 0; k < len; k++) { if (get(+x, y0 + k) !== CAVE) break; const isB = k % 5 === 4 && hash(+x, k, 161) < .5; px(+x, y0 + k, isB ? berry : vine); if (isB && hash(+x, k, 164) < .4) light(+x, y0 + k, 16, "#ffb060", .18); }
      }
      const xs = Object.keys(cave.floor).map(Number); if (!xs.length) return;
      const bx = xs[(xs.length * .35) | 0], by = cave.floor[bx];
      for (let j = 0; j < 7; j++) for (let i = -6; i <= 6; i++) if ((i * i) / 36 + ((j - 6) * (j - 6)) / 42 < 1) px(bx + i, by - j, hash(bx + i, j, 162) < .15 ? hx("#d98fae") : C.leaf[(hash(bx + i, j, 163) * 4) | 0]);
    }

    // души в долине: голубое пламя
    for (let x = Math.round(W * .39); x < W * .49; x += 24) {
      const y = topOf(x) - 1;
      for (let k = 0; k < 6; k++) for (let i = 0; i < 3 - (k > 3 ? 1 : 0); i++) px(x + i + (k > 3 ? 1 : 0) - 1, y - k, mix(hx("#4fb7d6"), hx("#bfeaf5"), k / 6));
      light(x, y - 3, 30, "#6ac6e8", .28);
    }
    // искры и пепел в воздухе ада
    for (let i = 0; i < Math.round(W * (lavaY - voidEnd) / 900); i++) {
      const x = Math.floor(hash(i, 0, 170) * W), y = voidEnd + Math.floor(hash(i, 1, 170) * (lavaY - voidEnd));
      if (get(x, y) === NAIR) px(x, y, hash(i, 2, 170) < .5 ? hx("#d98a4a") : hx("#8a7d78"), .8);
    }

    /* ---------- свет: лава, светокамень, факелы ---------- */
    for (const [lx, ly, r, col, str] of lights) {
      const r2 = r * r;
      for (let y = Math.max(0, ly - r); y < Math.min(H, ly + r); y++) for (let x = Math.max(0, lx - r); x < Math.min(W, lx + r); x++) {
        const dd2 = (x - lx) ** 2 + (y - ly) ** 2; if (dd2 >= r2) continue;
        let f = 1 - Math.sqrt(dd2) / r; f = f * f * str; if (!AIR[mat[y * W + x]]) f *= .55;
        const i = (y * W + x) * 4;
        d[i] = Math.min(255, d[i] + col[0] * f); d[i + 1] = Math.min(255, d[i + 1] * (1 + f * .2) + col[1] * f * .8); d[i + 2] = Math.min(255, d[i + 2] + col[2] * f * .6);
      }
    }

    ctx.putImageData(img, 0, 0);
    builtW = vw;
    onScroll();
  }

  /* ---------- прокрутка: фон едет медленнее страницы ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      cv.style.transform = "translate3d(0," + (-(Hs - window.innerHeight) * p) + "px,0)";
      ticking = false;
    });
  }
  build();
  window.addEventListener("scroll", onScroll, { passive: true });
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (Math.abs(window.innerWidth - builtW) > 40) build(); else onScroll(); }, 250);
  });
})();
