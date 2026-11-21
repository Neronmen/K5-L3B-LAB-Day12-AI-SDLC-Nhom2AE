# Nhật ký dùng AI (theo phase và theo người)

| Phase | Người | Công cụ / model | Việc | Token / chi phí ước tính | Ghi chú (AI sai ở đâu?) |
|---|---|---|---|---|---|
| 1 | A | Claude Code (Sonnet 5.5) | Đọc repo, lên kế hoạch, viết luật gather lát 1-2 + test | chưa đo | Test do AI viết ban đầu sai tick choke (61 thay vì 60) -> sửa theo đúng luật |
| 1 | A | Claude Code (Opus 5.5) | Luật quán + test, client đồ họa/âm thanh, luồng ngày trong live.py, docs | chưa đo | Lỗi tổng kết hiện sai lúc vào quán (snapshot cũ tới trễ) — phát hiện khi chơi thử trên trình duyệt, sửa bằng cờ `waitFresh`; console Windows cp1252 làm live.py lỗi in tiếng Việt |
| 2 | sevenminutes2311-creator | Claude Code (Opus 5.5) | Skill log-ai-usage: SKILL.md + tools/log_ai_usage.py + test | ~15k token | Chuỗi escape dấu ống viết không dùng r-string -> SyntaxWarning; phát hiện khi chạy chính script để ghi dòng này, sửa thành r"..."; thêm `python -W error` khi chạy test |
| 2 | sevenminutes2311-creator | Claude Code (Opus 5.5) | Chuyển cảnh hoàng hôn/bình minh, hướng dẫn lần đầu, màn chính (ui.js) | ~60k token | Chữ trên nút đè lên phím (offset cố định) - phát hiện khi chụp màn tổng kết; banner hiện chồng sau thẻ hướng dẫn |
| 2 | sevenminutes2311-creator | Claude Code (Opus 5.5) | Menu tạm dừng + Cài đặt, joystick cảm ứng, bố cục 375px | ~70k token | Joystick ban đầu đè lên ô giỏ; quán màn dọc bị chồng thanh trên - phát hiện bằng giả lập mobile, sửa bố cục dọc |
| 2 | sevenminutes2311-creator | Claude Code (Opus 5.5) | Thời tiết, đom đóm, thành tích (weather.js) | ~50k token | Phát hiện lỗi có sẵn: camera NaN khi tab 0 px lúc tải -> không thấy Út Sen; toast che kho -> dời ra giữa |
| 2 | sevenminutes2311-creator | Claude Code (Opus 5.5) | HUD: bản đồ nhỏ, thước độ sâu, icon/xu bay (hud.js) | ~45k token | Ảnh chụp trễ 1-2 s nên khó bắt hoạt ảnh ngắn; phải ép mốc thời gian bằng JS để kiểm |
| 2 | sevenminutes2311-creator | Claude Code (Opus 5.5) | Hoạt ảnh Út Sen + 6 kiểu khách + cá (anim.js) | ~45k token | Khách bị luật xóa ngay khi paid/left -> cần 'bóng' từ prevSnap để vẽ rời đi |
| 2 | sevenminutes2311-creator | Claude Code (Opus 5.5) | Âm thanh: nhạc 2 lớp crossfade, môi trường, bếp theo vị trí | ~35k token | Chưa nghe bằng tai được trong môi trường agent; chỉ kiểm API không lỗi. Bản đầu dồn nốt khi tab ẩn -> thêm chặn |
| 2 | sevenminutes2311-creator | Claude Code (Opus 5.5) | Bằng chứng, verification phase-2, members, standup, retro, CHANGELOG | ~20k token | Máy không có Node nên không chạy được node --check; ghi trung thực trong verification |
| 4 | Neronmen | Claude Code (Opus 5.5) | Đọc PRD-0 trên lab board, sửa luật gather/quán + test + client adaptSnap theo đề | chưa đo | Phase 1 làm khi chưa có PRD-0: AI tự giả định tên trường sự kiện, hand dạng chuỗi, bắt cá nhặt một phần, không trả tiền khi đóng ca -> lệch đề; phát hiện khi đọc PRD-0 |
