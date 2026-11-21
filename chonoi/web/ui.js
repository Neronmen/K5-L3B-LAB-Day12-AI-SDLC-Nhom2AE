"use strict";
/*
 * Lớp giao diện "sản phẩm thật" (CHỈ client, không đụng luật/headless):
 *  - nút bấm dùng chung cho chuột/cảm ứng/phím (UI.btns dựng lại mỗi khung hình)
 *  - chuyển cảnh điện ảnh: hoàng hôn (sáng -> tối), bình minh "Ngày N" (tối -> ngày mới)
 *  - hướng dẫn lần đầu mỗi buổi (3 thẻ có mũi tên chỉ HUD), H xem lại
 *  - màn chính: logo bập bềnh vào cảnh, chim bay, menu chọn bằng mũi tên/chuột
 */

// ---------------- lưu trữ tiện ích (luôn bọc try/catch) ----------------
function loadJSON(key, def) {
  try { const v = localStorage.getItem(key); return v ? Object.assign({}, def, JSON.parse(v)) : Object.assign({}, def); } catch (e) { return Object.assign({}, def); }
}
function saveJSON(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) { } }
function loadFlag(key) { try { return localStorage.getItem(key) === "1"; } catch (e) { return false; } }
function saveFlag(key, v) { try { localStorage.setItem(key, v ? "1" : "0"); } catch (e) { } }

const UI = { btns: [], mouse: null, sel: 0, titleAt: null };
const hudScale = (w) => Math.min(1.15, Math.max(w < 700 ? 0.5 : 0.75, w / 1280));

// ---------------- nút bấm ----------------
// Mỗi khung hình các màn gọi uiButton(); click/chạm/Enter dùng danh sách này -> một nguồn sự thật cho mọi kiểu điều khiển.
function uiButton(id, x, y, w, h, label, o = {}) {
  const hover = UI.mouse && UI.mouse[0] >= x && UI.mouse[0] <= x + w && UI.mouse[1] >= y && UI.mouse[1] <= y + h;
  const selected = o.selected || hover;
  const pop = selected ? 1.04 : 1;
  const cx = x + w / 2, cy = y + h / 2, ww = w * pop, hh = h * pop;
  panel(cx - ww / 2, cy - hh / 2, ww, hh, { r: hh / 2, fill: selected ? (o.hot || "rgba(194,69,58,.95)") : (o.fill || "rgba(43,28,18,.85)"),
    border: selected ? "rgba(255,236,180,.95)" : undefined });
  let off = 0;
  if (o.key) {
    const ks = o.sc || 1; ctx.font = `800 ${13 * ks}px ${FONT}`;
    const kw = Math.max(30 * ks, ctx.measureText(o.key).width + 16);
    keycap(cx - ww / 2 + 12, cy, o.key, ks);
    off = (kw + 12) / 2;   // dời chữ sang phải để không đè lên phím
  }
  text(label, cx + off, cy + 1, { size: o.size || 16, align: "center", base: "middle", weight: 800 });
  UI.btns.push({ id, x, y, w, h, act: o.act, hover });
  return hover;
}
function hitButton(px, py) {
  for (let i = UI.btns.length - 1; i >= 0; i--) { const b = UI.btns[i]; if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b; }
  return null;
}
function pressButton(b) { if (b && b.act) { Audio2.sfx("click"); b.act(); return true; } return false; }

// ---------------- chuyển cảnh ----------------
const Trans = { kind: null, t0: 0, day: 1 };
const TRANS_DUR = { dusk: 1.3, dawn: 1.45 };
function transElapsed() { return Trans.kind ? G.time - Trans.t0 : 99; }
function transActive() {
  if (!Trans.kind) return false;
  const t = transElapsed();
  // tôn trọng G.waitFresh: giữ màn che tới khi snapshot buổi mới tới, nhưng không chặn quá 1.5 s
  if (t < TRANS_DUR[Trans.kind] || (G.waitFresh && t < 1.5)) return true;
  Trans.kind = null; return false;
}
function transRemaining() { return transActive() ? Math.max(0, TRANS_DUR[Trans.kind] - transElapsed()) : 0; }
function startTransition(kind, day) {
  Trans.kind = kind; Trans.t0 = G.time; Trans.day = day;
  if (kind === "dawn") Audio2.sfx("rooster", 0.45); else Audio2.sfx("dusk");
}
// từ màn tổng kết sang buổi tiếp theo (Enter / chạm nút)
function advanceFromSummary() {
  const s = G.snap;
  if (!s || G.time - G.summaryAt <= 0.6) return;
  startTransition(s.mode === "gather" ? "dusk" : "dawn", ((s.story && s.story.day) || 1) + (s.mode === "gather" ? 0 : 1));
  G.scene = "play"; G.waitFresh = true; post("/next"); Audio2.sfx("click");
}
function restartFromSummary() { G.scene = "play"; G.waitFresh = true; post("/restart"); }

function drawTransition(w, h) {
  if (!transActive()) return;
  let t = transElapsed();
  const D = TRANS_DUR[Trans.kind];
  if (G.waitFresh && t > D * 0.65) t = Math.min(t, D * 0.65);   // chờ snapshot mới: giữ khung giữa
  const hz = h * 0.62;
  if (Trans.kind === "dusk") {
    const a = t < 0.25 ? t / 0.25 : t > 0.85 ? Math.max(0, 1 - (t - 0.85) / (D - 0.85)) : 1;
    const k = clamp(t / 0.85, 0, 1);   // cam -> tím -> đêm
    const top = k < 0.5 ? mixColor("#ff9a4a", "#6b3a8f", k * 2) : mixColor("#6b3a8f", "#0d1c3a", (k - 0.5) * 2);
    const bot = k < 0.5 ? mixColor("#ffd27a", "#d0607a", k * 2) : mixColor("#d0607a", "#1c2550", (k - 0.5) * 2);
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, hz);
    // mặt trời lặn xuống đường chân trời
    const sy = lerp(h * 0.3, hz + h * 0.05, k), sr = Math.min(w, h) * 0.09;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, hz); ctx.clip();
    ctx.fillStyle = mixColor("#fff1b0", "#ff6a3a", k); ctx.beginPath(); ctx.arc(w * 0.5, sy, sr, 0, 7); ctx.fill();
    ctx.restore();
    // mặt sông + vệt nắng phản chiếu
    ctx.fillStyle = mixColor("#3a5f7a", "#06101f", k); ctx.fillRect(0, hz, w, h - hz);
    for (let i = 0; i < 14; i++) {
      const yy = hz + 6 + i * (h - hz) / 14, ww = (sr * 1.6 - i * sr * 0.08) * (1 - k * 0.6);
      ctx.fillStyle = `rgba(255,${Math.round(180 - k * 80)},90,${0.5 - i * 0.03})`;
      ctx.fillRect(w * 0.5 - ww / 2 + Math.sin(G.time * 3 + i) * 6, yy, ww, 3);
    }
    // bóng ghe + hàng dừa xa
    ctx.fillStyle = "rgba(10,8,20,.85)";
    ctx.beginPath(); ctx.moveTo(0, hz); for (let x = 0; x <= w; x += 24) ctx.lineTo(x, hz - 10 - Math.sin(x * 0.02) * 8); ctx.lineTo(w, hz); ctx.fill();
    drawBoatSide(w * 0.25 + t * 30, hz + 6, Math.min(w, h) * 0.025, { beo: true, seed: 3, color: "#150f12", roofColor: "#0c0809", trim: "#150f12" });
    const ta = clamp((t - 0.2) / 0.3, 0, 1);
    ctx.globalAlpha = a * ta;
    const sc = Math.min(1.3, Math.max(0.6, w / 1100));
    text("Hoàng hôn trên sông…", w / 2, h * 0.3, { size: 42 * sc, align: "center", weight: 800, color: "#ffe9c4", stroke: "rgba(40,10,30,.7)", strokeW: 6 });
    text("Út Sen chèo ghe về quán, đèn lồng sắp thắp", w / 2, h * 0.3 + 34 * sc, { size: 17 * sc, align: "center", color: "#fff" });
    ctx.globalAlpha = 1;
  } else {
    // màn đen "Ngày N" -> bình minh -> mờ ra cảnh sáng
    const a = t < 0.2 ? t / 0.2 : t > 1.1 ? Math.max(0, 1 - (t - 1.1) / (D - 1.1)) : 1;
    ctx.globalAlpha = a;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
    const r = clamp((t - 0.75) / 0.4, 0, 1);   // bình minh dâng lên
    if (r > 0) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgba(40,30,80,${r})`); g.addColorStop(0.55, `rgba(247,163,122,${r})`); g.addColorStop(1, `rgba(255,224,168,${r})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const sr = Math.min(w, h) * 0.1, sy = lerp(h * 0.75, h * 0.55, r);
      ctx.fillStyle = `rgba(255,240,190,${r})`; ctx.beginPath(); ctx.arc(w / 2, sy, sr, 0, 7); ctx.fill();
    }
    const ta = t < 0.25 ? 0 : t < 0.45 ? (t - 0.25) / 0.2 : 1;
    ctx.globalAlpha = a * ta;
    const sc = Math.min(1.3, Math.max(0.6, w / 1100));
    text(`Ngày ${Trans.day}`, w / 2, h * 0.42, { size: 72 * sc, align: "center", weight: 800, color: r > 0.4 ? "#7a3a12" : "#ffe39a", stroke: r > 0.4 ? "rgba(255,240,210,.8)" : "rgba(0,0,0,.6)", strokeW: 6 });
    text("Gà gáy — một ngày mới trên chợ nổi", w / 2, h * 0.42 + 40 * sc, { size: 18 * sc, align: "center", color: r > 0.4 ? "#5a2a0a" : "#fff" });
    ctx.globalAlpha = 1;
  }
}

// ---------------- hướng dẫn lần đầu ----------------
const TUT = {
  gather: [
    { title: "Bơi & oxy", body: ["WASD / mũi tên để bơi, lặn xuống.", "Dưới nước oxy giảm dần — ngoi lên mặt nước để hồi.", "Hết oxy sẽ ngạt và mất ♥!"], at: "oxy" },
    { title: "Hái & bắt", body: ["Trên mặt nước, gần bông: E để hái.", "Dưới nước, gần đàn cá: SPACE để bắt.", "Giỏ có giới hạn — xem ô giỏ bên dưới."], at: "basket" },
    { title: "Cập bến", body: ["Bơi về vùng BẾN và bấm E", "để mang giỏ về quán trước khi hết giờ.", "Ngất xỉu thì giỏ trôi mất cả!"], at: "dock" },
  ],
  quan: [
    { title: "Nấu", body: ["Đứng cạnh BẾP, bấm E để nấu món khách gọi.", "Thực đơn bên phải: món sáng = đủ nguyên liệu."], at: "menu" },
    { title: "Bưng", body: ["Món chín rồi: đứng cạnh bếp bấm E để lấy.", "Mỗi lần chỉ bưng được một món."], at: "hand" },
    { title: "Mời khách", body: ["Mang đúng món tới bàn và bấm E.", "Khách chờ quá lâu sẽ bỏ về — mất uy tín.", "Khách vui sẽ boa thêm tiền!"], at: "money" },
  ],
};
const Tut = { mode: null, idx: 0, active: false, pending: null, t0: 0 };
function queueTutorial(mode, force) {
  if (!TUT[mode]) return;
  if (!force && loadFlag("chonoi_tut_" + mode)) return;
  Tut.pending = mode;
}
function updateTutorial() {
  if (Tut.pending && !Tut.active && G.scene === "play" && !G.waitFresh && !transActive() && G.snap && G.snap.mode === Tut.pending && !G.snap.finished) {
    Tut.mode = Tut.pending; Tut.pending = null; Tut.idx = 0; Tut.active = true; Tut.t0 = G.time;
    post("/pause", { paused: true });   // dừng sim trong lúc đọc hướng dẫn (không phải menu tạm dừng)
  }
}
function tutorialNext(skipAll) {
  if (!Tut.active) return;
  Audio2.sfx("click");
  Tut.idx++; Tut.t0 = G.time;
  if (skipAll || Tut.idx >= TUT[Tut.mode].length) {
    Tut.active = false; saveFlag("chonoi_tut_" + Tut.mode, true);
    if (!G.paused) post("/pause", { paused: false });
  }
}
function tutAnchor(at, w, h) {
  const sc = hudScale(w);
  switch (at) {
    case "oxy": return [14 + 44 * sc + (300 * sc - 60 * sc) / 2, 14 + 60 * sc];
    case "basket": return [w / 2, h - 80 * sc - 14];
    case "dock": {
      const v = Gather.view, dp = (v && v.meta.dock_pos) || [2, 0];
      return v ? [v.sx(dp[0]), v.sy(dp[1]) - 0.6 * v.u] : [80, h * 0.4];
    }
    case "menu": { const v = Quan.view; if (v && v.portrait) return [w / 2, 14 + 64 * sc + 26 + 150 * sc + 50 * sc]; return v ?[w - v.side - 14 + v.side / 2, 14 + 150 * sc + 40 * sc] : [w - 120, 220]; }
    case "hand": return [14 + 120 * sc, h - 40 * sc];
    case "money": return [14 + 175 * sc, 14 + 40 * sc];
  }
  return [w / 2, h / 2];
}
function drawTutorial(w, h) {
  if (!Tut.active) return;
  const cards = TUT[Tut.mode], c = cards[Tut.idx];
  if (!c) return;
  const e = Math.min(1, (G.time - Tut.t0) / 0.3), ease = 1 - Math.pow(1 - e, 3);
  ctx.fillStyle = "rgba(5,10,20,.45)"; ctx.fillRect(0, 0, w, h);
  const sc = Math.min(1.1, Math.max(0.62, w / 1200));
  const cw = Math.min(w - 32, 440 * sc), ch = (96 + c.body.length * 22) * sc;
  const cx = w / 2 - cw / 2, cy = h * 0.42 - ch / 2 + (1 - ease) * 30;
  const [ax, ay] = tutAnchor(c.at, w, h);
  // mũi tên từ thẻ tới HUD
  const fx = clamp(ax, cx + 30, cx + cw - 30), fy = ay < cy ? cy : cy + ch;
  const bob = Math.sin(G.time * 6) * 5;
  const dx = ax - fx, dy = ay - fy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const tx = ax - ux * (22 + bob), ty = ay - uy * (22 + bob);
  ctx.globalAlpha = ease;
  ctx.strokeStyle = "#ffe39a"; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -G.time * 30;
  ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#ffe39a"; ctx.beginPath();
  ctx.moveTo(tx + ux * 14, ty + uy * 14); ctx.lineTo(tx - uy * 10, ty + ux * 10); ctx.lineTo(tx + uy * 10, ty - ux * 10); ctx.fill();
  ctx.strokeStyle = `rgba(255,227,154,${0.5 + Math.sin(G.time * 6) * 0.4})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(ax, ay, 18 + Math.sin(G.time * 6) * 4, 0, 7); ctx.stroke();
  // thẻ
  panel(cx, cy, cw, ch, { fill: "rgba(250,238,210,.97)", border: "rgba(120,70,30,.7)", r: 18 });
  text(`${Tut.idx + 1}/${cards.length}`, cx + cw - 18, cy + 30 * sc, { size: 13 * sc, align: "right", weight: 800, color: "#a0521a" });
  text(c.title, cx + 22, cy + 34 * sc, { size: 24 * sc, weight: 800, color: "#7a3a12" });
  c.body.forEach((ln, i) => text(ln, cx + 22, cy + (62 + i * 22) * sc, { size: 15 * sc, color: "#4a2410", weight: 600 }));
  const last = Tut.idx === cards.length - 1;
  uiButton("tut_next", cx + cw - 170 * sc - 16, cy + ch - 44 * sc, 170 * sc, 34 * sc, last ? "Bắt đầu!" : "Tiếp", { key: "ENTER", sc: sc * 0.85, size: 14 * sc, selected: true, act: () => tutorialNext(false) });
  uiButton("tut_skip", cx + 16, cy + ch - 44 * sc, 120 * sc, 34 * sc, "Bỏ qua", { size: 13 * sc, act: () => tutorialNext(true) });
  text("H: xem lại hướng dẫn", w / 2, cy + ch + 22 * sc, { size: 12 * sc, align: "center", color: "rgba(255,255,255,.8)", stroke: "rgba(0,0,0,.5)", strokeW: 3 });
  ctx.globalAlpha = 1;
}

// ---------------- màn chính: chim bay + menu ----------------
function drawBirds(w, h, t, n = 5, top = 0.06) {
  ctx.strokeStyle = "rgba(40,30,40,.75)"; ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const sp = 38 + i * 9, x = ((t * sp + i * 260) % (w + 240)) - 120, y = h * top + i * 16 + Math.sin(t * 0.8 + i) * 10;
    const s = 7 + (i % 3) * 2, flap = Math.sin(t * 9 + i * 1.7) * s * 0.7;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - s, y - flap); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.2, x, y); ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.2, x + s, y - flap); ctx.stroke();
  }
}
const TITLE_ITEMS = [
  { key: "ENTER", label: "Bắt đầu một ngày mới", act: () => startGame("gather") },
  { key: "Q", label: "Vào thẳng quán (thử, kho mẫu)", act: () => startGame("quan") },
  { key: "C", label: "Cài đặt", act: () => openSettings() },
  { key: "M", label: () => Audio2.muted ? "Bật âm thanh" : "Tắt âm thanh", act: () => Audio2.toggle() },
];
function titleKey(k) {
  if (k === "arrowdown" || k === "s") { UI.sel = (UI.sel + 1) % TITLE_ITEMS.length; Audio2.sfx("click"); return true; }
  if (k === "arrowup" || k === "w") { UI.sel = (UI.sel + TITLE_ITEMS.length - 1) % TITLE_ITEMS.length; Audio2.sfx("click"); return true; }
  if (k === "enter" || k === " ") { TITLE_ITEMS[UI.sel].act(); if (UI.sel >= 2) Audio2.sfx("click"); return true; }
  if (k === "q") { startGame("quan"); return true; }
  if (k === "c") { openSettings(); return true; }
  return false;
}
// hiệu ứng logo bay vào: rơi từ trên, nảy nhẹ rồi bập bềnh
function titleIntro() {
  if (UI.titleAt === null) UI.titleAt = G.time;
  const t = Math.min(1, (G.time - UI.titleAt) / 1.2);
  const bounce = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 2.5);   // vượt quá rồi nảy về
  return { drop: (1 - bounce), alpha: Math.min(1, t * 3), t };
}

// ---------------- phím cho lớp UI (trả true = đã xử lý) ----------------
UI.key = function (k) {
  if (transActive()) return true;   // chặn input trong lúc chuyển cảnh (tối đa 1.5 s)
  if (Tut.active) {
    if (k === "enter" || k === " ") tutorialNext(false);
    else if (k === "escape") tutorialNext(true);
    return true;
  }
  if (UI.page === "settings") return settingsKey(k);
  if (G.scene === "title") return titleKey(k);
  if (G.paused && G.scene === "play") return pauseKey(k);
  if (k === "h" && G.scene === "play" && G.snap && !G.paused) { queueTutorial(G.snap.mode, true); return true; }
  return false;
};

// ---------------- cài đặt (localStorage, try/catch) ----------------
const Settings = loadJSON("chonoi_settings", { music: 0.7, sfx: 0.8, shake: true, ring: true });
function applySettings() { Audio2.setVolumes(Settings.music, Settings.sfx); saveJSON("chonoi_settings", Settings); }
applySettings();
const SETTING_ROWS = [
  { id: "music", label: "Nhạc nền", kind: "slider" },
  { id: "sfx", label: "Hiệu ứng", kind: "slider" },
  { id: "shake", label: "Rung màn hình", kind: "toggle" },
  { id: "ring", label: "Hiện vòng tương tác (quán)", kind: "toggle" },
  { id: "back", label: "Xong", kind: "button" },
];
function openSettings() { UI.page = "settings"; UI.setSel = 0; }
function closeSettings() { UI.page = null; applySettings(); }
function settingAdjust(row, dir) {
  if (row.kind === "slider") Settings[row.id] = Math.round(clamp(Settings[row.id] + dir * 0.1, 0, 1) * 10) / 10;
  else if (row.kind === "toggle") Settings[row.id] = !Settings[row.id];
  applySettings();
  if (row.id === "sfx" || row.kind === "toggle") Audio2.sfx("click");
}
function settingsKey(k) {
  const n = SETTING_ROWS.length, row = SETTING_ROWS[UI.setSel || 0];
  if (k === "arrowdown" || k === "s") UI.setSel = ((UI.setSel || 0) + 1) % n;
  else if (k === "arrowup" || k === "w") UI.setSel = ((UI.setSel || 0) + n - 1) % n;
  else if (k === "arrowleft" || k === "a") settingAdjust(row, -1);
  else if (k === "arrowright" || k === "d") settingAdjust(row, 1);
  else if (k === "enter" || k === " ") { if (row.kind === "button") closeSettings(); else settingAdjust(row, 1); }
  else if (k === "escape" || k === "c") closeSettings();
  return true;
}
function drawSettings(w, h) {
  UI.btns = [];   // panel che mọi nút bên dưới
  ctx.fillStyle = "rgba(5,10,20,.55)"; ctx.fillRect(0, 0, w, h);
  const sc = Math.min(1.1, Math.max(0.6, w / 1100)), pw = Math.min(w - 24, 480 * sc), rh = 54 * sc, ph = 90 * sc + SETTING_ROWS.length * rh;
  const x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  panel(x, y, pw, ph, { fill: "rgba(250,238,210,.97)", border: "rgba(120,70,30,.7)", r: 20 });
  text("CÀI ĐẶT", w / 2, y + 40 * sc, { size: 28 * sc, align: "center", weight: 800, color: "#7a3a12" });
  UI.sliders = [];
  SETTING_ROWS.forEach((row, i) => {
    const ry = y + 70 * sc + i * rh, sel = (UI.setSel || 0) === i;
    if (row.kind === "button") {
      uiButton("set_back", w / 2 - 80 * sc, ry + 8 * sc, 160 * sc, 38 * sc, "Xong", { key: "ESC", sc: sc * 0.85, size: 15 * sc, selected: sel, act: closeSettings });
      return;
    }
    if (sel) { rrect(x + 10, ry + 2, pw - 20, rh - 6, 12); ctx.fillStyle = "rgba(194,69,58,.12)"; ctx.fill(); }
    text(row.label, x + 24, ry + rh / 2, { size: 16 * sc, base: "middle", weight: 800, color: "#4a2410" });
    const cx0 = x + pw * 0.52, cw = pw * 0.4, cy = ry + rh / 2 - 2;
    if (row.kind === "slider") {
      const v = Settings[row.id];
      rrect(cx0, cy - 5, cw, 10, 5); ctx.fillStyle = "rgba(90,50,20,.25)"; ctx.fill();
      rrect(cx0, cy - 5, Math.max(10, cw * v), 10, 5); ctx.fillStyle = "#c2453a"; ctx.fill();
      ctx.fillStyle = "#fff4dc"; ctx.strokeStyle = "#7a3a12"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx0 + cw * v, cy, 10 * sc + (sel ? 2 : 0), 0, 7); ctx.fill(); ctx.stroke();
      text(Math.round(v * 100) + "%", cx0 + cw + 8, cy, { size: 12 * sc, base: "middle", weight: 800, color: "#7a3a12" });
      UI.sliders.push({ id: row.id, x: cx0, y: cy - 16, w: cw, h: 32, i });
    } else {
      const on = Settings[row.id], tw = 56 * sc, th = 28 * sc;
      rrect(cx0, cy - th / 2, tw, th, th / 2); ctx.fillStyle = on ? "#3f9a4a" : "rgba(90,50,20,.3)"; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx0 + (on ? tw - th / 2 : th / 2), cy, th / 2 - 3, 0, 7); ctx.fill();
      text(on ? "Bật" : "Tắt", cx0 + tw + 10, cy, { size: 13 * sc, base: "middle", weight: 800, color: "#7a3a12" });
      UI.btns.push({ id: "tg_" + row.id, x: cx0 - 6, y: cy - th / 2 - 6, w: tw + 50, h: th + 12, act: () => { UI.setSel = i; settingAdjust(row, 1); } });
    }
  });
  text("↑↓ chọn · ←→ chỉnh · M tắt tiếng nhanh", w / 2, y + ph + 22 * sc, { size: 12 * sc, align: "center", color: "#fff", stroke: "rgba(0,0,0,.5)", strokeW: 3 });
}
function sliderAt(px, py) { return (UI.sliders || []).find((s) => px >= s.x - 12 && px <= s.x + s.w + 12 && py >= s.y && py <= s.y + s.h); }
function dragSlider(sl, px) { Settings[sl.id] = Math.round(clamp((px - sl.x) / sl.w, 0, 1) * 20) / 20; UI.setSel = sl.i; applySettings(); }

// ---------------- menu tạm dừng ----------------
const PAUSE_ITEMS = [
  { label: "Chơi tiếp", key: "P", act: () => setPaused(false) },
  { label: "Chơi lại buổi", key: "R", act: () => { G.waitFresh = true; post("/restart"); setPaused(false); } },
  { label: "Cài đặt", key: "C", act: () => openSettings() },
  { label: "Về màn chính", key: "T", act: () => { G.scene = "title"; UI.titleAt = null; UI.sel = 0; } },
];
function pauseKey(k) {
  const n = PAUSE_ITEMS.length;
  if (k === "arrowdown" || k === "s") { UI.pauseSel = ((UI.pauseSel || 0) + 1) % n; return true; }
  if (k === "arrowup" || k === "w") { UI.pauseSel = ((UI.pauseSel || 0) + n - 1) % n; return true; }
  if (k === "enter" || k === " ") { pressButton({ act: PAUSE_ITEMS[UI.pauseSel || 0].act }); return true; }
  if (k === "c") { openSettings(); return true; }
  return false;   // P/Esc/R/T giữ hành vi cũ ở core.js
}
function drawPauseMenu(w, h) {
  if (UI.page === "settings") { drawSettings(w, h); return; }
  ctx.fillStyle = "rgba(5,10,20,.6)"; ctx.fillRect(0, 0, w, h);
  const sc = Math.min(1.1, Math.max(0.6, w / 1100)), pw = Math.min(w - 24, 380 * sc), bh = 46 * sc, gap = 12 * sc;
  const ph = 96 * sc + PAUSE_ITEMS.length * (bh + gap), x = w / 2 - pw / 2, y = h / 2 - ph / 2;
  panel(x, y, pw, ph, { r: 22 });
  text("TẠM DỪNG", w / 2, y + 54 * sc, { size: 38 * sc, align: "center", weight: 800, color: "#ffe39a", stroke: "#000", strokeW: 5 });
  PAUSE_ITEMS.forEach((it, i) => {
    const by = y + 80 * sc + i * (bh + gap);
    if (uiButton("pause" + i, x + 24 * sc, by, pw - 48 * sc, bh, it.label, { key: it.key, sc: sc * 0.9, size: 17 * sc, selected: (UI.pauseSel || 0) === i, act: it.act })) UI.pauseSel = i;
  });
}

// ---------------- toast góc màn (thành tích, thông báo) ----------------
const Toasts = [];
function toast(title, sub, icon) { Toasts.push({ title, sub, icon: icon || "★", t0: G.time }); Audio2.sfx("fanfare"); }
function drawToasts(w, h) {
  const sc = Math.min(1.1, Math.max(0.6, w / 1200));
  let y = 70 * sc;
  for (let i = 0; i < Toasts.length; i++) {
    const tt = G.time - Toasts[i].t0;
    if (tt > 4) { Toasts.splice(i--, 1); continue; }
    const a = tt < 0.35 ? tt / 0.35 : tt > 3.5 ? 1 - (tt - 3.5) / 0.5 : 1, slide = (1 - Math.min(1, tt / 0.35)) * 60;
    const tw = Math.min(w - 24, 300 * sc), th = 58 * sc, x = w - tw - 14 + slide;
    ctx.globalAlpha = a;
    panel(x, y, tw, th, { fill: "rgba(250,238,210,.97)", border: "rgba(212,150,40,.9)" });
    ctx.fillStyle = "#ffcf3d"; ctx.beginPath(); ctx.arc(x + 30 * sc, y + th / 2, 18 * sc, 0, 7); ctx.fill();
    text(Toasts[i].icon, x + 30 * sc, y + th / 2 + 1, { size: 18 * sc, align: "center", base: "middle", weight: 800, color: "#7a3a12" });
    text(Toasts[i].title, x + 58 * sc, y + 24 * sc, { size: 15 * sc, weight: 800, color: "#7a3a12" });
    text(Toasts[i].sub, x + 58 * sc, y + 44 * sc, { size: 12 * sc, color: "#6a4020" });
    ctx.globalAlpha = 1;
    y += th + 8;
  }
}

// ---------------- cảm ứng: joystick ảo + nút E / Bắt ----------------
UI.touch = false; UI.joy = null; UI.held = {};
function touchLayout(w, h) {
  const r = Math.min(70, Math.max(46, Math.min(w, h) * 0.12));
  const by = h - 105;   // chừa chỗ cho ô giỏ / món đang bưng ở đáy màn
  return { r, jx: r + 24, jy: by - r, ex: w - r * 0.9 - 20, ey: by - r * 2.1, cx: w - r * 2.3 - 24, cy: by - r * 0.7, br: r * 0.62,
    px: w / 2, py: by - 30 };
}
function touchPlaying() { return G.scene === "play" && !G.paused && !Tut.active && !transActive() && G.snap && !G.snap.finished; }
function drawTouchControls(w, h, s) {
  if (!UI.touch) return;
  const L = touchLayout(w, h);
  // nút tạm dừng nhỏ ở giữa trên
  if (G.scene === "play" && !G.paused) uiButton("t_pause", L.px - 26, L.py - 18, 52, 36, "II", { size: 16, act: () => setPaused(true) });
  if (!touchPlaying()) return;
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "rgba(20,12,6,.35)"; ctx.strokeStyle = "rgba(255,236,190,.6)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(L.jx, L.jy, L.r, 0, 7); ctx.fill(); ctx.stroke();
  const v = UI.joy && UI.joy.v ? UI.joy.v : [0, 0];
  ctx.fillStyle = "rgba(255,236,190,.85)"; ctx.beginPath(); ctx.arc(L.jx + v[0] * L.r * 0.6, L.jy + v[1] * L.r * 0.6, L.r * 0.42, 0, 7); ctx.fill();
  const btn = (x, y, label, on, col) => {
    ctx.fillStyle = on ? col : "rgba(20,12,6,.45)"; ctx.beginPath(); ctx.arc(x, y, L.br, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(255,236,190,.8)"; ctx.stroke();
    text(label, x, y + 1, { size: L.br * 0.55, align: "center", base: "middle", weight: 800 });
  };
  btn(L.ex, L.ey, "E", down.has("interact"), "rgba(63,154,74,.9)");
  if (s.mode === "gather") btn(L.cx, L.cy, "Bắt", down.has("catch"), "rgba(46,120,190,.9)");
  ctx.globalAlpha = 1;
}
function touchButtonAt(x, y, w, h) {
  const L = touchLayout(w, h), mode = G.snap ? G.snap.mode : "gather";
  if (Math.hypot(x - L.ex, y - L.ey) <= L.br * 1.25) return "interact";
  if (mode === "gather" && Math.hypot(x - L.cx, y - L.cy) <= L.br * 1.25) return "catch";
  return null;
}
function onTouchStart(e) {
  e.preventDefault(); Audio2.unlock();
  UI.touch = true;
  const w = innerWidth, h = innerHeight;
  for (const t of e.changedTouches) {
    const x = t.clientX, y = t.clientY;
    const sl = UI.page === "settings" && sliderAt(x, y);
    if (sl) { UI.held[t.identifier] = { slider: sl }; dragSlider(sl, x); continue; }
    const b = hitButton(x, y);
    if (b) { pressButton(b); continue; }
    if (!touchPlaying()) {
      // chạm ở màn không có nút: tương đương Enter (bỏ qua hướng dẫn, sang buổi...)
      if (Tut.active) tutorialNext(false);
      continue;
    }
    const tb = touchButtonAt(x, y, w, h);
    if (tb) { UI.held[t.identifier] = { btn: tb }; down.add(tb); continue; }
    if (x < w * 0.5 && !UI.joy) { UI.joy = { id: t.identifier, o: [x, y], v: [0, 0] }; updateJoy(x, y); }
  }
  pushInput();
}
function updateJoy(x, y) {
  const L = touchLayout(innerWidth, innerHeight);
  let dx = (x - UI.joy.o[0]) / L.r, dy = (y - UI.joy.o[1]) / L.r;
  const m = Math.hypot(dx, dy);
  if (m > 1) { dx /= m; dy /= m; }
  if (m < 0.15) { dx = 0; dy = 0; }   // vùng chết
  UI.joy.v = [Math.round(dx * 100) / 100, Math.round(dy * 100) / 100];   // luôn trong [-1, 1]
}
function onTouchMove(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const hd = UI.held[t.identifier];
    if (hd && hd.slider) { dragSlider(hd.slider, t.clientX); continue; }
    if (UI.joy && t.identifier === UI.joy.id) updateJoy(t.clientX, t.clientY);
  }
  pushInput();
}
function onTouchEnd(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const hd = UI.held[t.identifier];
    if (hd && hd.btn) down.delete(hd.btn);
    delete UI.held[t.identifier];
    if (UI.joy && t.identifier === UI.joy.id) UI.joy = null;
  }
  pushInput();
}
cv.addEventListener("touchstart", onTouchStart, { passive: false });
cv.addEventListener("touchmove", onTouchMove, { passive: false });
cv.addEventListener("touchend", onTouchEnd, { passive: false });
cv.addEventListener("touchcancel", onTouchEnd, { passive: false });

// chuột: hover + click vào nút, kéo thanh trượt
cv.addEventListener("mousemove", (e) => {
  UI.mouse = [e.clientX, e.clientY];
  if (UI.dragging) dragSlider(UI.dragging, e.clientX);
});
cv.addEventListener("mouseleave", () => { UI.mouse = null; UI.dragging = null; });
cv.addEventListener("mousedown", (e) => {
  Audio2.unlock();
  const sl = UI.page === "settings" && sliderAt(e.clientX, e.clientY);
  if (sl) { UI.dragging = sl; dragSlider(sl, e.clientX); }
});
addEventListener("mouseup", () => { UI.dragging = null; });
cv.addEventListener("click", (e) => { if (!UI.dragging) pressButton(hitButton(e.clientX, e.clientY)); });
