"use strict";
/*
 * HUD nâng cao (CHỈ client): bản đồ nhỏ + thước độ sâu, oxy rung + tim đập, "hít" bong bóng khi ngoi lên,
 * ô giỏ nảy + icon bay vào giỏ, tiền count-up + xu bay vào ô tiền, sao uy tín lấp lánh/rạn.
 * Mọi thứ chỉ đọc snapshot + sự kiện; tọa độ màn hình tính lại mỗi khung để đúng ở 1280x720 lẫn 1920x1080.
 */
const Hud = { fly: [], bounce: {}, money: null, rep: null, starFx: null, nextBeat: 0 };

function hudReset() { Hud.fly = []; Hud.bounce = {}; Hud.money = null; Hud.rep = null; Hud.starFx = null; }

// vị trí ô thứ i của giỏ (cùng bố cục với drawGatherHud)
function basketSlot(w, h, s, i) {
  const sc = hudScale(w), cap = s.hold_capacity || 12, slot = 40 * sc, gap = 6 * sc, gw = cap * (slot + gap) + 24 * sc, gh = slot + 40 * sc;
  const gx = (w - gw) / 2, gy = h - gh - 12;
  return { x: gx + 12 * sc + i * (slot + gap), y: gy + 28 * sc, size: slot };
}
function slotBounce(i) {
  const t0 = Hud.bounce[i];
  if (t0 === undefined) return 1;
  const k = G.time - t0;
  if (k > 0.6) return 1;
  return 1 + Math.sin(k * 18) * Math.exp(-k * 7) * 0.45;
}
function oxyBarRect(w) { const sc = hudScale(w); return { x: 14 + 44 * sc, y: 14 + 50 * sc, w: 300 * sc - 60 * sc, h: 20 * sc }; }
function moneyIconPos(w) { const sc = hudScale(w); return [14 + 140 * sc, 14 + 32 * sc]; }

// --- bay: icon từ cảnh vào HUD ---
function hudFly(kind, from, to, o = {}) {
  Hud.fly.push({ kind, from, to, t0: G.time + (o.delay || 0), dur: o.dur || 0.7, item: o.item, slot: o.slot, onEnd: o.onEnd, arc: o.arc ?? -80 });
}
function drawHudFly(w, h, s) {
  for (let i = 0; i < Hud.fly.length; i++) {
    const f = Hud.fly[i], k = (G.time - f.t0) / f.dur;
    if (k < 0) continue;
    if (k >= 1) { if (f.onEnd) f.onEnd(); Hud.fly.splice(i--, 1); continue; }
    const to = typeof f.to === "function" ? f.to() : f.to, e = k * k * (3 - 2 * k);
    const x = lerp(f.from[0], to[0], e), y = lerp(f.from[1], to[1], e) + Math.sin(k * Math.PI) * f.arc;
    if (f.kind === "item") drawItem(f.item, x, y, 14 * hudScale(w) * (1 + Math.sin(k * Math.PI) * 0.4), G.time);
    else if (f.kind === "coin") coin(x, y, 9 * hudScale(w));
    else if (f.kind === "bubble") { ctx.globalAlpha = 1 - k * 0.3; drawItemBubble(x, y, 6 + 5 * (1 - k)); ctx.globalAlpha = 1; }
  }
}

// --- sự kiện -> hiệu ứng HUD ---
function hudGatherEvent(e, s) {
  const v = Gather.view, w = innerWidth, h = innerHeight, d = e.data || {};
  if (!v) return;
  const p = s.player ? s.player.pos : [0, 0];
  if (e.name === "gather" || e.name === "fish_caught") {
    let at = p;
    if (e.name === "gather") { const n = (s.nodes || []).find((n) => n.id === d.node_id); if (n) at = [n.pos[0], -0.6]; }
    const count = d.count || 1, base = Math.max(0, (s.hold_count || 0) - count);
    for (let c = 0; c < count; c++) {
      const slot = base + c;
      hudFly("item", [v.sx(at[0]), v.sy(at[1])], () => { const b = basketSlot(innerWidth, innerHeight, G.snap || s, slot); return [b.x + b.size / 2, b.y + b.size / 2]; },
        { item: d.kind, slot, delay: c * 0.12, dur: 0.75, arc: -120, onEnd: () => { Hud.bounce[slot] = G.time; } });
    }
  } else if (e.name === "surface") {
    // "hít": bong bóng bay từ Út Sen vào thanh oxy
    const r = oxyBarRect(w);
    for (let i = 0; i < 7; i++) hudFly("bubble", [v.sx(p[0]) + fxRand(-12, 12), v.sy(0) + fxRand(-6, 6)], [r.x + fxRand(0.1, 0.9) * r.w, r.y + r.h / 2], { delay: i * 0.05, dur: 0.55, arc: -40 });
  }
}
function hudQuanEvent(e, s) {
  const v = Quan.view, d = e.data || {}, w = innerWidth;
  if (!v) return;
  if (e.name === "paid") {
    const tb = (s.tables || []).find((t) => t.id === d.table_id);
    const from = tb ? [v.sx(tb.pos[0]), v.sy(tb.pos[1]) - v.u] : [w / 2, innerHeight / 2];
    for (let i = 0; i < 7; i++) hudFly("coin", [from[0] + fxRand(-15, 15), from[1] + fxRand(-10, 10)], () => moneyIconPos(innerWidth), { delay: i * 0.06, dur: 0.8, arc: -60 });
  }
}

// --- quán: tiền đếm lên + sao ---
function hudMoney(s) {
  const target = s.money ?? 0;
  if (Hud.money === null || target < Hud.money) Hud.money = target;
  else Hud.money = Math.min(target, Hud.money + Math.max(1, (target - Hud.money) * 6 * G.dt));
  const rep = s.reputation ?? 0;
  if (Hud.rep !== null && Math.abs(rep - Hud.rep) > 0.001) Hud.starFx = { t0: G.time, up: rep > Hud.rep, idx: Math.floor(rep > Hud.rep ? rep - 0.001 : Hud.rep - 0.001) };
  Hud.rep = rep;
  return Math.round(Hud.money);
}
function drawStarFx(x0, y0, step, r) {
  const f = Hud.starFx;
  if (!f) return;
  const k = G.time - f.t0;
  if (k > 1.2) { Hud.starFx = null; return; }
  const cx = x0 + f.idx * step, cy = y0;
  if (f.up) {   // lấp lánh: tia sáng xoay + chấm bay
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 1 - k / 1.2;
    ctx.strokeStyle = "#fff3b0"; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + k * 3, r0 = r * (1 + k * 1.5), r1 = r0 + r * 0.8;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  } else {   // rạn: vết nứt + rung
    ctx.globalAlpha = 1 - k / 1.2;
    ctx.strokeStyle = "#3a1a08"; ctx.lineWidth = 1.6;
    const j = Math.sin(k * 60) * 2 * (1 - k);
    ctx.beginPath(); ctx.moveTo(cx - r * 0.1 + j, cy - r); ctx.lineTo(cx + r * 0.2 + j, cy - r * 0.2); ctx.lineTo(cx - r * 0.25 + j, cy + r * 0.25); ctx.lineTo(cx + r * 0.1 + j, cy + r * 0.8);
    ctx.moveTo(cx + r * 0.2 + j, cy - r * 0.2); ctx.lineTo(cx + r * 0.7 + j, cy); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// --- lặn: bản đồ nhỏ + thước độ sâu + tim đập ---
function drawMinimap(w, h, s) {
  const sc = hudScale(w), meta = s.meta || {}, b = meta.bounds || { x: [0, 100], d: [0, 30] };
  const mw = Math.min(w * 0.3, 210 * sc), mh = mw * 0.36, x = w - mw - 14, y = h - mh - (UI.touch ? 250 : 36);
  panel(x - 6, y - 20 * sc, mw + 12, mh + 26 * sc, { r: 10 });
  text("BẢN ĐỒ SÔNG", x, y - 6 * sc, { size: 10 * sc, weight: 800, color: "#ffe39a" });
  const X = b.x[1] - b.x[0], Dp = b.d[1] - b.d[0];
  const mx = (wx) => x + (wx - b.x[0]) / X * mw, my = (d) => y + (d - b.d[0]) / Dp * mh;
  ctx.fillStyle = "rgba(20,90,130,.75)"; ctx.fillRect(x, y, mw, mh);
  ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(x, y, mw, 1.5);
  const dp = meta.dock_pos || [2, 0];
  ctx.fillStyle = "#c9a35c"; ctx.fillRect(mx(dp[0]) - 4, my(0) - 4, 8, 4);
  for (const n of s.nodes || []) {
    ctx.fillStyle = n.ready === false ? "rgba(255,255,255,.25)" : n.kind === "bong_sung" ? "#ff8fc0" : "#ffd84a";
    ctx.beginPath(); ctx.arc(mx(n.pos[0]), my(n.pos[1]) + 2, 2.6, 0, 7); ctx.fill();
  }
  for (const f of s.fish || []) { ctx.fillStyle = f.kind === "ca_loc" ? "#9fe0a0" : "#d8f6ff"; ctx.beginPath(); ctx.ellipse(mx(f.pos[0]), my(f.pos[1]), 3, 1.8, 0, 0, 7); ctx.fill(); }
  const p = s.player;
  if (p) {
    const pr = 3.5 + Math.sin(G.time * 6) * 1;
    ctx.fillStyle = "#ff3fa4"; ctx.beginPath(); ctx.arc(mx(p.pos[0]), my(p.pos[1]), pr, 0, 7); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // khung nhìn hiện tại
  const v = Gather.view;
  if (v) {
    const halfW = w / v.u / 2;
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1;
    ctx.strokeRect(clamp(mx(Gather.cam - halfW), x, x + mw), y, clamp(mx(Gather.cam + halfW), x, x + mw) - clamp(mx(Gather.cam - halfW), x, x + mw), mh);
  }
}
function drawDepthRuler(w, h, s) {
  const v = Gather.view;
  if (!v) return;
  const sc = hudScale(w), x = w - 22 * sc, top = Math.max(64 * sc, v.surf), bot = Math.min(h - 150 * sc, v.sy(v.D));
  if (bot - top < 40) return;
  ctx.fillStyle = "rgba(0,0,0,.25)"; rrect(x - 4, top, 8, bot - top, 4); ctx.fill();
  for (let d = 0; d <= v.D; d += 5) {
    const yy = v.sy(d);
    if (yy < top - 1 || yy > bot + 1) continue;
    ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(x - 8, yy - 1, 16, 2);
    text(d + "m", x - 12, yy + 4, { size: 10 * sc, align: "right", weight: 800, color: "#e8fbff", stroke: "rgba(0,0,0,.45)", strokeW: 3 });
  }
  const p = s.player;
  if (p) {
    const yy = clamp(v.sy(p.pos[1]), top, bot);
    ctx.fillStyle = "#ff3fa4"; ctx.beginPath(); ctx.moveTo(x + 6, yy); ctx.lineTo(x + 16, yy - 6); ctx.lineTo(x + 16, yy + 6); ctx.fill();
  }
}
// tim đập tăng nhịp khi oxy < 25% dưới nước; trả về độ rung thanh oxy (px)
function oxyStress(p) {
  const frac = p.oxygen_max_ticks ? p.oxygen_ticks / p.oxygen_max_ticks : 1;
  if (!(p.at_surface === false && frac < 0.25) || G.paused || (G.snap && G.snap.finished)) return 0;
  if (G.time >= Hud.nextBeat) { Audio2.sfx("heart"); Hud.nextBeat = G.time + lerp(0.35, 0.95, frac / 0.25); }
  return Math.sin(G.time * 40) * (1.5 + (0.25 - frac) * 10);
}
