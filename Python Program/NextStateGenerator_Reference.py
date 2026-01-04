import itertools
import csv

"""
Smart Elevator FSA Generator (2 lift: A dan B, 3 lantai)

Spesifikasi (tanpa state UP/DOWN/IDLE):
- Perpindahan lantai direpresentasikan dengan event ARR.
- Request 3-bit (Rq) adalah pusat logika.
- Impossible initial state wajib difilter saat generate state.

Format state lift:
    L{Lift}{Posisi}-{Rq}-{Door}-{Load}-{Service}-{Power}-{Brake}

Komponen:
- Lift    : A atau B
- Posisi  : 1,2,3
- Rq      : 3-bit (000..111), bit 1/2/3 = lantai 1/2/3
- Door    : O (Open), C (Close)
- Load    : N (Normal), V (Overload)
- Service : IS (Inservice), OS (Out of Service)
- Power   : PON, POFF
- Brake   : BO (Brake On), BOFF (Brake Off)

SIGMA :
    Call dari luar lift:
        CU_1, CU_2, CD_2, CD_3
    Request dari dalam lift:
        F1_A, F2_A, F3_A, F1_B, F2_B, F3_B
    Event lain (dipisah per lift):
        ARR_A/ARR_B, OPN_A/OPN_B, CLD_A/CLD_B, ACLD_A/ACLD_B,
        OV_A/OV_B, N_A/N_B, ERR_A/ERR_B, FIX_A/FIX_B, CUT_A/CUT_B,
        SHUT_A/SHUT_B, START_A/START_B

Output:
- NST.csv: tabel initial_state × input → next_state / "-"
- Transitions.csv: relasi (initial_state, input, next_state) tanpa baris "-"
"""

# ==================================================
# 1. DEFINISI KOMPONEN STATE
# ==================================================

FLOORS = [1, 2, 3]
DOORS = ["O", "C"]
LOADS = ["N", "V"]          # V = Overload
SERVICE = ["IS", "OS"]      # OS = Out of Service
POWER = ["PON", "POFF"]

# Brake
# BON   = Brake On (lock)
# BOFF = Brake Off
BRAKES = ["BON", "BOFF"]

REQUESTS = ["000", "001", "010", "011", "100", "101", "110", "111"]

# ==================================================
# 2. INPUT (SIGMA)
# ==================================================

HALL_CALLS = ["CU_1", "CU_2", "CD_2", "CD_3"]
CAR_CALLS = [
    "F1_A", "F2_A", "F3_A",
    "F1_B", "F2_B", "F3_B",
]

LIFT_EVENTS_BASE = [
    "ARR",
    "OPN", "CLD", "ACLD",
    "OV", "N",
    "ERR", "FIX", "CUT",
    "SHUT", "START",
]
LIFT_EVENTS = [f"{evt}_A" for evt in LIFT_EVENTS_BASE] + [f"{evt}_B" for evt in LIFT_EVENTS_BASE]

INPUTS = HALL_CALLS + CAR_CALLS + LIFT_EVENTS

# ==================================================
# 3. UTILITAS REQUEST
# ==================================================

def set_request_bit(req, floor):
    """Set bit request untuk lantai tertentu."""
    bits = list(req)
    bits[floor - 1] = "1"
    return "".join(bits)

def clear_request_bit(req, floor):
    """Clear bit request untuk lantai tertentu."""
    bits = list(req)
    bits[floor - 1] = "0"
    return "".join(bits)

def get_active_floors(req):
    """Dapatkan list lantai dengan request aktif."""
    return [i + 1 for i, bit in enumerate(req) if bit == "1"]

def find_nearest_floor(current, targets):
    """
    Cari lantai terdekat dari current.
    Tie-break: pilih lantai lebih kecil (ke bawah).
    """
    if not targets:
        return None
    # Sort by (distance, floor) - floor lebih kecil diprioritaskan saat tie
    sorted_targets = sorted(targets, key=lambda t: (abs(t - current), t))
    return sorted_targets[0]

# ==================================================
# 4. FORMAT STATE
# ==================================================

def format_lift_state(lift_id, state):
    """
    Format state lift menjadi string.
    State tuple: (pos, rq, door, load, service, power, brake)
    Output (sesuai spesifikasi):
        L{Lift}{pos}-{Door}-{Rq}-{Load}-{Service}-{Power}-{Brake}

    Contoh:
        LA1-C-001-N-IS-ON-BOFF
    """
    pos, request, door, load, service, power, brake = state
    power_out = "ON" if power == "PON" else "OFF"
    return f"L{lift_id}{pos}-{door}-{request}-{load}-{service}-{power_out}-{brake}"

def format_global_state(state_a, state_b):
    """Format state global dari kedua lift."""
    return f"{state_a} | {state_b}"

# ==================================================
# 5. VALIDASI STATE (IMPOSSIBLE INITIAL STATE)
# ==================================================

def is_valid_lift_state(state):
    """
    Cek apakah state lift valid (bukan impossible state).

    Valid state (sesuai spesifikasi):
    - Power OFF (POFF) -> Service harus OS dan Brake harus BO
    - Service OS -> Brake harus BO
    - Brake BO -> tidak ada request aktif (Rq harus 000)

    Catatan:
    - Door O dengan POFF diperbolehkan (SHUT: Door tetap).
    - Guard/aturan input (mis. ARR) ditangani di level transisi.
    """
    pos, request, door, load, service, power, brake = state

    # Impossible state: request lantai tempat lift berada harus 0
    # (request untuk lantai yang sudah ditempati dianggap tidak mungkin karena akan langsung dilayani).
    if request[pos - 1] == "1":
        return False

    # Power OFF constraint
    if power == "POFF":
        if service != "OS":
            return False
        if brake != "BON":
            return False

    # Service OS constraint
    if service == "OS" and brake != "BON":
        return False

    # Brake ON constraint
    if brake == "BON" and request != "000":
        return False

    return True

# ==================================================
# 6. GENERATE STATE LIFT
# ==================================================

def generate_all_lift_states():
    """Generate semua kombinasi state lift yang valid."""
    all_states = itertools.product(
        FLOORS,
        REQUESTS,
        DOORS,
        LOADS,
        SERVICE,
        POWER,
        BRAKES,
    )
    states = [s for s in all_states if is_valid_lift_state(s)]

    # Urutan state dibuat lebih mudah dibaca: kondisi normal tampil lebih dulu.
    # Priority: Power ON, Service IS, Brake BOFF, Door C, Request 000, lalu posisi.
    def _rank(s):
        pos, request, door, load, service, power, brake = s
        power_rank = 0 if power == "PON" else 1
        service_rank = 0 if service == "IS" else 1
        brake_rank = 0 if brake == "BOFF" else 1
        door_rank = 0 if door == "C" else 1
        request_rank = 0 if request == "000" else 1
        load_rank = 0 if load == "N" else 1
        return (power_rank, service_rank, brake_rank, door_rank, request_rank, load_rank, pos, request)

    states.sort(key=_rank)
    return states

# ==================================================
# 7. TRANSISI SATU LIFT
# ==================================================

def guard_g1(state):
    """G1 = (Door=C) ∧ (Service=IS) ∧ (Power=PON) ∧ (Brake=BOFF)."""
    pos, request, door, load, service, power, brake = state
    return (door == "C") and (service == "IS") and (power == "PON") and (brake == "BOFF")


def guard_g2(state):
    """G2 = (Service=IS) ∧ (Power=PON) ∧ (Brake=BOFF)."""
    pos, request, door, load, service, power, brake = state
    return (service == "IS") and (power == "PON") and (brake == "BOFF")


def _parse_hall_call(inp):
    """Parse hall call (CU_1, CU_2, CD_2, CD_3) -> (direction, floor)."""
    if not (inp.startswith("CU_") or inp.startswith("CD_")):
        return None
    parts = inp.split("_", 1)
    if len(parts) != 2:
        return None
    direction = parts[0]
    try:
        floor = int(parts[1])
    except ValueError:
        return None
    if direction not in ("CU", "CD"):
        return None
    if floor not in FLOORS:
        return None
    return direction, floor


def _split_lift_suffix(inp):
    """
    Split input like 'F2_A' -> ('F2', 'A').
    Returns (base, lift) or (inp, None) if no lift suffix.
    """
    if inp.endswith("_A"):
        return inp[:-2], "A"
    if inp.endswith("_B"):
        return inp[:-2], "B"
    return inp, None

def compute_next_lift_state(state, inp, lift_id):
    """
    Hitung next state untuk satu lift berdasarkan input.
    
    Parameters:
        state   : tuple (pos, rq, door, load, service, power, brake)
        inp     : string input
        lift_id : "A" atau "B" (hanya untuk konsistensi API)
    
    Returns:
        next_state tuple atau None jika transisi invalid
    """
    pos, request, door, load, service, power, brake = state

    # Pastikan initial state valid
    if not is_valid_lift_state(state):
        return None

    # ==================================================
    # ATURAN A: POWER & SERVICE
    # - Jika Power=POFF: semua input self-loop (state tetap), kecuali START.
    # - Jika Service=OS: semua input self-loop, kecuali FIX (hanya valid jika Power=PON).
    # - Jika Brake=BO  : semua input self-loop, kecuali FIX (jika Power=PON) atau START (jika Power=POFF).
    # ==================================================
    if power == "POFF":
        if inp != "START":
            return state
        # START: Power -> PON, tidak otomatis IS (harus LI). Door tetap.
        next_state = (pos, request, door, load, service, "PON", brake)
        return next_state if is_valid_lift_state(next_state) else None

    if service == "OS":
        if inp != "FIX":
            return state
        # FIX: hanya valid jika Power=PON
        next_state = (pos, "000", door, load, "IS", power, "BOFF")
        return next_state if is_valid_lift_state(next_state) else None

    # Brake ON:
    # - Semua input menjadi self-loop (lift terkunci),
    # - kecuali FIX yang me-release brake (butuh Power=PON).
    if brake == "BON":
        if inp == "FIX":
            next_state = (pos, "000", door, load, "IS", power, "BOFF")
            return next_state if is_valid_lift_state(next_state) else None
        return state

    # Overload:
    # - Menolak aksi yang merepresentasikan gerak/penutupan pintu.
    # - Request baru tetap boleh masuk (hall/call & car call).
    if load == "V" and inp in ("ARR", "CLD", "ACLD"):
        return None

    # -------------------------
    # 1) INPUT REQUEST
    # Hall call:
    # - CU_1, CU_2, CD_2, CD_3 -> set bit lantai asal hall call
    # - Jika lift sudah berada di lantai asal: hanya membuka pintu, tidak menambah bit
    # Car call:
    # - F1/F2/F3 (dipanggil via F1_A/F1_B dari global) -> set bit lantai target
    # - Jika lift sudah berada di lantai target: tidak mengubah bit
    # -------------------------
    hall = _parse_hall_call(inp)
    if hall is not None:
        _, hall_floor = hall
        if hall_floor == pos:
            if not guard_g2(state):
                return None
            next_state = (pos, request, "O", load, service, power, brake)
            return next_state if is_valid_lift_state(next_state) else None
        next_state = (pos, set_request_bit(request, hall_floor), door, load, service, power, brake)
        return next_state if is_valid_lift_state(next_state) else None

    if inp in ("F1", "F2", "F3"):
        target_floor = int(inp[1])
        if target_floor == pos:
            return state
        next_state = (pos, set_request_bit(request, target_floor), door, load, service, power, brake)
        return next_state if is_valid_lift_state(next_state) else None

    # -------------------------
    # 2) ARR (ARRIVED)
    # Guard:
    # - G1 terpenuhi
    # - Rq != 000
    # Efek:
    # - Posisi -> nearest requested floor (tie-break ke bawah)
    # - Bit lantai tujuan dihapus
    # - Door -> Open
    # -------------------------
    if inp == "ARR":
        if request == "000":
            return None
        if not guard_g1(state):
            return None

        target = find_nearest_floor(pos, get_active_floors(request))
        if target is None:
            return None

        # ARR: hanya clear bit lantai tujuan (bit lain tetap)
        next_request = clear_request_bit(request, target)
        next_state = (target, next_request, "O", load, service, power, brake)
        return next_state if is_valid_lift_state(next_state) else None

    # -------------------------
    # 3) PINTU
    # OPN : Door -> O
    # CLD : Door -> C
    # ACLD: Door -> C (timer habis)
    # -------------------------
    if inp == "OPN":
        if not guard_g2(state):
            return None
        next_state = (pos, request, "O", load, service, power, brake)
        return next_state if is_valid_lift_state(next_state) else None

    if inp == "ACLD":
        if not guard_g2(state):
            return None
        if door != "O":
            return None
        next_state = (pos, request, "C", load, service, power, brake)
        return next_state if is_valid_lift_state(next_state) else None

    # -------------------------
    # 4) BEBAN
    # OV : Load -> V
    # N  : Load -> N
    # -------------------------
    if inp == "OV":
        next_state = (pos, request, door, "V", service, power, brake)
        return next_state if is_valid_lift_state(next_state) else None

    if inp == "N":
        next_state = (pos, request, door, "N", service, power, brake)
        return next_state if is_valid_lift_state(next_state) else None

    # -------------------------
    # 5) ERROR, POWER, SAFETY
    # CUT:
    # - Brake=BO, Rq=000, Power tetap, Service tetap
    # ERR:
    # - Service=OS, Brake=BO, Rq=000
    # SHUT:
    # - Power=POFF, Service=OS, Brake=BO, Rq=000, Door tetap
    # START:
    # - hanya saat Power=POFF (ditangani di awal)
    # FIX:
    # - hanya saat Service=OS dan Power=PON (ditangani di awal)
    # -------------------------
    if inp == "CUT":
        next_state = (pos, "000", door, load, service, power, "BON")
        return next_state if is_valid_lift_state(next_state) else None

    if inp == "ERR":
        next_state = (pos, "000", door, load, "OS", power, "BON")
        return next_state if is_valid_lift_state(next_state) else None

    if inp == "SHUT":
        next_state = (pos, "000", door, load, "OS", "POFF", "BON")
        return next_state if is_valid_lift_state(next_state) else None

    # START dan FIX untuk kondisi tertentu sudah ditangani di awal,
    # jadi kalau sampai sini untuk START tetap invalid.
    if inp == "START":
        return None

    # FIX untuk kasus normal (Power=PON, Service=IS, Brake=BOFF) tidak mengubah apa-apa.
    if inp == "FIX":
        return state

    return None

# ==================================================
# 8. TRANSISI GLOBAL (DUA LIFT)
# ==================================================

def compute_next_global_state(state_a, state_b, inp):
    """
    Hitung next state global berdasarkan input.
    
    Returns:
        tuple (next_state_a, next_state_b) atau None jika invalid
    """
    base, lift = _split_lift_suffix(inp)

    # Input spesifik lift: hanya mempengaruhi lift terkait
    if lift == "A":
        next_a = compute_next_lift_state(state_a, base, "A")
        if next_a is None or not is_valid_lift_state(next_a):
            return None
        return (next_a, state_b)

    if lift == "B":
        next_b = compute_next_lift_state(state_b, base, "B")
        if next_b is None or not is_valid_lift_state(next_b):
            return None
        return (state_a, next_b)

    # Hall call: dispatcher memilih lift terdekat yang eligible (IS, PON, BOFF).
    # Jika jarak sama:
    # - Bila posisi A dan B sama, keduanya boleh menyimpan request yang sama.
    # - Bila posisi berbeda (mis. 1 dan 3 untuk call di 2), default pilih A (deterministik).
    hall = _parse_hall_call(inp)
    if hall is not None:
        _, hall_floor = hall

        def _eligible(st):
            pos, request, door, load, service, power, brake = st
            return (service == "IS") and (power == "PON") and (brake == "BOFF")

        pos_a = state_a[0]
        pos_b = state_b[0]
        elig_a = _eligible(state_a)
        elig_b = _eligible(state_b)

        # Tidak ada lift yang eligible untuk menerima hall call
        if not elig_a and not elig_b:
            return None

        chosen = []
        if elig_a and elig_b:
            d_a = abs(pos_a - hall_floor)
            d_b = abs(pos_b - hall_floor)
            if d_a < d_b:
                chosen = ["A"]
            elif d_b < d_a:
                chosen = ["B"]
            else:
                if pos_a == pos_b:
                    chosen = ["A", "B"]
                else:
                    chosen = ["A"]
        elif elig_a:
            chosen = ["A"]
        else:
            chosen = ["B"]

        next_a = state_a
        next_b = state_b

        # Apply ke lift yang dipilih; jika gagal dan hanya memilih satu lift,
        # fallback ke lift eligible lainnya (agar lift sebelah tetap bisa).
        def _apply(which):
            nonlocal next_a, next_b
            if which == "A":
                cand = compute_next_lift_state(state_a, inp, "A")
                if cand is None or not is_valid_lift_state(cand):
                    return False
                next_a = cand
                return True
            cand = compute_next_lift_state(state_b, inp, "B")
            if cand is None or not is_valid_lift_state(cand):
                return False
            next_b = cand
            return True

        if chosen == ["A", "B"]:
            ok_a = _apply("A")
            ok_b = _apply("B")
            if not ok_a and not ok_b:
                return None
            return (next_a, next_b)

        # chosen satu lift
        primary = chosen[0]
        if _apply(primary):
            return (next_a, next_b)

        # fallback
        other = "B" if primary == "A" else "A"
        if (other == "A" and elig_a) or (other == "B" and elig_b):
            if _apply(other):
                return (next_a, next_b)

        return None

    # Selain hall call: input global tanpa suffix tidak valid
    return None

# ==================================================
# 9. GENERATE NST (Next State Table)
# ==================================================

def generate_nst():
    """Generate tabel next state untuk semua kombinasi state × input."""
    lift_states = generate_all_lift_states()
    global_states = itertools.product(lift_states, lift_states)

    nst = {}

    for state_a, state_b in global_states:
        # Format initial state
        initial_state_str = format_global_state(
            format_lift_state("A", state_a),
            format_lift_state("B", state_b)
        )
        nst[initial_state_str] = {}

        for inp in INPUTS:
            result = compute_next_global_state(state_a, state_b, inp)
            if result is None:
                nst[initial_state_str][inp] = "-"
            else:
                next_a, next_b = result
                next_state_str = format_global_state(
                    format_lift_state("A", next_a),
                    format_lift_state("B", next_b)
                )
                nst[initial_state_str][inp] = next_state_str
    return nst

# ==================================================
# 10. EXPORT CSV
# ==================================================

def export_nst_csv(nst, filename="NST.csv"):
    """Export NST ke file CSV."""
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["initial_state"] + INPUTS)
        for state, transitions in nst.items():
            row = [state] + [transitions[inp] for inp in INPUTS]
            writer.writerow(row)

def export_transitions_csv(nst, filename="Transitions.csv"):
    """Export relasi transisi valid (tanpa '-') ke file CSV."""
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["initial_state", "input", "next_state"])
        for state, transitions in nst.items():
            for inp, next_state in transitions.items():
                if next_state != "-":
                    writer.writerow([state, inp, next_state])

# ==================================================
# 11. MAIN
# ==================================================

if __name__ == "__main__":
    print("Generating FSA...")
    print()

    # Streaming export (lebih cepat & hemat memory daripada menyimpan dict NST penuh)
    lift_states = generate_all_lift_states()
    global_states = itertools.product(lift_states, lift_states)

    total_states = 0
    total_transitions = 0
    total_invalid = 0

    with open("NST.csv", "w", newline="", encoding="utf-8") as nst_file, open(
        "Transitions.csv", "w", newline="", encoding="utf-8"
    ) as trans_file:
        nst_writer = csv.writer(nst_file)
        trans_writer = csv.writer(trans_file)

        nst_writer.writerow(["initial_state"] + INPUTS)
        trans_writer.writerow(["initial_state", "input", "next_state"])

        for state_a, state_b in global_states:
            total_states += 1

            initial_state_str = format_global_state(
                format_lift_state("A", state_a),
                format_lift_state("B", state_b),
            )

            row = [initial_state_str]
            for inp in INPUTS:
                result = compute_next_global_state(state_a, state_b, inp)
                if result is None:
                    row.append("-")
                    total_invalid += 1
                else:
                    next_a, next_b = result
                    next_state_str = format_global_state(
                        format_lift_state("A", next_a),
                        format_lift_state("B", next_b),
                    )
                    row.append(next_state_str)
                    trans_writer.writerow([initial_state_str, inp, next_state_str])
                    total_transitions += 1

            nst_writer.writerow(row)

    print(f"Total States : {total_states}")
    print(f"Total Transisi Valid : {total_transitions}")
    print(f"Total Transisi Tidak Valid (-) : {total_invalid}")
    print()
    print("NST.csv dan Transitions.csv berhasil dibuat.")