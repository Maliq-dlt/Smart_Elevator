"""check_transitions.py

Yang dicek oleh script ini:

1) Validasi format state (parser)
     - Memecah token lift seperti: LA1-Up-C-010-N-IS-PON-BOFF menjadi komponen
         (pos, dir, req, door, load, svc, power, brake).
     - Memecah global state menjadi 2 lift: "<LiftA> | <LiftB>".

2) Validasi state lift (aturan 'impossible state')
     - Request aktif di lantai sendiri tidak boleh.
         Contoh salah: LA1-C-100-N-IS-ON-BOFF  (pos=1 tapi req[0]='1')
     - Jika power OFF (POFF) maka harus Out of Service (OS) dan brake ON (BON).
         Contoh salah: LA2-C-000-N-IS-OFF-BOFF  (POFF tapi masih IS + BOFF)
     - Jika service OS maka brake harus BON.
         Contoh salah: LA3-C-000-N-OS-ON-BOFF
     - Jika brake BON maka req harus "000".
         Contoh salah: LA1-C-010-N-IS-ON-BON

3) Check NST.csv (matrix next-state)
     - Memastikan initial_state dan semua cell next_state (kecuali '-' / kosong)
         berisi state yang valid untuk Lift A dan Lift B.

4) Check Transitions.csv
     - next_state wajib valid (untuk Lift A dan Lift B).
     - Determinisme: untuk pasangan (initial_state, input) harus mengarah ke
         next_state yang sama (tidak boleh ada dua next_state berbeda).
         Contoh salah: dua baris dengan initial_state+input sama tapi next_state beda.
     - Guard G1 untuk input ARR: hanya boleh jika lift boleh bergerak
         (door=C, load=N, svc=IS, power=PON, brake=BOFF).
         Contoh salah: initial_state LA1-O-000-N-IS-ON-BOFF | ... lalu input=ARR.
    - Guard G2 untuk input OPN/CLD/ACLD: hanya boleh jika (svc=IS, power=PON, brake=BOFF).
         Contoh salah: initial_state ...-IS-ON-BON ... lalu input=OPN.
     - Isolasi input *_A / *_B:
         * Jika input diakhiri _A maka state Lift B tidak boleh berubah.
         * Jika input diakhiri _B maka state Lift A tidak boleh berubah.
         Contoh salah: input=REQ_A tapi next_state Lift B berbeda dari initial Lift B.
"""

import csv


############################################################
# UTIL INPUT / NORMALISASI
############################################################

def split_input(input_event: str):
    """Return (base_event, unit) where unit is 'A'/'B'/None."""
    if input_event.endswith("_A"):
        return input_event[:-2], "A"
    if input_event.endswith("_B"):
        return input_event[:-2], "B"
    return input_event, None


def normalize_power(power: str) -> str:
    # Support legacy tokens ON/OFF (if any) and new PON/POFF.
    if power == "ON":
        return "PON"
    if power == "OFF":
        return "POFF"
    return power


def ada_request_di_atas(pos: int, req: str) -> bool:
    for lantai in range(pos + 1, 4):
        if req[lantai - 1] == "1":
            return True
    return False


def ada_request_di_bawah(pos: int, req: str) -> bool:
    for lantai in range(1, pos):
        if req[lantai - 1] == "1":
            return True
    return False


def is_blackout_state(sa, sb) -> bool:
    if sa is None or sb is None:
        return False
    _, dir_a, req_a, _, _, svc_a, power_a, brake_a = sa
    _, dir_b, req_b, _, _, svc_b, power_b, brake_b = sb
    power_a = normalize_power(power_a)
    power_b = normalize_power(power_b)
    return (
        power_a == "POFF" and power_b == "POFF" and
        svc_a == "OS" and svc_b == "OS" and
        brake_a == "BON" and brake_b == "BON" and
        req_a == "000" and req_b == "000" and
        dir_a == "None" and dir_b == "None"
    )

############################################################
# PARSER STATE
############################################################

def parse_lift_state(token):
    # contoh: LA1-Up-C-010-N-IS-PON-BOFF
    try:
        body = token[2:]
        pos, dir, door, req, load, svc, power, brake = body.split("-")
        return (int(pos), dir, req, door, load, svc, power, brake)
    except Exception:
        return None


def parse_global_state(text):
    try:
        a, b = text.split(" | ")
        return parse_lift_state(a), parse_lift_state(b)
    except Exception:
        return None, None


############################################################
# VALIDASI STATE (FINAL)
############################################################

def state_lift_valid(state):
    if state is None:
        return False

    pos, dir, req, door, load, svc, power, brake = state
    power = normalize_power(power)

    if req == "000":
        if dir != "None":
            return False
    else:
        if dir == "None":
            return False
        if dir == "Up" and (not ada_request_di_atas(pos, req)):
            return False
        if dir == "Down" and (not ada_request_di_bawah(pos, req)):
            return False

    # 1. Request aktif di lantai sendiri
    if req[pos - 1] == "1":
        return False

    # 2. POFF → OS + BON
    if power == "POFF":
        if svc != "OS" or brake != "BON":
            return False

    # 3. OS → BON
    if svc == "OS" and brake != "BON":
        return False

    # 4. BON → req harus 000
    if brake == "BON" and req != "000":
        return False

    if brake == "BON" and dir != "None":
        return False

    if load == "V" and door != "O":
        return False

    return True


############################################################
# GUARD TRANSISI (FINAL)
############################################################

def guard_gerak(state):
    _, _, _, door, load, svc, power, brake = state
    power = normalize_power(power)
    return (
        door == "C" and
        load == "N" and
        svc == "IS" and
        power == "PON" and
        brake == "BOFF"
    )


def guard_pintu(state):
    _, _, _, _, _, svc, power, brake = state
    power = normalize_power(power)
    return svc == "IS" and power == "PON" and brake == "BOFF"


############################################################
# CHECK NST.csv (FORMAT MATRIX)
############################################################

def check_nst(filename="NST.csv"):
    impossible = []

    with open(filename, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)

        for row_idx, row in enumerate(reader, start=2):
            # initial_state
            init_state = row[0].strip()
            sa, sb = parse_global_state(init_state)

            if not state_lift_valid(sa):
                impossible.append((row_idx, "initial_state", init_state, "Lift A"))

            if not state_lift_valid(sb):
                impossible.append((row_idx, "initial_state", init_state, "Lift B"))

            # next_state di tiap kolom input
            for col_idx in range(1, len(row)):
                cell = row[col_idx].strip()
                input_name = header[col_idx]

                if cell == "-" or cell == "":
                    continue

                na, nb = parse_global_state(cell)

                if not state_lift_valid(na):
                    impossible.append((row_idx, input_name, cell, "Lift A"))

                if not state_lift_valid(nb):
                    impossible.append((row_idx, input_name, cell, "Lift B"))

    return impossible


############################################################
# CHECK Transitions.csv
############################################################

def check_transitions(filename="Transitions.csv"):
    invalid_states = []
    guard_errors = []
    seen = {}

    with open(filename, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for idx, r in enumerate(reader, start=2):
            init = r["initial_state"]
            inp = r["input"]
            nxt = r["next_state"]

            base_inp, unit = split_input(inp)

            sa, sb = parse_global_state(init)
            na, nb = parse_global_state(nxt)

            # Next state wajib valid
            if not state_lift_valid(na):
                invalid_states.append((idx, init, inp, nxt, "Invalid Lift A"))

            if not state_lift_valid(nb):
                invalid_states.append((idx, init, inp, nxt, "Invalid Lift B"))

            # Determinisme
            key = (init, inp)
            if key in seen and seen[key] != nxt:
                guard_errors.append((idx, init, inp, "Non-deterministic"))
            else:
                seen[key] = nxt

            # Guard ARR
            if base_inp == "ARR":
                if unit == "A" and (not guard_gerak(sa)):
                    guard_errors.append((idx, init, inp, "ARR_A violates G1"))
                if unit == "B" and (not guard_gerak(sb)):
                    guard_errors.append((idx, init, inp, "ARR_B violates G1"))

            # Guard pintu
            if base_inp in ("OPN", "CLD", "ACLD"):
                if unit == "A" and (not guard_pintu(sa)):
                    guard_errors.append((idx, init, inp, f"{base_inp}_A violates G2"))
                if unit == "B" and (not guard_pintu(sb)):
                    guard_errors.append((idx, init, inp, f"{base_inp}_B violates G2"))

            # Isolasi _A / _B
            if inp.endswith("_A") and sb != nb:
                guard_errors.append((idx, init, inp, "Lift B changed by _A"))

            if inp.endswith("_B") and sa != na:
                guard_errors.append((idx, init, inp, "Lift A changed by _B"))

    return invalid_states, guard_errors


############################################################
# MAIN
############################################################

def main():
    print("\n===== CHECK NST.csv =====")
    bad_nst = check_nst()
    if not bad_nst:
        print("NST OK — no impossible states")
    else:
        for e in bad_nst:
            print("IMPOSSIBLE NST:", e)

    print("\n===== CHECK Transitions.csv =====")
    bad_states, bad_trans = check_transitions()

    if not bad_states:
        print("Transitions OK — all next_state valid")
    else:
        for e in bad_states:
            print("INVALID NEXT_STATE:", e)

    if not bad_trans:
        print("Transitions OK — guards & determinism satisfied")
    else:
        for e in bad_trans:
            print("TRANSITION ERROR:", e)

    print("\n===== SUMMARY =====")
    print("Impossible NST states :", len(bad_nst))
    print("Invalid next_state    :", len(bad_states))
    print("Transition violations :", len(bad_trans))


if __name__ == "__main__":
    main()
