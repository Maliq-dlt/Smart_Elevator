package com.elevator.simulation;

/**
 * Clock virtual untuk simulasi discrete-time.
 */
public class SimulationClock {
    private long currentTime;
    private final long timeStep;
    private boolean running;
    private long startTime;
    private long endTime;

    public SimulationClock() {
        this(1); // Default 1 detik per step
    }

    public SimulationClock(long timeStep) {
        this.timeStep = timeStep;
        this.currentTime = 0;
        this.running = false;
        this.startTime = 0;
        this.endTime = 0;
    }

    /**
     * Mulai clock.
     */
    public void start() {
        this.running = true;
        this.startTime = System.currentTimeMillis();
    }

    /**
     * Stop clock.
     */
    public void stop() {
        this.running = false;
        this.endTime = System.currentTimeMillis();
    }

    /**
     * Advance clock satu step.
     */
    public void tick() {
        if (running) {
            currentTime += timeStep;
        }
    }

    /**
     * Reset clock ke awal.
     */
    public void reset() {
        currentTime = 0;
        running = false;
        startTime = 0;
        endTime = 0;
    }

    /**
     * Mendapatkan waktu simulasi saat ini.
     * 
     * @return waktu dalam detik simulasi
     */
    public long getCurrentTime() {
        return currentTime;
    }

    /**
     * Set waktu simulasi.
     * 
     * @param time waktu baru
     */
    public void setCurrentTime(long time) {
        this.currentTime = time;
    }

    /**
     * Mendapatkan time step.
     * 
     * @return time step dalam detik
     */
    public long getTimeStep() {
        return timeStep;
    }

    /**
     * Mengecek apakah clock berjalan.
     * 
     * @return true jika berjalan
     */
    public boolean isRunning() {
        return running;
    }

    /**
     * Mendapatkan waktu real yang berlalu.
     * 
     * @return waktu real dalam milliseconds
     */
    public long getRealElapsedTime() {
        if (running) {
            return System.currentTimeMillis() - startTime;
        }
        return endTime - startTime;
    }

    /**
     * Format waktu simulasi ke string MM:SS.
     * 
     * @return string waktu
     */
    public String getFormattedTime() {
        long mins = currentTime / 60;
        long secs = currentTime % 60;
        return String.format("%02d:%02d", mins, secs);
    }

    /**
     * Format waktu simulasi ke string HH:MM:SS.
     * 
     * @return string waktu lengkap
     */
    public String getFullFormattedTime() {
        long hours = currentTime / 3600;
        long mins = (currentTime % 3600) / 60;
        long secs = currentTime % 60;
        return String.format("%02d:%02d:%02d", hours, mins, secs);
    }

    @Override
    public String toString() {
        return "Clock: " + getFormattedTime() + " (running: " + running + ")";
    }
}
