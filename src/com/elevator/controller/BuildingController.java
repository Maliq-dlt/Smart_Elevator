package com.elevator.controller;

import com.elevator.model.building.Building;
import com.elevator.model.building.Floor;
import com.elevator.model.elevator.Direction;
import com.elevator.model.elevator.Elevator;
import com.elevator.model.elevator.ElevatorState;
import com.elevator.model.passenger.Passenger;
import com.elevator.model.passenger.PassengerRequest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller utama untuk mengelola seluruh gedung.
 * Koordinasi antara semua lift dan lantai.
 */
public class BuildingController {
    private final Building building;
    private final Map<String, ElevatorController> elevatorControllers;
    private final Scheduler scheduler;
    private final List<PassengerRequest> pendingRequests;
    private final List<Passenger> completedPassengers;
    private final List<String> systemLog;
    private long currentTime;

    public BuildingController(Building building) {
        this.building = building;
        this.elevatorControllers = new HashMap<>();
        this.scheduler = new Scheduler(Scheduler.Algorithm.NEAREST);
        this.pendingRequests = new ArrayList<>();
        this.completedPassengers = new ArrayList<>();
        this.systemLog = new ArrayList<>();
        this.currentTime = 0;

        // Inisialisasi controller untuk setiap lift
        for (Elevator e : building.getElevators()) {
            elevatorControllers.put(e.getId(), new ElevatorController(e));
        }
    }

    /**
     * Menambahkan penumpang baru ke sistem.
     * 
     * @param passenger penumpang
     */
    public void addPassenger(Passenger passenger) {
        Floor originFloor = building.getFloor(passenger.getOriginFloor());
        if (originFloor != null) {
            originFloor.addWaitingPassenger(passenger, currentTime);

            Direction direction = passenger.getDestinationFloor() > passenger.getOriginFloor()
                    ? Direction.UP
                    : Direction.DOWN;
            PassengerRequest request = new PassengerRequest(
                    passenger, passenger.getOriginFloor(), direction, currentTime);
            pendingRequests.add(request);

            log("Penumpang " + passenger.getName() + " menunggu di lantai " +
                    passenger.getOriginFloor() + " (tujuan: lantai " + passenger.getDestinationFloor() + ")");
        }
    }

    /**
     * Memproses satu step simulasi.
     * 
     * @return list aksi yang terjadi
     */
    public List<String> processStep() {
        List<String> actions = new ArrayList<>();
        currentTime++;

        // 1. Proses pending requests - assign ke lift
        actions.addAll(processRequests());

        // 2. Proses setiap lift
        for (ElevatorController controller : elevatorControllers.values()) {
            List<String> elevatorActions = controller.processStep(currentTime);
            actions.addAll(elevatorActions);

            // Cek apakah ada penumpang yang turun
            Elevator elevator = controller.getElevator();
            if (elevator.getState() == ElevatorState.DOOR_OPEN) {
                // Naikan penumpang yang menunggu
                actions.addAll(boardWaitingPassengers(controller));
            }
        }

        // 3. Update completed passengers
        updateCompletedPassengers();

        return actions;
    }

    private List<String> processRequests() {
        List<String> actions = new ArrayList<>();
        List<PassengerRequest> toRemove = new ArrayList<>();

        for (PassengerRequest request : pendingRequests) {
            if (request.isServed()) {
                continue;
            }

            // Pilih lift terbaik untuk request ini
            Elevator selectedElevator = scheduler.selectElevator(
                    building.getElevators(), request.getFloor(), request.getDirection());

            if (selectedElevator != null) {
                ElevatorController controller = elevatorControllers.get(selectedElevator.getId());
                controller.addFloorRequest(request.getFloor());
                request.markServed();

                actions.add("Lift " + selectedElevator.getName() +
                        " ditugaskan ke lantai " + request.getFloor());
            }
        }

        pendingRequests.removeAll(toRemove);
        return actions;
    }

    private List<String> boardWaitingPassengers(ElevatorController controller) {
        List<String> actions = new ArrayList<>();
        Elevator elevator = controller.getElevator();
        Floor floor = building.getFloor(elevator.getCurrentFloor());

        if (floor == null)
            return actions;

        // Ambil penumpang yang mau naik ke arah yang sama
        Direction elevatorDir = elevator.getDirection();
        if (elevatorDir == Direction.NONE) {
            elevatorDir = Direction.UP; // Default
        }

        List<Passenger> waiting = floor.getPassengersForDirection(elevatorDir);

        for (Passenger p : waiting) {
            if (!elevator.isFull()) {
                if (controller.boardPassenger(p, currentTime)) {
                    floor.removeWaitingPassenger(p);
                    actions.add(p.getName() + " naik ke Lift " + elevator.getName() +
                            " di lantai " + floor.getNumber());
                }
            } else {
                actions.add("Lift " + elevator.getName() + " penuh, " +
                        p.getName() + " harus menunggu");
                break;
            }
        }

        // Reset tombol lantai jika tidak ada lagi yang menunggu
        if (floor.getPassengersForDirection(elevatorDir).isEmpty()) {
            floor.resetButton(elevatorDir);
        }

        return actions;
    }

    private void updateCompletedPassengers() {
        for (Floor floor : building.getFloors()) {
            for (Elevator elevator : building.getElevators()) {
                // Penumpang yang sudah keluar sudah ditandai arrive() di ElevatorController
            }
        }
    }

    /**
     * Mengecek apakah simulasi selesai.
     * 
     * @return true jika tidak ada lagi penumpang yang menunggu atau dalam lift
     */
    public boolean isSimulationComplete() {
        // Cek pending requests
        for (PassengerRequest r : pendingRequests) {
            if (!r.isServed())
                return false;
        }

        // Cek penumpang menunggu di lantai
        if (building.getTotalWaitingPassengers() > 0)
            return false;

        // Cek penumpang dalam lift
        if (building.getTotalPassengersInElevators() > 0)
            return false;

        // Cek lift masih bergerak
        for (Elevator e : building.getElevators()) {
            if (!e.isIdle())
                return false;
        }

        return true;
    }

    private void log(String message) {
        systemLog.add("[" + formatTime(currentTime) + "] " + message);
    }

    private String formatTime(long seconds) {
        long mins = seconds / 60;
        long secs = seconds % 60;
        return String.format("%02d:%02d", mins, secs);
    }

    // Getters
    public Building getBuilding() {
        return building;
    }

    public Scheduler getScheduler() {
        return scheduler;
    }

    public long getCurrentTime() {
        return currentTime;
    }

    public void setCurrentTime(long time) {
        this.currentTime = time;
    }

    public List<String> getSystemLog() {
        return new ArrayList<>(systemLog);
    }

    public List<PassengerRequest> getPendingRequests() {
        return new ArrayList<>(pendingRequests);
    }

    /**
     * Mengecek apakah penumpang sudah ada di sistem.
     * 
     * @param passenger penumpang yang dicek
     * @return true jika penumpang sudah terdaftar
     */
    public boolean hasPassenger(Passenger passenger) {
        for (PassengerRequest request : pendingRequests) {
            if (request.getPassenger().equals(passenger)) {
                return true;
            }
        }
        return false;
    }

    public List<Passenger> getCompletedPassengers() {
        return new ArrayList<>(completedPassengers);
    }

    public ElevatorController getElevatorController(String elevatorId) {
        return elevatorControllers.get(elevatorId);
    }

    public Map<String, ElevatorController> getAllElevatorControllers() {
        return new HashMap<>(elevatorControllers);
    }
}
