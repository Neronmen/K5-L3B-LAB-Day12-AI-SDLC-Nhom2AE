"use strict";
/*
 * Hoạt ảnh nhân vật & khách (CHỈ hình; vị trí luật của khách vẫn là bàn, của cá vẫn là tâm đàn):
 *  Út Sen: chớp mắt (khi đứng yên lâu thì đẩy kính lên đầu), thở nhẹ, ăn mừng khi "paid", lắc đầu khi "hold_full",
 *          choáng (sao quay trên đầu) khi "choke", bụi chân khi chạy trong quán.
 *  Khách: đi từ mép ghe vào ghế khi "customer_arrived", dậm chân bỏ đi khi "customer_left", vẫy tay + tim khi "paid";
 *          6 kiểu khách theo hash(id).
 */
const Anim = { cheer: -9, shake: -9, dizzy: -9, still: 0, lastMove: 0, blinkAt: 0, arrive: {}, ghosts: [] };

function animReset() { Anim.arrive = {}; Anim.ghosts = []; Anim.cheer = Anim.shake = Anim.dizzy = -9; }
const animAge = (t0) => G.time - t0;

function animEvent(e, s) {
  const d = e.data || {};
  switch (e.name) {
    case "paid": Anim.cheer = G.time; leaveGhost(d.customer_id, d.table_id, s, true); break;
    case "customer_left": leaveGhost(d.customer_id, d.table_id, s, false); break;
    case "customer_arrived": Anim.arrive[d.customer_id] = G.time; break;
    case "hold_full": Anim.shake = G.time; break;
    case "choke": Anim.dizzy = G.time; break;
  }
}
// khách vừa rời bàn: luật đã xóa khỏi snapshot -> giữ một "bóng" chỉ để vẽ hoạt ảnh rời đi
function leaveGhost(cid, tid, s, happy) {
  const prev = (G.prevSnap && G.prevSnap.customers) || [];
  const c = prev.find((c) => c.id === cid) || (s.customers || []).find((c) => c.id === cid) || { id: cid || "?", table_id: tid };
  const tb = (s.tables || []).find((t) => t.id === (tid || c.table_id));
  if (!tb) return;
  Anim.ghosts.push({ c, pos: tb.pos, t0: G.time, happy });
}

// ---------------- 6 kiểu khách ----------------
const CUST_TYPES = [
  { name: "cụ già nón lá", shirt: "#8a7a5a", skin: "#d9a27a", hair: "#d8d8d8", hat: "non_la", acc: "cane" },
  { name: "học sinh", shirt: "#f4f4f4", skin: "#f2c39b", hair: "#2a1a14", hat: null, acc: "backpack", tie: "#2f5fae" },
  { name: "du khách", shirt: "#ff8a3c", skin: "#f5d0b5", hair: "#e0b050", hat: "bucket", acc: "camera" },
  { name: "cô bán hàng", shirt: "#8e5bb5", skin: "#e8b48f", hair: "#1b1210", hat: "khan_ran", acc: null },
  { name: "chú xe ôm", shirt: "#3d7cc9", skin: "#c98f68", hair: "#1b1b1b", hat: "helmet", acc: null },
  { name: "cô gái tóc dài", shirt: "#ff8fb0", skin: "#f2c39b", hair: "#3a2418", hat: null, acc: "longhair" },
];
function customerLook(id) { return CUST_TYPES[Math.floor(hash("kh" + id) * CUST_TYPES.length) % CUST_TYPES.length]; }

// đầu + mũ theo kiểu khách; (x, hy) = tâm đầu, nhìn sang phải
function drawCustomerHead(x, hy, u, L, mood, chew) {
  if (L.acc === "longhair") { ctx.fillStyle = L.hair; rrectU(x - 0.3 * u, hy - 0.1 * u, 0.36 * u, 0.62 * u, 0.15 * u); ctx.fill(); }
  ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(x, hy, 0.25 * u, 0, 7); ctx.fill();
  ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.arc(x + 0.12 * u, hy - 0.02 * u, 0.04 * u, 0, 7); ctx.fill();
  if (mood === "angry") { ctx.strokeStyle = "#1b1b1b"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 0.04 * u, hy - 0.12 * u); ctx.lineTo(x + 0.18 * u, hy - 0.08 * u); ctx.stroke(); }
  ctx.strokeStyle = "#7a2f22"; ctx.lineWidth = Math.max(1, 0.03 * u); ctx.beginPath();
  if (mood === "eat") ctx.ellipse(x + 0.15 * u, hy + 0.1 * u, 0.04 * u, 0.03 * u + Math.abs(chew) * 0.02 * u, 0, 0, 7);
  else if (mood === "angry") ctx.arc(x + 0.13 * u, hy + 0.16 * u, 0.05 * u, Math.PI + 0.4, -0.4);
  else ctx.arc(x + 0.13 * u, hy + 0.07 * u, 0.05 * u, 0.3, Math.PI - 0.3);
  ctx.stroke();
  ctx.fillStyle = L.hair;
  switch (L.hat) {
    case "non_la": drawHat34(x, hy - 0.15 * u, u * 0.85); break;
    case "bucket":
      ctx.fillStyle = "#e8e0c0"; ctx.beginPath(); ctx.ellipse(x, hy - 0.14 * u, 0.36 * u, 0.09 * u, 0, 0, 7); ctx.fill();
      rrectU(x - 0.22 * u, hy - 0.38 * u, 0.44 * u, 0.26 * u, 0.1 * u); ctx.fill(); break;
    case "khan_ran":   // khăn rằn đen trắng
      ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(x, hy - 0.06 * u, 0.28 * u, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
      ctx.fillStyle = "#eee"; for (let i = 0; i < 4; i++) ctx.fillRect(x - 0.22 * u + i * 0.13 * u, hy - 0.26 * u, 0.05 * u, 0.05 * u); break;
    case "helmet":
      ctx.fillStyle = "#2e8b4a"; ctx.beginPath(); ctx.arc(x, hy - 0.04 * u, 0.3 * u, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(x - 0.05 * u, hy - 0.3 * u, 0.06 * u, 0.22 * u); break;
    default:
      ctx.beginPath(); ctx.arc(x - 0.02 * u, hy - 0.04 * u, 0.27 * u, Math.PI * 0.95, Math.PI * 2.0); ctx.fill();
  }
}
function drawCustomerAcc(x, y, u, L, sitting) {
  if (L.acc === "backpack") { ctx.fillStyle = "#2f5fae"; rrectU(x - 0.46 * u, y - 0.86 * u, 0.2 * u, 0.5 * u, 0.08 * u); ctx.fill(); }
  if (L.acc === "camera") {
    ctx.strokeStyle = "#222"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 0.2 * u, y - 0.9 * u); ctx.lineTo(x + 0.1 * u, y - 0.5 * u); ctx.stroke();
    ctx.fillStyle = "#222"; rrectU(x + 0.02 * u, y - 0.58 * u, 0.24 * u, 0.16 * u, 0.04 * u); ctx.fill();
    ctx.fillStyle = "#88c"; ctx.beginPath(); ctx.arc(x + 0.14 * u, y - 0.5 * u, 0.05 * u, 0, 7); ctx.fill();
  }
  if (L.tie) { ctx.fillStyle = L.tie; ctx.fillRect(x + 0.0 * u, y - 0.86 * u, 0.06 * u, 0.3 * u); }
  if (L.acc === "cane" && !sitting) { ctx.strokeStyle = "#6b4a2b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 0.4 * u, y - 0.6 * u); ctx.lineTo(x + 0.5 * u, y); ctx.stroke(); }
}

/* Khách đứng/đi ((x, y) = chân). o.walk: pha bước; o.wave: vẫy tay; o.stomp: dậm chân; face ±1. */
function drawCustomerStand(x, y, u, c, t, o = {}) {
  const L = customerLook(c.id), face = o.face || 1;
  const ph = o.walk ? t * 11 : 0, sw = o.walk ? Math.sin(ph) : 0;
  const stomp = o.stomp ? Math.abs(Math.sin(t * 22)) * 0.08 * u : 0;
  shadow(x, y, 0.35 * u, 0.12 * u, 0.28);
  ctx.save(); ctx.translate(x, y - stomp); ctx.scale(face, 1);
  if (L.acc === "cane") ctx.rotate(0.06);
  ctx.fillStyle = "#3a3a4a";
  limb(-0.08 * u, -0.6 * u, sw * 0.5, 0.6 * u, 0.15 * u, "#3a3a4a");
  limb(0.08 * u, -0.6 * u, -sw * 0.5, 0.6 * u, 0.15 * u, "#2c2c3a");
  ctx.fillStyle = L.shirt; rrectU(-0.26 * u, -1.25 * u, 0.52 * u, 0.7 * u, 0.15 * u); ctx.fill();
  drawCustomerAcc(0, -0.35 * u, u, L, false);
  const armUp = o.wave ? -2.6 + Math.sin(t * 14) * 0.4 : o.stomp ? -0.4 : -sw * 0.4;
  limb(0.22 * u, -1.15 * u, armUp, 0.5 * u, 0.13 * u, L.shirt);
  const [hx, hy2] = limbEnd(0.22 * u, -1.15 * u, armUp, 0.52 * u);
  ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(hx, hy2, 0.06 * u, 0, 7); ctx.fill();
  drawCustomerHead(0.02 * u, -1.5 * u, u, L, o.stomp ? "angry" : "happy", 0);
  ctx.restore();
}

// khách ngồi: dùng chung đầu/mũ/phụ kiện theo kiểu
function drawCustomerSitStyled(x, y, u, c, t) {
  const L = customerLook(c.id);
  const eating = c.state === "eating", chew = eating ? Math.sin(t * 9) : 0;
  const angry = c.state === "waiting" && c.patience_ticks_left !== undefined && c.patience_ticks_left < 900;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "#3a3a4a"; rrectU(-0.12 * u, -0.18 * u, 0.55 * u, 0.2 * u, 0.08 * u); ctx.fill();
  ctx.fillRect(0.3 * u, -0.02 * u, 0.14 * u, 0.42 * u);
  ctx.fillStyle = L.shirt; rrectU(-0.3 * u, -0.9 * u, 0.56 * u, 0.75 * u, 0.15 * u); ctx.fill();
  drawCustomerAcc(-0.02 * u, 0, u, L, true);
  ctx.fillStyle = L.shirt;
  if (eating) {
    ctx.save(); ctx.translate(0.15 * u, -0.7 * u); ctx.rotate(-0.9 - chew * 0.35);
    rrectU(0, -0.07 * u, 0.45 * u, 0.14 * u, 0.07 * u); ctx.fill();
    ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0.42 * u, 0); ctx.lineTo(0.75 * u, -0.05 * u); ctx.stroke();
    ctx.restore();
  } else if (angry) {   // gõ ngón tay sốt ruột
    rrectU(0.05 * u, -0.78 * u + Math.abs(Math.sin(t * 12)) * 0.05 * u, 0.42 * u, 0.14 * u, 0.07 * u); ctx.fill();
  } else { rrectU(0.05 * u, -0.78 * u, 0.42 * u, 0.14 * u, 0.07 * u); ctx.fill(); }
  drawCustomerHead(0.02 * u, -1.15 * u, u, L, eating ? "eat" : angry ? "angry" : "happy", chew);
  ctx.restore();
}

// vị trí vẽ khách tại bàn: đang đi vào thì nội suy từ mép ghe tới ghế
function customerWalkIn(v, tb, c) {
  const t0 = Anim.arrive[c.id];
  if (t0 === undefined) return null;
  const k = animAge(t0) / 1.3;
  if (k >= 1) { delete Anim.arrive[c.id]; return null; }
  const seatX = v.sx(tb.pos[0]) - 1.6 * v.u, edgeX = v.sx(v.b.x[0]) - 0.6 * v.u;
  return { x: lerp(edgeX, seatX, k * (2 - k)), k };
}
// bóng khách rời đi: thêm vào danh sách vẽ xa -> gần
function pushGhostItems(v, items, t) {
  Anim.ghosts = Anim.ghosts.filter((g) => animAge(g.t0) < 2.6);
  for (const g of Anim.ghosts) {
    items.push({ z: g.pos[1] - 0.02, draw: () => {
      const a = animAge(g.t0), seatX = v.sx(g.pos[0]) - 1.6 * v.u, y = v.sy(g.pos[1]), edgeX = v.sx(v.b.x[0]) - 1.5 * v.u;
      const stay = g.happy ? 0.9 : 0.6;   // vẫy tay / dậm chân rồi mới đi
      const k = clamp((a - stay) / 1.6, 0, 1), x = lerp(seatX, edgeX, k * k);
      ctx.globalAlpha = 1 - clamp((a - 2.1) / 0.5, 0, 1);
      drawCustomerStand(x, y, v.u, g.c, t, { walk: k > 0, face: k > 0 ? -1 : 1, wave: g.happy && a < stay, stomp: !g.happy && a < stay });
      ctx.globalAlpha = 1;
      if (g.happy && a < 1.4 && Math.random() < 0.15) floater(g.pos[0] - 1.6 + fxRand(-0.3, 0.3), g.pos[1] + 2.4 * v.u / v.zu, "♥", "#ff8fb0", 18);
      if (!g.happy && a < stay && Math.random() < 0.3) burst(g.pos[0] - 1.6, g.pos[1] - 0.2, 2, { color: "rgba(170,150,130,.7)", sp0: 0.3, sp1: 1.2, life: 0.6, s0: 0.1, s1: 0.2 });
    } });
  }
}

// ---------------- Út Sen ----------------
// trạng thái cảm xúc hiện tại để art.js vẽ
function senEmote(moving) {
  if (moving) Anim.lastMove = G.time;
  const idle = G.time - Anim.lastMove;
  if (G.time > Anim.blinkAt + 0.14 && Math.random() < 0.006) Anim.blinkAt = G.time;
  return {
    cheer: animAge(Anim.cheer) < 0.9 ? animAge(Anim.cheer) / 0.9 : 0,
    shake: animAge(Anim.shake) < 0.7 ? Math.sin(animAge(Anim.shake) * 30) * (1 - animAge(Anim.shake) / 0.7) : 0,
    dizzy: animAge(Anim.dizzy) < 1.6,
    glassesUp: idle > 2.5,                       // đứng yên lâu: đẩy kính lên đầu, lộ mắt chớp
    blink: G.time - Anim.blinkAt < 0.14,
    breathe: moving ? 0 : Math.sin(G.time * 2.2) * 0.018,
  };
}
// sao quay quanh đầu khi choáng
function drawDizzy(x, y, u, t) {
  for (let i = 0; i < 3; i++) {
    const a = t * 6 + i * Math.PI * 2 / 3, sx = x + Math.cos(a) * 0.45 * u, sy = y + Math.sin(a) * 0.14 * u;
    ctx.fillStyle = i % 2 ? "#ffe066" : "#fff3b0"; star(sx, sy, Math.max(3, 0.12 * u));
  }
}
// bụi chân khi chạy trong quán (hạt tọa độ thế giới quán)
function senDust(p, moving) {
  if (moving && Math.random() < 0.35) G.particles.push({ x: p.pos[0] + fxRand(-0.15, 0.15), y: p.pos[1] - 0.05, vx: fxRand(-0.4, 0.4), vy: fxRand(0.1, 0.4), g: 0, life: 0, max: fxRand(0.3, 0.55), size: fxRand(0.06, 0.12), color: "rgba(200,170,130,.6)", kind: "dot" });
}
