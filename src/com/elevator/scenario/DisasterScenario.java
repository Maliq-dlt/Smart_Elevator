package com.elevator.scenario;

import com.elevator.model.building.Building;
import com.elevator.model.elevator.Elevator;
import com.elevator.model.passenger.Passenger;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

/**
 * Skenario Bencana/Darurat.
 * User dapat memilih jenis bencana:
 * - POWER_OUTAGE: Mati lampu
 * - FIRE: Kebakaran
 * - EARTHQUAKE: Gempa bumi
 * - FLOOD: Banjir
 */
public class DisasterScenario implements Scenario {

    public enum DisasterType {
        POWER_OUTAGE("Mati Lampu",
                "Listrik mati! Lift berhenti di tengah jalan. " +
                        "Penumpang harus menunggu sampai listrik pulih atau evakuasi manual."),
        FIRE("Kebakaran",
                "Kebakaran terdeteksi! Semua lift harus turun ke lantai 1 " +
                        "dan membuka pintu untuk evakuasi darurat."),
        EARTHQUAKE("Gempa Bumi",
                "Gempa terjadi! Lift berhenti di lantai terdekat, " +
                        "membuka pintu, dan tidak beroperasi sampai dinyatakan aman."),
        FLOOD("Banjir",
                "Banjir di lantai bawah! Lift tidak boleh turun ke lantai 1. " +
                        "Evakuasi ke lantai atas."),
        CABLE_BREAK("Kabel Putus",
                "KABEL LIFT PUTUS! Safety Governor dan rem cakram otomatis " +
                        "diaktifkan untuk menghentikan lift secara darurat.");

        private final String name;
        private final String description;

        DisasterType(String name, String description) {
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

    private DisasterType disasterType;
    private List<Passenger> passengers;
    private int[] elevatorPositions;
    private int disasterTime; // Waktu bencana terjadi (dalam detik simulasi)
    private boolean disasterTriggered;
    private boolean elevatorsMoving; // Apakah lift sedang bergerak saat bencana

    public DisasterScenario() {
        this.disasterType = DisasterType.POWER_OUTAGE;
        this.passengers = new ArrayList<>();
        this.elevatorPositions = new int[] { 2, 3 }; // Lift di tengah-tengah
        this.disasterTime = 10; // Bencana terjadi di detik ke-10
        this.disasterTriggered = false;
        this.elevatorsMoving = true; // Default: lift sedang bergerak
    }

    /**
     * Meminta input dari user untuk memilih jenis bencana.
     * 
     * @param scanner Scanner untuk input
     */
    public void configureFromUserInput(Scanner scanner) {
        Passenger.resetIdCounter();
        passengers.clear();

        System.out.println("\n╔══════════════════════════════════════════════════════════════════╗");
        System.out.println("║              ⚠️ KONFIGURASI SKENARIO BENCANA                     ║");
        System.out.println("╚══════════════════════════════════════════════════════════════════╝\n");

        // Pilih jenis bencana
        selectDisasterType(scanner);

        // Konfigurasi posisi lift saat bencana
        configureElevatorPositions(scanner);

        // Tanyakan apakah lift sedang bergerak
        configureElevatorMovement(scanner);

        // Konfigurasi penumpang
        configurePassengers(scanner);

        // Waktu bencana
        configureDisasterTime(scanner);

        // Tampilkan ringkasan
        showSummary();
    }

    /**
     * Memilih jenis bencana.
     */
    private void selectDisasterType(Scanner scanner) {
        System.out.println("═══════════════════════════════════════════════════════════════════");
        System.out.println("           🔥 PILIH JENIS BENCANA");
        System.out.println("═══════════════════════════════════════════════════════════════════\n");

        System.out.println("  1. 💡 Mati Lampu (Power Outage)");
        System.out.println("     → Lift berhenti di tengah, menunggu listrik pulih");
        System.out.println();
        System.out.println("  2. 🔥 Kebakaran (Fire)");
        System.out.println("     → Semua lift turun ke L1 untuk evakuasi");
        System.out.println();
        System.out.println("  3. 🌍 Gempa Bumi (Earthquake)");
        System.out.println("     → Lift berhenti di lantai terdekat, pintu terbuka");
        System.out.println();
        System.out.println("  4. 🌊 Banjir (Flood)");
        System.out.println("     → Lift tidak boleh ke L1, evakuasi ke atas");
        System.out.println();
        System.out.println("  5. 🔗 Kabel Putus (Cable Break) ⚠️ WORST CASE");
        System.out.println("     → Safety Governor + Rem Cakram Otomatis AKTIF!");
        System.out.println();

        System.out.print("Pilih jenis bencana (1-5) [default: 1]: ");
        String input = scanner.nextLine().trim();

        switch (input) {
            case "2":
                disasterType = DisasterType.FIRE;
                break;
            case "3":
                disasterType = DisasterType.EARTHQUAKE;
                break;
            case "4":
                disasterType = DisasterType.FLOOD;
                break;
            case "5":
                disasterType = DisasterType.CABLE_BREAK;
                break;
            default:
                disasterType = DisasterType.POWER_OUTAGE;
        }

        System.out.println("\n✓ Bencana dipilih: " + disasterType.getName());
        System.out.println("  " + disasterType.getDescription());
        System.out.println();
    }

    /**
     * Konfigurasi apakah lift sedang bergerak.
     */
    private void configureElevatorMovement(Scanner scanner) {
        System.out.println("═══════════════════════════════════════════════════════════════════");
        System.out.println("           🚀 STATUS LIFT SAAT BENCANA");
        System.out.println("═══════════════════════════════════════════════════════════════════\n");

        System.out.println("  1. Lift SEDANG BERGERAK (lebih berbahaya)");
        System.out.println("  2. Lift DIAM/BERHENTI");
        System.out.print("\nPilih status lift (1-2) [default: 1]: ");
        String input = scanner.nextLine().trim();

        elevatorsMoving = !input.equals("2");

        System.out.println("\n✓ Status: Lift " + (elevatorsMoving ? "SEDANG BERGERAK" : "DIAM/BERHENTI"));
        System.out.println();
    }

    /**
     * Konfigurasi posisi lift saat bencana.
     */
    private void configureElevatorPositions(Scanner scanner) {
        System.out.println("═══════════════════════════════════════════════════════════════════");
        System.out.println("           📍 POSISI LIFT SAAT BENCANA TERJADI");
        System.out.println("═══════════════════════════════════════════════════════════════════\n");

        System.out.print("Posisi Lift A saat bencana (lantai 1-3) [default: 2]: ");
        String inputA = scanner.nextLine().trim();
        elevatorPositions[0] = parseFloor(inputA, 2);

        System.out.print("Posisi Lift B saat bencana (lantai 1-3) [default: 3]: ");
        String inputB = scanner.nextLine().trim();
        elevatorPositions[1] = parseFloor(inputB, 3);

        System.out.println("\n✓ Lift A akan berada di Lantai " + elevatorPositions[0]);
        System.out.println("✓ Lift B akan berada di Lantai " + elevatorPositions[1]);
        System.out.println();
    }

    /**
     * Konfigurasi penumpang dalam lift saat bencana.
     */
    private void configurePassengers(Scanner scanner) {
        System.out.println("═══════════════════════════════════════════════════════════════════");
        System.out.println("           👥 PENUMPANG TERJEBAK SAAT BENCANA");
        System.out.println("═══════════════════════════════════════════════════════════════════\n");

        // Penumpang di dalam lift A
        System.out.print("Berapa penumpang di dalam Lift A saat bencana? (0-5) [default: 2]: ");
        int inLiftA = parseNumber(scanner.nextLine().trim(), 2, 0, 5);

        for (int i = 1; i <= inLiftA; i++) {
            // Penumpang dalam lift, asal = posisi lift, tujuan = random
            int dest = elevatorPositions[0] == 3 ? 1 : 3;
            passengers.add(new Passenger("Lift-A-" + i, elevatorPositions[0], dest, 0));
        }

        // Penumpang di dalam lift B
        System.out.print("Berapa penumpang di dalam Lift B saat bencana? (0-5) [default: 1]: ");
        int inLiftB = parseNumber(scanner.nextLine().trim(), 1, 0, 5);

        for (int i = 1; i <= inLiftB; i++) {
            int dest = elevatorPositions[1] == 3 ? 1 : 3;
            passengers.add(new Passenger("Lift-B-" + i, elevatorPositions[1], dest, 0));
        }

        // Penumpang menunggu di lantai
        System.out.print("Berapa penumpang menunggu di lantai? (0-10) [default: 3]: ");
        int waiting = parseNumber(scanner.nextLine().trim(), 3, 0, 10);

        for (int i = 1; i <= waiting; i++) {
            int origin = (i % 3) + 1;
            int dest = origin == 3 ? 1 : 3;
            passengers.add(new Passenger("Waiting-" + i, origin, dest, 0));
        }

        System.out.println("\n✓ Total " + passengers.size() + " orang terlibat dalam bencana");
        System.out.println();
    }

    /**
     * Konfigurasi waktu bencana terjadi.
     */
    private void configureDisasterTime(Scanner scanner) {
        System.out.println("═══════════════════════════════════════════════════════════════════");
        System.out.println("           ⏱️ WAKTU BENCANA TERJADI");
        System.out.println("═══════════════════════════════════════════════════════════════════\n");

        System.out.print("Bencana terjadi pada detik ke berapa? (0-60) [default: 10]: ");
        disasterTime = parseNumber(scanner.nextLine().trim(), 10, 0, 60);

        System.out.println("\n✓ Bencana akan terjadi pada detik ke-" + disasterTime);
        System.out.println();
    }

    private int parseFloor(String input, int defaultValue) {
        if (input.isEmpty())
            return defaultValue;
        try {
            int val = Integer.parseInt(input);
            return Math.max(1, Math.min(3, val));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private int parseNumber(String input, int defaultValue, int min, int max) {
        if (input.isEmpty())
            return defaultValue;
        try {
            int val = Integer.parseInt(input);
            return Math.max(min, Math.min(max, val));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * Tampilkan ringkasan.
     */
    private void showSummary() {
        System.out.println("\n═══════════════════════════════════════════════════════════════════");
        System.out.println("           📋 RINGKASAN SKENARIO BENCANA");
        System.out.println("═══════════════════════════════════════════════════════════════════\n");

        System.out.println("⚠️  Jenis Bencana: " + disasterType.getName());
        System.out.println("📝 " + disasterType.getDescription());
        System.out.println();
        System.out.println("⏱️  Bencana terjadi pada: detik ke-" + disasterTime);
        System.out.println();
        System.out.println("🛗 Posisi Lift saat bencana:");
        System.out.println("   • Lift A: Lantai " + elevatorPositions[0]);
        System.out.println("   • Lift B: Lantai " + elevatorPositions[1]);
        System.out.println();
        System.out.println("👥 Total orang terlibat: " + passengers.size());
        System.out.println();
    }

    @Override
    public String getName() {
        return "DISASTER: " + disasterType.getName().toUpperCase();
    }

    @Override
    public String getDescription() {
        return disasterType.getDescription();
    }

    @Override
    public void setupBuilding(Building building) {
        List<Elevator> elevators = building.getElevators();
        for (int i = 0; i < Math.min(elevatorPositions.length, elevators.size()); i++) {
            elevators.get(i).setCurrentFloor(elevatorPositions[i]);
        }
    }

    @Override
    public List<Passenger> getPassengers() {
        List<Passenger> result = new ArrayList<>();
        Passenger.resetIdCounter();
        for (Passenger p : passengers) {
            result.add(new Passenger(p.getName(), p.getOriginFloor(),
                    p.getDestinationFloor(), p.getRequestTime()));
        }
        return result;
    }

    @Override
    public int[] getInitialElevatorPositions() {
        return elevatorPositions.clone();
    }

    @Override
    public ScenarioResult getExpectedResults() {
        ScenarioResult expected = new ScenarioResult(getName());
        expected.setTotalPassengers(passengers.size());
        return expected;
    }

    public DisasterType getDisasterType() {
        return disasterType;
    }

    public int getDisasterTime() {
        return disasterTime;
    }

    public boolean isDisasterTriggered() {
        return disasterTriggered;
    }

    public void triggerDisaster() {
        this.disasterTriggered = true;
    }

    /**
     * Mendapatkan aksi yang harus dilakukan saat bencana.
     * 
     * @return deskripsi aksi
     */
    public String getDisasterAction() {
        switch (disasterType) {
            case POWER_OUTAGE:
                return "🔴 MATI LAMPU! Semua lift BERHENTI. Mode darurat aktif.";
            case FIRE:
                return "🔥 KEBAKARAN! Semua lift turun ke Lantai 1 untuk EVAKUASI!";
            case EARTHQUAKE:
                return "🌍 GEMPA! Lift berhenti di lantai terdekat. Pintu TERBUKA!";
            case FLOOD:
                return "🌊 BANJIR! Lantai 1 terendam. Evakuasi ke LANTAI ATAS!";
            case CABLE_BREAK:
                return "🔗 KABEL PUTUS! Safety Governor + Rem Cakram AKTIF! Lift BERHENTI DARURAT!";
            default:
                return "⚠️ BENCANA! Mode darurat aktif.";
        }
    }

    /**
     * Mendapatkan story untuk skenario ini.
     */
    public String getStory() {
        StringBuilder sb = new StringBuilder();
        sb.append("\n╔══════════════════════════════════════════════════════════════╗\n");
        sb.append("║                  ⚠️ SKENARIO BENCANA                          ║\n");
        sb.append("╠══════════════════════════════════════════════════════════════╣\n");
        sb.append("║                                                              ║\n");

        switch (disasterType) {
            case POWER_OUTAGE:
                sb.append("║  💡 MATI LAMPU                                               ║\n");
                sb.append("║     Listrik gedung padam tiba-tiba!                          ║\n");
                sb.append("║     Lift berhenti di tengah perjalanan.                      ║\n");
                sb.append("║     Lampu darurat menyala.                                   ║\n");
                break;
            case FIRE:
                sb.append("║  🔥 KEBAKARAN                                                ║\n");
                sb.append("║     Alarm kebakaran berbunyi!                                ║\n");
                sb.append("║     Semua lift harus turun ke lantai 1.                      ║\n");
                sb.append("║     Evakuasi penumpang segera.                               ║\n");
                break;
            case EARTHQUAKE:
                sb.append("║  🌍 GEMPA BUMI                                               ║\n");
                sb.append("║     Getaran kuat terasa!                                     ║\n");
                sb.append("║     Lift berhenti di lantai terdekat.                        ║\n");
                sb.append("║     Pintu terbuka untuk keselamatan.                         ║\n");
                break;
            case FLOOD:
                sb.append("║  🌊 BANJIR                                                   ║\n");
                sb.append("║     Air masuk ke lantai dasar!                               ║\n");
                sb.append("║     Lantai 1 tidak dapat diakses.                            ║\n");
                sb.append("║     Evakuasi ke lantai atas.                                 ║\n");
                break;
            case CABLE_BREAK:
                sb.append("║  🔗 KABEL LIFT PUTUS                                         ║\n");
                sb.append("║     KABEL LIFT PUTUS SAAT BERGERAK!                          ║\n");
                sb.append("║     Safety Governor mendeteksi kecepatan abnormal!           ║\n");
                sb.append("║     Rem Cakram Otomatis AKTIF - menjepit rail!               ║\n");
                sb.append("║     Lift BERHENTI dalam hitungan DETIK!                      ║\n");
                break;
        }

        sb.append("║                                                              ║\n");
        sb.append(String.format("║  ⏱️ Bencana terjadi pada: detik ke-%-24d ║\n", disasterTime));
        sb.append(String.format("║  👥 Orang terlibat: %-38d ║\n", passengers.size()));
        sb.append("║                                                              ║\n");
        sb.append("╚══════════════════════════════════════════════════════════════╝\n");
        return sb.toString();
    }
}
