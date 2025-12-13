package com.elevator.simulation;

import com.elevator.controller.BuildingController;
import com.elevator.model.building.Building;
import com.elevator.model.elevator.Elevator;
import com.elevator.model.passenger.Passenger;
import com.elevator.scenario.BestCaseScenario;
import com.elevator.scenario.Scenario;
import com.elevator.scenario.ScenarioResult;
import com.elevator.scenario.WorstCaseScenario;

import java.util.ArrayList;
import java.util.List;

/**
 * Mesin Simulasi untuk menjalankan skenario lift.
 */
public class SimulationEngine {
    private Building building;
    private BuildingController controller;
    private SimulationClock clock;
    private Scenario currentScenario;
    private ScenarioResult result;
    private List<SimulationEvent> eventLog;
    private List<Passenger> allPassengers;
    private boolean running;
    private boolean completed;

    // Konstanta simulasi
    private static final int MAX_SIMULATION_TIME = 300; // 5 menit max
    private static final int ELEVATOR_CAPACITY = 5;
    private static final int TOTAL_FLOORS = 3;

    public SimulationEngine() {
        this.eventLog = new ArrayList<>();
        this.allPassengers = new ArrayList<>();
        this.running = false;
        this.completed = false;
    }

    /**
     * Inisialisasi simulasi dengan skenario tertentu.
     * 
     * @param scenario skenario yang akan dijalankan
     */
    public void initialize(Scenario scenario) {
        this.currentScenario = scenario;
        this.clock = new SimulationClock(1);
        this.eventLog.clear();
        this.allPassengers.clear();
        this.completed = false;

        // Buat gedung dengan 3 lantai
        this.building = new Building("Smart Building", TOTAL_FLOORS);

        // Tambahkan 2 lift (A dan B)
        Elevator liftA = new Elevator("A", "A", 1, TOTAL_FLOORS, ELEVATOR_CAPACITY);
        Elevator liftB = new Elevator("B", "B", 1, TOTAL_FLOORS, ELEVATOR_CAPACITY);
        building.addElevator(liftA);
        building.addElevator(liftB);

        // Setup posisi awal lift dari skenario
        scenario.setupBuilding(building);

        // Buat controller
        this.controller = new BuildingController(building);

        // Setup result
        this.result = new ScenarioResult(scenario.getName());

        // Ambil penumpang dari skenario
        this.allPassengers = scenario.getPassengers();
        result.setTotalPassengers(allPassengers.size());

        logEvent("Simulasi diinisialisasi: " + scenario.getName(),
                SimulationEvent.EventType.SYSTEM_INFO);
    }

    /**
     * Menjalankan simulasi selangkah.
     * 
     * @return list event yang terjadi
     */
    public List<String> step() {
        List<String> actions = new ArrayList<>();

        if (completed) {
            return actions;
        }

        clock.tick();
        long currentTime = clock.getCurrentTime();
        controller.setCurrentTime(currentTime);

        // Tambahkan penumpang yang request di waktu ini atau sebelumnya (yang belum
        // diproses)
        for (Passenger p : allPassengers) {
            if (p.getRequestTime() <= currentTime &&
                    p.getState() == Passenger.PassengerState.WAITING &&
                    !controller.hasPassenger(p)) {
                controller.addPassenger(p);
                logEvent(p.getName() + " memanggil lift di Lantai " + p.getOriginFloor(),
                        SimulationEvent.EventType.PASSENGER_ARRIVAL, p.getName());
                actions.add("[" + clock.getFormattedTime() + "] " +
                        p.getName() + " menunggu di Lantai " + p.getOriginFloor());
            }
        }

        // Proses step controller
        List<String> controllerActions = controller.processStep();
        for (String action : controllerActions) {
            actions.add("[" + clock.getFormattedTime() + "] " + action);
            logEvent(action, SimulationEvent.EventType.SYSTEM_INFO);
        }

        // Update statistik
        updateStatistics();

        // Cek apakah simulasi selesai
        if (isSimulationComplete() || currentTime >= MAX_SIMULATION_TIME) {
            completed = true;
            finalizeResults();
        }

        return actions;
    }

    /**
     * Menjalankan simulasi sampai selesai.
     * 
     * @param printProgress true untuk print progress
     * @return hasil simulasi
     */
    public ScenarioResult runToCompletion(boolean printProgress) {
        clock.start();
        running = true;

        while (!completed && clock.getCurrentTime() < MAX_SIMULATION_TIME) {
            List<String> actions = step();

            if (printProgress && !actions.isEmpty()) {
                for (String action : actions) {
                    System.out.println(action);
                }
            }
        }

        clock.stop();
        running = false;

        return result;
    }

    /**
     * Menampilkan visualisasi gedung dengan status lift.
     */
    private void displayBuildingVisual(String title) {
        if (building == null || building.getElevators().size() < 2)
            return;

        Elevator liftA = building.getElevators().get(0);
        Elevator liftB = building.getElevators().get(1);

        StringBuilder sb = new StringBuilder();
        sb.append("\n+----------------------------------------------------------+\n");
        sb.append("|  ").append(String.format("%-54s", title)).append(" |\n");
        sb.append("+----------------------------------------------------------+\n");

        // Gambar gedung 3 lantai
        for (int floor = 3; floor >= 1; floor--) {
            String liftAVisual = getLiftVisual(liftA, floor);
            String liftBVisual = getLiftVisual(liftB, floor);

            sb.append("|  LANTAI ").append(floor).append(" ");
            sb.append(getFloorButtons(floor));
            sb.append(" | ").append(liftAVisual);
            sb.append(" | ").append(liftBVisual);
            sb.append(" |           |\n");
        }

        sb.append("+----------------------------------------------------------+\n");
        sb.append("|  Lift A: ").append(getStatusText(liftA));
        sb.append("  |  Lift B: ").append(getStatusText(liftB)).append("     |\n");
        sb.append("+----------------------------------------------------------+\n");

        System.out.println(sb.toString());
    }

    /**
     * Mendapatkan visual lift di lantai tertentu.
     */
    private String getLiftVisual(Elevator elevator, int floor) {
        if (elevator.getCurrentFloor() != floor) {
            return "  ||  "; // Shaft kosong
        }

        // Lift ada di lantai ini
        String state = elevator.getState().toString();
        int passengers = elevator.getPassengerCount();

        if (state.contains("IDLE")) {
            return "[*" + passengers + "*]";
        } else if (state.contains("MOVING_UP")) {
            return "[^" + passengers + "^]";
        } else if (state.contains("MOVING_DOWN")) {
            return "[v" + passengers + "v]";
        } else if (state.contains("DOOR")) {
            return "[ " + passengers + " ]";
        } else if (state.contains("EMERGENCY")) {
            return "[!" + passengers + "!]";
        } else {
            return "[#" + passengers + "#]";
        }
    }

    /**
     * Mendapatkan tombol lantai.
     */
    private String getFloorButtons(int floor) {
        String up = floor < 3 ? "^" : " ";
        String down = floor > 1 ? "v" : " ";
        return "[" + up + down + "]";
    }

    /**
     * Mendapatkan text status lift.
     */
    private String getStatusText(Elevator elevator) {
        String dir;
        switch (elevator.getDirection()) {
            case UP:
                dir = "^";
                break;
            case DOWN:
                dir = "v";
                break;
            default:
                dir = "-";
                break;
        }
        return String.format("L%d%s %dP",
                elevator.getCurrentFloor(), dir, elevator.getPassengerCount());
    }

    /**
     * Mengecek apakah ada aksi penting.
     */
    private boolean hasImportantAction(List<String> actions) {
        for (String action : actions) {
            if (action.contains("tiba") || action.contains("naik") ||
                    action.contains("turun") || action.contains("sampai")) {
                return true;
            }
        }
        return false;
    }

    /**
     * Mengecek apakah simulasi selesai.
     */
    private boolean isSimulationComplete() {
        // Semua penumpang sudah sampai
        for (Passenger p : allPassengers) {
            if (p.getState() != Passenger.PassengerState.ARRIVED) {
                // Cek jika masih menunggu atau dalam lift
                if (p.getState() == Passenger.PassengerState.WAITING ||
                        p.getState() == Passenger.PassengerState.IN_ELEVATOR) {
                    return false;
                }
            }
        }

        return controller.isSimulationComplete();
    }

    /**
     * Update statistik sementara.
     */
    private void updateStatistics() {
        for (Passenger p : allPassengers) {
            if (p.getState() == Passenger.PassengerState.ARRIVED && p.getArrivalTime() > 0) {
                // Sudah dihitung, skip
            }
        }
    }

    /**
     * Finalisasi hasil simulasi.
     */
    private void finalizeResults() {
        result.setTotalSimulationTime(clock.getCurrentTime());

        int served = 0;
        for (Passenger p : allPassengers) {
            if (p.getState() == Passenger.PassengerState.ARRIVED) {
                served++;
                result.addWaitTime(p.getWaitTime());
                result.addTravelTime(p.getTravelTime());
            }
        }
        result.setPassengersServed(served);

        // Hitung penggunaan lift
        for (Elevator e : building.getElevators()) {
            result.recordElevatorUsage("Lift " + e.getName());
        }

        result.calculateEfficiency();

        logEvent("Simulasi selesai. Total waktu: " + clock.getFormattedTime(),
                SimulationEvent.EventType.SYSTEM_INFO);
    }

    private void logEvent(String description, SimulationEvent.EventType type) {
        eventLog.add(new SimulationEvent(clock.getCurrentTime(), description, type));
    }

    private void logEvent(String description, SimulationEvent.EventType type, String source) {
        eventLog.add(new SimulationEvent(clock.getCurrentTime(), description, type, source));
    }

    // Getters
    public Building getBuilding() {
        return building;
    }

    public BuildingController getController() {
        return controller;
    }

    public SimulationClock getClock() {
        return clock;
    }

    public Scenario getCurrentScenario() {
        return currentScenario;
    }

    public ScenarioResult getResult() {
        return result;
    }

    public List<SimulationEvent> getEventLog() {
        return new ArrayList<>(eventLog);
    }

    public List<Passenger> getAllPassengers() {
        return new ArrayList<>(allPassengers);
    }

    public boolean isRunning() {
        return running;
    }

    public boolean isCompleted() {
        return completed;
    }

    /**
     * Factory method untuk membuat skenario.
     * 
     * @param type "best" atau "worst"
     * @return Scenario instance
     */
    public static Scenario createScenario(String type) {
        if ("best".equalsIgnoreCase(type)) {
            return new BestCaseScenario();
        } else if ("worst".equalsIgnoreCase(type)) {
            return new WorstCaseScenario();
        }
        return new BestCaseScenario(); // Default
    }
}
