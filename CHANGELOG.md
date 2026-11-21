# Changelog
## Unreleased
### Thêm
- Luật gather: oxy, ngạt, Máu, ngất (mất giỏ), dive/surface, hái nút + mọc lại, bắt cá + hồi chiêu, giỏ LIFO, hold_full.
- Luật quan: khách theo lịch, chọn món nấu được, giữ chỗ nguyên liệu, kiên nhẫn/bỏ đi, no_dish, bếp nấu/chín, bưng, phục vụ, ăn xong trả tiền, boa, uy tín, hết ca.
- Client trình duyệt mới: màn chính, cảnh sông buổi sáng (camera bám, tia nắng, đàn cá, bông súng/điên điển), quán trên ghe ban đêm (đèn lồng, bếp lửa, khách có vòng kiên nhẫn), HUD, chữ bay, hạt, rung màn hình, âm thanh + nhạc ngũ cung, tổng kết buổi, tạm dừng.
- Luồng một ngày: sáng -> tối (mang kho) -> ngày mới (`/next`).
- Test: `test_gather_rules`, `test_quan_rules`, `test_live_flow`; skill `run-tests` + `tools/run_tests.py`.
- Skill `log-ai-usage` + `tools/log_ai_usage.py` (ghi nhật ký AI, escape `|`, mã thoát 2) + `tests/test_log_ai_usage.py`.
- Client (Ninh, chỉ `chonoi/web`): chuyển cảnh hoàng hôn / "Ngày N" + gà gáy; hướng dẫn lần đầu 3 thẻ có mũi tên (H xem lại);
  màn chính logo bập bềnh, chim bay, menu phím/chuột; menu tạm dừng + Cài đặt (âm lượng Nhạc/Hiệu ứng, rung, vòng tương tác);
  điều khiển cảm ứng (joystick ảo, nút E/Bắt) + bố cục 375 px; sương sớm, mưa phùn, chuồn chuồn, cá trang trí, đom đóm,
  đèn lồng phản chiếu, ghe chèo ngang; 5 thành tích + toast + kỷ lục; HUD bản đồ nhỏ, thước độ sâu, oxy rung + tim đập,
  icon/xu bay vào HUD, tiền count-up, sao lấp lánh/rạn, thẻ món khóa; hoạt ảnh Út Sen, 6 kiểu khách đi vào/bỏ đi/vẫy tay,
  cá quẫy/tản bầy; nhạc 2 lớp crossfade, âm thanh môi trường, tiếng bếp theo vị trí.
### Sửa
- Camera buổi sáng thành NaN (mất Út Sen) khi tab có kích thước 0 px lúc tải.
