# Day 12 — AI SDLC: Quán Ăn Chợ Nổi

> **Làm theo nhóm 4–6 người** · Dùng AI để xây game 2D qua **4 phase** trong **3 giờ**: Út Sen lặn bắt cá, hái rau trên mặt nước rồi tối mở quán phục vụ khách.
> **Yêu cầu từng phase mở đúng mốc giờ tại lab board:** **[Chợ Nổi Lab](https://claude.ai/artifact/E35v787wSx2wDgPTNhMVDg)** (cần đăng nhập claude.ai; có trợ giảng AI cho từng phase).

## Bắt buộc (chỉ có thế)

Cách làm việc kỹ thuật là **tự do** (push thẳng, nhánh + PR, pair, có hay không CI…). Cái bắt buộc:

1. **Một repo chung:** trưởng nhóm **fork** repo này, đặt tên `K5-L3B-LAB-Day12-AI-SDLC-<ten-nhom>`, thêm mọi thành viên làm collaborator (*Settings → Collaborators*, quyền Write) và để repo **public** (giảng viên xem được, không cần mời).
2. **Cả nhóm cùng commit** bằng tài khoản GitHub của mình, mỗi người **≥ 3 commit có nội dung** (làm cặp thì ghi `Co-authored-by:`).
3. **Điền [`TEAM.md`](TEAM.md):** danh sách thành viên + thỏa thuận làm việc nhóm; sửa `team_size` trong [`game.contract.json`](game.contract.json). Commit của người không có trong `TEAM.md` không được tính.
4. **Gắn tag** `phase-1` … `phase-4` đúng hạn; chạy được tại từng tag.
5. **Ghi chép tối thiểu:** `docs/verification/phase-n.md`, `docs/clarify.md`, `docs/ai-usage-log.md`, `docs/retro.md`, `docs/members/<handle>.md`.

## Bắt đầu nhanh

```bash
git clone <fork-của-nhóm> && cd <fork-của-nhóm>
PYTHONPATH=tests:. python3 -m unittest discover -s tests -v        # smoke test
python3 -m chonoi.live --mode gather                                # chơi thử trên trình duyệt (tùy chọn)
```

Game cần chế độ **headless** theo Test Contract (`python3 -m chonoi.headless --mode gather|quan …`) để được chạy và chấm tự động. **Công nghệ không ràng buộc**: khung Python trong `chonoi/` chỉ là gợi ý, chi tiết ở [`docs/STARTER.md`](docs/STARTER.md).

## Chơi game của nhóm

```bash
python -m chonoi.live --mode gather      # Windows: python; Linux/macOS: python3
```
Mở địa chỉ in ra → **Enter** bắt đầu một ngày. Sáng: **WASD** bơi, **E** hái bông / cập bến, **Space** bắt cá (dưới nước), canh thanh oxy. Cập bến → **Enter** mở quán tối: **E** ở bếp để nấu món khách gọi, **E** lấy món khi chín, **E** ở bàn để mời khách. **P** tạm dừng, **M** tắt tiếng, **R** chơi lại buổi.

**Cách tính điểm** (PRD-0): `điểm = earned + 100 × floor(uy tín)`. `earned` là tổng thu cả lượt (giá món + boa).
Boa = `floor(giá × 0.2)` nếu khách còn ≥ 50% kiên nhẫn lúc được phục vụ, và mỗi lần thu boa uy tín +0.2.
Khách hết kiên nhẫn bỏ về thì uy tín −0.5. Uy tín bắt đầu từ 3.0, kẹp trong [0, 5].

**Từ clone sạch (macOS/Linux), 3 lệnh:**
```bash
git clone https://github.com/Neronmen/K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE && cd K5-L3B-LAB-Day12-AI-SDLC-Nhom2AE
PYTHONPATH=tests:. python3 -m unittest discover -s tests -v   # toàn bộ test (1 lệnh); Windows: python tools/run_tests.py phase-1
python3 -m chonoi.live --mode gather                           # chơi trên trình duyệt
```
Headless theo Test Contract: `python3 -m chonoi.headless --mode gather|quan --seed 1 --ticks 600 --out out.jsonl`
(sáng và tối nối nhau qua `--inventory-out kho.json` rồi `--inventory kho.json`).

## Sáng tạo của nhóm
(Chỉ ở client trình duyệt; headless không đổi.)
- Một ngày trọn vẹn: sáng lặn → tối mở quán bằng đúng nguyên liệu vừa lặn → ngày mới, cộng dồn tổng thu.
- Cảnh sông vẽ bằng code: bình minh chuyển sang trưa theo đồng hồ, hàng dừa, ghe chợ nổi có cây bẹo, nhà sàn, tia nắng, rong đáy sông, nước tối dần theo độ sâu.
- Út Sen mặc áo bà ba, đội nón lá, có hoạt ảnh bơi; đàn cá linh bơi thành bầy, cá lóc có vằn.
- Quán trên ghe ban đêm: đèn lồng đung đưa, lò than có lửa và khói, khách mỗi người một kiểu, bong bóng gọi món, vòng kiên nhẫn đổi màu.
- Âm thanh tổng hợp + nhạc nền ngũ cung kiểu đờn ca tài tử.
- Chuyển cảnh điện ảnh: hoàng hôn trên sông (sáng -> tối), màn đen "Ngày N" + gà gáy + bình minh (tối -> ngày mới).
- Hướng dẫn lần đầu mỗi buổi: 3 thẻ có mũi tên chỉ vào HUD, H xem lại; màn chính có logo bập bềnh, chim bay, menu chọn bằng phím/chuột.
- Menu tạm dừng + Cài đặt (âm lượng Nhạc/Hiệu ứng riêng, rung màn, vòng tương tác); chơi được bằng chuột và cảm ứng (joystick ảo, nút E/Bắt), co giãn tới màn 375 px.
- Thời tiết buổi sáng: sương sớm đầu buổi, mưa phùn thỉnh thoảng (hạt xiên, vòng gợn, tiếng mưa), chuồn chuồn, cá nhỏ trang trí ở xa (không bắt được).
- Buổi tối: đom đóm lập lòe, ánh đèn lồng phản chiếu trên nước, ghe láng giềng chèo ngang.
- Thành tích (toast + màn tổng kết, kỷ lục lưu trong trình duyệt): Thợ lặn, Không ngạt lần nào, Quán đắt khách, Khách quen, Bếp trưởng.

## Tự do sáng tạo

Ngoài phần đề yêu cầu, nhóm được **thêm** nhân vật, loài cá/cây, sinh vật, món, bản đồ, cơ chế, câu chuyện, đồ họa, âm nhạc… với ba điều kiện: **không phá phần cố định** (tắt ở headless), ghi mục **"Sáng tạo của nhóm"** trong README của nhóm, và **làm lõi đúng trước**.

## Lịch 3 giờ

| Mốc | Phase | Hạn tag |
|---|---|---|
| 0:00 | Phase 1 (PRD-0) | `phase-1` trước 1:00 |
| 1:00 | Phase 2 | `phase-2` trước 1:55 |
| 1:55 | Phase 3 | `phase-3` trước 2:30 |
| 2:30 | Phase 4 | `phase-4` + Release `v1.0.0` trước 3:00 |

Hết giờ mỗi phase thì gắn tag rồi đi tiếp; chỗ chưa xong ghi trung thực trong bằng chứng.

## Đánh giá (100 điểm)

| Hạng mục | Điểm |
|---|---|
| Test tự động ẩn (headless, gồm kiểm tra lại phase trước) | 25 |
| Làm việc nhóm (một repo chung, chia việc, tích hợp, đổi yêu cầu) | 25 |
| Kiểm chứng & bằng chứng | 15 |
| Harness AI (AGENTS.md, skill, nhật ký dùng AI) | 10 |
| Đánh giá & retro | 10 |
| Chất lượng sản phẩm (đúng yêu cầu, mở rộng/sáng tạo) | 10 |
| Demo | 5 |

## Quy định

- Dùng AI thoải mái; **không sao chép repo của nhóm khác**; bằng chứng phải thật.
- Nhân vật, bối cảnh là bản gốc của lab; asset ngoài chỉ dùng CC0/CC-BY/MIT hoặc tự tạo, ghi nguồn trong `CREDITS.md`. Không commit API key, token, `.env`.
