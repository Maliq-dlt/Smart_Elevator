package com.elevator.ui;

import com.elevator.model.building.Building;
import com.elevator.model.building.Floor;
import com.elevator.model.elevator.Elevator;
import com.elevator.model.passenger.Passenger;
import com.elevator.scenario.BestCaseScenario;
import com.elevator.scenario.CustomScenario;
import com.elevator.scenario.DisasterScenario;
import com.elevator.scenario.ScenarioResult;
import com.elevator.scenario.WorstCaseScenario;
import com.elevator.simulation.SimulationEngine;

import java.util.List;
import java.util.Scanner;

/**
 * Console UI untuk simulasi elevator.
 */
public class ConsoleUI {
    private SimulationEngine engine;
    private Scanner scanner;
    private boolean stepMode;

    public ConsoleUI() {
        this.engine = new SimulationEngine();
        this.scanner = new Scanner(System.in);
        this.stepMode = false;
    }

    /**
     * Menampilkan banner.
     */
    public void showBanner() {
        System.out.println();
        System.out.println("╔══════════════════════════════════════════════════════════════════╗");
        System.out.println("║                                                                  ║");
        System.out.println("║     🏢  SMART ELEVATOR SYSTEM - FSA SIMULATION  🛗              ║");
        System.out.println("║                                                                  ║");
        System.out.println("║     Finite State Automata untuk 2 Lift dan 3 Lantai            ║");
        System.out.println("║     IN232 - Matematika Diskrit                                  ║");
        System.out.println("║                                                                  ║");
        System.out.println("╚══════════════════════════════════════════════════════════════════╝");
        System.out.println();
    }

    /**
     * Menampilkan menu utama.
     */
    public void showMainMenu() {
        System.out.println("╔══════════════════════════════════════════╗");
        System.out.println("║              MENU UTAMA                  ║");
        System.out.println("╠══════════════════════════════════════════╣");
        System.out.println("║  1. Jalankan Skenario BEST CASE          ║");
        System.out.println("║  2. Jalankan Skenario WORST CASE         ║");
        System.out.println("║  3. Jalankan SKENARIO CUSTOM 🎮          ║");
        System.out.println("║  4. Jalankan SKENARIO BENCANA ⚠️          ║");
        System.out.println("║  5. Perbandingan Best vs Worst           ║");
        System.out.println("║  6. Lihat Diagram FSA                    ║");
        System.out.println("║  7. Lihat Tabel Transisi                 ║");
        System.out.println("║  0. Keluar                               ║");
        System.out.println("╚══════════════════════════════════════════╝");
        System.out.print("Pilihan Anda: ");
    }

    /**
     * Menjalankan UI loop.
     */
    public void run() {
        showBanner();

        boolean running = true;
        while (running) {
            showMainMenu();
            String input = scanner.nextLine().trim();

            switch (input) {
                case "1":
                    runBestCaseScenario();
                    break;
                case "2":
                    runWorstCaseScenario();
                    break;
                case "3":
                    runCustomScenario();
                    break;
                case "4":
                    runDisasterScenario();
                    break;
                case "5":
                    runBothScenarios();
                    break;
                case "6":
                    showFSADiagram();
                    break;
                case "7":
                    showTransitionTable();
                    break;
                case "0":
                    running = false;
                    System.out.println("\nTerima kasih telah menggunakan Smart Elevator Simulation!");
                    break;
                default:
                    System.out.println("\nPilihan tidak valid. Silakan coba lagi.\n");
            }
        }
    }

    /**
     * Menjalankan skenario Best Case.
     */
    public void runBestCaseScenario() {
        System.out.println("\n" + ColorUtils.bold("═══════════════════════════════════════"));
        System.out.println(ColorUtils.bold("      MENJALANKAN SKENARIO BEST CASE"));
        System.out.println(ColorUtils.bold("═══════════════════════════════════════\n"));

        BestCaseScenario scenario = new BestCaseScenario();
        System.out.println(scenario.getStory());
        System.out.println(scenario.getFlowDiagram());

        pauseForUser("Tekan ENTER untuk memulai simulasi...");

        engine.initialize(scenario);
        showBuildingStatus();

        System.out.println("\n📍 MENJALANKAN SIMULASI...\n");
        ScenarioResult result = engine.runToCompletion(true);

        System.out.println(result.getSummary());
        System.out.println("Rating: " + result.getRating());

        pauseForUser("\nTekan ENTER untuk kembali ke menu...");
    }

    /**
     * Menjalankan skenario Worst Case.
     */
    public void runWorstCaseScenario() {
        System.out.println("\n" + ColorUtils.bold("═══════════════════════════════════════"));
        System.out.println(ColorUtils.bold("      MENJALANKAN SKENARIO WORST CASE"));
        System.out.println(ColorUtils.bold("═══════════════════════════════════════\n"));

        WorstCaseScenario scenario = new WorstCaseScenario();
        System.out.println(scenario.getStory());
        System.out.println(scenario.getFlowDiagram());

        pauseForUser("Tekan ENTER untuk memulai simulasi...");

        engine.initialize(scenario);
        showBuildingStatus();

        System.out.println("\n📍 MENJALANKAN SIMULASI...\n");
        ScenarioResult result = engine.runToCompletion(true);

        System.out.println(result.getSummary());
        System.out.println("Rating: " + result.getRating());

        pauseForUser("\nTekan ENTER untuk kembali ke menu...");
    }

    /**
     * Menjalankan skenario Custom yang ditentukan user.
     */
    public void runCustomScenario() {
        System.out.println("\n" + ColorUtils.bold("═══════════════════════════════════════"));
        System.out.println(ColorUtils.bold("      🎮 SKENARIO CUSTOM"));
        System.out.println(ColorUtils.bold("═══════════════════════════════════════\n"));

        CustomScenario scenario = new CustomScenario();
        scenario.configureFromUserInput(scanner);

        System.out.println(scenario.getStory());

        pauseForUser("Tekan ENTER untuk memulai simulasi...");

        engine.initialize(scenario);
        showBuildingStatus();

        System.out.println("\n📍 MENJALANKAN SIMULASI...\n");
        ScenarioResult result = engine.runToCompletion(true);

        System.out.println(result.getSummary());
        System.out.println("Rating: " + result.getRating());

        pauseForUser("\nTekan ENTER untuk kembali ke menu...");
    }

    /**
     * Menjalankan skenario Bencana.
     */
    public void runDisasterScenario() {
        System.out.println("\n" + ColorUtils.bold("═══════════════════════════════════════"));
        System.out.println(ColorUtils.bold("      ⚠️ SKENARIO BENCANA"));
        System.out.println(ColorUtils.bold("═══════════════════════════════════════\n"));

        DisasterScenario scenario = new DisasterScenario();
        scenario.configureFromUserInput(scanner);

        System.out.println(scenario.getStory());

        pauseForUser("Tekan ENTER untuk memulai simulasi...");

        engine.initialize(scenario);
        showBuildingStatus();

        System.out.println("\n📍 MENJALANKAN SIMULASI...\n");

        // Tampilkan pesan bencana
        System.out.println("\n" + ColorUtils.bold("════════════════════════════════════════════════════════════"));
        System.out.println(
                ColorUtils.bold("  🚨 PERINGATAN: BENCANA AKAN TERJADI PADA DETIK KE-" + scenario.getDisasterTime()));
        System.out.println(ColorUtils.bold("════════════════════════════════════════════════════════════\n"));

        ScenarioResult result = engine.runToCompletion(true);

        // Tampilkan aksi bencana
        System.out.println("\n" + ColorUtils.bold("════════════════════════════════════════════════════════════"));
        System.out.println(ColorUtils.bold(scenario.getDisasterAction()));
        System.out.println(ColorUtils.bold("════════════════════════════════════════════════════════════\n"));

        System.out.println(result.getSummary());
        System.out.println("Rating: " + result.getRating());

        // Tampilkan protokol bencana
        showDisasterProtocol(scenario);

        pauseForUser("\nTekan ENTER untuk kembali ke menu...");
    }

    /**
     * Menampilkan protokol penanganan bencana.
     */
    private void showDisasterProtocol(DisasterScenario scenario) {
        System.out.println("\n╔══════════════════════════════════════════════════════════════════╗");
        System.out.println("║              📋 PROTOKOL PENANGANAN BENCANA                      ║");
        System.out.println("╠══════════════════════════════════════════════════════════════════╣");

        switch (scenario.getDisasterType()) {
            case POWER_OUTAGE:
                System.out.println("║  💡 PROSEDUR MATI LAMPU:                                        ║");
                System.out.println("║     1. Lift berhenti di posisi saat ini                         ║");
                System.out.println("║     2. Lampu darurat menyala otomatis                           ║");
                System.out.println("║     3. Intercom darurat diaktifkan                              ║");
                System.out.println("║     4. Tunggu listrik pulih atau evakuasi manual                ║");
                System.out.println("║     5. Setelah pulih, lift kembali ke lantai terdekat           ║");
                break;
            case FIRE:
                System.out.println("║  🔥 PROSEDUR KEBAKARAN:                                         ║");
                System.out.println("║     1. Alarm kebakaran berbunyi                                 ║");
                System.out.println("║     2. Semua lift turun ke Lantai 1 (Fire Recall)               ║");
                System.out.println("║     3. Pintu terbuka dan terkunci terbuka                       ║");
                System.out.println("║     4. Lift tidak beroperasi sampai reset manual                ║");
                System.out.println("║     5. Gunakan tangga darurat untuk evakuasi                    ║");
                break;
            case EARTHQUAKE:
                System.out.println("║  🌍 PROSEDUR GEMPA BUMI:                                        ║");
                System.out.println("║     1. Sensor seismik mendeteksi getaran                        ║");
                System.out.println("║     2. Lift berhenti di lantai TERDEKAT                         ║");
                System.out.println("║     3. Pintu terbuka otomatis                                   ║");
                System.out.println("║     4. Penumpang diminta keluar dan menggunakan tangga          ║");
                System.out.println("║     5. Lift diperiksa sebelum beroperasi kembali                ║");
                break;
            case FLOOD:
                System.out.println("║  🌊 PROSEDUR BANJIR:                                            ║");
                System.out.println("║     1. Sensor banjir mendeteksi air di lantai bawah             ║");
                System.out.println("║     2. Lift TIDAK boleh turun ke Lantai 1                       ║");
                System.out.println("║     3. Evakuasi ke lantai atas                                  ║");
                System.out.println("║     4. Lift beroperasi hanya di Lantai 2 dan 3                  ║");
                System.out.println("║     5. Tunggu air surut sebelum normal operation                ║");
                break;
            case CABLE_BREAK:
                System.out.println("║  🔗 PROSEDUR KABEL PUTUS (Automatic Safety System):             ║");
                System.out.println("║     1. Safety Governor mendeteksi kecepatan abnormal            ║");
                System.out.println("║     2. Sistem MEKANIK aktifkan rem cakram OTOMATIS              ║");
                System.out.println("║     3. Rem cakram MENJEPIT RAIL pemandu lift                    ║");
                System.out.println("║     4. Lift BERHENTI dalam hitungan DETIK                       ║");
                System.out.println("║     5. Buffer/peredam di dasar shaft sebagai cadangan           ║");
                System.out.println("║                                                                 ║");
                System.out.println("║  ⚡ PRINSIP FAIL-SAFE:                                          ║");
                System.out.println("║     Semua sistem bekerja 100% MEKANIS tanpa listrik!            ║");
                break;
        }

        System.out.println("╚══════════════════════════════════════════════════════════════════╝");
    }

    /**
     * Menjalankan kedua skenario untuk perbandingan.
     */
    public void runBothScenarios() {
        System.out.println("\n" + ColorUtils.bold("═══════════════════════════════════════"));
        System.out.println(ColorUtils.bold("      PERBANDINGAN SKENARIO"));
        System.out.println(ColorUtils.bold("═══════════════════════════════════════\n"));

        // Best Case
        BestCaseScenario bestCase = new BestCaseScenario();
        engine.initialize(bestCase);
        System.out.println("Menjalankan Best Case...");
        ScenarioResult bestResult = engine.runToCompletion(false);

        // Worst Case
        WorstCaseScenario worstCase = new WorstCaseScenario();
        engine.initialize(worstCase);
        System.out.println("Menjalankan Worst Case...");
        ScenarioResult worstResult = engine.runToCompletion(false);

        // Tampilkan perbandingan
        showComparison(bestResult, worstResult);

        pauseForUser("\nTekan ENTER untuk kembali ke menu...");
    }

    /**
     * Menampilkan perbandingan hasil.
     */
    private void showComparison(ScenarioResult best, ScenarioResult worst) {
        System.out.println("\n╔═══════════════════════════════════════════════════════════════════════╗");
        System.out.println("║                    📊 PERBANDINGAN SKENARIO                           ║");
        System.out.println("╠═══════════════════════════════════════════════════════════════════════╣");
        System.out.println("║                          │    BEST CASE    │   WORST CASE            ║");
        System.out.println("╠══════════════════════════╪═════════════════╪═════════════════════════╣");
        System.out.printf("║  Total Penumpang         │       %-10d│       %-18d║\n",
                best.getTotalPassengers(), worst.getTotalPassengers());
        System.out.printf("║  Waktu Simulasi          │    %-10d detik│    %-15d detik║\n",
                best.getTotalSimulationTime(), worst.getTotalSimulationTime());
        System.out.printf("║  Rata-rata Tunggu        │    %-10.1f detik│    %-15.1f detik║\n",
                best.getAverageWaitTime(), worst.getAverageWaitTime());
        System.out.printf("║  Waktu Tunggu Max        │    %-10d detik│    %-15d detik║\n",
                best.getMaxWaitTime(), worst.getMaxWaitTime());
        System.out.printf("║  Efisiensi               │       %-10.1f%%│       %-18.1f%%║\n",
                best.getEfficiency(), worst.getEfficiency());
        System.out.println("╠══════════════════════════╧═════════════════╧═════════════════════════╣");
        System.out.printf("║  Best Case Rating  : %-50s║\n", best.getRating());
        System.out.printf("║  Worst Case Rating : %-50s║\n", worst.getRating());
        System.out.println("╚═══════════════════════════════════════════════════════════════════════╝");
    }

    /**
     * Menampilkan status gedung saat ini.
     */
    public void showBuildingStatus() {
        Building building = engine.getBuilding();
        if (building == null) {
            System.out.println("Building belum diinisialisasi.");
            return;
        }

        System.out.println(building.getVisual());

        // Tampilkan status lift
        System.out.println("Status Lift:");
        for (Elevator e : building.getElevators()) {
            ElevatorDisplay display = new ElevatorDisplay(e);
            System.out.println("  " + display.getCompactView());
        }

        // Tampilkan penumpang menunggu
        System.out.println("\nPenumpang Menunggu:");
        for (Floor f : building.getFloors()) {
            List<Passenger> waiting = f.getWaitingPassengers();
            if (!waiting.isEmpty()) {
                System.out.println("  Lantai " + f.getNumber() + ": " + waiting.size() + " orang");
                for (Passenger p : waiting) {
                    System.out.println("    - " + p.toString());
                }
            }
        }
    }

    /**
     * Menampilkan diagram FSA.
     */
    public void showFSADiagram() {
        System.out.println("\n╔══════════════════════════════════════════════════════════════════╗");
        System.out.println("║              STATE-TRANSITION DIAGRAM (FSA)                      ║");
        System.out.println("╚══════════════════════════════════════════════════════════════════╝\n");

        System.out.println("🛗 ELEVATOR FSA:");
        System.out.println("═══════════════════════════════════════════════════════════════════");
        System.out.println();
        System.out.println("                           call_from_above");
        System.out.println("              ┌──────────────────────────────────────┐");
        System.out.println("              │                                      ▼");
        System.out.println("    ┌─────────┴─────────┐                  ┌─────────────────┐");
        System.out.println("    │                   │                  │                 │");
        System.out.println("    │       IDLE        │                  │   MOVING_UP     │");
        System.out.println("    │      (q0)         │                  │                 │");
        System.out.println("    │                   │                  └────────┬────────┘");
        System.out.println("    └─────────┬─────────┘                           │");
        System.out.println("              │                          arrived    │");
        System.out.println("              │ call_from_below                     │");
        System.out.println("              ▼                                     ▼");
        System.out.println("    ┌─────────────────┐                  ┌─────────────────┐");
        System.out.println("    │                 │                  │                 │");
        System.out.println("    │  MOVING_DOWN    │───arrived───────▶│  DOOR_OPENING   │");
        System.out.println("    │                 │                  │                 │");
        System.out.println("    └─────────────────┘                  └────────┬────────┘");
        System.out.println("                                                  │ fully_open");
        System.out.println("                                                  ▼");
        System.out.println("    ┌─────────────────┐                  ┌─────────────────┐");
        System.out.println("    │                 │◀──close_button───│                 │");
        System.out.println("    │  DOOR_CLOSING   │                  │   DOOR_OPEN     │");
        System.out.println("    │                 │                  │                 │");
        System.out.println("    └────────┬────────┘                  └─────────────────┘");
        System.out.println("             │ fully_closed");
        System.out.println("             ▼");
        System.out.println("    ┌─────────────────┐");
        System.out.println("    │                 │");
        System.out.println("    │    STOPPED      │──no_requests──▶ IDLE");
        System.out.println("    │   (Accept)      │");
        System.out.println("    └─────────────────┘");
        System.out.println();
        System.out.println("    ⚠️ EMERGENCY STATE:");
        System.out.println("    ┌─────────────────┐");
        System.out.println("    │                 │");
        System.out.println("    │   EMERGENCY     │◀── disaster_event ── (ANY STATE)");
        System.out.println("    │                 │");
        System.out.println("    └────────┬────────┘");
        System.out.println("             │ system_reset");
        System.out.println("             ▼");
        System.out.println("           IDLE");
        System.out.println();

        System.out.println("\n🚪 DOOR FSA:");
        System.out.println("═══════════════════════════════════════════════════════════════════");
        System.out.println();
        System.out.println("    ┌─────────────────┐   open_cmd   ┌─────────────────┐");
        System.out.println("    │                 │─────────────▶│                 │");
        System.out.println("    │     CLOSED      │              │    OPENING      │");
        System.out.println("    │     (q0)        │◀─fully_closed│                 │");
        System.out.println("    └─────────────────┘              └────────┬────────┘");
        System.out.println("              ▲                               │ fully_open");
        System.out.println("              │                               ▼");
        System.out.println("    ┌─────────┴───────┐              ┌─────────────────┐");
        System.out.println("    │                 │◀─close_cmd───│                 │");
        System.out.println("    │    CLOSING      │              │      OPEN       │");
        System.out.println("    │                 │──obstruction─│    (Accept)     │");
        System.out.println("    └─────────────────┘      │       └─────────────────┘");
        System.out.println("                             │              ▲");
        System.out.println("                             └──────────────┘");
        System.out.println();

        pauseForUser("\nTekan ENTER untuk kembali ke menu...");
    }

    /**
     * Menampilkan tabel transisi FSA.
     */
    public void showTransitionTable() {
        System.out.println("\n╔══════════════════════════════════════════════════════════════════╗");
        System.out.println("║                    NEXT-STATE TABLE (δ)                          ║");
        System.out.println("╚══════════════════════════════════════════════════════════════════╝\n");

        System.out.println("🛗 ELEVATOR TRANSITIONS:");
        System.out.println("╔═════════════════╤════════════════════════╤═════════════════╗");
        System.out.println("║  Current State  │         Event          │   Next State    ║");
        System.out.println("╠═════════════════╪════════════════════════╪═════════════════╣");
        System.out.println("║  IDLE           │  HAS_REQUEST_ABOVE     │  MOVING_UP      ║");
        System.out.println("║  IDLE           │  HAS_REQUEST_BELOW     │  MOVING_DOWN    ║");
        System.out.println("║  IDLE           │  BUTTON_OPEN_PRESSED   │  DOOR_OPENING   ║");
        System.out.println("║  MOVING_UP      │  ARRIVED_AT_FLOOR      │  DOOR_OPENING   ║");
        System.out.println("║  MOVING_DOWN    │  ARRIVED_AT_FLOOR      │  DOOR_OPENING   ║");
        System.out.println("║  DOOR_OPENING   │  DOOR_FULLY_OPEN       │  DOOR_OPEN      ║");
        System.out.println("║  DOOR_OPEN      │  BUTTON_CLOSE_PRESSED  │  DOOR_CLOSING   ║");
        System.out.println("║  DOOR_OPEN      │  TIMEOUT               │  DOOR_CLOSING   ║");
        System.out.println("║  DOOR_CLOSING   │  DOOR_FULLY_CLOSED     │  STOPPED        ║");
        System.out.println("║  DOOR_CLOSING   │  DOOR_OBSTRUCTION      │  DOOR_OPENING   ║");
        System.out.println("║  STOPPED        │  NO_REQUESTS           │  IDLE           ║");
        System.out.println("║  STOPPED        │  HAS_REQUEST_ABOVE     │  MOVING_UP      ║");
        System.out.println("║  STOPPED        │  HAS_REQUEST_BELOW     │  MOVING_DOWN    ║");
        System.out.println("╠═════════════════╪════════════════════════╪═════════════════╣");
        System.out.println("║  ⚠️ EMERGENCY TRANSITIONS:                                 ║");
        System.out.println("╠═════════════════╪════════════════════════╪═════════════════╣");
        System.out.println("║  ANY_STATE      │  POWER_OUTAGE          │  EMERGENCY      ║");
        System.out.println("║  ANY_STATE      │  FIRE_ALARM            │  EMERGENCY      ║");
        System.out.println("║  ANY_STATE      │  EARTHQUAKE            │  EMERGENCY      ║");
        System.out.println("║  ANY_STATE      │  FLOOD_DETECTED        │  EMERGENCY      ║");
        System.out.println("║  EMERGENCY      │  SYSTEM_RESET          │  IDLE           ║");
        System.out.println("╚═════════════════╧════════════════════════╧═════════════════╝");

        System.out.println("\n🚪 DOOR TRANSITIONS:");
        System.out.println("╔═════════════════╤════════════════════════╤═════════════════╗");
        System.out.println("║  Current State  │         Event          │   Next State    ║");
        System.out.println("╠═════════════════╪════════════════════════╪═════════════════╣");
        System.out.println("║  CLOSED         │  BUTTON_OPEN_PRESSED   │  OPENING        ║");
        System.out.println("║  CLOSED         │  ARRIVED_AT_FLOOR      │  OPENING        ║");
        System.out.println("║  OPENING        │  DOOR_FULLY_OPEN       │  OPEN           ║");
        System.out.println("║  OPEN           │  BUTTON_CLOSE_PRESSED  │  CLOSING        ║");
        System.out.println("║  OPEN           │  TIMEOUT               │  CLOSING        ║");
        System.out.println("║  CLOSING        │  DOOR_FULLY_CLOSED     │  CLOSED         ║");
        System.out.println("║  CLOSING        │  DOOR_OBSTRUCTION      │  OPENING        ║");
        System.out.println("║  CLOSING        │  BUTTON_OPEN_PRESSED   │  OPENING        ║");
        System.out.println("╚═════════════════╧════════════════════════╧═════════════════╝");

        System.out.println("\n📌 NOTASI FSA:");
        System.out.println("   Q (States)    = {IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPENING,");
        System.out.println("                    DOOR_OPEN, DOOR_CLOSING, STOPPED, EMERGENCY}");
        System.out.println("   Σ (Alphabet)  = {All Events listed above}");
        System.out.println("   q0 (Initial)  = IDLE");
        System.out.println("   F (Accepting) = {IDLE, STOPPED}");

        pauseForUser("\nTekan ENTER untuk kembali ke menu...");
    }

    /**
     * Pause dan tunggu user input.
     */
    private void pauseForUser(String message) {
        System.out.print(message);
        scanner.nextLine();
    }

    public SimulationEngine getEngine() {
        return engine;
    }
}
