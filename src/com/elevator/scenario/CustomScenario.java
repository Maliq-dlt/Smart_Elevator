package com.elevator.scenario;

import com.elevator.model.building.Building;
import com.elevator.model.elevator.Elevator;
import com.elevator.model.passenger.Passenger;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

/**
 * Skenario Custom yang ditentukan oleh user.
 * User dapat menentukan:
 * - Jumlah penumpang
 * - Lantai asal setiap penumpang
 * - Lantai tujuan setiap penumpang
 * - Posisi awal lift
 */
public class CustomScenario implements Scenario {

    private static final String NAME = "CUSTOM SCENARIO";
    private String description;
    private List<Passenger> passengers;
    private int[] elevatorPositions;
    private Scanner scanner;

    public CustomScenario() {
        this.passengers = new ArrayList<>();
        this.elevatorPositions = new int[] { 1, 1 }; // Default
        this.description = "Skenario yang ditentukan oleh user";
    }

    /**
     * Meminta input dari user untuk membuat skenario custom.
     * 
     * @param scanner Scanner untuk input
     */
    public void configureFromUserInput(Scanner scanner) {
        this.scanner = scanner;
        Passenger.resetIdCounter();
        passengers.clear();

        System.out.println("\n╔══════════════════════════════════════════════════════════════════╗");
        System.out.println("║              🎮 KONFIGURASI SKENARIO CUSTOM                      ║");
        System.out.println("╚══════════════════════════════════════════════════════════════════╝\n");

        // Konfigurasi posisi awal lift
        configureElevatorPositions();

        // Konfigurasi penumpang
        configurePassengers();

        // Tampilkan ringkasan
        showSummary();
    }

    /**
     * Konfigurasi posisi awal lift.
     */
    private void configureElevatorPositions() {
        System.out.println("═══════════════════════════════════════════════════════════════════");
        System.out.println("           📍 POSISI AWAL LIFT");
        System.out.println("═══════════════════════════════════════════════════════════════════\n");

        // Lift A
        System.out.print("Posisi awal Lift A (lantai 1-3) [default: 1]: ");
        String inputA = scanner.nextLine().trim();
        int posA = parseFloor(inputA, 1);
        elevatorPositions[0] = posA;

        // Lift B
        System.out.print("Posisi awal Lift B (lantai 1-3) [default: 1]: ");
        String inputB = scanner.nextLine().trim();
        int posB = parseFloor(inputB, 1);
        elevatorPositions[1] = posB;

        System.out.println("\n✓ Lift A akan mulai di Lantai " + posA);
        System.out.println("✓ Lift B akan mulai di Lantai " + posB);
        System.out.println();
    }

    /**
     * Konfigurasi penumpang.
     */
    private void configurePassengers() {
        System.out.println("═══════════════════════════════════════════════════════════════════");
        System.out.println("           👥 KONFIGURASI PENUMPANG");
        System.out.println("═══════════════════════════════════════════════════════════════════\n");

        System.out.println("ℹ️ Kapasitas maksimal lift: 630 kg (±8-9 orang)\n");

        // Jumlah penumpang
        System.out.print("Berapa jumlah penumpang? (1-20) [default: 3]: ");
        String countInput = scanner.nextLine().trim();
        int count = 3;
        try {
            if (!countInput.isEmpty()) {
                count = Integer.parseInt(countInput);
                count = Math.max(1, Math.min(20, count));
            }
        } catch (NumberFormatException e) {
            count = 3;
        }

        System.out.println("\nMasukkan detail untuk " + count + " penumpang:\n");

        double totalWeight = 0;
        for (int i = 1; i <= count; i++) {
            System.out.println("--- Penumpang " + i + " ---");

            // Nama (opsional)
            System.out.print("  Nama [default: Penumpang" + i + "]: ");
            String name = scanner.nextLine().trim();
            if (name.isEmpty()) {
                name = "Penumpang" + i;
            }

            // Berat badan
            System.out.print("  Berat badan (kg, 30-150) [default: 70]: ");
            String weightInput = scanner.nextLine().trim();
            double weight = 70.0;
            try {
                if (!weightInput.isEmpty()) {
                    weight = Double.parseDouble(weightInput);
                    weight = Math.max(30, Math.min(150, weight));
                }
            } catch (NumberFormatException e) {
                weight = 70.0;
            }
            totalWeight += weight;

            // Lantai asal
            System.out.print("  Lantai asal (1-3): ");
            String originInput = scanner.nextLine().trim();
            int origin = parseFloor(originInput, 1);

            // Lantai tujuan (harus berbeda dengan asal)
            int destination = origin;
            while (destination == origin) {
                System.out.print("  Lantai tujuan (1-3, berbeda dari asal): ");
                String destInput = scanner.nextLine().trim();
                destination = parseFloor(destInput, origin == 1 ? 3 : 1);
                if (destination == origin) {
                    System.out.println("  ⚠ Tujuan harus berbeda dari asal!");
                }
            }

            // Waktu request (opsional, untuk simulasi delay)
            System.out.print("  Waktu request (detik, 0-60) [default: 0]: ");
            String timeInput = scanner.nextLine().trim();
            long requestTime = 0;
            try {
                if (!timeInput.isEmpty()) {
                    requestTime = Long.parseLong(timeInput);
                    requestTime = Math.max(0, Math.min(60, requestTime));
                }
            } catch (NumberFormatException e) {
                requestTime = 0;
            }

            Passenger passenger = new Passenger(name, origin, destination, requestTime, weight);
            passengers.add(passenger);

            System.out.println("  ✓ " + name + " (" + weight + "kg): L" + origin + " → L" + destination +
                    " (t=" + requestTime + "s)\n");
        }

        // Peringatan overload jika total berat melebihi kapasitas
        if (totalWeight > 630) {
            System.out.println("⚠️ PERINGATAN: Total berat penumpang (" + totalWeight +
                    " kg) MELEBIHI kapasitas lift (630 kg)!");
            System.out.println("   Lift mungkin akan menolak sebagian penumpang.\n");
        } else {
            System.out.println("📊 Total berat penumpang: " + totalWeight + " kg (kapasitas: 630 kg)\n");
        }
    }

    /**
     * Parse input lantai dengan validasi.
     */
    private int parseFloor(String input, int defaultValue) {
        if (input.isEmpty()) {
            return defaultValue;
        }
        try {
            int floor = Integer.parseInt(input);
            return Math.max(1, Math.min(3, floor));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * Tampilkan ringkasan konfigurasi.
     */
    private void showSummary() {
        System.out.println("\n═══════════════════════════════════════════════════════════════════");
        System.out.println("           📋 RINGKASAN SKENARIO CUSTOM");
        System.out.println("═══════════════════════════════════════════════════════════════════\n");

        System.out.println("🛗 Posisi Awal Lift:");
        System.out.println("   • Lift A: Lantai " + elevatorPositions[0]);
        System.out.println("   • Lift B: Lantai " + elevatorPositions[1]);
        System.out.println();

        System.out.println("👥 Daftar Penumpang (" + passengers.size() + " orang):");
        for (Passenger p : passengers) {
            String direction = p.getDestinationFloor() > p.getOriginFloor() ? "↑" : "↓";
            System.out.println("   • " + p.getName() + ": L" + p.getOriginFloor() +
                    " " + direction + " L" + p.getDestinationFloor() +
                    " (t=" + p.getRequestTime() + "s)");
        }
        System.out.println();

        this.description = "Skenario custom dengan " + passengers.size() + " penumpang";
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public String getDescription() {
        return description;
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
        // Return copy of passengers with fresh state including weight
        List<Passenger> result = new ArrayList<>();
        Passenger.resetIdCounter();
        for (Passenger p : passengers) {
            result.add(new Passenger(p.getName(), p.getOriginFloor(),
                    p.getDestinationFloor(), p.getRequestTime(), p.getWeight()));
        }
        return result;
    }

    @Override
    public int[] getInitialElevatorPositions() {
        return elevatorPositions.clone();
    }

    @Override
    public ScenarioResult getExpectedResults() {
        ScenarioResult expected = new ScenarioResult(NAME);
        expected.setTotalPassengers(passengers.size());
        return expected;
    }

    /**
     * Mendapatkan story untuk skenario ini.
     */
    public String getStory() {
        StringBuilder sb = new StringBuilder();
        sb.append("\n╔══════════════════════════════════════════════════════════════╗\n");
        sb.append("║                  🎮 SKENARIO CUSTOM                           ║\n");
        sb.append("╠══════════════════════════════════════════════════════════════╣\n");
        sb.append("║                                                              ║\n");
        sb.append("║  Skenario yang Anda tentukan sendiri!                        ║\n");
        sb.append(String.format("║  Total penumpang: %-40d ║\n", passengers.size()));
        sb.append("║                                                              ║\n");
        sb.append("╚══════════════════════════════════════════════════════════════╝\n");
        return sb.toString();
    }
}
