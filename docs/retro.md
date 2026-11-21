# Retro nhóm

## Phase 2 (nhanh)
> Gợi ý của Ninh — cả nhóm sửa lại.
- Điều tốt: mỗi tính năng client tách tệp riêng (`ui/hud/anim/weather.js`), không đụng `chonoi/sim`, 55 test vẫn xanh; mỗi lát có commit + ảnh bằng chứng; skill `log-ai-usage` giúp ghi nhật ký AI nhanh.
- Điều tệ: dồn nhiều tính năng vào một phase nên Khoa chưa kịp review; kiểm âm thanh và điện thoại thật chưa làm; không có Node để `node --check`.
- 1 hành động cho Phase 3: trước khi gắn tag, Khoa đọc diff `chonoi/web` của Ninh và Ninh đọc diff `chonoi/sim` của Khoa (theo thỏa thuận trong TEAM.md), ghi link vào `docs/members/`.

## Phase 4 (cuối)
- Rà lại hành động Phase 2: **đã làm** — Khoa đọc diff `chonoi/web` của Ninh, chạy test trên máy mình và tìm ra lỗi `relpath` khác ổ đĩa (commit 3ab8e3c). Chiều ngược lại (Ninh đọc `chonoi/sim`) **chưa làm** vì hết giờ.
- Điều tốt: tách luật (sim + test) khỏi client nên 2 người làm song song không xung đột file; mỗi lát đều có commit + test + bằng chứng; 2 skill nhóm (`run-tests`, `log-ai-usage`) dùng thật.
- Điều tệ: **không chép yêu cầu Phase 2–4 từ lab board vào repo** nên làm phần đánh bóng thay vì yêu cầu đổi của đề (chế độ `day` chưa có ở headless); gắn tag trễ; nhóm chỉ 2 người.
- Số liệu: commit — Khoa (Neronmen) 6, Ninh (sevenminutes2311-creator) 11; đọc code của nhau — Khoa review 11 commit của Ninh; token — Ninh ~340k (theo `docs/ai-usage-log.md`), Khoa chưa đo.
- Một lần AI sai và cách nhóm phát hiện: script `log_ai_usage.py` xanh trên máy Ninh nhưng 3 test đỏ trên máy Khoa (repo ở ổ D:, thư mục tạm ở C:) — phát hiện nhờ chạy lại test sau khi pull, không tin bằng chứng của máy khác.
- Nếu làm lại, đổi gì: PO chép yêu cầu mỗi phase vào repo ngay khi mở; gắn tag đúng mốc giờ; ưu tiên yêu cầu của đề trước rồi mới đánh bóng hình ảnh.
- Ghi chú tag (trung thực): `phase-1`…`phase-3` giữ nguyên mốc cũ. Sau khi đọc PRD-0 trên lab board, nhóm sửa luật gather/quán theo đề (commit 27f8b4f, 59/59 test) **sau hạn**, rồi **dời `phase-4` và `v1.0.0`** sang commit phát hành mới để bản chấm là bản đúng đề. Phase 2–4 (chế độ `day`, Shop, cá bơi/sinh, Cá Sấu, 6 món) chưa làm.
