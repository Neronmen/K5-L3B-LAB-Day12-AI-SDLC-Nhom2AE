# Neronmen (Phạm Nguyên Khoa) — phản tư cá nhân (≤ 200 từ)

- Tôi đã làm (kèm link commit):
  [luật gather + quán + test](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/1c17bf8) ·
  [client đồ họa + luồng một ngày](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/3ca5428) ·
  [hợp đồng, bằng chứng, skill run-tests](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/77a1c9b) ·
  [quán góc 3/4 + outfit](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/4731f79) ·
  [TEAM.md](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/0f77b5a).
- Tôi đã review: đọc 11 commit `chonoi/web` + skill của Ninh, chạy test trên máy mình thấy 3 test `test_log_ai_usage` đỏ (lỗi `relpath` khác ổ đĩa) → [sửa](https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE/commit/3ab8e3c); chơi thử trọn sáng → tối, 0 lỗi console.
- AI sai ở đâu và tôi phát hiện thế nào: test AI viết đầu tiên kỳ vọng choke ở tick 61 (sai lệch 1 tick so với luật) — test đỏ nên đọc lại luật; màn tổng kết hiện sai khi vào quán do snapshot cũ tới trễ — chỉ thấy khi chơi thử trên trình duyệt, không test nào bắt được.
- Điều tôi học được: tách luật (sim, có test) khỏi hình (client chỉ đọc snapshot) giúp hai người làm song song không xung đột; phải chạy test trên đúng máy của mình, vì máy khác có thể che lỗi.
