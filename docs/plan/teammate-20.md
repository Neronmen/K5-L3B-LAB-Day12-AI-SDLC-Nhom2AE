# 20% còn lại — việc cho thành viên B (kèm prompt dán cho AI)

> Đã xong (80%): luật gather + quan, 51 test, client đồ họa + âm thanh, luồng sáng -> tối -> ngày mới, hợp đồng, clarify, verification phase 1, skill `run-tests`.
> B làm các việc dưới đây, **mỗi việc ít nhất 1 commit bằng tài khoản GitHub của B** (cần ≥ 3 commit có nội dung). Trước khi push: `python tools/run_tests.py phase-1` phải `OK`.

Cách dùng: mở repo trong Claude Code / Cursor / Copilot, dán prompt, đọc lại diff rồi commit.

---

## B1. TEAM.md — đã điền, Ninh chỉ còn thay handle
Đã điền tên + MSSV cả hai, vai, thỏa thuận; `team_size` = 2, `team` = `Nhom2AE`.
**Ninh:** thay `…` ở cột GitHub handle bằng handle của mình rồi commit bằng tài khoản của mình (đây là commit đầu tiên của Ninh).
(`tools/check_team.py` vẫn cảnh báo số người 4–6 → CI vàng; đã ghi ở `docs/clarify.md` #1, nhớ hỏi giảng viên.)

## B2. Skill thứ 2 của nhóm: `log-ai-usage`
```
Đọc AGENTS.md và .agents/skills/run-tests/SKILL.md để hiểu định dạng skill của nhóm.
Tạo skill mới .agents/skills/log-ai-usage/SKILL.md (frontmatter name + description) và script
tools/log_ai_usage.py (chỉ thư viện chuẩn Python) để thêm MỘT dòng vào bảng docs/ai-usage-log.md:
  python tools/log_ai_usage.py --phase 2 --who <handle> --tool "Claude Code" --task "..." --cost "~20k token" --note "AI sai ở ..."
Script phải: giữ nguyên các dòng cũ, thoát mã 2 nếu thiếu tham số, escape ký tự | trong nội dung.
Viết test tests/test_log_ai_usage.py (dùng thư mục tạm, không sửa file thật).
Cập nhật mục "Skills / hooks của nhóm" trong AGENTS.md. Chạy python tools/run_tests.py phase-1 và báo kết quả.
```

## B3. Sáng tạo: thời tiết + đom đóm + thành tích (chỉ client)
```
Đọc chonoi/web/main.js, gather.js, quan.js, core.js và docs/contracts/README.md.
KHÔNG sửa chonoi/sim/* hay headless: chỉ sửa trong chonoi/web/.
Thêm vào game (vẽ bằng Canvas 2D, không asset ngoài):
1) Buổi sáng: mưa phùn ngẫu nhiên (hạt mưa xiên + vòng gợn trên mặt nước + trời xám đi) và sương sớm khi time còn > 80%.
   Dùng fxRand (chỉ hiệu ứng hình), không đụng luật.
2) Buổi tối: đom đóm bay lập lòe quanh ghe + ánh trăng phản chiếu trên nước.
3) Thành tích hiện ở màn tổng kết (drawSummary): "Thợ lặn" (giỏ đầy 12), "Không ngạt lần nào", "Quán đắt khách" (phục vụ ≥ 3),
   tính từ sự kiện nhận được (gatherEvent/quanEvent) — lưu vào biến G, reset ở onNewSession.
Giữ 60 FPS: không tạo gradient mới trong vòng lặp hạt lớn. Kiểm bằng node --check cho từng file JS,
chạy python -m chonoi.live --mode gather và chơi thử. Ghi các tính năng vào mục "Sáng tạo của nhóm" trong README.md.
```

## B4. Bằng chứng hình ảnh + verification
```
Chạy python -m chonoi.live --mode gather, chụp 4 ảnh: màn chính, đang lặn bắt cá, quán đang nấu, màn tổng kết.
Lưu vào docs/proof/phase-1/ (01-title.png ...). Cập nhật dòng cuối bảng docs/verification/phase-1.md với link ảnh.
```
(Ảnh tự chụp, không cần AI.)

## B5. Ghi chép cá nhân + retro (cuối giờ)
```
Đọc git log --author=<handle> và docs/ai-usage-log.md. Viết docs/members/<handle>.md theo docs/members/TEMPLATE.md
(≤ 200 từ, có link commit thật, 1 lần AI sai và cách phát hiện). Không bịa: chỉ dùng commit có thật.
```
Cả hai cùng điền `docs/retro.md`, `docs/standup.md`, thêm dòng của mình vào `docs/ai-usage-log.md`.

## B6. Review chéo
B đọc diff các commit của A (luật quán: `chonoi/sim/quan.py`), đối chiếu PRD-0 trên lab board; chỗ nào khác thì ghi `docs/clarify.md` + mở issue. A đọc diff của B.

## Mốc tag (A gắn, sau khi test xanh)
```bash
git tag phase-1 && git push origin phase-1      # trước 1:00
```
Phase 2–4: yêu cầu mới mở trên lab board → dán PRD vào AI cùng `AGENTS.md` + `docs/contracts/README.md`, sửa luật trong `chonoi/sim/`, thêm test, chạy `run-tests`.
