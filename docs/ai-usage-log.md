# Nhật ký dùng AI (theo phase và theo người)

| Phase | Người | Công cụ / model | Việc | Token / chi phí ước tính | Ghi chú (AI sai ở đâu?) |
|---|---|---|---|---|---|
| 1 | A | Claude Code (Sonnet 5.5) | Đọc repo, lên kế hoạch, viết luật gather lát 1-2 + test | chưa đo | Test do AI viết ban đầu sai tick choke (61 thay vì 60) -> sửa theo đúng luật |
| 1 | A | Claude Code (Opus 5.5) | Luật quán + test, client đồ họa/âm thanh, luồng ngày trong live.py, docs | chưa đo | Lỗi tổng kết hiện sai lúc vào quán (snapshot cũ tới trễ) — phát hiện khi chơi thử trên trình duyệt, sửa bằng cờ `waitFresh`; console Windows cp1252 làm live.py lỗi in tiếng Việt |
| 2 | sevenminutes2311-creator | Claude Code (Opus 5.5) | Skill log-ai-usage: SKILL.md + tools/log_ai_usage.py + test | ~15k token | Chuỗi escape dấu ống viết không dùng r-string -> SyntaxWarning; phát hiện khi chạy chính script để ghi dòng này, sửa thành r"..."; thêm `python -W error` khi chạy test |
