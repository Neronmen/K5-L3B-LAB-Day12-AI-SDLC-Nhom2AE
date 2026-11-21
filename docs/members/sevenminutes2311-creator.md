# sevenminutes2311-creator (Nguyễn Ngọc Ninh) — phản tư cá nhân (≤ 200 từ)

- Tôi đã làm (kèm link commit):
  [TEAM handle](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/9969203) ·
  [skill log-ai-usage](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/4c70962) ([sửa](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/5f00ff2)) ·
  [chuyển cảnh + hướng dẫn](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/9c721ca) ·
  [tạm dừng/cài đặt/cảm ứng](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/66c4abb) ·
  [thời tiết + thành tích](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/7e63462) ·
  [HUD](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/651a204) ·
  [hoạt ảnh](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/389e229) ·
  [âm thanh](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/86a3121).
- Tôi đã review: đọc lại diff từng lát trước khi commit; chưa review `chonoi/sim` của Khoa trong phase này.
- AI sai ở đâu và tôi phát hiện thế nào: AI viết chuỗi escape `\|` không dùng r-string trong `log_ai_usage.py` → SyntaxWarning, lộ ra khi chạy chính script để ghi nhật ký; sửa và chạy test với `python -W error`. Ngoài ra khi chơi thử thấy Út Sen biến mất: camera nhận NaN khi tab 0 px lúc tải (lỗi có sẵn) — thêm chặn khung 0 px.
- Điều tôi học được: tách mỗi tính năng client thành một tệp (ui/hud/anim/weather) giúp không đụng luật và dễ review; luôn kiểm bằng trình duyệt thật, không chỉ test.
