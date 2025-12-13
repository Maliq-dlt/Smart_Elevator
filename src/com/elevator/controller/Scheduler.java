package com.elevator.controller;

import com.elevator.model.elevator.Direction;
import com.elevator.model.elevator.Elevator;

import java.util.List;

/**
 * Algoritma penjadwalan lift.
 * Menentukan lift mana yang harus melayani request tertentu.
 */
public class Scheduler {

    public enum Algorithm {
        FCFS("First Come First Serve"),
        NEAREST("Nearest Elevator"),
        SCAN("SCAN/Elevator Algorithm"),
        LOOK("LOOK Algorithm");

        private final String description;

        Algorithm(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    private Algorithm currentAlgorithm;

    public Scheduler() {
        this.currentAlgorithm = Algorithm.NEAREST;
    }

    public Scheduler(Algorithm algorithm) {
        this.currentAlgorithm = algorithm;
    }

    /**
     * Memilih lift terbaik untuk melayani request.
     * 
     * @param elevators daftar lift yang tersedia
     * @param floor     lantai request
     * @param direction arah request
     * @return lift terbaik, atau null jika tidak ada
     */
    public Elevator selectElevator(List<Elevator> elevators, int floor, Direction direction) {
        if (elevators.isEmpty()) {
            return null;
        }

        switch (currentAlgorithm) {
            case FCFS:
                return selectFCFS(elevators);
            case NEAREST:
                return selectNearest(elevators, floor, direction);
            case SCAN:
                return selectSCAN(elevators, floor, direction);
            case LOOK:
                return selectLOOK(elevators, floor, direction);
            default:
                return selectNearest(elevators, floor, direction);
        }
    }

    /**
     * FCFS: Pilih lift pertama yang idle.
     */
    private Elevator selectFCFS(List<Elevator> elevators) {
        for (Elevator e : elevators) {
            if (e.isIdle()) {
                return e;
            }
        }
        return elevators.get(0);
    }

    /**
     * NEAREST: Pilih lift yang paling dekat.
     */
    private Elevator selectNearest(List<Elevator> elevators, int floor, Direction direction) {
        Elevator best = null;
        int minDistance = Integer.MAX_VALUE;
        int minScore = Integer.MAX_VALUE;

        for (Elevator e : elevators) {
            int distance = e.getDistanceTo(floor);

            // Hitung skor: jarak + bonus jika searah
            int score = distance;

            // Bonus jika lift idle
            if (e.isIdle()) {
                score -= 2;
            }

            // Bonus jika lift tidak penuh
            if (!e.isFull()) {
                score -= 1;
            }

            // Penalti jika lift berlawanan arah
            if (e.getDirection() != Direction.NONE && e.getDirection() != direction) {
                score += 5;
            }

            if (score < minScore || (score == minScore && distance < minDistance)) {
                minScore = score;
                minDistance = distance;
                best = e;
            }
        }

        return best;
    }

    /**
     * SCAN: Lift bergerak satu arah sampai ujung, lalu balik.
     */
    private Elevator selectSCAN(List<Elevator> elevators, int floor, Direction direction) {
        Elevator best = null;
        int minScore = Integer.MAX_VALUE;

        for (Elevator e : elevators) {
            int score = calculateSCANScore(e, floor, direction);
            if (score < minScore) {
                minScore = score;
                best = e;
            }
        }

        return best;
    }

    private int calculateSCANScore(Elevator e, int floor, Direction direction) {
        int currentFloor = e.getCurrentFloor();
        int distance = Math.abs(currentFloor - floor);
        Direction elevatorDir = e.getDirection();

        // Jika idle, jarak langsung
        if (elevatorDir == Direction.NONE) {
            return distance;
        }

        // Jika searah dan menuju ke arah request
        if (elevatorDir == direction) {
            if ((elevatorDir == Direction.UP && floor >= currentFloor) ||
                    (elevatorDir == Direction.DOWN && floor <= currentFloor)) {
                return distance;
            }
        }

        // Harus tunggu lift balik arah
        int maxFloor = e.getMaxFloor();
        int minFloor = e.getMinFloor();

        if (elevatorDir == Direction.UP) {
            return (maxFloor - currentFloor) + (maxFloor - floor);
        } else {
            return (currentFloor - minFloor) + (floor - minFloor);
        }
    }

    /**
     * LOOK: Seperti SCAN tapi tidak perlu ke ujung jika tidak ada request.
     */
    private Elevator selectLOOK(List<Elevator> elevators, int floor, Direction direction) {
        // Untuk implementasi sederhana, sama dengan SCAN
        // Perbedaannya ada di ElevatorController saat menentukan kapan balik arah
        return selectSCAN(elevators, floor, direction);
    }

    public Algorithm getCurrentAlgorithm() {
        return currentAlgorithm;
    }

    public void setAlgorithm(Algorithm algorithm) {
        this.currentAlgorithm = algorithm;
    }

    @Override
    public String toString() {
        return "Scheduler: " + currentAlgorithm.getDescription();
    }
}
