# 📋 DOKUMENTASI RESMI SKENARIO SISTEM SMART ELEVATOR

> **Dokumen Teknis Sistem Lift Pintar**  
> Berbasis Finite State Automata (FSA)  
> Sumber Data: `next_state_combined.py`, `NST_Combined.csv`, `Transitions_Combined.csv`

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Struktur State Lift](#2-struktur-state-lift)
3. [Daftar Skenario Event](#3-daftar-skenario-event)
   - [3.1 Operasional Normal](#31-operasional-normal)
   - [3.2 Darurat](#32-darurat)
   - [3.3 Teknis/Industrial](#33-teknisindustrial)
   - [3.4 Recovery & Maintenance](#34-recovery--maintenance)
4. [Validasi State & Transisi](#4-validasi-state--transisi)
5. [Analisis Alasan](#5-analisis-alasan)

---

## 1. Pendahuluan

Dokumen ini mendokumentasikan seluruh skenario/event **valid** yang dapat terjadi pada sistem Smart Elevator FSA. Sistem ini memodelkan **dua lift independen** (Lift A dan Lift B) yang beroperasi di gedung **3 lantai**.

### File Referensi

| File                       | Ukuran  | Deskripsi                                 |
| -------------------------- | ------- | ----------------------------------------- |
| `next_state_combined.py`   | 30 KB   | Kode sumber logika transisi FSA           |
| `NST_Combined.csv`         | 1.15 GB | Next State Table - tabel transisi lengkap |
| `Transitions_Combined.csv` | 2.68 GB | Daftar semua transisi valid               |

---

## 2. Struktur State Lift

### 2.1 Format State

Setiap lift memiliki state dalam format **tuple 8 komponen**:

```python
(fsa_state, posisi, request, pintu, beban, layanan, listrik, rem)
```

### 2.2 Komponen State

| No  | Komponen    | Nilai Mungkin              | Penjelasan                                      |
| --- | ----------- | -------------------------- | ----------------------------------------------- |
| 1   | `fsa_state` | 11 state (lihat tabel 2.3) | Kondisi logis lift saat ini                     |
| 2   | `posisi`    | 1, 2, 3                    | Lantai saat ini                                 |
| 3   | `request`   | "000" s.d. "111"           | Request aktif dalam format biner (lantai 1,2,3) |
| 4   | `pintu`     | O, C                       | Open (terbuka), Close (tertutup)                |
| 5   | `beban`     | N, V                       | Normal, oVerload (kelebihan beban)              |
| 6   | `layanan`   | IS, OS                     | In Service (aktif), Out of Service (nonaktif)   |
| 7   | `listrik`   | PON, POFF                  | Power ON, Power OFF                             |
| 8   | `rem`       | BON, BOFF                  | Brake ON (direm), Brake OFF (bebas)             |

### 2.3 Daftar FSA State

| No  | State                 | Notasi CSV | Penjelasan Awam                             |
| --- | --------------------- | ---------- | ------------------------------------------- |
| 1   | `IDLE`                | `IDLE`     | Lift diam, siap menerima panggilan          |
| 2   | `MOVING`              | `MOVI`     | Lift sedang bergerak ke lantai tujuan       |
| 3   | `EMERGENCY_MODE`      | `EMER`     | Mode darurat gempa - lift turun ke lantai 1 |
| 4   | `BRAKE_ACTIVE`        | `BRAK`     | Rem darurat aktif (kabel putus)             |
| 5   | `DOOR_FORCED_OPEN`    | `DOOR`     | Pintu dipaksa tetap terbuka                 |
| 6   | `PASSENGER_DETECTION` | `PASS`     | Mendeteksi keberadaan penumpang             |
| 7   | `SAFE_HOLD`           | `SAFE`     | Lift menahan di posisi aman                 |
| 8   | `FLOOD_RESTRICTION`   | `FLOO`     | Pembatasan operasi karena banjir            |
| 9   | `FIRE_AVOIDANCE`      | `FIRE`     | Menghindari lantai yang terbakar            |
| 10  | `POWER_BACKUP_MODE`   | `POWE`     | Beroperasi dengan baterai cadangan          |
| 11  | `OUT_OF_SERVICE`      | `OUT_`     | Tidak beroperasi sama sekali                |

### 2.4 Format State di CSV

State di file CSV ditampilkan dalam format ringkas:

```
LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
```

**Pembacaan:**

- `LA1` = Lift A di lantai 1
- `IDLE` = FSA state (4 huruf pertama)
- `000` = Request (tidak ada request aktif)
- `C` = Pintu Close
- `N` = Beban Normal
- `IS` = In Service
- `ON` = Listrik ON
- `BOFF` = Brake OFF

---

## 3. Daftar Skenario Event

### 3.1 Operasional Normal

#### 3.1.1 Panggilan dari Luar Lift (Hall Call)

##### CU_1 - Panggil Naik dari Lantai 1

| Aspek            | Detail                                                                                |
| ---------------- | ------------------------------------------------------------------------------------- |
| **Event**        | `CU_1`                                                                                |
| **Pemicu**       | Penumpang di lantai 1 menekan tombol ▲ (naik)                                         |
| **Kondisi Awal** | Lift dalam keadaan `IDLE` atau `MOVING`, layanan aktif (`IS`)                         |
| **Transisi**     | Jika lift sudah di lantai 1 → buka pintu. Jika tidak → tambah request, mulai bergerak |

**Contoh Transisi dari CSV:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: CU_1
State Akhir: LA1-IDLE-000-O-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
```

**Penjelasan:** Lift A buka pintu (C→O) karena sudah di lantai 1.

**Kode Python (next_state_combined.py, baris 378-388):**

```python
if input_event.startswith("CU_") or input_event.startswith("CD_"):
    lantai = int(input_event.split("_")[1])
    if lantai == posisi:
        if boleh_operasi(state):
            next_state = (fsa_state, posisi, request, "O", beban, layanan, listrik, rem)
            return next_state if state_lift_valid(next_state) else None
        return None
    new_request = set_request(request, lantai)
    new_fsa = "MOVING" if fsa_state == "IDLE" and pintu == "C" else fsa_state
    next_state = (new_fsa, posisi, new_request, pintu, beban, layanan, listrik, rem)
```

> 💡 **Contoh Skenario Nyata:**  
> Anda berdiri di lobi gedung (lantai 1) dan menekan tombol ▲. Lift A yang kebetulan sudah ada di lantai 1 langsung membuka pintunya. Anda masuk dan siap menekan tombol tujuan.

---

##### CU_2 - Panggil Naik dari Lantai 2

| Aspek        | Detail                                               |
| ------------ | ---------------------------------------------------- |
| **Event**    | `CU_2`                                               |
| **Pemicu**   | Penumpang di lantai 2 menekan tombol ▲ (naik)        |
| **Transisi** | Request ke lantai 2 ditambahkan, lift mulai bergerak |

**Contoh Transisi dari CSV:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: CU_2
State Akhir: LA1-MOVI-010-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
```

**Penjelasan:** Lift A berubah dari IDLE→MOVING, request menjadi "010" (lantai 2 aktif).

---

##### CD_2 - Panggil Turun dari Lantai 2

| Aspek        | Detail                                                           |
| ------------ | ---------------------------------------------------------------- |
| **Event**    | `CD_2`                                                           |
| **Pemicu**   | Penumpang di lantai 2 menekan tombol ▼ (turun)                   |
| **Transisi** | Sama seperti CU_2, dispatcher menentukan lift mana yang merespon |

---

##### CD_3 - Panggil Turun dari Lantai 3

| Aspek        | Detail                                         |
| ------------ | ---------------------------------------------- |
| **Event**    | `CD_3`                                         |
| **Pemicu**   | Penumpang di lantai 3 menekan tombol ▼ (turun) |
| **Transisi** | Request ke lantai 3 ditambahkan                |

**Contoh Transisi dari CSV:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: CD_3
State Akhir: LA1-MOVI-001-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
```

**Penjelasan:** Request "001" = aktif di lantai 3 (bit paling kanan).

---

#### 3.1.2 Request dari Dalam Lift (Car Call)

##### F1_A, F2_A, F3_A - Tombol Lantai di Lift A

| Event  | Notasi Python       | Penjelasan                      |
| ------ | ------------------- | ------------------------------- |
| `F1_A` | `"F1"` untuk Lift A | Penumpang tekan tombol lantai 1 |
| `F2_A` | `"F2"` untuk Lift A | Penumpang tekan tombol lantai 2 |
| `F3_A` | `"F3"` untuk Lift A | Penumpang tekan tombol lantai 3 |

**Kode Python (baris 391-398):**

```python
if input_event in ("F1", "F2", "F3"):
    tujuan = int(input_event[1])
    if tujuan == posisi:
        return state  # Self-loop, tidak ada perubahan
    new_request = set_request(request, tujuan)
    new_fsa = "MOVING" if fsa_state == "IDLE" and pintu == "C" else fsa_state
    next_state = (new_fsa, posisi, new_request, pintu, beban, layanan, listrik, rem)
```

**Contoh Transisi:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: F3_A
State Akhir: LA1-MOVI-001-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
```

> 💡 **Contoh Skenario Nyata:**  
> Anda masuk ke Lift A di lantai 1 dan menekan tombol "3". Lampu tombol 3 menyala, request "001" tercatat, dan lift mulai bergerak naik ke lantai 3.

---

##### F1_B, F2_B, F3_B - Tombol Lantai di Lift B

Sama seperti Lift A, tetapi untuk unit Lift B.

**Contoh Transisi:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: F2_B
State Akhir: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-MOVI-010-C-N-IS-ON-BOFF
```

---

#### 3.1.3 Arrival (Sampai di Tujuan)

##### ARR_A, ARR_B - Lift Sampai di Lantai Tujuan

| Aspek        | Detail                                                               |
| ------------ | -------------------------------------------------------------------- |
| **Event**    | `ARR_A`, `ARR_B`                                                     |
| **Pemicu**   | Lift tiba di lantai yang ada dalam request                           |
| **Kondisi**  | Harus ada request aktif (`request != "000"`) dan lift boleh bergerak |
| **Transisi** | Buka pintu, hapus request untuk lantai tersebut                      |

**Kode Python (baris 401-408):**

```python
if input_event == "ARR":
    if not boleh_gerak(state) or request == "000":
        return None  # Tidak valid jika tidak ada tujuan
    aktif = get_lantai_aktif(request)
    tujuan = get_lantai_terdekat(posisi, aktif)
    new_request = clear_request(request, tujuan)
    next_state = ("IDLE", tujuan, new_request, "O", beban, layanan, listrik, rem)
```

> 💡 **Contoh Skenario Nyata:**  
> Lift bergerak dari lantai 1 dengan request "110" (lantai 2 dan 3). Saat sampai di lantai 2, lift berhenti, pintu terbuka, dan request berubah menjadi "100" (tersisa lantai 3). Setelah penumpang keluar/masuk dan pintu tertutup, lift lanjut ke lantai 3.

---

#### 3.1.4 Kontrol Pintu

##### OPN_A, OPN_B - Tombol Buka Pintu

| Aspek        | Detail                                               |
| ------------ | ---------------------------------------------------- |
| **Event**    | `OPN_A`, `OPN_B`                                     |
| **Pemicu**   | Penumpang menekan tombol ◀▶ (buka pintu)             |
| **Kondisi**  | Lift harus dalam keadaan operasional (IS, PON, BOFF) |
| **Transisi** | Pintu berubah dari C→O                               |

**Contoh Transisi:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: OPN_A
State Akhir: LA1-IDLE-000-O-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
```

---

##### CLD_A, CLD_B - Tombol Tutup Pintu (Manual)

| Aspek        | Detail                                         |
| ------------ | ---------------------------------------------- |
| **Event**    | `CLD_A`, `CLD_B`                               |
| **Pemicu**   | Penumpang menekan tombol ▶◀ (tutup pintu)      |
| **Kondisi**  | Pintu harus terbuka (O) dan tidak overload (N) |
| **Transisi** | Pintu berubah O→C, jika ada request → MOVING   |

**Kode Python (baris 417-422):**

```python
if input_event == "CLD":
    if boleh_operasi(state) and pintu == "O" and beban != "V":
        new_fsa = "MOVING" if request != "000" else "IDLE"
        next_state = (new_fsa, posisi, request, "C", beban, layanan, listrik, rem)
        return next_state if state_lift_valid(next_state) else None
    return None
```

---

##### ACLD_A, ACLD_B - Tutup Pintu Otomatis

| Aspek        | Detail                                        |
| ------------ | --------------------------------------------- |
| **Event**    | `ACLD_A`, `ACLD_B`                            |
| **Pemicu**   | Timer auto-close habis (biasanya 5-10 detik)  |
| **Transisi** | Sama seperti CLD, tetapi otomatis oleh sistem |

> 💡 **Contoh Skenario Nyata:**  
> Anda masuk ke lift, menekan tombol lantai 3. Setelah 5 detik tidak ada gerakan, pintu menutup otomatis (ACLD), dan lift mulai bergerak karena request "001" aktif.

---

#### 3.1.5 Kondisi Beban

##### OV_A, OV_B - Overload (Kelebihan Beban)

| Aspek        | Detail                                                     |
| ------------ | ---------------------------------------------------------- |
| **Event**    | `OV_A`, `OV_B`                                             |
| **Pemicu**   | Sensor beban mendeteksi melebihi kapasitas                 |
| **Transisi** | State → `DOOR_FORCED_OPEN`, pintu dipaksa terbuka, beban V |

**Kode Python (baris 432-434):**

```python
if input_event == "OV":
    next_state = ("DOOR_FORCED_OPEN", posisi, request, "O", "V", layanan, listrik, rem)
    return next_state if state_lift_valid(next_state) else None
```

**Contoh Transisi:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: OV_A
State Akhir: LA1-DOOR-000-O-V-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
```

> 💡 **Contoh Skenario Nyata:**  
> Lift A memiliki kapasitas 8 orang. Saat orang ke-10 masuk, alarm berbunyi, lampu overload menyala, dan pintu tidak mau menutup. Beberapa penumpang harus keluar sebelum lift bisa bergerak.

---

##### N_A, N_B - Beban Kembali Normal

| Aspek        | Detail                                             |
| ------------ | -------------------------------------------------- |
| **Event**    | `N_A`, `N_B`                                       |
| **Pemicu**   | Penumpang keluar sehingga beban di bawah kapasitas |
| **Transisi** | Beban berubah V→N                                  |

| **Transisi** | Beban berubah V→N |

---

#### 3.1.6 Request Langsung (RQ Command)

##### RQ_xxx (RQ_000 s.d. RQ_111) - Set Request Biner

| Aspek        | Detail                                                       |
| ------------ | ------------------------------------------------------------ |
| **Event**    | `RQ_000_A` ... `RQ_111_A` (dan Lift B)                       |
| **Pemicu**   | Kontroler pusat mengirim instruksi request spesifik          |
| **Fungsi**   | Mengatur bit request secara langsung (000=kosong, 111=semua) |
| **Transisi** | Mengubah `request` pada state, lift bergerak jika valid      |

**Contoh:**
`RQ_011_A` = Set request Lift A ke lantai 2 dan 3.

**Kode Python:**

```python
if input_event.startswith("RQ_"):
    new_request = input_event[3:]
    # ... validasi request ke lantai saat ini ...
    next_state = (new_fsa, posisi, new_request, pintu, beban, layanan, listrik, rem)
```

> 💡 **Kegunaan:** Digunakan untuk testing atau sinkronisasi state oleh sistem monitoring eksternal.

---

#### 3.1.6 Request Langsung (RQ Command)

##### RQ_xxx (RQ_000 s.d. RQ_111) - Set Request Biner

| Aspek        | Detail                                                       |
| ------------ | ------------------------------------------------------------ |
| **Event**    | `RQ_000_A` ... `RQ_111_A` (dan Lift B)                       |
| **Pemicu**   | Kontroler pusat mengirim instruksi request spesifik          |
| **Fungsi**   | Mengatur bit request secara langsung (000=kosong, 111=semua) |
| **Transisi** | Mengubah `request` pada state, lift bergerak jika valid      |

**Contoh:**
`RQ_011_A` = Set request Lift A ke lantai 2 dan 3.

**Kode Python:**

```python
if input_event.startswith("RQ_"):
    new_request = input_event[3:]
    # ... validasi request ke lantai saat ini ...
    next_state = (new_fsa, posisi, new_request, pintu, beban, layanan, listrik, rem)
```

> 💡 **Kegunaan:** Digunakan untuk testing atau sinkronisasi state oleh sistem monitoring eksternal.

---

### 3.2 Darurat

#### 3.2.1 Gempa Bumi

##### QUAKE_ON - Gempa Terdeteksi

| Aspek        | Detail                                                        |
| ------------ | ------------------------------------------------------------- |
| **Event**    | `QUAKE_ON`                                                    |
| **Pemicu**   | Sensor seismik mendeteksi getaran gempa                       |
| **Dampak**   | SELURUH SISTEM (kedua lift) terpengaruh                       |
| **Transisi** | State → `EMERGENCY_MODE`, layanan OS, rem ON, request dihapus |

**Kode Python (baris 457-459):**

```python
if input_event == "QUAKE_ON":
    next_state = ("EMERGENCY_MODE", posisi, "000", "C", beban, "OS", listrik, "BON")
    return next_state if state_lift_valid(next_state) else None
```

**Contoh Transisi:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: QUAKE_ON
State Akhir: LA1-EMER-000-C-N-OS-ON-BON | LB1-EMER-000-C-N-OS-ON-BON
```

**Alur dari EMERGENCY_MODE (baris 324-329):**

```python
if fsa_state == "EMERGENCY_MODE":
    if posisi > 1:
        # Turun satu lantai
        next_state = ("EMERGENCY_MODE", posisi - 1, "000", "C", beban, "OS", listrik, "BON")
    else:
        # Sudah di lantai 1, buka pintu, nonaktif
        next_state = ("OUT_OF_SERVICE", 1, "000", "O", "N", "OS", listrik, "BON")
```

> 💡 **Contoh Skenario Nyata (Step-by-Step):**
>
> 1. Anda di Lift A lantai 3, sedang naik dari lantai 1
> 2. Tiba-tiba gempa terjadi → `QUAKE_ON`
> 3. Lift berhenti, rem terkunci, semua request dihapus
> 4. State: `EMERGENCY_MODE` di lantai 3
> 5. Lift turun perlahan ke lantai 2 → `EMERGENCY_MODE` di lantai 2
> 6. Lift turun perlahan ke lantai 1 → `EMERGENCY_MODE` di lantai 1
> 7. Pintu terbuka, lift mati → `OUT_OF_SERVICE`
> 8. Anda keluar dengan selamat, menunggu petugas menyatakan aman

---

##### AFTERSHOCK - Gempa Susulan

| Aspek        | Detail                                             |
| ------------ | -------------------------------------------------- |
| **Event**    | `AFTERSHOCK`                                       |
| **Pemicu**   | Sensor seismik mendeteksi gempa susulan            |
| **Transisi** | Sama seperti QUAKE_ON (re-entry ke EMERGENCY_MODE) |

---

##### QUAKE_CLR - Gempa Selesai

| Aspek        | Detail                                               |
| ------------ | ---------------------------------------------------- |
| **Event**    | `QUAKE_CLR`                                          |
| **Pemicu**   | Petugas menyatakan kondisi aman setelah gempa        |
| **Transisi** | Hanya efektif jika lift sudah pulih (memerlukan FIX) |

---

#### 3.2.2 Kabel Putus

##### CABLE_SNAP_A, CABLE_SNAP_B - Kabel Lift Putus

| Aspek         | Detail                                                               |
| ------------- | -------------------------------------------------------------------- |
| **Event**     | `CABLE_SNAP_A`, `CABLE_SNAP_B`                                       |
| **Pemicu**    | Kabel utama lift terputus                                            |
| **Prioritas** | **PRIORITY 1** (paling tinggi)                                       |
| **Transisi**  | Jika di lantai 1 → OUT_OF_SERVICE. Jika di lantai 2/3 → BRAKE_ACTIVE |

**Kode Python (baris 461-466):**

```python
if input_event == "CABLE_SNAP":
    if posisi == 1:
        next_state = ("OUT_OF_SERVICE", 1, "000", "O", "N", "OS", listrik, "BON")
    else:
        next_state = ("BRAKE_ACTIVE", posisi, "000", "C", beban, "OS", listrik, "BON")
    return next_state if state_lift_valid(next_state) else None
```

**Contoh Transisi (di lantai 2):**

```
State Awal: LA2-MOVI-001-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: CABLE_SNAP_A
State Akhir: LA2-BRAK-000-C-N-OS-ON-BON | LB1-IDLE-000-C-N-IS-ON-BOFF
```

> 💡 **Contoh Skenario Nyata (Step-by-Step):**
>
> 1. Anda di Lift A lantai 2, sedang naik ke lantai 3
> 2. Terdengar bunyi keras, kabel utama putus → `CABLE_SNAP_A`
> 3. Rem darurat langsung mengunci → `BRAKE_ACTIVE`
> 4. Lift berhenti mendadak, Anda merasakan hentakan
> 5. Lampu darurat menyala
> 6. Anda menunggu tim penyelamat
> 7. Tim membuka pintu secara manual untuk evakuasi
> 8. State berubah ke `DOOR_FORCED_OPEN` → `OUT_OF_SERVICE`

---

#### 3.2.3 Kebakaran

##### FIRE_L1, FIRE_L2, FIRE_L3 - Kebakaran Terdeteksi

| Aspek        | Detail                                             |
| ------------ | -------------------------------------------------- |
| **Event**    | `FIRE_L1`, `FIRE_L2`, `FIRE_L3`                    |
| **Pemicu**   | Sensor api mendeteksi kebakaran di lantai tertentu |
| **Dampak**   | SELURUH SISTEM terpengaruh                         |
| **Transisi** | State → `FIRE_AVOIDANCE`, layanan OS, rem ON       |

**Contoh Transisi:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: FIRE_L2
State Akhir: LA1-FIRE-000-C-N-OS-ON-BON | LB1-FIRE-000-C-N-OS-ON-BON
```

---

##### SMOKE_DETECTED_L1, L2, L3 - Asap Terdeteksi

| Aspek        | Detail                                                        |
| ------------ | ------------------------------------------------------------- |
| **Event**    | `SMOKE_DETECTED_L1`, `SMOKE_DETECTED_L2`, `SMOKE_DETECTED_L3` |
| **Pemicu**   | Sensor asap mendeteksi asap (bisa jadi tanda awal kebakaran)  |
| **Transisi** | Sama seperti FIRE, masuk mode `FIRE_AVOIDANCE`                |

---

##### FIRE_CLR - Kebakaran Teratasi

| Aspek        | Detail                                              |
| ------------ | --------------------------------------------------- |
| **Event**    | `FIRE_CLR`                                          |
| **Pemicu**   | Petugas pemadam menyatakan api sudah padam          |
| **Transisi** | Dari `FIRE_AVOIDANCE` → `IDLE`, layanan IS, rem OFF |

**Kode Python (baris 362-366):**

```python
if fsa_state == "FIRE_AVOIDANCE":
    if input_event == "FIRE_CLR":
        next_state = ("IDLE", posisi, "000", "C", beban, "IS", listrik, "BOFF")
        return next_state if state_lift_valid(next_state) else None
    return state  # Abaikan input lain
```

---

#### 3.2.4 Banjir

##### FLOOD_ON - Banjir Terdeteksi

| Aspek        | Detail                                          |
| ------------ | ----------------------------------------------- |
| **Event**    | `FLOOD_ON`                                      |
| **Pemicu**   | Sensor air di pit lift mendeteksi genangan      |
| **Transisi** | State → `FLOOD_RESTRICTION`, layanan OS, rem ON |

**Kode Python (baris 472-474):**

```python
if input_event == "FLOOD_ON":
    next_state = ("FLOOD_RESTRICTION", posisi, request, pintu, beban, "OS", listrik, "BON")
    return next_state if state_lift_valid(next_state) else None
```

> 💡 **Contoh Skenario Nyata:**  
> Hujan deras menyebabkan genangan air masuk ke ruang mesin lift di basement. Sensor mendeteksi air → `FLOOD_ON`. Lift tidak akan turun ke lantai 1 untuk menghindari kerusakan mesin. Penumpang yang sudah di dalam lift aman, tetapi tidak bisa ke lantai 1 sampai air surut.

---

##### FLOOD_CLR - Banjir Surut

| Aspek        | Detail                            |
| ------------ | --------------------------------- |
| **Event**    | `FLOOD_CLR`                       |
| **Pemicu**   | Air sudah surut, aman beroperasi  |
| **Transisi** | Dari `FLOOD_RESTRICTION` → `IDLE` |

---

#### 3.2.5 Kondisi Listrik

##### TOTAL_POWER_OFF - Mati Listrik Total

| Aspek        | Detail                                         |
| ------------ | ---------------------------------------------- |
| **Event**    | `TOTAL_POWER_OFF`                              |
| **Pemicu**   | Gangguan gardu induk tanpa backup genset       |
| **Dampak**   | **MATI TOTAL** (Listrik OFF, Backup OFF)       |
| **Transisi** | State → `OUT_OF_SERVICE`, rem ON, listrik POFF |

```python
if input_event == "TOTAL_POWER_OFF":
    next_state = ("OUT_OF_SERVICE", posisi, "000", pintu, beban, "OS", "POFF", "BON")
```

##### POWER_OFF - Listrik Padam (Backup ON)

| Aspek        | Detail                                                        |
| ------------ | ------------------------------------------------------------- |
| **Event**    | `POWER_OFF`                                                   |
| **Pemicu**   | Listrik utama mati, backup baterai aktif                      |
| **Dampak**   | SELURUH SISTEM terpengaruh                                    |
| **Transisi** | State → `POWER_BACKUP_MODE`, listrik POFF, layanan OS, rem ON |

**Kode Python (baris 476-478):**

```python
if input_event == "POWER_OFF":
    next_state = ("POWER_BACKUP_MODE", posisi, "000", pintu, beban, "OS", "POFF", "BON")
    return next_state if state_lift_valid(next_state) else None
```

**Alur dari POWER_BACKUP_MODE (baris 354-359):**

```python
if fsa_state == "POWER_BACKUP_MODE":
    if posisi > 1:
        # Turun satu lantai menggunakan baterai
        next_state = ("POWER_BACKUP_MODE", posisi - 1, "000", "C", beban, "OS", "POFF", "BON")
    else:
        # Sudah di lantai 1
        next_state = ("OUT_OF_SERVICE", 1, "000", "O", "N", "OS", "POFF", "BON")
```

**Contoh Transisi:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: POWER_OFF
State Akhir: LA1-POWE-000-C-N-OS-OFF-BON | LB1-POWE-000-C-N-OS-OFF-BON
```

> 💡 **Contoh Skenario Nyata (Step-by-Step):**
>
> 1. Anda di Lift A lantai 3, hendak turun
> 2. Lampu padam, listrik mati → `POWER_OFF`
> 3. Lampu darurat menyala, lift beralih ke baterai
> 4. State: `POWER_BACKUP_MODE` di lantai 3
> 5. Lift turun perlahan ke lantai 2
> 6. Lift turun perlahan ke lantai 1
> 7. Pintu terbuka, lift mati total → `OUT_OF_SERVICE`
> 8. Anda keluar, menunggu listrik pulih

---

##### POWER_ON - Listrik Pulih

| Aspek        | Detail                                      |
| ------------ | ------------------------------------------- |
| **Event**    | `POWER_ON`                                  |
| **Pemicu**   | Listrik utama kembali menyala               |
| **Transisi** | Hanya efektif setelah teknisi melakukan FIX |

---

#### 3.2.6 Evakuasi Manual

##### MANUAL_EVACUATION - Evakuasi Darurat

| Aspek        | Detail                                                         |
| ------------ | -------------------------------------------------------------- |
| **Event**    | `MANUAL_EVACUATION`                                            |
| **Pemicu**   | Petugas keamanan mengaktifkan mode evakuasi (ancaman bom, dll) |
| **Dampak**   | SELURUH SISTEM langsung ke lantai 1                            |
| **Transisi** | State → `OUT_OF_SERVICE` di lantai 1, pintu terbuka            |

**Kode Python (baris 530-532):**

```python
if input_event == "MANUAL_EVACUATION":
    next_state = ("OUT_OF_SERVICE", 1, "000", "O", "N", "OS", listrik, "BON")
    return next_state if state_lift_valid(next_state) else None
```

**Contoh Transisi:**

```
State Awal: LA3-MOVI-010-C-N-IS-ON-BOFF | LB2-IDLE-000-C-N-IS-ON-BOFF
Event: MANUAL_EVACUATION
State Akhir: LA1-OUT_-000-O-N-OS-ON-BON | LB1-OUT_-000-O-N-OS-ON-BON
```

---

### 3.3 Teknis/Industrial

#### 3.3.1 Gangguan Pintu

##### DOOR_OBSTRUCTED_A, DOOR_OBSTRUCTED_B - Pintu Terhalang

| Aspek        | Detail                                                     |
| ------------ | ---------------------------------------------------------- |
| **Event**    | `DOOR_OBSTRUCTED_A`, `DOOR_OBSTRUCTED_B`                   |
| **Pemicu**   | Sensor pintu mendeteksi ada benda menghalangi saat menutup |
| **Transisi** | State → `DOOR_FORCED_OPEN`, pintu tetap terbuka            |

**Kode Python (baris 484-486):**

```python
if input_event == "DOOR_OBSTRUCTED":
    next_state = ("DOOR_FORCED_OPEN", posisi, request, "O", beban, layanan, listrik, rem)
    return next_state if state_lift_valid(next_state) else None
```

**Contoh Transisi:**

```
State Awal: LA1-IDLE-000-C-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: DOOR_OBSTRUCTED_A
State Akhir: LA1-DOOR-000-O-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
```

> 💡 **Contoh Skenario Nyata:**  
> Anda memasukkan trolley barang ke lift, tapi ujung trolley menyembul keluar. Saat pintu hendak menutup, sensor mendeteksi halangan → `DOOR_OBSTRUCTED_A`. Pintu kembali terbuka dan tidak mau menutup sampai trolley ditarik masuk sepenuhnya.

---

##### DOOR_TIMEOUT_A, DOOR_TIMEOUT_B - Pintu Terlalu Lama Terbuka

| Aspek        | Detail                                                     |
| ------------ | ---------------------------------------------------------- |
| **Event**    | `DOOR_TIMEOUT_A`, `DOOR_TIMEOUT_B`                         |
| **Pemicu**   | Pintu terbuka terlalu lama tanpa aktivitas (misal 2 menit) |
| **Kondisi**  | Pintu harus dalam keadaan terbuka (O)                      |
| **Transisi** | State → `SAFE_HOLD`, lift menahan di posisi aman           |

**Kode Python (baris 490-494):**

```python
if input_event == "DOOR_TIMEOUT":
    if pintu == "O":
        next_state = ("SAFE_HOLD", posisi, "000", "O", beban, layanan, listrik, rem)
        return next_state if state_lift_valid(next_state) else None
    return state  # Tidak ada efek jika pintu sudah tertutup
```

**Contoh Transisi:**

```
State Awal: LA1-IDLE-000-O-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
Event: DOOR_TIMEOUT_A
State Akhir: LA1-SAFE-000-O-N-IS-ON-BOFF | LB1-IDLE-000-C-N-IS-ON-BOFF
```

---

#### 3.3.2 Kerusakan Sensor

##### SENSOR_FAIL_A, SENSOR_FAIL_B - Sensor Umum Rusak

| Aspek        | Detail                                       |
| ------------ | -------------------------------------------- |
| **Event**    | `SENSOR_FAIL_A`, `SENSOR_FAIL_B`             |
| **Pemicu**   | Sensor umum tidak berfungsi dengan benar     |
| **Transisi** | State → `OUT_OF_SERVICE`, rem ON, layanan OS |

**Kode Python (baris 498-500):**

```python
if input_event == "SENSOR_FAIL":
    next_state = ("OUT_OF_SERVICE", posisi, "000", pintu, beban, "OS", listrik, "BON")
    return next_state if state_lift_valid(next_state) else None
```

---

##### WEIGHT_SENSOR_FAIL_A, WEIGHT_SENSOR_FAIL_B - Sensor Beban Rusak

| Aspek        | Detail                                                     |
| ------------ | ---------------------------------------------------------- |
| **Event**    | `WEIGHT_SENSOR_FAIL_A`, `WEIGHT_SENSOR_FAIL_B`             |
| **Pemicu**   | Sensor beban tidak berfungsi                               |
| **Transisi** | State → `DOOR_FORCED_OPEN`, anggap overload untuk keamanan |

**Kode Python (baris 504-506):**

```python
if input_event == "WEIGHT_SENSOR_FAIL":
    next_state = ("DOOR_FORCED_OPEN", posisi, request, "O", "V", layanan, listrik, rem)
    return next_state if state_lift_valid(next_state) else None
```

> 💡 **Contoh Skenario Nyata:**  
> Sensor beban Lift A rusak. Sistem tidak tahu apakah lift penuh atau kosong. Untuk keamanan, sistem mengasumsikan lift overload → pintu tetap terbuka, lift tidak bergerak. Penumpang harus menggunakan Lift B atau tangga sampai teknisi memperbaiki sensor.

---

##### POSITION_SENSOR_FAIL_A, POSITION_SENSOR_FAIL_B - Sensor Posisi Rusak (FATAL)

| Aspek         | Detail                                             |
| ------------- | -------------------------------------------------- |
| **Event**     | `POSITION_SENSOR_FAIL_A`, `POSITION_SENSOR_FAIL_B` |
| **Pemicu**    | Lift tidak tahu ada di lantai berapa               |
| **Prioritas** | **PRIORITY 1** (paling tinggi) - FATAL             |
| **Transisi**  | State → `OUT_OF_SERVICE`, STOP TOTAL               |

**Kode Python (baris 510-512):**

```python
if input_event == "POSITION_SENSOR_FAIL":
    next_state = ("OUT_OF_SERVICE", posisi, "000", pintu, beban, "OS", listrik, "BON")
    return next_state if state_lift_valid(next_state) else None
```

> ⚠️ **PERINGATAN:**  
> Ini adalah kondisi **PALING BERBAHAYA**. Jika lift tidak tahu posisinya, lift bisa menabrak atap atau lantai bawah. Sistem langsung STOP TOTAL dan menunggu teknisi.

---

### 3.4 Recovery & Maintenance

#### 3.4.1 Recovery

##### FIX_A, FIX_B - Perbaikan Selesai

| Aspek        | Detail                               |
| ------------ | ------------------------------------ |
| **Event**    | `FIX_A`, `FIX_B`                     |
| **Pemicu**   | Teknisi selesai memperbaiki masalah  |
| **Kondisi**  | Lift dalam keadaan OS atau rem aktif |
| **Transisi** | State → `IDLE`, layanan IS, rem BOFF |

**Kode Python (contoh dari baris 306-307):**

```python
if input_event == "FIX":
    next_state = ("IDLE", posisi, "000", pintu, beban, "IS", listrik, "BOFF")
    return next_state if state_lift_valid(next_state) else None
```

---

##### START_A, START_B - Nyalakan Ulang

| Aspek        | Detail                                            |
| ------------ | ------------------------------------------------- |
| **Event**    | `START_A`, `START_B`                              |
| **Pemicu**   | Lift dinyalakan setelah dimatikan                 |
| **Kondisi**  | Lift dalam keadaan listrik OFF                    |
| **Transisi** | State → `IDLE`, listrik PON, layanan IS, rem BOFF |

---

#### 3.4.2 Maintenance

##### MAINT_START_A, MAINT_START_B - Mulai Perawatan

| Aspek        | Detail                                       |
| ------------ | -------------------------------------------- |
| **Event**    | `MAINT_START_A`, `MAINT_START_B`             |
| **Pemicu**   | Teknisi memulai jadwal perawatan berkala     |
| **Transisi** | State → `OUT_OF_SERVICE`, layanan OS, rem ON |

**Kode Python (baris 538-540):**

```python
if input_event == "MAINT_START":
    next_state = ("OUT_OF_SERVICE", posisi, "000", pintu, beban, "OS", listrik, "BON")
    return next_state if state_lift_valid(next_state) else None
```

---

##### MAINT_END_A, MAINT_END_B - Perawatan Selesai

| Aspek        | Detail                                         |
| ------------ | ---------------------------------------------- |
| **Event**    | `MAINT_END_A`, `MAINT_END_B`                   |
| **Pemicu**   | Teknisi menyelesaikan perawatan                |
| **Kondisi**  | Hanya efektif jika lift dalam `OUT_OF_SERVICE` |
| **Transisi** | State → `IDLE`, reset ke kondisi normal        |

**Kode Python (baris 544-548):**

```python
if input_event == "MAINT_END":
    if fsa_state == "OUT_OF_SERVICE":
        next_state = ("IDLE", posisi, "000", "C", "N", "IS", "PON", "BOFF")
        return next_state if state_lift_valid(next_state) else None
    return state  # Tidak efektif jika bukan dari OUT_OF_SERVICE
```

---

##### TECH_OVERRIDE_A, TECH_OVERRIDE_B - Teknisi Override

| Aspek        | Detail                                                    |
| ------------ | --------------------------------------------------------- |
| **Event**    | `TECH_OVERRIDE_A`, `TECH_OVERRIDE_B`                      |
| **Pemicu**   | Teknisi mengambil kendali manual untuk inspeksi/perbaikan |
| **Transisi** | State → `SAFE_HOLD`, state netral paling aman             |

**Kode Python (baris 552-554):**

```python
if input_event == "TECH_OVERRIDE":
    next_state = ("SAFE_HOLD", posisi, "000", pintu, beban, layanan, listrik, rem)
    return next_state if state_lift_valid(next_state) else None
```

---

## 4. Validasi State & Transisi

### 4.1 Ringkasan Data Aktual

| Metrik                                | Nilai       | Sumber                                               |
| ------------------------------------- | ----------- | ---------------------------------------------------- |
| **FSA States**                        | 11          | `next_state_combined.py` baris 19-31                 |
| **Komponen Hardware**                 | 8           | posisi, request, pintu, beban, layanan, listrik, rem |
| **Total Kombinasi Teoritis (1 Lift)** | 16,896      | 11 × 3 × 8 × 2 × 2 × 2 × 2 × 2                       |
| **State Valid (1 Lift)**              | 474         | √224,676                                             |
| **State Valid Sistem (2 Lift)**       | 224,676     | Jumlah baris NST_Combined.csv - 1 header             |
| **State Invalid (2 Lift)**            | 285,385,900 | Total Teoritis - Valid                               |
| **Total Input Types**                 | 110         | 82 single + 28 multiple                              |
| **Total Transisi Valid**              | 24,714,360  | Jumlah baris Transitions_Combined.csv - 1 header     |

### 4.2 Persentase Validitas

| Kategori     | Teoritis       | Valid      | Persentase  |
| ------------ | -------------- | ---------- | ----------- |
| State 1 Lift | 16,896         | 474        | **2.81%**   |
| State 2 Lift | 285,610,576    | 224,676    | **0.079%**  |
| Transisi     | 20,894,868 × ∞ | 20,894,868 | Terdefinisi |

### 4.3 State Invalid (Tidak Digunakan)

State dinyatakan **invalid** jika melanggar salah satu dari **11 aturan validasi** berikut:

| No  | Aturan                                                                    | Baris Kode | Penjelasan Awam                           |
| --- | ------------------------------------------------------------------------- | ---------- | ----------------------------------------- |
| 1   | `request[posisi - 1] == "1"`                                              | 145-146    | Tidak masuk akal minta ke lantai saat ini |
| 2   | `listrik == "POFF" and (layanan != "OS" or rem != "BON")`                 | 149-151    | Tanpa listrik, harus mati total           |
| 3   | `layanan == "OS" and rem != "BON"`                                        | 154-155    | Jika nonaktif, harus direm                |
| 4   | `rem == "BON" and request != "000"`                                       | 158-159    | Jika direm, tidak boleh punya tujuan      |
| 5   | `beban == "V" and pintu != "O"`                                           | 162-163    | Overload harus pintu terbuka              |
| 6   | `fsa_state == "MOVING" and pintu != "C"`                                  | 166-167    | Bergerak harus pintu tertutup             |
| 7   | `fsa_state == "DOOR_FORCED_OPEN" and pintu != "O"`                        | 170-171    | Kontradiksi state                         |
| 8   | `fsa_state == "OUT_OF_SERVICE" and (layanan != "OS" or request != "000")` | 174-176    | Jika mati, tidak boleh ada request        |
| 9   | `fsa_state == "EMERGENCY_MODE" and rem != "BON"`                          | 179-180    | Darurat gempa harus rem aktif             |
| 10  | `fsa_state == "BRAKE_ACTIVE" and posisi == 1`                             | 183-184    | Di lantai 1 tidak perlu rem darurat kabel |
| 11  | `fsa_state == "POWER_BACKUP_MODE" and listrik != "POFF"`                  | 187-188    | Mode backup hanya jika listrik mati       |

---

## 5. Analisis Alasan

### 5.1 Mengapa Jumlah State Bisa Sebanyak Itu?

#### Perhitungan Detail:

```
State 1 Lift (Teoritis):
= FSA_STATES × LANTAI × REQUEST × PINTU × BEBAN × LAYANAN × LISTRIK × REM
= 11 × 3 × 8 × 2 × 2 × 2 × 2 × 2
= 16,896 kombinasi

State 1 Lift (Valid):
= 474 kombinasi (setelah 11 aturan validasi)

State 2 Lift (Valid):
= 474 × 474
= 224,676 kombinasi
```

#### Alasan:

1. **Kompleksitas Sistem**: Lift modern memiliki banyak komponen (pintu, sensor beban, sensor posisi, rem, listrik) yang masing-masing memiliki beberapa kemungkinan kondisi.

2. **Independensi Lift**: Sistem memiliki 2 lift yang beroperasi **independen**. State Lift A tidak bergantung pada Lift B, sehingga terjadi **perkalian** bukan penjumlahan.

3. **Request Biner**: Dengan 3 lantai, ada 8 kemungkinan kombinasi request (000-111), menambah kompleksitas.

### 5.2 Mengapa Ada State yang Tidak Valid?

Dari 16,896 kombinasi teoretis per lift, hanya 474 yang valid (**2.81%**). Artinya **97.19% state adalah "mustahil"** karena:

1. **Kontradiksi Fisik**: Tidak mungkin lift bergerak dengan pintu terbuka (berbahaya, mekanis tidak memungkinkan).

2. **Kontradiksi Logis**: Tidak masuk akal lift memiliki request ke lantai tempat ia berada sekarang.

3. **Aturan Keamanan**: Jika listrik mati, rem HARUS aktif. Jika overload, pintu HARUS terbuka.

4. **Konsistensi State**: `DOOR_FORCED_OPEN` dengan pintu tertutup adalah kontradiksi definisi.

### 5.3 Mengapa Jumlah Transisi Tidak Bisa Dikurangi?

Total transisi valid: **20,894,868** (~21 juta)

#### Alasan Tidak Bisa Dikurangi:

1. **Setiap State Harus Merespon Setiap Input**:

   - 224,676 state × 93 input = 20,894,868 transisi
   - Ini adalah **minimum** untuk sistem yang **deterministik**

2. **Keamanan First**:

   - Setiap input darurat (QUAKE_ON, FIRE, dll) HARUS memiliki respons dari setiap state
   - Tidak ada state yang boleh "tidak merespon" input darurat

3. **Self-Loop adalah Valid**:

   - Banyak transisi adalah self-loop (state tidak berubah)
   - Contoh: `FIX_A` pada lift yang sudah normal tidak mengubah apapun
   - Ini tetap dihitung sebagai transisi valid

4. **Tidak Ada Shortcut**:
   - Setiap kombinasi state+input menghasilkan **tepat satu** next state
   - Ini adalah definisi **Finite State Automata (FSA)**

### 5.4 Implikasi Praktis

| Aspek               | Implikasi                                                 |
| ------------------- | --------------------------------------------------------- |
| **File Size**       | NST: 1.15 GB, Transitions: 2.68 GB                        |
| **Processing Time** | Generasi file memakan waktu signifikan                    |
| **Memory Usage**    | Loading penuh membutuhkan RAM besar                       |
| **Verification**    | Memerlukan otomatisasi untuk memverifikasi semua transisi |

---

## Lampiran: Prioritas Input

Ketika **multiple input** terjadi bersamaan, sistem memproses berdasarkan prioritas:

| Priority | Level    | Event                                                                                                  | Alasan                  |
| -------- | -------- | ------------------------------------------------------------------------------------------------------ | ----------------------- |
| 1        | FATAL    | `QUAKE_ON`, `AFTERSHOCK`, `CABLE_SNAP`, `FIRE`, `POSITION_SENSOR_FAIL`, `MANUAL_EVACUATION`            | Keselamatan jiwa        |
| 2        | URGENT   | `POWER_OFF`, `FLOOD_ON`, `OVERLOAD`, `SENSOR_FAIL`, `SMOKE_DETECTED`, `DOOR_OBSTRUCTED`, `MAINT_START` | Kerusakan/bahaya segera |
| 3        | RECOVERY | `QUAKE_CLR`, `FIRE_CLR`, `FLOOD_CLR`, `POWER_ON`, `FIX`, `START`, `MAINT_END`                          | Pemulihan sistem        |
| 4        | ARRIVAL  | `ARR_A`, `ARR_B`                                                                                       | Kelancaran operasi      |
| 5        | REQUEST  | `CU`, `CD`, `F1`, `F2`, `F3`                                                                           | Pelayanan normal        |
| 6        | DOOR     | `OPN`, `CLD`, `ACLD`                                                                                   | Kenyamanan penumpang    |

---

**Dokumen ini bersifat resmi dan dapat digunakan sebagai referensi teknis untuk:**

- Operator lift
- Engineer pemeliharaan
- Tim keamanan gedung
- Auditor sistem keselamatan

---

_Dihasilkan dari analisis file: `next_state_combined.py`, `NST_Combined.csv`, `Transitions_Combined.csv`_
