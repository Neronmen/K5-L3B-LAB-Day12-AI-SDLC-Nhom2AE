"""Chạy toàn bộ test và ghi bằng chứng vào docs/proof/<phase>/tests.txt (dùng cho skill `run-tests`).

    python tools/run_tests.py phase-1

Chạy được cả Windows: nếu máy không có lệnh `python3` (headless_cmd gọi python3), tự tạo shim tạm.
Chỉ dùng thư viện chuẩn.
"""

import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows cp1252
    except (AttributeError, ValueError):
        pass
    phase = argv[1] if len(argv) > 1 else "phase-1"
    env = dict(os.environ, PYTHONPATH=os.pathsep.join(["tests", "."]), PYTHONUTF8="1")
    shim = None
    if shutil.which("python3") is None:  # Windows: tạo python3.exe tạm trỏ về trình thông dịch hiện tại
        shim = tempfile.mkdtemp(prefix="py3shim-")
        ext = ".exe" if os.name == "nt" else ""
        shutil.copy(sys.executable, os.path.join(shim, "python3" + ext))
        env["PATH"] = shim + os.pathsep + env.get("PATH", "")
    try:
        p = subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v"],
                           cwd=ROOT, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
    finally:
        if shim:
            shutil.rmtree(shim, ignore_errors=True)
    out_dir = os.path.join(ROOT, "docs", "proof", phase)
    os.makedirs(out_dir, exist_ok=True)
    rev = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    report = f"# Kết quả test ({phase}) tại commit {rev or '?'} (trước commit hiện tại nếu có thay đổi chưa commit)\n\n{p.stderr}{p.stdout}"
    with open(os.path.join(out_dir, "tests.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write(report)
    tail = (p.stderr or p.stdout).strip().splitlines()[-3:]
    print("\n".join(tail))
    print(f"-> đã ghi docs/proof/{phase}/tests.txt")
    return p.returncode


if __name__ == "__main__":
    sys.exit(main(sys.argv))
