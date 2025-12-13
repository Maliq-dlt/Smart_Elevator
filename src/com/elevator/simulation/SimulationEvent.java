package com.elevator.simulation;

/**
 * Event yang terjadi dalam simulasi.
 */
public class SimulationEvent {
    private final long timestamp;
    private final String description;
    private final EventType type;
    private final String source;

    public enum EventType {
        PASSENGER_ARRIVAL("Penumpang Tiba"),
        PASSENGER_BOARD("Penumpang Naik"),
        PASSENGER_EXIT("Penumpang Keluar"),
        ELEVATOR_MOVE("Lift Bergerak"),
        ELEVATOR_STOP("Lift Berhenti"),
        DOOR_OPEN("Pintu Terbuka"),
        DOOR_CLOSE("Pintu Tertutup"),
        BUTTON_PRESS("Tombol Ditekan"),
        SYSTEM_INFO("Info Sistem");

        private final String description;

        EventType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public SimulationEvent(long timestamp, String description, EventType type, String source) {
        this.timestamp = timestamp;
        this.description = description;
        this.type = type;
        this.source = source;
    }

    public SimulationEvent(long timestamp, String description, EventType type) {
        this(timestamp, description, type, "System");
    }

    public long getTimestamp() {
        return timestamp;
    }

    public String getDescription() {
        return description;
    }

    public EventType getType() {
        return type;
    }

    public String getSource() {
        return source;
    }

    public String getFormattedTime() {
        long mins = timestamp / 60;
        long secs = timestamp % 60;
        return String.format("[%02d:%02d]", mins, secs);
    }

    public String getIcon() {
        switch (type) {
            case PASSENGER_ARRIVAL:
                return "👤";
            case PASSENGER_BOARD:
                return "🚶";
            case PASSENGER_EXIT:
                return "🚶";
            case ELEVATOR_MOVE:
                return "🛗";
            case ELEVATOR_STOP:
                return "⏹️";
            case DOOR_OPEN:
                return "🚪";
            case DOOR_CLOSE:
                return "🚪";
            case BUTTON_PRESS:
                return "🔘";
            case SYSTEM_INFO:
                return "ℹ️";
            default:
                return "•";
        }
    }

    @Override
    public String toString() {
        return String.format("%s %s [%s] %s",
                getFormattedTime(), getIcon(), source, description);
    }
}
