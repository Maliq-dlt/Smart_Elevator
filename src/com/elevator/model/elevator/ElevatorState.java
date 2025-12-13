package com.elevator.model.elevator;

import com.elevator.fsa.State;

/**
 * Enum untuk State Elevator (Lift).
 * Merepresentasikan semua state yang mungkin untuk sebuah lift.
 */
public enum ElevatorState implements State {
    IDLE("Idle", "Lift diam, tidak ada permintaan", true),
    MOVING_UP("Moving Up", "Lift bergerak naik", false),
    MOVING_DOWN("Moving Down", "Lift bergerak turun", false),
    DOOR_OPENING("Door Opening", "Pintu sedang terbuka", false),
    DOOR_OPEN("Door Open", "Pintu terbuka penuh", false),
    DOOR_CLOSING("Door Closing", "Pintu sedang tertutup", false),
    STOPPED("Stopped", "Lift berhenti di lantai", true),
    EMERGENCY("Emergency", "Mode darurat", false),
    MAINTENANCE("Maintenance", "Mode pemeliharaan", false);

    private final String name;
    private final String description;
    private final boolean accepting;

    ElevatorState(String name, String description, boolean accepting) {
        this.name = name;
        this.description = description;
        this.accepting = accepting;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public boolean isAccepting() {
        return accepting;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Mendapatkan simbol visual untuk state ini.
     * 
     * @return simbol karakter
     */
    public String getSymbol() {
        switch (this) {
            case IDLE:
                return "□";
            case MOVING_UP:
                return "▲";
            case MOVING_DOWN:
                return "▼";
            case DOOR_OPENING:
                return "◄►";
            case DOOR_OPEN:
                return "[ ]";
            case DOOR_CLOSING:
                return "►◄";
            case STOPPED:
                return "■";
            case EMERGENCY:
                return "⚠";
            case MAINTENANCE:
                return "🔧";
            default:
                return "?";
        }
    }
}
