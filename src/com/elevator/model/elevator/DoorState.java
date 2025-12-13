package com.elevator.model.elevator;

import com.elevator.fsa.State;

/**
 * Enum untuk State Pintu Lift.
 * Merepresentasikan semua state yang mungkin untuk pintu lift.
 */
public enum DoorState implements State {
    CLOSED("Closed", "Pintu tertutup rapat", true),
    OPENING("Opening", "Pintu sedang membuka", false),
    OPEN("Open", "Pintu terbuka penuh", true),
    CLOSING("Closing", "Pintu sedang menutup", false),
    BLOCKED("Blocked", "Pintu terhalang", false);

    private final String name;
    private final String description;
    private final boolean accepting;

    DoorState(String name, String description, boolean accepting) {
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
     * Mendapatkan representasi visual pintu.
     * 
     * @return string visual pintu
     */
    public String getVisual() {
        switch (this) {
            case CLOSED:
                return "[████]";
            case OPENING:
                return "[█  █]";
            case OPEN:
                return "[    ]";
            case CLOSING:
                return "[█  █]";
            case BLOCKED:
                return "[█!!█]";
            default:
                return "[????]";
        }
    }
}
