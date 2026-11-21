# ADR-0001: Client Canvas nhiều tệp + luồng chơi sáng -> tối trong `chonoi.live`

- Trạng thái: chấp nhận
- Ngày, người quyết: 2026-11-21, A (Integrator)

## Bối cảnh
Starter chỉ có `web/index.html` hình khối tạm và `live.py` chạy một buổi. Nhóm muốn game "thật": màn chính, sáng lặn -> tối mở quán (mang kho) -> ngày mới, đồ họa + âm thanh.

## Các lựa chọn đã cân nhắc
1. Engine khác (Phaser/Godot): đẹp nhưng phải viết lại luật hoặc bắc cầu, rủi ro Test Contract.
2. Giữ Python sim + Canvas 2D thuần, mở rộng `live.py` tối thiểu. **Chọn.**

## Quyết định
- `live.py`: thêm `POST /next`, `/start`, `/pause`, phục vụ tệp `/<tên>.js|.css` phẳng trong `web/` (regex, không cho `../`), stdout UTF-8 cho Windows.
- Client tách `core/audio/art/gather/quan/main.js`; đồ họa vẽ bằng code, âm thanh WebAudio (không asset ngoài).

## Hệ quả
- Headless và Test Contract không đổi (chỉ `live.py` + `web/`). Test mới: `tests/test_live_flow.py`; `tests/test_live.py` vẫn xanh.
