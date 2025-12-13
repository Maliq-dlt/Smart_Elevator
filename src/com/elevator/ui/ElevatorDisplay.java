package com.elevator.ui;

import com.elevator.model.elevator.Elevator;
import com.elevator.model.elevator.ElevatorState;

/**
 * Display visual untuk satu elevator.
 */
public class ElevatorDisplay {
    private final Elevator elevator;

    public ElevatorDisplay(Elevator elevator) {
        this.elevator = elevator;
    }

    /**
     * Mendapatkan representasi visual lift dalam satu baris.
     * 
     * @return string visual
     */
    public String getCompactView() {
        StringBuilder sb = new StringBuilder();
        sb.append("Lift ").append(elevator.getName()).append(": ");
        sb.append("L").append(elevator.getCurrentFloor()).append(" ");
        sb.append(elevator.getDirection().getSymbol()).append(" ");
        sb.append(elevator.getDoor().getState().getVisual()).append(" ");
        sb.append("(").append(elevator.getPassengerCount()).append("/");
        sb.append(elevator.getMaxCapacity()).append(")");
        return sb.toString();
    }

    /**
     * Mendapatkan representasi visual lift vertikal.
     * 
     * @param totalFloors total lantai gedung
     * @return string multi-baris
     */
    public String getVerticalView(int totalFloors) {
        StringBuilder sb = new StringBuilder();

        sb.append("╔═══════════════╗\n");
        sb.append("║   Lift ").append(elevator.getName()).append("     ║\n");
        sb.append("╠═══════════════╣\n");

        for (int floor = totalFloors; floor >= 1; floor--) {
            if (elevator.getCurrentFloor() == floor) {
                sb.append("║ ").append(floor).append(" ");
                sb.append(getElevatorBox()).append(" ║\n");
            } else {
                sb.append("║ ").append(floor).append(" [       ] ║\n");
            }
        }

        sb.append("╠═══════════════╣\n");
        sb.append("║ ").append(String.format("%-13s", getStatusText())).append("║\n");
        sb.append("╚═══════════════╝\n");

        return sb.toString();
    }

    /**
     * Mendapatkan representasi kotak lift.
     * 
     * @return string kotak lift
     */
    private String getElevatorBox() {
        ElevatorState state = elevator.getState();
        String dirSymbol = elevator.getDirection().getSymbol();
        int passengers = elevator.getPassengerCount();

        switch (state) {
            case IDLE:
                return String.format("[%s %d  ]", "○", passengers);
            case MOVING_UP:
                return String.format("[%s %d  ]", "▲", passengers);
            case MOVING_DOWN:
                return String.format("[%s %d  ]", "▼", passengers);
            case DOOR_OPEN:
            case DOOR_OPENING:
                return String.format("[  %d  ]", passengers);
            case DOOR_CLOSING:
                return String.format("[> %d <]", passengers);
            default:
                return String.format("[? %d  ]", passengers);
        }
    }

    /**
     * Mendapatkan teks status singkat.
     * 
     * @return string status
     */
    private String getStatusText() {
        ElevatorState state = elevator.getState();
        switch (state) {
            case IDLE:
                return "Idle";
            case MOVING_UP:
                return "Naik";
            case MOVING_DOWN:
                return "Turun";
            case DOOR_OPENING:
                return "Buka Pintu";
            case DOOR_OPEN:
                return "Pintu Terbuka";
            case DOOR_CLOSING:
                return "Tutup Pintu";
            case STOPPED:
                return "Berhenti";
            case EMERGENCY:
                return "DARURAT!";
            default:
                return "Unknown";
        }
    }

    /**
     * Mendapatkan detail lengkap lift.
     * 
     * @return string detail
     */
    public String getDetailView() {
        StringBuilder sb = new StringBuilder();
        sb.append("╔════════════════════════════════════╗\n");
        sb.append("║     DETAIL LIFT ").append(elevator.getName()).append("                 ║\n");
        sb.append("╠════════════════════════════════════╣\n");
        sb.append("║ ID        : ").append(String.format("%-22s", elevator.getId())).append("║\n");
        sb.append("║ Lantai    : ").append(String.format("%-22d", elevator.getCurrentFloor())).append("║\n");
        sb.append("║ Arah      : ").append(String.format("%-22s", elevator.getDirection().getDescription()))
                .append("║\n");
        sb.append("║ State     : ").append(String.format("%-22s", elevator.getState().getName())).append("║\n");
        sb.append("║ Pintu     : ").append(String.format("%-22s", elevator.getDoor().getState().getName()))
                .append("║\n");
        sb.append("║ Penumpang : ")
                .append(String.format("%-22s", elevator.getPassengerCount() + "/" + elevator.getMaxCapacity()))
                .append("║\n");
        sb.append("╚════════════════════════════════════╝\n");
        return sb.toString();
    }

    public Elevator getElevator() {
        return elevator;
    }
}
