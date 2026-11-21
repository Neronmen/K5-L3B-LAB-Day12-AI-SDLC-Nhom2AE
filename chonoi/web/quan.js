"use strict";
/* Cảnh BUỔI TỐI — quán trên ghe, góc nghiêng 3/4 (kiểu Stardew/Overcooked).
 * Thế giới: x ∈ [0,16], z ∈ [0,10] (z lớn = xa = lên màn hình). Sàn bị nén theo TILT, vật đứng thẳng có chiều cao,
 * vẽ theo thứ tự xa -> gần để vật gần che vật xa. Chỉ là hình: luật vẫn dùng [x, z] như headless. */

const Quan = { view: null, dir: "down", face: 1, ui: [] };  // ui: lớp vẽ sau cùng (bong bóng, thanh)
const TILT = 0.6;

function quanView(w, h, s) {
  const meta = s.meta || {}, b = meta.bounds || { x: [0, 16], z: [0, 10] };
  const X = b.x[1] - b.x[0], Z = b.z[1] - b.z[0];
  const top = 96, bottom = 70, side = Math.min(320, w * 0.24);
  const u = Math.max(16, Math.min((w - side - 60) / (X + 4.5), (h - top - bottom) / (Z * TILT + 6)));
  const zu = u * TILT;
  const ox = (w - side - u * X) / 2 + 6;
  const oy = top + 3.6 * u + Math.max(0, (h - top - bottom - u * (Z * TILT + 6)) / 2);
  const v = { u, zu, b, meta, X, Z, side, ox, oy, sx: (x) => ox + (x - b.x[0]) * u, sy: (z) => oy + (b.z[1] - z) * zu };
  Quan.view = v;
  return v;
}

function drawQuanScene(w, h, s) {
  const v = quanView(w, h, s), { u, zu, sx, sy, b, meta, X, Z } = v, t = G.time;
  Quan.ui = [];
  // ---- nền đêm: trời sao + trăng + mặt sông ----
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#0d1c3a"); bg.addColorStop(0.5, "#0a1830"); bg.addColorStop(1, "#06101f");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const mx = (w - v.side) * 0.78, my = 70;
  const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
  mg.addColorStop(0, "rgba(255,248,220,.35)"); mg.addColorStop(1, "rgba(255,248,220,0)");
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 90, 0, 7); ctx.fill();
  ctx.fillStyle = "#fff6d8"; ctx.beginPath(); ctx.arc(mx, my, 22, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(200,190,160,.35)"; ctx.beginPath(); ctx.arc(mx - 6, my - 4, 5, 0, 7); ctx.arc(mx + 7, my + 6, 3.5, 0, 7); ctx.fill();
  // vệt trăng trên nước
  for (let i = 0; i < 18; i++) {
    const yy = my + 120 + i * 22, ww = 60 + Math.sin(t * 2 + i) * 18 - i;
    ctx.fillStyle = `rgba(255,240,200,${0.12 - i * 0.005})`;
    ctx.fillRect(mx - ww / 2 + Math.sin(t * 1.5 + i * 0.7) * 8, yy, ww, 3);
  }
  ctx.strokeStyle = "rgba(140,180,255,.08)"; ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const y = (i * 37 + t * 8) % h, x = (hash("w" + i) * w + Math.sin(t + i) * 20);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 4, x + 40, y); ctx.stroke();
  }
  // ghe láng giềng (xa, mờ) có đèn
  for (let i = 0; i < 4; i++) {
    const gx = [0.08, 0.86, 0.12, 0.8][i] * (w - v.side), gy = [0.13, 0.17, 0.92, 0.95][i] * h + Math.sin(t * 0.6 + i) * 3;
    ctx.globalAlpha = 0.5; drawBoatSide(gx, gy, u * 0.45, { beo: i % 2 === 0, seed: i, color: "#2b2420", roofColor: "#1d1712", trim: "#4a2a1a" }); ctx.globalAlpha = 1;
    lantern(gx - u * 0.2, gy - u * 1.0, u * 0.28, t + i, 0.9);
  }

  // ---- ghe quán ----
  const x0 = sx(b.x[0]), y0 = sy(b.z[1]), W = X * u, H = Z * zu, hull = 1.5 * u;
  // bóng ghe trên nước
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(x0 + W / 2, y0 + H + hull + 0.3 * u, W * 0.62, 0.9 * u, 0, 0, 7); ctx.fill();
  // mạn trước (mặt đứng) + mũi ghe nhọn bên phải
  ctx.fillStyle = "#4a2c17";
  ctx.beginPath();
  ctx.moveTo(x0 - 0.8 * u, y0 + H); ctx.lineTo(x0 + W + 0.6 * u, y0 + H);
  ctx.lineTo(x0 + W + 2.6 * u, y0 + H - 0.9 * u); ctx.lineTo(x0 + W + 1.6 * u, y0 + H + hull * 0.75);
  ctx.quadraticCurveTo(x0 + W * 0.5, y0 + H + hull * 1.15, x0 - 0.3 * u, y0 + H + hull * 0.8);
  ctx.lineTo(x0 - 1.4 * u, y0 + H - 0.3 * u); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#5e381e"; ctx.fillRect(x0 - 0.6 * u, y0 + H + 0.25 * u, W + 1.6 * u, 0.18 * u);
  ctx.fillStyle = "#b8452f"; ctx.fillRect(x0 - 0.6 * u, y0 + H + 0.05 * u, W + 1.4 * u, 0.14 * u);
  ctx.fillStyle = "#2e6b8a"; ctx.fillRect(x0 - 0.3 * u, y0 + H + 0.75 * u, W + 1.2 * u, 0.1 * u);
  // mắt ghe ở mũi
  const ex = x0 + W + 1.35 * u, ey = y0 + H + 0.35 * u;
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex, ey, 0.42 * u, 0.24 * u, -0.15, 0, 7); ctx.fill();
  ctx.fillStyle = "#c62828"; ctx.beginPath(); ctx.arc(ex + 0.06 * u, ey, 0.15 * u, 0, 7); ctx.fill();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(ex + 0.08 * u, ey, 0.06 * u, 0, 7); ctx.fill();
  // mạn sau (nhìn thấy mép trên) + sàn
  ctx.fillStyle = "#3b2312"; ctx.fillRect(x0 - 0.5 * u, y0 - 0.35 * u, W + 1.0 * u, 0.35 * u);
  for (let i = 0; i < Math.ceil(Z * 2); i++) {
    const yy = y0 + i * zu * 0.5;
    ctx.fillStyle = i % 2 ? "#b08250" : "#a27548"; ctx.fillRect(x0, yy, W, zu * 0.5 + 1);
    ctx.fillStyle = "rgba(60,30,10,.35)"; ctx.fillRect(x0, yy + zu * 0.5 - 1, W, 1.5);
    const off = hash("pl" + i) * 4 * u;
    for (let k = off; k < W; k += 4 * u) ctx.fillRect(x0 + k, yy, 1.5, zu * 0.5);
  }
  // viền sàn
  ctx.fillStyle = "#6b4426"; ctx.fillRect(x0 - 0.25 * u, y0, 0.25 * u, H); ctx.fillRect(x0 + W, y0, 0.25 * u, H);
  ctx.fillStyle = "#7a4e2c"; ctx.fillRect(x0 - 0.25 * u, y0 + H - 0.12 * u, W + 0.5 * u, 0.2 * u);
  // ánh đèn ấm phủ sàn
  const fl = ctx.createRadialGradient(x0 + W / 2, y0 + H * 0.4, u, x0 + W / 2, y0 + H * 0.4, W * 0.7);
  fl.addColorStop(0, "rgba(255,190,110,.18)"); fl.addColorStop(1, "rgba(20,10,40,.28)");
  ctx.fillStyle = fl; ctx.fillRect(x0, y0, W, H);
  // chiếu trải sàn (phẳng)
  const mx0 = sx(11.3), my0 = sy(9.4);
  ctx.fillStyle = "#d9b877"; rrect(mx0, my0, 4 * u, 2.2 * zu, 4); ctx.fill();
  ctx.strokeStyle = "rgba(150,100,40,.5)"; ctx.lineWidth = 1;
  for (let k = 1; k < 8; k++) { ctx.beginPath(); ctx.moveTo(mx0 + k * u * 0.5, my0); ctx.lineTo(mx0 + k * u * 0.5, my0 + 2.2 * zu); ctx.stroke(); }
  ctx.fillStyle = "#b8452f"; ctx.fillRect(mx0, my0 + 0.15 * zu, 4 * u, 0.12 * zu); ctx.fillRect(mx0, my0 + 1.95 * zu, 4 * u, 0.12 * zu);

  // ---- lan can sau + cột đèn + biển hiệu (xa nhất) ----
  const railY = y0 - 0.15 * u;
  ctx.strokeStyle = "#5a3418"; ctx.lineWidth = 0.14 * u;
  ctx.beginPath(); ctx.moveTo(x0 - 0.3 * u, railY - 0.85 * u); ctx.lineTo(x0 + W + 0.3 * u, railY - 0.85 * u); ctx.stroke();
  ctx.lineWidth = 0.1 * u;
  for (let x = 0; x <= X; x += 1) { ctx.beginPath(); ctx.moveTo(sx(b.x[0] + x), railY); ctx.lineTo(sx(b.x[0] + x), railY - 0.85 * u); ctx.stroke(); }
  const poles = [b.x[0] + 0.2, (b.x[0] + b.x[1]) / 2, b.x[1] - 0.2];
  for (const px of poles) { ctx.fillStyle = "#4a2a14"; ctx.fillRect(sx(px) - 0.08 * u, railY - 3.1 * u, 0.16 * u, 3.1 * u); }
  // dây đèn giữa các cột
  ctx.strokeStyle = "rgba(40,20,10,.8)"; ctx.lineWidth = 1.5;
  for (let i = 0; i < poles.length - 1; i++) {
    const a = sx(poles[i]), c = sx(poles[i + 1]), yy = railY - 3.0 * u;
    ctx.beginPath(); ctx.moveTo(a, yy); ctx.quadraticCurveTo((a + c) / 2, yy + 0.8 * u, c, yy); ctx.stroke();
    for (let k = 1; k < 6; k++) {
      const tt = k / 6, lx = lerp(a, c, tt), ly = yy + 4 * tt * (1 - tt) * 0.8 * u * 0.5 + 0.1 * u;
      const cols = ["#ff5a4a", "#ffc94a", "#ff8a3c", "#ff5a8a"];
      ctx.fillStyle = cols[(i * 5 + k) % 4]; ctx.beginPath(); ctx.arc(lx, ly + 0.12 * u, 0.1 * u, 0, 7); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "rgba(255,180,80,.15)"; ctx.beginPath(); ctx.arc(lx, ly + 0.12 * u, 0.35 * u, 0, 7); ctx.fill(); ctx.restore();
    }
  }
  // biển hiệu
  const sgx = sx((b.x[0] + b.x[1]) / 2), sgy = railY - 2.2 * u;
  ctx.fillStyle = "#3a2010"; rrect(sgx - 2.6 * u, sgy - 0.55 * u, 5.2 * u, 1.1 * u, 6); ctx.fill();
  ctx.strokeStyle = "#e8b860"; ctx.lineWidth = 2; rrect(sgx - 2.5 * u, sgy - 0.47 * u, 5.0 * u, 0.94 * u, 5); ctx.stroke();
  text("QUÁN ÚT SEN", sgx, sgy + 0.22 * u, { size: Math.max(12, 0.62 * u), align: "center", weight: 800, color: "#ffe39a" });
  for (const px of [poles[0], poles[2]]) lantern(sx(px), railY - 3.3 * u, u * 0.45, t + px, 1);

  // ---- vật trên sàn: sắp xa -> gần ----
  const items = [];
  for (const st of s.stoves || []) items.push({ z: st.pos[1], draw: () => drawStove3D(v, st, s, t) });
  const byTable = {};
  for (const c of s.customers || []) byTable[c.table_id] = c;
  for (const tb of s.tables || []) items.push({ z: tb.pos[1], draw: () => drawTable3D(v, tb, byTable[tb.id], s, t) });
  items.push({ z: 1, draw: () => drawJar(sx(15), sy(1), u) });
  items.push({ z: 9.2, draw: () => drawBasket(sx(14.6), sy(9.2), u, t) });
  const p = s.player;
  if (p) {
    if (!G.disp) G.disp = [...p.pos];
    G.disp[0] = lerp(G.disp[0], p.pos[0], 0.45); G.disp[1] = lerp(G.disp[1], p.pos[1], 0.45);
    const vx = p.vel ? p.vel[0] : 0, vz = p.vel ? p.vel[1] : 0, moving = Math.hypot(vx, vz) > 0.3;
    if (moving) {
      if (Math.abs(vx) >= Math.abs(vz)) { Quan.dir = "side"; Quan.face = vx > 0 ? 1 : -1; }
      else Quan.dir = vz > 0 ? "up" : "down";
    }
    // vòng tương tác trên sàn (vẽ trước mọi vật)
    const r = meta.interact_radius || 1.5, px = sx(G.disp[0]), py = sy(G.disp[1]);
    ctx.strokeStyle = "rgba(255,230,160,.35)"; ctx.setLineDash([5, 6]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(px, py, r * u, r * zu, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    items.push({ z: G.disp[1] - 0.01, draw: () => drawSenStand(px, py, u, { t, moving, dir: Quan.dir, face: Quan.face, hand: s.hand }) });
  }
  items.sort((a, b2) => b2.z - a.z);
  for (const it of items) it.draw();

  // đèn lồng hai góc trước (gần nhất)
  for (const lx of [b.x[0] + 0.2, b.x[1] - 0.2]) {
    const gx = sx(lx), gy = y0 + H - 0.1 * u;
    ctx.fillStyle = "#4a2a14"; ctx.fillRect(gx - 0.07 * u, gy - 2.4 * u, 0.14 * u, 2.4 * u);
    lantern(gx, gy - 2.6 * u, u * 0.42, t + lx * 3, 1);
  }
  // quầng sáng đèn (nhẹ để không bạc màu)
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const glows = [[sx(poles[0]), railY - 3.3 * u], [sx(poles[2]), railY - 3.3 * u], [sx(b.x[0] + 0.2), y0 + H - 2.7 * u], [sx(b.x[1] - 0.2), y0 + H - 2.7 * u]];
  for (const [gx, gy] of glows) {
    const rad = u * (3.2 + Math.sin(t * 3 + gx) * 0.15), lg = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
    lg.addColorStop(0, "rgba(255,170,80,.22)"); lg.addColorStop(1, "rgba(255,120,40,0)");
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(gx, gy, rad, 0, 7); ctx.fill();
  }
  ctx.restore();
  drawParticles(sx, sy, u);
  for (const f of Quan.ui) f();
  if (p) hintQuan(v, s, p);
}

function lantern(x, y, r, t, alpha) {
  const sw = Math.sin(t * 1.8) * 0.15;
  ctx.save(); ctx.translate(x, y); ctx.rotate(sw); ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.2);
  g.addColorStop(0, "#fff0b0"); g.addColorStop(0.5, "#ff9a3c"); g.addColorStop(1, "#c4361f");
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, r * 0.9, r * 0.8, r, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = "rgba(120,30,10,.5)"; ctx.lineWidth = 1;
  for (const k of [-0.4, 0, 0.4]) { ctx.beginPath(); ctx.ellipse(0, r * 0.9, r * 0.8 * Math.abs(k) + 0.5, r, 0, 0, 7); ctx.stroke(); }
  ctx.fillStyle = "#5a2a12"; ctx.fillRect(-r * 0.45, -r * 0.15, r * 0.9, r * 0.2); ctx.fillRect(-r * 0.45, r * 1.75, r * 0.9, r * 0.2);
  ctx.strokeStyle = "rgba(255,220,120,.8)"; ctx.beginPath(); ctx.moveTo(0, r * 1.95); ctx.lineTo(0, r * 2.5); ctx.stroke();
  ctx.restore(); ctx.globalAlpha = 1;
}
function shadow(x, y, rx, ry, a = 0.3) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); }
// trụ tròn đứng: đáy tâm (x, y), cao hgt, bán kính rx (mặt elip ry)
function cylinder(x, y, rx, ry, hgt, side, topCol) {
  ctx.fillStyle = side;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI); ctx.lineTo(x - rx, y - hgt); ctx.ellipse(x, y - hgt, rx, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
  ctx.fillStyle = topCol; ctx.beginPath(); ctx.ellipse(x, y - hgt, rx, ry, 0, 0, 7); ctx.fill();
}

function drawStove3D(v, st, s, t) {
  const { u, zu, sx, sy } = v, x = sx(st.pos[0]), y = sy(st.pos[1]);
  const cooking = st.state === "cooking", ready = st.state === "ready";
  shadow(x + 0.15 * u, y + 0.1 * zu, 1.1 * u, 1.0 * zu);
  // kệ gạch dưới lò
  ctx.fillStyle = "#7d3f2a"; ctx.fillRect(x - 1.1 * u, y - 0.5 * u, 2.2 * u, 0.5 * u);
  ctx.fillStyle = "#9a5236"; ctx.fillRect(x - 1.1 * u, y - 0.5 * u - 0.9 * zu, 2.2 * u, 0.9 * zu);
  ctx.strokeStyle = "rgba(60,20,10,.4)"; ctx.lineWidth = 1;
  for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 1.1 * u + k * 0.55 * u, y - 0.5 * u); ctx.lineTo(x - 1.1 * u + k * 0.55 * u, y); ctx.stroke(); }
  // lò đất (cà ràng)
  const baseY = y - 0.5 * u - 0.45 * zu;
  cylinder(x, baseY, 0.75 * u, 0.42 * zu * 1.4, 0.8 * u, "#a65a35", "#7a3f26");
  // cửa lò phía trước + lửa
  ctx.fillStyle = "#2a120a"; ctx.beginPath(); ctx.ellipse(x, baseY + 0.05 * u, 0.32 * u, 0.3 * u, 0, Math.PI, 0); ctx.fill();
  if (cooking) {
    const f = 0.7 + Math.sin(t * 22) * 0.2;
    ctx.fillStyle = `rgba(255,170,40,${f})`; ctx.beginPath(); ctx.ellipse(x, baseY + 0.02 * u, 0.24 * u, 0.22 * u * f, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = `rgba(255,240,150,${f})`; ctx.beginPath(); ctx.ellipse(x, baseY + 0.02 * u, 0.12 * u, 0.13 * u * f, 0, Math.PI, 0); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const gl = ctx.createRadialGradient(x, baseY, 0, x, baseY, 1.6 * u); gl.addColorStop(0, "rgba(255,140,40,.35)"); gl.addColorStop(1, "rgba(255,80,0,0)");
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, baseY, 1.6 * u, 0, 7); ctx.fill(); ctx.restore();
  }
  // nồi đất trên lò
  const potY = baseY - 0.8 * u;
  cylinder(x, potY, 0.6 * u, 0.3 * zu * 1.4, 0.55 * u, "#3a3434", "#262222");
  ctx.fillStyle = cooking ? "#d8823a" : ready ? "#e8a446" : "#1d1a1a";
  ctx.beginPath(); ctx.ellipse(x, potY - 0.55 * u, 0.5 * u, 0.22 * zu * 1.4, 0, 0, 7); ctx.fill();
  if (cooking) {
    for (let k = 0; k < 3; k++) { const bx = x + Math.sin(t * 3 + k * 2) * 0.25 * u, r = (0.05 + ((t * 2 + k * 0.33) % 1) * 0.06) * u; ctx.strokeStyle = "rgba(255,230,180,.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, potY - 0.55 * u, r, 0, 7); ctx.stroke(); }
    if (Math.random() < 0.25) G.particles.push({ x: st.pos[0] + fxRand(-0.3, 0.3), y: st.pos[1] + (1.9 * u / v.zu), vx: fxRand(-0.15, 0.15), vy: fxRand(0.9, 1.5), g: 0, life: 0, max: fxRand(0.9, 1.6), size: fxRand(0.15, 0.3), color: "rgba(235,235,235,.32)", kind: "dot" });
    if (Math.random() < 0.2) G.particles.push({ x: st.pos[0] + fxRand(-0.2, 0.2), y: st.pos[1] + (0.6 * u / v.zu), vx: fxRand(-0.3, 0.3), vy: fxRand(0.8, 1.5), g: 0, life: 0, max: fxRand(0.4, 0.8), size: fxRand(0.03, 0.07), color: "#ffb347", kind: "dot" });
  }
  // huy hiệu trạng thái phía trên (vẽ ở lớp trên cùng)
  const by = potY - 1.55 * u;
  Quan.ui.push(() => {
  if (cooking && st.dish && s.menu && s.menu[st.dish]) {
    const total = s.menu[st.dish].cook_s * 60, frac = 1 - st.cook_ticks_left / total;
    ctx.fillStyle = "rgba(30,15,8,.85)"; ctx.beginPath(); ctx.arc(x, by, 0.62 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = "#ffc94a"; ctx.lineWidth = 0.13 * u; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(x, by, 0.55 * u, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke(); ctx.lineCap = "butt";
    drawDish(st.dish, x, by + 0.05 * u, 0.3 * u, t);
    text(Math.ceil(st.cook_ticks_left / 60) + "s", x + 0.85 * u, by + 0.15 * u, { size: Math.max(11, u * 0.45), weight: 800, color: "#ffe2a0", stroke: "rgba(0,0,0,.6)" });
  } else if (ready) {
    const bob = Math.sin(t * 6) * 0.12 * u;
    const gl = ctx.createRadialGradient(x, by, 0, x, by, 1.2 * u);
    gl.addColorStop(0, "rgba(255,240,150,.55)"); gl.addColorStop(1, "rgba(255,240,150,0)");
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, by, 1.2 * u, 0, 7); ctx.fill();
    drawDish(st.dish, x, by + bob, u * 0.48, t);
    text("CHÍN!", x, by - 0.75 * u + bob, { size: Math.max(11, u * 0.48), align: "center", weight: 800, color: "#b7ff8a", stroke: "rgba(0,0,0,.65)" });
  } else {
    text("BẾP", x, by + 0.3 * u, { size: Math.max(10, u * 0.4), align: "center", weight: 800, color: "rgba(255,230,190,.85)", stroke: "rgba(0,0,0,.5)", strokeW: 3 });
  }
  });
}

function drawTable3D(v, tb, c, s, t) {
  const { u, zu, sx, sy } = v, x = sx(tb.pos[0]), y = sy(tb.pos[1]);
  const topH = 0.8 * u, rx = 1.0 * u, ry = 0.95 * zu;
  shadow(x + 0.15 * u, y + 0.05 * zu, 1.2 * u, 1.0 * zu);
  // ghế đẩu trái (khách ngồi) và phải
  const stool = (sxp) => { shadow(sxp, y + 0.05 * zu, 0.4 * u, 0.3 * zu, 0.25); cylinder(sxp, y, 0.32 * u, 0.2 * zu * 1.3, 0.45 * u, "#5e3a1f", "#8a5a30"); };
  stool(x - 1.6 * u);
  if (c) drawCustomerSit(x - 1.6 * u, y - 0.45 * u, u, c, t);
  // chân bàn + mặt bàn
  ctx.fillStyle = "#5a361b"; ctx.fillRect(x - 0.1 * u, y - topH, 0.2 * u, topH);
  ctx.fillStyle = "#4a2c15"; ctx.beginPath(); ctx.ellipse(x, y, 0.45 * u, 0.2 * zu, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#8a5a2e"; ctx.beginPath(); ctx.ellipse(x, y - topH + 0.14 * u, rx, ry, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#c48d52"; ctx.beginPath(); ctx.ellipse(x, y - topH, rx, ry, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = "rgba(120,70,30,.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y - topH, rx * 0.8, ry * 0.8, 0, 0, 7); ctx.stroke();
  stool(x + 1.6 * u);
  text("BÀN " + tb.id, x, y + 0.9 * zu + 0.35 * u, { size: Math.max(10, u * 0.36), align: "center", weight: 800, color: "rgba(255,230,190,.75)", stroke: "rgba(0,0,0,.5)", strokeW: 3 });
  // đồ trên bàn
  if (!c) {
    ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 0.35 * u, y - topH - 0.1 * zu); ctx.lineTo(x + 0.35 * u, y - topH + 0.15 * zu); ctx.moveTo(x - 0.3 * u, y - topH - 0.2 * zu); ctx.lineTo(x + 0.4 * u, y - topH + 0.05 * zu); ctx.stroke();
    return;
  }
  const headX = x - 1.6 * u, headY = y - 0.45 * u - 1.35 * u;
  if (c.state === "eating") drawDish(c.dish_id, x - 0.1 * u, y - topH - 0.05 * u, u * 0.5, t);
  Quan.ui.push(() => customerUi(v, tb, c, s, t, headX, headY));
}

function customerUi(v, tb, c, s, t, headX, headY) {
  const { u, zu } = v;
  if (c.state === "eating") {
    const eatMax = ((s.meta && s.meta.eat_s) || 10) * 60, frac = 1 - (c.eat_ticks_left || 0) / eatMax;
    if (Math.random() < 0.03) floater(tb.pos[0] - 1.6 + fxRand(-0.3, 0.3), tb.pos[1] + 2.6 * u / zu * 0.9, "♥", "#ff8fb0", 16);
    bubble(headX + 1.0 * u, headY - 0.9 * u, u, () => text("Ngon!", headX + 1.0 * u, headY - 0.86 * u, { size: Math.max(11, u * 0.42), align: "center", base: "middle", weight: 800, color: "#7a3a12" }));
    miniBar(headX - 0.7 * u, headY - 0.55 * u, 1.4 * u, 6, frac, "#8be07a");
  } else {
    const pmax = ((s.meta && s.meta.patience_s) || 60) * 60, frac = (c.patience_ticks_left || 0) / pmax;
    const col = frac > 0.5 ? "#7be07a" : frac > 0.25 ? "#ffcc4d" : "#ff5d5d";
    const shake = frac < 0.25 ? Math.sin(t * 30) * 2 : 0;
    bubble(headX + 1.1 * u + shake, headY - 1.0 * u, u * 1.15, () => drawDish(c.dish_id, headX + 1.1 * u + shake, headY - 1.0 * u, u * 0.38, t));
    miniBar(headX - 0.7 * u, headY - 0.55 * u, 1.4 * u, 7, frac, col);
    if (c.cooking) text("đang nấu…", headX + 1.1 * u, headY - 1.85 * u, { size: Math.max(10, u * 0.32), align: "center", color: "#ffe2a0", stroke: "rgba(0,0,0,.6)", strokeW: 3 });
    if (frac < 0.25) text("!!", headX - 0.95 * u, headY - 0.2 * u, { size: Math.max(14, u * 0.6), weight: 800, color: "#ff5d5d", stroke: "#fff", strokeW: 3 });
  }
}

function drawJar(x, y, u) {
  shadow(x + 0.1 * u, y + 0.05 * u, 0.7 * u, 0.35 * u);
  ctx.fillStyle = "#6b3f24";
  ctx.beginPath(); ctx.moveTo(x - 0.35 * u, y - 1.1 * u); ctx.quadraticCurveTo(x - 0.85 * u, y - 0.6 * u, x - 0.4 * u, y); ctx.lineTo(x + 0.4 * u, y);
  ctx.quadraticCurveTo(x + 0.85 * u, y - 0.6 * u, x + 0.35 * u, y - 1.1 * u); ctx.fill();
  ctx.fillStyle = "#8a5634"; ctx.beginPath(); ctx.ellipse(x, y - 1.1 * u, 0.38 * u, 0.14 * u, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#1f3a4a"; ctx.beginPath(); ctx.ellipse(x, y - 1.1 * u, 0.28 * u, 0.09 * u, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.ellipse(x - 0.3 * u, y - 0.6 * u, 0.08 * u, 0.3 * u, 0.2, 0, 7); ctx.fill();
}
function drawBasket(x, y, u, t) {
  shadow(x, y + 0.05 * u, 0.7 * u, 0.3 * u);
  ctx.fillStyle = "#b8894a"; ctx.beginPath(); ctx.moveTo(x - 0.6 * u, y - 0.5 * u); ctx.lineTo(x + 0.6 * u, y - 0.5 * u); ctx.lineTo(x + 0.45 * u, y); ctx.lineTo(x - 0.45 * u, y); ctx.fill();
  ctx.strokeStyle = "rgba(90,60,20,.5)"; ctx.lineWidth = 1;
  for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 0.58 * u + k * 0.03 * u, y - 0.5 * u + k * 0.17 * u); ctx.lineTo(x + 0.58 * u - k * 0.03 * u, y - 0.5 * u + k * 0.17 * u); ctx.stroke(); }
  for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? "#5fae4a" : "#3f8d3a"; ctx.beginPath(); ctx.ellipse(x - 0.4 * u + k * 0.16 * u, y - 0.6 * u, 0.12 * u, 0.25 * u, -0.6 + k * 0.25, 0, 7); ctx.fill(); }
  ctx.fillStyle = "#f6c21c"; ctx.beginPath(); ctx.arc(x + 0.25 * u, y - 0.75 * u, 0.08 * u, 0, 7); ctx.arc(x + 0.35 * u, y - 0.68 * u, 0.07 * u, 0, 7); ctx.fill();
}

function bubble(x, y, u, inner) {
  ctx.save();
  ctx.fillStyle = "rgba(255,250,240,.97)"; ctx.strokeStyle = "rgba(120,70,30,.6)"; ctx.lineWidth = 1.5;
  rrect(x - 0.75 * u, y - 0.5 * u, 1.5 * u, 1.0 * u, 0.35 * u); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 0.5 * u, y + 0.45 * u); ctx.lineTo(x - 0.85 * u, y + 0.85 * u); ctx.lineTo(x - 0.15 * u, y + 0.48 * u); ctx.fill();
  ctx.restore();
  inner();
}
function miniBar(x, y, w, h, frac, col) {
  rrect(x, y, w, h, h / 2); ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fill();
  if (frac > 0) { rrect(x, y, Math.max(h, w * clamp(frac, 0, 1)), h, h / 2); ctx.fillStyle = col; ctx.fill(); }
}

// gợi ý: cùng thứ tự chọn đối tượng với luật (khoảng cách, bếp trước bàn, id)
function hintQuan(v, s, p) {
  const r = (v.meta && v.meta.interact_radius) || 1.5, cands = [];
  for (const st of s.stoves || []) { const d = Math.hypot(p.pos[0] - st.pos[0], p.pos[1] - st.pos[1]); if (d <= r) cands.push([d, 0, st, "stove"]); }
  for (const tb of s.tables || []) { const d = Math.hypot(p.pos[0] - tb.pos[0], p.pos[1] - tb.pos[1]); if (d <= r) cands.push([d, 1, tb, "table"]); }
  if (!cands.length) return;
  cands.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const [, , obj, kind] = cands[0];
  let msg = null;
  if (kind === "stove") {
    if (obj.state === "ready") msg = s.hand ? "Tay đang bận" : "E  Lấy món";
    else if (obj.state === "idle") {
      const wait = (s.customers || []).filter((c) => c.state === "waiting" && !c.cooking);
      msg = wait.length ? "E  Nấu " + (DISH_NAME[wait[0].dish_id] || wait[0].dish_id) : "Chưa có khách gọi món";
    } else msg = "Đang nấu…";
  } else {
    const c = (s.customers || []).find((c) => c.table_id === obj.id);
    if (c && c.state === "waiting") msg = s.hand === c.dish_id ? "E  Mời khách dùng" : s.hand ? "Sai món rồi!" : "Khách chờ " + (DISH_NAME[c.dish_id] || "");
  }
  if (msg) keyHint(v.sx(obj.pos[0]), v.sy(obj.pos[1]) + 1.3 * v.u + Math.sin(G.time * 5) * 3, msg, v.u * 0.8);
}

// ---------------- HUD buổi tối ----------------
function drawQuanHud(w, h, s) {
  const sc = Math.min(1.15, Math.max(0.75, w / 1280)), v = Quan.view;
  // thanh trên
  const pw = Math.min(w - v.side - 40, 640 * sc), ph = 64 * sc, x0 = 14, y0 = 14;
  panel(x0, y0, pw, ph);
  text("☾ " + fmtTime(s.time_left_ticks), x0 + 16 * sc, y0 + 40 * sc, { size: 24 * sc, weight: 800, color: "#ffe39a" });
  coin(x0 + 140 * sc, y0 + 32 * sc, 12 * sc);
  text((s.money ?? 0) + "k", x0 + 160 * sc, y0 + 41 * sc, { size: 24 * sc, weight: 800, color: "#ffd34d" });
  const rep = s.reputation ?? 0, rmax = (s.meta && s.meta.reputation_max) || 5;
  for (let i = 0; i < rmax; i++) starIcon(x0 + 280 * sc + i * 28 * sc, y0 + 32 * sc, 11 * sc, clamp(rep - i, 0, 1));
  text(rep.toFixed(1), x0 + 280 * sc + rmax * 28 * sc, y0 + 38 * sc, { size: 15 * sc, weight: 800, color: "#ffe39a" });
  text("Điểm " + (s.score ?? 0), x0 + pw - 16 * sc, y0 + 40 * sc, { size: 18 * sc, align: "right", weight: 800, color: "#fff" });
  const day = (s.story && s.story.day) || 1;
  text(`Ngày ${day} · Phục vụ ${s.served_count ?? 0} · Bỏ đi ${s.left_count ?? 0}`, x0 + 16 * sc, y0 + ph + 18 * sc, { size: 13 * sc, color: "#c9d6ff", stroke: "rgba(0,0,0,.5)", strokeW: 3 });

  // cột phải: kho + thực đơn
  const cx = w - v.side - 14, cw = v.side, kh = 150 * sc;
  panel(cx, 14, cw, kh);
  text("KHO NGUYÊN LIỆU", cx + 14, 14 + 24 * sc, { size: 13 * sc, weight: 800, color: "#ffe39a" });
  const kinds = ["ca_loc", "ca_linh", "bong_dien_dien", "bong_sung"], stock = s.stock || {}, res = s.reserved || {};
  kinds.forEach((k, i) => {
    const col = i % 2, row = Math.floor(i / 2), ix = cx + 14 + col * (cw - 28) / 2, iy = 14 + 46 * sc + row * 48 * sc;
    rrect(ix, iy, (cw - 36) / 2, 40 * sc, 8); ctx.fillStyle = "rgba(255,240,210,.1)"; ctx.fill();
    drawItem(k, ix + 22 * sc, iy + 20 * sc, 12 * sc, G.time);
    const have = stock[k] || 0, held = res[k] || 0;
    text(String(have), ix + 46 * sc, iy + 20 * sc, { size: 18 * sc, weight: 800, color: have ? "#fff" : "rgba(255,255,255,.35)", base: "middle" });
    if (held) text("giữ " + held, ix + 46 * sc, iy + 34 * sc, { size: 10.5 * sc, color: "#ffcc80", base: "middle" });
    text(KIND_NAME[k], ix + (cw - 36) / 2 - 6, iy + 12 * sc, { size: 9.5 * sc, align: "right", color: "#c9b08a" });
  });
  const menu = s.menu || {}, ids = Object.keys(menu).sort(), my = 14 + kh + 12, mh = 34 * sc + ids.length * 62 * sc;
  panel(cx, my, cw, mh, { fill: "rgba(250,238,210,.95)", border: "rgba(120,70,30,.6)" });
  text("THỰC ĐƠN", cx + cw / 2, my + 24 * sc, { size: 15 * sc, align: "center", weight: 800, color: "#7a3a12" });
  const avail = {}; for (const k of kinds) avail[k] = (stock[k] || 0) - (res[k] || 0);
  ids.forEach((id, i) => {
    const d = menu[id], y = my + 36 * sc + i * 62 * sc, can = Object.entries(d.recipe).every(([k, n]) => avail[k] >= n);
    ctx.globalAlpha = can ? 1 : 0.45;
    drawDish(id, cx + 30 * sc, y + 24 * sc, 16 * sc, G.time);
    text(DISH_NAME[id] || id, cx + 56 * sc, y + 16 * sc, { size: 12.5 * sc, weight: 800, color: "#4a2410" });
    text(d.price + "k · " + d.cook_s + "s", cx + cw - 12, y + 16 * sc, { size: 12 * sc, align: "right", weight: 800, color: "#a0521a" });
    let rx = cx + 60 * sc;
    for (const [k, n] of Object.entries(d.recipe)) {
      drawItem(k, rx, y + 36 * sc, 8 * sc, 0);
      text("×" + n, rx + 10 * sc, y + 40 * sc, { size: 11 * sc, color: "#6a4020", weight: 700 }); rx += 44 * sc;
    }
    ctx.globalAlpha = 1;
  });
  text("WASD đi · E nấu / lấy món / mời khách · P tạm dừng · M âm thanh", w - 14, h - 14, { size: 12 * sc, align: "right", color: "rgba(255,255,255,.7)", stroke: "rgba(0,0,0,.35)", strokeW: 3 });
  // món đang cầm
  if (s.hand) {
    const hw = 260 * sc, hh = 52 * sc, hx = 14, hy = h - hh - 14;
    panel(hx, hy, hw, hh);
    drawDish(s.hand, hx + 30 * sc, hy + hh / 2, 16 * sc, G.time);
    text("Đang bưng: " + (DISH_NAME[s.hand] || s.hand), hx + 56 * sc, hy + hh / 2 + 5, { size: 14 * sc, weight: 800, color: "#ffe39a" });
  }
}
function coin(x, y, r) {
  ctx.fillStyle = "#c9931e"; ctx.beginPath(); ctx.arc(x, y + 1.5, r, 0, 7); ctx.fill();
  ctx.fillStyle = "#ffd34d"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = "#e0a92a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r * 0.65, 0, 7); ctx.stroke();
}
function starIcon(x, y, r, fill) {
  const path = () => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); };
  path(); ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fill();
  if (fill > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x - r, y - r, 2 * r * fill, 2 * r); ctx.clip(); path(); ctx.fillStyle = "#ffcf3d"; ctx.fill(); ctx.restore(); }
  path(); ctx.strokeStyle = "rgba(255,220,120,.7)"; ctx.lineWidth = 1; ctx.stroke();
}

function quanEvent(e, s) {
  const d = e.data || {};
  const tbl = (id) => (s.tables || []).find((t) => t.id === id);
  const stv = (id) => (s.stoves || []).find((t) => t.id === id);
  const p = s.player ? s.player.pos : [8, 5];
  switch (e.name) {
    case "customer_arrived": { const tb = tbl(d.table_id); if (tb) floater(tb.pos[0], tb.pos[1] + 6, "Khách tới!", "#bfe3ff"); Audio2.sfx("bell"); break; }
    case "no_dish": { const tb = tbl(d.table_id); if (tb) floater(tb.pos[0], tb.pos[1] + 6, "Hết nguyên liệu — khách đi mất", "#ffb4a8", 15); Audio2.sfx("full"); break; }
    case "cook_started": { const st = stv(d.stove_id); if (st) burst(st.pos[0], st.pos[1] + 1.5, 14, { color: "#ffb347", sp0: 1, sp1: 3, life: 0.6 }); Audio2.sfx("sizzle"); break; }
    case "dish_ready": { const st = stv(d.stove_id); if (st) floater(st.pos[0], st.pos[1] + 7, "Chín rồi!", "#d6ff9a"); Audio2.sfx("ding"); break; }
    case "dish_picked": Audio2.sfx("pick"); break;
    case "served": {
      const tb = tbl(d.table_id);
      if (tb) { burst(tb.pos[0], tb.pos[1] + 1.4, 18, { color: "#fff0b0", sp0: 1, sp1: 4, life: 0.8 }); if (d.tip) floater(tb.pos[0], tb.pos[1] + 4, `Hài lòng! boa ${d.tip}k`, "#ffe39a"); }
      Audio2.sfx("serve"); break;
    }
    case "paid": {
      const tb = tbl(d.table_id), at = tb ? tb.pos : p;
      for (let i = 0; i < 14; i++) G.particles.push({ x: at[0], y: at[1] + 1.4, vx: fxRand(-3, 3), vy: fxRand(2, 6), g: -9, life: 0, max: fxRand(0.7, 1.2), size: fxRand(0.15, 0.25), kind: "coin" });
      floater(at[0], at[1] + 3, `+${d.amount}k`, "#ffd34d", 26); Audio2.sfx("coins"); break;
    }
    case "customer_left": {
      const tb = tbl(d.table_id), at = tb ? tb.pos : p;
      burst(at[0] - 1.6, at[1] + 2.5, 16, { color: "rgba(160,160,160,.8)", sp0: 0.5, sp1: 2, life: 1, s0: 0.2, s1: 0.4 });
      floater(at[0], at[1] + 5, "Khách bỏ về! −uy tín", "#ff8a80"); addShake(4); Audio2.sfx("angry"); break;
    }
  }
}
