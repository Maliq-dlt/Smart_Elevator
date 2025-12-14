/**
 * Advanced Simulation Processor
 * 
 * Integrates physics engine with elevator logic to produce
 * realistic telemetry data each simulation tick.
 * 
 * @module engine/AdvancedSimulation
 */

import {
    AdvancedTelemetry,
    MotorState,
    MechanicalState,
    ElectricalState,
    MotionState,
    createInitialTelemetry,
    calculateMotorTorque,
    calculateMotorPower,
    calculateMotorEfficiency,
    calculateTemperatureChange,
    calculateCableTensions,
    calculateTensionImbalance,
    isRegenerativeBraking,
    calculateRegenerativePower,
    calculateMotorCurrent,
    calculateVibration,
    CABIN_MASS,
    COUNTERWEIGHT_MASS,
    SHEAVE_RADIUS,
    MAX_VELOCITY,
    RATED_VOLTAGE,
} from './PhysicsEngine';
import { LiftState } from '../types/index';

/**
 * Process a simulation tick and update advanced telemetry
 * 
 * @param prevTelemetry - Previous telemetry state
 * @param liftState - Current lift state from basic simulation
 * @param deltaTime - Time step in seconds
 * @returns Updated telemetry state
 */
export function processAdvancedTick(
    prevTelemetry: AdvancedTelemetry,
    liftState: LiftState,
    deltaTime: number
): AdvancedTelemetry {
    const isMoving = liftState.status === 'MOVING';
    const direction = liftState.direction === 'UP' ? 1 : liftState.direction === 'DOWN' ? -1 : 0;
    const velocity = liftState.sensors.velocity;
    const loadMass = liftState.sensors.load * 80; // Assume 80kg per passenger
    const position = liftState.sensors.position;

    // --- MOTION STATE ---
    const motion: MotionState = {
        position,
        velocity,
        acceleration: (velocity - prevTelemetry.motion.velocity) / deltaTime,
        jerk: 0, // Simplified
        phase: isMoving
            ? (Math.abs(velocity) < 0.5 ? 'ACCEL' : Math.abs(velocity) >= MAX_VELOCITY * 0.9 ? 'CRUISE' : 'DECEL')
            : 'IDLE',
        phaseTime: prevTelemetry.motion.phase === (isMoving ? 'IDLE' : 'IDLE')
            ? prevTelemetry.motion.phaseTime + deltaTime
            : 0,
    };

    // --- MOTOR STATE ---
    const torque = isMoving
        ? calculateMotorTorque(CABIN_MASS, loadMass, COUNTERWEIGHT_MASS, motion.acceleration, direction)
        : prevTelemetry.motor.torque * 0.9; // Decay when stopped

    const rpm = isMoving
        ? Math.abs(velocity / (2 * Math.PI * SHEAVE_RADIUS)) * 60
        : prevTelemetry.motor.rpm * 0.85;

    const power = calculateMotorPower(torque, rpm);
    const loadPercent = power / 15; // 15 kW rated
    const efficiency = isMoving ? calculateMotorEfficiency(loadPercent) * 100 : prevTelemetry.motor.efficiency;

    const temperature = calculateTemperatureChange(
        prevTelemetry.motor.temperature,
        power,
        efficiency,
        deltaTime
    );

    const vibration = calculateVibration(rpm, loadPercent, prevTelemetry.mechanical.brakeWear);

    const motor: MotorState = {
        rpm: Math.max(0, rpm),
        torque: Math.max(0, torque),
        power: Math.max(0, power),
        efficiency: Math.max(0, Math.min(100, efficiency)),
        temperature: Math.max(25, temperature),
        vibration: Math.max(0, vibration),
        runningHours: prevTelemetry.motor.runningHours + (isMoving ? deltaTime / 3600 : 0),
    };

    // --- MECHANICAL STATE ---
    const cableTensions = isMoving
        ? calculateCableTensions(CABIN_MASS + loadMass, motion.acceleration, direction)
        : prevTelemetry.mechanical.cableTensions.map(t => t * 0.98 + 0.5); // Settle to static tension

    const avgTension = cableTensions.reduce((a, b) => a + b, 0) / cableTensions.length;
    const tensionImbalance = calculateTensionImbalance(cableTensions);

    // Brake wear increases on stops
    const brakeWear = prevTelemetry.mechanical.brakeWear +
        (prevTelemetry.motion.velocity !== 0 && velocity === 0 ? 0.01 : 0);

    // Brake temperature increases when engaged, cools when released
    const brakeEngaged = !isMoving && liftState.status !== 'DOOR_OPEN';
    const brakeTemp = brakeEngaged
        ? Math.min(150, prevTelemetry.mechanical.brakeTemperature + deltaTime * 0.5)
        : Math.max(25, prevTelemetry.mechanical.brakeTemperature - deltaTime * 0.3);

    const mechanical: MechanicalState = {
        sheaveSpeed: rpm,
        cableTensions,
        avgCableTension: avgTension,
        tensionImbalance,
        counterweightRatio: COUNTERWEIGHT_MASS / (CABIN_MASS + loadMass),
        brakeWear: Math.min(100, brakeWear),
        brakeTemperature: brakeTemp,
    };

    // --- ELECTRICAL STATE ---
    const isRegenerating = isRegenerativeBraking(loadMass, COUNTERWEIGHT_MASS, CABIN_MASS, direction);
    const regeneration = isMoving ? calculateRegenerativePower(power, isRegenerating) : 0;

    const powerFactor = isMoving ? 0.85 + (loadPercent * 0.1) : prevTelemetry.electrical.powerFactor;
    const voltage = RATED_VOLTAGE - (power * 0.5); // Voltage drop under load
    const current = isMoving ? calculateMotorCurrent(power, voltage, powerFactor) : prevTelemetry.electrical.current * 0.9;

    const electrical: ElectricalState = {
        voltage: Math.max(350, voltage),
        current: Math.max(0, current),
        powerFactor: Math.min(0.98, powerFactor),
        activePower: power,
        reactivePower: power * Math.tan(Math.acos(powerFactor)),
        regeneration,
        totalEnergy: prevTelemetry.electrical.totalEnergy + (power * deltaTime / 3600),
        totalRegenerated: prevTelemetry.electrical.totalRegenerated + (regeneration * deltaTime / 3600),
    };

    return {
        motor,
        mechanical,
        electrical,
        motion,
        timestamp: Date.now(),
    };
}

/**
 * Create initial advanced telemetry for a lift
 */
export function initializeAdvancedTelemetry(liftState: LiftState): AdvancedTelemetry {
    return createInitialTelemetry(liftState.sensors.position);
}
