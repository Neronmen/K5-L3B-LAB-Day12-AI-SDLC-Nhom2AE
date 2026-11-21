"""Thêm MỘT dòng vào bảng nhật ký dùng AI (mặc định docs/ai-usage-log.md). Dùng cho skill `log-ai-usage`.

    python tools/log_ai_usage.py --phase 2 --who <handle> --tool "Claude Code" --task "..." \
        --cost "~20k token" --note "AI sai ở ..."

Giữ nguyên các dòng cũ, escape ký tự `|`, thiếu tham số bắt buộc -> mã thoát 2. Chỉ dùng thư viện chuẩn.
"""

import argparse
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_FILE = os.path.join(ROOT, "docs", "ai-usage-log.md")
HEADER = ("# Nhật ký dùng AI (theo phase và theo người)\n\n"
          "| Phase | Người | Công cụ / model | Việc | Token / chi phí ước tính | Ghi chú (AI sai ở đâu?) |\n"
          "|---|---|---|---|---|---|\n")


def cell(value: str) -> str:
    """Một ô bảng Markdown: một dòng, escape `|`."""
    s = " ".join(str(value).split())  # gộp xuống dòng / khoảng trắng thừa
    return s.replace(r"\|", "|").replace("|", r"\|") or "-"


def make_row(a) -> str:
    return "| " + " | ".join(cell(v) for v in (a.phase, a.who, a.tool, a.task, a.cost, a.note)) + " |"


def append_row(path: str, row: str) -> None:
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            content = f.read()
    else:
        content = HEADER
    lines = content.rstrip("\n").split("\n")
    # chèn ngay sau dòng cuối của bảng (dòng bắt đầu bằng "|"), giữ nguyên mọi thứ khác
    last = max((i for i, ln in enumerate(lines) if ln.lstrip().startswith("|")), default=None)
    if last is None:
        lines += ["", HEADER.rstrip("\n").split("\n")[-2], HEADER.rstrip("\n").split("\n")[-1], row]
    else:
        lines.insert(last + 1, row)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")


def main(argv=None) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows cp1252
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(description="Ghi một dòng nhật ký dùng AI.")
    ap.add_argument("--phase", required=True, help="số phase, ví dụ 2")
    ap.add_argument("--who", required=True, help="GitHub handle")
    ap.add_argument("--tool", required=True, help='công cụ / model, ví dụ "Claude Code (Opus 5.5)"')
    ap.add_argument("--task", required=True, help="việc đã làm")
    ap.add_argument("--cost", default="chưa đo", help="token / chi phí ước tính")
    ap.add_argument("--note", default="-", help="AI sai ở đâu, phát hiện thế nào")
    ap.add_argument("--file", default=DEFAULT_FILE, help="file nhật ký (mặc định docs/ai-usage-log.md)")
    a = ap.parse_args(argv)  # thiếu tham số -> argparse thoát mã 2
    row = make_row(a)
    append_row(a.file, row)
    try:
        shown = os.path.relpath(a.file, os.getcwd())
    except ValueError:  # Windows: file và thư mục hiện tại khác ổ đĩa (vd. file tạm ở C:, repo ở D:)
        shown = os.path.abspath(a.file)
    print("Đã ghi vào " + shown + ":\n" + row)
    return 0


if __name__ == "__main__":
    sys.exit(main())
