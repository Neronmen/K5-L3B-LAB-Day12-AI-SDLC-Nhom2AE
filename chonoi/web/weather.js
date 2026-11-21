"use strict";
/*
 * Không khí trang trí (CHỈ client, ngẫu nhiên bằng fxRand, không đụng luật):
 *  sáng: sương sớm (thời gian còn > 80%), mưa phùn thỉnh thoảng (hạt xiên, vòng gợn, trời xám, tiếng mưa),
 *        chuồn chuồn sát mặt nước, cá nhỏ trang trí ở xa (mờ, không bắt được), chim bay.
 *  tối:  đom đóm lập lòe quanh ghe, ánh đèn lồng phản chiếu lăn tăn, ghe láng giềng chèo ngang.
 * Không tạo gradient trong vòng lặp hạt -> giữ 60 FPS.
 */

const Wx = { rain: 0, raining: false, nextAt: 0, until: 0, ripples: [], row: null, rowNext: 0 };

function wxNewSession() {
  Wx.rain = 0; Wx.raining = false; Wx.ripples = []; Wx.row = null;
  Wx.nextAt = G.time + fxRand(20, 55);   // cơn mưa phùn đầu tiên
  Wx.rowNext = G.time + fxRand(6, 14);
}

function wxUpdateRain(dt, active) {
  if (!active) { Wx.rain = Math.max(0, Wx.rain - dt); Audio2.loop("rain", 0); return; }
  if (!Wx.raining && G.time > Wx.nextAt) { Wx.raining = true; Wx.until = G.time + fxRand(12, 24); }
  if (Wx.raining && G.time > Wx.until) { Wx.raining = false; Wx.nextAt = G.time + fxRand(35, 70); }
  Wx.rain = clamp(Wx.rain + (Wx.raining ? 0.35 : -0.35) * dt, 0, 1);
  Audio2.loop("rain", Wx.rain);
}

// ---------------- BUỔI SÁNG ----------------
function drawGatherAmbient(v, s, layer, opts) {
  const { u, surf, sx, sy, D, w, h } = v, t = G.time;
  if (layer === "sky") {
    wxUpdateRain(G.dt, !opts.title && G.scene !== "title" && !G.paused && !(s.finished));
    if (Wx.rain > 0) { ctx.fillStyle = `rgba(105,115,128,${0.42 * Wx.rain})`; ctx.fillRect(0, 0, w, surf); }
    if (Wx.rain < 0.5) { ctx.globalAlpha = 1 - Wx.rain * 2; drawBirds(w, Math.max(80, surf), t * 0.8, 3, 0.15); ctx.globalAlpha = 1; }
    return;
  }
  if (layer === "deep") {
    // cá nhỏ trang trí ở xa: parallax 0.7, mờ, bơi qua lại — không phải cá của luật
    ctx.fillStyle = "rgba(10,40,60,.35)";
    for (let i = 0; i < 14; i++) {
      const sp = 0.6 + hash("fs" + i) * 0.9, dir = i % 2 ? 1 : -1;
      const wx = ((hash("fx" + i) * 140 + dir * t * sp) % 140 + 140) % 140 - 20;
      const px = (wx - Gather.cam * 0.7) * u + w / 2 - 20 * u, py = sy(3 + hash("fd" + i) * (D - 6) + Math.sin(t * 0.7 + i) * 0.4);
      if (px < -30 || px > w + 30) continue;
      const L = u * (0.35 + hash("fl" + i) * 0.25), wag = Math.sin(t * 8 + i) * L * 0.25;
      ctx.beginPath(); ctx.ellipse(px, py, L, L * 0.32, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px - dir * L * 0.9, py); ctx.lineTo(px - dir * L * 1.5, py - L * 0.35 + wag); ctx.lineTo(px - dir * L * 1.5, py + L * 0.35 + wag); ctx.fill();
    }
    return;
  }
  if (layer !== "front") return;
  // chuồn chuồn bay sát mặt nước (không khi mưa to)
  if (Wx.rain < 0.7) {
    for (let i = 0; i < 4; i++) {
      const wx = ((hash("dg" + i) * 100 + Math.sin(t * 0.3 + i * 2) * 14 + t * (i % 2 ? 1.5 : -1.2)) % 110 + 110) % 110 - 5;
      const px = sx(wx), py = surf - u * (0.7 + Math.sin(t * 1.7 + i) * 0.35 + hash("dh" + i) * 0.6);
      if (px < -20 || px > w + 20) continue;
      const L = Math.max(6, u * 0.42), fl = Math.sin(t * 40 + i) > 0;
      ctx.fillStyle = i % 2 ? "#2f7fa8" : "#b84a2a"; ctx.fillRect(px - L * 0.5, py - 1, L, 2.2);
      ctx.fillStyle = "rgba(220,240,255,.55)";
      ctx.beginPath(); ctx.ellipse(px - L * 0.1, py - (fl ? 3 : 1), L * 0.35, L * (fl ? 0.12 : 0.06), -0.2, 0, 7); ctx.ellipse(px + L * 0.1, py - (fl ? 3 : 1), L * 0.35, L * (fl ? 0.12 : 0.06), 0.2, 0, 7); ctx.fill();
    }
  }
  // sương sớm: dải mờ trôi sát mặt nước khi thời gian còn > 80%
  const dur = ((v.meta && v.meta.duration_s) || 180) * 60, left = (s.time_left_ticks ?? dur) / dur;
  const mist = opts.title ? 0.5 : clamp((left - 0.8) / 0.2, 0, 1);
  if (mist > 0) {
    for (let i = 0; i < 7; i++) {
      const mx = (((i * 0.21 + t * 0.012 * (1 + i % 3)) % 1.4) - 0.2) * w, my = surf - u * (0.4 + (i % 3) * 0.7);
      ctx.fillStyle = `rgba(245,248,250,${0.16 * mist})`;
      ctx.beginPath(); ctx.ellipse(mx, my, w * 0.22, u * (0.9 + (i % 2) * 0.5), 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = `rgba(240,245,250,${0.1 * mist})`; ctx.fillRect(0, 0, w, surf + u);
  }
  // mưa phùn: hạt xiên + vòng gợn trên mặt nước
  if (Wx.rain > 0.02) {
    const n = Math.floor(140 * Wx.rain);
    ctx.strokeStyle = "rgba(220,232,245,.55)"; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const sp = 0.9 + hash("rs" + i) * 0.6, ph = (t * sp + hash("rp" + i)) % 1;
      const x = ((hash("rx" + i) * (w + 200) + ph * 120) % (w + 200)) - 100, y = ph * (h + 40) - 20;
      ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 13);
    }
    ctx.stroke();
    if (Math.random() < Wx.rain * 0.9) Wx.ripples.push({ x: fxRand(0, w), y: surf + fxRand(1, 6), t0: t });
    ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1;
    Wx.ripples = Wx.ripples.filter((r) => t - r.t0 < 0.9);
    for (const r of Wx.ripples) {
      const k = (t - r.t0) / 0.9; ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, 2 + k * u * 0.8, 1 + k * u * 0.18, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------- BUỔI TỐI ----------------
function drawQuanAmbient(v, s, layer, w, h) {
  const { u, zu, sx, sy, b } = v, t = G.time;
  if (layer === "water") {
    wxUpdateRain(G.dt, false);
    // ghe láng giềng chèo ngang thỉnh thoảng
    if (!Wx.row && G.time > Wx.rowNext) Wx.row = { t0: G.time, dir: fxRand() < 0.5 ? 1 : -1, y: fxRand() < 0.5 ? 0.86 : 0.1, sp: fxRand(40, 70) };
    if (Wx.row) {
      const r = Wx.row, span = (w - v.side) + 300, x = r.dir > 0 ? -150 + (G.time - r.t0) * r.sp : (w - v.side) + 150 - (G.time - r.t0) * r.sp;
      const y = r.y * h + Math.sin(t * 1.4) * 2, us = u * 0.5;
      if ((G.time - r.t0) * r.sp > span) { Wx.row = null; Wx.rowNext = G.time + fxRand(12, 28); }
      else {
        ctx.save(); ctx.translate(x, y); ctx.scale(r.dir, 1);
        ctx.globalAlpha = 0.75;
        drawBoatSide(0, 0, us, { roof: false, color: "#2b2420", trim: "#4a2a1a" });
        // người chèo + mái chèo
        ctx.fillStyle = "#15110e"; ctx.beginPath(); ctx.arc(-0.4 * us, -1.1 * us, 0.22 * us, 0, 7); ctx.fill(); ctx.fillRect(-0.6 * us, -0.95 * us, 0.4 * us, 0.6 * us);
        const oar = Math.sin(t * 3) * 0.5;
        ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-0.3 * us, -0.7 * us); ctx.lineTo(-0.3 * us - Math.cos(oar) * 1.6 * us, 0.5 * us + Math.sin(oar) * 0.3 * us); ctx.stroke();
        ctx.restore(); ctx.globalAlpha = 1;
        lantern(x + r.dir * 0.8 * us, y - 1.4 * us, us * 0.45, t, 0.9);
        reflect(x + r.dir * 0.8 * us, y + 0.6 * us, us * 0.6, t, 6);
      }
    }
    return;
  }
  if (layer === "reflect") {
    // ánh đèn lồng hai góc trước phản chiếu dưới mạn ghe
    const x0 = sx(b.x[0]), y0 = sy(b.z[1]), H = (b.z[1] - b.z[0]) * zu, hull = 1.5 * u;
    for (const lx of [b.x[0] + 0.2, b.x[1] - 0.2]) reflect(sx(lx), y0 + H + hull * 1.05, u * 0.9, t + lx, 9);
    reflect(x0 + (b.x[1] - b.x[0]) * u * 0.5, y0 + H + hull * 1.1, u * 1.6, t, 7, "255,200,140");
    return;
  }
  if (layer !== "front") return;
  // đom đóm lập lòe quanh ghe
  const x0 = sx(b.x[0]), x1 = sx(b.x[1]), y0 = sy(b.z[1]) - 3 * u, y1 = sy(b.z[0]) + 2 * u;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 22; i++) {
    const fx = lerp(x0 - 3 * u, x1 + 4 * u, hash("ff" + i)) + Math.sin(t * (0.4 + hash("fa" + i) * 0.5) + i) * 1.6 * u;
    const fy = lerp(y0, y1, hash("fy" + i)) + Math.cos(t * (0.3 + hash("fb" + i) * 0.4) + i * 2) * 1.1 * u;
    const blink = Math.pow(Math.max(0, Math.sin(t * (1.2 + hash("fc" + i) * 1.6) + i * 3)), 3);
    if (blink < 0.03) continue;
    ctx.fillStyle = `rgba(200,255,120,${0.16 * blink})`; ctx.beginPath(); ctx.arc(fx, fy, 6 + u * 0.15, 0, 7); ctx.fill();
    ctx.fillStyle = `rgba(235,255,170,${0.95 * blink})`; ctx.beginPath(); ctx.arc(fx, fy, 1.8, 0, 7); ctx.fill();
  }
  ctx.restore();
}
// vệt sáng lăn tăn trên nước dưới một nguồn đèn
function reflect(x, y, wid, t, n, rgb = "255,170,80") {
  for (let i = 0; i < n; i++) {
    const yy = y + i * 5, ww = wid * (1 - i / (n + 2)) * (0.7 + Math.sin(t * 3 + i * 1.3) * 0.3);
    ctx.fillStyle = `rgba(${rgb},${0.32 - i * 0.03})`;
    ctx.fillRect(x - ww / 2 + Math.sin(t * 2.2 + i) * 3, yy, ww, 2);
  }
}
