# Hợp đồng tích hợp (chốt ở kickoff; đổi thì báo cả nhóm + ghi lý do)

## 1. File kho (PRD-0 mục G)
`{"items": {"<id nguyên liệu>": <số nguyên >= 0>}}`, id ∈ `ca_loc, ca_linh, bong_dien_dien, bong_sung`, sắp theo id, bỏ mục 0. Ghi **một lần** khi có `gather_end`; ngất -> `{"items": {}}`. Mẫu: [`inventory.sample.json`](inventory.sample.json).

## 2. Giao diện sim <-> client (`chonoi/web`)
Client **chỉ đọc** `GET /state` (snapshot giống headless + `meta`, `menu`, `story`, `events`, `finished`, `reason`, `paused`) và gửi:
`POST /input {move, interact, catch}` · `/restart` · `/next` (sáng -> tối mang kho; tối -> ngày mới) · `/start {mode}` · `/pause {paused}`.

| Snapshot gather | Snapshot quan |
|---|---|
| `player{pos, vel, heading_deg, oxygen_ticks, oxygen_max_ticks, hp, hp_max, zero_oxy_ticks, invuln_ticks, catch_cd_ticks, at_surface}` | `player{pos, vel}`, `hand` (id món hoặc null) |
| `hold[]` (thứ tự nhặt, cuối = mới nhất), `hold_count`, `hold_capacity` | `stock{}`, `reserved{}` (tổng giữ chỗ) |
| `nodes[{id, pos, kind, ready, regrow_ticks}]` | `stoves[{id, pos, state idle/cooking/ready, dish, customer_id, cook_ticks_left, ready_ticks}]` |
| `fish[{id, pos, kind, heading_deg}]` | `tables[{id, pos, customer_id}]`, `customers[{id, table_id, dish_id, state waiting/eating, patience_ticks_left, eat_ticks_left, price, tip, cooking, reserved}]`, `shift_earned`, `served_count`, `left_count` |

## 3. Sự kiện
| Tên | data | Ai phát | Client dùng để |
|---|---|---|---|
| `dive` / `surface` | `{pos}` | gather | té nước, âm thanh |
| `oxygen_empty` | `{}` | gather | cảnh báo |
| `choke` | `{hp}` | gather | rung màn, chớp đỏ |
| `faint` | `{}` | gather | rung màn |
| `gather` | `{node_id, kind, count}` | gather | hạt hoa, chữ bay |
| `node_regrown` | `{node_id}` | gather | lấp lánh |
| `fish_caught` | `{fish_id, kind, count}` | gather | bong bóng, chữ bay |
| `hold_full` | `{node_id}` hoặc `{fish_id}` | gather | "Giỏ đầy!" |
| `gather_end` | `{reason docked/time/fainted, inventory{items}}` | gather | màn tổng kết |
| `customer_arrived` | `{customer_id, table_id, dish_id}` | quan | chuông |
| `no_dish` | `{table_id}` | quan | thông báo |
| `cook_started` / `dish_ready` | `{stove_id, dish_id[, customer_id]}` | quan | lửa, "Chín rồi!" |
| `dish_picked` | `{stove_id, dish_id}` | quan | âm thanh |
| `served` | `{customer_id, table_id, dish_id, tip, reputation}` | quan | "boa", hạt |
| `paid` | `{customer_id, table_id, dish_id, price, tip, amount}` | quan | xu bay, +tiền |
| `customer_left` | `{customer_id, table_id, dish_id, reputation}` | quan | khói, −uy tín |
| `quan_end` | `{reason, money, earned, shift_earned, reputation}` | quan | màn tổng kết |

Tên/data nào khác PRD-0 thì PRD-0 thắng: sửa sim + bảng này + `docs/clarify.md`.
