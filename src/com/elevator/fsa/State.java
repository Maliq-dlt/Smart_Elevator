package com.elevator.fsa;

/**
 * Interface untuk State dalam Finite State Automaton.
 * Setiap state memiliki nama dan bisa menjadi accepting state.
 */
public interface State {
    /**
     * Mendapatkan nama state.
     * @return nama state
     */
    String getName();
    
    /**
     * Mengecek apakah state ini adalah accepting/final state.
     * @return true jika accepting state
     */
    boolean isAccepting();
}
