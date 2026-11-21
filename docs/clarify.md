# Clarify — câu hỏi và câu trả lời (PO ghi, cả nhóm dùng chung)

> PRD-0 chi tiết nằm trên lab board (mở theo giờ). Các dòng "giả định" dưới đây cần đối chiếu PRD-0; khác thì sửa luật + test.

| # | Ngày giờ | Câu hỏi | Trả lời / giả định | Ai quyết |
|---|---|---|---|---|
| 1 | 2026-11-21 | Nhóm chỉ có 2 người nhưng README/`check_team.py` đòi 4-6 | Giả định giảng viên chấp nhận; `team_size` = 2. **Cần hỏi giảng viên** | PO |
| 2 | 2026-11-21 | Ngạt: tick oxy chạm 0 có tính vào `choke_interval_ticks`? | Giả định: có (oxy về 0 ở tick k -> choke ở tick k+59) | A |
| 3 | 2026-11-21 | Bắt cá khi giỏ không đủ chỗ cho cả `fish_yield` | Giả định: nhặt phần còn chỗ, cá vẫn mất, phát `hold_full` khi giỏ đầy | A |
| 4 | 2026-11-21 | Tên + data sự kiện gather/quan | Giả định theo bảng `docs/contracts/README.md` mục 3 | A |
| 5 | 2026-11-21 | Khách đến khi không còn bàn trống | Giả định: bỏ qua lượt đó, không sự kiện | A |
| 6 | 2026-11-21 | Khách chọn món thế nào | Giả định: ngẫu nhiên (luồng RNG `customer_dish`) trong các món nấu được từ kho trừ phần đã giữ chỗ; không món nào -> `no_dish` | A |
| 7 | 2026-11-21 | Khi nào trừ kho | Giả định: giữ chỗ lúc khách gọi; trừ thật lúc bắt đầu nấu | A |
| 8 | 2026-11-21 | Bếp nấu cho ai | Giả định: E ở bếp trống -> nấu món của khách chờ có id nhỏ nhất chưa được nấu | A |
| 9 | 2026-11-21 | Boa tính lúc nào | Giả định: lúc phục vụ, nếu kiên nhẫn còn ≥ `tip_min_patience_ratio`; trả cùng giá khi ăn xong (`paid`) | A |
| 10 | 2026-11-21 | Khách bỏ đi khi món đang nấu | Giả định: món vẫn nấu xong, có thể bưng cho khách khác gọi cùng món | A |
| 11 | 2026-11-21 | `burn_s = null` | Món chín không cháy (v1.0) | A |
