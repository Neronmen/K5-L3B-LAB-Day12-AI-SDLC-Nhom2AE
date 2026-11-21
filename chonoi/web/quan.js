"use strict";
/* Cảnh BUỔI TỐI — quán trên ghe, nhìn từ trên xuống. Thế giới: x ∈ [0,16], z ∈ [0,10] (z lên = bắc = lên màn hình). */

const Quan = { view: null, angle: 0 };

function quanView(w, h, s) {
  const meta = s.meta || {}, b = meta.bounds || { x: [0, 16], z: [0, 10] };
  const X = b.x[1] - b.x[0], Z = b.z[1] - b.z[0];
  const top = 92, bottom = 110, side = Math.min(320, w * 0.24);
  const u = Math.max(16, Math.min((w - side - 60) / (X + 3), (h - top - bottom) / (Z + 3)));
  const ox = (w - side - u * X) / 2 + 10, oy = top + 1.5 * u + (h - top - bottom - u * (Z + 3)) / 2;
  const v = { u, b, meta, X, Z, side, ox, oy, sx: (x) => ox + (x - b.x[0]) * u, sy: (z) => oy + (b.z[1] - z) * u };
  Quan.view = v;
  return v;
}

function drawQuanScene(w, h, s) {
  const v = quanView(w, h, s), { u, sx, sy, b, meta, X, Z } = v, t = G.time;
  // nước đêm + ánh trăng
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#0b1a33"); bg.addColorStop(1, "#071022");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(140,180,255,.08)"; ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const y = (i * 37 + t * 8) % h, x = (hash("w" + i) * w + Math.sin(t + i) * 20);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 4, x + 40, y); ctx.stroke();
  }
  // ghe láng giềng mờ quanh
  for (let i = 0; i < 4; i++) {
    const gx = [0.05, 0.9, 0.1, 0.85][i] * (w - v.side), gy = [0.15, 0.2, 0.85, 0.9][i] * h + Math.sin(t * 0.6 + i) * 4;
    ctx.globalAlpha = 0.35; boatTop(gx, gy, u * 0.5, i); ctx.globalAlpha = 1;
    lantern(gx, gy - u * 0.4, u * 0.35, t + i, 0.5);
  }

  // thân ghe quán
  const x0 = sx(b.x[0]), y0 = sy(b.z[1]), W = X * u, H = Z * u;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 30;
  ctx.fillStyle = "#4a2e1a";
  ctx.beginPath(); ctx.moveTo(x0 - 0.8 * u, y0 - 0.6 * u); ctx.lineTo(x0 + W + 0.8 * u, y0 - 0.6 * u);
  ctx.quadraticCurveTo(x0 + W + 2.6 * u, y0 + H / 2, x0 + W + 0.8 * u, y0 + H + 0.6 * u);
  ctx.lineTo(x0 - 0.8 * u, y0 + H + 0.6 * u); ctx.quadraticCurveTo(x0 - 2.2 * u, y0 + H / 2, x0 - 0.8 * u, y0 - 0.6 * u); ctx.fill();
  ctx.restore();
  // ván sàn
  for (let i = 0; i < Z * 2; i++) {
    const yy = y0 + i * u * 0.5;
    ctx.fillStyle = i % 2 ? "#a77b4f" : "#9b6f45"; ctx.fillRect(x0, yy, W, u * 0.5);
    ctx.fillStyle = "rgba(60,30,10,.35)"; ctx.fillRect(x0, yy + u * 0.48, W, u * 0.04);
    for (let k = 0; k < 4; k++) { const nx = x0 + ((hash("v" + i + k) * W)); ctx.fillRect(nx, yy + u * 0.2, 2, 2); }
  }
  ctx.strokeStyle = "#5c3a1f"; ctx.lineWidth = u * 0.22; ctx.strokeRect(x0 - u * 0.1, y0 - u * 0.1, W + u * 0.2, H + u * 0.2);
  // mắt ghe ở mũi
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(x0 + W + 1.4 * u, y0 + H * 0.3, u * 0.35, u * 0.2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#c62828"; ctx.beginPath(); ctx.arc(x0 + W + 1.45 * u, y0 + H * 0.3, u * 0.13, 0, 7); ctx.fill();
  // chiếu + lu nước trang trí
  ctx.fillStyle = "rgba(205,170,100,.5)"; rrect(sx(11.5), sy(9.3), 3.8 * u, 2.4 * u, 6); ctx.fill();
  ctx.fillStyle = "#6b4a33"; ctx.beginPath(); ctx.arc(sx(15), sy(1), u * 0.55, 0, 7); ctx.fill();
  ctx.fillStyle = "#233a4a"; ctx.beginPath(); ctx.arc(sx(15), sy(1), u * 0.4, 0, 7); ctx.fill();

  // bếp
  for (const st of s.stoves || []) drawStove(sx(st.pos[0]), sy(st.pos[1]), u, st, s, t);
  // bàn + khách
  const byTable = {};
  for (const c of s.customers || []) byTable[c.table_id] = c;
  for (const tb of s.tables || []) drawTable(sx(tb.pos[0]), sy(tb.pos[1]), u, tb, byTable[tb.id], s, t);

  // Út Sen
  const p = s.player;
  if (p) {
    if (!G.disp) G.disp = [...p.pos];
    G.disp[0] = lerp(G.disp[0], p.pos[0], 0.45); G.disp[1] = lerp(G.disp[1], p.pos[1], 0.45);
    const vx = p.vel ? p.vel[0] : 0, vz = p.vel ? p.vel[1] : 0, moving = Math.hypot(vx, vz) > 0.3;
    if (moving) { const target = Math.atan2(-vz, vx); let d = target - Quan.angle; d = Math.atan2(Math.sin(d), Math.cos(d)); Quan.angle += d * 0.25; }
    const px = sx(G.disp[0]), py = sy(G.disp[1]);
    const r = meta.interact_radius || 1.5;
    ctx.strokeStyle = "rgba(255,230,160,.25)"; ctx.setLineDash([5, 6]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px, py, r * u, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    drawSenTop(px, py, u * 1.1, { t, moving, angle: Quan.angle });
    if (s.hand) { const bob = Math.sin(t * 6) * 2; drawDish(s.hand, px, py - u * 0.95 + bob, u * 0.38, t); }
    hintQuan(v, s, p);
  }
  // đèn lồng đầu ghe (ánh sáng ấm)
  const lamps = [[b.x[0] + 0.3, b.z[1] - 0.3], [b.x[1] - 0.3, b.z[1] - 0.3], [b.x[0] + 0.3, b.z[0] + 0.3], [b.x[1] - 0.3, b.z[0] + 0.3], [(b.x[0] + b.x[1]) / 2, b.z[1] - 0.3]];
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (const [lx, lz] of lamps) {
    const gx = sx(lx), gy = sy(lz), rad = u * (4 + Math.sin(t * 3 + lx) * 0.2);
    const lg = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
    lg.addColorStop(0, "rgba(255,170,80,.28)"); lg.addColorStop(1, "rgba(255,120,40,0)");
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(gx, gy, rad, 0, 7); ctx.fill();
  }
  ctx.restore();
  for (const [lx, lz] of lamps) lantern(sx(lx), sy(lz), u * 0.45, t + lx, 1);
  drawParticles(sx, sy, u);
}

function boatTop(x, y, u, i) {
  ctx.fillStyle = i % 2 ? "#4a3324" : "#3a4a5a";
  ctx.beginPath(); ctx.ellipse(x, y, u * 4, u * 1.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#2a1d14"; ctx.beginPath(); ctx.ellipse(x - u * 0.5, y, u * 1.8, u * 1.0, 0, 0, 7); ctx.fill();
}
function lantern(x, y, r, t, alpha) {
  const sw = Math.sin(t * 1.8) * 0.15;
  ctx.save(); ctx.translate(x, y); ctx.rotate(sw); ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.2);
  g.addColorStop(0, "#fff0b0"); g.addColorStop(0.5, "#ff9a3c"); g.addColorStop(1, "#c4361f");
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.8, r, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#5a2a12"; ctx.fillRect(-r * 0.45, -r * 1.05, r * 0.9, r * 0.2); ctx.fillRect(-r * 0.45, r * 0.85, r * 0.9, r * 0.2);
  ctx.strokeStyle = "rgba(255,220,120,.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, r * 1.05); ctx.lineTo(0, r * 1.6); ctx.stroke();
  ctx.restore(); ctx.globalAlpha = 1;
}

function drawStove(x, y, u, st, s, t) {
  // lò đất + nồi
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(x + 0.1 * u, y + 0.15 * u, 1.05 * u, 0.85 * u, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#8a4b2e"; ctx.beginPath(); ctx.arc(x, y, 0.95 * u, 0, 7); ctx.fill();
  ctx.fillStyle = "#5e2f1b"; ctx.beginPath(); ctx.arc(x, y, 0.72 * u, 0, 7); ctx.fill();
  const cooking = st.state === "cooking", ready = st.state === "ready";
  if (cooking) { // than hồng + lửa
    const fl = 0.5 + Math.sin(t * 20) * 0.1;
    const fg = ctx.createRadialGradient(x, y, 0, x, y, 0.9 * u);
    fg.addColorStop(0, `rgba(255,230,120,${fl})`); fg.addColorStop(1, "rgba(255,80,0,0)");
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, y, 0.9 * u, 0, 7); ctx.fill();
    if (Math.random() < 0.3) G.particles.push({ x: st.pos[0] + fxRand(-0.4, 0.4), y: st.pos[1], vx: fxRand(-0.3, 0.3), vy: fxRand(0.8, 1.6), g: 0, life: 0, max: fxRand(0.5, 1), size: fxRand(0.04, 0.09), color: "#ffb347", kind: "dot" });
  }
  // nồi
  ctx.fillStyle = "#3b3b40"; ctx.beginPath(); ctx.arc(x, y, 0.58 * u, 0, 7); ctx.fill();
  ctx.fillStyle = cooking ? "#c9762e" : ready ? "#e0a040" : "#2a2a2e"; ctx.beginPath(); ctx.arc(x, y, 0.46 * u, 0, 7); ctx.fill();
  if (cooking && Math.random() < 0.25) G.particles.push({ x: st.pos[0] + fxRand(-0.3, 0.3), y: st.pos[1] + 0.2, vx: fxRand(-0.2, 0.2), vy: fxRand(0.6, 1.1), g: 0, life: 0, max: fxRand(0.8, 1.5), size: fxRand(0.15, 0.3), color: "rgba(230,230,230,.35)", kind: "dot" });
  // tiến độ nấu
  if (cooking && st.dish && s.menu && s.menu[st.dish]) {
    const total = s.menu[st.dish].cook_s * 60, frac = 1 - st.cook_ticks_left / total;
    ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 0.16 * u; ctx.beginPath(); ctx.arc(x, y, 1.15 * u, 0, 7); ctx.stroke();
    ctx.strokeStyle = "#ffc94a"; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(x, y, 1.15 * u, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke(); ctx.lineCap = "butt";
    text(Math.ceil(st.cook_ticks_left / 60) + "s", x, y + 1.75 * u, { size: Math.max(11, u * 0.45), align: "center", weight: 800, color: "#ffe2a0", stroke: "rgba(0,0,0,.6)" });
  }
  if (ready) {
    const bob = Math.sin(t * 6) * 0.12 * u;
    const gl = ctx.createRadialGradient(x, y - 1.3 * u, 0, x, y - 1.3 * u, 1.2 * u);
    gl.addColorStop(0, "rgba(255,240,150,.6)"); gl.addColorStop(1, "rgba(255,240,150,0)");
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y - 1.3 * u, 1.2 * u, 0, 7); ctx.fill();
    drawDish(st.dish, x, y - 1.3 * u + bob, u * 0.5, t);
    text("CHÍN!", x, y + 1.6 * u, { size: Math.max(11, u * 0.5), align: "center", weight: 800, color: "#b7ff8a", stroke: "rgba(0,0,0,.6)" });
  }
  text("BẾP", x, y - (ready ? 2.3 : 1.4) * u, { size: Math.max(10, u * 0.38), align: "center", weight: 800, color: "rgba(255,230,190,.8)", stroke: "rgba(0,0,0,.5)", strokeW: 3 });
}

function drawTable(x, y, u, tb, c, s, t) {
  // ghế đẩu
  ctx.fillStyle = "#6b4426";
  for (const [a, b] of [[-1.35, 0], [1.35, 0]]) { ctx.beginPath(); ctx.arc(x + a * u, y + b * u, 0.32 * u, 0, 7); ctx.fill(); }
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(x + 0.1 * u, y + 0.15 * u, 1.0 * u, 0.85 * u, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#c08a52"; ctx.beginPath(); ctx.arc(x, y, 0.9 * u, 0, 7); ctx.fill();
  ctx.strokeStyle = "#8a5a2e"; ctx.lineWidth = 0.08 * u; ctx.beginPath(); ctx.arc(x, y, 0.75 * u, 0, 7); ctx.stroke();
  text("BÀN " + tb.id, x, y + 1.55 * u, { size: Math.max(10, u * 0.36), align: "center", weight: 800, color: "rgba(255,230,190,.75)", stroke: "rgba(0,0,0,.5)", strokeW: 3 });
  if (!c) { // khăn + đũa
    ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 0.2 * u, y - 0.3 * u); ctx.lineTo(x + 0.3 * u, y + 0.2 * u); ctx.moveTo(x - 0.1 * u, y - 0.35 * u); ctx.lineTo(x + 0.4 * u, y + 0.15 * u); ctx.stroke();
    return;
  }
  const cx = x, cy = y - 1.25 * u;
  drawCustomerTop(cx, cy, u * 1.1, c, t);
  if (c.state === "eating") {
    drawDish(c.dish_id, x, y, u * 0.5, t);
    const eatMax = ((s.meta && s.meta.eat_s) || 10) * 60;
    const frac = 1 - (c.eat_ticks_left || 0) / eatMax;
    if (Math.random() < 0.03) floater((tb.pos[0]) + fxRand(-0.4, 0.4), tb.pos[1] + 1.7, "♥", "#ff8fb0", 16);
    bubble(cx + 1.0 * u, cy - 0.9 * u, u, () => text("Ngon!", cx + 1.0 * u, cy - 0.85 * u, { size: Math.max(11, u * 0.42), align: "center", base: "middle", weight: 800, color: "#7a3a12" }));
    miniBar(cx - 0.8 * u, cy + 0.55 * u, 1.6 * u, 5, frac, "#8be07a");
  } else {
    const pmax = ((s.meta && s.meta.patience_s) || 60) * 60, frac = (c.patience_ticks_left || 0) / pmax;
    const col = frac > 0.5 ? "#7be07a" : frac > 0.25 ? "#ffcc4d" : "#ff5d5d";
    // vòng kiên nhẫn
    ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 0.14 * u; ctx.beginPath(); ctx.arc(cx, cy, 0.62 * u, 0, 7); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(cx, cy, 0.62 * u, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke(); ctx.lineCap = "butt";
    const shake = frac < 0.25 ? Math.sin(t * 30) * 2 : 0;
    bubble(cx + 1.2 * u + shake, cy - 1.0 * u, u * 1.15, () => drawDish(c.dish_id, cx + 1.2 * u + shake, cy - 1.0 * u, u * 0.38, t));
    if (c.cooking) text("đang nấu…", cx, cy - 0.85 * u, { size: Math.max(10, u * 0.32), align: "center", color: "#ffe2a0", stroke: "rgba(0,0,0,.6)", strokeW: 3 });
    if (frac < 0.25) text("!!", cx - 0.75 * u, cy - 0.5 * u, { size: Math.max(14, u * 0.6), weight: 800, color: "#ff5d5d", stroke: "#fff", strokeW: 3 });
  }
}
function bubble(x, y, u, inner) {
  ctx.save();
  ctx.fillStyle = "rgba(255,250,240,.96)"; ctx.strokeStyle = "rgba(120,70,30,.6)"; ctx.lineWidth = 1.5;
  rrect(x - 0.75 * u, y - 0.5 * u, 1.5 * u, 1.0 * u, 0.35 * u); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 0.5 * u, y + 0.45 * u); ctx.lineTo(x - 0.85 * u, y + 0.85 * u); ctx.lineTo(x - 0.15 * u, y + 0.48 * u); ctx.fill();
  ctx.restore();
  inner();
}
function miniBar(x, y, w, h, frac, col) {
  rrect(x, y, w, h, h / 2); ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fill();
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
  if (msg) keyHint(v.sx(obj.pos[0]), v.sy(obj.pos[1]) - 2.6 * v.u + Math.sin(G.time * 5) * 3, msg, v.u * 0.8);
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
    case "customer_arrived": { const tb = tbl(d.table_id); if (tb) floater(tb.pos[0], tb.pos[1] + 2.6, "Khách tới!", "#bfe3ff"); Audio2.sfx("bell"); break; }
    case "no_dish": { const tb = tbl(d.table_id); if (tb) floater(tb.pos[0], tb.pos[1] + 2.6, "Hết nguyên liệu — khách đi mất", "#ffb4a8", 15); Audio2.sfx("full"); break; }
    case "cook_started": { const st = stv(d.stove_id); if (st) burst(st.pos[0], st.pos[1], 14, { color: "#ffb347", sp0: 1, sp1: 3, life: 0.6 }); Audio2.sfx("sizzle"); break; }
    case "dish_ready": { const st = stv(d.stove_id); if (st) floater(st.pos[0], st.pos[1] + 2.2, "Chín rồi!", "#d6ff9a"); Audio2.sfx("ding"); break; }
    case "dish_picked": Audio2.sfx("pick"); break;
    case "served": {
      const tb = tbl(d.table_id);
      if (tb) { burst(tb.pos[0], tb.pos[1], 18, { color: "#fff0b0", sp0: 1, sp1: 4, life: 0.8 }); if (d.tip) floater(tb.pos[0], tb.pos[1] + 2.2, `Hài lòng! boa ${d.tip}k`, "#ffe39a"); }
      Audio2.sfx("serve"); break;
    }
    case "paid": {
      const tb = tbl(d.table_id), at = tb ? tb.pos : p;
      for (let i = 0; i < 14; i++) G.particles.push({ x: at[0], y: at[1], vx: fxRand(-3, 3), vy: fxRand(2, 6), g: -9, life: 0, max: fxRand(0.7, 1.2), size: fxRand(0.15, 0.25), kind: "coin" });
      floater(at[0], at[1] + 2, `+${d.amount}k`, "#ffd34d", 26); Audio2.sfx("coins"); break;
    }
    case "customer_left": {
      const tb = tbl(d.table_id), at = tb ? tb.pos : p;
      burst(at[0], at[1] + 1.2, 16, { color: "rgba(160,160,160,.8)", sp0: 0.5, sp1: 2, life: 1, s0: 0.2, s1: 0.4 });
      floater(at[0], at[1] + 2.4, "Khách bỏ về! −uy tín", "#ff8a80"); addShake(4); Audio2.sfx("angry"); break;
    }
  }
}
