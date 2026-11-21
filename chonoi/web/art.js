"use strict";
/* Nghệ thuật vẽ bằng code: Út Sen, cá, bông, món ăn, khách. Mọi hàm nhận tọa độ màn hình + đơn vị `u` (px/mét). */

const PAL = {
  skin: "#f2c39b", skinShade: "#d99f77", hair: "#241a2c", ao: "#1f1d26", aoShade: "#ff3fa4", quan: "#86a9d6",
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
    // Bơi sải (outfit street): tay xoay quanh vai, chân đạp quanh hông, đuôi tóc bay theo nước. Đầu hướng +x.
    const ang = clamp(o.pitch || 0, -0.9, 0.9);
    ctx.rotate(ang);
    const ph = t * (o.moving ? 7 : 2.5), kick = Math.sin(ph * 1.6) * (o.moving ? 0.32 : 0.12);
    const S = typeof STREET !== "undefined" ? STREET : { jacket: "#1f1d26", neon: "#ff3fa4", top: "#f6f3ee", jeans: "#86a9d6", jeansDark: "#5f84b5", shoe: "#fafafa", sole: "#ff3fa4", hair: "#241a2c", hairTip: "#ff5fb8", skin: "#f2c39b", gold: "#f5c542" };
    const leg = (a, col) => {  // a = 0: duỗi thẳng ra sau
      ctx.save(); ctx.translate(-0.5 * u, 0.04 * u); ctx.rotate(a);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -0.12 * u); ctx.lineTo(-0.78 * u, -0.1 * u); ctx.lineTo(-0.78 * u, 0.1 * u); ctx.lineTo(0, 0.12 * u); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(-0.42 * u, -0.08 * u, 0.04 * u, 0.12 * u);  // rách gối
      ctx.fillStyle = S.shoe; rrectU(-1.0 * u, -0.12 * u, 0.24 * u, 0.26 * u, 0.08 * u); ctx.fill();
      ctx.fillStyle = S.sole; ctx.fillRect(-1.0 * u, -0.12 * u, 0.05 * u, 0.26 * u);
      ctx.restore();
    };
    const arm = (a, col, cuff) => {  // a = 0: vươn thẳng ra trước
      ctx.save(); ctx.translate(0.28 * u, -0.06 * u); ctx.rotate(a);
      ctx.fillStyle = col; rrectU(0, -0.08 * u, 0.62 * u, 0.16 * u, 0.08 * u); ctx.fill();
      ctx.fillStyle = cuff; ctx.beginPath(); ctx.arc(0.55 * u, 0, 0.09 * u, 0, 7); ctx.fill();
      ctx.fillStyle = S.skin; ctx.beginPath(); ctx.arc(0.68 * u, 0, 0.075 * u, 0, 7); ctx.fill();
      ctx.restore();
    };
    // phía xa: chân + tay tối hơn
    leg(-kick, S.jeansDark);
    arm(Math.sin(ph + Math.PI) * 1.4 + 0.9, "#14131a", "#b02a72");
    // đuôi tóc bay ra sau theo nước
    const wave = Math.sin(t * (o.moving ? 9 : 3));
    const g = ctx.createLinearGradient(0.4 * u, 0, -0.9 * u, 0);
    g.addColorStop(0, S.hair); g.addColorStop(0.5, S.hair); g.addColorStop(1, S.hairTip);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0.48 * u, -0.34 * u);
    ctx.bezierCurveTo(0.0, (-0.55 + wave * 0.1) * u, -0.4 * u, (-0.25 - wave * 0.15) * u, -0.95 * u, (-0.42 + wave * 0.18) * u);
    ctx.bezierCurveTo(-0.45 * u, (-0.12 - wave * 0.1) * u, 0.0, (-0.25 + wave * 0.05) * u, 0.45 * u, -0.18 * u);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = S.neon; ctx.beginPath(); ctx.arc(0.44 * u, -0.3 * u, 0.06 * u, 0, 7); ctx.fill();
    // thân: jean (hông) + eo + crop top + bomber
    ctx.fillStyle = S.jeans; rrectU(-0.62 * u, -0.15 * u, 0.3 * u, 0.32 * u, 0.1 * u); ctx.fill();
    ctx.fillStyle = S.skin; ctx.fillRect(-0.36 * u, -0.12 * u, 0.12 * u, 0.28 * u);
    ctx.fillStyle = S.top; rrectU(-0.26 * u, -0.17 * u, 0.6 * u, 0.36 * u, 0.1 * u); ctx.fill();
    ctx.fillStyle = S.jacket; rrectU(-0.28 * u, -0.24 * u, 0.62 * u, 0.3 * u, 0.12 * u); ctx.fill();
    ctx.fillStyle = S.neon; ctx.fillRect(-0.28 * u, -0.02 * u, 0.06 * u, 0.1 * u);
    // phía gần: chân + tay
    leg(kick, S.jeans);
    // đầu
    ctx.fillStyle = S.skin; ctx.beginPath(); ctx.arc(0.6 * u, -0.1 * u, 0.25 * u, 0, 7); ctx.fill();
    ctx.fillStyle = S.hair; ctx.beginPath(); ctx.arc(0.56 * u, -0.16 * u, 0.26 * u, Math.PI * 0.75, Math.PI * 1.9); ctx.fill();
    ctx.fillStyle = S.hairTip; ctx.beginPath(); ctx.ellipse(0.55 * u, -0.37 * u, 0.09 * u, 0.035 * u, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = "#111"; rrectU(0.62 * u, -0.17 * u, 0.22 * u, 0.11 * u, 0.04 * u); ctx.fill();          // kính râm
    ctx.fillStyle = "rgba(255,95,184,.8)"; ctx.fillRect(0.67 * u, -0.15 * u, 0.07 * u, 0.03 * u);
    ctx.fillStyle = "#e0507a"; ctx.beginPath(); ctx.ellipse(0.78 * u, 0.04 * u, 0.045 * u, 0.035 * u, 0, 0, 7); ctx.fill(); // môi (phồng má giữ hơi)
    ctx.fillStyle = "rgba(255,120,120,.45)"; ctx.beginPath(); ctx.arc(0.66 * u, 0.0, 0.06 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = S.gold; ctx.lineWidth = Math.max(1, 0.025 * u); ctx.beginPath(); ctx.arc(0.5 * u, 0.04 * u, 0.055 * u, 0, 7); ctx.stroke();
    arm(Math.sin(ph) * 1.4 + 0.9, "#3a3646", S.neon);
  } else {
    // nổi ở mặt nước: đầu + vai, nón lá trên đầu, nhấp nhô
    const bob = Math.sin(t * 3) * 0.06 * u;
    ctx.translate(0, bob);
    if (o.shake) { ctx.translate(0, -0.3 * u); ctx.rotate(o.shake * 0.28); ctx.translate(0, 0.3 * u); }   // lắc đầu "giỏ đầy!" 
    ctx.fillStyle = PAL.ao; rrectU(-0.38 * u, -0.25 * u, 0.76 * u, 0.5 * u, 0.2 * u); ctx.fill();
    ctx.fillStyle = PAL.skin; ctx.beginPath(); ctx.arc(0.02 * u, -0.48 * u, 0.26 * u, 0, 7); ctx.fill();
    ctx.fillStyle = PAL.hair; ctx.beginPath(); ctx.arc(-0.04 * u, -0.55 * u, 0.26 * u, Math.PI * 0.9, Math.PI * 2.0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-0.28 * u, -0.35 * u, 0.1 * u, 0.22 * u, 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.arc(0.14 * u, -0.48 * u, 0.04 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = "#8a3b2d"; ctx.lineWidth = Math.max(1, 0.03 * u); ctx.beginPath(); ctx.arc(0.13 * u, -0.38 * u, 0.06 * u, 0.2, Math.PI - 0.6); ctx.stroke();
    ctx.fillStyle = "rgba(255,120,120,.45)"; ctx.beginPath(); ctx.arc(0.2 * u, -0.4 * u, 0.05 * u, 0, 7); ctx.fill();
    // đuôi ngựa cao nhuộm hồng + kính râm + khuyên
    const g2 = ctx.createLinearGradient(0, -0.8 * u, 0, -0.1 * u); g2.addColorStop(0, PAL.hair); g2.addColorStop(1, "#ff5fb8");
    ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(-0.15 * u, -0.72 * u); ctx.quadraticCurveTo(-0.6 * u, -0.6 * u + bob, -0.5 * u, -0.15 * u);
    ctx.lineTo(-0.38 * u, -0.2 * u); ctx.quadraticCurveTo(-0.42 * u, -0.55 * u, -0.05 * u, -0.7 * u); ctx.fill();
    ctx.fillStyle = "#ff3fa4"; ctx.beginPath(); ctx.arc(-0.12 * u, -0.72 * u, 0.06 * u, 0, 7); ctx.fill();
    ctx.fillStyle = "#111"; rrectU(0.04 * u, -0.56 * u, 0.24 * u, 0.12 * u, 0.04 * u); ctx.fill();
    ctx.fillStyle = "rgba(255,95,184,.75)"; ctx.fillRect(0.1 * u, -0.53 * u, 0.07 * u, 0.03 * u);
    ctx.strokeStyle = "#f5c542"; ctx.lineWidth = Math.max(1, 0.025 * u); ctx.beginPath(); ctx.arc(-0.12 * u, -0.36 * u, 0.06 * u, 0, 7); ctx.stroke();
  }
  ctx.restore();
}
function rrectU(x, y, w, h, r) { rrect(x, y, w, h, Math.min(r, w / 2, h / 2)); }

// ----- cá -----
function drawFishBody(x, y, u, kind, t, face = 1, scale = 1, rot = 0, wagMul = 1) {
  const big = kind === "ca_loc";
  const L = (big ? 1.4 : 0.55) * u * scale, H = (big ? 0.42 : 0.22) * u * scale;
  const wag = Math.sin(t * (big ? 6 : 14) * wagMul) * 0.35 * Math.min(2, wagMul);
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); if (rot) ctx.rotate(rot);
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
function drawSchool(x, y, u, kind, t, seed, scare = 0) {
  if (kind === "ca_loc") {
    const dx = Math.sin(t * 0.6 + seed * 9) * 0.8 * u, face = Math.cos(t * 0.6 + seed * 9) >= 0 ? 1 : -1;
    // thỉnh thoảng quẫy mạnh (~0.5 s mỗi 6 s, lệch pha theo seed)
    const ph = (t / 6 + seed) % 1, thrash = ph < 0.08 ? Math.sin(ph / 0.08 * Math.PI) : 0;
    drawFishBody(x + dx + Math.sin(t * 40) * thrash * 0.15 * u, y + Math.sin(t * 1.3 + seed) * 0.2 * u, u, kind, t + seed * 5, face, 1, Math.sin(t * 30) * thrash * 0.35, 1 + thrash * 3);
    if (thrash > 0.5 && Math.random() < 0.3) G.particles.push({ x: Gather.view ? (x - Gather.view.w / 2) / u + Gather.cam : 0, y: (y - (Gather.view ? Gather.view.surf : 0)) / u, vx: fxRand(-0.5, 0.5), vy: -fxRand(0.8, 1.6), g: 0, life: 0, max: fxRand(0.6, 1.1), size: fxRand(0.05, 0.12), kind: "bubble" });
    return;
  }
  for (let i = 0; i < 7; i++) {
    // Út Sen lại gần: bầy tản rộng ra và bơi nhanh hơn (chỉ hình)
    const a = t * (0.9 + scare * 2.2) + i * 0.9 + seed * 7, r = (0.5 + (i % 3) * 0.28) * u * (1 + scare * 1.8);
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

// ----- góc nghiêng 3/4 (quán): nhân vật đứng thẳng, chân tại (x, y) -----
// nón lá 3/4: vành elip + chóp
function drawHat34(x, y, u) {
  ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(x, y + 0.08 * u, 0.62 * u, 0.2 * u, 0, 0, 7); ctx.fill();
  ctx.fillStyle = PAL.hatShade; ctx.beginPath(); ctx.ellipse(x, y, 0.64 * u, 0.2 * u, 0, 0, 7); ctx.fill();
  const g = ctx.createLinearGradient(x - 0.6 * u, 0, x + 0.6 * u, 0);
  g.addColorStop(0, "#fff3c4"); g.addColorStop(0.6, PAL.hat); g.addColorStop(1, PAL.hatShade);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 0.62 * u, y - 0.02 * u); ctx.lineTo(x, y - 0.55 * u); ctx.lineTo(x + 0.62 * u, y - 0.02 * u);
  ctx.quadraticCurveTo(x, y + 0.16 * u, x - 0.62 * u, y - 0.02 * u); ctx.fill();
  ctx.strokeStyle = PAL.hatLine; ctx.lineWidth = Math.max(1, u * 0.025);
  for (let i = 1; i <= 3; i++) {
    const k = i / 4, yy = y - 0.55 * u * (1 - k);
    ctx.beginPath(); ctx.moveTo(x - 0.62 * u * k, yy); ctx.quadraticCurveTo(x, yy + 0.05 * u * k, x + 0.62 * u * k, yy); ctx.stroke();
  }
}
/* Út Sen đứng (góc 3/4) — outfit street girl: bomber đen oversize viền hồng neon, áo crop trắng, jean baggy rách gối,
 * sneaker trắng đế dày, kính râm, đuôi ngựa cao nhuộm hồng đuôi, khuyên tròn vàng.
 * Dáng đi: tay/chân XOAY quanh vai/hông (không trượt lên xuống), người nhún rất nhẹ.
 * dir = "down" (nhìn ra), "up" (quay lưng), "side" (face ±1). hand: id món đang bưng. Chân tại (x, y). */
const STREET = {
  jacket: "#1f1d26", jacketHi: "#34313f", neon: "#ff3fa4", top: "#f6f3ee", jeans: "#86a9d6", jeansDark: "#5f84b5",
  shoe: "#fafafa", sole: "#ff3fa4", hair: "#241a2c", hairTip: "#ff5fb8", skin: "#f2c39b", gold: "#f5c542",
};

function limb(px, py, ang, len, wid, col) {  // chi xoay quanh khớp (px, py), ang = 0 là thẳng xuống
  ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
  ctx.fillStyle = col; rrectU(-wid / 2, 0, wid, len, wid / 2); ctx.fill();
  ctx.restore();
}
function limbEnd(px, py, ang, len) { return [px - Math.sin(ang) * len, py + Math.cos(ang) * len]; }

function drawPonytail(x, y, u, sway, behindDir) {
  // gốc buộc tóc ở đỉnh sau đầu, đuôi rủ xuống và đung đưa
  const tipX = x + sway * 0.25 * u + behindDir * 0.25 * u, tipY = y + 0.95 * u;
  const g = ctx.createLinearGradient(0, y, 0, tipY);
  g.addColorStop(0, STREET.hair); g.addColorStop(0.55, STREET.hair); g.addColorStop(1, STREET.hairTip);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - 0.1 * u, y);
  ctx.quadraticCurveTo(x + behindDir * 0.45 * u + sway * 0.1 * u, y + 0.35 * u, tipX - 0.06 * u, tipY);
  ctx.lineTo(tipX + 0.08 * u, tipY - 0.05 * u);
  ctx.quadraticCurveTo(x + behindDir * 0.5 * u + sway * 0.12 * u, y + 0.3 * u, x + 0.12 * u, y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = STREET.neon; ctx.beginPath(); ctx.ellipse(x, y + 0.02 * u, 0.09 * u, 0.06 * u, 0, 0, 7); ctx.fill(); // dây buộc
}

function drawSenStand(x, y, u, o = {}) {
  const t = o.t || 0, dir = o.dir || "down", face = o.face || 1, side = dir === "side";
  const emo = o.emo || {}, cheer = emo.cheer || 0;
  const ph = o.moving ? t * 10 : 0, sw = o.moving ? Math.sin(ph) : 0;
  const jump = cheer ? Math.abs(Math.sin(cheer * Math.PI * 2)) * 0.45 * u : 0;   // nhảy 2 nhịp khi được trả tiền
  const bob = (o.moving ? Math.abs(Math.cos(ph)) * 0.025 * u : Math.sin(t * 2) * 0.01 * u) + jump;
  ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(x, y, 0.45 * u * (1 - jump / u * 0.6), 0.15 * u, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, y - bob);
  if (emo.breathe) ctx.scale(1 - emo.breathe * 0.5, 1 + emo.breathe);   // thở nhẹ khi đứng yên
  if (side) ctx.scale(face, 1);
  const hipY = -0.84 * u, shY = -1.36 * u, headY = -1.7 * u;
  const legA = side ? sw * 0.45 : 0;                    // nghiêng: chân đá trước/sau
  const liftL = !side && o.moving ? Math.max(0, sw) * 0.05 * u : 0, liftR = !side && o.moving ? Math.max(0, -sw) * 0.05 * u : 0;
  const armA = o.hand ? 0 : (side ? sw * 0.6 : sw * 0.18);
  const ponySway = Math.sin(t * (o.moving ? 10 : 2)) * (o.moving ? 1 : 0.3);

  // đuôi ngựa phía sau (nhìn ra / nghiêng)
  if (dir !== "up") drawPonytail(side ? -0.12 * u : 0.05 * u, headY - 0.22 * u, u, ponySway, side ? -1 : 0.3);

  // --- chân: jean baggy + sneaker ---
  const leg = (hx, ang, lift, far) => {
    ctx.save(); ctx.translate(hx, hipY - lift); ctx.rotate(ang);
    ctx.fillStyle = far ? STREET.jeansDark : STREET.jeans;
    ctx.beginPath(); ctx.moveTo(-0.12 * u, 0); ctx.lineTo(0.12 * u, 0); ctx.lineTo(0.15 * u, 0.7 * u); ctx.lineTo(-0.15 * u, 0.7 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(-0.08 * u, 0.33 * u, 0.13 * u, 0.04 * u); ctx.fillRect(-0.05 * u, 0.39 * u, 0.09 * u, 0.03 * u); // rách gối
    ctx.fillStyle = STREET.shoe; rrectU(-0.15 * u + (side ? 0.04 * u : 0), 0.66 * u, side ? 0.34 * u : 0.3 * u, 0.16 * u, 0.07 * u); ctx.fill();
    ctx.fillStyle = STREET.sole; ctx.fillRect(-0.15 * u + (side ? 0.04 * u : 0), 0.78 * u, side ? 0.34 * u : 0.3 * u, 0.04 * u);
    ctx.restore();
  };
  if (side) { leg(0.02 * u, -legA, 0, true); leg(-0.02 * u, legA, 0, false); }
  else { leg(-0.12 * u, 0, liftL, false); leg(0.12 * u, 0, liftR, false); }
  // cạp quần + xích bạc
  ctx.fillStyle = STREET.jeansDark; ctx.fillRect(-0.26 * u, hipY - 0.06 * u, 0.52 * u, 0.1 * u);
  if (dir === "down") { ctx.strokeStyle = "#d8dde6"; ctx.lineWidth = Math.max(1, 0.02 * u); ctx.beginPath(); ctx.moveTo(0.08 * u, hipY); ctx.quadraticCurveTo(0.18 * u, hipY + 0.16 * u, 0.25 * u, hipY + 0.02 * u); ctx.stroke(); }

  // tay phía xa (nghiêng) vẽ sau lưng
  if (side) {
    limb(0, shY + 0.05 * u, -armA, 0.58 * u, 0.17 * u, "#15141b");
    const [ex, ey] = limbEnd(0, shY + 0.05 * u, -armA, 0.58 * u); ctx.fillStyle = "#e0b08a"; ctx.beginPath(); ctx.arc(ex, ey, 0.065 * u, 0, 7); ctx.fill();
  }
  // --- thân: eo + áo crop + bomber ---
  ctx.fillStyle = STREET.skin; ctx.fillRect(-0.2 * u, hipY - 0.16 * u, 0.4 * u, 0.12 * u); // eo lộ
  ctx.fillStyle = STREET.top; rrectU(-0.24 * u, shY, 0.48 * u, 0.42 * u, 0.1 * u); ctx.fill();
  ctx.fillStyle = STREET.jacket;
  if (dir === "down") { // áo khoác mở, thấy áo crop giữa
    rrectU(-0.4 * u, shY - 0.04 * u, 0.26 * u, 0.56 * u, 0.12 * u); ctx.fill();
    rrectU(0.14 * u, shY - 0.04 * u, 0.26 * u, 0.56 * u, 0.12 * u); ctx.fill();
    ctx.fillStyle = STREET.neon; ctx.fillRect(-0.4 * u, shY + 0.46 * u, 0.26 * u, 0.06 * u); ctx.fillRect(0.14 * u, shY + 0.46 * u, 0.26 * u, 0.06 * u);
    ctx.fillStyle = "#222"; ctx.font = `800 ${Math.max(6, 0.12 * u)}px ${FONT}`; ctx.textAlign = "center"; ctx.fillText("CN", 0, shY + 0.25 * u); // chữ in áo crop
  } else if (dir === "up") {
    rrectU(-0.4 * u, shY - 0.04 * u, 0.8 * u, 0.56 * u, 0.12 * u); ctx.fill();
    ctx.fillStyle = STREET.neon; ctx.fillRect(-0.4 * u, shY + 0.46 * u, 0.8 * u, 0.06 * u);
    ctx.beginPath(); ctx.moveTo(0.04 * u, shY + 0.06 * u); ctx.lineTo(-0.1 * u, shY + 0.24 * u); ctx.lineTo(0.02 * u, shY + 0.24 * u); ctx.lineTo(-0.06 * u, shY + 0.42 * u); ctx.lineTo(0.12 * u, shY + 0.2 * u); ctx.lineTo(0, shY + 0.2 * u); ctx.closePath(); ctx.fill(); // tia sét sau lưng
  } else {
    rrectU(-0.3 * u, shY - 0.04 * u, 0.5 * u, 0.56 * u, 0.12 * u); ctx.fill();
    ctx.fillStyle = STREET.top; ctx.fillRect(0.12 * u, shY + 0.05 * u, 0.08 * u, 0.36 * u);
    ctx.fillStyle = STREET.neon; ctx.fillRect(-0.3 * u, shY + 0.46 * u, 0.5 * u, 0.06 * u);
  }
  ctx.fillStyle = STREET.jacketHi; ctx.fillRect(-0.3 * u, shY, 0.6 * u, 0.04 * u); // cổ áo

  // --- tay gần: xoay quanh vai ---
  const arm = (sx, ang) => {
    if (side) limb(sx, shY + 0.05 * u, ang, 0.6 * u, 0.22 * u, "#0c0b10");  // viền để tay gần không chìm vào áo
    limb(sx, shY + 0.05 * u, ang, 0.58 * u, 0.18 * u, side ? "#3a3646" : STREET.jacket);
    const [cx, cy] = limbEnd(sx, shY + 0.05 * u, ang, 0.5 * u);
    ctx.fillStyle = STREET.neon; ctx.beginPath(); ctx.arc(cx, cy, 0.09 * u, 0, 7); ctx.fill();          // cổ tay neon
    const [hx, hy] = limbEnd(sx, shY + 0.05 * u, ang, 0.62 * u);
    ctx.fillStyle = STREET.skin; ctx.beginPath(); ctx.arc(hx, hy, 0.07 * u, 0, 7); ctx.fill();
  };
  if (cheer && !o.hand) { const wv = Math.sin(t * 16) * 0.25; arm(-0.38 * u, 2.7 + wv); arm(0.38 * u, -2.7 - wv); }   // giơ hai tay ăn mừng
  else if (o.hand && dir !== "up") { arm(-0.36 * u, -0.55); arm(0.36 * u, 0.55); }      // hai tay đưa ra trước bưng món
  else if (side) arm(0.02 * u, armA);
  else { arm(-0.38 * u, armA * (o.hand ? 0 : 1)); arm(0.38 * u, -armA * (o.hand ? 0 : 1)); }

  // --- đầu ---
  ctx.fillStyle = STREET.skin; ctx.fillRect(-0.07 * u, headY + 0.2 * u, 0.14 * u, 0.14 * u); // cổ
  ctx.fillStyle = STREET.skin; ctx.beginPath(); ctx.arc(0, headY, 0.27 * u, 0, 7); ctx.fill();
  ctx.fillStyle = STREET.hair;
  if (dir === "up") {
    ctx.beginPath(); ctx.arc(0, headY, 0.285 * u, 0, 7); ctx.fill();
    drawPonytail(0, headY - 0.22 * u, u, ponySway, 0);
  } else {
    ctx.beginPath(); ctx.arc(0, headY - 0.05 * u, 0.285 * u, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-0.27 * u, headY - 0.05 * u); ctx.quadraticCurveTo(-0.3 * u, headY + 0.2 * u, -0.2 * u, headY + 0.25 * u); ctx.lineTo(-0.2 * u, headY - 0.05 * u); ctx.fill(); // tóc mai
    if (!side) { ctx.beginPath(); ctx.moveTo(0.27 * u, headY - 0.05 * u); ctx.quadraticCurveTo(0.3 * u, headY + 0.2 * u, 0.2 * u, headY + 0.25 * u); ctx.lineTo(0.2 * u, headY - 0.05 * u); ctx.fill(); }
    ctx.fillStyle = STREET.hairTip; ctx.beginPath(); ctx.ellipse(-0.1 * u, headY - 0.2 * u, 0.1 * u, 0.04 * u, -0.4, 0, 7); ctx.fill(); // highlight hồng ở mái
    // kính râm (đứng yên lâu: đẩy lên đầu, lộ mắt biết chớp)
    if (emo.glassesUp) {
      ctx.fillStyle = "#1b1b1b";
      const eye = (ex) => { if (emo.blink) ctx.fillRect(ex - 0.045 * u, headY + 0.01 * u, 0.09 * u, 0.02 * u); else { ctx.beginPath(); ctx.arc(ex, headY + 0.02 * u, 0.035 * u, 0, 7); ctx.fill(); } };
      if (side) eye(0.16 * u); else { eye(-0.1 * u); eye(0.1 * u); }
      ctx.translate(0, -0.2 * u);
    }
    ctx.fillStyle = "#111";
    if (side) { rrectU(0.06 * u, headY - 0.04 * u, 0.2 * u, 0.12 * u, 0.04 * u); ctx.fill(); ctx.fillRect(-0.1 * u, headY - 0.03 * u, 0.18 * u, 0.025 * u); }
    else {
      rrectU(-0.23 * u, headY - 0.05 * u, 0.2 * u, 0.13 * u, 0.05 * u); ctx.fill();
      rrectU(0.03 * u, headY - 0.05 * u, 0.2 * u, 0.13 * u, 0.05 * u); ctx.fill();
      ctx.fillRect(-0.05 * u, headY - 0.03 * u, 0.1 * u, 0.025 * u);
    }
    ctx.fillStyle = "rgba(255,95,184,.75)";
    if (side) ctx.fillRect(0.1 * u, headY - 0.02 * u, 0.06 * u, 0.03 * u);
    else { ctx.fillRect(-0.19 * u, headY - 0.02 * u, 0.06 * u, 0.03 * u); ctx.fillRect(0.07 * u, headY - 0.02 * u, 0.06 * u, 0.03 * u); }
    if (emo.glassesUp) ctx.translate(0, 0.2 * u);
    // môi hồng + khuyên tai
    ctx.fillStyle = "#e0507a"; ctx.beginPath(); ctx.ellipse(side ? 0.15 * u : 0, headY + 0.15 * u, 0.05 * u, 0.025 * u, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = STREET.gold; ctx.lineWidth = Math.max(1, 0.025 * u);
    ctx.beginPath(); ctx.arc(side ? -0.05 * u : -0.26 * u, headY + 0.14 * u, 0.06 * u, 0, 7); ctx.stroke();
    if (!side) { ctx.beginPath(); ctx.arc(0.26 * u, headY + 0.14 * u, 0.06 * u, 0, 7); ctx.stroke(); }
  }
  ctx.restore();
  if (o.hand) { // món đang bưng trước ngực (quay lưng thì giơ trên đầu)
    const dy = dir === "up" ? -2.3 * u : -1.05 * u;
    drawDish(o.hand, x, y - bob + dy, u * 0.36, t);
  }
}

/* Khách ngồi trên ghế đẩu ((x, y) = mặt ghế), quay về phía bàn bên phải. */
function drawCustomerSit(x, y, u, c, t) {
  if (typeof drawCustomerSitStyled === "function") return drawCustomerSitStyled(x, y, u, c, t);   // 6 kiểu khách (anim.js)
  const h = hash(c.id), shirts = ["#3d7cc9", "#5aa36a", "#d08a2e", "#8e5bb5", "#c9475a", "#2f9e9b"];
  const shirt = shirts[Math.floor(h * shirts.length)], skin = h > 0.7 ? "#d9a27a" : PAL.skin;
  const eating = c.state === "eating", chew = eating ? Math.sin(t * 9) : 0;
  const angry = c.state === "waiting" && c.patience_ticks_left !== undefined && c.patience_ticks_left < 900;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "#3a3a4a"; rrectU(-0.12 * u, -0.18 * u, 0.55 * u, 0.2 * u, 0.08 * u); ctx.fill();
  ctx.fillRect(0.3 * u, -0.02 * u, 0.14 * u, 0.42 * u);
  ctx.fillStyle = shirt; rrectU(-0.3 * u, -0.9 * u, 0.56 * u, 0.75 * u, 0.15 * u); ctx.fill();
  if (eating) {
    ctx.save(); ctx.translate(0.15 * u, -0.7 * u); ctx.rotate(-0.9 - chew * 0.35);
    rrectU(0, -0.07 * u, 0.45 * u, 0.14 * u, 0.07 * u); ctx.fill();
    ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0.42 * u, 0); ctx.lineTo(0.75 * u, -0.05 * u); ctx.stroke();
    ctx.restore();
  } else { rrectU(0.05 * u, -0.78 * u, 0.42 * u, 0.14 * u, 0.07 * u); ctx.fill(); }
  const hy = -1.15 * u;
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0.02 * u, hy, 0.25 * u, 0, 7); ctx.fill();
  ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.arc(0.14 * u, hy - 0.02 * u, 0.04 * u, 0, 7); ctx.fill();
  if (angry) { ctx.strokeStyle = "#1b1b1b"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0.06 * u, hy - 0.12 * u); ctx.lineTo(0.2 * u, hy - 0.08 * u); ctx.stroke(); }
  ctx.strokeStyle = "#7a2f22"; ctx.lineWidth = Math.max(1, 0.03 * u); ctx.beginPath();
  if (eating) ctx.ellipse(0.17 * u, hy + 0.1 * u, 0.04 * u, 0.03 * u + Math.abs(chew) * 0.02 * u, 0, 0, 7);
  else if (angry) ctx.arc(0.15 * u, hy + 0.16 * u, 0.05 * u, Math.PI + 0.4, -0.4);
  else ctx.arc(0.15 * u, hy + 0.07 * u, 0.05 * u, 0.3, Math.PI - 0.3);
  ctx.stroke();
  if (h > 0.55 && h <= 0.8) drawHat34(0.02 * u, hy - 0.15 * u, u * 0.85);
  else if (h > 0.8) { // mũ phớt
    ctx.fillStyle = "#5b4632"; ctx.beginPath(); ctx.ellipse(0.02 * u, hy - 0.16 * u, 0.4 * u, 0.1 * u, 0, 0, 7); ctx.fill();
    rrectU(-0.18 * u, hy - 0.42 * u, 0.4 * u, 0.28 * u, 0.08 * u); ctx.fill();
    ctx.fillStyle = "#c9475a"; ctx.fillRect(-0.18 * u, hy - 0.22 * u, 0.4 * u, 0.06 * u);
  } else {
    ctx.fillStyle = h > 0.3 ? "#2a1a14" : "#9a9a9a";
    ctx.beginPath(); ctx.arc(0, hy - 0.04 * u, 0.27 * u, Math.PI * 0.95, Math.PI * 2.0); ctx.fill();
    ctx.beginPath(); ctx.arc(-0.15 * u, hy, 0.13 * u, 0, 7); ctx.fill();
  }
  ctx.restore();
}
