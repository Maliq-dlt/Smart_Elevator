
import { LiftState, SafetyStatus, SensorReadings, SystemMode } from '../types/index';

/**
 * Independent Safety Logic (The "Watchdog")
 * This runs parallel to the main controller and can override it.
 */
export const checkSafetySystem = (
    sensors: SensorReadings, 
    systemMode: SystemMode,
    isCableSnapped: boolean
): SafetyStatus => {
    
    const safety: SafetyStatus = {
        emergencyBrakeEngaged: false,
        doorInterlockClosed: sensors.doorState === 'CLOSED',
        overSpeedGovernorTripped: Math.abs(sensors.velocity) > 4.5, // Trip at 4.5m/s
        limitSwitchTop: sensors.position >= 3.05,
        limitSwitchBottom: sensors.position <= 0.95,
        systemHealthy: true
    };

    // 1. Overspeed Protection
    if (safety.overSpeedGovernorTripped) {
        safety.emergencyBrakeEngaged = true;
        safety.systemHealthy = false;
    }

    // 2. Cable Integrity
    if (isCableSnapped || sensors.cableTension < 100) { // < 100N implies snap
        safety.emergencyBrakeEngaged = true;
        safety.systemHealthy = false;
    }

    // 3. Mode Based Safety
    if (systemMode === 'FIRE_ALARM' || systemMode === 'EARTHQUAKE') {
        // Not a mechanical fault, but a safety state
    }

    // 4. Door Interlock Check (Prevent moving if door open)
    // Note: This logic usually feeds into the main controller, 
    // but the safety chain physically cuts power to the motor if open.
    
    return safety;
};
