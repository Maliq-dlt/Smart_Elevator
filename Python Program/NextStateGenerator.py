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

## INPUT / EVENT SISTEM

INPUTS = [
    # Call dari luar lift
    "CU_1", "CU_2", "CD_2", "CD_3",

    # Tombol dalam lift A (single input)
    "F1_A", "F2_A", "F3_A",
    # Tombol dalam lift A (multiple input)
    "F1+F2_A", "F1+F3_A", "F2+F3_A", "F1+F2+F3_A",

    # Tombol dalam lift B (single input)
    "F1_B", "F2_B", "F3_B",
    # Tombol dalam lift B (multiple input)
    "F1+F2_B", "F1+F3_B", "F2+F3_B", "F1+F2+F3_B",

    # Event pintu & gerak Lift A
    "ARR_A", "OPN_A", "CLD_A", "ACLD_A",
    # Event beban & kerusakan Lift A
    "OV_A", "N_A",
    "ERR_A", "FIX_A", "CUT_A",
    # Event listrik per lift A
    "SHUT_A", "START_A",

    # Event pintu & gerak Lift B
    "ARR_B", "OPN_B", "CLD_B", "ACLD_B",
    # Event beban & kerusakan Lift B
    "OV_B", "N_B",
    "ERR_B", "FIX_B", "CUT_B",
    # Event listrik per lift B
    "SHUT_B", "START_B",

    # Event listrik global (2 lift sekaligus)
    "BLACKOUT", "POWERED",
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
# Mengambil lantai terdekat dari posisi sekarang berinput_dasarkan daftar tujuan
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
    
    if beban == "V" and pintu != "O":
        return False

    return True

# Definisi Fungsi
# def format_state_lift(lift_unit, state):
# Memformat state 1 lift menjadi string keluaran (untuk CSV/visualisasi)
# Contoh:
# format_state_lift("A", (1, "010", "C", "N", "IS", "PON", "BOFF")) -> "LA1-C-010-N-IS-ON-BOFF"

# Kamus Data Lokal
# lift_unit : identifier lift ("A" atau "B") (String)
# state : tuple state lift (lihat state_lift_valid)
# return : representasi string state lift
def format_state_lift(lift_unit, state):
    posisi, request, pintu, beban, layanan, listrik, rem = state
    return "L" + lift_unit + str(posisi) + "-" + pintu + "-" + request + "-" + beban + "-" + layanan + "-" + listrik + "-" + rem

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
# Menghasilkan semua kombinasi state lift yang valid (berinput_dasarkan state_lift_valid)
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
# Menghitung next state untuk SATU lift berinput_dasarkan input_event (tanpa dispatcher dua lift)
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
# input_event : event input_dasar tanpa suffix lift (misal "F1", "ARR", "OPN", "CLD", "ACLD", "OV", "N", "ERR", "FIX", "CUT", "SHUT", "START", "CU_1", "CD_3", "F1+F2", "F1+F3", "F2+F3", "F1+F2+F3") (String)
# next_state : kandidat state berikutnya (tuple) atau None
# return : tuple state berikutnya, state (self-loop), atau None
def get_next_state_lift(state, input_event):
    posisi, request, pintu, beban, layanan, listrik, rem = state

    if not state_lift_valid(state):
        return None

    if listrik == "POFF":
        if input_event != "START":
            return state
        next_state = (posisi, "000", pintu, beban, "IS", "PON", "BOFF")
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

    if beban == "V" and input_event in ("ARR", "CLD", "ACLD"):
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

    if "+" in input_event and input_event.startswith("F"):
        parts = input_event.split("+")
        lantai_list = []
        for p in parts:
            if p.startswith("F") and len(p) == 2 and p[1].isdigit():
                lantai_list.append(int(p[1]))
        
        if not lantai_list:
            return None
        
        new_request = request
        for tujuan in lantai_list:
            if tujuan != posisi:
                new_request = set_request(new_request, tujuan)
        
        next_state = (posisi, new_request, pintu, beban, layanan, listrik, rem)
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
        target = get_lantai_terdekat(posisi, daftar)
        if target is None:
            return None

        if target > posisi:
            next_pos = posisi + 1
        elif target < posisi:
            next_pos = posisi - 1
        else:
            return None

        if next_pos == target:
            next_state = (next_pos, clear_request(request, next_pos), "O", beban, layanan, listrik, rem)
        else:
            next_state = (next_pos, request, "C", beban, layanan, listrik, rem)

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

    if input_event == "ACLD":
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
# Memecah input event global menjadi (event_input_dasar, lift_unit)
# lift_unit bernilai "A"/"B" jika input berakhiran _A/_B, atau None jika event global
# Contoh:
# split_input("ARR_A") -> ("ARR", "A")
# split_input("CU_2") -> ("CU_2", None)

# Kamus Data Lokal
# input_event : string input (misal "ARR_A", "OPN_B", "CU_1")
# return : tuple (input_dasar, lift_unit)
def split_input(input_event):
    if input_event.endswith("_A"):
        return input_event[:-2], "A"
    if input_event.endswith("_B"):
        return input_event[:-2], "B"
    return input_event, None

# Definisi Fungsi
# def kondisi_lift_aman(state_lift):
# Mengecek apakah sebuah lift kondisi_lift_aman untuk menerima request eksternal (CU/CD) dari dispatcher
# Syarat: in-service, listrik ON, rem off, tidak dalam kondisi error/cut
# Contoh:
# kondisi_lift_aman((1, "000", "C", "N", "IS", "PON", "BOFF")) -> True

# Kamus Data Lokal
# state_lift : tuple state lift
# return : True jika kondisi_aman, False jika tidak
def kondisi_lift_aman(state_lift):
    posisi, request, pintu, beban, layanan, listrik, rem = state_lift
    return (
        layanan == "IS" and
        listrik == "PON" and
        rem == "BOFF"
    )

# Definisi Fungsi
# def next_state_sistem(state_lift_a, state_lift_b, input):
# Menghitung next state untuk SISTEM dua lift + dispatcher berinput_dasarkan sebuah input
# Aturan ringkas:
# - Input berakhiran _A/_B hanya mempengaruhi lift tersebut
# - Input CU_/CD_ (tanpa suffix) didispatch ke lift yang kondisi_lift_aman dan paling dekat
# - Input BLACKOUT mempengaruhi kedua lift (power off, brake on)
# - Input POWERED mempengaruhi kedua lift (power on, brake off)
# Mengembalikan tuple (next_state_lift_a, next_state_lift_b) atau None jika transisi ditolak
# Contoh:
# sA = (1, "000", "C", "N", "IS", "PON", "BOFF")
# sB = (3, "000", "C", "N", "IS", "PON", "BOFF")
# next_state_sistem(sA, sB, "OPN_A") -> ((1, "000", "O", "N", "IS", "PON", "BOFF"), sB)
# next_state_sistem(sA, sB, "CU_2") -> ((1, "010", "C", "N", "IS", "PON", "BOFF"), sB)  (dispatcher pilih A karena lebih dekat)
# next_state_sistem(sA, sB, "BLACKOUT") -> ((1, "000", "C", "N", "OS", "POFF", "BON"), (3, "000", "C", "N", "OS", "POFF", "BON"))

# Kamus Data Lokal
# state_lift_a : tuple state lift A
# state_lift_b : tuple state lift B
# input : string input dari daftar INPUTS (String)
# input_dasar : event input_dasar hasil split_input (String)
# lift_unit : "A"/"B"/None (String/None)
# kondisi_lift_aman_a/b : status kondisi_lift_aman untuk dispatcher (boolean)
# posisi_a/b : posisi lift A/B (integer)
# jarak_a/b : jarak lift ke lantai request (integer)
# chosen : pilihan lift oleh dispatcher (List[String])
# next_a/next_b : kandidat state lift A/B setelah transisi
# return : tuple (next_a, next_b) atau None
def next_state_sistem(state_lift_a, state_lift_b, input):
    input_dasar, lift_unit = split_input(input)

    if input == "BLACKOUT":
        posisi_a, request_a, pintu_a, beban_a, layanan_a, listrik_a, rem_a = state_lift_a
        posisi_b, request_b, pintu_b, beban_b, layanan_b, listrik_b, rem_b = state_lift_b
        
        # Kedua lift: Power OFF, Brake ON, Request reset, Service OS
        next_a = (posisi_a, "000", pintu_a, beban_a, "OS", "POFF", "BON")
        next_b = (posisi_b, "000", pintu_b, beban_b, "OS", "POFF", "BON")
        
        if state_lift_valid(next_a) and state_lift_valid(next_b):
            return (next_a, next_b)
        return None

    if input == "POWERED":
        posisi_a, request_a, pintu_a, beban_a, layanan_a, listrik_a, rem_a = state_lift_a
        posisi_b, request_b, pintu_b, beban_b, layanan_b, listrik_b, rem_b = state_lift_b
        
        # Hanya bisa POWERED jika kedua lift sedang POFF
        if listrik_a != "POFF" or listrik_b != "POFF":
            return None
        
        # Kedua lift: Power ON, Brake OFF, Request reset, Service IS
        next_a = (posisi_a, "000", pintu_a, beban_a, "IS", "PON", "BOFF")
        next_b = (posisi_b, "000", pintu_b, beban_b, "IS", "PON", "BOFF")
        
        if state_lift_valid(next_a) and state_lift_valid(next_b):
            return (next_a, next_b)
        return None

    if lift_unit == "A":
        next_state_lift_a = get_next_state_lift(state_lift_a, input_dasar)
        if next_state_lift_a is None:
            return None
        return (next_state_lift_a, state_lift_b)

    if lift_unit == "B":
        next_state_lift_b = get_next_state_lift(state_lift_b, input_dasar)
        if next_state_lift_b is None:
            return None
        return (state_lift_a, next_state_lift_b)

    if input.startswith("CU_") or input.startswith("CD_"):
        lantai = int(input.split("_")[1])

        kondisi_lift_aman_a = kondisi_lift_aman(state_lift_a)
        kondisi_lift_aman_b = kondisi_lift_aman(state_lift_b)
        
        # Jika tidak ada lift yang aman, tolak
        if (not kondisi_lift_aman_a) and (not kondisi_lift_aman_b):
            return None

        posisi_a = state_lift_a[0]
        posisi_b = state_lift_b[0]
        jarak_a = abs(posisi_a - lantai)
        jarak_b = abs(posisi_b - lantai)

        # 1) Jika hanya satu lift aktif → lift itu yang melayani
        # 2) Jika dua lift aktif → pilih yang jaraknya paling dekat
        # 3) Jika jaraknya sama → pilih Lift A sebagai default
        # 4) Jika kedua lift di lantai yang sama → pilih Lift A
        
        chosen = []
        if kondisi_lift_aman_a and kondisi_lift_aman_b:
            # Kedua lift aktif
            if posisi_a == posisi_b:
                # Aturan 4: Jika kedua lift di lantai sama → Lift A
                chosen = ["A"]
            elif jarak_a < jarak_b:
                # Lift A lebih dekat
                chosen = ["A"]
            elif jarak_b < jarak_a:
                # Lift B lebih dekat
                chosen = ["B"]
            else:
                # Aturan 3: Jarak sama → Lift A default
                chosen = ["A"]
        elif kondisi_lift_aman_a:
            # Aturan 1: Hanya Lift A yang aktif
            chosen = ["A"]
        else:
            # Aturan 1: Hanya Lift B yang aktif
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

        # Coba apply ke lift yang dipilih
        primary = chosen[0]
        if apply(primary):
            return (next_a, next_b)

        # Jika gagal, coba lift lainnya (fallback)
        other = "B" if primary == "A" else "A"
        if (other == "A" and kondisi_lift_aman_a) or (other == "B" and kondisi_lift_aman_b):
            if apply(other):
                return (next_a, next_b)

        return None

    return None

## PROGRAM UTAMA

def main():
    print("Generating FSA...")
    
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

    # Convert to list for counting
    kombinasi_list = list(itertools.product(daftar_state_lift, daftar_state_lift))

    for state_lift_a, state_lift_b in kombinasi_list:
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
    
    print("Total Global States   : " + str(total_states))
    print("Total Valid Transitions: " + str(total_transisi_valid))
    print("Total Invalid ('-')   : " + str(total_transisi_tidak_valid))
    print("NST.csv dan Transitions.csv berhasil dibuat.")

if __name__ == "__main__":
    main()