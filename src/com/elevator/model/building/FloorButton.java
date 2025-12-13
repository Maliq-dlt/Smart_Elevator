package com.elevator.model.building;

import com.elevator.model.elevator.Direction;

/**
 * Class untuk tombol panggilan lift di setiap lantai.
 */
public class FloorButton {
    private final int floor;
    private final Direction direction;
    private boolean pressed;
    private long pressedTime;

    public FloorButton(int floor, Direction direction) {
        this.floor = floor;
        this.direction = direction;
        this.pressed = false;
        this.pressedTime = -1;
    }

    /**
     * Menekan tombol.
     * 
     * @param time waktu saat tombol ditekan
     */
    public void press(long time) {
        if (!pressed) {
            this.pressed = true;
            this.pressedTime = time;
        }
    }

    /**
     * Reset tombol setelah lift datang.
     */
    public void reset() {
        this.pressed = false;
        this.pressedTime = -1;
    }

    public int getFloor() {
        return floor;
    }

    public Direction getDirection() {
        return direction;
    }

    public boolean isPressed() {
        return pressed;
    }

    public long getPressedTime() {
        return pressedTime;
    }

    /**
     * Mendapatkan waktu tunggu sejak tombol ditekan.
     * 
     * @param currentTime waktu saat ini
     * @return waktu tunggu, atau -1 jika tidak ditekan
     */
    public long getWaitTime(long currentTime) {
        if (!pressed || pressedTime < 0)
            return -1;
        return currentTime - pressedTime;
    }

    @Override
    public String toString() {
        return String.format("[%s%s]",
                direction.getSymbol(),
                pressed ? "*" : " ");
    }
}
