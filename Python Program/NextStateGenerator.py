import itertools
import csv

"""
Smart Elevator FSA Generator (2 lift, 3 lantai)

Kamus data (state komponen per lift)
- Floor (F): 1,2,3
- Direction (D): I = Idle, U = Up, D = Down
- Door (Door): O = Open, C = Closed; pintu hanya O saat Idle
- Load (Load): N = Normal, V = Overload (harus Idle)
- Service (Svc): IS = In Service, OS = Out of Service (harus Idle)
- Power (Pwr): ON/OFF (OFF harus Idle)
- Request (Req): string biner 3-bit, bit ke-1/2/3 = permintaan lantai 1/2/3; hanya car-call yang mengubah

Kode input (SIGMA)
- Hall call: CU_1, CU_2, CD_2, CD_3 (tidak masuk memori request; hanya buka pintu bila Idle di lantai tersebut)
- Car call: F1_A/F2_A/F3_A, F1_B/F2_B/F3_B → set bit request lift terkait
- Door control: O_A/C_A, O_B/C_B (hanya saat Idle)
- Load: OV_*, N_*
- Timer Idle: T_A, T_B (saat Idle dan Req≠000 → pilih arah ke lantai terdekat, tie-break ke bawah)
- Error: ERR_A, ERR_B (langsung OS, req clear)
- Power: PON, POFF (POFF pertahankan door, paksa Idle, req clear; PON nyala tanpa request)
- Disaster: D, ND (tidak dimodelkan, hasil “-”)

Aturan state mustahil
- Door O ⇒ Direction harus I
- Load V ⇒ Direction harus I
- Pwr OFF ⇒ Direction harus I
- Svc OS ⇒ Direction harus I

Perilaku gerak
- Timer dari Idle + Req aktif: set arah U/D dengan door C (tidak teleport)
- Langkah U/D: pintu selalu C; sampai lantai dengan bit aktif → Idle + pintu O + bit lantai itu dihapus
- Guard batas: jika sudah di lantai teratas/terbawah saat U/D, paksa Idle + pintu C (tidak keluar rentang)

Output
- NST.csv: tabel current_state × input → next_state / "-"
- Transitions.csv: relasi (current_state, input, next_state) tanpa baris "-"
"""

# ==================================================
# 1. DEFINISI KOMPONEN STATE
# ==================================================

FLOORS = [1, 2, 3]
DIRECTIONS = ["I", "U", "D"]
DOORS = ["O", "C"]
LOADS = ["N", "V"]          # V = Overload
SERVICE = ["IS", "OS"]      # OS = Out of Service
POWER = ["ON", "OFF"]

REQUESTS = ["000", "001", "010", "011", "100", "101", "110", "111"]

# ==================================================
# 2. INPUT (SIGMA)
# ==================================================

INPUTS = [
    "CU_1", "CU_2", "CD_2", "CD_3",
    "F1_A", "F2_A", "F3_A",
    "F1_B", "F2_B", "F3_B",
    "O_A", "O_B", "C_A", "C_B",
    "OV_A", "OV_B", "N_A", "N_B",
    "T_A", "T_B",
    "ERR_A", "ERR_B",
    "PON", "POFF",
    "D", "ND"
]

# ==================================================
# 3. UTILITAS REQUEST
# ==================================================

def set_request(req, floor):
    req = list(req)
    req[floor - 1] = "1"
    return "".join(req)

def clear_request(req, floor):
    req = list(req)
    req[floor - 1] = "0"
    return "".join(req)

def active_floors(req):
    return [i + 1 for i, b in enumerate(req) if b == "1"]

def nearest_floor(current, targets):
    if not targets:
        return None
    dist = [(abs(t - current), t) for t in targets]
    dist.sort()
    # jika jarak sama → pilih lantai lebih kecil (ke bawah)
    return dist[0][1]

# ==================================================
# 4. FORMAT STATE
# ==================================================

def lift_state_str(lift, s):
    f, d, door, load, svc, pwr, req = s
    return f"L{lift}{f}-{d}-{door}-{load}-{svc}-{pwr}-{req}"

def global_state_str(sa, sb):
    return f"{sa} | {sb}"

# ==================================================
# 5. VALIDASI STATE
# ==================================================

def is_valid_lift_state(s):
    f, d, door, load, svc, pwr, req = s

    if door == "O" and d != "I":
        return False
    if load == "V" and d != "I":
        return False
    if pwr == "OFF" and d != "I":
        return False
    if svc == "OS" and d != "I":
        return False

    return True

# ==================================================
# 6. GENERATE STATE LIFT
# ==================================================

def generate_lift_states():
    all_states = itertools.product(
        FLOORS, DIRECTIONS, DOORS,
        LOADS, SERVICE, POWER, REQUESTS
    )
    return [s for s in all_states if is_valid_lift_state(s)]

# ==================================================
# 7. TRANSISI SATU LIFT
# ==================================================

def next_lift_state(s, inp, lift):
    f, d, door, load, svc, pwr, req = s

    # -------------------------
    # POWER OFF / ON
    # -------------------------
    if inp == "POFF":
        return (f, "I", door, load, svc, "OFF", "000")

    if pwr == "OFF":
        if inp == "PON":
            return (f, d, door, load, svc, "ON", "000")
        return None

    # -------------------------
    # ERROR
    # -------------------------
    if inp == f"ERR_{lift}":
        return (f, "I", door, load, "OS", pwr, "000")

    # -------------------------
    # OUT OF SERVICE
    # -------------------------
    if svc == "OS" and inp.startswith("F"):
        return None

    # -------------------------
    # CAR CALL → SET REQUEST
    # -------------------------
    if inp.startswith("F") and inp.endswith(f"_{lift}"):
        target = int(inp.split("_")[0][1:])
        return (f, d, door, load, svc, pwr, set_request(req, target))

    # -------------------------
    # HALL CALL (TIDAK KE REQUEST)
    # -------------------------
    if inp.startswith("CU_") or inp.startswith("CD_"):
        floor = int(inp.split("_")[1])
        if f == floor and d == "I" and door == "C" and svc == "IS":
            return (f, d, "O", load, svc, pwr, req)
        return None

    # -------------------------
    # TIMER IDLE → PILIH REQUEST TERDEKAT
    # -------------------------
    if inp == f"T_{lift}" and d == "I" and req != "000":
        target = nearest_floor(f, active_floors(req))
        if target > f:
            return (f, "U", "C", load, svc, pwr, req)
        if target < f:
            return (f, "D", "C", load, svc, pwr, req)
        return None

    # -------------------------
    # GERAK LIFT
    # -------------------------
    if d == "U":
        # guard: already at top floor
        if f >= max(FLOORS):
            return (f, "I", "C", load, svc, pwr, req)
        nf = f + 1
        if req[nf - 1] == "1":
            new_req = clear_request(req, nf)
            return (nf, "I", "O", load, svc, pwr, new_req)
        return (nf, "U", "C", load, svc, pwr, req)

    if d == "D":
        # guard: already at bottom floor
        if f <= min(FLOORS):
            return (f, "I", "C", load, svc, pwr, req)
        nf = f - 1
        if req[nf - 1] == "1":
            new_req = clear_request(req, nf)
            return (nf, "I", "O", load, svc, pwr, new_req)
        return (nf, "D", "C", load, svc, pwr, req)

    # -------------------------
    # PINTU
    # -------------------------
    if inp == f"O_{lift}" and d == "I":
        return (f, d, "O", load, svc, pwr, req)

    if inp == f"C_{lift}" and d == "I":
        return (f, d, "C", load, svc, pwr, req)

    # -------------------------
    # BEBAN
    # -------------------------
    if inp == f"OV_{lift}":
        return (f, d, door, "V", svc, pwr, req)

    if inp == f"N_{lift}":
        return (f, d, door, "N", svc, pwr, req)

    return None

# ==================================================
# 8. TRANSISI GLOBAL
# ==================================================

def next_global_state(sa, sb, inp):
    na, nb = sa, sb

    if inp.endswith("_A"):
        na = next_lift_state(sa, inp, "A")
        if na is None:
            return None

    elif inp.endswith("_B"):
        nb = next_lift_state(sb, inp, "B")
        if nb is None:
            return None

    else:
        na = next_lift_state(sa, inp, "A")
        nb = next_lift_state(sb, inp, "B")
        if na is None or nb is None:
            return None

    return na, nb

# ==================================================
# 9. GENERATE NST
# ==================================================

def generate_nst():
    lift_states = generate_lift_states()
    global_states = list(itertools.product(lift_states, lift_states))

    nst = {}

    for sa, sb in global_states:
        state_name = global_state_str(
            lift_state_str("A", sa),
            lift_state_str("B", sb)
        )
        nst[state_name] = {}

        for inp in INPUTS:
            nxt = next_global_state(sa, sb, inp)
            if nxt is None:
                nst[state_name][inp] = "-"
            else:
                na, nb = nxt
                nst[state_name][inp] = global_state_str(
                    lift_state_str("A", na),
                    lift_state_str("B", nb)
                )
    return nst

# ==================================================
# 10. EXPORT CSV
# ==================================================

def export_csv_nst(nst, filename="NST.csv"):
    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["current_state"] + INPUTS)
        for state, trans in nst.items():
            writer.writerow([state] + [trans[i] for i in INPUTS])

def export_csv_relations(nst, filename="Transitions.csv"):
    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["current_state", "input", "next_state"])
        for state, trans in nst.items():
            for inp, nxt in trans.items():
                if nxt != "-":
                    writer.writerow([state, inp, nxt])

# ==================================================
# 11. MAIN
# ==================================================

if __name__ == "__main__":
    nst = generate_nst()
    export_csv_nst(nst)
    export_csv_relations(nst)

    print("Total Global States:", len(nst))
    print("NST.csv dan Transitions.csv berhasil dibuat.")
