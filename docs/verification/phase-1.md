# Ma trận truy vết Phase 1

Bằng chứng tự động: [`docs/proof/phase-1/tests.txt`](../proof/phase-1/tests.txt) (sinh bằng `python tools/run_tests.py phase-1`, skill `run-tests`).

| AC | Cách kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|
| Contract: ticks 0, dòng end, tất định byte, mã thoát 2 | `tests/test_smoke_p1.py` (Contract, ScenarioModes) | tests.txt | đạt |
| Bơi, ramp, chặn mép, heading | `test_smoke_p1.py` (Movement) | tests.txt | đạt |
| Oxy giảm/hồi, dive/surface | `test_gather_rules.Oxygen` | tests.txt | đạt (theo giả định clarify #2) |
| Ngạt -1 Máu / 60 tick, ngất mất giỏ, kho rỗng | `test_ngat_tru_mau_va_ngat_xiu` | tests.txt | đạt |
| Hái nút ở mặt nước, mọc lại, giỏ đầy | `test_gather_rules.Gathering` | tests.txt | đạt |
| Bắt cá dưới nước, hồi chiêu | `test_gather_rules.Catching` | tests.txt | đạt |
| Cập bến ghi kho, quán đọc kho | `test_smoke_p1.Integration` | tests.txt | đạt |
| Khách đến theo lịch, giữ chỗ, no_dish, bỏ đi | `test_quan_rules.Customers` | tests.txt | đạt (giả định clarify #5–#8) |
| Nấu -> chín -> bưng -> phục vụ -> trả tiền + boa + uy tín | `test_quan_rules.FullLoop` | tests.txt | đạt (giả định #9) |
| Hết ca `quan_end` | `test_het_ca` | tests.txt | đạt |
| Chơi được trên trình duyệt: sáng -> tối -> ngày mới | `tests/test_live_flow.py` + chơi tay | tests.txt + ảnh chụp (TODO: B thêm `docs/proof/phase-1/*.png`) | đạt |

## Đánh giá ngắn
- Đạt: toàn bộ lõi gather + quan theo giả định; 51 test xanh.
- Chưa chắc: tên/data sự kiện và vài luật quán chưa đối chiếu PRD-0 (xem clarify).
- Phase sau: đối chiếu PRD-0, thêm ảnh chụp màn hình, chạy CI trên GitHub.

## Cập nhật sau khi đọc PRD-0 (sau hạn tag phase-1)
Nhóm làm Phase 1 khi chưa chép PRD-0 vào repo, nên luật quán và tên trường sự kiện dựa trên giả định. Sau khi đọc PRD-0, luật đã sửa theo đề (xem `docs/clarify.md` #12): sự kiện gather/quán đúng tên và trường, đơn hàng `order_id`/`order_status`, `hand` là payload, đóng ca trả tiền/rời bàn `closing`, bỏ món khi khách rời, bắt cá phải đủ chỗ cả đàn, kiểm mâu thuẫn scenario quán (mục D) trả mã 2.
Test cập nhật theo đề: `tests/test_gather_rules.py`, `tests/test_quan_rules.py` — **59/59 OK**. Lý do đổi test: test cũ khẳng định giả định sai (ví dụ `hand` là chuỗi, khách có trường `cooking`), không phải sửa test cho xanh.
