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
  START1: ['Enter'], START2: ['2'],
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
};
const SPR = {
  arepa: ['...TTTTTTT...', '.TTYYYYYYYTT.', 'TTYYYYYYYYYTT', 'TYYYYYYYYYYYT', 'TYYKYYYYYKYYT', 'TYYKYYYYYKYYT', 'TYYYYYYYYYYYT', 'TYYYKYYYKYYYT', 'TTYYYKKKYYYTT', '.TTYYYYYYYTT.', '...TTTTTTT...'],
  aguacate: ['...DDD...', '..DGGGD..', '.DGGGGGD.', '.DGKGKGD.', 'DGGGGGGGD', 'DGGMMMGGD', 'DGGMMMGGD', '.DGGGGGD.', '..DDDDD..'],
  caraota: ['.UUUUU.', 'UUUUUUU', 'UWKUWKU', 'UUUUUUU', '.UUUUU.'],
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
const BN = ['LA REINA PEPIADA', 'EL DOMINO', 'LA PELUA', 'EL PABELLON'];
const BT = [0xffffff, 0xff9999, 0x99ccff, 0xffdd88];
const EXC = ['EPA!', 'QUE FUERTE!', 'CHEVERE!', 'AGUANTE!', 'ARREPENTIDO!', 'DALE PUES!'];

class Menu extends Phaser.Scene {
  constructor() { super('menu'); }
  create() {
    const o = this;
    if (!o.textures.exists('ship')) {
      mk(o, 'ship', SPR.arepa, 3);
      mk(o, 'ship2', SPR.arepa, 3, { Y: 'L', T: 'Z' });
      mk(o, 'drone', SPR.aguacate, 4);
      mk(o, 'zig', SPR.caraota, 4);
      mk(o, 'tank', SPR.queso, 4);
      mk(o, 'boss', SPR.boss, 5);
      const g = o.make.graphics({ add: false });
      g.fillStyle(0xffffff); g.fillRect(0, 0, 2, 2); g.generateTexture('px', 2, 2); g.clear();
      g.fillStyle(0xc98a2b); g.fillCircle(6, 6, 6); g.fillStyle(0xf2c14e); g.fillCircle(6, 6, 4.5); g.generateTexture('pb', 12, 12); g.clear();
      g.fillStyle(0xe63946); g.fillCircle(5, 5, 5); g.fillStyle(0xffffff); g.fillCircle(5, 5, 2); g.generateTexture('eb', 10, 10); g.clear();
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
    T(o, W / 2, 370, 'JOYSTICK: MOVER - DISPARO AUTOMATICO\nBOTON 1 / 2: GUASACACA (BOMBA)', 16, '#aaa').setOrigin(0.5);
    T(o, W / 2, 440, 'Q = MAS QUESO   M = MALTA (ESCUDO)   G = GUASACACA\nROZA LAS BALAS PARA PUNTOS - ENCADENA KILLS: COMBO', 14, '#8f8').setOrigin(0.5);
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
    Object.assign(o, { sc: 0, lives: n == 2 ? 5 : 3, wave: 1, kills: 0, combo: 0, lk: -9999, bm: 1, over: false, boss: null, nf: 0, ns: 1500, step: 0, t0: 0, pb: [], en: [], eb: [], pu: [] });
    o.bg = o.add.graphics();
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
      return Object.assign(p, { pw: 1, sh: 0, inv: 0, nf: 0 });
    });
    o.fx = o.add.graphics().setDepth(6);
    o.em = o.add.particles(0, 0, 'px', { speed: { min: 60, max: 320 }, lifespan: { min: 300, max: 750 }, scale: { start: 3, end: 0 }, tint: [0xf2c14e, 0x4ade4a, 0xffe95c, 0xffffff], emitting: false }).setDepth(7);
    o.add.tileSprite(0, 0, W, H, 'scan').setOrigin(0).setDepth(100);
    o.hs = T(o, 14, 8, '', 20, YL);
    o.hh = T(o, W - 14, 8, '', 15, '#f6f').setOrigin(1, 0);
    o.hl = T(o, 14, H - 30, '', 18, '#ff9d3a');
    o.hc = T(o, W / 2, 40, '', 22, YL).setOrigin(0.5, 0);
    o.hb = T(o, W - 14, H - 30, '', 16, '#4ade4a').setOrigin(1, 0);
    onPress = (c) => {
      if (o.over) {
        if (o.time.now > o.t0 + 900) o.scene.restart({ n: o.n });
        return;
      }
      if (/^P[12]_[1-6]$/.test(c)) o.bomb();
    };
    o.time.addEvent({ delay: 135, loop: true, callback: () => {
      if (o.over) return;
      const m = [55, 55, 82, 55, 65, 55, 98, 82], i = o.step++ % 8;
      sfx(m[i] * (o.wave > 8 ? 2 : 1), 0.12, 'triangle', 0.07, -0.2);
      if (i % 4 == 2) sfx(1800, 0.03, 'square', 0.012, -0.9);
    } });
    o.banner('OLEADA 1');
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
  spawn() {
    const o = this, w = o.wave, r = R();
    const k = r < 0.18 && w >= 3 ? 'tank' : r < 0.5 && w >= 2 ? 'zig' : 'drone', x = B(50, W - 50);
    const e = o.add.image(x, -30, k).setDepth(3);
    Object.assign(e, { x0: x, a: 0, k, hp: k == 'tank' ? 4 : 1, vy: k == 'tank' ? 50 : k == 'zig' ? 130 : 80 + w * 6, pts: k == 'tank' ? 300 : k == 'zig' ? 150 : 100, nf: o.time.now + B(800, 2500) });
    o.en.push(e);
  }
  spawnBoss() {
    const o = this, i = ((o.wave / 4 - 1) | 0) % 4, e = o.add.image(W / 2, -60, 'boss').setDepth(3).setTint(BT[i]);
    Object.assign(e, { x0: W / 2, a: 0, k: 'boss', hp: (30 + o.wave * 5) * (o.n == 2 ? 1.6 : 1), pts: 5000, nf: 0, n: 0 });
    e.mh = e.hp;
    o.boss = e; o.en.push(e);
    o.banner('!! ' + BN[i] + ' !!', '#ff6b6b');
    sfx(80, 0.8, 'sawtooth', 0.1, 1);
  }
  drop(x, y, ty) {
    const c = { Q: '#b8860b', M: '#22aa44', G: '#2e8b2e' }[ty];
    const t = this.add.text(x, y, ty, { fontFamily: 'monospace', fontStyle: 'bold', fontSize: '20px', color: '#fff', backgroundColor: c, padding: { x: 6, y: 2 } }).setOrigin(0.5).setDepth(4);
    t.ty = ty;
    this.pu.push(t);
  }
  hit(e, d) {
    const o = this;
    e.hp -= d;
    if (e.hp <= 0) return o.kill(e);
    e.setTintFill(0xffffff);
    o.time.delayedCall(60, () => {
      if (e.active) { e.clearTint(); if (e.k == 'boss') e.setTint(BT[((o.wave / 4 - 1) | 0) % 4]); }
    });
    sfx(200, 0.05, 'square', 0.04);
  }
  kill(e) {
    const o = this, t = o.time.now;
    if (e.dead) return;
    e.dead = 1;
    const big = e.k == 'boss';
    o.boom(e.x, e.y, big ? 90 : 16);
    if (big) o.cameras.main.shake(500, 0.02);
    o.combo = t - o.lk < 2000 ? o.combo + 1 : 1;
    o.lk = t;
    const m = 1 + Math.min(7, o.combo >> 2), p = e.pts * m;
    o.sc += p;
    o.pop(e.x, e.y, '+' + p, m > 1 ? YL : '#fff');
    if (o.combo % 8 == 0) o.banner(EXC[B(0, EXC.length - 1)], '#ff9d3a');
    if (big) {
      o.boss = null;
      ['Q', 'M', 'G'].forEach((c, i) => o.drop(e.x + (i - 1) * 50, e.y, c));
      o.banner('JEFE EN EL PLATO!', '#4ade4a');
    } else {
      if (R() < 0.11) o.drop(e.x, e.y, R() < 0.5 ? 'Q' : R() < 0.5 ? 'M' : 'G');
      if (!o.boss && ++o.kills >= 8 + o.wave * 3) {
        o.kills = 0; o.wave++;
        o.banner('OLEADA ' + o.wave);
        if (o.wave % 4 == 0) o.spawnBoss();
      }
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
    o.en.slice().forEach((e) => o.hit(e, e.k == 'boss' ? 12 : 99));
  }
  hurt(pl) {
    const o = this, t = o.time.now;
    if (t < pl.inv || o.over) return;
    if (pl.sh > 0) { pl.sh--; pl.inv = t + 700; sfx(300, 0.2, 'sine', 0.1, 1); o.cameras.main.shake(100, 0.008); return; }
    o.lives--;
    pl.pw = Math.max(1, pl.pw - 1);
    o.combo = 0;
    pl.inv = t + 2200;
    o.boom(pl.s.x, pl.s.y, 40);
    o.cameras.main.shake(300, 0.02);
    if (o.lives <= 0) {
      o.over = true; o.t0 = t;
      o.ps.forEach((p) => p.s.setVisible(false));
      const h = Math.max(HI, o.sc);
      HI = h;
      try { getStorage().set('arepas-hi', { s: h }); } catch (e) {}
      T(o, W / 2, H / 2, 'SE ACABARON LAS AREPAS\n\nSCORE ' + String(o.sc).padStart(6, '0') + '\nHI    ' + String(h).padStart(6, '0') + (o.sc >= h ? '\n\nNUEVO RECORD!' : '') + '\n\nPRESIONA START', 26, '#ff9d3a').setOrigin(0.5).setStroke('#000', 6);
    }
  }
  update(t, dt) {
    const o = this, s = Math.min(dt, 50) / 1000;
    o.bg.clear().lineStyle(1, 0xf2ff00, 0.18);
    const ph = (t / 1800) % 1;
    for (let i = 0; i < 12; i++) { const f = (i + ph) / 12, y = H * f * f; o.bg.lineBetween(0, y, W, y); }
    for (let x = -400; x <= 1200; x += 100) o.bg.lineBetween(W / 2 + (x - W / 2) * 0.25, 0, x, H);
    for (const st of o.stars) { st.y += st.sv * s; if (st.y > H) { st.y = 0; st.x = B(0, W); } }
    if (o.over) return;
    o.ps.forEach((pl) => {
      const p = pl.s, c = pl.pre;
      p.x += ((held[c + 'R'] ? 1 : 0) - (held[c + 'L'] ? 1 : 0)) * 380 * s;
      p.y += ((held[c + 'D'] ? 1 : 0) - (held[c + 'U'] ? 1 : 0)) * 380 * s;
      p.x = Phaser.Math.Clamp(p.x, 20, W - 20);
      p.y = Phaser.Math.Clamp(p.y, 100, H - 40);
      p.alpha = t < pl.inv ? (((t / 70) | 0) & 1 ? 0.25 : 1) : 1;
      if (t > pl.nf) { pl.nf = t + (pl.pw == 4 ? 110 : 135); o.shoot(pl); }
    });
    if (!o.boss && t > o.ns) {
      o.ns = t + Math.max(220, 800 - o.wave * 45) * (o.n == 2 ? 0.75 : 1);
      o.spawn();
      if (o.wave > 4 && R() < 0.2) { o.spawn(); o.spawn(); }
    }
    for (const b of o.pb) {
      b.x += b.vx * s; b.y += b.vy * s;
      if (b.y < -20 || b.x < -20 || b.x > W + 20) b.dead = 1;
      for (const e of o.en) {
        if (!e.dead && !b.dead && Math.abs(b.x - e.x) < e.displayWidth / 2 && Math.abs(b.y - e.y) < e.displayHeight / 2) { b.dead = 1; o.hit(e, 1); }
      }
    }
    for (const e of o.en) {
      e.a += s;
      if (e.k == 'boss') {
        if (e.y < 90) e.y += 70 * s;
        else {
          e.x = W / 2 + Math.sin(e.a * 0.9) * 280;
          if (t > e.nf) {
            e.nf = t + Math.max(450, 800 - o.wave * 15);
            e.n++;
            const c = 8 + (o.wave >> 2) * 2, p = o.tgt().s;
            for (let i = 0; i < c; i++) o.ef(e.x, e.y + 20, i / c * 6.283 + e.a, 140);
            if (e.n % 2) for (let j = -1; j < 2; j++) o.ef(e.x, e.y + 20, Math.atan2(p.y - e.y, p.x - e.x) + j * 0.2, 240);
            sfx(150, 0.2, 'sawtooth', 0.06, -0.5);
          }
        }
      } else {
        e.y += e.vy * s;
        e.x = e.x0 + (e.k == 'zig' ? Math.sin(e.a * 5) * 90 : e.k == 'drone' ? Math.sin(e.a * 2) * 50 : 0);
        if (e.k != 'zig' && t > e.nf && e.y > 20 && e.y < H - 160) {
          const p = o.tgt().s;
          e.nf = t + Math.max(700, B(1500, 3200) - o.wave * 50);
          o.ef(e.x, e.y, Math.atan2(p.y - e.y, p.x - e.x), 170 + o.wave * 6);
        }
        if (e.y > H + 30) e.dead = 1;
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
      b.x += b.vx * s; b.y += b.vy * s;
      if (b.y < -20 || b.y > H + 20 || b.x < -20 || b.x > W + 20) b.dead = 1;
      for (const pl of o.ps) {
        const p = pl.s, dx = b.x - p.x, dy = b.y - p.y, d = dx * dx + dy * dy;
        if (d < 64 && !b.dead) { b.dead = 1; o.hurt(pl); }
        else if (d < 900 && !b.g && !b.dead && t >= pl.inv) {
          b.g = 1; o.sc += 10;
          o.pop(p.x, p.y - 24, 'GRAZE', '#ff0');
          sfx(1500, 0.04, 'sine', 0.03, 0.5);
        }
      }
    }
    for (const u of o.pu) {
      u.y += 90 * s;
      if (u.y > H + 20) u.dead = 1;
      for (const pl of o.ps) {
        const p = pl.s;
        if (!u.dead && Math.abs(u.x - p.x) < 26 && Math.abs(u.y - p.y) < 26) {
          u.dead = 1;
          if (u.ty == 'Q') { if (pl.pw < 4) pl.pw++; else o.sc += 1000; }
          else if (u.ty == 'M') pl.sh = Math.min(3, pl.sh + 1);
          else o.bm = Math.min(3, o.bm + 1);
          o.pop(p.x, p.y - 30, { Q: 'MAS QUESO!', M: 'MALTA!', G: 'GUASACACA!' }[u.ty], '#4ade4a');
          [500, 700, 1000].forEach((f, i) => o.time.delayedCall(i * 50, () => sfx(f, 0.1, 'square', 0.05, 0.3)));
        }
      }
    }
    const sw = (a) => a.filter((e) => { if (e.dead) { e.destroy(); return false; } return true; });
    o.pb = sw(o.pb); o.en = sw(o.en); o.eb = sw(o.eb); o.pu = sw(o.pu);
    o.fx.clear();
    for (const pl of o.ps) {
      if (pl.sh > 0) {
        o.fx.lineStyle(2, pl.c, 0.9);
        for (let i = 0; i < pl.sh; i++) o.fx.strokeCircle(pl.s.x, pl.s.y, 26 + i * 6);
      }
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
