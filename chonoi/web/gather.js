"use strict";
/* Cảnh BUỔI SÁNG — nhìn ngang mặt cắt dòng sông. Thế giới: x ∈ [0,100], d ∈ [0,30] (d xuống). Camera bám theo Út Sen. */

const Gather = { cam: 0, view: null, face: 1 };

function gatherView(w, h, s) {
  const meta = s.meta || {}, b = meta.bounds || { x: [0, 100], d: [0, 30] };
  const SKY = 9, D = b.d[1], FULL = SKY + D + 1.2;
  // chỉ thấy ~22 m theo chiều dọc: camera bám theo cả độ sâu -> nhân vật to, cảm giác lặn sâu
  const V = Math.min(FULL, Math.max(16, h / 26));
  const u = h / V;
  const halfW = w / u / 2;
  const tx = G.disp ? G.disp[0] : 2, td = G.disp ? G.disp[1] : 0;
  const lo = b.x[0] - 8 + halfW, hi = b.x[1] + 3 - halfW;
  const want = lo > hi ? (b.x[0] + b.x[1]) / 2 : clamp(tx, lo, hi);
  const wantTop = clamp(td - V * 0.45, -SKY, D + 1.2 - V);
  Gather.cam = Gather.view ? lerp(Gather.cam, want, 0.12) : want;
  Gather.top = Gather.view && Gather.top !== undefined ? lerp(Gather.top, wantTop, 0.1) : wantTop;
  const surf = -Gather.top * u;
  const v = { u, surf, D, b, meta, w, h, sx: (x) => (x - Gather.cam) * u + w / 2, sy: (d) => surf + d * u };
  Gather.view = v;
  return v;
}

function drawGatherScene(w, h, s, opts = {}) {
  const v = gatherView(w, h, s), { u, surf, sx, sy, D, b, meta } = v, t = G.time;
  const dur = (meta.duration_s || 180) * 60;
  const dayFrac = opts.title ? 0.35 : clamp(1 - (s.time_left_ticks ?? dur) / dur, 0, 1);

  // ---- bầu trời: bình minh -> trưa ----
  const sky = ctx.createLinearGradient(0, 0, 0, surf);
  sky.addColorStop(0, mixColor("#f7a37a", "#59b6e8", dayFrac));
  sky.addColorStop(1, mixColor("#ffe0a8", "#cdeefc", dayFrac));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, surf);
  // mặt trời mọc dần
  const sunX = w * (0.15 + dayFrac * 0.6), sunY = surf * (0.95 - dayFrac * 0.75);
  const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, u * 5);
  sg.addColorStop(0, "rgba(255,250,220,1)"); sg.addColorStop(0.25, "rgba(255,226,150,.9)"); sg.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sunX, sunY, u * 5, 0, 7); ctx.fill();
  // mây trôi
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 37 + t * (1.2 + i * 0.3)) % (w / u + 30)) * u - 10 * u, cy = surf * (0.12 + (i % 3) * 0.13);
    cloud(cx - (Gather.cam * u * 0.05) % (w + 400), cy, u * (1 + (i % 2) * 0.6));
  }
  // bờ xa: hàng dừa (parallax 0.3)
  ctx.fillStyle = mixColor("#5d8c6a", "#4f8f58", dayFrac);
  ctx.beginPath(); ctx.moveTo(0, surf);
  for (let x = 0; x <= w; x += 20) ctx.lineTo(x, surf - u * (1.2 + Math.sin((x / u + Gather.cam * 0.3) * 0.15) * 0.4));
  ctx.lineTo(w, surf); ctx.fill();
  for (let i = -2; i < 40; i++) {
    const wx = i * 7 + 3, px = (wx - Gather.cam * 0.3) * u + w / 2 - 20 * u;
    if (px < -100 || px > w + 100) continue;
    ctx.globalAlpha = 0.7; drawPalm(px, surf - u * 1.1, u, t, 0.55 + hash("p" + i) * 0.3); ctx.globalAlpha = 1;
  }
  // ghe chợ nổi xa (parallax 0.6)
  for (let i = 0; i < 12; i++) {
    const wx = i * 14 + 6 + Math.sin(t * 0.1 + i) * 1.5, px = (wx - Gather.cam * 0.6) * u + w / 2 - 25 * u;
    if (px < -200 || px > w + 200) continue;
    ctx.globalAlpha = 0.85;
    drawBoatSide(px, surf - 0.05 * u + Math.sin(t * 1.4 + i) * 0.05 * u, u * 0.6,
      { beo: i % 2 === 0, seed: i, color: i % 3 ? "#5a3d26" : "#2f4f6b", roofColor: i % 2 ? "#3d2b1d" : "#7a5a32" });
    ctx.globalAlpha = 1;
  }

  // ---- bờ bên trái + bến + nhà sàn ----
  const bankX = sx(b.x[0] - 1.2);
  if (bankX > -10) {
    ctx.fillStyle = "#7b5b3a"; ctx.beginPath(); ctx.moveTo(-10, surf - u * 0.6); ctx.lineTo(bankX, surf - u * 0.6);
    ctx.quadraticCurveTo(bankX + u, surf + D * u * 0.5, bankX - u * 0.5, sy(D + 1)); ctx.lineTo(-10, sy(D + 1)); ctx.fill();
    ctx.fillStyle = "#5c8a3c"; ctx.fillRect(-10, surf - u * 0.9, bankX + 10, u * 0.35);
    // nhà sàn mái lá
    const hx = bankX - 5 * u;
    ctx.fillStyle = "#6b4a2b"; for (let i = 0; i < 4; i++) ctx.fillRect(hx + i * 1.2 * u, surf - 2.4 * u, 0.15 * u, 2 * u);
    ctx.fillStyle = "#a57a4c"; ctx.fillRect(hx - 0.3 * u, surf - 4.4 * u, 4.2 * u, 2.1 * u);
    ctx.fillStyle = "#3b2a1b"; ctx.fillRect(hx + 1.4 * u, surf - 3.9 * u, 0.9 * u, 1.6 * u);
    ctx.fillStyle = "#c9a35c"; ctx.beginPath(); ctx.moveTo(hx - 1 * u, surf - 4.2 * u); ctx.lineTo(hx + 1.8 * u, surf - 6.4 * u); ctx.lineTo(hx + 4.6 * u, surf - 4.2 * u); ctx.fill();
  }
  const dp = meta.dock_pos || [2, 0], dr = meta.dock_radius || 3;
  // cầu bến gỗ
  ctx.fillStyle = "#8d6338"; ctx.fillRect(sx(b.x[0] - 1.5), surf - 0.55 * u, (dp[0] + 1.6 - b.x[0] + 1.5) * u, 0.3 * u);
  ctx.fillStyle = "#5b3f22"; for (let x = b.x[0] - 1; x <= dp[0] + 1.5; x += 1.5) ctx.fillRect(sx(x), surf - 0.3 * u, 0.18 * u, 1.6 * u);
  // xuồng ba lá neo ở bến
  drawBoatSide(sx(dp[0] + 0.2), surf + 0.05 * u + Math.sin(t * 1.6) * 0.05 * u, u * 0.55, { roof: false, color: "#7a4f2c", trim: "#2e6b8a" });
  // vùng bến
  ctx.strokeStyle = "rgba(255,240,180,.55)"; ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(sx(dp[0]), sy(dp[1]), dr * u, 0, Math.PI); ctx.stroke(); ctx.setLineDash([]);
  text("BẾN", sx(dp[0]), surf - 1.0 * u, { size: Math.max(11, u * 0.55), align: "center", color: "#fff3d1", stroke: "rgba(60,30,10,.7)", weight: 800 });

  // ---- nước ----
  const water = ctx.createLinearGradient(0, surf, 0, sy(D));
  water.addColorStop(0, "#3fa7c9"); water.addColorStop(0.15, "#2b86a8"); water.addColorStop(0.55, "#145a7a"); water.addColorStop(1, "#06263d");
  ctx.fillStyle = water; ctx.fillRect(0, surf, w, sy(D + 1.2) - surf);
  // tia nắng xiên
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 9; i++) {
    const bx = ((i * 13 - Gather.cam * 0.9) % (w / u + 20) + w / u + 20) % (w / u + 20) * u - 5 * u;
    const a = 0.045 + Math.sin(t * 0.7 + i * 1.7) * 0.03;
    const rg = ctx.createLinearGradient(0, surf, 0, surf + 18 * u);
    rg.addColorStop(0, `rgba(200,240,255,${a})`); rg.addColorStop(1, "rgba(200,240,255,0)");
    ctx.fillStyle = rg; ctx.beginPath();
    ctx.moveTo(bx, surf); ctx.lineTo(bx + 1.6 * u, surf); ctx.lineTo(bx + 7 * u, surf + 18 * u); ctx.lineTo(bx + 3 * u, surf + 18 * u); ctx.fill();
  }
  ctx.restore();
  // hạt phù sa trôi
  ctx.fillStyle = "rgba(220,240,230,.25)";
  for (let i = 0; i < 60; i++) {
    const wx = (hash("m" + i) * 110 + t * 0.15 * (0.5 + hash("n" + i))) % 110 - 5, wd = 1 + hash("d" + i) * (D - 1) + Math.sin(t + i) * 0.3;
    ctx.fillRect(sx(wx), sy(wd), 2, 2);
  }
  // đáy sông: bùn + rong + đá
  ctx.fillStyle = "#3a2f22";
  ctx.beginPath(); ctx.moveTo(sx(b.x[0] - 10), sy(D + 1.2));
  for (let x = b.x[0] - 10; x <= b.x[1] + 10; x += 1) ctx.lineTo(sx(x), sy(D + 0.25 + Math.sin(x * 0.5) * 0.25 + Math.sin(x * 0.13) * 0.4));
  ctx.lineTo(sx(b.x[1] + 10), sy(D + 1.2)); ctx.fill();
  for (let i = 0; i < 40; i++) {
    const wx = i * 2.7 + hash("r" + i) * 2, px = sx(wx);
    if (px < -40 || px > w + 40) continue;
    const hgt = (1.5 + hash("h" + i) * 3.5) * u;
    ctx.strokeStyle = i % 3 ? "#2f6b3a" : "#4a7a2c"; ctx.lineWidth = Math.max(2, 0.18 * u); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(px, sy(D + 0.3));
    ctx.quadraticCurveTo(px + Math.sin(t * 1.2 + i) * 0.6 * u, sy(D + 0.3) - hgt * 0.5, px + Math.sin(t * 1.2 + i + 1) * 0.9 * u, sy(D + 0.3) - hgt); ctx.stroke();
    if (i % 4 === 0) { ctx.fillStyle = "#4d4a44"; ctx.beginPath(); ctx.ellipse(px + 0.8 * u, sy(D + 0.35), 0.7 * u, 0.4 * u, 0, Math.PI, 0); ctx.fill(); }
  }
  // biên phải: cọc tre chắn
  const rx = sx(b.x[1] + 0.6);
  if (rx < w + 20) { ctx.fillStyle = "#6f8a3a"; for (let d = -0.6; d < D + 1; d += 0.9) ctx.fillRect(rx, sy(d), 0.25 * u, 0.7 * u); }

  // ---- nút hái ----
  const regrowMax = (meta.regrow_s || 20) * 60;
  for (const n of s.nodes || []) drawNode(sx(n.pos[0]), sy(n.pos[1]), u, n.kind, n.ready !== false, t, (n.regrow_ticks || 0) / regrowMax);
  // ---- đàn cá ----
  for (const f of s.fish || []) drawSchool(sx(f.pos[0]), sy(f.pos[1]), u, f.kind, t, hash(f.id));

  // ---- Út Sen ----
  const p = s.player;
  if (p && !opts.title) {
    if (!G.disp) G.disp = [...p.pos];
    G.disp[0] = lerp(G.disp[0], p.pos[0], 0.45); G.disp[1] = lerp(G.disp[1], p.pos[1], 0.45);
    const vx = p.vel ? p.vel[0] : 0, vd = p.vel ? p.vel[1] : 0, moving = Math.hypot(vx, vd) > 0.3;
    if (Math.abs(vx) > 0.2) Gather.face = vx > 0 ? 1 : -1;
    const under = p.at_surface === false;
    const blink = p.invuln_ticks > 0 && Math.floor(t * 12) % 2;
    // bong bóng thở ra
    if (under && Math.random() < (moving ? 0.12 : 0.05)) G.particles.push({ x: G.disp[0] + Gather.face * 0.5, y: G.disp[1] - 0.2, vx: fxRand(-0.2, 0.2), vy: -fxRand(1.2, 2), g: 0, life: 0, max: fxRand(1, 2.2), size: fxRand(0.06, 0.16), kind: "bubble" });
    if (!blink) drawSenSide(sx(G.disp[0]), sy(G.disp[1]) + (under ? 0 : 0.1 * u), u * 1.45,
      { face: Gather.face, t, under, moving, pitch: under ? Math.atan2(vd, Math.abs(vx) + 0.01) * 0.6 * (Math.abs(vx) > 0.2 || Math.abs(vd) > 0.2 ? 1 : 0) : 0 });
    // gợi ý thao tác
    hintGather(v, s, p, under);
    // gợn sóng quanh người khi ở mặt nước
    if (!under) {
      ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.5;
      for (let k = 0; k < 2; k++) { const r = ((t * 1.2 + k * 0.5) % 1); ctx.globalAlpha = 1 - r; ctx.beginPath(); ctx.ellipse(sx(G.disp[0]), surf + 2, (0.6 + r * 1.4) * u, 0.15 * u, 0, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
  }
  // mặt nước gợn sóng
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.beginPath(); ctx.moveTo(0, surf);
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, surf + Math.sin(x * 0.03 + t * 2) * 2.2 + Math.sin(x * 0.011 - t) * 1.5);
  ctx.lineTo(w, surf + 6); ctx.lineTo(0, surf + 6); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, surf + Math.sin(x * 0.03 + t * 2) * 2.2 + Math.sin(x * 0.011 - t) * 1.5);
  ctx.stroke();

  drawParticles(sx, sy, u);

  // tối dần theo độ sâu: vùng sáng quanh người (đèn đội đầu)
  if (p && !opts.title && G.disp && G.disp[1] > 6) {
    const k = clamp((G.disp[1] - 6) / (D - 6), 0, 1) * 0.6;
    const px = sx(G.disp[0]), py = sy(G.disp[1]);
    const vg = ctx.createRadialGradient(px, py, u * 2, px, py, u * 14);
    vg.addColorStop(0, "rgba(2,12,24,0)"); vg.addColorStop(1, `rgba(2,12,24,${k})`);
    ctx.fillStyle = vg; ctx.fillRect(0, surf, w, h - surf);
  }
}

function hintGather(v, s, p, under) {
  const { u, sx, sy, meta } = v;
  const px = p.pos[0], pd = p.pos[1];
  let msg = null, at = null;
  const dp = meta.dock_pos || [2, 0];
  if (Math.hypot(px - dp[0], pd - dp[1]) <= (meta.dock_radius || 3)) { msg = "E  Cập bến"; at = [dp[0], -1.8]; }
  else if (!under) {
    const r = meta.interact_radius || 2;
    const n = (s.nodes || []).filter((n) => n.ready !== false && Math.hypot(px - n.pos[0], pd - n.pos[1]) <= r)[0];
    if (n) { msg = (s.hold_count >= s.hold_capacity) ? "Giỏ đầy!" : "E  Hái " + (KIND_NAME[n.kind] || ""); at = [n.pos[0], -2.2]; }
  } else if (!(p.catch_cd_ticks > 0)) {
    const r = meta.catch_radius || 2;
    const f = (s.fish || []).filter((f) => Math.hypot(px - f.pos[0], pd - f.pos[1]) <= r)[0];
    if (f) { msg = "SPACE  Bắt " + (KIND_NAME[f.kind] || ""); at = [f.pos[0], f.pos[1] - 1.6]; }
  }
  if (msg) keyHint(sx(at[0]), sy(at[1]) + Math.sin(G.time * 5) * 3, msg, u);
}

function keyHint(x, y, msg, u) {
  ctx.font = `800 ${Math.max(12, u * 0.6)}px ${FONT}`;
  const tw = ctx.measureText(msg).width + 22, th = Math.max(22, u * 1.1);
  panel(x - tw / 2, y - th / 2, tw, th, { r: th / 2, fill: "rgba(255,248,230,.95)", border: "rgba(180,120,40,.8)" });
  text(msg, x, y + 1, { size: Math.max(12, u * 0.6), align: "center", base: "middle", color: "#6b3a14", weight: 800 });
}

function cloud(x, y, r) {
  ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.beginPath(); ctx.arc(x, y, r * 1.2, 0, 7); ctx.arc(x + r * 1.4, y + r * 0.2, r, 0, 7); ctx.arc(x - r * 1.3, y + r * 0.3, r * 0.9, 0, 7); ctx.arc(x + r * 0.4, y - r * 0.6, r * 0.9, 0, 7); ctx.fill();
}
function mixColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `rgb(${r},${g},${bl})`;
}

// ---------------- HUD buổi sáng ----------------
function drawGatherHud(w, h, s) {
  const p = s.player || {}, sc = hudScale(w);
  // khung trái trên: đồng hồ + oxy + Máu
  const x0 = 14, y0 = 14, pw = 300 * sc, ph = 96 * sc;
  panel(x0, y0, pw, ph);
  text("☀ " + fmtTime(s.time_left_ticks), x0 + 14 * sc, y0 + 30 * sc, { size: 22 * sc, weight: 800, color: "#ffe39a" });
  // tim
  for (let i = 0; i < (p.hp_max || 3); i++) heart(x0 + pw - 30 * sc - i * 30 * sc, y0 + 22 * sc, 11 * sc, i < (p.hp_max || 3) - (p.hp ?? 3) ? 0 : 1);
  // oxy
  const frac = p.oxygen_max_ticks ? p.oxygen_ticks / p.oxygen_max_ticks : 1, low = frac < 0.25;
  const bx = x0 + 44 * sc, by = y0 + 50 * sc, bw = pw - 60 * sc, bh = 20 * sc;
  drawItemBubble(x0 + 26 * sc, by + bh / 2, 11 * sc);
  rrect(bx, by, bw, bh, bh / 2); ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fill();
  const pulse = low ? 0.6 + Math.sin(G.time * 12) * 0.4 : 1;
  const og = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  og.addColorStop(0, low ? `rgba(255,80,70,${pulse})` : "#4fd1ff"); og.addColorStop(1, low ? `rgba(255,140,90,${pulse})` : "#9ff0ff");
  if (frac > 0) { rrect(bx, by, Math.max(bh, bw * frac), bh, bh / 2); ctx.fillStyle = og; ctx.fill(); }
  text("Oxy " + Math.ceil((p.oxygen_ticks || 0) / 60) + "s", bx + bw / 2, by + bh * 0.72, { size: 13 * sc, align: "center", weight: 800, color: "#08324a" });
  const status = p.at_surface === false ? (p.oxygen_ticks === 0 ? "ĐANG NGẠT! Ngoi lên ngay!" : "Đang lặn · " + p.pos[1].toFixed(1) + " m") : "Trên mặt nước · hồi oxy";
  text(status, x0 + 14 * sc, y0 + 88 * sc, { size: 12.5 * sc, color: p.oxygen_ticks === 0 && p.at_surface === false ? "#ff8a80" : "#f3dcb8" });
  if (p.catch_cd_ticks > 0) text("hồi chiêu " + (p.catch_cd_ticks / 60).toFixed(1) + "s", x0 + pw - 14 * sc, y0 + 88 * sc, { size: 12 * sc, align: "right", color: "#bfe7ff" });

  // ngày + nhãn
  const day = (s.story && s.story.day) || 1;
  const lbl = `Ngày ${day} · Buổi sáng`;
  ctx.font = `800 ${16 * sc}px ${FONT}`; const lw = ctx.measureText(lbl).width + 30;
  panel(w - lw - 14, 14, lw, 36 * sc);
  text(lbl, w - lw / 2 - 14, 14 + 24 * sc, { size: 16 * sc, align: "center", weight: 800, color: "#ffe39a" });

  // giỏ dưới giữa
  const cap = s.hold_capacity || 12, slot = 40 * sc, gap = 6 * sc, gw = cap * (slot + gap) + 24 * sc, gh = slot + 40 * sc;
  const gx = (w - gw) / 2, gy = h - gh - 12;
  panel(gx, gy, gw, gh);
  text(`GIỎ  ${s.hold_count ?? 0}/${cap}`, gx + 14 * sc, gy + 20 * sc, { size: 13 * sc, weight: 800, color: "#ffe39a" });
  text("mới nhất →", gx + gw - 14 * sc, gy + 20 * sc, { size: 11 * sc, align: "right", color: "#c9b08a" });
  for (let i = 0; i < cap; i++) {
    const x = gx + 12 * sc + i * (slot + gap), y = gy + 28 * sc;
    rrect(x, y, slot, slot, 8 * sc); ctx.fillStyle = "rgba(255,240,210,.12)"; ctx.fill();
    ctx.strokeStyle = "rgba(255,220,160,.25)"; ctx.lineWidth = 1; ctx.stroke();
    const k = (s.hold || [])[i];
    if (k) drawItem(k, x + slot / 2, y + slot / 2, slot * 0.32, G.time);
  }
  if ((s.hold_count ?? 0) >= cap) text("ĐẦY", gx + gw / 2, gy + 20 * sc, { size: 13 * sc, align: "center", weight: 800, color: "#ff8a80" });

  // phím
  if (!UI.touch) text("WASD bơi · E hái / cập bến · SPACE bắt cá · P tạm dừng · H hướng dẫn · M âm thanh", w - 14, h - 14, { size: 12 * sc, align: "right", color: "rgba(255,255,255,.7)", stroke: "rgba(0,0,0,.35)", strokeW: 3 });

  // cảnh báo ngạt: viền đỏ
  if (p.at_surface === false && frac < 0.2) {
    const a = (0.2 - frac) / 0.2 * (0.35 + Math.sin(G.time * 10) * 0.15);
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
    vg.addColorStop(0, "rgba(200,0,0,0)"); vg.addColorStop(1, `rgba(200,0,0,${a})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }
}
function heart(x, y, r, full) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(0, r * 0.9); ctx.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.7, -r * 1.3, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.7, -r * 1.3, r * 1.6, -r * 0.2, 0, r * 0.9);
  ctx.fillStyle = full ? "#ff5d73" : "rgba(255,255,255,.15)"; ctx.fill();
  ctx.strokeStyle = full ? "#ffc0c8" : "rgba(255,255,255,.35)"; ctx.lineWidth = 1.5; ctx.stroke();
  if (full) { ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(-r * 0.45, -r * 0.35, r * 0.2, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawItemBubble(x, y, r) {
  ctx.strokeStyle = "#bff3ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  ctx.fillStyle = "rgba(191,243,255,.25)"; ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, 7); ctx.fill();
}

// ---------------- sự kiện -> hiệu ứng ----------------
function gatherEvent(e, s) {
  const d = e.data || {}, p = s.player ? s.player.pos : [0, 0];
  switch (e.name) {
    case "dive": burst(d.pos ? d.pos[0] : p[0], 0, 18, { a0: -Math.PI, a1: 0, sp0: 2, sp1: 6, g: 14, color: "#e8fbff", life: 0.8 }); Audio2.sfx("splash"); break;
    case "surface": burst(d.pos ? d.pos[0] : p[0], 0, 14, { a0: -Math.PI, a1: 0, sp0: 2, sp1: 5, g: 14, color: "#e8fbff", life: 0.7 }); Audio2.sfx("gasp"); break;
    case "gather": {
      const n = (s.nodes || []).find((n) => n.id === d.node_id), at = n ? n.pos : p;
      burst(at[0], -0.6, 16, { color: d.kind === "bong_sung" ? "#ff9fc0" : "#ffd84a", sp0: 1, sp1: 4, g: 4, life: 0.9 });
      floater(at[0], -1.8, `+${d.count || 1} ${KIND_NAME[d.kind] || d.kind}`, "#fff2c4"); Audio2.sfx("pluck"); break;
    }
    case "fish_caught":
      burst(p[0], p[1], 20, { color: "#d8f6ff", sp0: 1, sp1: 5, life: 0.8 });
      for (let i = 0; i < 8; i++) G.particles.push({ x: p[0] + fxRand(-1, 1), y: p[1], vx: fxRand(-0.4, 0.4), vy: -fxRand(1, 3), g: 0, life: 0, max: fxRand(0.8, 1.6), size: fxRand(0.08, 0.2), kind: "bubble" });
      floater(p[0], p[1] - 1.2, `+${d.count || 1} ${KIND_NAME[d.kind] || d.kind}`, "#c8f4ff"); Audio2.sfx("catch"); break;
    case "hold_full": floater(p[0], p[1] - 1.6, "Giỏ đầy!", "#ff9a8a"); Audio2.sfx("full"); break;
    case "oxygen_empty": floater(p[0], p[1] - 1.6, "Hết oxy!", "#ff9a8a", 22); Audio2.sfx("warn"); break;
    case "choke": addShake(10); addFlash(0.5); floater(p[0], p[1] - 1.4, "-1 ♥", "#ff6b7d", 24); Audio2.sfx("hurt"); break;
    case "faint": addShake(16); addFlash(0.8); break;
    case "node_regrown": { const n = (s.nodes || []).find((n) => n.id === d.node_id); if (n) { burst(n.pos[0], -0.6, 10, { color: "#fffbd0", sp0: 0.5, sp1: 2, life: 0.8 }); } Audio2.sfx("regrow"); break; }
  }
}
