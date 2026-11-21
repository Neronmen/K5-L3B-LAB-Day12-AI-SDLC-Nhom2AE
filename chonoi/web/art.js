"use strict";
/* Nghệ thuật vẽ bằng code: Út Sen, cá, bông, món ăn, khách. Mọi hàm nhận tọa độ màn hình + đơn vị `u` (px/mét). */

const PAL = {
  skin: "#f2c39b", skinShade: "#d99f77", hair: "#2a1a14", ao: "#c2453a", aoShade: "#952f28", quan: "#2c2c3c",
  hat: "#f0d589", hatShade: "#c9a95a", hatLine: "#a88a45",
};

// nón lá nhìn ngang
function drawHatSide(x, y, u, tilt = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  ctx.fillStyle = PAL.hat;
  ctx.beginPath(); ctx.moveTo(-0.62 * u, 0); ctx.lineTo(0, -0.5 * u); ctx.lineTo(0.62 * u, 0); ctx.quadraticCurveTo(0, 0.12 * u, -0.62 * u, 0); ctx.fill();
  ctx.strokeStyle = PAL.hatLine; ctx.lineWidth = Math.max(1, u * 0.03);
  for (let i = 1; i <= 3; i++) { const k = i / 4; ctx.beginPath(); ctx.moveTo(-0.62 * u * k, -0.5 * u * (1 - k)); ctx.lineTo(0.62 * u * k, -0.5 * u * (1 - k)); ctx.stroke(); }
  ctx.restore();
}

/* Út Sen nhìn ngang (gather). face: 1 phải, -1 trái. swim: pha đạp chân. under: đang lặn. */
function drawSenSide(x, y, u, o) {
  const face = o.face || 1, t = o.t || 0, under = o.under;
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
  if (under) {
    const ang = clamp(o.pitch || 0, -0.9, 0.9);
    ctx.rotate(ang);
    const kick = Math.sin(t * (o.moving ? 12 : 4)) * (o.moving ? 0.25 : 0.1);
    // chân (quần đen) đạp
    ctx.strokeStyle = PAL.quan; ctx.lineCap = "round"; ctx.lineWidth = 0.22 * u;
    ctx.beginPath(); ctx.moveTo(-0.35 * u, 0.05 * u); ctx.lineTo(-1.05 * u, (0.05 + kick) * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.35 * u, 0.1 * u); ctx.lineTo(-1.0 * u, (0.12 - kick) * u); ctx.stroke();
    ctx.fillStyle = PAL.skin;
    ctx.beginPath(); ctx.arc(-1.1 * u, (0.05 + kick) * u, 0.1 * u, 0, 7); ctx.arc(-1.05 * u, (0.12 - kick) * u, 0.1 * u, 0, 7); ctx.fill();
    // thân áo bà ba
    ctx.fillStyle = PAL.ao; rrectU(-0.5 * u, -0.2 * u, 0.85 * u, 0.42 * u, 0.18 * u); ctx.fill();
    ctx.fillStyle = PAL.aoShade; ctx.fillRect(-0.45 * u, 0.12 * u, 0.75 * u, 0.08 * u);
    // tay vươn trước, quạt nước
    const arm = Math.sin(t * (o.moving ? 12 : 4) + 1.5) * 0.18;
    ctx.strokeStyle = PAL.ao; ctx.lineWidth = 0.16 * u;
    ctx.beginPath(); ctx.moveTo(0.25 * u, -0.05 * u); ctx.lineTo(0.85 * u, (-0.15 + arm) * u); ctx.stroke();
    ctx.fillStyle = PAL.skin; ctx.beginPath(); ctx.arc(0.9 * u, (-0.15 + arm) * u, 0.09 * u, 0, 7); ctx.fill();
    // đầu + tóc bay
    ctx.fillStyle = PAL.hair;
    ctx.beginPath(); ctx.moveTo(0.35 * u, -0.25 * u);
    ctx.quadraticCurveTo(-0.2 * u, (-0.45 + kick * 0.5) * u, -0.55 * u, (-0.3 - kick * 0.6) * u);
    ctx.quadraticCurveTo(-0.1 * u, -0.15 * u, 0.35 * u, -0.05 * u); ctx.fill();
    ctx.fillStyle = PAL.skin; ctx.beginPath(); ctx.arc(0.5 * u, -0.12 * u, 0.24 * u, 0, 7); ctx.fill();
    ctx.fillStyle = PAL.hair; ctx.beginPath(); ctx.arc(0.46 * u, -0.2 * u, 0.24 * u, Math.PI * 1.0, Math.PI * 1.95); ctx.fill();
    ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.arc(0.62 * u, -0.13 * u, 0.04 * u, 0, 7); ctx.fill();
    // má hồng + miệng phồng giữ hơi
    ctx.fillStyle = "rgba(255,120,120,.45)"; ctx.beginPath(); ctx.arc(0.6 * u, -0.03 * u, 0.06 * u, 0, 7); ctx.fill();
    // nón lá đeo sau lưng
    drawHatSide(-0.15 * u, -0.25 * u, u * 0.75, -0.6);
  } else {
    // nổi ở mặt nước: đầu + vai, nón lá trên đầu, nhấp nhô
    const bob = Math.sin(t * 3) * 0.06 * u;
    ctx.translate(0, bob);
    ctx.fillStyle = PAL.ao; rrectU(-0.38 * u, -0.25 * u, 0.76 * u, 0.5 * u, 0.2 * u); ctx.fill();
    ctx.fillStyle = PAL.skin; ctx.beginPath(); ctx.arc(0.02 * u, -0.48 * u, 0.26 * u, 0, 7); ctx.fill();
    ctx.fillStyle = PAL.hair; ctx.beginPath(); ctx.arc(-0.04 * u, -0.55 * u, 0.26 * u, Math.PI * 0.9, Math.PI * 2.0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-0.28 * u, -0.35 * u, 0.1 * u, 0.22 * u, 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.arc(0.14 * u, -0.48 * u, 0.04 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = "#8a3b2d"; ctx.lineWidth = Math.max(1, 0.03 * u); ctx.beginPath(); ctx.arc(0.13 * u, -0.38 * u, 0.06 * u, 0.2, Math.PI - 0.6); ctx.stroke();
    ctx.fillStyle = "rgba(255,120,120,.45)"; ctx.beginPath(); ctx.arc(0.2 * u, -0.4 * u, 0.05 * u, 0, 7); ctx.fill();
    drawHatSide(0, -0.66 * u, u * 1.05, 0);
  }
  ctx.restore();
}
function rrectU(x, y, w, h, r) { rrect(x, y, w, h, Math.min(r, w / 2, h / 2)); }

/* Út Sen nhìn từ trên xuống (quán): nón lá tròn che gần hết. */
function drawSenTop(x, y, u, o = {}) {
  const t = o.t || 0, walk = o.moving ? Math.sin(t * 14) * 0.12 : 0;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(0.05 * u, 0.1 * u, 0.6 * u, 0.45 * u, 0, 0, 7); ctx.fill();
  ctx.rotate(o.angle || 0);
  // tay đung đưa
  ctx.fillStyle = PAL.ao;
  ctx.beginPath(); ctx.ellipse(0.1 * u + walk * u, -0.42 * u, 0.15 * u, 0.12 * u, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0.1 * u - walk * u, 0.42 * u, 0.15 * u, 0.12 * u, 0, 0, 7); ctx.fill();
  ctx.fillStyle = PAL.ao; ctx.beginPath(); ctx.ellipse(0, 0, 0.3 * u, 0.42 * u, 0, 0, 7); ctx.fill();
  // nón lá
  const g = ctx.createRadialGradient(-0.1 * u, -0.1 * u, 0.05 * u, 0, 0, 0.5 * u);
  g.addColorStop(0, "#fff3c4"); g.addColorStop(1, PAL.hatShade);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 0.46 * u, 0, 7); ctx.fill();
  ctx.strokeStyle = "rgba(140,110,50,.6)"; ctx.lineWidth = Math.max(1, 0.025 * u);
  for (let r = 0.15; r < 0.46; r += 0.11) { ctx.beginPath(); ctx.arc(0, 0, r * u, 0, 7); ctx.stroke(); }
  ctx.fillStyle = "#e0c070"; ctx.beginPath(); ctx.arc(0, 0, 0.05 * u, 0, 7); ctx.fill();
  ctx.restore();
}

// ----- cá -----
function drawFishBody(x, y, u, kind, t, face = 1, scale = 1) {
  const big = kind === "ca_loc";
  const L = (big ? 1.4 : 0.55) * u * scale, H = (big ? 0.42 : 0.22) * u * scale;
  const wag = Math.sin(t * (big ? 6 : 14)) * 0.35;
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
  const g = ctx.createLinearGradient(0, -H, 0, H);
  if (big) { g.addColorStop(0, "#3c4a2c"); g.addColorStop(0.55, "#6f7f48"); g.addColorStop(1, "#c8c79a"); }
  else { g.addColorStop(0, "#8fa8bb"); g.addColorStop(0.5, "#e6f1f8"); g.addColorStop(1, "#ffffff"); }
  // đuôi
  ctx.fillStyle = big ? "#3c4a2c" : "#a9c0d0";
  ctx.beginPath(); ctx.moveTo(-L * 0.45, 0); ctx.lineTo(-L * 0.75, -H * (0.9 + wag)); ctx.lineTo(-L * 0.7, H * (0.9 - wag)); ctx.closePath(); ctx.fill();
  // thân
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(L * 0.5, 0);
  ctx.quadraticCurveTo(L * 0.3, -H * 1.1, -L * 0.2, -H * 0.8); ctx.quadraticCurveTo(-L * 0.5, -H * 0.3, -L * 0.48, 0);
  ctx.quadraticCurveTo(-L * 0.5, H * 0.3, -L * 0.2, H * 0.8); ctx.quadraticCurveTo(L * 0.3, H * 1.1, L * 0.5, 0); ctx.fill();
  if (big) { // vằn cá lóc + vây lưng dài
    ctx.fillStyle = "rgba(30,36,20,.45)";
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(L * (0.2 - i * 0.17), -H * 0.1, L * 0.05, H * 0.55, 0.3, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#3c4a2c"; ctx.beginPath(); ctx.moveTo(L * 0.25, -H * 0.85); ctx.quadraticCurveTo(-L * 0.1, -H * 1.35, -L * 0.42, -H * 0.5); ctx.lineTo(-L * 0.3, -H * 0.6); ctx.fill();
  }
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(L * 0.32, -H * 0.2, Math.max(1.2, H * 0.16), 0, 7); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(L * 0.33, -H * 0.25, Math.max(0.6, H * 0.06), 0, 7); ctx.fill();
  ctx.restore();
}
/* Đàn cá: cá linh bơi thành bầy nhỏ xoay quanh tâm; cá lóc một con lớn lượn. Chỉ là hình, vị trí luật là tâm. */
function drawSchool(x, y, u, kind, t, seed) {
  if (kind === "ca_loc") {
    const dx = Math.sin(t * 0.6 + seed * 9) * 0.8 * u, face = Math.cos(t * 0.6 + seed * 9) >= 0 ? 1 : -1;
    drawFishBody(x + dx, y + Math.sin(t * 1.3 + seed) * 0.2 * u, u, kind, t + seed * 5, face);
    return;
  }
  for (let i = 0; i < 7; i++) {
    const a = t * 0.9 + i * 0.9 + seed * 7, r = (0.5 + (i % 3) * 0.28) * u;
    const fx = x + Math.cos(a) * r * 1.3, fy = y + Math.sin(a * 1.3) * r * 0.5;
    drawFishBody(fx, fy, u, kind, t + i, -Math.sin(a) >= 0 ? 1 : -1, 0.8 + (i % 2) * 0.25);
  }
}

// ----- bông / nút hái (mặt nước) -----
function drawNode(x, y, u, kind, ready, t, regrowFrac) {
  const sway = Math.sin(t * 1.5 + x * 0.01) * 0.04;
  // lá súng
  ctx.fillStyle = "#3f8d3a";
  ctx.beginPath(); ctx.ellipse(x - 0.4 * u, y + 0.02 * u, 0.7 * u, 0.16 * u, 0, 0.25, Math.PI * 2 - 0.1); ctx.lineTo(x - 0.4 * u, y); ctx.fill();
  ctx.fillStyle = "#56a84a"; ctx.beginPath(); ctx.ellipse(x + 0.45 * u, y + 0.04 * u, 0.55 * u, 0.13 * u, 0, 0, 7); ctx.fill();
  // thân dưới nước
  ctx.strokeStyle = "rgba(60,120,50,.7)"; ctx.lineWidth = Math.max(1, 0.06 * u);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 0.3 * u, y + 1.5 * u, x - 0.3 * u, y + 3 * u, x + 0.1 * u, y + 4.5 * u); ctx.stroke();
  if (!ready) {
    // nụ nhỏ + vòng mọc lại
    ctx.fillStyle = kind === "bong_sung" ? "#b8667f" : "#9fa64a";
    ctx.beginPath(); ctx.ellipse(x, y - 0.25 * u, 0.12 * u, 0.22 * u, sway, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y - 1.2 * u, 0.32 * u, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - regrowFrac)); ctx.stroke();
    return;
  }
  ctx.save(); ctx.translate(x, y - 0.1 * u); ctx.rotate(sway);
  if (kind === "bong_sung") {
    // bông súng hồng nhiều cánh
    for (let layer = 0; layer < 2; layer++) {
      const n = 7, R = (layer ? 0.45 : 0.62) * u;
      ctx.fillStyle = layer ? "#ff9fc0" : "#e8678f";
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32;
        ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -R * 0.5, R * 0.17, R * 0.55, 0, 0, 7); ctx.fill(); ctx.restore();
      }
    }
    ctx.fillStyle = "#ffd95a"; ctx.beginPath(); ctx.arc(0, -0.25 * u, 0.12 * u, 0, 7); ctx.fill();
  } else {
    // bông điên điển: chùm hoa vàng nhỏ trên cành
    ctx.strokeStyle = "#5b7a2c"; ctx.lineWidth = Math.max(1, 0.06 * u);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -0.9 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -0.4 * u); ctx.lineTo(0.35 * u, -0.75 * u); ctx.moveTo(0, -0.5 * u); ctx.lineTo(-0.35 * u, -0.8 * u); ctx.stroke();
    const spots = [[0, -1], [0.35, -0.82], [-0.35, -0.88], [0.15, -1.15], [-0.18, -1.1], [0.42, -1.0], [-0.42, -1.02]];
    for (const [a, b] of spots) {
      ctx.fillStyle = "#f6c21c"; ctx.beginPath(); ctx.ellipse(a * u, b * u, 0.13 * u, 0.09 * u, a, 0, 7); ctx.fill();
      ctx.fillStyle = "#ffe68a"; ctx.beginPath(); ctx.arc(a * u - 0.03 * u, b * u - 0.03 * u, 0.04 * u, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
  // lấp lánh
  const tw = (Math.sin(t * 3 + x) + 1) / 2;
  ctx.fillStyle = `rgba(255,255,220,${0.35 + tw * 0.5})`;
  star(x + 0.5 * u, y - 1.1 * u, 0.12 * u * (0.6 + tw * 0.6));
}
function star(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? r * 0.3 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill();
}

// ----- biểu tượng nguyên liệu / món (HUD) -----
function drawItem(kind, x, y, r, t = 0) {
  const u = r * 1.6;
  if (kind === "ca_loc") drawFishBody(x, y, u * 0.75, "ca_loc", t, 1);
  else if (kind === "ca_linh") drawFishBody(x, y, u * 1.5, "ca_linh", t, 1);
  else if (kind === "bong_sung") {
    ctx.fillStyle = "#e8678f";
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(x, y + r * 0.3); ctx.rotate(-1.2 + i * 0.6); ctx.beginPath(); ctx.ellipse(0, -r * 0.5, r * 0.2, r * 0.55, 0, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = "#ffd95a"; ctx.beginPath(); ctx.arc(x, y, r * 0.18, 0, 7); ctx.fill();
  } else if (kind === "bong_dien_dien") {
    const pts = [[0, -0.4], [0.35, -0.1], [-0.35, -0.1], [0.15, 0.3], [-0.2, 0.32], [0, 0]];
    for (const [a, b] of pts) { ctx.fillStyle = "#f6c21c"; ctx.beginPath(); ctx.ellipse(x + a * r, y + b * r, r * 0.22, r * 0.16, a, 0, 7); ctx.fill(); }
  } else { ctx.fillStyle = "#bbb"; ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, 7); ctx.fill(); }
}
function drawDish(dish, x, y, r, t = 0) {
  // tô sành
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(x, y + r * 0.55, r * 0.95, r * 0.25, 0, 0, 7); ctx.fill();
  if (dish === "ca_loc_nuong_trui") {
    // đĩa lá chuối + cá nướng cháy xém
    ctx.fillStyle = "#4f9a3c"; ctx.beginPath(); ctx.ellipse(x, y + r * 0.25, r * 1.05, r * 0.42, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = "#3a2516";
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.8, r * 0.3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#6b4426"; ctx.beginPath(); ctx.ellipse(-r * 0.1, -r * 0.05, r * 0.55, r * 0.16, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#3a2516"; ctx.beginPath(); ctx.moveTo(-r * 0.75, 0); ctx.lineTo(-r * 1.05, -r * 0.25); ctx.lineTo(-r * 1.05, r * 0.25); ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = dish === "lau_ca_linh_dien_dien" ? "#5b4e46" : "#f4efe3";
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.38, 0, 0, Math.PI); ctx.lineTo(x - r, y); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x, y + r * 1.1, x + r, y); ctx.fill();
    ctx.fillStyle = dish === "lau_ca_linh_dien_dien" ? "#e0913a" : "#d9e8b0";
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.88, r * 0.3, 0, 0, 7); ctx.fill();
    if (dish === "goi_bong_sung") {
      ctx.strokeStyle = "#7fbf5a"; ctx.lineWidth = Math.max(1, r * 0.08);
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - r * 0.6 + i * r * 0.3, y + r * 0.1); ctx.lineTo(x - r * 0.4 + i * r * 0.25, y - r * 0.2); ctx.stroke(); }
      ctx.fillStyle = "#ff8fb0"; ctx.beginPath(); ctx.arc(x + r * 0.2, y - r * 0.05, r * 0.14, 0, 7); ctx.fill();
      ctx.fillStyle = "#e04c3a"; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.08, r * 0.08, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = "#f6c21c"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - r * 0.45 + i * r * 0.3, y - r * 0.05, r * 0.09, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#dfe9ef"; ctx.beginPath(); ctx.ellipse(x + r * 0.1, y + r * 0.05, r * 0.25, r * 0.07, 0.2, 0, 7); ctx.fill();
      // hơi bốc
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = Math.max(1, r * 0.07);
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * r * 0.35, y - r * 0.3); ctx.quadraticCurveTo(x + i * r * 0.35 + Math.sin(t * 4 + i) * r * 0.2, y - r * 0.7, x + i * r * 0.35, y - r * 1.05); ctx.stroke(); }
    }
  }
}

// ----- khách (từ trên xuống), màu theo id để mỗi người một kiểu -----
function drawCustomerTop(x, y, u, c, t) {
  const h = hash(c.id), shirts = ["#3d7cc9", "#5aa36a", "#d08a2e", "#8e5bb5", "#c9475a", "#2f9e9b"];
  const shirt = shirts[Math.floor(h * shirts.length)], hasHat = h > 0.55, eating = c.state === "eating";
  const bob = eating ? Math.sin(t * 8) * 0.05 * u : 0;
  ctx.save(); ctx.translate(x, y + bob);
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(0.05 * u, 0.1 * u, 0.55 * u, 0.4 * u, 0, 0, 7); ctx.fill();
  ctx.fillStyle = shirt; ctx.beginPath(); ctx.ellipse(0, 0, 0.42 * u, 0.3 * u, 0, 0, 7); ctx.fill();
  if (hasHat) {
    ctx.fillStyle = h > 0.8 ? "#5b4632" : "#e8d8b0"; ctx.beginPath(); ctx.arc(0, -0.05 * u, 0.3 * u, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.beginPath(); ctx.arc(0, -0.05 * u, 0.18 * u, 0, 7); ctx.fill();
  } else {
    ctx.fillStyle = h > 0.3 ? "#2a1a14" : "#8a8a8a"; ctx.beginPath(); ctx.arc(0, -0.05 * u, 0.24 * u, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// ----- ghe/thuyền nền chợ nổi (nhìn ngang), có sào treo hàng (bẹo) -----
function drawBoatSide(x, y, u, o = {}) {
  const col = o.color || "#6b4528";
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(-2.6 * u, -0.5 * u); ctx.quadraticCurveTo(-2.2 * u, 0.4 * u, 0, 0.45 * u);
  ctx.quadraticCurveTo(2.2 * u, 0.4 * u, 2.8 * u, -0.7 * u); ctx.lineTo(-2.6 * u, -0.5 * u); ctx.fill();
  ctx.fillStyle = o.trim || "#a4482e"; ctx.fillRect(-2.5 * u, -0.55 * u, 5.2 * u, 0.12 * u);
  if (o.roof !== false) { // mui ghe
    ctx.fillStyle = o.roofColor || "#3d2b1d";
    ctx.beginPath(); ctx.moveTo(-1.4 * u, -0.5 * u); ctx.quadraticCurveTo(-0.2 * u, -1.6 * u, 1.1 * u, -0.5 * u); ctx.fill();
  }
  if (o.beo) { // cây bẹo treo trái cây/rau
    ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = Math.max(1, 0.06 * u);
    ctx.beginPath(); ctx.moveTo(1.8 * u, -0.5 * u); ctx.lineTo(1.8 * u, -3 * u); ctx.stroke();
    const fruits = ["#7cb342", "#f9a825", "#e53935"];
    for (let i = 0; i < 3; i++) { ctx.fillStyle = fruits[(i + (o.seed || 0)) % 3]; ctx.beginPath(); ctx.arc(1.8 * u + (i - 1) * 0.12 * u, -2.7 * u + i * 0.25 * u, 0.16 * u, 0, 7); ctx.fill(); }
  }
  // mắt ghe
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(2.25 * u, -0.3 * u, 0.15 * u, 0.09 * u, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#c62828"; ctx.beginPath(); ctx.arc(2.28 * u, -0.3 * u, 0.06 * u, 0, 7); ctx.fill();
  ctx.restore();
}
function drawPalm(x, y, u, t, scale = 1) {
  const s = u * scale, sway = Math.sin(t * 0.8 + x * 0.01) * 0.08;
  ctx.strokeStyle = "#5d4630"; ctx.lineWidth = 0.25 * s; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 0.6 * s, y - 2.5 * s, x + 0.3 * s, y - 5 * s); ctx.stroke();
  ctx.save(); ctx.translate(x + 0.3 * s, y - 5 * s); ctx.rotate(sway);
  ctx.strokeStyle = "#2f6b2d"; ctx.lineWidth = 0.18 * s;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + i * (Math.PI / 6);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * 1.4 * s, Math.sin(a) * 1.0 * s - 0.6 * s, Math.cos(a) * 2.4 * s, Math.sin(a) * 0.6 * s + 0.6 * s); ctx.stroke();
  }
  ctx.fillStyle = "#6b4a2b"; ctx.beginPath(); ctx.arc(0.1 * s, 0.2 * s, 0.2 * s, 0, 7); ctx.arc(-0.2 * s, 0.25 * s, 0.18 * s, 0, 7); ctx.fill();
  ctx.restore();
}
