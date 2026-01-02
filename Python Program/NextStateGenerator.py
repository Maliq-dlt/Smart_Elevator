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

# Definisi Fungsi
# def set_request(req, lantai):
# Mengatur request di lantai tertentu menjadi aktif (1)
# Contoh: 
# set_request("000", 2) -> "010"

# Kamus Data Lokal
# req : biner 3-bit, misal "101" artinya request di lantai 1 dan 3 aktif (String)
# lantai : integer 1..3 (integer)
def set_request(req, lantai):
    bits = list(req)
    bits[lantai - 1] = "1"
    return "".join(bits)

# Definisi Fungsi
# def clear_request(req, lantai):
# Mengatur request di lantai tertentu menjadi nonaktif (0)
# Contoh:
# clear_request("111", 2) -> "101"

# Kamus Data Lokal
# req : biner 3-bit, misal "101" artinya request di lantai 1 dan 3 aktif (String)
# lantai : integer 1..3 (integer)
def clear_request(req, lantai):
    bits = list(req)
    bits[lantai - 1] = "0"
    return "".join(bits)

# Definisi Fungsi
# def get_lantai_aktif(req):
# Mengambil daftar lantai yang request-nya aktif (bit = 1)
# Contoh:
# get_lantai_aktif("101") -> [1, 3]

# Kamus Data Lokal
# req : biner 3-bit (String)
# hasil : daftar lantai yang aktif (List[int])
def get_lantai_aktif(req):
    hasil = []
    i = 0
    for ch in req:
        if ch == "1":
            hasil.append(i + 1)
        i += 1
    return hasil

# Definisi Fungsi
# def get_lantai_terdekat(sekarang, daftar):
# Mengambil lantai terdekat dari posisi sekarang berdasarkan daftar tujuan
# Jika daftar kosong, mengembalikan None
# Contoh:
# get_lantai_terdekat(2, [1, 3]) -> 1 (atau 3; pada implementasi ini dipilih nilai min dari jarak, tie mengikuti urutan nilai)

# Kamus Data Lokal
# sekarang : posisi lantai saat ini (integer 1..3)
# daftar : daftar lantai kandidat (List[int])
# return : lantai terdekat (int) atau None
def get_lantai_terdekat(sekarang, daftar):
    if not daftar:
        return None
    return min(daftar, key=lambda x: abs(x - sekarang))

## VALIDASI STATE LIFT

# Definisi Fungsi
# def state_lift_valid(state):
# Memvalidasi apakah sebuah state lift memenuhi semua aturan/kendala sistem
# Contoh:
# state_lift_valid((1, "000", "C", "N", "IS", "PON", "BOFF")) -> True
# state_lift_valid((2, "010", "C", "N", "IS", "PON", "BOFF")) -> False  (request lantai 2 masih aktif saat posisi 2)

# Kamus Data Lokal
# state : tuple (posisi, request, pintu, beban, layanan, listrik, rem)
# posisi : integer 1..3
# request : biner 3-bit (String)
# pintu : "O" (Open) atau "C" (Close)
# beban : "N" (Normal) atau "V" (Overload)
# layanan : "IS" (In Service) atau "OS" (Out of Service)
# listrik : "PON" atau "POFF"
# rem : "BOFF" atau "BON"
# return : True jika valid, False jika tidak valid
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

# Definisi Fungsi
# def format_state_lift(lift_id, state):
# Memformat state 1 lift menjadi string keluaran (untuk CSV/visualisasi)
# Contoh:
# format_state_lift("A", (1, "010", "C", "N", "IS", "PON", "BOFF")) -> "LA1-C-010-N-IS-ON-BOFF"

# Kamus Data Lokal
# lift_id : identifier lift ("A" atau "B") (String)
# state : tuple state lift (lihat state_lift_valid)
# return : representasi string state lift
def format_state_lift(lift_id, state):
    posisi, request, pintu, beban, layanan, listrik, rem = state
    if listrik == "PON":
        listrik_out = "ON"
    else:
        listrik_out = "OFF"
    return "L" + lift_id + str(posisi) + "-" + pintu + "-" + request + "-" + beban + "-" + layanan + "-" + listrik_out + "-" + rem

# Definisi Fungsi
# def format_state_global(state_lift_a, state_lift_b):
# Menggabungkan format state lift A dan B menjadi satu string global
# Contoh:
# format_state_global(
#   (1, "000", "C", "N", "IS", "PON", "BOFF"),
#   (3, "001", "O", "N", "IS", "PON", "BOFF")
# ) -> "LA1-C-000-N-IS-ON-BOFF | LB3-O-001-N-IS-ON-BOFF"

# Kamus Data Lokal
# state_lift_a : tuple state lift A
# state_lift_b : tuple state lift B
# return : string state global
def format_state_global(state_lift_a, state_lift_b):
    return format_state_lift("A", state_lift_a) + " | " + format_state_lift("B", state_lift_b)

## SEMUA STATE LIFT

# Definisi Fungsi
# def get_semua_state_lift():
# Menghasilkan semua kombinasi state lift yang valid (berdasarkan state_lift_valid)
# dan mengurutkannya agar stabil untuk pembuatan tabel NST
# Contoh:
# states = get_semua_state_lift()
# len(states) -> jumlah state valid (integer)
# states[0] -> salah satu state valid (tuple)

# Kamus Data Lokal
# hasil : daftar semua state lift valid (List[tuple])
# state : tuple state lift
# rank : fungsi lokal untuk pengurutan state
# return : List[tuple] state lift valid
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

# Definisi Fungsi
# def boleh_gerak(state):
# Mengecek apakah lift boleh bergerak (pintu tertutup, in-service, listrik ON, rem off)
# Contoh:
# boleh_gerak((2, "010", "C", "N", "IS", "PON", "BOFF")) -> True

# Kamus Data Lokal
# state : tuple state lift
# return : True jika boleh bergerak, False jika tidak
def boleh_gerak(state):
    posisi, request, pintu, beban, layanan, listrik, rem = state
    return (
        pintu == "C" and
        layanan == "IS" and
        listrik == "PON" and
        rem == "BOFF"
    )

# Definisi Fungsi
# def boleh_operasi(state):
# Mengecek apakah lift boleh melakukan operasi pintu/request (in-service, listrik ON, rem off)
# Contoh:
# boleh_operasi((1, "000", "O", "N", "IS", "PON", "BOFF")) -> True

# Kamus Data Lokal
# state : tuple state lift
# return : True jika operasi diizinkan, False jika tidak
def boleh_operasi(state):
    layanan = state[4]
    listrik = state[5]
    rem = state[6]
    return layanan == "IS" and listrik == "PON" and rem == "BOFF"

## TRANSISI SATU LIFT

# Definisi Fungsi
# def get_next_state_lift(state, input_event):
# Menghitung next state untuk SATU lift berdasarkan input_event (tanpa dispatcher dua lift)
# Mengembalikan:
# - tuple state baru jika transisi valid
# - None jika input_event tidak valid/ditolak
# - state yang sama (self-loop) untuk kondisi tertentu (misal POFF/OS/BON dengan input yang bukan pemulih)
# Contoh:
# get_next_state_lift((1, "000", "C", "N", "IS", "PON", "BOFF"), "F2") -> (1, "010", "C", "N", "IS", "PON", "BOFF")
# get_next_state_lift((2, "010", "C", "N", "IS", "PON", "BOFF"), "ARR") -> (2, "000", "O", "N", "IS", "PON", "BOFF")
# get_next_state_lift((1, "000", "C", "N", "OS", "PON", "BON"), "OPN") -> (self-loop) state yang sama

# Kamus Data Lokal
# state : tuple state lift (posisi, request, pintu, beban, layanan, listrik, rem)
# input_event : event dasar tanpa suffix lift (misal "F1", "ARR", "OPN", "CLD", "TD", "OV", "N", "ERR", "FIX", "CUT", "SHUT", "START", "CU_1", "CD_3") (String)
# next_state : kandidat state berikutnya (tuple) atau None
# return : tuple state berikutnya, state (self-loop), atau None
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

# Definisi Fungsi
# def split_input(input_event):
# Memecah input event global menjadi (event_dasar, lift_id)
# lift_id bernilai "A"/"B" jika input berakhiran _A/_B, atau None jika event global
# Contoh:
# split_input("ARR_A") -> ("ARR", "A")
# split_input("CU_2") -> ("CU_2", None)

# Kamus Data Lokal
# input_event : string input (misal "ARR_A", "OPN_B", "CU_1")
# return : tuple (dasar, lift_id)
def split_input(input_event):
    if input_event.endswith("_A"):
        return input_event[:-2], "A"
    if input_event.endswith("_B"):
        return input_event[:-2], "B"
    return input_event, None

# Definisi Fungsi
# def eligible(state_lift):
# Mengecek apakah sebuah lift eligible untuk menerima request eksternal (CU/CD) dari dispatcher
# Syarat: in-service, listrik ON, rem off
# Contoh:
# eligible((1, "000", "C", "N", "IS", "PON", "BOFF")) -> True

# Kamus Data Lokal
# state_lift : tuple state lift
# return : True jika eligible, False jika tidak
def eligible(state_lift):
    return (
        state_lift[4] == "IS" and
        state_lift[5] == "PON" and
        state_lift[6] == "BOFF"
    )

# Definisi Fungsi
# def next_state_sistem(state_lift_a, state_lift_b, input):
# Menghitung next state untuk SISTEM dua lift + dispatcher berdasarkan sebuah input
# Aturan ringkas:
# - Input berakhiran _A/_B hanya mempengaruhi lift tersebut
# - Input CU_/CD_ (tanpa suffix) didispatch ke lift yang eligible dan paling dekat
# Mengembalikan tuple (next_state_lift_a, next_state_lift_b) atau None jika transisi ditolak
# Contoh:
# sA = (1, "000", "C", "N", "IS", "PON", "BOFF")
# sB = (3, "000", "C", "N", "IS", "PON", "BOFF")
# next_state_sistem(sA, sB, "OPN_A") -> ((1, "000", "O", "N", "IS", "PON", "BOFF"), sB)
# next_state_sistem(sA, sB, "CU_2") -> ((1, "010", "C", "N", "IS", "PON", "BOFF"), sB)  (dispatcher pilih A karena lebih dekat)

# Kamus Data Lokal
# state_lift_a : tuple state lift A
# state_lift_b : tuple state lift B
# input : string input dari daftar INPUTS (String)
# dasar : event dasar hasil split_input (String)
# lift_id : "A"/"B"/None (String/None)
# eligible_a/b : status eligible untuk dispatcher (boolean)
# posisi_a/b : posisi lift A/B (integer)
# jarak_a/b : jarak lift ke lantai request (integer)
# chosen : pilihan lift oleh dispatcher (List[String])
# next_a/next_b : kandidat state lift A/B setelah transisi
# return : tuple (next_a, next_b) atau None
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
        if (not eligible_a) and (not eligible_b):
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
            else:
                cand = get_next_state_lift(state_lift_b, input)
                if cand is None or (not state_lift_valid(cand)):
                    return False
                next_b = cand
                return True

        if chosen == ["A", "B"]:
            ok_a = apply("A")
            ok_b = apply("B")
            if (not ok_a) and (not ok_b):
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