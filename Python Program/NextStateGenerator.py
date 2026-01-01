import itertools
import csv

## NOTASI STATE LIFT

LANTAI_LIFT = [1, 2, 3]
STATUS_PINTU = ["O", "C"]
STATUS_BEBAN = ["N", "V"]
STATUS_LAYANAN = ["IS", "OS"]
STATUS_LISTRIK = ["PON", "POFF"]
STATUS_REM = ["BON", "BOFF"]

REQUEST_BINER = [
    "000", "001", "010", "011",
    "100", "101", "110", "111"
]

## INPUT SISTEM

INPUTS = [
    "CU_1", "CU_2", "CD_2", "CD_3",

    "F1_A", "F2_A", "F3_A",
    "F1_B", "F2_B", "F3_B",

    "ARR_A", "OPN_A", "CLD_A", "TD_A",
    "OV_A", "N_A",
    "ERR_A", "FIX_A", "CUT_A",
    "SHUT_A", "START_A",

    "ARR_B", "OPN_B", "CLD_B", "TD_B",
    "OV_B", "N_B",
    "ERR_B", "FIX_B", "CUT_B",
    "SHUT_B", "START_B",
]

## REQUEST LIFT

def set_request(req, lantai):
    bits = list(req)
    bits[lantai - 1] = "1"
    return "".join(bits)

def clear_request(req, lantai):
    bits = list(req)
    bits[lantai - 1] = "0"
    return "".join(bits)

def get_lantai_aktif(req):
    hasil = []
    for i in range(3):
        if req[i] == "1":
            hasil.append(i + 1)
    return hasil

def get_lantai_terdekat(sekarang, daftar):
    if not daftar:
        return None
    return sorted(daftar, key=lambda x: (abs(x - sekarang), x))[0]

## VALIDASI STATE LIFT

def state_lift_valid(state):
    posisi, request, pintu, beban, layanan, listrik, rem = state

    if request[posisi - 1] == "1":
        return False

    if listrik == "POFF":
        if layanan != "OS" or rem != "BON":
            return False

    if layanan == "OS" and rem != "BON":
        return False

    if rem == "BON" and request != "000":
        return False

    return True

def format_state_lift(lift_id, state):
    posisi, request, pintu, beban, layanan, listrik, rem = state
    if listrik == "PON":
        listrik_out = "ON"
    else:
        listrik_out = "OFF"
    return "L" + lift_id + str(posisi) + "-" + pintu + "-" + request + "-" + beban + "-" + layanan + "-" + listrik_out + "-" + rem

def format_state_global(state_lift_a, state_lift_b):
    return format_state_lift("A", state_lift_a) + " | " + format_state_lift("B", state_lift_b)

## SEMUA STATE LIFT

def get_semua_state_lift():
    hasil = []
    for state in itertools.product(
        LANTAI_LIFT,
        REQUEST_BINER,
        STATUS_PINTU,
        STATUS_BEBAN,
        STATUS_LAYANAN,
        STATUS_LISTRIK,
        STATUS_REM
    ):
        if state_lift_valid(state):
            hasil.append(state)

    def rank(state):
        posisi, request, pintu, beban, layanan, listrik, rem = state
        listrik_rank = 0 if listrik == "PON" else 1
        layanan_rank = 0 if layanan == "IS" else 1
        rem_rank = 0 if rem == "BOFF" else 1
        pintu_rank = 0 if pintu == "C" else 1
        request_rank = 0 if request == "000" else 1
        beban_rank = 0 if beban == "N" else 1
        return (listrik_rank, layanan_rank, rem_rank, pintu_rank, request_rank, beban_rank, posisi, request)

    hasil.sort(key=rank)
    return hasil

## GUARD

def boleh_gerak(state):
    posisi, request, pintu, beban, layanan, listrik, rem = state
    return (
        pintu == "C" and
        layanan == "IS" and
        listrik == "PON" and
        rem == "BOFF"
    )

def boleh_operasi(state):
    layanan = state[4]
    listrik = state[5]
    rem = state[6]
    return layanan == "IS" and listrik == "PON" and rem == "BOFF"

## TRANSISI SATU LIFT

def get_next_state_lift(state, input_event):
    posisi, request, pintu, beban, layanan, listrik, rem = state

    if not state_lift_valid(state):
        return None

    # ATURAN POWER/SERVICE/BRAKE (self-loop kecuali pemulih yang sah)
    if listrik == "POFF":
        if input_event != "START":
            return state
        next_state = (posisi, request, pintu, beban, layanan, "PON", rem)
        if state_lift_valid(next_state):
            return next_state
        return None

    if layanan == "OS":
        if input_event != "FIX":
            return state
        next_state = (posisi, "000", pintu, beban, "IS", listrik, "BOFF")
        if state_lift_valid(next_state):
            return next_state
        return None

    if rem == "BON":
        if input_event == "FIX":
            next_state = (posisi, "000", pintu, beban, "IS", listrik, "BOFF")
            if state_lift_valid(next_state):
                return next_state
            return None
        return state

    # OVERLOAD: menolak aksi gerak/penutupan pintu
    if beban == "V" and input_event in ("ARR", "CLD", "TD"):
        return None

    if input_event.startswith("CU_") or input_event.startswith("CD_"):
        lantai = int(input_event.split("_")[1])
        if lantai == posisi:
            if boleh_operasi(state):
                next_state = (posisi, request, "O", beban, layanan, listrik, rem)
            else:
                next_state = None
        else:
            next_state = (posisi, set_request(request, lantai), pintu, beban, layanan, listrik, rem)

        if next_state is None:
            return None
        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event in ("F1", "F2", "F3"):
        tujuan = int(input_event[1])
        if tujuan != posisi:
            next_state = (posisi, set_request(request, tujuan), pintu, beban, layanan, listrik, rem)
        else:
            next_state = state

        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event == "ARR":
        if not boleh_gerak(state) or request == "000":
            return None
        daftar = get_lantai_aktif(request)
        tujuan = get_lantai_terdekat(posisi, daftar)
        next_state = (tujuan, clear_request(request, tujuan), "O", beban, layanan, listrik, rem)
        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event == "OPN":
        if boleh_operasi(state):
            next_state = (posisi, request, "O", beban, layanan, listrik, rem)
        else:
            next_state = None

        if next_state is None:
            return None
        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event == "CLD":
        if boleh_operasi(state) and pintu == "O":
            next_state = (posisi, request, "C", beban, layanan, listrik, rem)
        else:
            next_state = None

        if next_state is None:
            return None
        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event == "TD":
        if pintu != "O":
            return None
        next_state = (posisi, request, "C", beban, layanan, listrik, rem)
        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event == "OV":
        next_state = (posisi, request, pintu, "V", layanan, listrik, rem)
        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event == "N":
        next_state = (posisi, request, pintu, "N", layanan, listrik, rem)
        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event == "CUT":
        next_state = (posisi, "000", pintu, beban, layanan, listrik, "BON")
        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event == "ERR":
        next_state = (posisi, "000", pintu, beban, "OS", listrik, "BON")
        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event == "SHUT":
        next_state = (posisi, "000", pintu, beban, "OS", "POFF", "BON")
        if state_lift_valid(next_state):
            return next_state
        return None

    if input_event == "FIX":
        return state

    return None

## TRANSISI DUA LIFT + DISPATCHER

def split_input(input_event):
    if input_event.endswith("_A"):
        return input_event[:-2], "A"
    if input_event.endswith("_B"):
        return input_event[:-2], "B"
    return input_event, None

def eligible(state_lift):
    return (
        state_lift[4] == "IS" and
        state_lift[5] == "PON" and
        state_lift[6] == "BOFF"
    )

def next_state_sistem(state_lift_a, state_lift_b, input):
    dasar, lift_id = split_input(input)

    if lift_id == "A":
        next_state_lift_a = get_next_state_lift(state_lift_a, dasar)
        if next_state_lift_a is None:
            return None
        return (next_state_lift_a, state_lift_b)

    if lift_id == "B":
        next_state_lift_b = get_next_state_lift(state_lift_b, dasar)
        if next_state_lift_b is None:
            return None
        return (state_lift_a, next_state_lift_b)

    if input.startswith("CU_") or input.startswith("CD_"):
        lantai = int(input.split("_")[1])

        eligible_a = eligible(state_lift_a)
        eligible_b = eligible(state_lift_b)

        if not eligible_a and not eligible_b:
            return None

        posisi_a = state_lift_a[0]
        posisi_b = state_lift_b[0]

        jarak_a = abs(posisi_a - lantai)
        jarak_b = abs(posisi_b - lantai)

        chosen = []
        if eligible_a and eligible_b:
            if jarak_a < jarak_b:
                chosen = ["A"]
            elif jarak_b < jarak_a:
                chosen = ["B"]
            else:
                if posisi_a == posisi_b:
                    chosen = ["A", "B"]
                else:
                    chosen = ["A"]
        elif eligible_a:
            chosen = ["A"]
        else:
            chosen = ["B"]

        next_a = state_lift_a
        next_b = state_lift_b

        def apply(which):
            nonlocal next_a, next_b
            if which == "A":
                cand = get_next_state_lift(state_lift_a, input)
                if cand is None or (not state_lift_valid(cand)):
                    return False
                next_a = cand
                return True
            cand = get_next_state_lift(state_lift_b, input)
            if cand is None or (not state_lift_valid(cand)):
                return False
            next_b = cand
            return True

        if chosen == ["A", "B"]:
            ok_a = apply("A")
            ok_b = apply("B")
            if not ok_a and not ok_b:
                return None
            return (next_a, next_b)

        primary = chosen[0]
        if apply(primary):
            return (next_a, next_b)

        other = "B" if primary == "A" else "A"
        if (other == "A" and eligible_a) or (other == "B" and eligible_b):
            if apply(other):
                return (next_a, next_b)

        return None

    return None

## PROGRAM UTAMA

def main():
    daftar_state_lift = get_semua_state_lift()
    kombinasi_state = itertools.product(daftar_state_lift, daftar_state_lift)

    file_nst = open("NST.csv", "w", newline="", encoding="utf-8")
    file_transisi = open("Transitions.csv", "w", newline="", encoding="utf-8")

    nst_writer = csv.writer(file_nst)
    transisi_writer = csv.writer(file_transisi)

    nst_writer.writerow(["initial_state"] + INPUTS)
    transisi_writer.writerow(["initial_state", "input", "next_state"])

    total_states = 0
    total_transisi_valid = 0
    total_transisi_tidak_valid = 0

    for state_lift_a, state_lift_b in kombinasi_state:
        total_states += 1
        initial_state = format_state_global(state_lift_a, state_lift_b)
        row = [initial_state]

        for input_event in INPUTS:
            hasil = next_state_sistem(state_lift_a, state_lift_b, input_event)

            if hasil is None:
                row.append("-")
                total_transisi_tidak_valid += 1
            else:
                next_state_lift_a, next_state_lift_b = hasil
                if (not state_lift_valid(next_state_lift_a)) or (not state_lift_valid(next_state_lift_b)):
                    row.append("-")
                    total_transisi_tidak_valid += 1
                else:
                    next_state = format_state_global(next_state_lift_a, next_state_lift_b)
                    row.append(next_state)
                    transisi_writer.writerow([initial_state, input_event, next_state])
                    total_transisi_valid += 1

        nst_writer.writerow(row)

    file_nst.close()
    file_transisi.close()
    print("NST.csv dan Transitions.csv berhasil dibuat")
    print("Total States : " + str(total_states))
    print("Total Transisi Valid : " + str(total_transisi_valid))
    print("Total Transisi Tidak Valid : " + str(total_transisi_tidak_valid))

if __name__ == "__main__":
    main()
