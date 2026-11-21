"""Test luồng chơi trên trình duyệt của nhóm: sáng -> tối (mang kho) -> ngày mới; tạm dừng. Không mở cổng mạng."""

import unittest

from chonoi.contract import load_contract
from chonoi.live import LiveGame


class LiveFlow(unittest.TestCase):
    def setUp(self):
        self.g = LiveGame("gather", load_contract()["tuning"], {"hold": ["ca_loc", "bong_sung", "bong_sung"]}, 1)

    def test_sang_toi_mang_kho_roi_ngay_moi(self):
        g = self.g
        g.set_input({"interact": True})
        g._tick_once()  # cập bến ngay ở bến
        self.assertTrue(g.session.done)
        g.next_phase()
        self.assertEqual(g.mode, "quan")
        self.assertEqual(g.session.sim.stock, {"bong_sung": 2, "ca_loc": 1})
        g.session.sim.done = True
        g.session.sim.earned = 50
        g.next_phase()
        self.assertEqual((g.mode, g.day, g.total_earned), ("gather", 2, 50))

    def test_next_khi_chua_xong_bi_bo_qua(self):
        self.g.next_phase()
        self.assertEqual(self.g.mode, "gather")

    def test_tam_dung_khong_buoc(self):
        self.g.paused = True
        self.g._tick_once()
        self.assertEqual(self.g.session.tick, 0)

    def test_start_quan_co_kho_mau(self):
        self.g.start_mode("quan")
        self.assertEqual(self.g.mode, "quan")
        self.assertTrue(self.g.session.sim.stock)
        with self.assertRaises(ValueError):
            self.g.start_mode("river")


if __name__ == "__main__":
    unittest.main()
