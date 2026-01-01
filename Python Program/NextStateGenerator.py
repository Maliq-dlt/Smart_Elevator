import itertools
import csv

## NOTASI STATE LIFT

LANTAI_LIFT = [1, 2, 3]
STATUS_PINTU = ["O", "C"]
STATUS_BEBAN = ["N", "V"]
STATUS_LAYANAN = ["IS", "OS"]
STATUS_LISTRIK = ["PON", "POFF"]
STATUS_REM = ["BO", "BOFF"]

REQUEST_BINER = [
    "000", "001", "010", "011",
    "100", "101", "110", "111"
]

## INPUT SISTEM

INPUTS = [
    "CU_1", "CU_2", "CD_2", "CD_3",

    "F1_A", "F2_A", "F3_A",
    "F1_B", "F2_B", "F3_B",

    "ARR_A", "OPN_A", "CLD_A", "ACLD_A",
    "OV_A", "N_A",
    "ERR_A", "FIX_A", "CUT_A",
    "SHUT_A", "START_A",

    "ARR_B", "OPN_B", "CLD_B", "ACLD_B",
    "OV_B", "N_B",
    "ERR_B", "FIX_B", "CUT_B",
    "SHUT_B", "START_B",
]

## REQUEST LIFT 

def set_request(req, lantai):
    if lantai == 1:
        return "1" + req[1:]
    if lantai == 2:
        return req[0] + "1" + req[2]
    if lantai == 3:
        return req[:2] + "1"
    return req

def clear_request(req, lantai):
    if lantai == 1:
        return "0" + req[1:]
    if lantai == 2:
        return req[0] + "0" + req[2]
    if lantai == 3:
        return req[:2] + "0"
    return req

def get_lantai_aktif(req):
    hasil = []
    if req[0] == "1":
        hasil.append(1)
    if req[1] == "1":
        hasil.append(2)
    if req[2] == "1":
        hasil.append(3)
    return hasil

def get_lantai_terdekat(sekarang, daftar):
    if not daftar:
        return None

    terdekat = daftar[0]
    jarak = abs(terdekat - sekarang)

    for lantai in daftar:
        if abs(lantai - sekarang) < jarak:
            terdekat = lantai
            jarak = abs(lantai - sekarang)

    return terdekat

## VALIDASI STATE LIFT

def state_lift_valid(state):
    posisi, request, pintu, beban, layanan, listrik, rem = state

    if request[posisi - 1] == "1":
        return False

    if listrik == "POFF":
        if layanan != "OS" or rem != "BO":
            return False

    if layanan == "OS" and rem != "BO":
        return False

    if rem == "BO" and request != "000":
        return False

    return True

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
    return hasil

## TRANSISI SATU LIFT

def boleh_gerak(state):
    pintu = state[2]
    beban = state[3]
    layanan = state[4]
    listrik = state[5]
    rem = state[6]

    return (
        pintu == "C" and
        beban == "N" and
        layanan == "IS" and
        listrik == "PON" and
        rem == "BOFF"
    )

def boleh_operasi(state):
    layanan = state[4]
    listrik = state[5]
    rem = state[6]
    return layanan == "IS" and listrik == "PON" and rem == "BOFF"

def get_next_state_lift(state, input_event):
    posisi, request, pintu, beban, layanan, listrik, rem = state

    if listrik == "POFF":
        if input_event == "START":
            return (posisi, request, pintu, beban, layanan, "PON", rem)
        return state

    if layanan == "OS":
        if input_event == "FIX":
            return (posisi, "000", pintu, beban, "IS", listrik, "BOFF")
        return state

    if rem == "BO":
        if input_event == "FIX":
            return (posisi, "000", pintu, beban, "IS", listrik, "BOFF")
        return state

    if input_event == "F1" or input_event == "F2" or input_event == "F3":
        tujuan = int(input_event[1])
        if tujuan != posisi:
            return (posisi, set_request(request, tujuan), pintu, beban, layanan, listrik, rem)
        return state

    if input_event == "ARR" and boleh_gerak(state) and request != "000":
        daftar = get_lantai_aktif(request)
        tujuan = get_lantai_terdekat(posisi, daftar)
        return (tujuan, clear_request(request, tujuan), "O", beban, layanan, listrik, rem)

    if input_event == "OPN" and boleh_operasi(state):
        return (posisi, request, "O", beban, layanan, listrik, rem)

    if (input_event == "CLD" or input_event == "ACLD") and pintu == "O":
        return (posisi, request, "C", beban, layanan, listrik, rem)

    if input_event == "OV":
        return (posisi, request, pintu, "V", layanan, listrik, rem)

    if input_event == "N":
        return (posisi, request, pintu, "N", layanan, listrik, rem)

    if input_event == "CUT":
        return (posisi, "000", pintu, beban, layanan, listrik, "BO")

    if input_event == "ERR":
        return (posisi, "000", pintu, beban, "OS", listrik, "BO")

    if input_event == "SHUT":
        return (posisi, "000", pintu, beban, "OS", "POFF", "BO")

    return None

## TRANSISI DUA LIFT

def split_input(input_event):
    if input_event.endswith("_A"):
        return input_event[:-2], "A"
    if input_event.endswith("_B"):
        return input_event[:-2], "B"
    return input_event, None

def next_state_sistem(state_a, state_b, input_event):
    dasar, lift = split_input(input_event)

    if lift == "A":
        hasil = get_next_state_lift(state_a, dasar)
        if hasil is None:
            return None
        return (hasil, state_b)

    if lift == "B":
        hasil = get_next_state_lift(state_b, dasar)
        if hasil is None:
            return None
        return (state_a, hasil)

    return None

## PROGRAM UTAMA

def main():
    daftar_state_lift = get_semua_state_lift()
    kombinasi_state = itertools.product(daftar_state_lift, daftar_state_lift)

    total_states = 0
    total_valid = 0
    total_invalid = 0

    file_nst = open("NST.csv", "w", newline="", encoding="utf-8")
    file_transisi = open("Transitions.csv", "w", newline="", encoding="utf-8")

    nst_writer = csv.writer(file_nst)
    transisi_writer = csv.writer(file_transisi)

    nst_writer.writerow(["initial_state"] + INPUTS)
    transisi_writer.writerow(["initial_state", "input", "next_state"])

    for state_a, state_b in kombinasi_state:
        total_states += 1

        initial_state = "LA" + str(state_a[0]) + " | LB" + str(state_b[0])
        row = [initial_state]

        for input_event in INPUTS:
            hasil_transisi = next_state_sistem(state_a, state_b, input_event)

            if hasil_transisi is None:
                row.append("-")
                total_invalid += 1
            else:
                next_a, next_b = hasil_transisi
                next_state = "LA" + str(next_a[0]) + " | LB" + str(next_b[0])
                row.append(next_state)
                transisi_writer.writerow([initial_state, input_event, next_state])
                total_valid += 1

        nst_writer.writerow(row)

    file_nst.close()
    file_transisi.close()

    print("NST.csv dan Transitions.csv berhasil dibuat")
    print("Total States:", total_states)
    print("Total Transisi Valid:", total_valid)
    print("Total Transisi Tidak Valid:", total_invalid)

if __name__ == "__main__":
    main()
