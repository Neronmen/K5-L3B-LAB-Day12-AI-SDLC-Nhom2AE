"""Buổi tối — Mở Quán (`quan`), theo PRD-0 (Test Contract v1.0) mục D, E, F. Nhìn từ trên xuống, vị trí `[x, z]`.

Đơn hàng: mỗi khách có một đơn, `order_id` = id khách. Payload món = {order_id, dish_id, base_price}.
order_status: reserved (đang giữ nguyên liệu) -> assigned (món ở bếp/tay, phần giữ rỗng) -> served (khách đang ăn);
              unfulfillable (chỉ từ scenario: còn chờ, giữ rỗng, không có món).
Kho `stock` là tồn VẬT LÝ, gồm cả phần khách đang giữ; khả dụng = tồn - giữ. Bắt đầu nấu mới trừ tồn.

Thứ tự một bước (PRD-0 F, Quán):
  1. tăng đồng hồ, giảm timer ca, nấu, ăn, kiên nhẫn; chỉ tăng ready_ticks cho món đã ready ở đầu bước
  2. xét bếp theo id: nấu xong -> ready, ready_ticks = 0, dish_ready (burn_s = null: không cháy)
  3. di chuyển rồi tối đa MỘT interact, chọn theo (khoảng cách, bếp trước bàn, id); đối tượng không tương tác được -> bỏ lượt
  4. theo id bàn: khách ăn xong trả tiền; còn giờ thì khách chờ hết kiên nhẫn rời (trừ uy tín);
     hết ca: khách đang ăn trả ngay (closing), khách chờ rời (closing, không trừ uy tín), rồi quan_end
  5. còn giờ: lượt khách mới theo lịch phase_tick
"""

import math

from ..errors import BadInput
from ..ids import id_key, sort_by_id
from .ramp import ramp_velocity

TICK = 60.0
CUSTOMER_KEYS = {"id", "table_id", "dish_id", "order_tick", "state", "patience_ticks_left", "eat_ticks_left",
                 "order_status", "reserved", "base_price", "tip"}
STOVE_KEYS = {"id", "pos", "state", "dish", "cook_ticks_left", "ready_ticks"}
PAYLOAD_KEYS = {"order_id", "dish_id", "base_price"}


def _int(name, v, lo=0):
    if isinstance(v, bool) or not isinstance(v, int) or v < lo:
        raise BadInput(f"{name} phải là số nguyên >= {lo}")
    return v


class QuanSim:
    mode = "quan"
    phase = "quan"

    def __init__(self, tuning, scenario, streams, ids, inventory=None):
        t = tuning["quan"]
        self.t = t
        self.menu = tuning["menu"]
        self.rng = streams
        self.ids = ids
        self.patience_max = int(round(t["patience_s"] * TICK))
        self.eat_ticks = int(round(t["eat_s"] * TICK))
        p = scenario.get("player", {})
        self.pos = [float(c) for c in p.get("pos", t["start_pos"])]
        self.vel = [float(c) for c in p.get("vel", [0.0, 0.0])]
        self._tgt = None
        self._ramp_left = 0
        # kho: --inventory HOẶC scenario.stock (cả hai -> cli đã báo mã 2); thiếu cả hai -> kho rỗng
        self.stock = dict(inventory if inventory is not None else scenario.get("stock", {}))
        self.time_left_ticks = scenario.get("time_left_ticks", int(round(t["duration_s"] * TICK)))
        self.reputation = scenario.get("reputation", t["reputation_initial"])
        self.random_customers = scenario.get("random_customers", True)
        self.phase_tick = 0
        self.tables = self._merge(t["tables"], scenario.get("tables", []), {"id", "pos"})
        self.stoves = [self._load_stove(s) for s in self._merge(t["stoves"], scenario.get("stoves", []), STOVE_KEYS)]
        self.hand = self._payload(scenario["hand"], "hand") if scenario.get("hand") is not None else None
        self.customers = [self._load_customer(c) for c in scenario.get("customers", [])]
        for e in self.customers:
            ids.reserve(e["id"])
        self._check_links()
        self.money = 0
        self.earned = 0
        self.shift_earned = 0
        self.served_count = 0
        self.left_count = 0
        self.done = False
        self.reason = None

    # --- dựng + kiểm scenario (PRD-0 mục D; mâu thuẫn -> mã 2) ----------------------------------
    @staticmethod
    def _merge(defaults, updates, allowed):
        by_id = {d["id"]: dict(d) for d in defaults}
        for u in updates:
            extra = set(u) - allowed
            if extra:
                raise BadInput(f"trường lạ ở {u.get('id')}: {sorted(extra)}")
            if u["id"] not in by_id:
                raise BadInput(f"id bếp/bàn không tồn tại: {u['id']}")
            by_id[u["id"]].update(u)
        return sort_by_id(list(by_id.values()))

    def _payload(self, d, where):
        if not isinstance(d, dict) or set(d) != PAYLOAD_KEYS:
            raise BadInput(f"{where}: payload món phải có đúng {sorted(PAYLOAD_KEYS)}")
        if d["dish_id"] not in self.menu:
            raise BadInput(f"{where}: món ngoài phạm vi {d['dish_id']!r}")
        if not isinstance(d["order_id"], str):
            raise BadInput(f"{where}: order_id phải là chuỗi")
        _int(f"{where}.base_price", d["base_price"], 1)
        return dict(d)

    def _load_stove(self, s):
        st = {"id": s["id"], "pos": s["pos"], "state": s.get("state", "idle"),
              "dish": None, "cook_ticks_left": s.get("cook_ticks_left", 0), "ready_ticks": s.get("ready_ticks", 0)}
        if st["state"] not in ("idle", "cooking", "ready"):
            raise BadInput(f"bếp {st['id']}: state phải là idle/cooking/ready")
        _int(f"bếp {st['id']}.cook_ticks_left", st["cook_ticks_left"])
        _int(f"bếp {st['id']}.ready_ticks", st["ready_ticks"])
        if s.get("dish") is not None:
            st["dish"] = self._payload(s["dish"], f"bếp {st['id']}.dish")
        if st["state"] == "idle" and (st["dish"] is not None or st["cook_ticks_left"] or st["ready_ticks"]):
            raise BadInput(f"bếp {st['id']} idle không được có món/bộ đếm")
        if st["state"] == "cooking" and (st["dish"] is None or st["cook_ticks_left"] <= 0 or st["ready_ticks"]):
            raise BadInput(f"bếp {st['id']} cooking cần món và cook_ticks_left > 0")
        if st["state"] == "ready" and (st["dish"] is None or st["cook_ticks_left"]):
            raise BadInput(f"bếp {st['id']} ready cần món và cook_ticks_left = 0")
        return st

    def _load_customer(self, c):
        extra = set(c) - CUSTOMER_KEYS
        if extra:
            raise BadInput(f"customers.{c['id']}: trường lạ {sorted(extra)}")
        dish = c.get("dish_id")
        if dish not in self.menu:
            raise BadInput(f"customers.{c['id']}: dish_id phải là món trong menu")
        state = c.get("state", "waiting")
        status = c.get("order_status", "reserved")
        if state not in ("waiting", "eating"):
            raise BadInput(f"customers.{c['id']}: state phải là waiting hoặc eating")
        if status not in ("reserved", "assigned", "unfulfillable", "served"):
            raise BadInput(f"customers.{c['id']}: order_status không hợp lệ")
        cu = {"id": c["id"], "table_id": c["table_id"], "dish_id": dish,
              "order_tick": _int(f"customers.{c['id']}.order_tick", c.get("order_tick", 0)),
              "state": state,
              "patience_ticks_left": _int(f"customers.{c['id']}.patience_ticks_left", c.get("patience_ticks_left", self.patience_max)),
              "eat_ticks_left": _int(f"customers.{c['id']}.eat_ticks_left", c.get("eat_ticks_left", 0)),
              "order_status": status,
              "base_price": _int(f"customers.{c['id']}.base_price", c.get("base_price", self.menu[dish]["price"]), 1),
              "tip": _int(f"customers.{c['id']}.tip", c.get("tip", 0))}
        if cu["patience_ticks_left"] > self.patience_max:
            raise BadInput(f"customers.{c['id']}: patience_ticks_left vượt kiên nhẫn tối đa")
        if cu["eat_ticks_left"] > self.eat_ticks:
            raise BadInput(f"customers.{c['id']}: eat_ticks_left vượt thời gian ăn")
        recipe = dict(self.menu[dish]["recipe"])
        if status == "reserved":
            res = c.get("reserved", recipe)
            if res != recipe:
                raise BadInput(f"customers.{c['id']}: giữ khác công thức")
        else:
            res = c.get("reserved", {})
            if res:
                raise BadInput(f"customers.{c['id']}: đơn {status} phải có phần giữ rỗng")
        cu["reserved"] = dict(res)
        if state == "eating":
            if status != "served" or cu["eat_ticks_left"] <= 0 or "base_price" not in c or "tip" not in c:
                raise BadInput(f"customers.{c['id']}: khách eating phải served, eat_ticks_left > 0, khai base_price và tip")
        elif status == "served":
            raise BadInput(f"customers.{c['id']}: đơn served thì khách phải đang ăn")
        elif cu["eat_ticks_left"] or cu["tip"]:
            raise BadInput(f"customers.{c['id']}: khách chờ không có eat_ticks_left/tip")
        return cu

    def _check_links(self):
        tables = {tb["id"] for tb in self.tables}
        seen = set()
        for c in self.customers:
            if c["table_id"] not in tables:
                raise BadInput(f"customers.{c['id']}: table_id phải là bàn có thật")
            if c["table_id"] in seen:
                raise BadInput("hai khách cùng bàn")
            seen.add(c["table_id"])
        by_id = {c["id"]: c for c in self.customers}
        holders = {}  # order_id -> nơi giữ món
        for where, d in [(f"bếp {s['id']}", s["dish"]) for s in self.stoves] + [("tay", self.hand)]:
            if d is None:
                continue
            c = by_id.get(d["order_id"])
            if c is None or c["order_status"] != "assigned" or c["dish_id"] != d["dish_id"]:
                raise BadInput(f"{where}: món không khớp đơn đang assigned ({d['order_id']})")
            if d["order_id"] in holders:
                raise BadInput(f"{where} và {holders[d['order_id']]} giữ cùng đơn {d['order_id']}")
            holders[d["order_id"]] = where
        for c in self.customers:
            if c["order_status"] == "assigned" and c["id"] not in holders:
                raise BadInput(f"customers.{c['id']}: đơn assigned phải có đúng một món ở bếp hoặc tay")
        need = self._reserved_total()
        for k, v in need.items():
            if v > self.stock.get(k, 0):
                raise BadInput(f"khách giữ {k}×{v} vượt tồn ({self.stock.get(k, 0)})")

    # --- giao diện cho runner -------------------------------------------------------------------
    def snapshot(self) -> dict:
        occupied = {c["table_id"]: c["id"] for c in self.customers}
        return {
            "player": {"pos": self.pos, "vel": self.vel},
            "stock": {k: self.stock[k] for k in sorted(self.stock) if self.stock[k] > 0},
            "hand": self.hand,
            "stoves": [{k: s[k] for k in ("id", "pos", "state", "dish", "cook_ticks_left", "ready_ticks")}
                       for s in self.stoves],
            "tables": [{"id": tb["id"], "pos": tb["pos"], "customer_id": occupied.get(tb["id"])} for tb in self.tables],
            "customers": [{k: (dict(sorted(c[k].items())) if k == "reserved" else c[k]) for k in
                           ("id", "table_id", "dish_id", "order_tick", "state", "patience_ticks_left", "eat_ticks_left",
                            "order_status", "reserved", "base_price", "tip")}
                          for c in sort_by_id(self.customers)],
            # thêm cho client (không thuộc contract): tổng giữ chỗ và số liệu ca
            "reserved": self._reserved_total(),
            "shift_earned": self.shift_earned, "served_count": self.served_count, "left_count": self.left_count,
        }

    # --- một bước -------------------------------------------------------------------------------
    def step(self, inp):
        events = []
        # 1. đồng hồ, timer ca, nấu, ăn, kiên nhẫn
        self.phase_tick += 1
        self.time_left_ticks = max(0, self.time_left_ticks - 1)
        ready_before = {s["id"] for s in self.stoves if s["state"] == "ready"}
        for s in self.stoves:
            if s["state"] == "cooking":
                s["cook_ticks_left"] = max(0, s["cook_ticks_left"] - 1)
            elif s["id"] in ready_before:
                s["ready_ticks"] += 1
        for c in self.customers:
            if c["state"] == "eating":
                c["eat_ticks_left"] = max(0, c["eat_ticks_left"] - 1)
            else:
                c["patience_ticks_left"] = max(0, c["patience_ticks_left"] - 1)
        # 2. bếp theo id: nấu xong -> ready
        for s in self.stoves:
            if s["state"] == "cooking" and s["cook_ticks_left"] == 0:
                s["state"], s["ready_ticks"] = "ready", 0
                events.append(("dish_ready", {"stove_id": s["id"], "order_id": s["dish"]["order_id"],
                                              "dish_id": s["dish"]["dish_id"]}))
        # 3. di chuyển rồi tối đa một interact
        self._move(inp)
        if inp.pressed("interact"):
            self._interact(events)
        # 4. thanh toán / rời bàn (theo id bàn); hết ca thì dọn quán
        closing = self.time_left_ticks <= 0
        order = {tb["id"]: i for i, tb in enumerate(self.tables)}
        for c in sorted(list(self.customers), key=lambda c: order[c["table_id"]]):
            if c["state"] == "eating" and (c["eat_ticks_left"] == 0 or closing):
                self._pay(c, "finished_eating" if c["eat_ticks_left"] == 0 else "closing", events)
            elif c["state"] == "waiting" and closing:
                self._leave(c, "closing", events)
            elif c["state"] == "waiting" and c["patience_ticks_left"] == 0:
                self._leave(c, "patience", events)
        if closing:
            self.done = True
            self.reason = "time"
            events.append(("quan_end", {"reason": "time", "money": self.money, "earned": self.earned,
                                        "shift_earned": self.shift_earned, "reputation": self.reputation}))
            return events
        # 5. khách mới theo lịch
        self._spawn(events)
        return events

    # --- tương tác ------------------------------------------------------------------------------
    def _interact(self, events):
        r = self.t["interact_radius"]
        cands = []
        for s in self.stoves:
            d = math.dist(self.pos, s["pos"])
            if d <= r:
                cands.append((d, 0, id_key(s["id"]), "stove", s))
        for tb in self.tables:
            d = math.dist(self.pos, tb["pos"])
            if d <= r:
                cands.append((d, 1, id_key(tb["id"]), "table", tb))
        if not cands:
            return
        cands.sort(key=lambda c: c[:3])
        _, _, _, kind, obj = cands[0]
        if kind == "stove":
            self._use_stove(obj, events)
        else:
            self._use_table(obj, events)

    def _use_stove(self, s, events):
        if s["state"] == "ready":
            if self.hand is not None:  # carry_limit = 1
                return
            self.hand = s["dish"]
            events.append(("dish_picked", {"stove_id": s["id"], "order_id": self.hand["order_id"],
                                           "dish_id": self.hand["dish_id"]}))
            s.update(state="idle", dish=None, cook_ticks_left=0, ready_ticks=0)
        elif s["state"] == "idle":
            table_order = {tb["id"]: id_key(tb["id"]) for tb in self.tables}
            waiting = [c for c in self.customers if c["order_status"] == "reserved"]
            if not waiting:
                return
            c = min(waiting, key=lambda c: (c["order_tick"], table_order[c["table_id"]]))
            items = []
            for k in sorted(c["reserved"]):
                self.stock[k] = self.stock.get(k, 0) - c["reserved"][k]
                items += [k] * c["reserved"][k]
            c["reserved"] = {}
            c["order_status"] = "assigned"
            price = self.menu[c["dish_id"]]["price"]
            c["base_price"] = price
            s.update(state="cooking", dish={"order_id": c["id"], "dish_id": c["dish_id"], "base_price": price},
                     cook_ticks_left=int(round(self.menu[c["dish_id"]]["cook_s"] * TICK)), ready_ticks=0)
            events.append(("cook_started", {"stove_id": s["id"], "order_id": c["id"], "dish_id": c["dish_id"],
                                            "items": items, "base_price": price}))

    def _use_table(self, tb, events):
        c = next((c for c in self.customers if c["table_id"] == tb["id"]), None)
        if c is None or c["state"] != "waiting" or self.hand is None or self.hand["order_id"] != c["id"]:
            return
        dish = self.hand
        self.hand = None
        tip = 0
        if c["patience_ticks_left"] / self.patience_max >= self.t["tip_min_patience_ratio"]:
            tip = math.floor(dish["base_price"] * self.t["tip_rate"])
        c.update(state="eating", order_status="served", eat_ticks_left=self.eat_ticks,
                 base_price=dish["base_price"], tip=tip)
        self.served_count += 1
        events.append(("served", {"order_id": c["id"], "table_id": tb["id"], "dish_id": c["dish_id"],
                                  "patience_ticks_left": c["patience_ticks_left"],
                                  "base_price": c["base_price"], "tip": tip}))

    # --- thanh toán, rời bàn, khách mới ---------------------------------------------------------
    def _pay(self, c, reason, events):
        amount = c["base_price"] + c["tip"]
        self.money += amount
        self.earned += amount
        self.shift_earned += amount
        if c["tip"] > 0:
            self._add_reputation(self.t["tip_reputation"])
        self.customers.remove(c)
        events.append(("paid", {"order_id": c["id"], "table_id": c["table_id"], "base_price": c["base_price"],
                                "tip": c["tip"], "amount": amount, "reason": reason}))

    def _leave(self, c, reason, events):
        self.customers.remove(c)
        self.left_count += 1
        # nhả phần giữ (tồn không đổi), bỏ món của đơn đang nấu / ready / trên tay; nguyên liệu đã dùng không hoàn
        for s in self.stoves:
            if s["dish"] is not None and s["dish"]["order_id"] == c["id"]:
                s.update(state="idle", dish=None, cook_ticks_left=0, ready_ticks=0)
        if self.hand is not None and self.hand["order_id"] == c["id"]:
            self.hand = None
        if reason == "patience":
            self._add_reputation(self.t["left_reputation_delta"])
        events.append(("customer_left", {"order_id": c["id"], "table_id": c["table_id"], "reason": reason,
                                         "reputation": self.reputation}))

    def _spawn(self, events):
        if not self.random_customers:
            return
        first = int(self.t["first_customer_tick"])
        every = int(round(self.t["customer_interval_s"] * TICK))
        if self.phase_tick < first or (self.phase_tick - first) % every != 0:
            return
        busy = {c["table_id"] for c in self.customers}
        free = [tb for tb in self.tables if tb["id"] not in busy]
        if not free:
            return
        avail = self._available()
        dishes = [d for d in sorted(self.menu) if all(avail.get(k, 0) >= v for k, v in self.menu[d]["recipe"].items())]
        if not dishes:
            events.append(("no_dish", {}))
            return
        dish = dishes[self.rng.get("customer_dish").randrange(len(dishes))]
        cid = self.ids.new("C")
        c = {"id": cid, "table_id": free[0]["id"], "dish_id": dish, "order_tick": self.phase_tick, "state": "waiting",
             "patience_ticks_left": self.patience_max, "eat_ticks_left": 0, "order_status": "reserved",
             "reserved": dict(self.menu[dish]["recipe"]), "base_price": self.menu[dish]["price"], "tip": 0}
        self.customers.append(c)
        events.append(("customer_arrived", {"order_id": cid, "table_id": c["table_id"], "dish_id": dish}))

    # --- tiện ích -------------------------------------------------------------------------------
    def _reserved_total(self):
        out = {}
        for c in self.customers:
            for k, v in c["reserved"].items():
                out[k] = out.get(k, 0) + v
        return {k: out[k] for k in sorted(out) if out[k] > 0}

    def _available(self):
        res = self._reserved_total()
        return {k: self.stock.get(k, 0) - res.get(k, 0) for k in self.stock}

    def _add_reputation(self, delta):
        lo, hi = self.t["reputation_min"], self.t["reputation_max"]
        self.reputation = round(min(hi, max(lo, self.reputation + delta)), 6)

    def _move(self, inp):
        speed = self.t["walk_speed"]
        mx, mz = inp.move
        self.vel = ramp_velocity(self, (mx * speed, mz * speed), int(self.t.get("ramp_max_ticks", 6)))
        b = self.t["bounds"]
        for i, axis in enumerate(("x", "z")):
            self.pos[i] += self.vel[i] / TICK
            lo, hi = b[axis]
            if self.pos[i] <= lo:
                self.pos[i], self.vel[i] = lo, max(0.0, self.vel[i])
            elif self.pos[i] >= hi:
                self.pos[i], self.vel[i] = hi, min(0.0, self.vel[i])
