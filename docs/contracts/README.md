# Hợp đồng tích hợp (chốt ở kickoff; đổi thì báo cả nhóm + ghi lý do)

## 1. File kho (PRD-0 mục G)
`{"items": {"<id nguyên liệu>": <số nguyên >= 0>}}`, id ∈ `ca_loc, ca_linh, bong_dien_dien, bong_sung`, sắp theo id, bỏ mục 0. Ghi **một lần** khi có `gather_end`; ngất -> `{"items": {}}`. Mẫu: [`inventory.sample.json`](inventory.sample.json).

## 2. Giao diện sim <-> client (`chonoi/web`)
Client **chỉ đọc** `GET /state` (snapshot giống headless + `meta`, `menu`, `story`, `events`, `finished`, `reason`, `paused`) và gửi:
`POST /input {move, interact, catch}` · `/restart` · `/next` (sáng -> tối mang kho; tối -> ngày mới) · `/start {mode}` · `/pause {paused}`.

| Snapshot gather | Snapshot quan |
|---|---|
| `player{pos, vel, heading_deg, oxygen_ticks, oxygen_max_ticks, hp, hp_max, zero_oxy_ticks, invuln_ticks, catch_cd_ticks, at_surface}` | `player{pos, vel}`, `hand` (payload `{order_id, dish_id, base_price}` hoặc null) |
| `hold[]` (thứ tự nhặt, cuối = mới nhất), `hold_count`, `hold_capacity` | `stock{}`, `reserved{}` (tổng giữ chỗ) |
| `nodes[{id, pos, kind, ready, regrow_ticks}]` | `stoves[{id, pos, state idle/cooking/ready, dish (payload|null), cook_ticks_left, ready_ticks}]` |
| `fish[{id, pos, kind, heading_deg}]` | `tables[{id, pos, customer_id}]`, `customers[{id, table_id, dish_id, order_tick, state waiting/eating, patience_ticks_left, eat_ticks_left, order_status reserved/assigned/unfulfillable/served, reserved, base_price, tip}]` (chỉ khách còn ngồi), `shift_earned`, `served_count`, `left_count` |

## 3. Sự kiện (đã đối chiếu PRD-0 mục E)
| Tên | data | Ai phát | Client dùng để |
|---|---|---|---|
| `dive` / `surface` | `{pos}` sau di chuyển, chỉ khi đổi phía mặt nước | gather | té nước, âm thanh |
| `oxygen_empty` | `{oxygen_ticks: 0}` | gather | cảnh báo |
| `choke` | `{hp}` sau trừ | gather | rung màn, chớp đỏ |
| `faint` | `{cause: "choke", lost: [kind… nhặt sau bỏ trước], hp: 0}` | gather | rung màn |
| `gather` | `{node_id, kind, amount}` | gather | hạt hoa, chữ bay |
| `node_regrown` | `{node_id}` | gather | lấp lánh |
| `fish_caught` | `{fish_id, kind, yield}` — chỉ khi đủ chỗ cả yield | gather | bong bóng, chữ bay |
| `hold_full` | `{action: gather|catch, node_id|fish_id, required, free}` | gather | "Giỏ đầy!" |
| `gather_end` | `{reason: time|docked|fainted, inventory: {items}}` | gather | màn tổng kết |
| `customer_arrived` | `{order_id, table_id, dish_id}` | quan | chuông |
| `no_dish` | `{}` (có bàn mà thiếu món) | quan | thông báo |
| `cook_started` | `{stove_id, order_id, dish_id, items: [kind… sắp theo kind], base_price}` | quan | lửa |
| `dish_ready` / `dish_picked` | `{stove_id, order_id, dish_id}` | quan | "Chín rồi!" |
| `served` | `{order_id, table_id, dish_id, patience_ticks_left, base_price, tip}` | quan | "boa", hạt |
| `paid` | `{order_id, table_id, base_price, tip, amount, reason: finished_eating|closing}` | quan | xu bay, +tiền |
| `customer_left` | `{order_id, table_id, reason: patience|closing, reputation}` | quan | khói, −uy tín |
| `quan_end` | `{reason: "time", money, earned, shift_earned, reputation}` | quan | màn tổng kết |

Client (`chonoi/web/core.js` → `adaptSnap`) đổi payload `hand`/`dish` sang `dish_id` và `amount`/`yield` sang `count` để phần vẽ không phải đổi; payload gốc giữ ở `hand_payload` / `dish_payload`.

Tên/data nào khác PRD-0 thì PRD-0 thắng: sửa sim + bảng này + `docs/clarify.md`.
