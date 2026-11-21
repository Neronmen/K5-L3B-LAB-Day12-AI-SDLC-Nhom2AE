# Ma trận truy vết Phase 2 — phần client/ui + docs (Ninh)

Bằng chứng tự động: [`docs/proof/phase-2/tests.txt`](../proof/phase-2/tests.txt) (`python tools/run_tests.py phase-2`, 55 test, OK).
Ảnh chụp: [`docs/proof/phase-2/`](../proof/phase-2/) — chụp trong trình duyệt của Claude Code desktop (khung 1024x768 và giả lập mobile 375x812).
Mọi tính năng dưới đây chỉ ở `chonoi/web/*` (+ `tools/log_ai_usage.py`); không đụng `chonoi/sim/*`, `headless.py`, `runner.py`, `game.contract.json`, test smoke.

| AC | Cách kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|
| Lõi không đổi (headless, Test Contract) | `python tools/run_tests.py phase-2` | tests.txt | đạt — 55/55 |
| Skill thứ 2 `log-ai-usage`: thêm 1 dòng, giữ dòng cũ, escape `\|`, thiếu tham số -> mã 2 | `tests/test_log_ai_usage.py` (thư mục tạm) + dùng thật để ghi `docs/ai-usage-log.md` | tests.txt, ai-usage-log.md | đạt |
| Chuyển cảnh sáng -> tối (hoàng hôn) và tối -> ngày mới ("Ngày N", gà gáy, bình minh), chặn input ≤ 1.5 s | chơi tay: cập bến -> Enter; gọi `startTransition('dawn', 2)` | 03-chuyen-canh-hoang-hon.jpg, 04-chuyen-canh-ngay-moi.jpg | đạt (tối -> ngày mới chỉ thử bằng lệnh JS, chưa chơi hết một ca quán 3 phút) |
| Hướng dẫn lần đầu 3 thẻ/buổi, mũi tên chỉ HUD, Enter/Space/Esc, nhớ đã xem, H xem lại | xóa localStorage rồi bắt đầu ngày | 02-huong-dan-lan-dau.jpg | đạt |
| Màn chính: logo bập bềnh, chim bay, menu ↑↓/chuột | chơi tay | 01-man-chinh-menu.jpg | đạt |
| Menu tạm dừng + Cài đặt (Nhạc/Hiệu ứng riêng, rung, vòng tương tác), lưu localStorage | chơi tay (phím C, P) | 05-cai-dat.jpg | đạt (âm lượng chỉ kiểm bằng API, chưa nghe bằng tai) |
| Cảm ứng: joystick ảo, nút E/Bắt, co giãn 375 px | giả lập mobile + TouchEvent bằng JS; joystick gửi `move [0.78, 0.62]` | 06-mobile-joystick.jpg | đạt (chưa thử trên điện thoại thật) |
| Thời tiết sáng (sương, mưa phùn, chuồn chuồn, cá trang trí), đom đóm + phản chiếu + ghe chèo tối | chơi tay, ép mưa bằng `Wx.nextAt` | 07-dom-dom-thanh-tich.jpg, 08-mua-phun-toast.jpg | đạt |
| Thành tích (5 cái) + toast + tổng kết + kỷ lục | ép `achUnlock` và mở tổng kết bằng JS | 09-tong-ket-thanh-tich.jpg | một phần — luật kích hoạt đọc từ sự kiện, chưa chơi đủ để đạt tự nhiên cả 5 |
| HUD: bản đồ nhỏ, thước độ sâu, oxy rung + tim đập, icon bay vào giỏ, tiền count-up, xu bay, sao, thẻ món khóa | sự kiện giả lập bằng JS + chơi tay | 10-hud-ban-do-nho.jpg, 11-hud-quan-xu-bay.png | đạt (chỉ xem ở 1024x768; 1920x1080 chưa kiểm) |
| Hoạt ảnh Út Sen, 6 kiểu khách, cá quẫy/tản | chơi tay + ép `Anim.ghosts` | 12-khach-nhieu-kieu.png | đạt |
| Nhạc 2 lớp, crossfade, âm thanh môi trường, bếp theo vị trí, không phát trước tương tác | gọi API trong trình duyệt, không lỗi console | — | chưa xác nhận bằng tai |
| `node --check` từng file JS | — | — | **không chạy được**: máy không có Node; thay bằng tải trang và đọc console (0 lỗi) |

## Đánh giá ngắn
- Đạt: 8 nhiệm vụ client/ui + docs, mỗi nhiệm vụ ≥ 1 commit, test xanh.
- Sửa thêm một lỗi có sẵn: camera buổi sáng thành NaN khi tab có kích thước 0 px lúc tải (không thấy Út Sen).
- Chưa chắc: âm thanh (chưa nghe), điện thoại thật, màn 1920x1080, đạt thành tích tự nhiên.
