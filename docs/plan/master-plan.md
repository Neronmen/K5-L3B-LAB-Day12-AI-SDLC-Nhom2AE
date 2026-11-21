# Kế hoạch tổng 3 giờ — nhóm 2 người (A, B)

> Bản chia việc chi tiết và mới nhất: xem `docs/plan/game-plan.md` (A = luật & tích hợp, B = giao diện). Bảng dưới là bản nháp đầu.

Quy tắc: mỗi người ≥ 3 commit có nội dung, bằng tài khoản của mình; làm cặp ghi `Co-authored-by:`. Gắn tag đúng hạn, nhánh chính luôn xanh.

| Phase | Hạn tag | A (gather · Integrator · tag) | B (quan · QA · PO) |
|---|---|---|---|
| 0 Kickoff (15') | — | Điền `TEAM.md`, sửa `team_size`; sửa `headless_cmd` nếu chạy Windows | Chốt `docs/contracts/` (kho, sự kiện), `docs/clarify.md` |
| 1 (0:00–1:00) | `phase-1` | `sim/gather.py` lát 1-2, `test_gather_rules.py` | `sim/quan.py` lát 3-4, `test_quan_rules.py`, scenario quan |
| 2 (1:00–1:55) | `phase-2` | Yêu cầu mới của phase 2 phía gather; đọc/review code B | Yêu cầu mới phía quan; `docs/verification/phase-1.md` + retro nhanh |
| 3 (1:55–2:30) | `phase-3` | Tích hợp chế độ `day` (nối gather -> quan qua kho) | HUD/UI nhẹ trong `chonoi/web`, test tích hợp |
| 4 (2:30–3:00) | `phase-4` + `v1.0.0` | Release, README "Sáng tạo của nhóm", CHANGELOG | Retro, `docs/members/*.md`, demo |

Ghi chép chạy suốt: `docs/ai-usage-log.md` (mỗi người), `docs/standup.md` (giữa phase), `docs/verification/phase-n.md`.
Skill/hook nhóm cần tự viết (≥ 2, đặt ở `.agents/skills/`): ví dụ `run-tests` (chạy smoke + ghi kết quả vào `docs/proof/`) và `log-ai-usage` (thêm dòng vào nhật ký).

Phase 2-4: nội dung yêu cầu mở theo mốc giờ ở lab board -> cập nhật bảng này khi có.
