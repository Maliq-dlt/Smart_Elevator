/**
 * Advanced Physics Engine for Industrial Elevator Simulation
 * 
 * Contains realistic physics calculations for:
 * - Motor torque and power
 * - Temperature dynamics
 * - Cable tension
 * - Regenerative braking
 * - Jerk-controlled motion profiles
 * 
 * @module engine/PhysicsEngine
 */

// ============== CONSTANTS ==============

/** Gravitational acceleration (m/s²) */
export const GRAVITY = 9.81;

/** Cabin mass without passengers (kg) */
export const CABIN_MASS = 1200;

/** Counterweight mass (kg) - typically cabin + 40-50% of rated load */
export const COUNTERWEIGHT_MASS = 1800;

/** Sheave radius (m) */
export const SHEAVE_RADIUS = 0.4;

/** Number of wire ropes */
export const NUM_ROPES = 6;

/** Motor rated power (kW) */
export const MOTOR_RATED_POWER = 15;

/** Motor rated RPM */
export const MOTOR_RATED_RPM = 1500;

/** Motor rated torque (Nm) */
export const MOTOR_RATED_TORQUE = (MOTOR_RATED_POWER * 1000 * 60) / (2 * Math.PI * MOTOR_RATED_RPM);

/** Ambient temperature (°C) */
export const AMBIENT_TEMP = 25;

/** Motor thermal mass (J/°C) */
export const MOTOR_THERMAL_MASS = 5000;

/** Motor cooling coefficient (W/°C) */
export const MOTOR_COOLING_COEFF = 50;

/** Drive efficiency */
export const DRIVE_EFFICIENCY = 0.92;

/** Mechanical efficiency */
export const MECHANICAL_EFFICIENCY = 0.95;

/** Rated voltage (V) */
export const RATED_VOLTAGE = 380;

/** Maximum jerk (m/s³) */
export const MAX_JERK = 1.5;

/** Maximum acceleration (m/s²) */
export const MAX_ACCEL = 1.2;

/** Maximum velocity (m/s) */
export const MAX_VELOCITY = 2.5;


// ============== TYPES ==============

/**
 * Motor telemetry state
 */
export interface MotorState {
    /** Motor RPM (0-1800) */
    rpm: number;
    /** Output torque (Nm) */
    torque: number;
    /** Output power (kW) */
    power: number;
    /** Efficiency (0-100%) */
    efficiency: number;
    /** Temperature (°C) */
    temperature: number;
    /** Vibration level (mm/s RMS) */
    vibration: number;
    /** Running hours */
    runningHours: number;
}

/**
 * Mechanical system state
 */
export interface MechanicalState {
    /** Sheave rotational speed (RPM) */
    sheaveSpeed: number;
    /** Cable tensions per rope (kN) */
    cableTensions: number[];
    /** Average cable tension (kN) */
    avgCableTension: number;
    /** Tension imbalance (%) */
    tensionImbalance: number;
    /** Counterweight balance ratio */
    counterweightRatio: number;
    /** Brake wear percentage (0-100%) */
    brakeWear: number;
    /** Brake temperature (°C) */
    brakeTemperature: number;
}

/**
 * Electrical system state
 */
export interface ElectricalState {
    /** Supply voltage (V) */
    voltage: number;
    /** Motor current (A) */
    current: number;
    /** Power factor (0-1) */
    powerFactor: number;
    /** Active power consumption (kW) */
    activePower: number;
    /** Reactive power (kVAR) */
    reactivePower: number;
    /** Energy regenerated this trip (kWh) */
    regeneration: number;
    /** Total energy consumed (kWh) */
    totalEnergy: number;
    /** Energy regenerated total (kWh) */
    totalRegenerated: number;
}

/**
 * Motion profile state
 */
export interface MotionState {
    /** Current position (m) */
    position: number;
    /** Current velocity (m/s) */
    velocity: number;
    /** Current acceleration (m/s²) */
    acceleration: number;
    /** Current jerk (m/s³) */
    jerk: number;
    /** Motion phase */
    phase: 'IDLE' | 'ACCEL' | 'CRUISE' | 'DECEL' | 'LEVELING';
    /** Time in current phase (s) */
    phaseTime: number;
}

/**
 * Complete advanced telemetry state
 */
export interface AdvancedTelemetry {
    motor: MotorState;
    mechanical: MechanicalState;
    electrical: ElectricalState;
    motion: MotionState;
    timestamp: number;
}


// ============== PHYSICS CALCULATIONS ==============

/**
 * Calculate required motor torque based on load and motion
 * 
 * @param cabinMass - Mass of cabin (kg)
 * @param loadMass - Passenger load (kg)
 * @param counterweightMass - Counterweight mass (kg)
 * @param acceleration - Current acceleration (m/s²)
 * @param direction - 1 for up, -1 for down, 0 for stationary
 * @returns Required torque in Nm
 */
export function calculateMotorTorque(
    cabinMass: number,
    loadMass: number,
    counterweightMass: number,
    acceleration: number,
    direction: number
): number {
    // Net force on rope (positive = motor pulling up)
    const cabinSide = (cabinMass + loadMass) * (GRAVITY + direction * acceleration);
    const cwSide = counterweightMass * (GRAVITY - direction * acceleration);
    const netForce = cabinSide - cwSide;

    // Torque = Force × Radius / Efficiency
    const torque = (netForce * SHEAVE_RADIUS) / MECHANICAL_EFFICIENCY;

    return Math.abs(torque);
}

/**
 * Calculate motor power from torque and RPM
 */
export function calculateMotorPower(torque: number, rpm: number): number {
    // P = T × ω = T × (2π × RPM / 60)
    const omega = (2 * Math.PI * rpm) / 60;
    const power = (torque * omega) / 1000; // kW
    return Math.abs(power);
}

/**
 * Calculate motor efficiency based on load percentage
 */
export function calculateMotorEfficiency(loadPercent: number): number {
    // Efficiency curve: peaks around 60-80% load
    if (loadPercent < 0.1) return 0.5;
    if (loadPercent < 0.25) return 0.75 + loadPercent;
    if (loadPercent < 0.5) return 0.85 + loadPercent * 0.1;
    if (loadPercent <= 1.0) return 0.92 - (loadPercent - 0.5) * 0.04;
    return 0.85; // Overload
}

/**
 * Calculate motor temperature change over time
 */
export function calculateTemperatureChange(
    currentTemp: number,
    power: number,
    efficiency: number,
    deltaTime: number
): number {
    // Clamp inputs to reasonable values
    const safePower = Math.max(0, Math.min(50, power));
    const safeEfficiency = Math.max(50, Math.min(98, efficiency));
    const safeTemp = Math.max(20, Math.min(120, currentTemp));

    // Power loss = Power × (1 - efficiency)
    const powerLoss = safePower * 1000 * (1 - safeEfficiency / 100);

    // Cooling = coefficient × (T - T_ambient)
    const cooling = MOTOR_COOLING_COEFF * (safeTemp - AMBIENT_TEMP);

    // Temperature change = (Heat - Cooling) / Thermal mass × dt
    const dT = ((powerLoss - cooling) / MOTOR_THERMAL_MASS) * deltaTime;

    // Clamp result to realistic range
    return Math.max(25, Math.min(110, safeTemp + dT));
}

/**
 * Calculate cable tensions for each rope
 */
export function calculateCableTensions(
    totalLoad: number,
    acceleration: number,
    direction: number
): number[] {
    // Base tension per rope
    const totalForce = totalLoad * (GRAVITY + direction * acceleration);
    const baseTension = totalForce / NUM_ROPES / 1000; // kN

    // Add slight variation for realism (±3%)
    const tensions: number[] = [];
    for (let i = 0; i < NUM_ROPES; i++) {
        const variation = 1 + (Math.random() - 0.5) * 0.06;
        tensions.push(baseTension * variation);
    }

    return tensions;
}

/**
 * Calculate tension imbalance percentage
 */
export function calculateTensionImbalance(tensions: number[]): number {
    const avg = tensions.reduce((a, b) => a + b, 0) / tensions.length;
    const maxDev = Math.max(...tensions.map(t => Math.abs(t - avg)));
    return (maxDev / avg) * 100;
}

/**
 * Check if regenerative braking is active
 * (When descending with load or ascending with light load)
 */
export function isRegenerativeBraking(
    loadMass: number,
    counterweightMass: number,
    cabinMass: number,
    direction: number
): boolean {
    const cabinSide = cabinMass + loadMass;

    if (direction > 0) {
        // Going up - regenerating if counterweight heavier
        return counterweightMass > cabinSide;
    } else if (direction < 0) {
        // Going down - regenerating if cabin side heavier
        return cabinSide > counterweightMass;
    }
    return false;
}

/**
 * Calculate regenerative power
 */
export function calculateRegenerativePower(
    power: number,
    isRegenerating: boolean
): number {
    if (!isRegenerating) return 0;
    // Regeneration efficiency typically 70-80%
    return power * 0.75;
}

/**
 * Calculate motor current from power
 */
export function calculateMotorCurrent(
    power: number,
    voltage: number,
    powerFactor: number
): number {
    // I = P / (√3 × V × PF) for 3-phase
    return (power * 1000) / (Math.sqrt(3) * voltage * powerFactor);
}

/**
 * Calculate vibration level based on speed and load
 */
export function calculateVibration(
    rpm: number,
    loadPercent: number,
    brakeWear: number
): number {
    // Base vibration proportional to speed
    const baseVibration = rpm * 0.002;

    // Load factor
    const loadFactor = 1 + loadPercent * 0.3;

    // Wear factor (worn brakes increase vibration)
    const wearFactor = 1 + (brakeWear / 100) * 0.5;

    return baseVibration * loadFactor * wearFactor;
}

/**
 * Generate S-curve motion profile (jerk-controlled)
 */
export function generateMotionProfile(
    currentVelocity: number,
    targetVelocity: number,
    deltaTime: number
): { velocity: number; acceleration: number; jerk: number } {
    const velocityError = targetVelocity - currentVelocity;

    // Simple jerk-limited acceleration
    let targetAccel = Math.sign(velocityError) * Math.min(Math.abs(velocityError) / deltaTime, MAX_ACCEL);

    // Limit jerk
    const maxAccelChange = MAX_JERK * deltaTime;
    const accel = Math.max(-maxAccelChange, Math.min(maxAccelChange, targetAccel));

    const newVelocity = currentVelocity + accel * deltaTime;

    return {
        velocity: Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVelocity)),
        acceleration: accel,
        jerk: accel / deltaTime
    };
}


// ============== INITIAL STATES ==============

/**
 * Create initial motor state
 */
export function createInitialMotorState(): MotorState {
    return {
        rpm: 0,
        torque: 0,
        power: 0,
        efficiency: 0,
        temperature: AMBIENT_TEMP,
        vibration: 0,
        runningHours: 0
    };
}

/**
 * Create initial mechanical state
 */
export function createInitialMechanicalState(): MechanicalState {
    return {
        sheaveSpeed: 0,
        cableTensions: Array(NUM_ROPES).fill(0),
        avgCableTension: 0,
        tensionImbalance: 0,
        counterweightRatio: COUNTERWEIGHT_MASS / (CABIN_MASS + 400), // Assume 50% load
        brakeWear: Math.random() * 30, // Random initial wear 0-30%
        brakeTemperature: AMBIENT_TEMP
    };
}

/**
 * Create initial electrical state
 */
export function createInitialElectricalState(): ElectricalState {
    return {
        voltage: RATED_VOLTAGE,
        current: 0,
        powerFactor: 0.85,
        activePower: 0,
        reactivePower: 0,
        regeneration: 0,
        totalEnergy: 0,
        totalRegenerated: 0
    };
}

/**
 * Create initial motion state
 */
export function createInitialMotionState(startPosition: number = 0): MotionState {
    return {
        position: startPosition,
        velocity: 0,
        acceleration: 0,
        jerk: 0,
        phase: 'IDLE',
        phaseTime: 0
    };
}

/**
 * Create complete initial telemetry
 */
export function createInitialTelemetry(startPosition: number = 0): AdvancedTelemetry {
    return {
        motor: createInitialMotorState(),
        mechanical: createInitialMechanicalState(),
        electrical: createInitialElectricalState(),
        motion: createInitialMotionState(startPosition),
        timestamp: Date.now()
    };
}
