---
name: run-tests
description: Chạy toàn bộ test (smoke hộp đen + luật gather/quan + live) và ghi bằng chứng vào docs/proof/<phase>/tests.txt. Dùng trước mỗi lần push, trước khi gắn tag phase, và sau khi agent sửa luật.
---

# run-tests

1. Chạy: `python tools/run_tests.py <phase>` (ví dụ `phase-1`). Script tự xử lý Windows không có `python3`.
2. Đọc 3 dòng cuối: phải là `OK`. Nếu `FAILED`:
   - Đọc test hỏng trong `docs/proof/<phase>/tests.txt`.
   - Sửa LUẬT, không sửa test cho xanh (AGENTS.md). Nếu đổi test, ghi lý do trong commit.
3. Thêm `docs/proof/<phase>/tests.txt` vào commit; ghi một dòng kết quả vào `docs/verification/<phase>.md`.
4. Không gắn tag khi test đỏ.
