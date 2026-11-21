---
name: log-ai-usage
description: Ghi một dòng vào nhật ký dùng AI (docs/ai-usage-log.md) sau mỗi lát việc có dùng AI — phase, người, công cụ, việc, chi phí ước tính và chỗ AI sai. Dùng ngay sau khi commit một lát việc do agent làm, trước standup và trước khi gắn tag phase.
---

# log-ai-usage

Khi nào dùng: sau **mỗi lát việc có dùng AI** (agent viết code, test, tài liệu, review). Mỗi lát = 1 dòng.

1. Ước lượng chi phí (token hoặc thời gian) và nghĩ xem AI sai/thiếu ở đâu, bạn phát hiện bằng cách nào (test đỏ, chơi thử, đọc diff).
2. Chạy (chỉ thư viện chuẩn, chạy được cả Windows):
   ```
   python tools/log_ai_usage.py --phase 2 --who <github-handle> --tool "Claude Code (Opus 5.5)" \
       --task "Menu cài đặt + điều khiển cảm ứng" --cost "~40k token" --note "AI quên bọc localStorage trong try/catch"
   ```
   - Thiếu tham số bắt buộc (`--phase --who --tool --task`) -> mã thoát 2, không ghi gì.
   - Ký tự `|` trong nội dung được escape thành `\|` để không vỡ bảng Markdown.
   - `--file <đường dẫn>` để ghi vào file khác (dùng trong test). Mặc định `docs/ai-usage-log.md`.
   - `--cost` mặc định `chưa đo`, `--note` mặc định `-`.
3. Kiểm `git diff docs/ai-usage-log.md`: chỉ thêm đúng 1 dòng ở cuối bảng, dòng cũ giữ nguyên.
4. Commit chung với lát việc hoặc commit riêng `Nhật ký AI: ...`.
