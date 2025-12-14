import itertools
import csv

# =========================
# 1. DEFINISI KOMPONEN STATE
# =========================

FLOORS = [1, 2, 3]
DIRECTIONS = ["I", "U", "D"]   # Idle, Up, Down
DOORS = ["O", "C"]             # Open, Close
LOADS = ["N", "OV"]            # Normal, Overload
SERVICE = ["IS", "OS"]         # In Service, Out of Service
POWER = ["ON", "OFF"]

# =========================
# 2. INPUT (Σ)
# =========================

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

# =========================
# 3. REPRESENTASI STATE LIFT
# =========================

def lift_state_str(lift, s):
    f, d, door, load, svc, pwr = s
    return f"L{lift}{f}-{d}-{door}-{load}-{svc}-{pwr}"

def global_state_str(sa, sb):
    return f"{sa} | {sb}"

# =========================
# 4. VALIDASI STATE
# =========================

def is_valid_lift_state(s):
    f, d, door, load, svc, pwr = s

    if door == "O" and d != "I":
        return False
    if load == "OV" and d != "I":
        return False
    if pwr == "OFF" and d != "I":
        return False
    if svc == "OS" and d != "I":
        return False

    return True

# =========================
# 5. GENERATE STATE LIFT
# =========================

def generate_lift_states():
    all_states = itertools.product(
        FLOORS, DIRECTIONS, DOORS, LOADS, SERVICE, POWER
    )
    return [s for s in all_states if is_valid_lift_state(s)]

# =========================
# 6. TRANSISI SATU LIFT
# =========================

def next_lift_state(s, inp, lift):
    f, d, door, load, svc, pwr = s

    # Listrik mati
    if inp == "POFF":
        return (f, "I", door, load, svc, "OFF")

    if pwr == "OFF":
        if inp == "PON":
            return (f, d, door, load, svc, "ON")
        return None

    # Error
    if inp == f"ERR_{lift}":
        return (f, "I", door, load, "OS", pwr)

    # Out of service
    if svc == "OS" and inp.startswith("F"):
        return None

    # Timer
    if inp == f"T_{lift}" and d == "I":
        if f > 1:
            return (f, "D", "C", load, svc, pwr)
        return None

    # Bergerak turun
    if d == "D":
        if f > 1:
            return (f - 1, "D" if f > 2 else "I", "C", load, svc, pwr)

    # Pintu
    if inp == f"O_{lift}" and d == "I":
        return (f, d, "O", load, svc, pwr)
    if inp == f"C_{lift}" and d == "I":
        return (f, d, "C", load, svc, pwr)

    # Beban
    if inp == f"OV_{lift}":
        return (f, d, door, "OV", svc, pwr)
    if inp == f"N_{lift}":
        return (f, d, door, "N", svc, pwr)

    # Tombol lantai (hanya jika pintu tertutup)
    if inp == f"F{f}_{lift}":
        return None
    if inp.startswith("F") and door == "C" and d == "I":
        target = int(inp[1])
        if target > f:
            return (f, "U", door, load, svc, pwr)
        if target < f:
            return (f, "D", door, load, svc, pwr)

    return None

# =========================
# 7. TRANSISI GLOBAL
# =========================

def next_global_state(sa, sb, inp):
    na = sa
    nb = sb

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

    return (na, nb)

# =========================
# 8. GENERATE NST
# =========================

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

# =========================
# 9. EXPORT CSV
# =========================

def export_csv_nst(nst, filename="nst.csv"):
    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["current_state"] + INPUTS)
        for state, trans in nst.items():
            writer.writerow([state] + [trans[i] for i in INPUTS])

def export_csv_relation(nst, filename="relations.csv"):
    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["current_state", "input", "next_state"])
        for state, trans in nst.items():
            for inp, nxt in trans.items():
                if nxt != "-":
                    writer.writerow([state, inp, nxt])

# =========================
# 10. MAIN
# =========================

if __name__ == "__main__":
    nst = generate_nst()
    export_csv_nst(nst, "NST.csv")
    export_csv_relation(nst, "Transitions.csv")

    print("Total state:", len(nst))
    print("NST.csv dan Transitions.csv berhasil dibuat.")
