package com.elevator.model.building;

import com.elevator.model.elevator.Direction;
import com.elevator.model.passenger.Passenger;

import java.util.ArrayList;
import java.util.List;

/**
 * Class untuk merepresentasikan Lantai dalam gedung.
 */
public class Floor {
    private final int number;
    private final String name;
    private final FloorButton upButton;
    private final FloorButton downButton;
    private final List<Passenger> waitingPassengers;
    private final boolean hasUpButton;
    private final boolean hasDownButton;

    public Floor(int number, int totalFloors) {
        this.number = number;
        this.name = "Lantai " + number;
        this.waitingPassengers = new ArrayList<>();

        // Lantai paling bawah tidak ada tombol DOWN
        // Lantai paling atas tidak ada tombol UP
        this.hasUpButton = number < totalFloors;
        this.hasDownButton = number > 1;

        this.upButton = hasUpButton ? new FloorButton(number, Direction.UP) : null;
        this.downButton = hasDownButton ? new FloorButton(number, Direction.DOWN) : null;
    }

    /**
     * Menambahkan penumpang yang menunggu.
     * 
     * @param passenger   penumpang
     * @param currentTime waktu saat ini
     */
    public void addWaitingPassenger(Passenger passenger, long currentTime) {
        waitingPassengers.add(passenger);

        // Tekan tombol sesuai arah
        if (passenger.getDestinationFloor() > number && upButton != null) {
            upButton.press(currentTime);
        } else if (passenger.getDestinationFloor() < number && downButton != null) {
            downButton.press(currentTime);
        }
    }

    /**
     * Mengambil semua penumpang yang mau naik ke arah tertentu.
     * 
     * @param direction arah lift
     * @return list penumpang yang mau naik
     */
    public List<Passenger> getPassengersForDirection(Direction direction) {
        List<Passenger> result = new ArrayList<>();
        for (Passenger p : waitingPassengers) {
            boolean wantsUp = p.getDestinationFloor() > number;
            boolean wantsDown = p.getDestinationFloor() < number;

            if ((direction == Direction.UP && wantsUp) ||
                    (direction == Direction.DOWN && wantsDown) ||
                    (direction == Direction.NONE)) {
                result.add(p);
            }
        }
        return result;
    }

    /**
     * Menghapus penumpang yang sudah naik lift.
     * 
     * @param passenger penumpang
     */
    public void removeWaitingPassenger(Passenger passenger) {
        waitingPassengers.remove(passenger);
    }

    /**
     * Reset tombol setelah lift datang.
     * 
     * @param direction arah lift yang datang
     */
    public void resetButton(Direction direction) {
        if (direction == Direction.UP && upButton != null) {
            upButton.reset();
        } else if (direction == Direction.DOWN && downButton != null) {
            downButton.reset();
        }
    }

    /**
     * Mengecek apakah ada panggilan dari lantai ini.
     * 
     * @return true jika ada tombol yang ditekan
     */
    public boolean hasCall() {
        return (upButton != null && upButton.isPressed()) ||
                (downButton != null && downButton.isPressed());
    }

    /**
     * Mengecek apakah ada panggilan ke arah tertentu.
     * 
     * @param direction arah
     * @return true jika ada
     */
    public boolean hasCallForDirection(Direction direction) {
        if (direction == Direction.UP && upButton != null) {
            return upButton.isPressed();
        } else if (direction == Direction.DOWN && downButton != null) {
            return downButton.isPressed();
        }
        return false;
    }

    // Getters
    public int getNumber() {
        return number;
    }

    public String getName() {
        return name;
    }

    public FloorButton getUpButton() {
        return upButton;
    }

    public FloorButton getDownButton() {
        return downButton;
    }

    public List<Passenger> getWaitingPassengers() {
        return new ArrayList<>(waitingPassengers);
    }

    public int getWaitingCount() {
        return waitingPassengers.size();
    }

    public boolean hasUpButton() {
        return hasUpButton;
    }

    public boolean hasDownButton() {
        return hasDownButton;
    }

    /**
     * Mendapatkan representasi visual lantai.
     * 
     * @return string visual
     */
    public String getVisual() {
        StringBuilder sb = new StringBuilder();
        sb.append(name).append(" ");

        if (upButton != null) {
            sb.append(upButton.toString());
        } else {
            sb.append("[  ]");
        }

        if (downButton != null) {
            sb.append(downButton.toString());
        } else {
            sb.append("[  ]");
        }

        if (!waitingPassengers.isEmpty()) {
            sb.append(" ← ").append(waitingPassengers.size()).append(" menunggu");
        }

        return sb.toString();
    }

    @Override
    public String toString() {
        return String.format("%s - %d waiting, UP:%s DOWN:%s",
                name, waitingPassengers.size(),
                upButton != null ? (upButton.isPressed() ? "ON" : "OFF") : "N/A",
                downButton != null ? (downButton.isPressed() ? "ON" : "OFF") : "N/A");
    }
}
