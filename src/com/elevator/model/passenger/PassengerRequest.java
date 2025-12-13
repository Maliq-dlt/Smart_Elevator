package com.elevator.model.passenger;

import com.elevator.model.elevator.Direction;

/**
 * Class untuk merepresentasikan Request dari Penumpang.
 */
public class PassengerRequest {
    private final Passenger passenger;
    private final int floor;
    private final Direction direction;
    private final long timestamp;
    private boolean served;

    public PassengerRequest(Passenger passenger, int floor, Direction direction, long timestamp) {
        this.passenger = passenger;
        this.floor = floor;
        this.direction = direction;
        this.timestamp = timestamp;
        this.served = false;
    }

    public Passenger getPassenger() {
        return passenger;
    }

    public int getFloor() {
        return floor;
    }

    public Direction getDirection() {
        return direction;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public boolean isServed() {
        return served;
    }

    public void markServed() {
        this.served = true;
    }

    /**
     * Menghitung waktu tunggu saat ini.
     * 
     * @param currentTime waktu saat ini dalam simulasi
     * @return waktu tunggu dalam detik
     */
    public long getCurrentWaitTime(long currentTime) {
        return currentTime - timestamp;
    }

    @Override
    public String toString() {
        return String.format("Request[%s, Floor %d, %s, %s]",
                passenger.getName(), floor, direction.getSymbol(),
                served ? "SERVED" : "WAITING");
    }
}
