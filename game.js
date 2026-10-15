// GUERRA DE AREPAS - Platanus Hack 26: Arcade Challenge
// Las arepas defienden la mesa contra aguacates, caraotas y quesos.
// 1-2 jugadores. Todo generado por codigo: sprites, sonido y musica.

const W = 800;
const H = 600;
const R = Math.random;
const B = Phaser.Math.Between;
const YL = '#f2ff00';

// Arcade cabinet button -> keyboard key mapping. DO NOT modify (matches the cabinet wiring).
const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u'], P1_2: ['i'], P1_3: ['o'],
  P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r'], P2_2: ['t'], P2_3: ['y'],
  P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter', 'p'], START2: ['2'],
};

const KEY_TO_ARCADE = {};
for (const [code, keys] of Object.entries(CABINET_KEYS)) {
  for (const key of keys) KEY_TO_ARCADE[key.length === 1 ? key.toLowerCase() : key] = code;
}

const held = Object.create(null);
let onPress = () => {};
const kcode = (e) => KEY_TO_ARCADE[e.key.length === 1 ? e.key.toLowerCase() : e.key];
window.addEventListener('keydown', (e) => {
  const c = kcode(e);
  if (!c) return;
  if (e.preventDefault) e.preventDefault();
  try { AC.resume(); } catch (x) {}
  if (!held[c]) onPress(c);
  held[c] = true;
});
window.addEventListener('keyup', (e) => {
  const c = kcode(e);
  if (c) held[c] = false;
});

// --- Storage (arcade bridge, localStorage fallback) ---
function getStorage() {
  if (window.platanusArcadeStorage) return window.platanusArcadeStorage;
  return {
    async get(key) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null ? { found: false, value: null } : { found: true, value: JSON.parse(raw) };
      } catch (e) { return { found: false, value: null }; }
    },
    async set(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    },
  };
}
let HI = 0;
try {
  getStorage().get('arepas-hi').then((r) => {
    if (r && r.found && r.value && typeof r.value.s === 'number') HI = r.value.s;
  });
} catch (e) {}

// --- Audio ---
const AC = new (window.AudioContext || window.webkitAudioContext)();
const sfx = (f, d, ty = 'square', v = 0.05, s = -0.5) => {
  try {
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = ty;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f * (1 + s)), t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(AC.destination);
    o.start();
    o.stop(t + d);
  } catch (e) {}
};
const boom = (d = 0.3, v = 0.12) => {
  try {
    const n = (AC.sampleRate * d) | 0, b = AC.createBuffer(1, n, AC.sampleRate), c = b.getChannelData(0);
    for (let i = 0; i < n; i++) c[i] = (R() * 2 - 1) * (1 - i / n);
    const s = AC.createBufferSource(), g = AC.createGain();
    g.gain.value = v;
    s.buffer = b;
    s.connect(g).connect(AC.destination);
    s.start();
  } catch (e) {}
};

const T = (o, x, y, s, sz = 16, c = '#fff') =>
  o.add.text(x, y, s, { fontFamily: 'monospace', fontStyle: 'bold', fontSize: sz + 'px', color: c, align: 'center' }).setDepth(50);

// --- Sprites (pixel art en strings) ---
const PAL = {
  Y: 0xf2c14e, T: 0xc98a2b, K: 0x1a0f00, W: 0xffffff, G: 0x4ade4a, D: 0x1c6b1c,
  M: 0x7a3b1a, U: 0x8b5fbf, Q: 0xffe95c, R: 0xe63946, L: 0xff6fb5, Z: 0xb03a7a,
  O: 0xd9a406, A: 0x6b3a14, N: 0xbbbbbb, S: 0x9be8ff, E: 0x9acd32, X: 0x2a1838, H: 0xc9a7ff,
};
const SPR = {
  bala: ['..UUUUU..', '.UHHXXXU.', 'URRXXXRRU', 'UXWRXRWXU', 'UXXXXXXXU', 'UXWKWKWXU', '.UXKKKXU.', '..UUUUU..'],
  iv: ['.QQQ.', 'OYYYO', 'OYYYO', 'OYYYO', 'OYYYO', 'OYYYO', 'OYYYO', 'OYYYO', 'OYYYO', 'OYYYO', '.OOO.'],
  ip: ['SSSSSSSS', 'SOOOOOOS', 'SOOEEOOS', 'SOOEEOOS', 'SOOOOOOS', 'SOOOOOOS', '.SOOOOS.', '.SSSSSS.'],
  iq: ['....OOOOOOO', '..OOQQQQQQO', 'OOQQQQKQQQO', 'OQQQQQQQQQO', 'OQQKQQQQQQO', 'OQQQQQQKQQO', 'OOOOOOOOOOO'],
  im: ['..YYY..', '..AAA..', '.AAAAA.', 'AAWAAAA', 'AAWAAAA', 'AAAAAAA', 'AAYYYAA', 'AAYYYAA', 'AAAAAAA', '.AAAAA.'],
  ig: ['..GGGGGGG..', '.GGGGWGGGG.', 'GGGGGGGGGGG', 'WWWWWWWWWWW', '.WWWWWWWWW.', '..NNNNNNN..'],
  arepa: ['....TTTTTTT....', '..TTYYYYYYYTT..', '.TYYYTYYYYYYYT.', 'TYYYKYYYYYKYYYT', 'TYYYKYYYYYKYYYT', 'TYTYYYYYYYYYTYT', 'TOQQQQQQQQQQQOT', 'TYOOOOOOOOOOOYT', 'TYYYYYTYYYYYYYT', '.TYYYYYYYYTYYT.', '..TTYYYYYYYTT..', '....TTTTTTT....'],
  aguacate: ['...DDD...', '..DGGGD..', '.DGGGGGD.', '.DGKGKGD.', 'DGGGGGGGD', 'DGGMMMGGD', 'DGGMMMGGD', '.DGGGGGD.', '..DDDDD..'],
  caraota: ['...UUUUUUU...', '.UUHHHXXXXUU.', 'UXRRXXXXXRRXU', 'UXXWRXXXRWXXU', 'UXXXXXXXXXXXU', 'UXXWKWKWKWXXU', '.UXXKKKKKXXU.', '..UUXXXXXUU..', '....UUUUU....'],
  queso: ['..QQQQQQQQ..', '.QQQQQQQQQQ.', 'QQQKQQQQKQQQ', 'QQQQQQQQQQQQ', 'QQ.QQQQQQ.QQ', '.QQQQQQQQQQ.', '..QQQQQQQQ..'],
  boss: ['..Y..Y..YY..Y..Y', '..YYYYYYYYYYYY..', '....DDDDDDDD....', '...DGGGGGGGGD...', '..DGGGGGGGGGGD..', '.DGGKGGGGGGKGGD.', '.DGGGGGGGGGGGGD.', 'DGGGGGWWWWGGGGGD', 'DGGGGGGGGGGGGGGD', 'DGGGGMMMMMMGGGGD', '.DGGGMMMMMMGGGD.', '..DGGGMMMMGGGD..', '...DDDDDDDDDD...'],
};
function mk(sc, k, rows, s, map) {
  const g = sc.make.graphics({ add: false });
  rows.forEach((r, y) => [...r].forEach((c, x) => {
    c = (map && map[c]) || c;
    if (PAL[c] !== undefined) { g.fillStyle(PAL[c]); g.fillRect(x * s, y * s, s, s); }
  }));
  g.generateTexture(k, rows[0].length * s, rows.length * s);
  g.destroy();
}
const THEMES = [
  { bg: 0x050500, g: 0xf2ff00 }, { bg: 0x0b0418, g: 0xb14cff }, { bg: 0x00141a, g: 0x00f0ff },
  { bg: 0x1a0a00, g: 0xff8a00 }, { bg: 0x03140a, g: 0x4ade4a }, { bg: 0x18040c, g: 0xff3d7f },
];
const lc = (a, b, k) => {
  const f = (sh) => { const x = (a >> sh) & 255, y = (b >> sh) & 255; return (x + (y - x) * k) | 0; };
  return (f(16) << 16) | (f(8) << 8) | f(0);
};
function face(g, cx, cy, s) {
  g.fillStyle(0xffffff); g.fillCircle(cx - 20 * s, cy, 11 * s); g.fillCircle(cx + 20 * s, cy, 11 * s);
  g.fillStyle(0xe63946); g.fillCircle(cx - 16 * s, cy + 2 * s, 6 * s); g.fillCircle(cx + 16 * s, cy + 2 * s, 6 * s);
  g.fillStyle(0x000000); g.fillCircle(cx - 16 * s, cy + 2 * s, 2.5 * s); g.fillCircle(cx + 16 * s, cy + 2 * s, 2.5 * s);
  g.lineStyle(5 * s, 0x000000);
  g.lineBetween(cx - 34 * s, cy - 18 * s, cx - 8 * s, cy - 6 * s); g.lineBetween(cx + 34 * s, cy - 18 * s, cx + 8 * s, cy - 6 * s);
  g.fillStyle(0x000000); g.fillRect(cx - 30 * s, cy + 18 * s, 60 * s, 24 * s);
  g.fillStyle(0xffffff);
  for (let i = 0; i < 5; i++) g.fillRect(cx - 28 * s + i * 12 * s, cy + 18 * s, 8 * s, 10 * s);
  for (let i = 0; i < 4; i++) g.fillRect(cx - 22 * s + i * 12 * s, cy + 32 * s, 8 * s, 10 * s);
}
function mkBoss(sc) {
  const g = sc.make.graphics({ add: false });
  // 1: El Domino - caraota gigante con ficha de queso
  g.fillStyle(0x2a1838); g.fillEllipse(90, 80, 170, 120);
  g.lineStyle(6, 0x8b5fbf); g.strokeEllipse(90, 80, 170, 120);
  g.fillStyle(0x6a4a8a); g.fillEllipse(60, 42, 60, 24);
  g.fillStyle(0xffffff); g.fillRect(60, 0, 60, 30);
  g.fillStyle(0x000000); g.fillRect(88, 0, 4, 30);
  [[70, 8], [70, 22], [78, 15], [102, 8], [110, 22], [106, 15]].forEach((p) => g.fillCircle(p[0], p[1], 3));
  face(g, 90, 80, 1.1);
  g.generateTexture('boss1', 180, 150); g.clear();
  // 2: La Pelua - arepa con pelo de carne mechada y queso
  g.fillStyle(0xc98a2b); g.fillCircle(100, 92, 76);
  g.fillStyle(0xf2c14e); g.fillCircle(100, 92, 68);
  for (let i = 0; i < 22; i++) {
    g.lineStyle(5, i % 2 ? 0xb5463a : 0x7a3b1a);
    g.lineBetween(36 + i * 6.5, 40, 26 + i * 7.6 + (i % 3) * 5, 4 + (i % 4) * 7);
  }
  g.fillStyle(0xffe95c); g.fillRect(24, 112, 28, 40); g.fillRect(150, 112, 26, 52); g.fillRect(70, 150, 20, 20);
  face(g, 100, 96, 1.2);
  g.generateTexture('boss2', 200, 172); g.clear();
  // 3: El Pabellon - plato con arroz, caraotas, platano y carne
  g.fillStyle(0xffffff); g.fillEllipse(120, 118, 230, 90);
  g.fillStyle(0xbbbbbb); g.fillEllipse(120, 126, 190, 60);
  g.fillStyle(0xffffff); g.fillEllipse(62, 84, 84, 62);
  g.fillStyle(0x2a1838); g.fillEllipse(118, 76, 90, 70); g.lineStyle(3, 0x8b5fbf); g.strokeEllipse(118, 76, 90, 70);
  g.fillStyle(0xffe95c); g.fillRect(168, 56, 56, 60);
  g.fillStyle(0xd9a406); for (let i = 0; i < 4; i++) g.fillRect(172 + i * 13, 56, 6, 60);
  g.fillStyle(0x7a3b1a); g.fillEllipse(110, 30, 100, 44);
  g.lineStyle(4, 0xb5463a); for (let i = 0; i < 8; i++) g.lineBetween(70 + i * 11, 20, 76 + i * 11, 40);
  face(g, 118, 86, 1.1);
  g.generateTexture('boss3', 240, 160);
  g.destroy();
}
const BN = ['LA REINA PEPIADA', 'EL DOMINO', 'LA PELUA', 'EL PABELLON'];
const EXC = ['EPA!', 'QUE FUERTE!', 'CHEVERE!', 'AGUANTE!', 'ARREPENTIDO!', 'DALE PUES!'];

class Menu extends Phaser.Scene {
  constructor() { super('menu'); }
  create() {
    const o = this;
    if (!o.textures.exists('ship')) {
      mk(o, 'ship', SPR.arepa, 3);
      mk(o, 'ship2', SPR.arepa, 3, { Y: 'L', T: 'Z' });
      mk(o, 'drone', SPR.aguacate, 4);
      mk(o, 'zig', SPR.caraota, 3);
      mk(o, 'tank', SPR.queso, 4);
      mk(o, 'boss0', SPR.boss, 5);
      mkBoss(o);
      mk(o, 'iq', SPR.iq, 4);
      mk(o, 'im', SPR.im, 4);
      mk(o, 'ig', SPR.ig, 4);
      mk(o, 'iv', SPR.iv, 4);
      mk(o, 'eb', SPR.bala, 3);
      mk(o, 'ip', SPR.ip, 4);
      const g = o.make.graphics({ add: false });
      g.fillStyle(0xffffff); g.fillRect(0, 0, 2, 2); g.generateTexture('px', 2, 2); g.clear();
      g.fillStyle(0xc98a2b); g.fillCircle(6, 6, 6); g.fillStyle(0xf2c14e); g.fillCircle(6, 6, 4.5); g.generateTexture('pb', 12, 12); g.clear();
      g.fillStyle(0x000000, 0.55); g.fillRect(0, 0, 4, 2); g.fillRect(0, 0, 2, 4); g.generateTexture('scan', 4, 4);
      g.destroy();
    }
    o.stars = [];
    for (let i = 0; i < 70; i++) {
      const s = o.add.image(B(0, W), B(0, H), 'px').setAlpha(0.2 + R() * 0.8);
      s.sv = 30 + R() * 120;
      o.stars.push(s);
    }
    o.add.tileSprite(0, 0, W, H, 'scan').setOrigin(0).setDepth(100);
    T(o, W / 2, 95, 'GUERRA DE AREPAS', 56, YL).setOrigin(0.5).setStroke('#4a4f00', 8);
    T(o, W / 2, 160, '100 HACKERS - 36 HORAS - 3-5 POR EQUIPO - ONLY CRACKS @ CARACAS', 13, YL).setOrigin(0.5);
    [['ship', 300], ['ship2', 500]].forEach(([k, x], i) => {
      const s = o.add.image(x, 235, k).setScale(2.5);
      o.tweens.add({ targets: s, y: 250, yoyo: true, repeat: -1, duration: 800 + i * 150, ease: 'sine.inOut' });
    });
    T(o, W / 2, 310, 'LAS AREPAS DEFIENDEN LA MESA CONTRA AGUACATES, CARAOTAS Y QUESOS', 15, '#ccc').setOrigin(0.5);
    T(o, W / 2, 352, 'JOYSTICK: MOVER - DISPARO AUTOMATICO\nBOTON 1/2: GUASACACA (BOMBA) - BOTON 3-6: AREPAZO\nSTART / PAUSE: PAUSAR EL JUEGO', 14, '#aaa').setOrigin(0.5);
    [['iq', 110, 'QUESO\nARMA +1'], ['im', 255, 'MALTA\nESCUDO'], ['ig', 400, 'GUASACACA\nBOMBA'], ['iv', 545, 'TEQUENO\n+1 VIDA'], ['ip', 690, 'PAPELON\nCADENCIA x2']].forEach(([k, x, l], i) => {
      const im = o.add.image(x, 430, k);
      o.tweens.add({ targets: im, y: 440, angle: 8, yoyo: true, repeat: -1, duration: 600 + i * 120, ease: 'sine.inOut' });
      T(o, x, 470, l, 12, '#8f8').setOrigin(0.5, 0);
    });
    o.pr = T(o, W / 2, 525, '>> START 1: UN JUGADOR  -  START 2: DOS JUGADORES <<', 20, YL).setOrigin(0.5);
    o.hi = T(o, W / 2, 575, '', 14, '#f6f').setOrigin(0.5);
    o.tweens.add({ targets: o.pr, alpha: 0.3, yoyo: true, repeat: -1, duration: 500 });
    onPress = (c) => {
      if (c === 'START2') o.scene.start('play', { n: 2 });
      else if (c === 'START1' || c === 'P1_1' || c === 'P1_2' || c === 'P1_3') o.scene.start('play', { n: 1 });
      else if (c === 'P2_1' || c === 'P2_2' || c === 'P2_3') o.scene.start('play', { n: 2 });
    };
  }
  update(t, dt) {
    for (const s of this.stars) { s.y += s.sv * dt / 1000; if (s.y > H) { s.y = 0; s.x = B(0, W); } }
    this.hi.setText('HI ' + String(HI).padStart(6, '0'));
  }
}

class Play extends Phaser.Scene {
  constructor() { super('play'); }
  init(d) { this.n = (d && d.n) || 1; }
  create() {
    const o = this, n = o.n;
    Object.assign(o, { sc: 0, lives: n == 2 ? 4 : 3, wave: 1, kills: 0, combo: 0, lk: -9999, bm: 1, over: false, paused: false, ch: 0, gt: 0, boss: null, nf: 0, ns: 1500, step: 0, t0: 0, pb: [], gb: [], en: [], eb: [], pu: [] });
    o.bg = o.add.graphics();
    o.bgc = THEMES[0].bg;
    o.gc = THEMES[0].g;
    o.stars = [];
    for (let i = 0; i < 80; i++) {
      const s = o.add.image(B(0, W), B(0, H), 'px').setAlpha(0.2 + R() * 0.8).setScale(R() < 0.2 ? 2 : 1);
      s.sv = 40 + R() * 180;
      o.stars.push(s);
    }
    o.ps = [
      { pre: 'P1_', key: 'ship', c: 0x4ade4a },
      { pre: 'P2_', key: 'ship2', c: 0xff6fb5 },
    ].slice(0, n).map((p, i) => {
      p.s = o.add.image(n == 2 ? (i ? 520 : 280) : W / 2, H - 70, p.key).setDepth(5);
      return Object.assign(p, { pw: 1, sh: 0, inv: 0, nf: 0, rf: 0 });
    });
    o.fx = o.add.graphics().setDepth(6);
    o.em = o.add.particles(0, 0, 'px', { speed: { min: 60, max: 320 }, lifespan: { min: 300, max: 750 }, scale: { start: 3, end: 0 }, tint: [0xf2c14e, 0x4ade4a, 0xffe95c, 0xffffff], emitting: false }).setDepth(7);
    o.add.tileSprite(0, 0, W, H, 'scan').setOrigin(0).setDepth(100);
    o.hs = T(o, 14, 8, '', 20, YL);
    o.hh = T(o, W - 14, 8, '', 15, '#f6f').setOrigin(1, 0);
    o.hl = T(o, 14, H - 30, '', 18, '#ff9d3a');
    o.hc = T(o, W / 2, 40, '', 22, YL).setOrigin(0.5, 0);
    o.hb = T(o, W - 14, H - 30, '', 16, '#4ade4a').setOrigin(1, 0);
    o.hq = T(o, W / 2, H - 46, '', 13, '#ff9d3a').setOrigin(0.5);
    o.rd = T(o, W / 2, H - 110, 'AREPAZO LISTO!\nPRESIONA B3', 24, YL).setOrigin(0.5).setStroke('#000', 6).setVisible(false);
    T(o, W / 2, 6, 'START / PAUSE', 14, '#ddd').setOrigin(0.5, 0);
    o.pov = o.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(119).setVisible(false);
    o.pt = T(o, W / 2, H / 2, 'PAUSA\n\nSTART / PAUSE PARA SEGUIR', 40, YL).setOrigin(0.5).setStroke('#000', 6).setDepth(120).setVisible(false);
    onPress = (c) => {
      if (o.over) {
        if (o.gt > o.t0 + 900) o.scene.restart({ n: o.n });
        return;
      }
      if (c === 'START1' || c === 'START2') { o.pause(); return; }
      if (!o.paused && /^P[12]_[12]$/.test(c)) o.bomb();
      else if (!o.paused && /^P[12]_[3-6]$/.test(c)) o.special();
    };
    o.time.addEvent({ delay: 135, loop: true, callback: () => {
      if (o.over) return;
      const m = [55, 55, 82, 55, 65, 55, 98, 82], i = o.step++ % 8;
      sfx(m[i] * (o.wave > 8 ? 2 : 1), 0.12, 'triangle', 0.07, -0.2);
      if (i % 4 == 2) sfx(1800, 0.03, 'square', 0.012, -0.9);
    } });
    o.banner('LISTO? OLEADA 1');
    const lg = T(o, W / 2, H - 160, 'B1/B2: GUASACACA  -  B3-B6: AREPAZO (BARRA ABAJO)  -  START / PAUSE: PAUSA', 14, '#fff').setOrigin(0.5).setStroke('#000', 4);
    o.tweens.add({ targets: lg, alpha: 0, delay: 6000, duration: 1000, onComplete: () => lg.destroy() });
  }
  pause() {
    const o = this;
    o.paused = !o.paused;
    o.time.paused = o.paused;
    if (o.paused) o.tweens.pauseAll(); else o.tweens.resumeAll();
    o.pt.setVisible(o.paused);
    o.pov.setVisible(o.paused);
    sfx(o.paused ? 300 : 600, 0.15, 'square', 0.06, o.paused ? -0.4 : 0.4);
  }
  banner(m, c = YL) {
    const t = T(this, W / 2, H / 2 - 40, m, 38, c).setOrigin(0.5).setStroke('#000', 6);
    this.tweens.add({ targets: t, scale: 1.4, alpha: 0, duration: 1600, onComplete: () => t.destroy() });
  }
  pop(x, y, m, c = '#fff') {
    const t = T(this, x, y, m, 14, c).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }
  boom(x, y, n) { this.em.explode(n, x, y); boom(n > 30 ? 0.8 : 0.25, n > 30 ? 0.25 : 0.1); }
  ef(x, y, a, sp) {
    const b = this.add.image(x, y, 'eb').setDepth(4);
    b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
    this.eb.push(b);
  }
  tgt() {
    const l = this.ps.filter((p) => p.s.visible);
    return l[B(0, l.length - 1)] || this.ps[0];
  }
  shoot(pl) {
    const o = this, p = pl.s, L = [[0], [-8, 8], [-10, 0, 10], [-0.3, -0.12, 0, 0.12, 0.3]][pl.pw - 1];
    L.forEach((v) => {
      const a = pl.pw == 4 ? v : (pl.pw == 3 ? v * 0.012 : 0);
      const b = o.add.image(p.x + (pl.pw == 4 ? 0 : v), p.y - 20, 'pb').setDepth(4);
      b.vx = Math.sin(a) * 640; b.vy = -Math.cos(a) * 640;
      o.pb.push(b);
    });
    sfx(700, 0.06, 'square', 0.02, -0.5);
  }
  spawn(k, x, y, amp) {
    const o = this, w = o.wave, r = R();
    k = k || (r < 0.2 && w >= 3 ? 'tank' : r < 0.5 && w >= 2 ? 'zig' : 'drone');
    x = x === undefined ? B(50, W - 50) : x;
    const e = o.add.image(x, y === undefined ? -30 : y, k).setDepth(3);
    Object.assign(e, {
      x0: x, a: 0, k, hp: k == 'tank' ? 5 : 1,
      vy: k == 'tank' ? 55 : k == 'zig' ? 140 : 90 + w * 7,
      pts: k == 'tank' ? 300 : k == 'zig' ? 150 : 100,
      amp: amp === undefined ? (k == 'zig' ? 90 : k == 'drone' ? 50 : 0) : amp,
      nf: o.gt + B(700, 2200),
    });
    o.en.push(e);
  }
  vform() {
    const cx = B(180, W - 180);
    for (let i = 0; i < 5; i++) this.spawn('drone', cx + (i - 2) * 56, -30 - Math.abs(i - 2) * 44, 0);
  }
  wall() {
    const gap = B(1, 6);
    for (let i = 0; i < 9; i++) if (i != gap && i != gap + 1) this.spawn('drone', 40 + i * 90, -30, 0);
  }
  spawnBoss() {
    const o = this, k = (o.wave / 4 - 1) | 0, i = k % 4, e = o.add.image(W / 2, -90, 'boss' + i).setDepth(3).setScale(1 + 0.12 * (k >> 2));
    Object.assign(e, { x0: W / 2, a: 0, k: 'boss', hp: (40 + o.wave * 8) * (o.n == 2 ? 1.7 : 1), pts: 5000, nf: 0, n: 0, ph: 0, sp: 0 });
    e.mh = e.hp;
    o.boss = e; o.en.push(e);
    o.banner('!! ' + BN[i] + ' !!', '#ff6b6b');
    sfx(80, 0.8, 'sawtooth', 0.1, 1);
  }
  bossAtk(e) {
    const o = this, p = o.tgt().s, ph = e.ph, a0 = e.a;
    const pats = [['ring', 'giant', 'fan'], ['spiral', 'giant', 'ring', 'wall'], ['spiral', 'giant', 'wall', 'fan', 'giant', 'ring']][ph];
    const k = pats[e.n++ % pats.length];
    if (k == 'giant') {
      sfx(90, 0.7, 'sawtooth', 0.1, 1.5);
      o.banner('!! CARAOTA GIGANTE !!', '#ff6b6b');
      for (let i = 0; i < 6; i++) o.time.delayedCall(i * 110, () => { if (e.active) { if (i & 1) e.clearTint(); else e.setTintFill(0xff3333); } });
      o.time.delayedCall(700, () => {
        if (!e.active || o.over) return;
        e.clearTint();
        const t = o.tgt().s, an = Math.atan2(t.y - e.y, t.x - e.x);
        for (const d of (ph == 2 ? [-0.4, 0, 0.4] : [0])) o.giant(e.x, e.y + 40, an + d, 115 + ph * 25, 10 + ph * 5);
      });
    } else if (k == 'ring') {
      const c = 10 + ph * 4;
      for (let i = 0; i < c; i++) o.ef(e.x, e.y + 20, i / c * 6.283 + a0, 150 + ph * 20);
    } else if (k == 'fan') {
      const b = Math.atan2(p.y - e.y, p.x - e.x);
      for (let j = -2; j <= 2; j++) o.ef(e.x, e.y + 20, b + j * 0.2, 270);
    } else if (k == 'spiral') {
      for (let i = 0; i < 10; i++) o.time.delayedCall(i * 90, () => { if (e.active && !o.over) o.ef(e.x, e.y + 20, a0 + i * 0.55, 190); });
    } else {
      const g = B(1, 14);
      for (let i = 0; i < 16; i++) if (Math.abs(i - g) > 1) o.ef(25 + i * 50, e.y + 30, Math.PI / 2, 150);
    }
    sfx(150, 0.2, 'sawtooth', 0.06, -0.5);
  }
  giant(x, y, an, sp, hp) {
    const b = this.add.image(x, y, 'eb').setScale(3.6).setDepth(4);
    Object.assign(b, { vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, hp, mh: hp });
    this.gb.push(b);
    sfx(140, 0.3, 'square', 0.08, -0.6);
  }
  splitGiant(g, kill) {
    const o = this;
    if (g.dead) return;
    g.dead = 1;
    o.boom(g.x, g.y, 30);
    if (!kill) return;
    for (let i = 0; i < 10; i++) o.ef(g.x, g.y, i / 10 * 6.283 + R(), 140);
    o.sc += 500;
    o.charge(8);
    o.pop(g.x, g.y, '+500', YL);
  }
  pick() {
    const r = R();
    return r < 0.3 ? 'Q' : r < 0.5 ? 'M' : r < 0.66 ? 'G' : r < 0.8 ? 'V' : 'P';
  }
  drop(x, y, ty) {
    const u = this.add.image(x, y, { Q: 'iq', M: 'im', G: 'ig', V: 'iv', P: 'ip' }[ty]).setDepth(4);
    Object.assign(u, { ty, bx: x, ph: R() * 6, sp: 0 });
    this.pu.push(u);
  }
  hit(e, d) {
    const o = this;
    e.hp -= d;
    if (e.hp <= 0) return o.kill(e);
    e.setTintFill(0xffffff);
    o.time.delayedCall(60, () => {
      if (e.active) e.clearTint();
    });
    sfx(200, 0.05, 'square', 0.04);
  }
  kill(e) {
    const o = this, t = o.gt;
    if (e.dead) return;
    e.dead = 1;
    const big = e.k == 'boss';
    o.boom(e.x, e.y, big ? 90 : 16);
    if (big) o.cameras.main.shake(500, 0.02);
    o.combo = t - o.lk < 2000 ? o.combo + 1 : 1;
    o.lk = t;
    o.charge(big ? 50 : e.k == 'tank' ? 10 : 4);
    const m = 1 + Math.min(7, o.combo >> 2), p = e.pts * m;
    o.sc += p;
    o.pop(e.x, e.y, '+' + p, m > 1 ? YL : '#fff');
    if (o.combo % 8 == 0) o.banner(EXC[B(0, EXC.length - 1)], '#ff9d3a');
    if (big) {
      o.boss = null;
      ['Q', 'V', 'G', 'P'].forEach((c, i) => o.drop(e.x + (i - 1.5) * 60, e.y, c));
      o.banner('JEFE EN EL PLATO!', '#4ade4a');
    } else {
      if (R() < (e.k == 'tank' ? 0.2 : 0.07)) o.drop(e.x, e.y, o.pick());
      if (!o.boss && ++o.kills >= 10 + o.wave * 3) {
        o.kills = 0; o.wave++;
        o.banner('OLEADA ' + o.wave);
        if (o.wave % 4 == 0) o.spawnBoss();
      }
    }
  }
  charge(n) {
    const o = this, was = o.ch >= 100;
    o.ch = Math.min(100, o.ch + n);
    if (!was && o.ch >= 100) {
      o.cameras.main.flash(220, 242, 255, 0);
      o.ps.forEach((pl) => o.em.explode(30, pl.s.x, pl.s.y));
      [523, 659, 784, 1047].forEach((f, i) => o.time.delayedCall(i * 90, () => sfx(f, 0.18, 'square', 0.07, 0.02)));
      const t = T(o, W / 2, H / 2 - 60, 'AREPAZO LISTO!', 54, YL).setOrigin(0.5).setStroke('#000', 8).setDepth(130);
      o.tweens.add({ targets: t, scale: 1.25, yoyo: true, repeat: 3, duration: 220 });
      o.tweens.add({ targets: t, alpha: 0, delay: 1800, duration: 500, onComplete: () => t.destroy() });
    }
  }
  special() {
    const o = this;
    if (o.over || o.paused || o.ch < 100) return;
    o.ch = 0;
    o.cameras.main.flash(120, 255, 230, 120);
    o.cameras.main.shake(400, 0.012);
    sfx(220, 0.8, 'sawtooth', 0.12, 3);
    boom(0.6, 0.2);
    o.banner('AREPAZO!', '#ffe95c');
    for (let i = 0; i < 18; i++) {
      o.time.delayedCall(i * 45, () => {
        if (o.over) return;
        const b = o.add.image(30 + i * 42, H + 10, 'pb').setScale(3).setDepth(4);
        Object.assign(b, { vx: 0, vy: -760, pr: 1, hs: new Set() });
        o.pb.push(b);
      });
    }
  }
  bomb() {
    const o = this;
    if (o.over || o.bm < 1) return;
    o.bm--;
    o.cameras.main.flash(300, 120, 255, 120);
    o.cameras.main.shake(300, 0.015);
    sfx(60, 0.9, 'sawtooth', 0.15, 3);
    boom(1, 0.3);
    o.eb.forEach((b) => { b.dead = 1; o.em.explode(2, b.x, b.y); });
    o.gb.forEach((g) => o.splitGiant(g, false));
    o.en.slice().forEach((e) => o.hit(e, e.k == 'boss' ? 12 : 99));
  }
  hurt(pl) {
    const o = this, t = o.gt;
    if (t < pl.inv || o.over) return;
    if (pl.sh > 0) { pl.sh--; pl.inv = t + 700; sfx(300, 0.2, 'sine', 0.1, 1); o.cameras.main.shake(100, 0.008); return; }
    o.lives--;
    pl.pw = Math.max(1, pl.pw - 1);
    o.combo = 0;
    pl.inv = t + 1800;
    o.boom(pl.s.x, pl.s.y, 40);
    o.cameras.main.shake(300, 0.02);
    if (o.lives <= 0) {
      o.over = true; o.t0 = t;
      o.ps.forEach((p) => p.s.setVisible(false));
      const h = Math.max(HI, o.sc), rk = o.sc >= 80000 ? 'S' : o.sc >= 40000 ? 'A' : o.sc >= 15000 ? 'B' : o.sc >= 5000 ? 'C' : 'D';
      HI = h;
      try { getStorage().set('arepas-hi', { s: h }); } catch (e) {}
      T(o, W / 2, H / 2, 'SE ACABARON LAS AREPAS\n\nSCORE ' + String(o.sc).padStart(6, '0') + '   OLEADA ' + o.wave + '\nHI    ' + String(h).padStart(6, '0') + '   RANGO ' + rk + (o.sc >= h ? '\n\nNUEVO RECORD!' : '') + '\n\nPRESIONA UN BOTON', 26, '#ff9d3a').setOrigin(0.5).setStroke('#000', 6).setDepth(120);
    }
  }
  update(time, dt) {
    const o = this;
    if (o.paused) return;
    const d = Math.min(dt, 50), s = d / 1000, t = (o.gt += d);
    const th = THEMES[(o.wave - 1 + (o.boss ? o.boss.ph : 0)) % THEMES.length], kk = Math.min(1, s * 1.5);
    o.bgc = lc(o.bgc, th.bg, kk);
    o.gc = lc(o.gc, th.g, kk);
    o.cameras.main.setBackgroundColor(o.bgc);
    o.bg.clear().fillStyle(o.gc, 0.07).fillCircle(W / 2, H * 0.28, 150 + 10 * Math.sin(t / 700));
    o.bg.lineStyle(1, o.gc, 0.22);
    const ph = (t / 1800) % 1;
    for (let i = 0; i < 12; i++) { const f = (i + ph) / 12, y = H * f * f; o.bg.lineBetween(0, y, W, y); }
    for (let x = -400; x <= 1200; x += 100) o.bg.lineBetween(W / 2 + (x - W / 2) * 0.25, 0, x, H);
    for (const st of o.stars) { st.y += st.sv * s; st.setTint(o.gc); if (st.y > H) { st.y = 0; st.x = B(0, W); } }
    if (o.over) return;
    o.ps.forEach((pl) => {
      const p = pl.s, c = pl.pre;
      p.x += ((held[c + 'R'] ? 1 : 0) - (held[c + 'L'] ? 1 : 0)) * 380 * s;
      p.y += ((held[c + 'D'] ? 1 : 0) - (held[c + 'U'] ? 1 : 0)) * 380 * s;
      p.x = Phaser.Math.Clamp(p.x, 20, W - 20);
      p.y = Phaser.Math.Clamp(p.y, 100, H - 40);
      p.alpha = t < pl.inv ? (((t / 70) | 0) & 1 ? 0.25 : 1) : 1;
      if (t > pl.nf) { pl.nf = t + (t < pl.rf ? 60 : pl.pw == 4 ? 110 : 135); o.shoot(pl); }
    });
    if (!o.boss && t > o.ns) {
      o.ns = t + Math.max(180, 720 - o.wave * 40) * (o.n == 2 ? 0.75 : 1);
      const r = R();
      if (o.wave >= 2 && r < 0.12) o.vform();
      else if (o.wave >= 3 && r < 0.2) o.wall();
      else o.spawn();
      if (o.wave > 3 && R() < 0.25) o.spawn();
    }
    for (const b of o.pb) {
      b.x += b.vx * s; b.y += b.vy * s;
      if (b.y < -20 || b.x < -20 || b.x > W + 20) b.dead = 1;
      for (const e of o.en) {
        if (!e.dead && !b.dead && Math.abs(b.x - e.x) < e.displayWidth / 2 && Math.abs(b.y - e.y) < e.displayHeight / 2) { if (b.pr) { if (!b.hs.has(e)) { b.hs.add(e); o.hit(e, 6); } } else { b.dead = 1; o.hit(e, 1); } }
      }
    }
    for (const g of o.gb) {
      for (const b of o.pb) {
        if (g.dead || b.dead || Math.abs(b.x - g.x) > 44 || Math.abs(b.y - g.y) > 40) continue;
        if (b.pr) { if (b.hs.has(g)) continue; b.hs.add(g); g.hp -= 6; } else { b.dead = 1; g.hp -= 1; }
        g.setTintFill(0xffffff);
        o.time.delayedCall(50, () => g.active && g.clearTint());
        if (g.hp <= 0) o.splitGiant(g, true);
      }
    }
    for (const e of o.en) {
      e.a += s;
      if (e.k == 'boss') {
        if (e.y < 110) e.y += 70 * s;
        else {
          const f = e.hp / e.mh, np = f > 0.66 ? 0 : f > 0.33 ? 1 : 2;
          if (np > e.ph) { e.ph = np; o.banner('FASE ' + (np + 1) + '!', '#ff9d3a'); o.cameras.main.shake(300, 0.01); }
          e.x = W / 2 + Math.sin(e.a * (0.9 + e.ph * 0.35)) * 280;
          if (t > e.nf) { e.nf = t + Math.max(600, 1100 - o.wave * 15 - e.ph * 200); o.bossAtk(e); }
          if (e.ph == 2 && t > e.sp) { e.sp = t + 2600; o.spawn('drone', B(60, W - 60), -30); }
        }
      } else {
        if (e.dvx !== undefined) {
          if (t > e.dt) { e.x += e.dvx * s; e.y += e.dvy * s; } else e.setTintFill(((t / 60) | 0) & 1 ? 0xffffff : 0xff0000);
        } else {
          e.y += e.vy * s;
          e.x = e.x0 + (e.k == 'zig' ? Math.sin(e.a * 5) * e.amp : Math.sin(e.a * 2) * e.amp);
          if (e.k == 'zig' && o.wave >= 3 && e.y > 140 && e.y < 260) {
            const p = o.tgt().s, an = Math.atan2(p.y - e.y, p.x - e.x);
            e.dvx = Math.cos(an) * 430; e.dvy = Math.sin(an) * 430; e.dt = t + 450;
          }
        }
        if ((e.k == 'drone' || e.k == 'tank') && t > e.nf && e.y > 20 && e.y < H - 160) {
          const p = o.tgt().s, an = Math.atan2(p.y - e.y, p.x - e.x), sp = 200 + o.wave * 8;
          e.nf = t + Math.max(600, B(1200, 2600) - o.wave * 60);
          o.ef(e.x, e.y, an, sp);
          if (e.k == 'tank') { o.ef(e.x, e.y, an + 0.25, sp); o.ef(e.x, e.y, an - 0.25, sp); }
        }
        if (e.y > H + 30 || e.y < -200 || e.x < -60 || e.x > W + 60) e.dead = 1;
      }
      for (const pl of o.ps) {
        const p = pl.s;
        if (!e.dead && t >= pl.inv && Math.abs(p.x - e.x) < e.displayWidth / 2 + 6 && Math.abs(p.y - e.y) < e.displayHeight / 2 + 6) {
          if (e.k != 'boss') o.kill(e);
          o.hurt(pl);
        }
      }
    }
    for (const b of o.eb) {
      b.x += b.vx * s; b.y += b.vy * s; b.rotation += 7 * s;
      if (b.y < -20 || b.y > H + 20 || b.x < -20 || b.x > W + 20) b.dead = 1;
      for (const pl of o.ps) {
        const p = pl.s, dx = b.x - p.x, dy = b.y - p.y, dd = dx * dx + dy * dy;
        if (dd < 64 && !b.dead) { b.dead = 1; o.hurt(pl); }
        else if (dd < 900 && !b.g && !b.dead && t >= pl.inv) {
          b.g = 1; o.sc += 10;
          o.pop(p.x, p.y - 24, 'GRAZE', '#ff0');
          sfx(1500, 0.04, 'sine', 0.03, 0.5);
        }
      }
    }
    for (const g of o.gb) {
      g.x += g.vx * s; g.y += g.vy * s; g.rotation += 2.5 * s;
      if (g.y < -80 || g.y > H + 80 || g.x < -80 || g.x > W + 80) g.dead = 1;
      for (const pl of o.ps) {
        if (!g.dead && Math.abs(g.x - pl.s.x) < 40 && Math.abs(g.y - pl.s.y) < 36) o.hurt(pl);
      }
    }
    o.fx.clear();
    for (const g of o.gb) {
      o.fx.fillStyle(0x000000, 0.7); o.fx.fillRect(g.x - 32, g.y - 56, 64, 8);
      o.fx.fillStyle(0xff3d3d); o.fx.fillRect(g.x - 30, g.y - 54, 60 * Math.max(0, g.hp) / g.mh, 4);
    }
    const HC = { Q: 0xffe95c, M: 0xff9d3a, G: 0x4ade4a, V: 0xff6b6b, P: 0x9be8ff };
    for (const u of o.pu) {
      u.y += 70 * s;
      u.x = u.bx + Math.sin(t / 260 + u.ph) * 16;
      u.setScale(1.5 + 0.2 * Math.sin(t / 110 + u.ph)).setAngle(Math.sin(t / 200 + u.ph) * 14);
      const pu = 0.5 + 0.5 * Math.sin(t / 150 + u.ph);
      o.fx.fillStyle(HC[u.ty], 0.14 + 0.16 * pu);
      o.fx.fillCircle(u.x, u.y, 32 + 6 * pu);
      o.fx.lineStyle(2, HC[u.ty], 0.5 + 0.4 * pu);
      o.fx.strokeCircle(u.x, u.y, 26 + 10 * pu);
      const sk = (t / 120) | 0;
      if (sk !== u.sp) { u.sp = sk; o.em.explode(1, u.x + B(-14, 14), u.y + B(-14, 14)); }
      if (u.y > H + 30) u.dead = 1;
      for (const pl of o.ps) {
        const p = pl.s;
        if (!u.dead && Math.abs(u.x - p.x) < 36 && Math.abs(u.y - p.y) < 34) {
          u.dead = 1;
          o.em.explode(18, u.x, u.y);
          o.charge(25);
          if (u.ty == 'Q') { if (pl.pw < 4) pl.pw++; else o.sc += 1000; }
          else if (u.ty == 'M') pl.sh = Math.min(2, pl.sh + 1);
          else if (u.ty == 'V') o.lives = Math.min(5, o.lives + 1);
          else if (u.ty == 'P') pl.rf = t + 8000;
          else o.bm = Math.min(3, o.bm + 1);
          o.pop(p.x, p.y - 30, { Q: 'MAS QUESO!', M: 'MALTA!', G: 'GUASACACA!', V: '+1 AREPA!', P: 'CADENCIA x2!' }[u.ty], '#4ade4a');
          [500, 700, 1000].forEach((f, i) => o.time.delayedCall(i * 50, () => sfx(f, 0.1, 'square', 0.05, 0.3)));
        }
      }
    }
    const sw = (a) => a.filter((e) => { if (e.dead) { e.destroy(); return false; } return true; });
    o.pb = sw(o.pb); o.gb = sw(o.gb); o.en = sw(o.en); o.eb = sw(o.eb); o.pu = sw(o.pu);
    for (const pl of o.ps) {
      if (t < pl.rf) { o.fx.lineStyle(2, 0x9be8ff, 0.5 + 0.4 * Math.sin(t / 60)); o.fx.strokeCircle(pl.s.x, pl.s.y, 22); }
      if (pl.sh > 0) {
        o.fx.lineStyle(2, pl.c, 0.9);
        for (let i = 0; i < pl.sh; i++) o.fx.strokeCircle(pl.s.x, pl.s.y, 26 + i * 6);
      }
    }
    const bx = W / 2 - 150, by = H - 30, full = o.ch >= 100, pz = 0.5 + 0.5 * Math.sin(t / 90);
    o.fx.fillStyle(0x000000, 0.8); o.fx.fillRect(bx - 4, by - 4, 308, 26);
    o.fx.fillStyle(0x333333); o.fx.fillRect(bx, by, 300, 18);
    o.fx.fillStyle(full ? 0xffffff : 0xff9d3a, full ? 0.5 + 0.5 * pz : 1); o.fx.fillRect(bx, by, 300 * o.ch / 100, 18);
    o.fx.lineStyle(3, full ? 0xf2ff00 : 0xff9d3a); o.fx.strokeRect(bx - 1, by - 1, 302, 20);
    for (let i = 1; i < 4; i++) { o.fx.lineStyle(1, 0x000000, 0.7); o.fx.lineBetween(bx + i * 75, by, bx + i * 75, by + 18); }
    o.rd.setVisible(full && (((t / 260) | 0) & 1) == 0);
    o.hq.setText(full ? '>> AREPAZO LISTO! BOTON 3 <<' : 'AREPAZO ' + (o.ch | 0) + '%').setColor(full ? '#f2ff00' : '#ffb347').setFontSize(full ? 18 : 15).setY(H - 54);
    if (full) {
      o.ps.forEach((pl) => { o.fx.lineStyle(3, 0xf2ff00, 0.4 + 0.6 * pz); o.fx.strokeCircle(pl.s.x, pl.s.y, 34 + 8 * pz); });
    }
    if (o.boss) {
      o.fx.fillStyle(0x333333); o.fx.fillRect(100, 34, 600, 8);
      o.fx.fillStyle(0xff9d3a); o.fx.fillRect(100, 34, 600 * Math.max(0, o.boss.hp) / o.boss.mh, 8);
    }
    o.hs.setText(String(o.sc).padStart(6, '0'));
    o.hh.setText('HI ' + String(Math.max(HI, o.sc)).padStart(6, '0'));
    o.hl.setText('AREPAS ' + 'O'.repeat(o.lives));
    o.hb.setText('GUASACACA x' + o.bm);
    o.hc.setText(t - o.lk < 2000 && o.combo > 3 ? 'COMBO x' + (1 + Math.min(7, o.combo >> 2)) : '');
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#050500',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Menu, Play],
});
