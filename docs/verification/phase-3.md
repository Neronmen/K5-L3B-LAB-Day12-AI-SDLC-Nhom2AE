# Ma trận truy vết Phase 3

> **Ghi trung thực:** yêu cầu chi tiết của Phase 3 nằm trên lab board và **chưa được chép vào repo**, nên nhóm không kiểm được từng AC của đề (ví dụ chế độ `--mode day` vẫn trả mã 2 "chưa hỗ trợ ở contract v1.0"). Bảng dưới chỉ ghi những gì nhóm đã làm và kiểm được trong khung giờ này.

Bằng chứng tự động: [`docs/proof/phase-2/tests.txt`](../proof/phase-2/tests.txt) (55 test) — chạy lại tại commit cuối: 55/55 OK.

| AC | Cách kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|
| Lõi gather + quan và Test Contract không bị hồi quy | `python tools/run_tests.py phase-2` | tests.txt | đạt — 55/55 |
| Review chéo: Khoa đọc diff `chonoi/web` của Ninh | chạy test trên máy Khoa + chơi thử | commit 3ab8e3c | đạt — tìm và sửa lỗi `relpath` khác ổ đĩa |
| Chế độ `day` (sáng → tối trong một lần chạy headless) | `python -m chonoi.headless --mode day ...` | — | **chưa đạt** — chưa có đặc tả Phase 3 trong repo; chỉ có luồng sáng → tối ở client trình duyệt (`/next`) |
| Yêu cầu khác của Phase 3 (lab board) | — | — | **chưa kiểm** — xem ghi chú đầu trang |

## Đánh giá ngắn
- Đạt: không hồi quy, review chéo có kết quả thật.
- Chưa đạt: yêu cầu Phase 3 của đề. Bài học: PO phải chép yêu cầu mỗi phase vào `docs/clarify.md`/`docs/plan/` ngay khi mở.
