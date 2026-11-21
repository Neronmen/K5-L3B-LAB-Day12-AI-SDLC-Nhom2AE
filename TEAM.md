# TEAM

**Tên nhóm:** Nhom2AE  **Số người:** 2  (khớp `team_size` trong `game.contract.json`)

| Thành viên | GitHub handle | Module chính | Vai quy trình | Người dự phòng cho |
|---|---|---|---|---|
| Phạm Nguyên Khoa (2A202603795) | Neronmen | `sim/gather`, `sim/quan`, `qa` | Integrator · QA lead | Nguyễn Ngọc Ninh |
| Nguyễn Ngọc Ninh (2A202603774) | … | `client/ui`, docs | PO · Scrum/Release | Phạm Nguyên Khoa |

**Vai quy trình:** PO (đầu mối hỏi giảng viên, giữ `docs/clarify.md`) · Integrator (giữ `docs/contracts/`, gắn tag) · QA lead · Scrum/Release. Có thể kiêm.

> Nhóm 2 người (đề ghi 4–6): đã ghi ở `docs/clarify.md` #1, PO hỏi giảng viên. `tools/check_team.py` sẽ cảnh báo số người — CI chỉ cảnh báo, không chặn.
> Ninh: thay `…` bằng GitHub handle của mình rồi tự commit (commit của người không có handle trong bảng không được tính).

## Thỏa thuận làm việc nhóm (điền trong 15 phút kickoff, ≤ 10 dòng)

- Kênh liên lạc: nhóm chat Zalo/Messenger của 2 người; ngồi cạnh nhau thì nói trực tiếp.
- Khi bất đồng về thiết kế: mỗi người nói 2 phút; không xong thì Integrator (Khoa) quyết, ghi lý do vào `docs/clarify.md` hoặc ADR.
- Khi ai đó trễ hoặc vướng quá 10 phút: báo ngay trong chat, người dự phòng nhận việc.
- Giờ standup giữa phase: khoảng giữa mỗi phase (≈ 0:30, 1:25, 2:10, 2:45), 2–3 phút, ghi `docs/standup.md`.
- Cách đọc code của nhau: mỗi người đọc diff của người kia trước khi gắn tag (Khoa đọc `chonoi/web`, Ninh đọc `chonoi/sim`).
- Cách làm việc với Git: push thẳng `main` sau khi `python tools/run_tests.py <phase>` xanh; Khoa gắn tag `phase-n`.
