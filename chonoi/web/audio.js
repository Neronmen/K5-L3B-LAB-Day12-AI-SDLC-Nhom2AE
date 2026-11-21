"use strict";
/* Âm thanh tổng hợp bằng WebAudio (không dùng tệp ngoài -> không lo bản quyền). M = bật/tắt. */
const Audio2 = (() => {
  // master -> musicBus (âm lượng Nhạc) + sfxBus (âm lượng Hiệu ứng); hai thanh trượt ở menu Cài đặt
  let ac = null, master = null, musicGain = null, sfxBus = null, muted = false, mood = null, timer = null, step = 0;
  let musicVol = 0.7, sfxVol = 0.8;
  try { muted = localStorage.getItem("chonoi_muted") === "1"; } catch (e) { }

  function unlock() {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(ac.destination);
      musicGain = ac.createGain(); musicGain.gain.value = 0.23 * musicVol; musicGain.connect(master);
      sfxBus = ac.createGain(); sfxBus.gain.value = sfxVol; sfxBus.connect(master);
      if (mood) startMusic();
    } catch (e) { ac = null; }
  }
  function toggle() {
    muted = !muted;
    try { localStorage.setItem("chonoi_muted", muted ? "1" : "0"); } catch (e) { }
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ac.currentTime, 0.05);
  }
  function setVolumes(m, s) {
    musicVol = clamp(m, 0, 1); sfxVol = clamp(s, 0, 1);
    if (!ac) return;
    musicGain.gain.setTargetAtTime(0.23 * musicVol, ac.currentTime, 0.05);
    sfxBus.gain.setTargetAtTime(sfxVol, ac.currentTime, 0.05);
  }
  function tone(freq, dur, o = {}) {
    if (!ac) return;
    const t0 = ac.currentTime + (o.delay || 0);
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.3, t0 + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(o.out || sfxBus);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  function noise(dur, o = {}) {
    if (!ac) return;
    const t0 = ac.currentTime + (o.delay || 0);
    const buf = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = o.filter || "lowpass"; f.frequency.value = o.freq || 1200;
    g.gain.value = o.vol || 0.25;
    src.connect(f); f.connect(g); g.connect(o.out || sfxBus); src.start(t0);
  }
  const SFX = {
    click: () => tone(660, 0.08, { type: "triangle", vol: 0.2 }),
    splash: () => { noise(0.35, { freq: 900, vol: 0.35 }); tone(300, 0.2, { to: 120, vol: 0.15 }); },
    gasp: () => { noise(0.25, { freq: 2500, filter: "bandpass", vol: 0.2 }); tone(520, 0.15, { to: 760, type: "triangle", vol: 0.12, delay: 0.05 }); },
    pluck: () => { tone(880, 0.18, { type: "triangle", vol: 0.25 }); tone(1320, 0.22, { type: "sine", vol: 0.15, delay: 0.06 }); },
    catch: () => { noise(0.12, { freq: 1800, vol: 0.2 }); [660, 880, 1100].forEach((f, i) => tone(f, 0.16, { type: "square", vol: 0.07, delay: i * 0.06 })); },
    full: () => tone(200, 0.3, { type: "sawtooth", vol: 0.12, to: 150 }),
    hurt: () => { tone(220, 0.35, { type: "sawtooth", to: 80, vol: 0.25 }); noise(0.2, { freq: 400, vol: 0.2 }); },
    warn: () => [0, 0.18].forEach((d) => tone(520, 0.12, { type: "square", vol: 0.08, delay: d })),
    regrow: () => tone(1200, 0.25, { type: "sine", vol: 0.08, to: 1600 }),
    bell: () => { tone(1568, 0.6, { vol: 0.18 }); tone(2093, 0.5, { vol: 0.1, delay: 0.02 }); },
    sizzle: () => noise(0.6, { freq: 5000, filter: "highpass", vol: 0.12 }),
    ding: () => { tone(1046, 0.4, { type: "triangle", vol: 0.22 }); tone(1568, 0.5, { type: "triangle", vol: 0.15, delay: 0.1 }); },
    pick: () => tone(740, 0.1, { type: "triangle", vol: 0.18, to: 980 }),
    serve: () => [523, 659, 784].forEach((f, i) => tone(f, 0.2, { type: "triangle", vol: 0.18, delay: i * 0.07 })),
    coins: () => [1318, 1568, 2093, 1760, 2349].forEach((f, i) => tone(f, 0.12, { type: "square", vol: 0.06, delay: i * 0.05 })),
    angry: () => tone(300, 0.4, { type: "sawtooth", vol: 0.14, to: 180 }),
    fanfare: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, { type: "triangle", vol: 0.2, delay: i * 0.12 })),
    faint: () => [440, 392, 330, 262].forEach((f, i) => tone(f, 0.4, { type: "triangle", vol: 0.2, delay: i * 0.18 })),
    // gà gáy "ò ó o o": 4 nốt trượt tần số, sóng răng cưa nhỏ
    rooster: () => {
      tone(520, 0.14, { type: "sawtooth", to: 760, vol: 0.09 });
      tone(760, 0.16, { type: "sawtooth", to: 980, vol: 0.1, delay: 0.17 });
      tone(980, 0.5, { type: "sawtooth", to: 1180, vol: 0.11, delay: 0.36 });
      tone(1100, 0.45, { type: "sawtooth", to: 700, vol: 0.09, delay: 0.88 });
    },
    // hoàng hôn: tiếng gió vút + hợp âm trầm
    dusk: () => { noise(1.1, { freq: 700, vol: 0.12 }); [294, 349, 440].forEach((f, i) => tone(f, 1.2, { type: "sine", vol: 0.1, delay: 0.1 + i * 0.08, attack: 0.3 })); },
  };
  function sfx(name, delay) {
    if (!ac || !SFX[name]) return;
    if (delay) setTimeout(() => SFX[name](), delay * 1000); else SFX[name]();
  }

  // nhạc nền: ngũ cung kiểu đờn ca tài tử (Hò - Xự - Xang - Xê - Cống), chơi nhẹ, lặp
  const SCALE = { day: [392, 440, 523, 587, 659, 784, 880], night: [294, 349, 392, 440, 523, 587, 698] };
  const PATTERN = [0, 2, 3, 2, 4, -1, 3, 2, 1, 0, -1, 2, 4, 5, 4, 3, 2, -1, 1, 0, -1, -1, 2, 1];
  function startMusic() {
    if (!ac || timer) return;
    timer = setInterval(() => {
      const sc = SCALE[mood] || SCALE.day, n = PATTERN[step % PATTERN.length];
      if (n >= 0) {
        tone(sc[n], 0.9, { type: "triangle", vol: 0.5, out: musicGain, attack: 0.02 });
        if (step % 4 === 0) tone(sc[0] / 2, 1.6, { type: "sine", vol: 0.4, out: musicGain, attack: 0.05 });
      }
      step++;
    }, mood === "night" ? 420 : 340);
  }
  function music(m) {
    if (m === mood) return;
    mood = m;
    if (timer) { clearInterval(timer); timer = null; }
    startMusic();
  }
  // âm thanh nền lặp mượt: noise lọc trong bộ đệm 2 s lặp, âm lượng đổi từ từ
  const LOOP_DEF = { rain: { filter: "highpass", freq: 1600, q: 0.4, max: 0.16 } };
  const loops = {};
  function loop(name, level) {
    const d = LOOP_DEF[name];
    if (!ac || !d) return;
    let L = loops[name];
    if (!L) {
      if (level <= 0.001) return;
      const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; src.loop = true; f.type = d.filter; f.frequency.value = d.freq; f.Q.value = d.q; g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(d.bus === "music" ? musicGain : sfxBus); src.start();
      L = loops[name] = { g, level: 0 };
    }
    if (Math.abs(L.level - level) > 0.01 || (level === 0 && L.level !== 0)) { L.level = level; L.g.gain.setTargetAtTime(level * d.max, ac.currentTime, 0.4); }
  }
  return { unlock, toggle, sfx, music, setVolumes, loop, LOOP_DEF, get muted() { return muted; } };
})();
