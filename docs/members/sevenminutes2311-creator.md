# sevenminutes2311-creator (Nguyễn Ngọc Ninh) — phản tư cá nhân (≤ 200 từ)

- Tôi đã làm (kèm link commit):
  [TEAM handle](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/ba582ff) ·
  [skill log-ai-usage](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/d6f9694) ([sửa](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/6f4cc2b)) ·
  [chuyển cảnh + hướng dẫn](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/2651cd8) ·
  [tạm dừng/cài đặt/cảm ứng](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/4691f69) ·
  [thời tiết + thành tích](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/c4617e6) ·
  [HUD](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/a25fa17) ·
  [hoạt ảnh](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/eb24b69) ·
  [âm thanh](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/800575d).
- Tôi đã review: đọc lại diff từng lát trước khi commit; chưa review `chonoi/sim` của Khoa trong phase này.
- AI sai ở đâu và tôi phát hiện thế nào: AI viết chuỗi escape `\|` không dùng r-string trong `log_ai_usage.py` → SyntaxWarning, lộ ra khi chạy chính script để ghi nhật ký; sửa và chạy test với `python -W error`. Ngoài ra khi chơi thử thấy Út Sen biến mất: camera nhận NaN khi tab 0 px lúc tải (lỗi có sẵn) — thêm chặn khung 0 px.
- Điều tôi học được: tách mỗi tính năng client thành một tệp (ui/hud/anim/weather) giúp không đụng luật và dễ review; luôn kiểm bằng trình duyệt thật, không chỉ test.
