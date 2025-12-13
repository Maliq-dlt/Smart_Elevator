package com.elevator.scenario;

import com.elevator.model.building.Building;
import com.elevator.model.passenger.Passenger;

import java.util.List;

/**
 * Interface untuk Skenario Simulasi.
 */
public interface Scenario {
    /**
     * Mendapatkan nama skenario.
     * 
     * @return nama skenario
     */
    String getName();

    /**
     * Mendapatkan deskripsi skenario.
     * 
     * @return deskripsi skenario
     */
    String getDescription();

    /**
     * Setup awal gedung dan lift.
     * 
     * @param building gedung yang akan di-setup
     */
    void setupBuilding(Building building);

    /**
     * Mendapatkan list penumpang untuk skenario ini.
     * 
     * @return list penumpang
     */
    List<Passenger> getPassengers();

    /**
     * Mendapatkan posisi awal lift.
     * 
     * @return array posisi lantai untuk setiap lift [LiftA, LiftB, ...]
     */
    int[] getInitialElevatorPositions();

    /**
     * Mendapatkan expected results untuk verifikasi.
     * 
     * @return ScenarioResult dengan expected values
     */
    ScenarioResult getExpectedResults();
}
