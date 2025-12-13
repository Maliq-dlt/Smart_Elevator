package com.elevator.model.passenger;

/**
 * Class untuk merepresentasikan Penumpang.
 */
public class Passenger {
    private static int idCounter = 0;

    private final int id;
    private final String name;
    private final int originFloor;
    private final int destinationFloor;
    private final long requestTime; // Waktu request dalam simulasi (detik)
    private final double weight; // Berat badan penumpang dalam kg
    private long boardTime; // Waktu naik lift
    private long arrivalTime; // Waktu sampai tujuan
    private PassengerState state;

    // Konstanta berat
    public static final double DEFAULT_WEIGHT = 70.0; // Berat default (kg)
    public static final double MIN_WEIGHT = 30.0; // Berat minimum
    public static final double MAX_WEIGHT = 150.0; // Berat maksimum

    public enum PassengerState {
        WAITING("Menunggu"),
        BOARDING("Naik lift"),
        IN_ELEVATOR("Dalam lift"),
        EXITING("Keluar lift"),
        ARRIVED("Sampai tujuan");

        private final String description;

        PassengerState(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public Passenger(String name, int originFloor, int destinationFloor, long requestTime, double weight) {
        this.id = ++idCounter;
        this.name = name;
        this.originFloor = originFloor;
        this.destinationFloor = destinationFloor;
        this.requestTime = requestTime;
        this.weight = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight));
        this.boardTime = -1;
        this.arrivalTime = -1;
        this.state = PassengerState.WAITING;
    }

    public Passenger(String name, int originFloor, int destinationFloor, long requestTime) {
        this(name, originFloor, destinationFloor, requestTime, DEFAULT_WEIGHT);
    }

    public Passenger(int originFloor, int destinationFloor, long requestTime) {
        this("Penumpang " + (idCounter + 1), originFloor, destinationFloor, requestTime, DEFAULT_WEIGHT);
    }

    public Passenger(int originFloor, int destinationFloor, long requestTime, double weight) {
        this("Penumpang " + (idCounter + 1), originFloor, destinationFloor, requestTime, weight);
    }

    /**
     * Menandai penumpang naik lift.
     * 
     * @param time waktu naik
     */
    public void board(long time) {
        this.boardTime = time;
        this.state = PassengerState.IN_ELEVATOR;
    }

    /**
     * Menandai penumpang sampai tujuan.
     * 
     * @param time waktu sampai
     */
    public void arrive(long time) {
        this.arrivalTime = time;
        this.state = PassengerState.ARRIVED;
    }

    /**
     * Menghitung waktu tunggu (dari request sampai naik lift).
     * 
     * @return waktu tunggu dalam detik, atau -1 jika belum naik
     */
    public long getWaitTime() {
        if (boardTime < 0)
            return -1;
        return boardTime - requestTime;
    }

    /**
     * Menghitung waktu perjalanan (dari naik sampai turun).
     * 
     * @return waktu perjalanan dalam detik, atau -1 jika belum sampai
     */
    public long getTravelTime() {
        if (arrivalTime < 0 || boardTime < 0)
            return -1;
        return arrivalTime - boardTime;
    }

    /**
     * Menghitung total waktu (dari request sampai sampai tujuan).
     * 
     * @return total waktu dalam detik, atau -1 jika belum sampai
     */
    public long getTotalTime() {
        if (arrivalTime < 0)
            return -1;
        return arrivalTime - requestTime;
    }

    /**
     * Mendapatkan arah perjalanan penumpang.
     * 
     * @return "UP" atau "DOWN"
     */
    public String getDirectionString() {
        return destinationFloor > originFloor ? "UP" : "DOWN";
    }

    // Getters
    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getOriginFloor() {
        return originFloor;
    }

    public int getDestinationFloor() {
        return destinationFloor;
    }

    public long getRequestTime() {
        return requestTime;
    }

    public long getBoardTime() {
        return boardTime;
    }

    public long getArrivalTime() {
        return arrivalTime;
    }

    public PassengerState getState() {
        return state;
    }

    public void setState(PassengerState state) {
        this.state = state;
    }

    public double getWeight() {
        return weight;
    }

    public static void resetIdCounter() {
        idCounter = 0;
    }

    @Override
    public String toString() {
        return String.format("%s (L%d→L%d, %.0fkg) [%s]",
                name, originFloor, destinationFloor, weight, state.getDescription());
    }

    /**
     * Mendapatkan info detail penumpang.
     * 
     * @return string info detail
     */
    public String getDetailInfo() {
        StringBuilder sb = new StringBuilder();
        sb.append("ID: ").append(id).append("\n");
        sb.append("Nama: ").append(name).append("\n");
        sb.append("Berat: ").append(weight).append(" kg\n");
        sb.append("Dari: Lantai ").append(originFloor).append("\n");
        sb.append("Ke: Lantai ").append(destinationFloor).append("\n");
        sb.append("Status: ").append(state.getDescription()).append("\n");
        if (getWaitTime() >= 0) {
            sb.append("Waktu Tunggu: ").append(getWaitTime()).append(" detik\n");
        }
        if (getTotalTime() >= 0) {
            sb.append("Total Waktu: ").append(getTotalTime()).append(" detik\n");
        }
        return sb.toString();
    }
}
