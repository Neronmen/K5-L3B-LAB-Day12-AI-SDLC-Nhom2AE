"""Test luật quán của nhóm (hộp đen qua headless): khách, bếp, bưng, phục vụ, trả tiền, boa, uy tín."""

import unittest

from helpers import Workdir, events, frames, read_jsonl, run_headless, snapshots, write_json

STOVE = [2, 8]
TABLE = [9, 2]


def run(w, block, inputs, ticks, code_expected=0):
    sc = write_json(w.path("sc.json"), {"quan": block})
    inp = write_json(w.path("in.json"), frames(*inputs))
    code, err = run_headless("--mode", "quan", "--seed", "3", "--ticks", str(ticks), "--scenario", sc,
                             "--inputs", inp, "--snapshot-every", "1", "--out", w.path("o.jsonl"))
    assert code == code_expected, err
    return read_jsonl(w.path("o.jsonl")) if code == 0 else None


def press(t):
    return [{"tick": t, "interact": True}, {"tick": t + 1, "interact": False}]


class Customers(unittest.TestCase):
    def test_khach_den_theo_lich_va_giu_cho(self):
        with Workdir() as w:
            rows = run(w, {"stock": {"ca_loc": 1}}, [], 121)
            arr = events(rows, "customer_arrived")
            self.assertEqual(len(arr), 1)
            self.assertEqual(arr[0]["tick"], 120)
            self.assertEqual(arr[0]["data"]["dish_id"], "ca_loc_nuong_trui")
            self.assertEqual(snapshots(rows)[-1]["reserved"], {"ca_loc": 1})

    def test_no_dish_khi_kho_rong(self):
        with Workdir() as w:
            rows = run(w, {}, [], 121)
            self.assertEqual(len(events(rows, "no_dish")), 1)
            self.assertEqual(events(rows, "customer_arrived"), [])

    def test_het_kien_nhan_bo_di_tru_uy_tin(self):
        with Workdir() as w:
            block = {"stock": {"ca_loc": 1}, "random_customers": False,
                     "customers": [{"id": "C1", "table_id": "T1", "dish_id": "ca_loc_nuong_trui", "patience_ticks_left": 5}]}
            rows = run(w, block, [], 10)
            left = events(rows, "customer_left")
            self.assertEqual(left[0]["tick"], 5)
            self.assertEqual(snapshots(rows)[-1]["reputation"], 2.5)
            self.assertEqual(snapshots(rows)[-1]["reserved"], {})

    def test_giu_cho_vuot_kho_exit_2(self):
        with Workdir() as w:
            block = {"stock": {}, "customers": [{"id": "C1", "table_id": "T1", "dish_id": "ca_loc_nuong_trui"}]}
            run(w, block, [], 0, code_expected=2)


class FullLoop(unittest.TestCase):
    def test_nau_bung_phuc_vu_tra_tien_co_boa(self):
        with Workdir() as w:
            block = {"stock": {"ca_loc": 1}, "random_customers": False, "player": {"pos": STOVE},
                     "customers": [{"id": "C1", "table_id": "T1", "dish_id": "ca_loc_nuong_trui"}]}
            # E tại bếp (nấu 6 s) -> E lấy món -> đặt người ở bàn -> E phục vụ -> ăn 10 s -> trả tiền
            ins = press(0) + press(400)
            rows = run(w, block, ins, 401)
            self.assertEqual(len(events(rows, "cook_started")), 1)
            self.assertEqual(events(rows, "dish_ready")[0]["tick"], 1 + 360)
            self.assertEqual(len(events(rows, "dish_picked")), 1)
            self.assertEqual(snapshots(rows)[-1]["hand"], "ca_loc_nuong_trui")
            self.assertEqual(snapshots(rows)[-1]["stock"], {})

        with Workdir() as w:
            block = {"stock": {}, "random_customers": False, "player": {"pos": TABLE}, "hand": "ca_loc_nuong_trui",
                     "customers": [{"id": "C1", "table_id": "T1", "dish_id": "ca_loc_nuong_trui", "cooking": True}]}
            rows = run(w, block, press(0), 610)
            served = events(rows, "served")[0]["data"]
            self.assertEqual(served["tip"], 12)
            paid = events(rows, "paid")[0]
            self.assertEqual(paid["tick"], 1 + 600)
            self.assertEqual(paid["data"]["amount"], 72)
            last = snapshots(rows)[-1]
            self.assertEqual(last["money"], 72)
            self.assertEqual(last["reputation"], 3.2)
            self.assertEqual(last["customers"], [])

    def test_sai_mon_khong_phuc_vu(self):
        with Workdir() as w:
            block = {"stock": {}, "random_customers": False, "player": {"pos": TABLE}, "hand": "goi_bong_sung",
                     "customers": [{"id": "C1", "table_id": "T1", "dish_id": "ca_loc_nuong_trui", "cooking": True}]}
            rows = run(w, block, press(0), 3)
            self.assertEqual(events(rows, "served"), [])

    def test_het_ca(self):
        with Workdir() as w:
            rows = run(w, {"time_left_ticks": 4}, [], 10)
            end = events(rows, "quan_end")
            self.assertEqual(end[0]["tick"], 4)
            self.assertEqual(rows[-1]["reason"], "time")


if __name__ == "__main__":
    unittest.main()
