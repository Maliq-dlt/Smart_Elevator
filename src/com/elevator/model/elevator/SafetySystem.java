package com.elevator.model.elevator;

import com.elevator.fsa.Event;

/**
 * Sistem Keamanan Lift (Safety System).
 * Menangani berbagai situasi darurat dan keamanan lift.
 */
public class SafetySystem {

    /**
     * Jenis sistem keamanan yang tersedia.
     */
    public enum SafetyDevice {
        GOVERNOR("Safety Governor",
                "Mendeteksi kecepatan berlebih dan mengaktifkan rem darurat"),
        DISC_BRAKE("Rem Cakram Otomatis",
                "Sistem pengereman cakram yang menjepit rail lift"),
        BUFFER("Buffer/Peredam",
                "Peredam di dasar shaft untuk meredam benturan"),
        DOOR_SENSOR("Sensor Pintu",
                "Mendeteksi halangan pada pintu lift"),
        OVERLOAD_SENSOR("Sensor Overload",
                "Mendeteksi beban berlebih"),
        SEISMIC_SENSOR("Sensor Seismik",
                "Mendeteksi getaran gempa"),
        FIRE_SENSOR("Sensor Kebakaran",
                "Mendeteksi asap dan api"),
        POWER_BACKUP("UPS/Baterai Cadangan",
                "Cadangan daya untuk evakuasi saat mati lampu"),
        EMERGENCY_BRAKE("Rem Darurat",
                "Rem mekanis yang aktif saat kabel putus"),
        INTERCOM("Intercom Darurat",
                "Sistem komunikasi dengan pusat kendali");

        private final String name;
        private final String description;

        SafetyDevice(String name, String description) {
            this.name = name;
            this.description = description;
        }

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * Status sistem keamanan.
     */
    public enum SafetyStatus {
        NORMAL("Normal", "Sistem berjalan normal"),
        WARNING("Peringatan", "Ada peringatan, perlu perhatian"),
        EMERGENCY("Darurat", "Situasi darurat, tindakan diperlukan"),
        ACTIVATED("Aktif", "Sistem keamanan sudah diaktifkan");

        private final String name;
        private final String description;

        SafetyStatus(String name, String description) {
            this.name = name;
            this.description = description;
        }

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }
    }

    // Konstanta berat
    public static final double MAX_WEIGHT_CAPACITY = 630.0; // kg (standar 8 orang)
    public static final double WARNING_WEIGHT_THRESHOLD = 0.8; // 80% kapasitas
    public static final double OVERLOAD_THRESHOLD = 1.0; // 100% kapasitas

    // Status sistem
    private SafetyStatus status;
    private boolean emergencyBrakeActivated;
    private boolean overloadDetected;
    private boolean cableBroken;
    private boolean fireDetected;
    private boolean powerOutage;
    private boolean earthquakeDetected;
    private double currentWeight;
    private double maxCapacity;

    public SafetySystem() {
        this(MAX_WEIGHT_CAPACITY);
    }

    public SafetySystem(double maxCapacity) {
        this.maxCapacity = maxCapacity;
        this.status = SafetyStatus.NORMAL;
        this.emergencyBrakeActivated = false;
        this.overloadDetected = false;
        this.cableBroken = false;
        this.fireDetected = false;
        this.powerOutage = false;
        this.earthquakeDetected = false;
        this.currentWeight = 0;
    }

    /**
     * Menambahkan berat ke lift.
     * 
     * @param weight berat yang ditambahkan
     * @return Event yang dihasilkan (OVERLOAD atau null)
     */
    public Event addWeight(double weight) {
        this.currentWeight += weight;
        checkOverload();
        return overloadDetected ? Event.OVERLOAD_DETECTED : null;
    }

    /**
     * Mengurangi berat dari lift.
     * 
     * @param weight berat yang dikurangi
     */
    public void removeWeight(double weight) {
        this.currentWeight = Math.max(0, this.currentWeight - weight);
        checkOverload();
    }

    /**
     * Cek status overload.
     */
    private void checkOverload() {
        double ratio = currentWeight / maxCapacity;
        if (ratio >= OVERLOAD_THRESHOLD) {
            overloadDetected = true;
            status = SafetyStatus.WARNING;
        } else {
            overloadDetected = false;
            if (status == SafetyStatus.WARNING && !hasAnyEmergency()) {
                status = SafetyStatus.NORMAL;
            }
        }
    }

    /**
     * Mengecek apakah ada situasi darurat.
     */
    private boolean hasAnyEmergency() {
        return cableBroken || fireDetected || powerOutage || earthquakeDetected;
    }

    /**
     * Mendeteksi kabel putus - aktifkan Safety Governor dan rem cakram.
     * 
     * @return deskripsi aksi yang diambil
     */
    public String detectCableBreak() {
        this.cableBroken = true;
        this.emergencyBrakeActivated = true;
        this.status = SafetyStatus.EMERGENCY;

        return "🚨 KABEL PUTUS TERDETEKSI!\n" +
                "   → Safety Governor AKTIF: Mendeteksi kecepatan berlebih\n" +
                "   → Rem Cakram Otomatis AKTIF: Menjepit rail lift\n" +
                "   → Lift BERHENTI di posisi aman\n" +
                "   → Buffer di dasar shaft siaga sebagai cadangan";
    }

    /**
     * Mendeteksi mati lampu saat lift bergerak.
     * 
     * @param isMoving     apakah lift sedang bergerak
     * @param currentFloor lantai saat ini
     * @return deskripsi aksi yang diambil
     */
    public String detectPowerOutage(boolean isMoving, int currentFloor) {
        this.powerOutage = true;
        this.status = SafetyStatus.EMERGENCY;

        StringBuilder sb = new StringBuilder();
        sb.append("💡 MATI LAMPU TERDETEKSI!\n");
        sb.append("   → UPS/Baterai Cadangan AKTIF\n");

        if (isMoving) {
            sb.append("   → Lift SEDANG BERGERAK di Lantai ").append(currentFloor).append("\n");
            sb.append("   → Prosedur Evakuasi Darurat:\n");
            sb.append("     1. Rem elektromagnetik menahan posisi\n");
            sb.append("     2. Daya cadangan menggerakkan ke lantai terdekat\n");
            sb.append("     3. Pintu terbuka untuk evakuasi\n");
            sb.append("     4. Intercom darurat diaktifkan\n");
        } else {
            sb.append("   → Lift TIDAK BERGERAK\n");
            sb.append("   → Pintu tetap berfungsi dengan daya cadangan\n");
            sb.append("   → Intercom darurat tersedia\n");
        }

        return sb.toString();
    }

    /**
     * Mendeteksi kebakaran saat lift bergerak.
     * 
     * @param isMoving     apakah lift sedang bergerak
     * @param currentFloor lantai saat ini
     * @return deskripsi aksi yang diambil
     */
    public String detectFire(boolean isMoving, int currentFloor) {
        this.fireDetected = true;
        this.status = SafetyStatus.EMERGENCY;

        StringBuilder sb = new StringBuilder();
        sb.append("🔥 KEBAKARAN TERDETEKSI!\n");
        sb.append("   → Fire Recall Mode AKTIF\n");

        if (isMoving) {
            sb.append("   → Lift SEDANG BERGERAK di Lantai ").append(currentFloor).append("\n");
            sb.append("   → Prosedur Fire Recall:\n");
            sb.append("     1. Semua request dibatalkan\n");
            sb.append("     2. Lift bergerak ke Lantai 1 (Fire Recall Floor)\n");
            sb.append("     3. Pintu terbuka dan terkunci terbuka\n");
            sb.append("     4. Lift dinonaktifkan sampai reset manual\n");
        } else {
            sb.append("   → Lift BERHENTI, bergerak ke Lantai 1\n");
            sb.append("   → Gunakan tangga darurat!\n");
        }

        return sb.toString();
    }

    /**
     * Mendeteksi gempa bumi saat lift bergerak.
     * 
     * @param isMoving     apakah lift sedang bergerak
     * @param currentFloor lantai saat ini
     * @return deskripsi aksi yang diambil
     */
    public String detectEarthquake(boolean isMoving, int currentFloor) {
        this.earthquakeDetected = true;
        this.status = SafetyStatus.EMERGENCY;

        StringBuilder sb = new StringBuilder();
        sb.append("🌍 GEMPA BUMI TERDETEKSI!\n");
        sb.append("   → Sensor Seismik AKTIF\n");

        if (isMoving) {
            sb.append("   → Lift SEDANG BERGERAK di Lantai ").append(currentFloor).append("\n");
            sb.append("   → Prosedur Earthquake Emergency:\n");
            sb.append("     1. Lift berhenti di lantai TERDEKAT\n");
            sb.append("     2. Pintu terbuka otomatis\n");
            sb.append("     3. Penumpang diminta keluar segera\n");
            sb.append("     4. Lift tidak beroperasi sampai inspeksi selesai\n");
        } else {
            sb.append("   → Lift BERHENTI di Lantai ").append(currentFloor).append("\n");
            sb.append("   → Pintu terbuka untuk evakuasi\n");
            sb.append("   → Gunakan tangga!\n");
        }

        return sb.toString();
    }

    /**
     * Mendapatkan respons overload.
     * 
     * @return deskripsi aksi
     */
    public String getOverloadResponse() {
        return "⚠️ OVERLOAD TERDETEKSI!\n" +
                "   → Berat saat ini: " + String.format("%.1f", currentWeight) + " kg\n" +
                "   → Kapasitas maksimum: " + String.format("%.1f", maxCapacity) + " kg\n" +
                "   → Lift TIDAK AKAN BERGERAK sampai beban dikurangi\n" +
                "   → Pintu tetap terbuka\n" +
                "   → Alarm overload berbunyi";
    }

    /**
     * Reset sistem keamanan setelah darurat teratasi.
     */
    public void reset() {
        this.status = SafetyStatus.NORMAL;
        this.emergencyBrakeActivated = false;
        this.overloadDetected = false;
        this.cableBroken = false;
        this.fireDetected = false;
        this.powerOutage = false;
        this.earthquakeDetected = false;
    }

    // Getters
    public SafetyStatus getStatus() {
        return status;
    }

    public boolean isEmergencyBrakeActivated() {
        return emergencyBrakeActivated;
    }

    public boolean isOverloadDetected() {
        return overloadDetected;
    }

    public boolean isCableBroken() {
        return cableBroken;
    }

    public boolean isFireDetected() {
        return fireDetected;
    }

    public boolean isPowerOutage() {
        return powerOutage;
    }

    public boolean isEarthquakeDetected() {
        return earthquakeDetected;
    }

    public double getCurrentWeight() {
        return currentWeight;
    }

    public double getMaxCapacity() {
        return maxCapacity;
    }

    public double getLoadPercentage() {
        return (currentWeight / maxCapacity) * 100;
    }

    public boolean isWarningLoad() {
        return (currentWeight / maxCapacity) >= WARNING_WEIGHT_THRESHOLD;
    }

    /**
     * Mendapatkan visualisasi status sistem keamanan.
     */
    public String getStatusVisual() {
        StringBuilder sb = new StringBuilder();
        sb.append("╔═══════════════════════════════════════════╗\n");
        sb.append("║         🛡️ SAFETY SYSTEM STATUS          ║\n");
        sb.append("╠═══════════════════════════════════════════╣\n");
        sb.append(String.format("║  Status      : %-26s ║\n", status.getName()));
        sb.append(String.format("║  Berat       : %.1f / %.1f kg (%.1f%%)     ║\n",
                currentWeight, maxCapacity, getLoadPercentage()));
        sb.append("╠═══════════════════════════════════════════╣\n");
        sb.append("║  Sistem Aktif:                            ║\n");
        sb.append(String.format("║    • Rem Darurat  : %-22s ║\n",
                emergencyBrakeActivated ? "🔴 AKTIF" : "🟢 Standby"));
        sb.append(String.format("║    • Overload     : %-22s ║\n",
                overloadDetected ? "🔴 TERDETEKSI" : "🟢 Normal"));
        sb.append(String.format("║    • Kabel        : %-22s ║\n",
                cableBroken ? "🔴 PUTUS!" : "🟢 OK"));
        sb.append(String.format("║    • Kebakaran    : %-22s ║\n",
                fireDetected ? "🔴 TERDETEKSI" : "🟢 Aman"));
        sb.append(String.format("║    • Listrik      : %-22s ║\n",
                powerOutage ? "🔴 MATI" : "🟢 Normal"));
        sb.append(String.format("║    • Gempa        : %-22s ║\n",
                earthquakeDetected ? "🔴 TERDETEKSI" : "🟢 Aman"));
        sb.append("╚═══════════════════════════════════════════╝\n");
        return sb.toString();
    }

    /**
     * Mendapatkan deskripsi sistem pengereman otomatis.
     */
    public static String getBrakingSystemDescription() {
        return "╔═══════════════════════════════════════════════════════════════════╗\n" +
                "║              🛑 SISTEM PENGEREMAN OTOMATIS LIFT                   ║\n" +
                "╠═══════════════════════════════════════════════════════════════════╣\n" +
                "║                                                                   ║\n" +
                "║  1. SAFETY GOVERNOR (Speed Governor)                              ║\n" +
                "║     → Mendeteksi kecepatan lift melebihi batas aman               ║\n" +
                "║     → Jika terdeteksi, langsung aktifkan rem darurat              ║\n" +
                "║     → Bekerja secara MEKANIS, tidak butuh listrik                 ║\n" +
                "║                                                                   ║\n" +
                "║  2. REM CAKRAM OTOMATIS (Disc Brake)                              ║\n" +
                "║     → Cakram yang menjepit RAIL PEMANDU lift                      ║\n" +
                "║     → Diaktifkan oleh Safety Governor saat kabel putus            ║\n" +
                "║     → Dapat menghentikan lift dalam hitungan detik                ║\n" +
                "║     → 100% mekanis - FAIL-SAFE design                             ║\n" +
                "║                                                                   ║\n" +
                "║  3. BUFFER (Peredam)                                              ║\n" +
                "║     → Terletak di dasar shaft lift                                ║\n" +
                "║     → Meredam benturan jika lift jatuh                            ║\n" +
                "║     → Cadangan keamanan terakhir                                  ║\n" +
                "║                                                                   ║\n" +
                "║  ⚡ PRINSIP FAIL-SAFE:                                            ║\n" +
                "║     Semua sistem keamanan dirancang untuk AKTIF OTOMATIS          ║\n" +
                "║     saat terjadi kegagalan, TANPA memerlukan listrik!             ║\n" +
                "║                                                                   ║\n" +
                "╚═══════════════════════════════════════════════════════════════════╝\n";
    }
}
