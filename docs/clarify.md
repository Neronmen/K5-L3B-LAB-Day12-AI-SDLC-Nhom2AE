# Clarify — câu hỏi và câu trả lời (PO ghi, cả nhóm dùng chung)

> Ban đầu chưa có PRD-0 nên nhóm tự giả định (dòng 2–11). Sau khi đọc PRD-0 trên lab board, các dòng đó được chốt ở cột "Trả lời" (dòng 12) và luật + test đã sửa theo.

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
| 12 | 2026-11-21 | Đối chiếu giả định #2–#11 với PRD-0 (lab board, Phase 1) | #2 đúng (ngạt lần đầu t+59). #3 **sai**: thiếu chỗ cho cả yield thì không bắt, giữ đàn, không đặt hồi chiêu, `hold_full{action,fish_id,required,free}`. #4 **sai** tên trường: `gather.amount`, `fish_caught.yield`, `faint{cause,lost,hp}`, `oxygen_empty{oxygen_ticks}`, đơn hàng có `order_id`. #5 đúng. #6 đúng (chọn đều theo seed). #7 đúng. #8 **sửa**: bếp lấy đơn reserved cũ nhất theo `order_tick` rồi id bàn. #9 **sửa**: boa = floor(giá × tip_rate), uy tín +tip_reputation **lúc thu tiền**. #10 **sai**: khách rời thì bỏ món đang nấu/ready/trên tay. Thêm: hết ca khách đang ăn trả ngay (`paid` reason `closing`), khách chờ rời (`customer_left` reason `closing`, không trừ uy tín); `hand`/`dish` là payload `{order_id,dish_id,base_price}`. | PRD-0 |
