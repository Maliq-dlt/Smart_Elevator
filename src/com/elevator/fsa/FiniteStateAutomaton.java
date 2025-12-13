package com.elevator.fsa;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Finite State Automaton (FSA) Engine.
 * FSA = (Q, Σ, δ, q0, F) dimana:
 * - Q = himpunan state
 * - Σ = alfabet input (Event)
 * - δ = fungsi transisi
 * - q0 = state awal
 * - F = himpunan accepting states
 */
public class FiniteStateAutomaton {
    private final String name;
    private final List<State> states;
    private final List<Transition> transitions;
    private State currentState;
    private final State initialState;
    private final List<TransitionListener> listeners;
    private final List<String> transitionHistory;

    /**
     * Interface untuk listener perubahan state.
     */
    public interface TransitionListener {
        void onTransition(State fromState, Event event, State toState);
    }

    public FiniteStateAutomaton(String name, State initialState) {
        this.name = name;
        this.states = new ArrayList<>();
        this.transitions = new ArrayList<>();
        this.initialState = initialState;
        this.currentState = initialState;
        this.listeners = new ArrayList<>();
        this.transitionHistory = new ArrayList<>();
        addState(initialState);
    }

    /**
     * Menambahkan state ke FSA.
     * 
     * @param state state yang akan ditambahkan
     */
    public void addState(State state) {
        if (!containsState(state)) {
            states.add(state);
        }
    }

    /**
     * Menambahkan transisi ke FSA.
     * 
     * @param transition transisi yang akan ditambahkan
     */
    public void addTransition(Transition transition) {
        addState(transition.getFromState());
        addState(transition.getToState());
        transitions.add(transition);
    }

    /**
     * Menambahkan transisi ke FSA dengan parameter terpisah.
     */
    public void addTransition(State from, Event event, State to) {
        addTransition(new Transition(from, event, to));
    }

    /**
     * Memproses event/input dan melakukan transisi jika valid.
     * 
     * @param event event yang terjadi
     * @return true jika transisi berhasil
     */
    public boolean processEvent(Event event) {
        Optional<Transition> matchingTransition = transitions.stream()
                .filter(t -> t.matches(currentState, event))
                .findFirst();

        if (matchingTransition.isPresent()) {
            Transition t = matchingTransition.get();
            State fromState = currentState;
            currentState = t.getToState();

            // Log transisi
            String log = String.format("[%s] %s --(%s)--> %s",
                    name, fromState.getName(), event.name(), currentState.getName());
            transitionHistory.add(log);

            // Notifikasi listeners
            for (TransitionListener listener : listeners) {
                listener.onTransition(fromState, event, currentState);
            }

            return true;
        }
        return false;
    }

    /**
     * Mengecek apakah event valid dari state saat ini.
     * 
     * @param event event yang akan dicek
     * @return true jika ada transisi yang valid
     */
    public boolean canProcess(Event event) {
        return transitions.stream()
                .anyMatch(t -> t.matches(currentState, event));
    }

    /**
     * Mendapatkan semua event yang valid dari state saat ini.
     * 
     * @return list event yang valid
     */
    public List<Event> getValidEvents() {
        List<Event> validEvents = new ArrayList<>();
        for (Transition t : transitions) {
            if (t.getFromState().getName().equals(currentState.getName())) {
                validEvents.add(t.getEvent());
            }
        }
        return validEvents;
    }

    /**
     * Reset FSA ke state awal.
     */
    public void reset() {
        currentState = initialState;
        transitionHistory.clear();
        transitionHistory.add("[" + name + "] Reset ke state awal: " + initialState.getName());
    }

    /**
     * Mendapatkan state saat ini.
     * 
     * @return current state
     */
    public State getCurrentState() {
        return currentState;
    }

    /**
     * Mengecek apakah FSA dalam accepting state.
     * 
     * @return true jika dalam accepting state
     */
    public boolean isInAcceptingState() {
        return currentState.isAccepting();
    }

    public void addTransitionListener(TransitionListener listener) {
        listeners.add(listener);
    }

    public void removeTransitionListener(TransitionListener listener) {
        listeners.remove(listener);
    }

    public List<String> getTransitionHistory() {
        return new ArrayList<>(transitionHistory);
    }

    public String getName() {
        return name;
    }

    public List<State> getStates() {
        return new ArrayList<>(states);
    }

    public List<Transition> getTransitions() {
        return new ArrayList<>(transitions);
    }

    private boolean containsState(State state) {
        return states.stream()
                .anyMatch(s -> s.getName().equals(state.getName()));
    }

    /**
     * Menghasilkan tabel transisi (Next-State Table).
     * 
     * @return string representasi tabel transisi
     */
    public String getTransitionTable() {
        StringBuilder sb = new StringBuilder();
        sb.append("\n╔════════════════════════════════════════════════════════╗\n");
        sb.append("║           NEXT-STATE TABLE: ").append(name).append("\n");
        sb.append("╠════════════════════════════════════════════════════════╣\n");
        sb.append(String.format("║ %-15s │ %-20s │ %-15s ║\n", "Current State", "Event", "Next State"));
        sb.append("╠════════════════════════════════════════════════════════╣\n");

        for (Transition t : transitions) {
            sb.append(String.format("║ %-15s │ %-20s │ %-15s ║\n",
                    t.getFromState().getName(),
                    t.getEvent().name(),
                    t.getToState().getName()));
        }
        sb.append("╚════════════════════════════════════════════════════════╝\n");
        return sb.toString();
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("FSA: ").append(name).append("\n");
        sb.append("States (Q): {");
        for (int i = 0; i < states.size(); i++) {
            sb.append(states.get(i).getName());
            if (i < states.size() - 1)
                sb.append(", ");
        }
        sb.append("}\n");
        sb.append("Initial State (q0): ").append(initialState.getName()).append("\n");
        sb.append("Current State: ").append(currentState.getName()).append("\n");
        sb.append("Accepting States (F): {");
        boolean first = true;
        for (State s : states) {
            if (s.isAccepting()) {
                if (!first)
                    sb.append(", ");
                sb.append(s.getName());
                first = false;
            }
        }
        sb.append("}\n");
        sb.append("Transitions (δ): ").append(transitions.size()).append(" total\n");
        return sb.toString();
    }
}
