package com.elevator.scenario;

import java.util.HashMap;
import java.util.Map;

/**
 * Class untuk menyimpan hasil simulasi skenario.
 */
public class ScenarioResult {
    private final String scenarioName;
    private int totalPassengers;
    private int passengersServed;
    private long totalSimulationTime;
    private long totalWaitTime;
    private long totalTravelTime;
    private long maxWaitTime;
    private long minWaitTime;
    private int totalStops;
    private Map<String, Integer> elevatorUsage;
    private double efficiency;

    public ScenarioResult(String scenarioName) {
        this.scenarioName = scenarioName;
        this.totalPassengers = 0;
        this.passengersServed = 0;
        this.totalSimulationTime = 0;
        this.totalWaitTime = 0;
        this.totalTravelTime = 0;
        this.maxWaitTime = 0;
        this.minWaitTime = Long.MAX_VALUE;
        this.totalStops = 0;
        this.elevatorUsage = new HashMap<>();
        this.efficiency = 0.0;
    }

    /**
     * Menghitung rata-rata waktu tunggu.
     * 
     * @return rata-rata dalam detik
     */
    public double getAverageWaitTime() {
        if (passengersServed == 0)
            return 0;
        return (double) totalWaitTime / passengersServed;
    }

    /**
     * Menghitung rata-rata waktu perjalanan.
     * 
     * @return rata-rata dalam detik
     */
    public double getAverageTravelTime() {
        if (passengersServed == 0)
            return 0;
        return (double) totalTravelTime / passengersServed;
    }

    /**
     * Menghitung efisiensi simulasi.
     * Efisiensi = (waktu ideal / waktu aktual) * 100
     * 
     * @return persentase efisiensi
     */
    public void calculateEfficiency() {
        // Waktu ideal: setiap penumpang langsung dilayani tanpa tunggu
        // dan lift bergerak optimal
        if (totalSimulationTime == 0) {
            efficiency = 0;
            return;
        }

        // Semakin kecil waktu tunggu rata-rata, semakin tinggi efisiensi
        double avgWait = getAverageWaitTime();
        if (avgWait == 0) {
            efficiency = 100.0;
        } else {
            // Formula: efisiensi berkurang seiring bertambahnya waktu tunggu
            efficiency = Math.max(0, 100.0 - (avgWait * 2));
        }
    }

    // Setters
    public void setTotalPassengers(int totalPassengers) {
        this.totalPassengers = totalPassengers;
    }

    public void incrementPassengersServed() {
        this.passengersServed++;
    }

    public void setPassengersServed(int passengersServed) {
        this.passengersServed = passengersServed;
    }

    public void setTotalSimulationTime(long time) {
        this.totalSimulationTime = time;
    }

    public void addWaitTime(long waitTime) {
        this.totalWaitTime += waitTime;
        if (waitTime > maxWaitTime) {
            maxWaitTime = waitTime;
        }
        if (waitTime < minWaitTime) {
            minWaitTime = waitTime;
        }
    }

    public void addTravelTime(long travelTime) {
        this.totalTravelTime += travelTime;
    }

    public void incrementStops() {
        this.totalStops++;
    }

    public void recordElevatorUsage(String elevatorName) {
        elevatorUsage.merge(elevatorName, 1, Integer::sum);
    }

    public void setEfficiency(double efficiency) {
        this.efficiency = efficiency;
    }

    // Getters
    public String getScenarioName() {
        return scenarioName;
    }

    public int getTotalPassengers() {
        return totalPassengers;
    }

    public int getPassengersServed() {
        return passengersServed;
    }

    public long getTotalSimulationTime() {
        return totalSimulationTime;
    }

    public long getTotalWaitTime() {
        return totalWaitTime;
    }

    public long getTotalTravelTime() {
        return totalTravelTime;
    }

    public long getMaxWaitTime() {
        return maxWaitTime;
    }

    public long getMinWaitTime() {
        return minWaitTime == Long.MAX_VALUE ? 0 : minWaitTime;
    }

    public int getTotalStops() {
        return totalStops;
    }

    public Map<String, Integer> getElevatorUsage() {
        return new HashMap<>(elevatorUsage);
    }

    public double getEfficiency() {
        return efficiency;
    }

    /**
     * Mendapatkan ringkasan hasil dalam format tabel.
     * 
     * @return string ringkasan
     */
    public String getSummary() {
        calculateEfficiency();

        StringBuilder sb = new StringBuilder();
        sb.append("\n╔══════════════════════════════════════════════════════════╗\n");
        sb.append("║           📊 HASIL SIMULASI: ").append(String.format("%-27s", scenarioName)).append("║\n");
        sb.append("╠══════════════════════════════════════════════════════════╣\n");
        sb.append(String.format("║  Total Penumpang      : %-32d ║\n", totalPassengers));
        sb.append(String.format("║  Penumpang Terlayani  : %-32d ║\n", passengersServed));
        sb.append(String.format("║  Total Waktu Simulasi : %-29d detik ║\n", totalSimulationTime));
        sb.append("╠══════════════════════════════════════════════════════════╣\n");
        sb.append(String.format("║  Rata-rata Waktu Tunggu : %-26.1f detik ║\n", getAverageWaitTime()));
        sb.append(String.format("║  Rata-rata Waktu Travel : %-26.1f detik ║\n", getAverageTravelTime()));
        sb.append(String.format("║  Waktu Tunggu Max       : %-27d detik ║\n", maxWaitTime));
        sb.append(String.format("║  Waktu Tunggu Min       : %-27d detik ║\n", getMinWaitTime()));
        sb.append("╠══════════════════════════════════════════════════════════╣\n");
        sb.append(String.format("║  Total Berhenti         : %-31d kali ║\n", totalStops));
        sb.append(String.format("║  Efisiensi              : %-32.1f%% ║\n", efficiency));
        sb.append("╠══════════════════════════════════════════════════════════╣\n");
        sb.append("║  Penggunaan Lift:                                        ║\n");
        for (Map.Entry<String, Integer> entry : elevatorUsage.entrySet()) {
            sb.append(String.format("║    - %-20s : %-27d kali ║\n", entry.getKey(), entry.getValue()));
        }
        sb.append("╚══════════════════════════════════════════════════════════╝\n");

        return sb.toString();
    }

    /**
     * Mendapatkan rating berdasarkan efisiensi.
     * 
     * @return string rating
     */
    public String getRating() {
        calculateEfficiency();
        if (efficiency >= 90)
            return "⭐⭐⭐⭐⭐ EXCELLENT";
        if (efficiency >= 75)
            return "⭐⭐⭐⭐ GOOD";
        if (efficiency >= 50)
            return "⭐⭐⭐ AVERAGE";
        if (efficiency >= 25)
            return "⭐⭐ POOR";
        return "⭐ VERY POOR";
    }

    @Override
    public String toString() {
        return getSummary();
    }
}
