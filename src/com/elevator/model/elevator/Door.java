package com.elevator.model.elevator;

import com.elevator.fsa.Event;
import com.elevator.fsa.FiniteStateAutomaton;

/**
 * Class untuk merepresentasikan Pintu Lift.
 * Pintu memiliki FSA internal untuk mengatur state-nya.
 */
public class Door {
    private final FiniteStateAutomaton fsa;
    private DoorState currentState;
    private static final int OPEN_TIME_MS = 3000; // Waktu pintu terbuka
    private static final int CLOSE_TIME_MS = 2000; // Waktu pintu menutup

    public Door() {
        this.currentState = DoorState.CLOSED;
        this.fsa = createDoorFSA();
    }

    /**
     * Membuat FSA untuk pintu lift.
     * State: CLOSED, OPENING, OPEN, CLOSING, BLOCKED
     * 
     * @return FSA pintu
     */
    private FiniteStateAutomaton createDoorFSA() {
        FiniteStateAutomaton doorFSA = new FiniteStateAutomaton("Door FSA", DoorState.CLOSED);

        // Transisi dari CLOSED
        doorFSA.addTransition(DoorState.CLOSED, Event.BUTTON_OPEN_PRESSED, DoorState.OPENING);
        doorFSA.addTransition(DoorState.CLOSED, Event.ARRIVED_AT_FLOOR, DoorState.OPENING);

        // Transisi dari OPENING
        doorFSA.addTransition(DoorState.OPENING, Event.DOOR_FULLY_OPEN, DoorState.OPEN);

        // Transisi dari OPEN
        doorFSA.addTransition(DoorState.OPEN, Event.BUTTON_CLOSE_PRESSED, DoorState.CLOSING);
        doorFSA.addTransition(DoorState.OPEN, Event.TIMEOUT, DoorState.CLOSING);

        // Transisi dari CLOSING
        doorFSA.addTransition(DoorState.CLOSING, Event.DOOR_FULLY_CLOSED, DoorState.CLOSED);
        doorFSA.addTransition(DoorState.CLOSING, Event.DOOR_OBSTRUCTION, DoorState.OPENING);
        doorFSA.addTransition(DoorState.CLOSING, Event.BUTTON_OPEN_PRESSED, DoorState.OPENING);

        // Transisi dari BLOCKED
        doorFSA.addTransition(DoorState.BLOCKED, Event.DOOR_OBSTRUCTION, DoorState.OPENING);

        return doorFSA;
    }

    /**
     * Membuka pintu.
     * 
     * @return true jika berhasil memulai proses buka
     */
    public boolean open() {
        if (currentState == DoorState.CLOSED || currentState == DoorState.CLOSING) {
            if (fsa.processEvent(Event.BUTTON_OPEN_PRESSED)) {
                currentState = DoorState.OPENING;
                return true;
            }
        }
        return false;
    }

    /**
     * Menutup pintu.
     * 
     * @return true jika berhasil memulai proses tutup
     */
    public boolean close() {
        if (currentState == DoorState.OPEN) {
            if (fsa.processEvent(Event.BUTTON_CLOSE_PRESSED)) {
                currentState = DoorState.CLOSING;
                return true;
            }
        }
        return false;
    }

    /**
     * Mensimulasikan pintu terbuka penuh.
     */
    public void completeOpening() {
        if (currentState == DoorState.OPENING) {
            fsa.processEvent(Event.DOOR_FULLY_OPEN);
            currentState = DoorState.OPEN;
        }
    }

    /**
     * Mensimulasikan pintu tertutup penuh.
     */
    public void completeClosing() {
        if (currentState == DoorState.CLOSING) {
            fsa.processEvent(Event.DOOR_FULLY_CLOSED);
            currentState = DoorState.CLOSED;
        }
    }

    /**
     * Mensimulasikan halangan terdeteksi.
     */
    public void obstruction() {
        if (currentState == DoorState.CLOSING) {
            fsa.processEvent(Event.DOOR_OBSTRUCTION);
            currentState = DoorState.OPENING;
        }
    }

    public DoorState getState() {
        return currentState;
    }

    public boolean isOpen() {
        return currentState == DoorState.OPEN;
    }

    public boolean isClosed() {
        return currentState == DoorState.CLOSED;
    }

    public boolean isMoving() {
        return currentState == DoorState.OPENING || currentState == DoorState.CLOSING;
    }

    public FiniteStateAutomaton getFSA() {
        return fsa;
    }

    public int getOpenTimeMs() {
        return OPEN_TIME_MS;
    }

    public int getCloseTimeMs() {
        return CLOSE_TIME_MS;
    }

    @Override
    public String toString() {
        return currentState.getVisual();
    }
}
