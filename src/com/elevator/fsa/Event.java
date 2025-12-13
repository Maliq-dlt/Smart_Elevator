package com.elevator.fsa;

/**
 * Enum untuk semua Event/Input yang bisa terjadi dalam Smart Elevator System.
 * Event ini merepresentasikan input alfabet dalam FSA.
 */
public enum Event {
    // Tombol dalam lift
    BUTTON_1_PRESSED("Tombol lantai 1 ditekan"),
    BUTTON_2_PRESSED("Tombol lantai 2 ditekan"),
    BUTTON_3_PRESSED("Tombol lantai 3 ditekan"),
    BUTTON_OPEN_PRESSED("Tombol buka pintu ditekan"),
    BUTTON_CLOSE_PRESSED("Tombol tutup pintu ditekan"),

    // Tombol panggilan di lantai
    CALL_UP_FLOOR_1("Panggilan naik dari lantai 1"),
    CALL_UP_FLOOR_2("Panggilan naik dari lantai 2"),
    CALL_DOWN_FLOOR_2("Panggilan turun dari lantai 2"),
    CALL_DOWN_FLOOR_3("Panggilan turun dari lantai 3"),

    // Event sensor dan mekanik
    ARRIVED_AT_FLOOR("Lift tiba di lantai tujuan"),
    DOOR_FULLY_OPEN("Pintu terbuka sepenuhnya"),
    DOOR_FULLY_CLOSED("Pintu tertutup sepenuhnya"),
    DOOR_OBSTRUCTION("Halangan terdeteksi di pintu"),
    TIMEOUT("Waktu habis"),

    // Event penumpang
    PASSENGER_ENTERED("Penumpang masuk"),
    PASSENGER_EXITED("Penumpang keluar"),

    // Event sistem
    NO_REQUESTS("Tidak ada permintaan"),
    HAS_REQUEST_ABOVE("Ada permintaan di atas"),
    HAS_REQUEST_BELOW("Ada permintaan di bawah"),
    EMERGENCY_STOP("Berhenti darurat"),
    SYSTEM_RESET("Reset sistem"),

    // Event keamanan / bencana
    OVERLOAD_DETECTED("Beban berlebih terdeteksi"),
    CABLE_BREAK("Kabel lift putus"),
    FIRE_ALARM("Alarm kebakaran"),
    EARTHQUAKE_DETECTED("Gempa bumi terdeteksi"),
    POWER_OUTAGE("Listrik mati"),
    FLOOD_DETECTED("Banjir terdeteksi"),
    BRAKE_ACTIVATED("Rem darurat aktif");

    private final String description;

    Event(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return name() + " (" + description + ")";
    }
}
