"use strict";
/*
 * Lõi client: mạng (poll /state, gửi /input), phím, nội suy, hạt hiệu ứng, chữ bay, rung màn hình.
 * Client CHỈ ĐỌC snapshot; mọi luật nằm ở chonoi/sim (Python). Hiệu ứng chỉ là trang trí -> không ảnh hưởng headless.
 */
const cv = document.getElementById("c");
const ctx = cv.getContext("2d");

const G = {
  snap: null, offline: false, scene: "title", time: 0, dt: 0,
  lastTick: -1, lastMode: null, seenKey: "", disp: null,   // vị trí hiển thị (nội suy)
  shake: 0, flash: 0, flashColor: "255,80,80",
  particles: [], floaters: [], banner: null,
};

const KIND_NAME = { ca_loc: "Cá lóc", ca_linh: "Cá linh", bong_dien_dien: "Bông điên điển", bong_sung: "Bông súng" };
const DISH_NAME = { ca_loc_nuong_trui: "Cá lóc nướng trui", goi_bong_sung: "Gỏi bông súng",
  lau_ca_linh_dien_dien: "Lẩu cá linh điên điển" };
const REASON = {
  docked: ["Cập bến an toàn", "Giỏ được mang về quán."],
  time: ["Hết giờ", "Mặt trời đã lên cao — vẫn giữ được giỏ."],
  fainted: ["Út Sen ngất xỉu!", "Hết hơi dưới nước, giỏ trôi mất cả."],
  error: ["Lỗi luật", "Xem terminal, nhấn R để chơi lại."],
};

// ---------------- mạng ----------------
async function post(path, obj) {
  try {
    await fetch(path, { method: "POST", body: JSON.stringify(obj || {}), headers: { "Content-Type": "application/json" } });
  } catch (e) { /* poll sẽ báo mất kết nối */ }
}
async function poll() {
  try {
    const r = await fetch("/state", { cache: "no-store" });
    onSnap(await r.json());
    G.offline = false;
  } catch (e) { G.offline = true; }
  setTimeout(poll, 16);
}

function onSnap(s) {
  const fresh = !G.snap || s.mode !== G.lastMode || s.tick < G.lastTick;
  if (fresh) { G.seenTick = 0; G.particles = []; G.floaters = []; G.disp = null; onNewSession(s); }
  // sự kiện của một tick được ghi cùng lúc (dưới khóa) -> chỉ cần nhớ tick cuối đã xử lý
  for (const e of s.events || []) {
    if (e.tick > G.seenTick) { G.prevSnap = G.snap; handleEvent(e, s); }
  }
  G.seenTick = Math.max(G.seenTick, s.tick);
  G.lastTick = s.tick; G.lastMode = s.mode;
  G.snap = s;
  if (G.waitFresh && !s.finished) G.waitFresh = false;  // đã sang buổi mới
  if (s.finished && G.scene === "play" && !G.waitFresh) { G.scene = "summary"; G.summaryAt = G.time; Audio2.sfx(s.reason === "fainted" ? "faint" : "fanfare"); }
}

function onNewSession(s) {
  const day = (s.story && s.story.day) || 1;
  if (G.scene !== "title") {
    G.banner = { text: s.mode === "gather" ? `Ngày ${day} · Buổi sáng` : `Ngày ${day} · Quán mở cửa`,
      sub: s.mode === "gather" ? "Lặn bắt cá, hái bông trên sông" : "Khách sắp tới — nhóm bếp đi!", t: G.time };
    Audio2.music(s.mode === "gather" ? "day" : "night");
  }
}

// ---------------- phím ----------------
const down = new Set();
const MOVE_KEYS = { w: "u", arrowup: "u", s: "d", arrowdown: "d", a: "l", arrowleft: "l", d: "r", arrowright: "r" };
let lastSent = "", queue = [], inflight = false;

function currentInput() {
  const mode = G.snap ? G.snap.mode : "gather";
  const dx = (down.has("r") ? 1 : 0) - (down.has("l") ? 1 : 0);
  let dy = (down.has("d") ? 1 : 0) - (down.has("u") ? 1 : 0);
  if (mode === "quan") dy = -dy;  // quan: lên màn hình = z dương
  return { move: [dx, dy], interact: down.has("interact"), catch: down.has("catch") };
}
function pushInput() {
  const s = JSON.stringify(G.scene === "play" ? currentInput() : { move: [0, 0], interact: false, catch: false });
  if (s === lastSent) return;
  lastSent = s; queue.push(s); flush();
}
async function flush() {
  if (inflight) return;
  inflight = true;
  while (queue.length) {
    const body = queue.shift();
    try { await fetch("/input", { method: "POST", body, headers: { "Content-Type": "application/json" } }); } catch (e) { }
  }
  inflight = false;
}
function setPaused(p) { G.paused = p; post("/pause", { paused: p }); }

addEventListener("keydown", (e) => {
  Audio2.unlock();
  const k = e.key.toLowerCase();
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
  if (e.repeat) return;
  if (k === "m") { Audio2.toggle(); return; }
  if (G.scene === "title") {
    if (k === "enter" || k === " ") startGame("gather");
    else if (k === "q") startGame("quan");
    return;
  }
  if (G.scene === "summary") {
    if ((k === "enter" || k === " " || k === "n") && G.time - G.summaryAt > 0.6) { G.scene = "play"; G.waitFresh = true; post("/next"); Audio2.sfx("click"); }
    else if (k === "r") { G.scene = "play"; G.waitFresh = true; post("/restart"); }
    else if (k === "escape") { G.scene = "title"; setPaused(true); }
    return;
  }
  if (k === "escape" || k === "p") { setPaused(!G.paused); Audio2.sfx("click"); return; }
  if (G.paused) {
    if (k === "t") G.scene = "title";
    else if (k === "r") { G.waitFresh = true; post("/restart"); setPaused(false); }
    return;
  }
  if (MOVE_KEYS[k]) down.add(MOVE_KEYS[k]);
  else if (k === "e") down.add("interact");
  else if (k === " ") down.add("catch");
  else if (k === "r") { G.waitFresh = true; post("/restart"); lastSent = ""; down.clear(); }
  pushInput();
});
addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (MOVE_KEYS[k]) down.delete(MOVE_KEYS[k]);
  else if (k === "e") down.delete("interact");
  else if (k === " ") down.delete("catch");
  pushInput();
});
addEventListener("blur", () => { down.clear(); pushInput(); });

function startGame(mode) {
  G.scene = "play"; G.paused = false; G.waitFresh = true;
  post("/start", { mode });
  Audio2.sfx("click");
  lastSent = ""; down.clear(); pushInput();
}

// ---------------- tiện ích vẽ ----------------
function fit() {
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [w, h];
}
const FONT = '"Baloo 2", "Segoe UI", system-ui, sans-serif';
function text(s, x, y, o = {}) {
  ctx.font = `${o.weight || 600} ${o.size || 14}px ${FONT}`;
  ctx.textAlign = o.align || "left";
  ctx.textBaseline = o.base || "alphabetic";
  if (o.stroke) { ctx.lineWidth = o.strokeW || 4; ctx.strokeStyle = o.stroke; ctx.lineJoin = "round"; ctx.strokeText(s, x, y); }
  ctx.fillStyle = o.color || "#fff8ec";
  ctx.fillText(s, x, y);
}
function rrect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function panel(x, y, w, h, o = {}) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  rrect(x, y, w, h, o.r || 14); ctx.fillStyle = o.fill || "rgba(43,28,18,.78)"; ctx.fill();
  ctx.restore();
  rrect(x + 1.5, y + 1.5, w - 3, h - 3, (o.r || 14) - 1); ctx.strokeStyle = o.border || "rgba(255,214,150,.45)"; ctx.lineWidth = 1.5; ctx.stroke();
}
function fmtTime(ticks) { const s = Math.ceil((ticks || 0) / 60); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hash(str) { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
// ngẫu nhiên chỉ cho hiệu ứng hình (không ảnh hưởng luật)
const fxRand = (a = 0, b = 1) => a + Math.random() * (b - a);

// ---------------- hạt + chữ bay (tọa độ thế giới của cảnh hiện tại) ----------------
function burst(x, y, n, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = fxRand(o.a0 ?? 0, o.a1 ?? Math.PI * 2), sp = fxRand(o.sp0 ?? 1, o.sp1 ?? 4);
    G.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g ?? 0, life: 0, max: fxRand(0.4, o.life ?? 1),
      size: fxRand(o.s0 ?? 0.08, o.s1 ?? 0.22), color: o.color || "#ffffff", kind: o.kind || "dot" });
  }
}
function floater(x, y, str, color = "#fff2c4", size = 18) { G.floaters.push({ x, y, str, color, size, life: 0, max: 1.6 }); }
function stepParticles(dt) {
  for (const p of G.particles) { p.life += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === "bubble") p.x += Math.sin(p.life * 8 + p.max * 20) * 0.01; }
  G.particles = G.particles.filter((p) => p.life < p.max);
  for (const f of G.floaters) f.life += dt;
  G.floaters = G.floaters.filter((f) => f.life < f.max);
}
function drawParticles(sx, sy, s) {
  for (const p of G.particles) {
    const a = 1 - p.life / p.max;
    ctx.globalAlpha = a;
    if (p.kind === "bubble") {
      ctx.strokeStyle = "rgba(220,245,255,.9)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), p.size * s, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(sx(p.x) - p.size * s * 0.35, sy(p.y) - p.size * s * 0.35, p.size * s * 0.25, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === "coin") {
      ctx.fillStyle = "#ffd34d"; ctx.beginPath(); ctx.ellipse(sx(p.x), sy(p.y), p.size * s, p.size * s * Math.abs(Math.cos(p.life * 12)), 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), p.size * s, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (const f of G.floaters) {
    const t = f.life / f.max, a = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
    ctx.globalAlpha = a;
    const pop = t < 0.12 ? 0.6 + t / 0.12 * 0.5 : 1.1 - Math.min(0.1, (t - 0.12));
    text(f.str, sx(f.x), sy(f.y) - t * 1.6 * s, { size: f.size * pop, align: "center", color: f.color, stroke: "rgba(40,20,10,.75)", weight: 800 });
  }
  ctx.globalAlpha = 1;
}
function addShake(v) { G.shake = Math.max(G.shake, v); }
function addFlash(v, color) { G.flash = Math.max(G.flash, v); if (color) G.flashColor = color; }
