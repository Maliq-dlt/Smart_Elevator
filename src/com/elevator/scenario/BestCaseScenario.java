package com.elevator.scenario;

import com.elevator.model.building.Building;
import com.elevator.model.elevator.Elevator;
import com.elevator.model.passenger.Passenger;

import java.util.ArrayList;
import java.util.List;

/**
 * Skenario Terbaik (Best Case).
 * 
 * Deskripsi:
 * - Rush hour pagi, karyawan datang kerja
 * - 5 penumpang dari Lantai 1 menuju Lantai 3
 * - Kedua lift idle di Lantai 1 (posisi optimal)
 * - Lift A langsung melayani tanpa waktu tunggu
 * - Perjalanan langsung tanpa berhenti di tengah
 * 
 * Expected Results:
 * - Waktu tunggu rata-rata: 0 detik
 * - Total waktu: ~15-20 detik
 * - Efisiensi: 100%
 */
public class BestCaseScenario implements Scenario {

    private static final String NAME = "BEST CASE";
    private static final String DESCRIPTION = "Skenario Optimal - Rush hour pagi, lift idle di posisi tepat, " +
            "semua penumpang dari satu lantai ke tujuan yang sama";

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public String getDescription() {
        return DESCRIPTION;
    }

    @Override
    public void setupBuilding(Building building) {
        // Set posisi awal lift sesuai skenario optimal
        int[] positions = getInitialElevatorPositions();
        List<Elevator> elevators = building.getElevators();

        for (int i = 0; i < Math.min(positions.length, elevators.size()); i++) {
            elevators.get(i).setCurrentFloor(positions[i]);
        }
    }

    @Override
    public List<Passenger> getPassengers() {
        List<Passenger> passengers = new ArrayList<>();
        Passenger.resetIdCounter();

        // 5 penumpang dari Lantai 1 ke Lantai 3
        // Semua request di waktu yang sama (t=0)
        passengers.add(new Passenger("Andi", 1, 3, 0));
        passengers.add(new Passenger("Budi", 1, 3, 0));
        passengers.add(new Passenger("Citra", 1, 3, 0));
        passengers.add(new Passenger("Dewi", 1, 3, 0));
        passengers.add(new Passenger("Eko", 1, 3, 0));

        return passengers;
    }

    @Override
    public int[] getInitialElevatorPositions() {
        // Kedua lift di Lantai 1 (posisi optimal)
        return new int[] { 1, 1 };
    }

    @Override
    public ScenarioResult getExpectedResults() {
        ScenarioResult expected = new ScenarioResult(NAME);
        expected.setTotalPassengers(5);
        expected.setPassengersServed(5);
        expected.setTotalSimulationTime(20); // Expected ~20 detik
        expected.setEfficiency(100.0);
        return expected;
    }

    /**
     * Mendapatkan detail story skenario untuk ditampilkan.
     * 
     * @return string story
     */
    public String getStory() {
        StringBuilder sb = new StringBuilder();
        sb.append("\n");
        sb.append("╔══════════════════════════════════════════════════════════════╗\n");
        sb.append("║                  🌟 SKENARIO TERBAIK                         ║\n");
        sb.append("╠══════════════════════════════════════════════════════════════╣\n");
        sb.append("║                                                              ║\n");
        sb.append("║  📍 SITUASI:                                                 ║\n");
        sb.append("║     Rush hour pagi hari, jam 08:00                           ║\n");
        sb.append("║     Karyawan baru datang kerja                               ║\n");
        sb.append("║                                                              ║\n");
        sb.append("║  👥 PENUMPANG:                                               ║\n");
        sb.append("║     5 orang karyawan di Lantai 1                             ║\n");
        sb.append("║     Semua ingin ke Lantai 3 (ruang meeting)                  ║\n");
        sb.append("║                                                              ║\n");
        sb.append("║  🛗 KONDISI LIFT:                                            ║\n");
        sb.append("║     Lift A: Idle di Lantai 1 ✓                               ║\n");
        sb.append("║     Lift B: Idle di Lantai 1 ✓                               ║\n");
        sb.append("║                                                              ║\n");
        sb.append("║  ✨ KEUNTUNGAN:                                              ║\n");
        sb.append("║     • Waktu tunggu = 0 detik                                 ║\n");
        sb.append("║     • Lift langsung tersedia                                 ║\n");
        sb.append("║     • Perjalanan langsung tanpa berhenti                     ║\n");
        sb.append("║     • Efisiensi maksimal 100%                                ║\n");
        sb.append("║                                                              ║\n");
        sb.append("╚══════════════════════════════════════════════════════════════╝\n");
        return sb.toString();
    }

    /**
     * Mendapatkan flow diagram skenario.
     * 
     * @return string flow
     */
    public String getFlowDiagram() {
        StringBuilder sb = new StringBuilder();
        sb.append("\n");
        sb.append("📋 FLOW SKENARIO TERBAIK:\n");
        sb.append("═══════════════════════════════════════\n");
        sb.append("\n");
        sb.append("  [00:00] 👥 5 penumpang memanggil lift di Lantai 1\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:00] 🛗 Lift A sudah di Lantai 1 (idle)\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:02] 🚪 Pintu Lift A terbuka\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:05] 👥 5 penumpang masuk Lift A\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:08] 🚪 Pintu Lift A tertutup\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:08] 🔼 Lift A naik (Lantai 1 → 3)\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:14] 🛗 Lift A tiba di Lantai 3\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:15] 🚪 Pintu terbuka\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:18] 👥 5 penumpang keluar\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:20] ✅ SELESAI - Total: 20 detik\n");
        sb.append("\n");
        return sb.toString();
    }
}
