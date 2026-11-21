# Kế hoạch Phase 1 (≤ 1 trang)

- Mục tiêu: `gather` đúng luật PRD-0 (oxy, ngạt, Máu, ngất, hái, bắt cá, giỏ, kho) + `quan` đúng luật (khách, bếp, tiền, uy tín); smoke xanh; tag `phase-1` trước 1:00.
- Nhóm 2 người: **A** = gather + hợp đồng kho + Integrator/tag; **B** = quan + QA/test + PO (`docs/clarify.md`).

| Việc | Người | Phụ thuộc |
|---|---|---|
| Kickoff 15': điền `TEAM.md`, chốt `docs/contracts/` (kho, sự kiện) | A+B | — |
| Lát 1-2: `sim/gather.py` (oxy, ngạt, faint, hái, bắt cá, giỏ) + `tests/test_gather_rules.py` | A | PRD-0 mục 13.8 |
| Lát 3-4: `sim/quan.py` (khách, giữ chỗ, bếp, bưng, trả tiền, boa, uy tín, hết ca) + `tests/test_quan_rules.py` | B | PRD-0 mục E-F, kho từ A |
| Review chéo + chạy smoke + `docs/verification/phase-1.md` | A đọc B, B đọc A | cả hai lát xong |
| Gắn tag `phase-1` (A) | A | test xanh |

- Rủi ro: (1) PRD-0 chi tiết nằm ở lab board, chưa chép vào repo -> mọi giả định ghi `docs/clarify.md`. (2) Nhóm 2 người nhưng `check_team.py` đòi 4-6 (CI chỉ cảnh báo). (3) Windows không có `python3`: đặt shim hoặc dùng WSL/CI để chạy test.
