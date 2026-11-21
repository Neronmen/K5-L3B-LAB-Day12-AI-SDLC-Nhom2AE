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
    case "menu": { const v = Quan.view; return v ? [w - v.side - 14 + v.side / 2, 14 + 150 * sc + 40 * sc] : [w - 120, 220]; }
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
  { key: "M", label: () => Audio2.muted ? "Bật âm thanh" : "Tắt âm thanh", act: () => Audio2.toggle() },
];
function titleKey(k) {
  if (k === "arrowdown" || k === "s") { UI.sel = (UI.sel + 1) % TITLE_ITEMS.length; Audio2.sfx("click"); return true; }
  if (k === "arrowup" || k === "w") { UI.sel = (UI.sel + TITLE_ITEMS.length - 1) % TITLE_ITEMS.length; Audio2.sfx("click"); return true; }
  if (k === "enter" || k === " ") { TITLE_ITEMS[UI.sel].act(); if (UI.sel === 2) Audio2.sfx("click"); return true; }
  if (k === "q") { startGame("quan"); return true; }
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
  if (G.scene === "title") return titleKey(k);
  if (k === "h" && G.scene === "play" && G.snap && !G.paused) { queueTutorial(G.snap.mode, true); return true; }
  return false;
};

// chuột: hover + click vào nút
cv.addEventListener("mousemove", (e) => { UI.mouse = [e.clientX, e.clientY]; });
cv.addEventListener("mouseleave", () => { UI.mouse = null; });
cv.addEventListener("click", (e) => { Audio2.unlock(); pressButton(hitButton(e.clientX, e.clientY)); });
