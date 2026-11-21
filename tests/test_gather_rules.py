"""Test luật gather của nhóm (hộp đen qua headless): oxy, ngạt, ngất, hái, bắt cá, giỏ."""

import json
import unittest

from helpers import Workdir, events, frames, read_jsonl, run_headless, snapshots, write_json


def run(w, block, inputs, ticks, extra=()):
    sc = write_json(w.path("sc.json"), {"gather": block})
    inp = write_json(w.path("in.json"), frames(*inputs))
    code, err = run_headless("--mode", "gather", "--seed", "1", "--ticks", str(ticks), "--scenario", sc,
                             "--inputs", inp, "--snapshot-every", "1", "--out", w.path("o.jsonl"), *extra)
    assert code == 0, err
    return read_jsonl(w.path("o.jsonl"))


class Oxygen(unittest.TestCase):
    def test_oxy_giam_duoi_nuoc_hoi_o_mat_nuoc(self):
        with Workdir() as w:
            rows = run(w, {"player": {"pos": [50, 5], "oxygen_ticks": 100}}, [], 10)
            self.assertEqual(snapshots(rows)[-1]["player"]["oxygen_ticks"], 90)
            rows = run(w, {"player": {"pos": [50, 0], "oxygen_ticks": 100}}, [], 10)
            self.assertEqual(snapshots(rows)[-1]["player"]["oxygen_ticks"], 160)

    def test_dive_va_surface(self):
        with Workdir() as w:
            rows = run(w, {"player": {"pos": [50, 0.4]}}, [{"tick": 0, "move": [0, 1]}, {"tick": 40, "move": [0, -1]}], 200)
            self.assertEqual(len(events(rows, "dive")), 1)
            self.assertEqual(len(events(rows, "surface")), 1)

    def test_ngat_tru_mau_va_ngat_xiu(self):
        with Workdir() as w:
            rows = run(w, {"player": {"pos": [50, 10], "oxygen_ticks": 1}, "hold": ["ca_loc"]}, [], 400,
                       ("--inventory-out", w.path("inv.json")))
            self.assertEqual(len(events(rows, "oxygen_empty")), 1)
            chokes = events(rows, "choke")
            self.assertEqual([e["tick"] for e in chokes], [60, 120, 180])
            self.assertEqual(len(events(rows, "faint")), 1)
            end = events(rows, "gather_end")[0]
            self.assertEqual(end["data"]["reason"], "fainted")
            self.assertEqual(end["data"]["inventory"], {"items": {}})
            with open(w.path("inv.json"), encoding="utf-8") as f:
                self.assertEqual(json.load(f), {"items": {}})


class Gathering(unittest.TestCase):
    def test_hai_nut_mat_nut_va_moc_lai(self):
        with Workdir() as w:
            rows = run(w, {"player": {"pos": [12, 0]}}, [{"tick": 0, "interact": True}], 1300)
            g = events(rows, "gather")
            self.assertEqual(g[0]["data"]["node_id"], "N1")
            self.assertEqual(snapshots(rows)[1]["hold"], ["bong_dien_dien"])
            self.assertEqual(events(rows, "node_regrown")[0]["tick"], 1 + 1200)

    def test_khong_hai_duoi_nuoc(self):
        with Workdir() as w:
            rows = run(w, {"player": {"pos": [12, 3]}}, [{"tick": 0, "interact": True}], 2)
            self.assertEqual(events(rows, "gather"), [])

    def test_gio_day_hold_full(self):
        with Workdir() as w:
            rows = run(w, {"player": {"pos": [12, 0]}, "hold": ["ca_loc"] * 12}, [{"tick": 0, "interact": True}], 2)
            self.assertEqual(len(events(rows, "hold_full")), 1)
            self.assertEqual(events(rows, "gather"), [])


class Catching(unittest.TestCase):
    def test_bat_ca_va_hoi_chieu(self):
        with Workdir() as w:
            block = {"player": {"pos": [15, 5]}, "fish": [{"id": "F1", "kind": "ca_linh", "pos": [15, 5]},
                                                           {"id": "F2", "kind": "ca_loc", "pos": [15, 5]}]}
            ins = [{"tick": 0, "catch": True}, {"tick": 1, "catch": False}, {"tick": 2, "catch": True}]
            rows = run(w, block, ins, 3)
            caught = events(rows, "fish_caught")
            self.assertEqual(len(caught), 1)  # tick 2 bị hồi chiêu chặn
            self.assertEqual(caught[0]["data"]["fish_id"], "F1")
            self.assertEqual(snapshots(rows)[-1]["hold"], ["ca_linh"] * 3)

    def test_khong_bat_o_mat_nuoc(self):
        with Workdir() as w:
            rows = run(w, {"player": {"pos": [50, 0]}, "fish": [{"id": "F1", "kind": "ca_loc", "pos": [50, 1]}]},
                       [{"tick": 0, "catch": True}], 2)
            self.assertEqual(events(rows, "fish_caught"), [])


if __name__ == "__main__":
    unittest.main()
