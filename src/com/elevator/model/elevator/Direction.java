package com.elevator.model.elevator;

/**
 * Enum untuk arah pergerakan lift.
 */
public enum Direction {
    UP("Naik", "↑"),
    DOWN("Turun", "↓"),
    NONE("Diam", "○");

    private final String description;
    private final String symbol;

    Direction(String description, String symbol) {
        this.description = description;
        this.symbol = symbol;
    }

    public String getDescription() {
        return description;
    }

    public String getSymbol() {
        return symbol;
    }

    /**
     * Mendapatkan arah berlawanan.
     * 
     * @return arah berlawanan
     */
    public Direction opposite() {
        switch (this) {
            case UP:
                return DOWN;
            case DOWN:
                return UP;
            default:
                return NONE;
        }
    }
}
