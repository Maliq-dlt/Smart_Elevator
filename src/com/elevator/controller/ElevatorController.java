package com.elevator.controller;

import com.elevator.fsa.Event;
import com.elevator.model.elevator.Direction;
import com.elevator.model.elevator.Elevator;
import com.elevator.model.elevator.ElevatorState;
import com.elevator.model.passenger.Passenger;

import java.util.ArrayList;
import java.util.List;

/**
 * Controller untuk satu Elevator.
 * Mengatur operasi dan FSA lift.
 */
public class ElevatorController {
    private final Elevator elevator;
    private final List<Integer> floorRequests;
    private final List<String> actionLog;

    public ElevatorController(Elevator elevator) {
        this.elevator = elevator;
        this.floorRequests = new ArrayList<>();
        this.actionLog = new ArrayList<>();
    }

    /**
     * Menambahkan request ke lantai tertentu.
     * 
     * @param floor lantai tujuan
     */
    public void addFloorRequest(int floor) {
        if (!floorRequests.contains(floor) &&
                floor >= elevator.getMinFloor() &&
                floor <= elevator.getMaxFloor()) {
            floorRequests.add(floor);
            elevator.addRequest(floor);
            log("Request lantai " + floor + " ditambahkan");
        }
    }

    /**
     * Memproses satu step simulasi.
     * 
     * @param currentTime waktu simulasi saat ini
     * @return list aksi yang terjadi
     */
    public List<String> processStep(long currentTime) {
        List<String> actions = new ArrayList<>();
        ElevatorState state = elevator.getState();

        switch (state) {
            case IDLE:
                actions.addAll(processIdleState());
                break;
            case MOVING_UP:
            case MOVING_DOWN:
                actions.addAll(processMovingState());
                break;
            case DOOR_OPENING:
                actions.addAll(processDoorOpeningState());
                break;
            case DOOR_OPEN:
                actions.addAll(processDoorOpenState(currentTime));
                break;
            case DOOR_CLOSING:
                actions.addAll(processDoorClosingState());
                break;
            case STOPPED:
                actions.addAll(processStoppedState());
                break;
            default:
                break;
        }

        return actions;
    }

    private List<String> processIdleState() {
        List<String> actions = new ArrayList<>();

        if (!floorRequests.isEmpty()) {
            int nextFloor = floorRequests.get(0);
            int currentFloor = elevator.getCurrentFloor();

            if (nextFloor == currentFloor) {
                // Sudah di lantai tujuan, buka pintu
                elevator.openDoor();
                actions.add(elevator.getName() + ": Membuka pintu di lantai " + currentFloor);
            } else if (nextFloor > currentFloor) {
                elevator.setDirection(Direction.UP);
                elevator.getFSA().processEvent(Event.HAS_REQUEST_ABOVE);
                actions.add(elevator.getName() + ": Mulai naik dari lantai " + currentFloor);
            } else {
                elevator.setDirection(Direction.DOWN);
                elevator.getFSA().processEvent(Event.HAS_REQUEST_BELOW);
                actions.add(elevator.getName() + ": Mulai turun dari lantai " + currentFloor);
            }
        }

        return actions;
    }

    private List<String> processMovingState() {
        List<String> actions = new ArrayList<>();

        int nextFloor = floorRequests.isEmpty() ? -1 : floorRequests.get(0);
        int currentFloor = elevator.getCurrentFloor();

        if (nextFloor == -1) {
            elevator.setDirection(Direction.NONE);
            elevator.getFSA().processEvent(Event.NO_REQUESTS);
            return actions;
        }

        // Gerakkan lift
        if (elevator.getDirection() == Direction.UP) {
            elevator.setCurrentFloor(currentFloor + 1);
            actions.add(elevator.getName() + ": Naik ke lantai " + elevator.getCurrentFloor());
        } else if (elevator.getDirection() == Direction.DOWN) {
            elevator.setCurrentFloor(currentFloor - 1);
            actions.add(elevator.getName() + ": Turun ke lantai " + elevator.getCurrentFloor());
        }

        // Cek jika sampai di tujuan
        if (elevator.getCurrentFloor() == nextFloor) {
            elevator.getFSA().processEvent(Event.ARRIVED_AT_FLOOR);
            floorRequests.remove(0);
            actions.add(elevator.getName() + ": Tiba di lantai " + elevator.getCurrentFloor());
        }

        return actions;
    }

    private List<String> processDoorOpeningState() {
        List<String> actions = new ArrayList<>();
        elevator.completeDoorOpen();
        actions.add(elevator.getName() + ": Pintu terbuka sepenuhnya");
        return actions;
    }

    private List<String> processDoorOpenState(long currentTime) {
        List<String> actions = new ArrayList<>();

        // Turunkan penumpang yang tujuannya di sini
        List<Passenger> exiting = elevator.unloadPassengers();
        for (Passenger p : exiting) {
            p.arrive(currentTime);
            actions.add(elevator.getName() + ": " + p.getName() + " keluar");
        }

        // Tutup pintu setelah beberapa saat
        elevator.closeDoor();
        actions.add(elevator.getName() + ": Menutup pintu");

        return actions;
    }

    private List<String> processDoorClosingState() {
        List<String> actions = new ArrayList<>();
        elevator.completeDoorClose();
        actions.add(elevator.getName() + ": Pintu tertutup");
        return actions;
    }

    private List<String> processStoppedState() {
        List<String> actions = new ArrayList<>();

        if (floorRequests.isEmpty()) {
            elevator.getFSA().processEvent(Event.NO_REQUESTS);
            elevator.setDirection(Direction.NONE);
            actions.add(elevator.getName() + ": Kembali ke mode IDLE");
        } else {
            int nextFloor = floorRequests.get(0);
            int currentFloor = elevator.getCurrentFloor();

            if (nextFloor > currentFloor) {
                elevator.setDirection(Direction.UP);
                elevator.getFSA().processEvent(Event.HAS_REQUEST_ABOVE);
            } else if (nextFloor < currentFloor) {
                elevator.setDirection(Direction.DOWN);
                elevator.getFSA().processEvent(Event.HAS_REQUEST_BELOW);
            } else {
                // Request di lantai yang sama
                elevator.openDoor();
            }
        }

        return actions;
    }

    /**
     * Menaikan penumpang ke lift.
     * 
     * @param passenger   penumpang
     * @param currentTime waktu saat ini
     * @return true jika berhasil
     */
    public boolean boardPassenger(Passenger passenger, long currentTime) {
        if (elevator.getState() == ElevatorState.DOOR_OPEN && !elevator.isFull()) {
            if (elevator.boardPassenger(passenger)) {
                passenger.board(currentTime);
                addFloorRequest(passenger.getDestinationFloor());
                log(passenger.getName() + " naik ke " + elevator.getName());
                return true;
            }
        }
        return false;
    }

    private void log(String message) {
        actionLog.add("[" + elevator.getName() + "] " + message);
    }

    public Elevator getElevator() {
        return elevator;
    }

    public List<Integer> getFloorRequests() {
        return new ArrayList<>(floorRequests);
    }

    public List<String> getActionLog() {
        return new ArrayList<>(actionLog);
    }

    public void clearActionLog() {
        actionLog.clear();
    }
}
