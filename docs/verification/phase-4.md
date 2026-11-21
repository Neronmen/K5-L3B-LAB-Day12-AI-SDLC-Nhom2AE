# Ma trận truy vết Phase 4 (phát hành v1.0.0)

> **Ghi trung thực:** như Phase 3, yêu cầu riêng của Phase 4 trên lab board chưa được chép vào repo nên không kiểm được theo đề. Bảng ghi phần phát hành và kiểm tra cuối.

| AC | Cách kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|
| Toàn bộ test xanh tại commit phát hành | `python tools/run_tests.py phase-4` | tests.txt | đạt — 59/59 |
| Chơi được trọn một ngày trên trình duyệt (màn chính → lặn → cập bến → quán → tổng kết) | chơi tay, đọc console | ảnh `docs/proof/phase-2/` | đạt — 0 lỗi console |
| `TEAM.md` đủ thành viên, handle, `team_size` khớp | `python tools/check_team.py` | — | một phần — chỉ còn cảnh báo "số thành viên 4–6" (nhóm 2 người, clarify #1) |
| Mỗi người ≥ 3 commit có nội dung | `git log --format=%an \| sort \| uniq -c` | — | đạt — Khoa 6, Ninh 11 |
| Ghi chép: verification 1–4, clarify, ai-usage-log, retro, members ×2 | xem `docs/` | — | đạt |
| Tag `phase-1` … `phase-4` + Release `v1.0.0` | `git tag -l`, trang Releases | — | đã gắn; `phase-4`/`v1.0.0` dời sang bản sửa theo PRD-0 (xem `docs/retro.md`) |
| Yêu cầu riêng Phase 4 (lab board) | — | — | **chưa kiểm** |
