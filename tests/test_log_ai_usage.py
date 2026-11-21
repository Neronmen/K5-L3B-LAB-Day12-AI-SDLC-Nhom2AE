"""Test tools/log_ai_usage.py — chỉ dùng thư mục tạm, không đụng docs/ai-usage-log.md thật."""

import os
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "tools", "log_ai_usage.py")
BASE = ("# Nhật ký\n\n| Phase | Người | Công cụ / model | Việc | Token / chi phí ước tính | Ghi chú (AI sai ở đâu?) |\n"
        "|---|---|---|---|---|---|\n| 1 | A | Claude | cũ | chưa đo | - |\n\nGhi chú cuối file.\n")


def run(*args):
    env = dict(os.environ, PYTHONUTF8="1")
    return subprocess.run([sys.executable, SCRIPT, *args], capture_output=True, text=True, encoding="utf-8", env=env)


class LogAiUsageTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.tmp.name, "log.md")
        with open(self.path, "w", encoding="utf-8") as f:
            f.write(BASE)

    def tearDown(self):
        self.tmp.cleanup()

    def read(self):
        with open(self.path, encoding="utf-8") as f:
            return f.read()

    def test_them_mot_dong_giu_dong_cu(self):
        p = run("--phase", "2", "--who", "ninh", "--tool", "Claude Code", "--task", "Menu cài đặt",
                "--cost", "~20k token", "--note", "quên try/catch", "--file", self.path)
        self.assertEqual(p.returncode, 0, p.stderr)
        lines = self.read().split("\n")
        self.assertIn("| 1 | A | Claude | cũ | chưa đo | - |", lines)
        i = lines.index("| 1 | A | Claude | cũ | chưa đo | - |")
        self.assertEqual(lines[i + 1], "| 2 | ninh | Claude Code | Menu cài đặt | ~20k token | quên try/catch |")
        self.assertIn("Ghi chú cuối file.", self.read())
        self.assertEqual(self.read().count("\n| "), 3)  # header + dòng cũ + dòng mới

    def test_escape_ky_tu_ong(self):
        p = run("--phase", "2", "--who", "ninh", "--tool", "a|b", "--task", "x | y", "--file", self.path)
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertIn(r"| 2 | ninh | a\|b | x \| y | chưa đo | - |", self.read())

    def test_thieu_tham_so_ma_thoat_2(self):
        p = run("--phase", "2", "--who", "ninh", "--file", self.path)
        self.assertEqual(p.returncode, 2)
        self.assertEqual(self.read(), BASE)

    def test_tao_file_moi_neu_chua_co(self):
        path = os.path.join(self.tmp.name, "moi.md")
        p = run("--phase", "3", "--who", "ninh", "--tool", "t", "--task", "k", "--file", path)
        self.assertEqual(p.returncode, 0, p.stderr)
        with open(path, encoding="utf-8") as f:
            self.assertTrue(f.read().rstrip().endswith("| 3 | ninh | t | k | chưa đo | - |"))


if __name__ == "__main__":
    unittest.main()
