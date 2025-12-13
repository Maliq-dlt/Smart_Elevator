package com.elevator.scenario;

import com.elevator.model.building.Building;
import com.elevator.model.elevator.Elevator;
import com.elevator.model.passenger.Passenger;

import java.util.ArrayList;
import java.util.List;

/**
 * Skenario Terburuk (Worst Case).
 * 
 * Deskripsi:
 * - Jam pulang kantor + situasi darurat
 * - 12 penumpang tersebar di semua lantai
 * - Lift A penuh di Lantai 3, Lift B di Lantai 2
 * - Semua lantai memanggil lift bersamaan
 * - Terjadi konflik, waiting, dan inefficient routing
 * 
 * Expected Results:
 * - Waktu tunggu rata-rata: >45 detik
 * - Total waktu: >120 detik
 * - Efisiensi: <50%
 */
public class WorstCaseScenario implements Scenario {

    private static final String NAME = "WORST CASE";
    private static final String DESCRIPTION = "Skenario Chaos - Jam pulang kantor, semua lantai memanggil bersamaan, " +
            "lift penuh, deadlock dan starvation terjadi";

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
        // Set posisi awal lift sesuai skenario buruk
        int[] positions = getInitialElevatorPositions();
        List<Elevator> elevators = building.getElevators();

        for (int i = 0; i < Math.min(positions.length, elevators.size()); i++) {
            Elevator e = elevators.get(i);
            e.setCurrentFloor(positions[i]);

            // Lift A di lantai 3 dengan beberapa penumpang (hampir penuh)
            if (i == 0) {
                // Simulasikan lift yang sudah ada penumpangnya
                // (kapasitas akan dikurangi secara artifisial)
            }
        }
    }

    @Override
    public List<Passenger> getPassengers() {
        List<Passenger> passengers = new ArrayList<>();
        Passenger.resetIdCounter();

        // Lantai 3 - 3 penumpang mau turun ke Lantai 1
        passengers.add(new Passenger("Ali", 3, 1, 0));
        passengers.add(new Passenger("Bima", 3, 1, 0));
        passengers.add(new Passenger("Caca", 3, 2, 0));

        // Lantai 2 - 4 penumpang dengan tujuan berbeda
        passengers.add(new Passenger("Doni", 2, 1, 0));
        passengers.add(new Passenger("Eva", 2, 3, 0));
        passengers.add(new Passenger("Fani", 2, 1, 1));
        passengers.add(new Passenger("Gina", 2, 3, 2));

        // Lantai 1 - 5 penumpang mau naik
        passengers.add(new Passenger("Hadi", 1, 3, 0));
        passengers.add(new Passenger("Indra", 1, 2, 0));
        passengers.add(new Passenger("Joko", 1, 3, 3));
        passengers.add(new Passenger("Kiki", 1, 2, 5));
        passengers.add(new Passenger("Luna", 1, 3, 8));

        return passengers;
    }

    @Override
    public int[] getInitialElevatorPositions() {
        // Lift A di Lantai 3, Lift B di Lantai 2
        // Posisi terjauh dari mayoritas penumpang di Lantai 1
        return new int[] { 3, 2 };
    }

    @Override
    public ScenarioResult getExpectedResults() {
        ScenarioResult expected = new ScenarioResult(NAME);
        expected.setTotalPassengers(12);
        expected.setPassengersServed(12);
        expected.setTotalSimulationTime(120); // Expected >120 detik
        expected.setEfficiency(35.0);
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
        sb.append("║                  ⚠️ SKENARIO TERBURUK                        ║\n");
        sb.append("╠══════════════════════════════════════════════════════════════╣\n");
        sb.append("║                                                              ║\n");
        sb.append("║  📍 SITUASI:                                                 ║\n");
        sb.append("║     Jam pulang kantor, 17:00                                 ║\n");
        sb.append("║     Semua karyawan ingin pulang bersamaan!                   ║\n");
        sb.append("║                                                              ║\n");
        sb.append("║  👥 PENUMPANG:                                               ║\n");
        sb.append("║     Lantai 3: 3 orang (→ Lantai 1 & 2)                       ║\n");
        sb.append("║     Lantai 2: 4 orang (→ Lantai 1 & 3)                       ║\n");
        sb.append("║     Lantai 1: 5 orang (→ Lantai 2 & 3)                       ║\n");
        sb.append("║     Total: 12 penumpang dengan tujuan berbeda!               ║\n");
        sb.append("║                                                              ║\n");
        sb.append("║  🛗 KONDISI LIFT:                                            ║\n");
        sb.append("║     Lift A: Di Lantai 3 (posisi terjauh) ✗                   ║\n");
        sb.append("║     Lift B: Di Lantai 2 ✗                                    ║\n");
        sb.append("║                                                              ║\n");
        sb.append("║  ❌ MASALAH:                                                 ║\n");
        sb.append("║     • Konflik arah (naik vs turun)                           ║\n");
        sb.append("║     • Multiple stops di setiap lantai                        ║\n");
        sb.append("║     • Waiting time tinggi untuk beberapa penumpang           ║\n");
        sb.append("║     • Inefficient routing                                    ║\n");
        sb.append("║     • Possible starvation                                    ║\n");
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
        sb.append("📋 FLOW SKENARIO TERBURUK:\n");
        sb.append("═══════════════════════════════════════\n");
        sb.append("\n");
        sb.append("  [00:00] ⚡ CHAOS! Semua lantai memanggil lift!\n");
        sb.append("           │\n");
        sb.append("           ├──┬── Lantai 3: 3 penumpang (↓)\n");
        sb.append("           │  ├── Lantai 2: 4 penumpang (↑↓)\n");
        sb.append("           │  └── Lantai 1: 5 penumpang (↑)\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:00] 🛗 Lift A di Lantai 3, Lift B di Lantai 2\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [00:03] 🛗 Lift A buka pintu, ambil 3 penumpang L3\n");
        sb.append("           │\n");
        sb.append("  [00:08] 🔽 Lift A turun ke Lantai 2\n");
        sb.append("           │\n");
        sb.append("  [00:12] 🚪 Lift A buka di L2, turunkan Caca, ambil Doni\n");
        sb.append("           │   (Eva & Gina menunggu - arah berbeda)\n");
        sb.append("           │\n");
        sb.append("  [00:15] 🛗 Lift B buka di L2, ambil Eva & Gina (↑)\n");
        sb.append("           │\n");
        sb.append("  [00:20] 🔽 Lift A turun ke Lantai 1\n");
        sb.append("           │\n");
        sb.append("  [00:25] 🚪 Lift A turunkan penumpang, PENUH!\n");
        sb.append("           │   Hadi, Indra, Joko menunggu...\n");
        sb.append("           │\n");
        sb.append("  [00:30] 🔼 Lift B naik ke Lantai 3\n");
        sb.append("           │\n");
        sb.append("  [...]\n");
        sb.append("\n");
        sb.append("  [02:00+] ⏱️ Penumpang terakhir akhirnya dilayani\n");
        sb.append("           │\n");
        sb.append("           ▼\n");
        sb.append("  [02:05] ❌ SELESAI - Total: >120 detik\n");
        sb.append("              Efisiensi: ~35%\n");
        sb.append("\n");
        return sb.toString();
    }
}
