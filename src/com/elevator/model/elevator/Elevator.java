package com.elevator.model.elevator;

import com.elevator.fsa.Event;
import com.elevator.fsa.FiniteStateAutomaton;
import com.elevator.model.passenger.Passenger;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

/**
 * Class untuk merepresentasikan Lift (Elevator).
 * Lift memiliki FSA internal, pintu, posisi, arah, dan daftar penumpang.
 */
public class Elevator {
    private final String id;
    private final String name;
    private final FiniteStateAutomaton fsa;
    private final Door door;
    private int currentFloor;
    private Direction direction;
    private final List<Passenger> passengers;
    private final Queue<Integer> requestQueue;
    private final int maxCapacity;
    private final int minFloor;
    private final int maxFloor;

    // Timing constants (dalam detik simulasi)
    public static final int FLOOR_TRAVEL_TIME = 3; // Waktu per lantai
    public static final int DOOR_OPEN_TIME = 2; // Waktu buka pintu
    public static final int DOOR_CLOSE_TIME = 2; // Waktu tutup pintu
    public static final int PASSENGER_BOARD_TIME = 1; // Waktu per penumpang naik/turun

    public Elevator(String id, String name, int minFloor, int maxFloor, int maxCapacity) {
        this.id = id;
        this.name = name;
        this.minFloor = minFloor;
        this.maxFloor = maxFloor;
        this.maxCapacity = maxCapacity;
        this.currentFloor = minFloor;
        this.direction = Direction.NONE;
        this.passengers = new ArrayList<>();
        this.requestQueue = new LinkedList<>();
        this.door = new Door();
        this.fsa = createElevatorFSA();
    }

    /**
     * Membuat FSA untuk lift.
     * 
     * @return FSA lift
     */
    private FiniteStateAutomaton createElevatorFSA() {
        FiniteStateAutomaton elevatorFSA = new FiniteStateAutomaton("Elevator " + name + " FSA", ElevatorState.IDLE);

        // Dari IDLE
        elevatorFSA.addTransition(ElevatorState.IDLE, Event.HAS_REQUEST_ABOVE, ElevatorState.MOVING_UP);
        elevatorFSA.addTransition(ElevatorState.IDLE, Event.HAS_REQUEST_BELOW, ElevatorState.MOVING_DOWN);
        elevatorFSA.addTransition(ElevatorState.IDLE, Event.BUTTON_OPEN_PRESSED, ElevatorState.DOOR_OPENING);
        elevatorFSA.addTransition(ElevatorState.IDLE, Event.ARRIVED_AT_FLOOR, ElevatorState.DOOR_OPENING);

        // Dari MOVING_UP
        elevatorFSA.addTransition(ElevatorState.MOVING_UP, Event.ARRIVED_AT_FLOOR, ElevatorState.DOOR_OPENING);
        elevatorFSA.addTransition(ElevatorState.MOVING_UP, Event.EMERGENCY_STOP, ElevatorState.EMERGENCY);

        // Dari MOVING_DOWN
        elevatorFSA.addTransition(ElevatorState.MOVING_DOWN, Event.ARRIVED_AT_FLOOR, ElevatorState.DOOR_OPENING);
        elevatorFSA.addTransition(ElevatorState.MOVING_DOWN, Event.EMERGENCY_STOP, ElevatorState.EMERGENCY);

        // Dari DOOR_OPENING
        elevatorFSA.addTransition(ElevatorState.DOOR_OPENING, Event.DOOR_FULLY_OPEN, ElevatorState.DOOR_OPEN);

        // Dari DOOR_OPEN
        elevatorFSA.addTransition(ElevatorState.DOOR_OPEN, Event.BUTTON_CLOSE_PRESSED, ElevatorState.DOOR_CLOSING);
        elevatorFSA.addTransition(ElevatorState.DOOR_OPEN, Event.TIMEOUT, ElevatorState.DOOR_CLOSING);
        elevatorFSA.addTransition(ElevatorState.DOOR_OPEN, Event.PASSENGER_ENTERED, ElevatorState.DOOR_OPEN);
        elevatorFSA.addTransition(ElevatorState.DOOR_OPEN, Event.PASSENGER_EXITED, ElevatorState.DOOR_OPEN);

        // Dari DOOR_CLOSING
        elevatorFSA.addTransition(ElevatorState.DOOR_CLOSING, Event.DOOR_FULLY_CLOSED, ElevatorState.STOPPED);
        elevatorFSA.addTransition(ElevatorState.DOOR_CLOSING, Event.DOOR_OBSTRUCTION, ElevatorState.DOOR_OPENING);
        elevatorFSA.addTransition(ElevatorState.DOOR_CLOSING, Event.BUTTON_OPEN_PRESSED, ElevatorState.DOOR_OPENING);

        // Dari STOPPED
        elevatorFSA.addTransition(ElevatorState.STOPPED, Event.NO_REQUESTS, ElevatorState.IDLE);
        elevatorFSA.addTransition(ElevatorState.STOPPED, Event.HAS_REQUEST_ABOVE, ElevatorState.MOVING_UP);
        elevatorFSA.addTransition(ElevatorState.STOPPED, Event.HAS_REQUEST_BELOW, ElevatorState.MOVING_DOWN);

        // Dari EMERGENCY
        elevatorFSA.addTransition(ElevatorState.EMERGENCY, Event.SYSTEM_RESET, ElevatorState.IDLE);

        return elevatorFSA;
    }

    /**
     * Menambahkan request lantai ke queue.
     * 
     * @param floor lantai tujuan
     * @return true jika berhasil ditambahkan
     */
    public boolean addRequest(int floor) {
        if (floor < minFloor || floor > maxFloor) {
            return false;
        }
        if (!requestQueue.contains(floor)) {
            requestQueue.add(floor);
            return true;
        }
        return false;
    }

    /**
     * Memproses request berikutnya.
     * 
     * @return lantai tujuan berikutnya, atau -1 jika tidak ada
     */
    public int getNextDestination() {
        return requestQueue.isEmpty() ? -1 : requestQueue.peek();
    }

    /**
     * Menggerakkan lift ke arah tujuan.
     * 
     * @return true jika lift bergerak
     */
    public boolean move() {
        if (!door.isClosed()) {
            return false;
        }

        int destination = getNextDestination();
        if (destination == -1) {
            direction = Direction.NONE;
            return false;
        }

        if (destination > currentFloor) {
            direction = Direction.UP;
            fsa.processEvent(Event.HAS_REQUEST_ABOVE);
            currentFloor++;
        } else if (destination < currentFloor) {
            direction = Direction.DOWN;
            fsa.processEvent(Event.HAS_REQUEST_BELOW);
            currentFloor--;
        }

        // Cek jika sudah sampai
        if (currentFloor == destination) {
            requestQueue.poll();
            fsa.processEvent(Event.ARRIVED_AT_FLOOR);
            return true;
        }

        return true;
    }

    /**
     * Menambahkan penumpang ke lift.
     * 
     * @param passenger penumpang yang masuk
     * @return true jika berhasil
     */
    public boolean boardPassenger(Passenger passenger) {
        if (passengers.size() >= maxCapacity) {
            return false;
        }
        if (!door.isOpen()) {
            return false;
        }
        passengers.add(passenger);
        fsa.processEvent(Event.PASSENGER_ENTERED);
        return true;
    }

    /**
     * Menurunkan penumpang yang tujuannya di lantai saat ini.
     * 
     * @return list penumpang yang turun
     */
    public List<Passenger> unloadPassengers() {
        List<Passenger> exiting = new ArrayList<>();
        passengers.removeIf(p -> {
            if (p.getDestinationFloor() == currentFloor) {
                exiting.add(p);
                fsa.processEvent(Event.PASSENGER_EXITED);
                return true;
            }
            return false;
        });
        return exiting;
    }

    /**
     * Membuka pintu lift.
     */
    public void openDoor() {
        door.open();
        fsa.processEvent(Event.BUTTON_OPEN_PRESSED);
    }

    /**
     * Menutup pintu lift.
     */
    public void closeDoor() {
        door.close();
        fsa.processEvent(Event.BUTTON_CLOSE_PRESSED);
    }

    /**
     * Menyelesaikan proses buka pintu.
     */
    public void completeDoorOpen() {
        door.completeOpening();
        fsa.processEvent(Event.DOOR_FULLY_OPEN);
    }

    /**
     * Menyelesaikan proses tutup pintu.
     */
    public void completeDoorClose() {
        door.completeClosing();
        fsa.processEvent(Event.DOOR_FULLY_CLOSED);
    }

    /**
     * Mengecek apakah lift penuh.
     * 
     * @return true jika penuh
     */
    public boolean isFull() {
        return passengers.size() >= maxCapacity;
    }

    /**
     * Mengecek apakah lift kosong.
     * 
     * @return true jika kosong
     */
    public boolean isEmpty() {
        return passengers.isEmpty();
    }

    /**
     * Mengecek apakah lift idle.
     * 
     * @return true jika idle
     */
    public boolean isIdle() {
        return fsa.getCurrentState() == ElevatorState.IDLE && requestQueue.isEmpty();
    }

    /**
     * Mendapatkan jarak ke lantai tertentu.
     * 
     * @param floor lantai target
     * @return jarak dalam jumlah lantai
     */
    public int getDistanceTo(int floor) {
        return Math.abs(currentFloor - floor);
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getCurrentFloor() {
        return currentFloor;
    }

    public void setCurrentFloor(int floor) {
        if (floor >= minFloor && floor <= maxFloor) {
            this.currentFloor = floor;
        }
    }

    public Direction getDirection() {
        return direction;
    }

    public void setDirection(Direction direction) {
        this.direction = direction;
    }

    public ElevatorState getState() {
        return (ElevatorState) fsa.getCurrentState();
    }

    public Door getDoor() {
        return door;
    }

    public List<Passenger> getPassengers() {
        return new ArrayList<>(passengers);
    }

    public int getPassengerCount() {
        return passengers.size();
    }

    public int getMaxCapacity() {
        return maxCapacity;
    }

    public Queue<Integer> getRequestQueue() {
        return new LinkedList<>(requestQueue);
    }

    public int getMinFloor() {
        return minFloor;
    }

    public int getMaxFloor() {
        return maxFloor;
    }

    public FiniteStateAutomaton getFSA() {
        return fsa;
    }

    /**
     * Mendapatkan representasi visual lift.
     * 
     * @return string visual
     */
    public String getVisual() {
        StringBuilder sb = new StringBuilder();
        sb.append("[").append(name).append("]");
        sb.append(direction.getSymbol());
        sb.append(" L").append(currentFloor);
        sb.append(" ").append(door.toString());
        sb.append(" (").append(passengers.size()).append("/").append(maxCapacity).append(")");
        return sb.toString();
    }

    @Override
    public String toString() {
        return String.format("Lift %s: Floor %d, Direction %s, State %s, Passengers %d/%d",
                name, currentFloor, direction.getDescription(),
                getState().getName(), passengers.size(), maxCapacity);
    }
}
