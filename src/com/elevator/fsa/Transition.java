package com.elevator.fsa;

/**
 * Class untuk merepresentasikan Transisi dalam FSA.
 * Transisi: (fromState, event) -> toState
 */
public class Transition {
    private final State fromState;
    private final Event event;
    private final State toState;
    private final String description;

    public Transition(State fromState, Event event, State toState) {
        this(fromState, event, toState, "");
    }

    public Transition(State fromState, Event event, State toState, String description) {
        this.fromState = fromState;
        this.event = event;
        this.toState = toState;
        this.description = description;
    }

    public State getFromState() {
        return fromState;
    }

    public Event getEvent() {
        return event;
    }

    public State getToState() {
        return toState;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Mengecek apakah transisi ini cocok dengan state dan event yang diberikan.
     * 
     * @param currentState state saat ini
     * @param inputEvent   event/input yang terjadi
     * @return true jika transisi cocok
     */
    public boolean matches(State currentState, Event inputEvent) {
        return fromState.getName().equals(currentState.getName()) && event == inputEvent;
    }

    @Override
    public String toString() {
        return String.format("δ(%s, %s) = %s%s",
                fromState.getName(),
                event.name(),
                toState.getName(),
                description.isEmpty() ? "" : " [" + description + "]");
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null || getClass() != obj.getClass())
            return false;
        Transition that = (Transition) obj;
        return fromState.getName().equals(that.fromState.getName())
                && event == that.event
                && toState.getName().equals(that.toState.getName());
    }

    @Override
    public int hashCode() {
        int result = fromState.getName().hashCode();
        result = 31 * result + event.hashCode();
        result = 31 * result + toState.getName().hashCode();
        return result;
    }
}
