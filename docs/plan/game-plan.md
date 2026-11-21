# Kế hoạch game: "Quán Ăn Chợ Nổi" — bản đẹp, đủ tính năng (nhóm 2 người)

## 1. Nguyên tắc
- **Lõi đúng đề trước, đẹp sau.** Test ẩn chấm headless; đồ họa chỉ ăn ~10 điểm. Mọi hiệu ứng thêm phải tắt/không ảnh hưởng headless.
- **Kiến trúc 2 lớp, tách bằng snapshot** (đã có sẵn): `chonoi/sim/*` (luật, Python, tất định) -> snapshot JSON -> `chonoi/web/*` (vẽ, âm thanh, UI, chỉ đọc). Hai người sửa hai thư mục khác nhau nên ít xung đột git.
- Công nghệ: giữ Python sim + Canvas 2D thuần (không cài thêm gì, chạy bằng `python -m chonoi.live`). Đồ họa vẽ bằng code (gradient, hình khối, hạt) và âm thanh bằng WebAudio -> không cần asset ngoài, khỏi lo bản quyền (nếu dùng asset thì ghi `CREDITS.md`).

## 2. Tính năng

### Lõi (bắt buộc, theo đề — số liệu từ `game.contract.json`)
| Mã | Tính năng | Trạng thái |
|---|---|---|
| G1 | Bơi, ramp tốc độ, chặn mép | có sẵn |
| G2 | Oxy, ngạt, Máu, ngất, sự kiện dive/surface | **xong** |
| G3 | Hái nút ở mặt nước, mọc lại, giỏ LIFO, hold_full | **xong** |
| G4 | Bắt cá, hồi chiêu, cập bến, ghi kho | **xong** (bến có sẵn) |
| Q1 | Khách đến theo lịch, chọn món nấu được, giữ chỗ nguyên liệu | cần PRD-0 mục F |
| Q2 | Kiên nhẫn, bỏ đi, no_dish | cần PRD-0 |
| Q3 | Bếp nấu/chín, bưng, phục vụ, ăn xong trả tiền | cần PRD-0 |
| Q4 | Boa, uy tín, hết ca, điểm = tiền + 100×uy tín | cần PRD-0 |
| D1 | Chế độ `day` (sáng -> tối, kho nối tự động) | phase 3, theo yêu cầu mở sau |

### Giao diện & đồ họa (client, không ảnh hưởng điểm test)
| Mã | Tính năng |
|---|---|
| U1 | Màn hình chính, chọn chế độ, hướng dẫn phím, tạm dừng, chơi lại |
| U2 | Cảnh gather nhìn ngang: nền nước gradient theo độ sâu, tia nắng, bong bóng, thực vật đáy, parallax, xuồng/bến, bầy cá bơi lượn (chỉ vẽ), bóng điên điển/bông súng nở, nhân vật Út Sen vẽ bằng code có hoạt ảnh bơi |
| U3 | HUD gather: thanh oxy (nháy đỏ khi sắp hết), tim Máu, ô giỏ 12 ô theo thứ tự nhặt, đồng hồ, gợi ý "E hái / Space bắt" khi lại gần |
| U4 | Cảnh quán nhìn từ trên: sàn ghe, bếp có lửa/khói, bàn, khách (kiểu dáng khác nhau), bong bóng kiên nhẫn (xanh->đỏ), biểu tượng món |
| U5 | HUD quán: tiền, uy tín (sao), kho nguyên liệu, món đang cầm, hàng đợi |
| U6 | Hiệu ứng: hạt nước té, "+tiền" bay lên, rung màn hình khi mất Máu, chuyển cảnh sáng -> tối (bình minh/hoàng hôn), tổng kết cuối buổi |
| U7 | Âm thanh WebAudio: tiếng bơi, bong bóng, nấu ăn, xu, nhạc nền đơn giản; nút tắt tiếng |

### Sáng tạo của nhóm (tùy chọn, tắt ở headless)
Chọn 2–3 thứ, làm sau cùng: cá/rau hiếm xuất hiện thoáng qua trong cảnh (chỉ trang trí), thời tiết (mưa, sương sớm), chim/thuyền nền chợ nổi, khách có tính cách bằng hình dáng, bảng thành tích trong tổng kết, đèn lồng ban đêm.

## 3. Chia việc

**A — "Luật & tích hợp"**: `chonoi/sim/*`, `scenario.py`, `tests/`, `docs/contracts/`, `game.contract.json` (có báo B), tag, release.
**B — "Giao diện & trải nghiệm"**: `chonoi/web/*` (tách nhiều file: `scene_gather.js`, `scene_quan.js`, `hud.js`, `fx.js`, `audio.js`), `chonoi/live.py` (nếu cần), README "Sáng tạo của nhóm", demo.
Cả hai: tự viết ≥ 2 skill/hook, `docs/members/<handle>.md`, nhật ký AI, review chéo (A đọc diff của B và ngược lại — mỗi người đều có commit/PR review được).

| Phase | Hạn | A | B |
|---|---|---|---|
| 0 | 0:15 | `TEAM.md`, `team_size`, hợp đồng snapshot/sự kiện (viết bảng trường snapshot cho B) | Tách `web/` thành module, khung scene + vòng lặp đọc snapshot |
| 1 | 1:00 | G2–G4 xong; Q1–Q4 + test; `verification/phase-1.md`; tag `phase-1` | U1–U3: màn chính + cảnh gather + HUD (đọc snapshot thật) |
| 2 | 1:55 | Yêu cầu đổi/mới phía luật; sửa lỗi test ẩn của phase 1 | U4–U5: cảnh quán + HUD; U7 âm thanh cơ bản |
| 3 | 2:30 | D1 chế độ `day`, test tích hợp kho | U6: chuyển cảnh sáng/tối, tổng kết; nối `day` trên live |
| 4 | 3:00 | Release `v1.0.0`, CHANGELOG, retro số liệu | Sáng tạo (mục 2), demo, README, đánh bóng |

## 4. Giao diện giữa hai người (chốt ở phase 0)
- B chỉ đọc snapshot (`player`, `hold`, `nodes`, `fish`, `stoves`, `tables`, `customers`, `stock`, `money`, `reputation`, `time_left_ticks`) và **sự kiện** (dive, surface, choke, gather, fish_caught, paid, customer_left...) để kích hoạt hiệu ứng/âm thanh.
- Cần thêm trường/sự kiện: B nhắn A, A thêm vào sim và ghi `docs/contracts/`. B không sửa luật; A không sửa đồ họa.
- Dev: `python -m chonoi.live --mode gather|quan`; trước khi đẩy: chạy `unittest` (Windows: cần `python3` hoặc đổi `headless_cmd`).

## 5. Rủi ro
1. PRD-0 mục F (luật quán) và yêu cầu phase 2–4 chưa có -> chờ lab board, giả định ghi `docs/clarify.md`.
2. Phase đổi yêu cầu giữa chừng -> giữ số liệu trong `game.contract.json`, giữ client mỏng.
3. Đồ họa ngốn giờ -> khóa phạm vi: U1–U3 trước phase 1, phần "Sáng tạo" chỉ làm khi phase 3 đã xanh.
4. Chỉ 2 người: A và B dự phòng cho nhau; vướng quá 10 phút thì nói ngay.
