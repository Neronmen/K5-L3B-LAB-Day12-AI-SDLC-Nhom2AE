"""Test luật quán theo PRD-0 (Test Contract v1.0) mục D, E, F — hộp đen qua headless."""

import unittest

from helpers import Workdir, events, frames, read_jsonl, run_headless, snapshots, write_json

STOVE = [2, 8]
TABLE = [9, 2]
LOC = "ca_loc_nuong_trui"
HAND = {"order_id": "C1", "dish_id": LOC, "base_price": 60}


def run(w, block, inputs, ticks, code_expected=0):
    sc = write_json(w.path("sc.json"), {"quan": block})
    inp = write_json(w.path("in.json"), frames(*inputs))
    code, err = run_headless("--mode", "quan", "--seed", "3", "--ticks", str(ticks), "--scenario", sc,
                             "--inputs", inp, "--snapshot-every", "1", "--out", w.path("o.jsonl"))
    assert code == code_expected, (block, err)
    return read_jsonl(w.path("o.jsonl")) if code == 0 else None


def press(t):
    return [{"tick": t, "interact": True}, {"tick": t + 1, "interact": False}]


def eating(**kw):
    c = {"id": "C1", "table_id": "T1", "dish_id": LOC, "state": "eating", "order_status": "served",
         "reserved": {}, "eat_ticks_left": 600, "base_price": 60, "tip": 0}
    c.update(kw)
    return c


def assigned(**kw):
    c = {"id": "C1", "table_id": "T1", "dish_id": LOC, "order_status": "assigned", "reserved": {}}
    c.update(kw)
    return c


class Customers(unittest.TestCase):
    def test_khach_den_theo_lich_giu_cho(self):
        with Workdir() as w:
            rows = run(w, {"stock": {"ca_loc": 1}}, [], 121)
            arr = events(rows, "customer_arrived")
            self.assertEqual([(e["tick"], e["data"]) for e in arr],
                             [(120, {"order_id": "C1", "table_id": "T1", "dish_id": LOC})])
            c = [s for s in snapshots(rows) if s["tick"] == 120][0]["customers"][0]
            self.assertEqual((c["order_tick"], c["order_status"], c["reserved"], c["base_price"]),
                             (120, "reserved", {"ca_loc": 1}, 60))
            self.assertEqual(c["patience_ticks_left"], 3600)  # kiên nhẫn giảm từ bước sau

    def test_no_dish_data_rong(self):
        with Workdir() as w:
            rows = run(w, {}, [], 121)
            self.assertEqual([e["data"] for e in events(rows, "no_dish")], [{}])

    def test_het_kien_nhan_bo_di_tru_uy_tin(self):
        with Workdir() as w:
            block = {"stock": {"ca_loc": 1}, "random_customers": False,
                     "customers": [{"id": "C1", "table_id": "T1", "dish_id": LOC, "patience_ticks_left": 5}]}
            rows = run(w, block, [], 10)
            left = events(rows, "customer_left")[0]
            self.assertEqual(left["tick"], 5)
            self.assertEqual(left["data"], {"order_id": "C1", "table_id": "T1", "reason": "patience", "reputation": 2.5})
            self.assertEqual(snapshots(rows)[-1]["stock"], {"ca_loc": 1})  # nhả giữ, tồn không đổi


class Kitchen(unittest.TestCase):
    def test_nau_lay_mon_payload(self):
        with Workdir() as w:
            block = {"stock": {"ca_loc": 1}, "random_customers": False, "player": {"pos": STOVE},
                     "customers": [{"id": "C1", "table_id": "T1", "dish_id": LOC}]}
            rows = run(w, block, press(0) + press(400), 401)
            self.assertEqual(events(rows, "cook_started")[0]["data"],
                             {"stove_id": "B1", "order_id": "C1", "dish_id": LOC, "items": ["ca_loc"], "base_price": 60})
            ready = events(rows, "dish_ready")[0]
            self.assertEqual((ready["tick"], ready["data"]), (1 + 360, {"stove_id": "B1", "order_id": "C1", "dish_id": LOC}))
            last = snapshots(rows)[-1]
            self.assertEqual(last["hand"], HAND)
            self.assertEqual(last["stock"], {})
            self.assertEqual(last["customers"][0]["order_status"], "assigned")

    def test_khach_bo_di_thi_bo_mon_dang_nau(self):
        with Workdir() as w:
            block = {"stock": {"ca_loc": 1}, "random_customers": False, "player": {"pos": STOVE},
                     "customers": [{"id": "C1", "table_id": "T1", "dish_id": LOC, "patience_ticks_left": 50}]}
            rows = run(w, block, press(0), 60)
            last = snapshots(rows)[-1]
            self.assertEqual(last["stoves"][0]["state"], "idle")
            self.assertEqual(last["stock"], {})  # nguyên liệu đã dùng không hoàn


class Serving(unittest.TestCase):
    def test_phuc_vu_boa_uy_tin_khi_thu_tien(self):
        with Workdir() as w:
            block = {"random_customers": False, "player": {"pos": TABLE}, "hand": HAND, "customers": [assigned()]}
            rows = run(w, block, press(0), 610)
            served = events(rows, "served")[0]["data"]
            self.assertEqual(served, {"order_id": "C1", "table_id": "T1", "dish_id": LOC,
                                      "patience_ticks_left": 3599, "base_price": 60, "tip": 12})
            self.assertEqual(snapshots(rows)[2]["reputation"], 3.0)  # chưa cộng lúc phục vụ
            paid = events(rows, "paid")[0]
            self.assertEqual((paid["tick"], paid["data"]),
                             (1 + 600, {"order_id": "C1", "table_id": "T1", "base_price": 60, "tip": 12,
                                        "amount": 72, "reason": "finished_eating"}))
            last = snapshots(rows)[-1]
            self.assertEqual((last["money"], last["reputation"], last["customers"]), (72, 3.2, []))

    def test_kien_nhan_duoi_nguong_khong_boa(self):
        with Workdir() as w:
            block = {"random_customers": False, "player": {"pos": TABLE}, "hand": HAND,
                     "customers": [assigned(patience_ticks_left=1000)]}
            rows = run(w, block, press(0), 2)
            self.assertEqual(events(rows, "served")[0]["data"]["tip"], 0)


class Closing(unittest.TestCase):
    def test_het_ca_khach_an_tra_tien(self):
        with Workdir() as w:
            rows = run(w, {"time_left_ticks": 3, "random_customers": False, "customers": [eating(tip=12)]}, [], 10)
            paid = events(rows, "paid")[0]
            self.assertEqual((paid["tick"], paid["data"]["reason"], paid["data"]["amount"]), (3, "closing", 72))
            self.assertEqual(events(rows, "quan_end")[0]["tick"], 3)
            self.assertEqual(rows[-1]["reason"], "time")

    def test_het_ca_khach_cho_roi_khong_tru_uy_tin(self):
        with Workdir() as w:
            block = {"time_left_ticks": 3, "random_customers": False, "stock": {"ca_loc": 1},
                     "customers": [{"id": "C1", "table_id": "T1", "dish_id": LOC}]}
            rows = run(w, block, [], 10)
            left = events(rows, "customer_left")[0]["data"]
            self.assertEqual((left["reason"], left["reputation"]), ("closing", 3.0))


class ScenarioErrors(unittest.TestCase):
    def test_mau_thuan_exit_2(self):
        no_tip = {k: v for k, v in eating().items() if k != "tip"}
        bad = [
            {"stock": {}, "customers": [{"id": "C1", "table_id": "T1", "dish_id": LOC}]},          # giữ quá tồn
            {"stock": {"ca_loc": 1}, "customers": [{"id": "C1", "table_id": "T1", "dish_id": LOC,
                                                    "reserved": {"ca_loc": 2}}]},                  # giữ khác công thức
            {"hand": LOC},                                                                         # hand không phải payload
            {"hand": HAND},                                                                        # tay giữ đơn không tồn tại
            {"customers": [assigned()]},                                                           # assigned mà không có món
            {"customers": [no_tip]},                                                               # eating thiếu tip
            {"customers": [{"id": "C1", "table_id": "T1", "dish_id": "pho"}]},                     # món ngoài phạm vi
            {"customers": [{"id": "C1", "table_id": "T1", "dish_id": LOC, "cooking": True}]},       # trường lạ
            {"stoves": [{"id": "B1", "state": "cooking"}]},                                         # bếp cooking không món
            {"hand": HAND, "customers": [assigned()],
             "stoves": [{"id": "B1", "state": "ready", "dish": HAND}]},                             # bếp và tay giữ cùng đơn
        ]
        with Workdir() as w:
            for block in bad:
                run(w, block, [], 0, code_expected=2)


if __name__ == "__main__":
    unittest.main()
