"""Buổi tối — Mở Quán. Nhìn từ trên xuống, vị trí `[x, z]`.

Luật của nhóm (giả định khi chưa có đủ PRD-0 mục F được ghi ở docs/clarify.md):

Vòng đời khách:  (đến) -> waiting -> eating -> (paid, rời bàn)
                              \\-> hết kiên nhẫn -> customer_left (rời bàn, uy tín giảm)
- Khách đến theo lịch: tick `first_customer_tick`, rồi mỗi `customer_interval_s` (nếu `random_customers` khác false).
  Cần một bàn trống (id nhỏ nhất). Không có bàn trống -> lượt đó bỏ qua.
- Khách chọn ngẫu nhiên (luồng RNG "customer_dish") trong các món NẤU ĐƯỢC từ kho còn lại sau khi trừ phần
  khách khác đã giữ chỗ. Không món nào nấu được -> `no_dish`, khách không vào.
- Khách giữ chỗ (reserved) nguyên liệu của món mình gọi. Bắt đầu nấu -> trừ kho, bỏ giữ chỗ.
Bếp:  idle --(E, có khách chờ chưa được nấu)--> cooking --(hết cook_s)--> ready --(E, tay trống)--> idle (cầm món)
Bàn:  E khi cầm món đúng món khách đang chờ -> served, khách ăn trong `eat_s`, xong -> paid (giá + boa).
Boa: lúc phục vụ, nếu kiên nhẫn còn >= tip_min_patience_ratio -> tip = round(price * tip_rate), uy tín + tip_reputation.
Uy tín kẹp trong [reputation_min, reputation_max].
Thứ tự một bước: đồng hồ -> bếp -> khách (ăn, kiên nhẫn) -> di chuyển -> MỘT interact -> khách mới -> hết ca.
"""

import math

from ..errors import BadInput
from ..ids import id_key, sort_by_id
from .ramp import ramp_velocity

TICK = 60.0


class QuanSim:
    mode = "quan"
    phase = "quan"

    def __init__(self, tuning, scenario, streams, ids, inventory=None):
        t = tuning["quan"]
        self.t = t
        self.menu = tuning["menu"]
        self.rng = streams
        self.ids = ids
        p = scenario.get("player", {})
        self.pos = [float(c) for c in p.get("pos", t["start_pos"])]
        self.vel = [float(c) for c in p.get("vel", [0.0, 0.0])]
        self._tgt = None
        self._ramp_left = 0
        # kho: --inventory HOẶC scenario.stock (cả hai -> cli đã báo mã 2)
        self.stock = dict(inventory if inventory is not None else scenario.get("stock", {}))
        self.hand = scenario.get("hand")
        if self.hand is not None and self.hand not in self.menu:
            raise BadInput(f"hand phải là id món trong menu: {self.hand!r}")
        self.time_left_ticks = scenario.get("time_left_ticks", int(round(t["duration_s"] * TICK)))
        self.reputation = scenario.get("reputation", t["reputation_initial"])
        self.random_customers = scenario.get("random_customers", True)
        self.tick = 0
        self.stoves = [dict(s, state=s.get("state", "idle"), dish=s.get("dish"),
                            customer_id=s.get("customer_id"),
                            cook_ticks_left=s.get("cook_ticks_left", 0), ready_ticks=s.get("ready_ticks", 0))
                       for s in self._merge(t["stoves"], scenario.get("stoves", []))]
        self.tables = self._merge(t["tables"], scenario.get("tables", []))
        self.customers = [self._load_customer(c) for c in scenario.get("customers", [])]
        for e in self.customers:
            ids.reserve(e["id"])
        self._check_reservations()
        self.money = 0
        self.earned = 0
        self.shift_earned = 0
        self.served_count = 0
        self.left_count = 0
        self.done = False
        self.reason = None

    # --- dựng từ scenario -------------------------------------------------------
    def _load_customer(self, c):
        dish = c.get("dish_id")
        if dish not in self.menu:
            raise BadInput(f"customers.{c['id']}: dish_id phải là món trong menu")
        state = c.get("state", "waiting")
        if state not in ("waiting", "eating"):
            raise BadInput(f"customers.{c['id']}: state phải là waiting hoặc eating")
        pmax = self._patience_max()
        out = {"id": c["id"], "table_id": c["table_id"], "dish_id": dish, "state": state,
               "patience_ticks_left": c.get("patience_ticks_left", pmax),
               "eat_ticks_left": c.get("eat_ticks_left", int(round(self.t["eat_s"] * TICK)) if state == "eating" else 0),
               "price": c.get("price", self.menu[dish]["price"]), "tip": c.get("tip", 0),
               "cooking": bool(c.get("cooking", False))}
        for k in ("patience_ticks_left", "eat_ticks_left", "tip"):
            v = out[k]
            if isinstance(v, bool) or not isinstance(v, int) or v < 0:
                raise BadInput(f"customers.{c['id']}.{k} phải là số nguyên không âm")
        if out["patience_ticks_left"] > pmax:
            raise BadInput(f"customers.{c['id']}.patience_ticks_left vượt kiên nhẫn tối đa")
        default_res = dict(self.menu[dish]["recipe"]) if state == "waiting" and not out["cooking"] else {}
        out["reserved"] = dict(c.get("reserved", default_res))
        return out

    def _check_reservations(self):
        need = {}
        for c in self.customers:
            for k, v in c["reserved"].items():
                need[k] = need.get(k, 0) + v
        for k, v in need.items():
            if v > self.stock.get(k, 0):
                raise BadInput(f"khách giữ chỗ {k}×{v} vượt kho ({self.stock.get(k, 0)})")

    @staticmethod
    def _merge(defaults, updates):
        by_id = {d["id"]: dict(d) for d in defaults}
        for u in updates:
            if u["id"] not in by_id:
                raise BadInput(f"id bếp/bàn không tồn tại: {u['id']}")
            by_id[u["id"]].update(u)
        return sort_by_id(list(by_id.values()))

    # --- giao diện cho runner -----------------------------------------------------
    def snapshot(self) -> dict:
        occupied = {c["table_id"]: c["id"] for c in self.customers}
        return {
            "player": {"pos": self.pos, "vel": self.vel},
            "stock": {k: self.stock[k] for k in sorted(self.stock) if self.stock[k] > 0},
            "reserved": self._reserved_total(),
            "hand": self.hand,
            "stoves": [{k: s.get(k) for k in ("id", "pos", "state", "dish", "customer_id", "cook_ticks_left", "ready_ticks")}
                       for s in self.stoves],
            "tables": [{"id": tb["id"], "pos": tb["pos"], "customer_id": occupied.get(tb["id"])} for tb in self.tables],
            "customers": [dict(c, reserved={k: c["reserved"][k] for k in sorted(c["reserved"])})
                          for c in sort_by_id(self.customers)],
            "shift_earned": self.shift_earned, "served_count": self.served_count, "left_count": self.left_count,
        }

    # --- một bước -------------------------------------------------------------------
    def step(self, inp):
        events = []
        self.time_left_ticks = max(0, self.time_left_ticks - 1)
        self.tick += 1
        self._tick_stoves(events)
        self._tick_customers(events)
        self._move(inp)
        if inp.pressed("interact"):
            self._interact(events)
        self._spawn(events)
        if self.time_left_ticks <= 0:
            self.done = True
            self.reason = "time"
            events.append(("quan_end", {"reason": "time", "money": self.money, "earned": self.earned,
                                        "shift_earned": self.shift_earned, "reputation": self.reputation}))
        return events

    # --- bếp và khách -----------------------------------------------------------------
    def _tick_stoves(self, events):
        for s in self.stoves:
            if s["state"] == "cooking":
                s["cook_ticks_left"] = max(0, s["cook_ticks_left"] - 1)
                if s["cook_ticks_left"] == 0:
                    s["state"] = "ready"
                    s["ready_ticks"] = 0
                    events.append(("dish_ready", {"stove_id": s["id"], "dish_id": s["dish"]}))
            elif s["state"] == "ready":
                s["ready_ticks"] += 1  # burn_s = null ở v1.0: món không cháy

    def _tick_customers(self, events):
        for c in sort_by_id(list(self.customers)):
            if c["state"] == "eating":
                c["eat_ticks_left"] = max(0, c["eat_ticks_left"] - 1)
                if c["eat_ticks_left"] == 0:
                    amount = c["price"] + c["tip"]
                    self.money += amount
                    self.earned += amount
                    self.shift_earned += amount
                    self.customers.remove(c)
                    events.append(("paid", {"customer_id": c["id"], "table_id": c["table_id"], "dish_id": c["dish_id"],
                                            "price": c["price"], "tip": c["tip"], "amount": amount}))
            elif c["state"] == "waiting":
                c["patience_ticks_left"] = max(0, c["patience_ticks_left"] - 1)
                if c["patience_ticks_left"] == 0:
                    self.customers.remove(c)
                    self.left_count += 1
                    for s in self.stoves:  # món đang nấu cho khách này vẫn nấu tiếp, chỉ bỏ gắn khách
                        if s.get("customer_id") == c["id"]:
                            s["customer_id"] = None
                    self._add_reputation(self.t["left_reputation_delta"])
                    events.append(("customer_left", {"customer_id": c["id"], "table_id": c["table_id"],
                                                     "dish_id": c["dish_id"], "reputation": self.reputation}))

    def _spawn(self, events):
        if not self.random_customers:
            return
        first = int(self.t["first_customer_tick"])
        every = int(round(self.t["customer_interval_s"] * TICK))
        if self.tick < first or (self.tick - first) % every != 0:
            return
        busy = {c["table_id"] for c in self.customers}
        free = [tb for tb in self.tables if tb["id"] not in busy]
        if not free:
            return
        avail = self._available()
        dishes = [d for d in sorted(self.menu) if all(avail.get(k, 0) >= v for k, v in self.menu[d]["recipe"].items())]
        if not dishes:
            events.append(("no_dish", {"table_id": free[0]["id"]}))
            return
        dish = dishes[self.rng.get("customer_dish").randrange(len(dishes))]
        cid = self.ids.new("C")
        c = {"id": cid, "table_id": free[0]["id"], "dish_id": dish, "state": "waiting",
             "patience_ticks_left": self._patience_max(), "eat_ticks_left": 0,
             "price": self.menu[dish]["price"], "tip": 0, "cooking": False,
             "reserved": dict(self.menu[dish]["recipe"])}
        self.customers.append(c)
        events.append(("customer_arrived", {"customer_id": cid, "table_id": c["table_id"], "dish_id": dish}))

    # --- tương tác ----------------------------------------------------------------------
    def _interact(self, events):
        r = self.t["interact_radius"]
        cands = []
        for s in self.stoves:
            d = math.dist(self.pos, s["pos"])
            if d <= r:
                cands.append((d, 0, s["id"], "stove", s))
        for tb in self.tables:
            d = math.dist(self.pos, tb["pos"])
            if d <= r:
                cands.append((d, 1, tb["id"], "table", tb))
        if not cands:
            return
        cands.sort(key=lambda c: (c[0], c[1], id_key(c[2])))
        _, _, _, kind, obj = cands[0]
        if kind == "stove":
            self._use_stove(obj, events)
        else:
            self._use_table(obj, events)

    def _use_stove(self, s, events):
        if s["state"] == "ready":
            if self.hand is not None and int(self.t["carry_limit"]) <= 1:
                return
            self.hand = s["dish"]
            events.append(("dish_picked", {"stove_id": s["id"], "dish_id": s["dish"]}))
            s.update(state="idle", dish=None, customer_id=None, cook_ticks_left=0, ready_ticks=0)
        elif s["state"] == "idle":
            waiting = [c for c in sort_by_id(self.customers) if c["state"] == "waiting" and not c["cooking"]]
            if not waiting:
                return
            c = waiting[0]
            recipe = self.menu[c["dish_id"]]["recipe"]
            for k, v in recipe.items():
                self.stock[k] = self.stock.get(k, 0) - v
            c["reserved"] = {}
            c["cooking"] = True
            s.update(state="cooking", dish=c["dish_id"], customer_id=c["id"],
                     cook_ticks_left=int(round(self.menu[c["dish_id"]]["cook_s"] * TICK)), ready_ticks=0)
            events.append(("cook_started", {"stove_id": s["id"], "dish_id": c["dish_id"], "customer_id": c["id"]}))

    def _use_table(self, tb, events):
        c = next((c for c in self.customers if c["table_id"] == tb["id"]), None)
        if c is None or c["state"] != "waiting" or self.hand is None or self.hand != c["dish_id"]:
            return
        self.hand = None
        tip = 0
        if c["patience_ticks_left"] >= self.t["tip_min_patience_ratio"] * self._patience_max():
            tip = int(round(c["price"] * self.t["tip_rate"]))
            self._add_reputation(self.t["tip_reputation"])
        c.update(state="eating", tip=tip, eat_ticks_left=int(round(self.t["eat_s"] * TICK)), reserved={})
        self.served_count += 1
        events.append(("served", {"customer_id": c["id"], "table_id": tb["id"], "dish_id": c["dish_id"],
                                  "tip": tip, "reputation": self.reputation}))

    # --- tiện ích ------------------------------------------------------------------------
    def _patience_max(self):
        return int(round(self.t["patience_s"] * TICK))

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
        self.reputation = round(min(hi, max(lo, self.reputation + delta)), 3)

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

