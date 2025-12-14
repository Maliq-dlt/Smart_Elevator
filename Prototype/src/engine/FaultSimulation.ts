/**
 * Fault Simulation Engine
 * 
 * Simulates various elevator fault conditions:
 * - Motor failure
 * - Brake delay/failure
 * - Overload conditions
 * - Power fluctuations
 * - Cable issues
 * 
 * @module engine/FaultSimulation
 */

import { AdvancedTelemetry } from './PhysicsEngine';

// ============== TYPES ==============

export type FaultType =
    | 'NONE'
    | 'MOTOR_OVERHEAT'
    | 'MOTOR_FAILURE'
    | 'BRAKE_DELAY'
    | 'BRAKE_FAILURE'
    | 'CABLE_TENSION_IMBALANCE'
    | 'POWER_FLUCTUATION'
    | 'OVERLOAD'
    | 'SENSOR_MALFUNCTION';

export interface FaultState {
    active: boolean;
    type: FaultType;
    severity: number; // 0-100
    startTime: number;
    duration: number; // ms, 0 = indefinite
    affectedLift: 'A' | 'B' | 'BOTH';
}

export interface FaultEffect {
    motorRpmMultiplier: number;
    motorTorqueMultiplier: number;
    temperatureOffset: number;
    brakeDelayMs: number;
    tensionImbalanceAdd: number;
    voltageDropPercent: number;
    randomFluctuation: boolean;
}

// ============== FAULT DEFINITIONS ==============

export const FAULT_EFFECTS: Record<FaultType, FaultEffect> = {
    NONE: {
        motorRpmMultiplier: 1,
        motorTorqueMultiplier: 1,
        temperatureOffset: 0,
        brakeDelayMs: 0,
        tensionImbalanceAdd: 0,
        voltageDropPercent: 0,
        randomFluctuation: false,
    },
    MOTOR_OVERHEAT: {
        motorRpmMultiplier: 0.85,
        motorTorqueMultiplier: 0.9,
        temperatureOffset: 25,
        brakeDelayMs: 0,
        tensionImbalanceAdd: 0,
        voltageDropPercent: 5,
        randomFluctuation: false,
    },
    MOTOR_FAILURE: {
        motorRpmMultiplier: 0,
        motorTorqueMultiplier: 0,
        temperatureOffset: 0,
        brakeDelayMs: 0,
        tensionImbalanceAdd: 0,
        voltageDropPercent: 0,
        randomFluctuation: false,
    },
    BRAKE_DELAY: {
        motorRpmMultiplier: 1,
        motorTorqueMultiplier: 1,
        temperatureOffset: 0,
        brakeDelayMs: 2000,
        tensionImbalanceAdd: 0,
        voltageDropPercent: 0,
        randomFluctuation: false,
    },
    BRAKE_FAILURE: {
        motorRpmMultiplier: 1,
        motorTorqueMultiplier: 1,
        temperatureOffset: 0,
        brakeDelayMs: 99999,
        tensionImbalanceAdd: 0,
        voltageDropPercent: 0,
        randomFluctuation: false,
    },
    CABLE_TENSION_IMBALANCE: {
        motorRpmMultiplier: 1,
        motorTorqueMultiplier: 1.1,
        temperatureOffset: 5,
        brakeDelayMs: 0,
        tensionImbalanceAdd: 15,
        voltageDropPercent: 0,
        randomFluctuation: true,
    },
    POWER_FLUCTUATION: {
        motorRpmMultiplier: 0.9,
        motorTorqueMultiplier: 0.85,
        temperatureOffset: 0,
        brakeDelayMs: 0,
        tensionImbalanceAdd: 0,
        voltageDropPercent: 15,
        randomFluctuation: true,
    },
    OVERLOAD: {
        motorRpmMultiplier: 0.7,
        motorTorqueMultiplier: 1.5,
        temperatureOffset: 15,
        brakeDelayMs: 500,
        tensionImbalanceAdd: 5,
        voltageDropPercent: 10,
        randomFluctuation: false,
    },
    SENSOR_MALFUNCTION: {
        motorRpmMultiplier: 1,
        motorTorqueMultiplier: 1,
        temperatureOffset: 0,
        brakeDelayMs: 0,
        tensionImbalanceAdd: 0,
        voltageDropPercent: 0,
        randomFluctuation: true,
    },
};

// ============== FAULT DESCRIPTIONS ==============

export const FAULT_DESCRIPTIONS: Record<FaultType, { title: string; description: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> = {
    NONE: { title: 'Normal Operation', description: 'No faults active', severity: 'LOW' },
    MOTOR_OVERHEAT: { title: 'Motor Overheating', description: 'Motor temperature rising above safe limits. Reduced performance.', severity: 'HIGH' },
    MOTOR_FAILURE: { title: 'Motor Failure', description: 'Complete motor shutdown. Elevator cannot move.', severity: 'CRITICAL' },
    BRAKE_DELAY: { title: 'Brake Response Delay', description: 'Brakes responding slower than normal. Extended stopping distance.', severity: 'MEDIUM' },
    BRAKE_FAILURE: { title: 'Brake System Failure', description: 'Brakes not engaging. Emergency protocols active.', severity: 'CRITICAL' },
    CABLE_TENSION_IMBALANCE: { title: 'Cable Tension Issue', description: 'Uneven tension across wire ropes. Increased vibration.', severity: 'MEDIUM' },
    POWER_FLUCTUATION: { title: 'Power Supply Unstable', description: 'Voltage fluctuations detected. Intermittent performance.', severity: 'MEDIUM' },
    OVERLOAD: { title: 'Overload Condition', description: 'Cabin weight exceeds rated capacity. Reduced speed.', severity: 'HIGH' },
    SENSOR_MALFUNCTION: { title: 'Sensor Malfunction', description: 'Position/speed sensors returning erratic data.', severity: 'MEDIUM' },
};

// ============== FAULT SIMULATION ==============

/**
 * Create initial fault state
 */
export function createInitialFaultState(): FaultState {
    return {
        active: false,
        type: 'NONE',
        severity: 0,
        startTime: 0,
        duration: 0,
        affectedLift: 'BOTH',
    };
}

/**
 * Activate a fault
 */
export function activateFault(
    type: FaultType,
    affectedLift: 'A' | 'B' | 'BOTH' = 'BOTH',
    duration: number = 0
): FaultState {
    return {
        active: type !== 'NONE',
        type,
        severity: type === 'NONE' ? 0 : Math.random() * 30 + 70, // 70-100%
        startTime: Date.now(),
        duration,
        affectedLift,
    };
}

/**
 * Apply fault effects to telemetry
 */
export function applyFaultEffects(
    telemetry: AdvancedTelemetry,
    faultState: FaultState,
    liftId: 'A' | 'B'
): AdvancedTelemetry {
    if (!faultState.active || faultState.type === 'NONE') {
        return telemetry;
    }

    // Check if this lift is affected
    if (faultState.affectedLift !== 'BOTH' && faultState.affectedLift !== liftId) {
        return telemetry;
    }

    // Check if fault has expired
    if (faultState.duration > 0 && Date.now() - faultState.startTime > faultState.duration) {
        return telemetry;
    }

    const effects = FAULT_EFFECTS[faultState.type];
    const fluctuation = effects.randomFluctuation ? (Math.random() - 0.5) * 0.2 : 0;

    return {
        ...telemetry,
        motor: {
            ...telemetry.motor,
            rpm: telemetry.motor.rpm * effects.motorRpmMultiplier * (1 + fluctuation),
            torque: telemetry.motor.torque * effects.motorTorqueMultiplier,
            temperature: telemetry.motor.temperature + effects.temperatureOffset,
            vibration: telemetry.motor.vibration * (1 + effects.tensionImbalanceAdd * 0.05),
        },
        mechanical: {
            ...telemetry.mechanical,
            tensionImbalance: telemetry.mechanical.tensionImbalance + effects.tensionImbalanceAdd,
        },
        electrical: {
            ...telemetry.electrical,
            voltage: telemetry.electrical.voltage * (1 - effects.voltageDropPercent / 100),
        },
    };
}

/**
 * Get random fault for simulation variety
 */
export function getRandomFault(): FaultType {
    const faults: FaultType[] = [
        'MOTOR_OVERHEAT',
        'BRAKE_DELAY',
        'CABLE_TENSION_IMBALANCE',
        'POWER_FLUCTUATION',
        'OVERLOAD',
        'SENSOR_MALFUNCTION',
    ];
    return faults[Math.floor(Math.random() * faults.length)];
}
