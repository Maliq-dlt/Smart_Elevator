package com.elevator.model.building;

import com.elevator.model.elevator.Elevator;

import java.util.ArrayList;
import java.util.List;

/**
 * Class untuk merepresentasikan Gedung.
 * Gedung memiliki lantai-lantai dan lift-lift.
 */
public class Building {
    private final String name;
    private final List<Floor> floors;
    private final List<Elevator> elevators;
    private final int totalFloors;

    public Building(String name, int totalFloors) {
        this.name = name;
        this.totalFloors = totalFloors;
        this.floors = new ArrayList<>();
        this.elevators = new ArrayList<>();

        // Inisialisasi lantai
        for (int i = 1; i <= totalFloors; i++) {
            floors.add(new Floor(i, totalFloors));
        }
    }

    /**
     * Menambahkan lift ke gedung.
     * 
     * @param elevator lift yang ditambahkan
     */
    public void addElevator(Elevator elevator) {
        elevators.add(elevator);
    }

    /**
     * Mendapatkan lantai berdasarkan nomor.
     * 
     * @param number nomor lantai (1-indexed)
     * @return Floor object, atau null jika tidak ditemukan
     */
    public Floor getFloor(int number) {
        if (number < 1 || number > totalFloors) {
            return null;
        }
        return floors.get(number - 1);
    }

    /**
     * Mendapatkan lift berdasarkan ID.
     * 
     * @param id ID lift
     * @return Elevator object, atau null jika tidak ditemukan
     */
    public Elevator getElevatorById(String id) {
        return elevators.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    /**
     * Mendapatkan lift berdasarkan nama.
     * 
     * @param name nama lift
     * @return Elevator object, atau null jika tidak ditemukan
     */
    public Elevator getElevatorByName(String name) {
        return elevators.stream()
                .filter(e -> e.getName().equals(name))
                .findFirst()
                .orElse(null);
    }

    /**
     * Mendapatkan lift yang paling dekat dengan lantai tertentu.
     * 
     * @param floor lantai target
     * @return lift terdekat
     */
    public Elevator getNearestElevator(int floor) {
        Elevator nearest = null;
        int minDistance = Integer.MAX_VALUE;

        for (Elevator e : elevators) {
            int distance = e.getDistanceTo(floor);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = e;
            }
        }
        return nearest;
    }

    /**
     * Mendapatkan lift yang idle (tidak sedang digunakan).
     * 
     * @return list lift yang idle
     */
    public List<Elevator> getIdleElevators() {
        List<Elevator> idle = new ArrayList<>();
        for (Elevator e : elevators) {
            if (e.isIdle()) {
                idle.add(e);
            }
        }
        return idle;
    }

    /**
     * Mengecek apakah ada panggilan dari lantai manapun.
     * 
     * @return true jika ada panggilan
     */
    public boolean hasAnyCalls() {
        for (Floor f : floors) {
            if (f.hasCall()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Mendapatkan total penumpang yang menunggu.
     * 
     * @return jumlah penumpang
     */
    public int getTotalWaitingPassengers() {
        int total = 0;
        for (Floor f : floors) {
            total += f.getWaitingCount();
        }
        return total;
    }

    /**
     * Mendapatkan total penumpang dalam semua lift.
     * 
     * @return jumlah penumpang
     */
    public int getTotalPassengersInElevators() {
        int total = 0;
        for (Elevator e : elevators) {
            total += e.getPassengerCount();
        }
        return total;
    }

    // Getters
    public String getName() {
        return name;
    }

    public List<Floor> getFloors() {
        return new ArrayList<>(floors);
    }

    public List<Elevator> getElevators() {
        return new ArrayList<>(elevators);
    }

    public int getTotalFloors() {
        return totalFloors;
    }

    /**
     * Mendapatkan representasi visual gedung.
     * 
     * @return string visual multi-baris
     */
    public String getVisual() {
        StringBuilder sb = new StringBuilder();

        sb.append("╔════════════════════════════════════════════════════════════════╗\n");
        sb.append(String.format("║                    🏢 %s                         ║\n", name));
        sb.append("╠════════════════════════════════════════════════════════════════╣\n");

        // Header lift
        sb.append("║           ");
        for (Elevator e : elevators) {
            sb.append(String.format("│  Lift %-4s ", e.getName()));
        }
        sb.append("│ Waiting   ║\n");
        sb.append("╠════════════════════════════════════════════════════════════════╣\n");

        // Setiap lantai dari atas ke bawah
        for (int i = totalFloors; i >= 1; i--) {
            Floor floor = getFloor(i);
            sb.append(String.format("║ Lantai %d  ", i));

            for (Elevator e : elevators) {
                if (e.getCurrentFloor() == i) {
                    sb.append(String.format("│ %s ", e.getDoor().toString()));
                } else {
                    sb.append("│ [      ] ");
                }
            }

            sb.append(String.format("│    %2d     ║\n", floor.getWaitingCount()));
        }

        sb.append("╚════════════════════════════════════════════════════════════════╝\n");

        return sb.toString();
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Gedung: ").append(name).append("\n");
        sb.append("Total Lantai: ").append(totalFloors).append("\n");
        sb.append("Jumlah Lift: ").append(elevators.size()).append("\n");
        sb.append("Menunggu: ").append(getTotalWaitingPassengers()).append("\n");
        sb.append("Dalam Lift: ").append(getTotalPassengersInElevators()).append("\n");
        return sb.toString();
    }
}
