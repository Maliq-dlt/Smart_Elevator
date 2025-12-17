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

# Brake
# BO   = Brake On (lock)
# BOFF = Brake Off
BRAKES = ["BO", "BOFF"]

REQUESTS = ["000", "001", "010", "011", "100", "101", "110", "111"]

# ==================================================
# 2. INPUT (SIGMA)
# ==================================================

INPUTS = [
    # Hall Call (tidak masuk request, hanya buka pintu jika idle di lantai)
    "CU_1", "CU_2",         # Call Up dari lantai 1, 2
    "CD_2", "CD_3",         # Call Down dari lantai 2, 3
    
    # Car Call (masuk request per lift)
    "F1_A", "F2_A", "F3_A", # Request lantai 1/2/3 untuk Lift A
    "F1_B", "F2_B", "F3_B", # Request lantai 1/2/3 untuk Lift B
    
    # Door Control (per lift)
    "O_A", "C_A",           # Open/Close door Lift A
    "O_B", "C_B",           # Open/Close door Lift B
    
    # Load Sensor (per lift)
    "OV_A", "N_A",          # Overload/Normal Lift A
    "OV_B", "N_B",          # Overload/Normal Lift B
    
    # Timer (per lift) - memicu gerak jika ada request
    "T_A", "T_B",
    
    # Error (per lift)
    "ERR_A", "ERR_B",
    
    # Power (global)
    "PON", "POFF",
    
    # Kabel Putus/Kendor (per lift) - aktifkan brake darurat
    "CUT_A", "CUT_B",
    
    # Lift Diperbaiki (per lift) - lepas brake, kembali IS
    "LI_A", "LI_B",
    
    # Disaster (tidak dimodelkan)
    "D", "ND"
]

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
    State tuple: (floor, dir, door, load, svc, pwr, req, brake)
    Output: LAx-Door-Rq-Dir-Load-Service-Power-Brake
    """
    floor, direction, door, load, service, power, request, brake = state
    return f"L{lift_id}{floor}-{door}-{request}-{direction}-{load}-{service}-{power}-{brake}"

def format_global_state(state_a, state_b):
    """Format state global dari kedua lift."""
    return f"{state_a} | {state_b}"

# ==================================================
# 5. VALIDASI STATE
# ==================================================

def is_valid_lift_state(state):
    """
    Cek apakah state lift valid (bukan impossible state).
    Returns True jika valid, False jika impossible.
    """
    floor, direction, door, load, service, power, request, brake = state
    
    # ===== POWER OFF =====
    # Power OFF → Direction harus Idle, Request harus 000, 
    #             Service harus OS, Brake harus BO
    if power == "OFF":
        if direction != "I":    return False
        if request != "000":    return False
        if service != "OS":     return False
        if brake != "BO":       return False
    
    # ===== SERVICE OS =====
    # Service OS → Direction harus Idle, Request harus 000, Brake harus BO
    if service == "OS":
        if direction != "I":    return False
        if request != "000":    return False
        if brake != "BO":       return False
    
    # ===== BRAKE BO =====
    # Brake BO → Direction harus Idle, Request harus 000, Service harus OS
    if brake == "BO":
        if direction != "I":    return False
        if request != "000":    return False
        if service != "OS":     return False
    
    # ===== DOOR OPEN =====
    # Door Open → Direction harus Idle
    if door == "O" and direction != "I":
        return False
    
    # ===== LOAD OVERLOAD =====
    # Load Overload → Direction harus Idle
    if load == "V" and direction != "I":
        return False
    
    # ===== DIRECTION BOUNDS =====
    # Direction Up → Tidak boleh di lantai tertinggi
    if direction == "U" and floor >= max(FLOORS):
        return False
    # Direction Down → Tidak boleh di lantai terendah
    if direction == "D" and floor <= min(FLOORS):
        return False

    return True

# ==================================================
# 6. GENERATE STATE LIFT
# ==================================================

def generate_all_lift_states():
    """Generate semua kombinasi state lift yang valid."""
    all_states = itertools.product(
        FLOORS, DIRECTIONS, DOORS,
        LOADS, SERVICE, POWER, REQUESTS, BRAKES
    )
    return [s for s in all_states if is_valid_lift_state(s)]

# ==================================================
# 7. TRANSISI SATU LIFT
# ==================================================

def compute_next_lift_state(state, inp, lift_id):
    """
    Hitung next state untuk satu lift berdasarkan input.
    
    Parameters:
        state   : tuple (floor, dir, door, load, svc, pwr, req, brake)
        inp     : string input
        lift_id : "A" atau "B"
    
    Returns:
        next_state tuple atau None jika transisi invalid
    """
    floor, direction, door, load, service, power, request, brake = state

    # -------------------------
    # CUT_A / CUT_B: Kabel kendor/putus
    # Efek: Brake → BO, Dir → I, Rq → 000, Service → OS
    # Power/Door/Load/Floor tetap
    # -------------------------
    if inp == f"CUT_{lift_id}":
        return (floor, "I", door, load, "OS", power, "000", "BO")

    # -------------------------
    # LI_A / LI_B: Lift diperbaiki
    # Syarat: Power = ON
    # Efek (jika sedang rusak/OS): Brake → BOFF, Service → IS, Req → 000, Dir → I
    # Catatan: jika sudah In Service, LI tidak mengubah state (no-op)
    # -------------------------
    if inp == f"LI_{lift_id}":
        if power != "ON":
            return None  # Tidak bisa perbaiki tanpa power

        # Jika sudah In Service, tidak ada perubahan
        if service == "IS":
            return state

        # Jika masih Out of Service (umumnya OS + BO), lakukan perbaikan
        return (floor, "I", door, load, "IS", "ON", "000", "BOFF")

    # -------------------------
    # POFF: Power Off (global)
    # Efek: Dir → I, Service → OS, Req → 000, Brake → BO
    # -------------------------
    if inp == "POFF":
        return (floor, "I", door, load, "OS", "OFF", "000", "BO")

    # -------------------------
    # Power OFF → Hanya PON yang valid
    # -------------------------
    if power == "OFF":
        if inp == "PON":
            # Power ON kembali, tetap OS + Brake BO sampai LI
            return (floor, "I", door, load, "OS", "ON", "000", "BO")
        return None  # Semua input lain invalid saat Power OFF

    # -------------------------
    # BRAKE BO: Input operasional INVALID
    # BO → CU/CD/F1/F2/F3/O/C/T semua invalid
    # -------------------------
    if brake == "BO":
        # Hall calls
        if inp.startswith("CU_") or inp.startswith("CD_"):
            return None
        # Car calls
        if inp.startswith("F") and inp.endswith(f"_{lift_id}"):
            return None
        # Door control
        if inp in (f"O_{lift_id}", f"C_{lift_id}"):
            return None
        # Timer
        if inp == f"T_{lift_id}":
            return None

        # ERR tetap bisa diterima (sudah OS)
        if inp == f"ERR_{lift_id}":
            return (floor, "I", door, load, "OS", power, "000", "BO")
        # Load sensor masih bisa
        if inp == f"OV_{lift_id}":
            return (floor, "I", door, "V", "OS", power, "000", "BO")
        if inp == f"N_{lift_id}":
            return (floor, "I", door, "N", "OS", power, "000", "BO")
        return None

    # -------------------------
    # SERVICE OS: Semua input invalid
    # (OS selalu Brake BO, jadi kasus ini jarang terpanggil)
    # -------------------------
    if service == "OS":
        return None

    # -------------------------
    # ERROR → langsung OS + Brake BO
    # -------------------------
    if inp == f"ERR_{lift_id}":
        return (floor, "I", door, load, "OS", power, "000", "BO")

    # -------------------------
    # LOAD = Overload: Lift tidak boleh bergerak
    # -------------------------
    if load == "V":
        # Timer tidak boleh memicu gerak saat Overload
        if inp == f"T_{lift_id}":
            return None
        # Car call masih bisa diterima (menambah request)
        if inp.startswith("F") and inp.endswith(f"_{lift_id}"):
            target_floor = int(inp.split("_")[0][1:])
            return (floor, "I", door, "V", service, power, set_request_bit(request, target_floor), brake)
        # Door control
        if inp == f"O_{lift_id}" and direction == "I":
            return (floor, "I", "O", "V", service, power, request, brake)
        if inp == f"C_{lift_id}" and direction == "I":
            return (floor, "I", "C", "V", service, power, request, brake)
        # Load change
        if inp == f"N_{lift_id}":
            return (floor, "I", door, "N", service, power, request, brake)
        # Hall call: no-op kecuali memenuhi syarat buka pintu
        if inp.startswith("CU_") or inp.startswith("CD_"):
            call_floor = int(inp.split("_")[1])
            if floor == call_floor and direction == "I" and door == "C" and service == "IS":
                return (floor, "I", "O", "V", service, power, request, brake)
            return state
        return None

    # -------------------------
    # DOOR = Open: Lift tidak boleh pindah lantai
    # -------------------------
    if door == "O":
        # Timer tidak boleh memicu gerak saat pintu terbuka
        if inp == f"T_{lift_id}":
            return None
        # Car call masih bisa
        if inp.startswith("F") and inp.endswith(f"_{lift_id}"):
            target_floor = int(inp.split("_")[0][1:])
            return (floor, "I", "O", load, service, power, set_request_bit(request, target_floor), brake)
        # Door control
        if inp == f"C_{lift_id}" and direction == "I":
            return (floor, "I", "C", load, service, power, request, brake)
        # Load change
        if inp == f"OV_{lift_id}":
            return (floor, "I", "O", "V", service, power, request, brake)
        if inp == f"N_{lift_id}":
            return (floor, "I", "O", "N", service, power, request, brake)
        # Hall call: pintu sudah terbuka → no-op
        if inp.startswith("CU_") or inp.startswith("CD_"):
            return state
        return None

    # -------------------------
    # CAR CALL → SET REQUEST
    # -------------------------
    if inp.startswith("F") and inp.endswith(f"_{lift_id}"):
        target_floor = int(inp.split("_")[0][1:])
        return (floor, direction, door, load, service, power, set_request_bit(request, target_floor), brake)

    # -------------------------
    # HALL CALL (tidak masuk request, hanya buka pintu jika Idle di lantai)
    # -------------------------
    if inp.startswith("CU_") or inp.startswith("CD_"):
        call_floor = int(inp.split("_")[1])
        # Buka pintu jika: di lantai yang sama, Idle, Door Closed, In Service
        if floor == call_floor and direction == "I" and door == "C" and service == "IS":
            return (floor, "I", "O", load, service, power, request, brake)
        # Hall call tidak memicu gerak → no-op
        return state

    # -------------------------
    # TIMER IDLE → PILIH REQUEST TERDEKAT
    # -------------------------
    if inp == f"T_{lift_id}":
        # Syarat Timer valid:
        if direction != "I":      return None  # Harus Idle
        if request == "000":      return state  # Tidak ada request → tidak berubah
        if door == "O":           return None  # Door harus tertutup
        if brake != "BOFF":       return None  # Brake harus Off
        if service != "IS":       return None  # Harus In Service
        if power != "ON":         return None  # Power harus On
        # (Load Overload sudah ditangani di atas)
        
        # Pilih lantai terdekat, tie-break ke bawah
        target = find_nearest_floor(floor, get_active_floors(request))
        if target is None:
            return None
        
        # Jika sudah di lantai request, buka pintu dan hapus bit
        if target == floor:
            new_request = clear_request_bit(request, floor)
            return (floor, "I", "O", load, service, power, new_request, brake)
        
        # Set arah naik
        if target > floor:
            if floor >= max(FLOORS):  # Sudah di lantai tertinggi
                return None
            return (floor, "U", "C", load, service, power, request, brake)
        
        # Set arah turun
        if target < floor:
            if floor <= min(FLOORS):  # Sudah di lantai terendah
                return None
            return (floor, "D", "C", load, service, power, request, brake)
        
        return None

    # -------------------------
    # GERAK LIFT (Direction = U atau D)
    # -------------------------
    if direction == "U":
        # Validasi: Brake BOFF, Service IS, Power ON, Door C
        if brake == "BO":           return None
        if service != "IS":         return None
        if power != "ON":           return None
        if door != "C":             return None
        
        # Naik 1 lantai
        new_floor = floor + 1
        
        # Cek apakah sampai di lantai dengan request
        if request[new_floor - 1] == "1":
            new_request = clear_request_bit(request, new_floor)
            return (new_floor, "I", "O", load, service, power, new_request, brake)
        
        # Jika sampai lantai tertinggi: Idle
        if new_floor >= max(FLOORS):
            return (new_floor, "I", "C", load, service, power, request, brake)
        
        # Lanjut naik
        return (new_floor, "U", "C", load, service, power, request, brake)

    if direction == "D":
        # Validasi: Brake BOFF, Service IS, Power ON, Door C
        if brake == "BO":           return None
        if service != "IS":         return None
        if power != "ON":           return None
        if door != "C":             return None
        
        # Turun 1 lantai
        new_floor = floor - 1
        
        # Cek apakah sampai di lantai dengan request
        if request[new_floor - 1] == "1":
            new_request = clear_request_bit(request, new_floor)
            return (new_floor, "I", "O", load, service, power, new_request, brake)
        
        # Jika sampai lantai terendah: Idle
        if new_floor <= min(FLOORS):
            return (new_floor, "I", "C", load, service, power, request, brake)
        
        # Lanjut turun
        return (new_floor, "D", "C", load, service, power, request, brake)

    # -------------------------
    # DOOR CONTROL (saat Idle)
    # -------------------------
    if inp == f"O_{lift_id}" and direction == "I":
        return (floor, "I", "O", load, service, power, request, brake)

    if inp == f"C_{lift_id}" and direction == "I":
        return (floor, "I", "C", load, service, power, request, brake)

    # -------------------------
    # LOAD SENSOR
    # -------------------------
    if inp == f"OV_{lift_id}":
        if direction != "I":  # Overload hanya valid saat Idle
            return None
        return (floor, "I", door, "V", service, power, request, brake)

    if inp == f"N_{lift_id}":
        return (floor, direction, door, "N", service, power, request, brake)

    # Input tidak dikenali
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
    next_a, next_b = state_a, state_b

    # Input khusus Lift A (berakhiran _A)
    if inp.endswith("_A"):
        next_a = compute_next_lift_state(state_a, inp, "A")
        if next_a is None:
            return None
        if not is_valid_lift_state(next_a):
            return None

    # Input khusus Lift B (berakhiran _B)
    elif inp.endswith("_B"):
        next_b = compute_next_lift_state(state_b, inp, "B")
        if next_b is None:
            return None
        if not is_valid_lift_state(next_b):
            return None

    # Input global (PON, POFF, D, ND, Hall calls CU_*/CD_*)
    else:
        next_a = compute_next_lift_state(state_a, inp, "A")
        next_b = compute_next_lift_state(state_b, inp, "B")
        # Jika salah satu invalid, seluruh transisi invalid
        if next_a is None or next_b is None:
            return None
        if not is_valid_lift_state(next_a) or not is_valid_lift_state(next_b):
            return None

    return (next_a, next_b)

# ==================================================
# 9. GENERATE NST (Next State Table)
# ==================================================

def generate_nst():
    """Generate tabel next state untuk semua kombinasi state × input."""
    lift_states = generate_all_lift_states()
    global_states = list(itertools.product(lift_states, lift_states))

    nst = {}

    for state_a, state_b in global_states:
        # Format current state
        current_state_str = format_global_state(
            format_lift_state("A", state_a),
            format_lift_state("B", state_b)
        )
        nst[current_state_str] = {}

        for inp in INPUTS:
            result = compute_next_global_state(state_a, state_b, inp)
            if result is None:
                nst[current_state_str][inp] = "-"
            else:
                next_a, next_b = result
                next_state_str = format_global_state(
                    format_lift_state("A", next_a),
                    format_lift_state("B", next_b)
                )
                nst[current_state_str][inp] = next_state_str
    return nst

# ==================================================
# 10. EXPORT CSV
# ==================================================

def export_nst_csv(nst, filename="NST.csv"):
    """Export NST ke file CSV."""
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["current_state"] + INPUTS)
        for state, transitions in nst.items():
            row = [state] + [transitions[inp] for inp in INPUTS]
            writer.writerow(row)

def export_transitions_csv(nst, filename="Transitions.csv"):
    """Export relasi transisi valid (tanpa '-') ke file CSV."""
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["current_state", "input", "next_state"])
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
    
    # Generate NST
    nst = generate_nst()
    
    # Export to CSV
    export_nst_csv(nst)
    export_transitions_csv(nst)
    
    # Statistics
    total_states = len(nst)
    total_transitions = sum(1 for s in nst.values() for v in s.values() if v != "-")
    total_invalid = sum(1 for s in nst.values() for v in s.values() if v == "-")
    
    print(f"Total Global States  : {total_states}")
    print(f"Total Valid Transitions: {total_transitions}")
    print(f"Total Invalid ('-')  : {total_invalid}")
    print()
    print("NST.csv dan Transitions.csv berhasil dibuat.")
