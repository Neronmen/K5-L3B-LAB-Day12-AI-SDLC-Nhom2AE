"use strict";
/* Vòng lặp vẽ + các màn: title (màn chính), play, summary (tổng kết buổi), tạm dừng, banner đầu buổi. */

function handleEvent(e, s) {
  if (G.scene === "title") return;
  achEvent(e, s);   // thành tích (ui.js)
  animEvent(e, s);  // hoạt ảnh nhân vật/khách (anim.js)
  if (s.mode === "quan") hudQuanEvent(e, s); else hudGatherEvent(e, s);   // icon/xu bay vào HUD (hud.js)
  if (s.mode === "quan") quanEvent(e, s); else gatherEvent(e, s);
}

let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  G.time = now / 1000; G.dt = dt;  // giờ thật: banner/tổng kết không kẹt khi tab bị ẩn
  const [w, h] = fit();
  if (w < 2 || h < 2) return;   // tab ẩn / cửa sổ 0 px: bỏ khung này (tránh camera NaN)
  const s = G.snap;
  UI.btns = [];
  stepParticles(dt);
  updateTutorial();
  ctx.save();
  if (G.shake > 0) { ctx.translate(fxRand(-G.shake, G.shake), fxRand(-G.shake, G.shake)); G.shake = Math.max(0, G.shake - dt * 40); }
  if (!s) {
    ctx.fillStyle = "#0b1a2a"; ctx.fillRect(0, 0, w, h);
    text(G.offline ? "Không kết nối được máy chủ — đã chạy python -m chonoi.live chưa?" : "Đang chèo ra chợ…", w / 2, h / 2, { align: "center", size: 20 });
    ctx.restore(); return;
  }
  if (G.scene === "title") { drawTitle(w, h, s); ctx.restore(); if (UI.page === "settings") drawSettings(w, h); drawTransition(w, h); return; }
  if (s.mode === "quan") drawQuanScene(w, h, s); else drawGatherScene(w, h, s);
  ctx.restore();
  if (s.mode === "quan") drawQuanHud(w, h, s); else drawGatherHud(w, h, s);
  drawHudFly(w, h, s);
  if (G.flash > 0) { ctx.fillStyle = `rgba(${G.flashColor},${G.flash * 0.5})`; ctx.fillRect(0, 0, w, h); G.flash = Math.max(0, G.flash - dt * 2); }
  if (Tut.active && G.banner) G.banner.t = G.time;   // banner chờ đọc xong hướng dẫn
  drawBanner(w, h);
  if (G.scene === "summary") drawSummary(w, h, s);
  else if (G.paused) drawPauseMenu(w, h);
  else drawTutorial(w, h);
  drawTouchControls(w, h, s);
  drawToasts(w, h);
  drawTransition(w, h);
  if (G.offline) text("Mất kết nối tới máy chủ", w / 2, h - 40, { align: "center", color: "#ff8a80", size: 16, stroke: "#000" });
  if (s.error) text("Luật báo lỗi — xem terminal. R để chơi lại.", w / 2, 120, { align: "center", color: "#ff8a80", size: 16, stroke: "#000" });
}

function drawTitle(w, h, s) {
  // nền: cảnh sông buổi sáng chạy tự do (không có nhân vật)
  const fake = Object.assign({}, s, { mode: "gather", meta: s.mode === "gather" ? s.meta : null, nodes: s.mode === "gather" ? s.nodes : [], fish: s.mode === "gather" ? s.fish : [] });
  G.disp = [30 + Math.sin(G.time * 0.08) * 25, 0];
  drawGatherScene(w, h, fake, { title: true });
  ctx.fillStyle = "rgba(10,20,30,.35)"; ctx.fillRect(0, 0, w, h);
  drawBirds(w, h, G.time, 6, 0.05);
  const sc = Math.min(1.4, Math.max(0.5, w / 1100));
  const intro = titleIntro();
  const cy = h * 0.3 - intro.drop * h * 0.6 + Math.sin(G.time * 1.3) * 6 * sc;   // rơi vào cảnh rồi bập bềnh trên sóng
  ctx.globalAlpha = intro.alpha;
  // biển hiệu gỗ
  const bw = 640 * sc, bh = 170 * sc;
  ctx.save(); ctx.translate(w / 2, cy); ctx.rotate(Math.sin(G.time * 0.8) * 0.015);
  ctx.strokeStyle = "#3a2410"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-bw * 0.35, -bh / 2); ctx.lineTo(-bw * 0.3, -bh / 2 - 60); ctx.moveTo(bw * 0.35, -bh / 2); ctx.lineTo(bw * 0.3, -bh / 2 - 60); ctx.stroke();
  ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  rrect(-bw / 2, -bh / 2, bw, bh, 22); ctx.fillStyle = "#8a5a2e"; ctx.fill(); ctx.shadowColor = "transparent";
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? "rgba(0,0,0,.06)" : "rgba(255,255,255,.04)"; ctx.fillRect(-bw / 2 + 6, -bh / 2 + 6 + i * (bh - 12) / 5, bw - 12, (bh - 12) / 5); }
  rrect(-bw / 2 + 8, -bh / 2 + 8, bw - 16, bh - 16, 16); ctx.strokeStyle = "#f2c76b"; ctx.lineWidth = 3; ctx.stroke();
  text("QUÁN ĂN CHỢ NỔI", 0, -6 * sc, { size: 64 * sc, align: "center", weight: 800, color: "#ffe9b0", stroke: "#4a260c", strokeW: 8 });
  text("Một ngày của Út Sen trên sông", 0, 44 * sc, { size: 22 * sc, align: "center", weight: 700, color: "#fff4d6", stroke: "rgba(60,30,10,.6)" });
  ctx.restore();
  drawSenSide(w / 2 - bw / 2 - 30 * sc, cy + 40 * sc, 60 * sc, { face: 1, t: G.time, under: false });
  drawDish("lau_ca_linh_dien_dien", w / 2 + bw / 2 + 30 * sc, cy + 40 * sc, 34 * sc, G.time);
  ctx.globalAlpha = 1;
  // menu: mũi tên/WS chọn, Enter bấm; chuột rê = chọn, click = bấm
  const my = h * 0.58, ma = clamp((G.time - UI.titleAt - 0.6) / 0.4, 0, 1);
  ctx.globalAlpha = ma;
  TITLE_ITEMS.forEach((it, i) => {
    const y = my + i * 50 * sc + (1 - ma) * 20, sel = UI.sel === i, pulse = sel ? 1 + Math.sin(G.time * 4) * 0.02 : 1;
    const iw = Math.min(w - 32, 420 * sc) * pulse, ih = 42 * sc;
    const label = typeof it.label === "function" ? it.label() : it.label;
    if (uiButton("title" + i, w / 2 - iw / 2, y - ih / 2, iw, ih, label, { key: it.key, sc, size: 18 * sc, selected: sel, act: it.act })) UI.sel = i;
    if (sel) text("▶", w / 2 - iw / 2 - 14 * sc, y + 6 * sc, { size: 18 * sc, align: "center", color: "#ffe39a", stroke: "rgba(0,0,0,.5)" });
  });
  ctx.globalAlpha = 1;
  text("↑↓ chọn · WASD bơi/đi · E hái, cập bến, nấu, bưng · SPACE bắt cá · P tạm dừng · H hướng dẫn", w / 2, h - 50 * sc, { size: 15 * sc, align: "center", color: "#fff", stroke: "rgba(0,0,0,.5)" });
  text("Sáng lặn bắt cá lóc, cá linh, hái bông súng, bông điên điển — tối nấu cho khách trên ghe.", w / 2, h - 26 * sc, { size: 13 * sc, align: "center", color: "rgba(255,255,255,.8)", stroke: "rgba(0,0,0,.5)" });
}
function keycap(x, y, k, sc) {
  ctx.font = `800 ${13 * sc}px ${FONT}`;
  const kw = Math.max(30 * sc, ctx.measureText(k).width + 16), kh = 28 * sc;
  rrect(x, y - kh / 2, kw, kh, 6); ctx.fillStyle = "#fff4dc"; ctx.fill();
  ctx.strokeStyle = "#b07a3a"; ctx.lineWidth = 2; ctx.stroke();
  text(k, x + kw / 2, y + 1, { size: 13 * sc, align: "center", base: "middle", weight: 800, color: "#5a2a0a" });
}

function drawBanner(w, h) {
  const b = G.banner;
  if (!b) return;
  const t = G.time - b.t;
  if (t < 0) return;   // còn đang chuyển cảnh
  if (t > 3) { G.banner = null; return; }
  const a = t < 0.4 ? t / 0.4 : t > 2.4 ? 1 - (t - 2.4) / 0.6 : 1;
  ctx.globalAlpha = a;
  const sc = Math.min(1.3, Math.max(0.7, w / 1100)), y = h * 0.36 - (1 - a) * 20;
  ctx.fillStyle = "rgba(20,10,5,.55)"; ctx.fillRect(0, y - 56 * sc, w, 100 * sc);
  text(b.text, w / 2, y, { size: 44 * sc, align: "center", weight: 800, color: "#ffe39a", stroke: "#3a1a08", strokeW: 6 });
  text(b.sub, w / 2, y + 32 * sc, { size: 18 * sc, align: "center", color: "#fff" });
  ctx.globalAlpha = 1;
}


function drawSummary(w, h, s) {
  const t = Math.min(1, (G.time - G.summaryAt) / 0.5), ease = 1 - Math.pow(1 - t, 3);
  ctx.fillStyle = `rgba(5,10,20,${0.6 * ease})`; ctx.fillRect(0, 0, w, h);
  const sc = Math.min(1.2, Math.max(0.55, w / 1200)), pw = Math.min(w - 20, 560 * sc), ph = 450 * sc;
  const x = w / 2 - pw / 2, y = h / 2 - ph / 2 + (1 - ease) * 60;
  ctx.globalAlpha = ease;
  panel(x, y, pw, ph, { fill: "rgba(250,238,210,.97)", border: "rgba(120,70,30,.7)", r: 20 });
  const day = (s.story && s.story.day) || 1;
  if (s.mode === "gather") {
    const [title, sub] = REASON[s.reason] || ["Kết thúc buổi sáng", ""];
    text(`Ngày ${day} · ${title}`, w / 2, y + 52 * sc, { size: 32 * sc, align: "center", weight: 800, color: s.reason === "fainted" ? "#b3261e" : "#7a3a12" });
    text(sub, w / 2, y + 82 * sc, { size: 15 * sc, align: "center", color: "#6a4020" });
    const counts = {}; for (const k of s.hold || []) counts[k] = (counts[k] || 0) + 1;
    const kinds = ["ca_loc", "ca_linh", "bong_dien_dien", "bong_sung"];
    kinds.forEach((k, i) => {
      const cx = x + pw / 2 + (i - 1.5) * 120 * sc, cy = y + 160 * sc;
      rrect(cx - 50 * sc, cy - 46 * sc, 100 * sc, 110 * sc, 14); ctx.fillStyle = "rgba(122,58,18,.1)"; ctx.fill();
      drawItem(k, cx, cy, 22 * sc, G.time);
      text("×" + (counts[k] || 0), cx, cy + 44 * sc, { size: 24 * sc, align: "center", weight: 800, color: "#4a2410" });
      text(KIND_NAME[k], cx, cy + 58 * sc, { size: 11 * sc, align: "center", color: "#7a5030" });
    });
    // món nấu được từ giỏ
    const menu = s.menu || {}, can = Object.keys(menu).filter((d) => Object.entries(menu[d].recipe).every(([k, n]) => (counts[k] || 0) >= n));
    const msg = can.length ? "Tối nay nấu được: " + can.map((d) => DISH_NAME[d] || d).join(", ")
      : (s.hold || []).length ? "Chưa đủ nguyên liệu cho món nào — khách sẽ về tay không!" : "Giỏ trống — tối nay khó mở quán lắm!";
    text(msg, w / 2, y + 262 * sc,
      { size: 15 * sc, align: "center", weight: 700, color: can.length ? "#2f6b2d" : "#b3261e" });
    keyRow(w / 2, y + ph - 50 * sc, [["ENTER", "Mở quán tối nay →", advanceFromSummary], ["R", "Lặn lại", restartFromSummary]], sc);
  } else {
    text(`Ngày ${day} · Đóng quán`, w / 2, y + 52 * sc, { size: 32 * sc, align: "center", weight: 800, color: "#7a3a12" });
    const rows = [["Tiền ca tối", (s.shift_earned ?? s.earned ?? 0) + "k"], ["Khách đã phục vụ", s.served_count ?? 0],
      ["Khách bỏ về", s.left_count ?? 0], ["Uy tín", (s.reputation ?? 0).toFixed(1) + " ★"], ["Điểm", s.score ?? 0],
      ["Tổng thu cả chuyến", ((s.story && s.story.total_earned) || 0) + "k"]];
    rows.forEach(([k, val], i) => {
      const ry = y + 100 * sc + i * 34 * sc;
      text(k, x + 70 * sc, ry, { size: 18 * sc, color: "#6a4020", weight: 700 });
      text(String(val), x + pw - 70 * sc, ry, { size: 20 * sc, align: "right", weight: 800, color: i === 4 ? "#c2453a" : "#4a2410" });
    });
    keyRow(w / 2, y + ph - 50 * sc, [["ENTER", "Sang ngày mới →", advanceFromSummary], ["R", "Mở quán lại", restartFromSummary]], sc);
  }
  drawAchievementRow(w / 2, y + ph - 134 * sc, pw - 40 * sc, sc, s.mode);
  ctx.globalAlpha = 1;
}
function keyRow(cx, y, items, sc) {
  const iw = 230 * sc, ih = 46 * sc;
  items.forEach(([k, label, act], i) => {
    const x = cx + (i - (items.length - 1) / 2) * (iw + 16 * sc) - iw / 2;
    uiButton("row" + i, x, y - ih / 2, iw, ih, label, { key: k, sc, size: 15 * sc, selected: i === 0, act });
  });
}

poll();
setPaused(true);  // màn chính: sim dừng cho tới khi bấm bắt đầu
requestAnimationFrame(frame);
