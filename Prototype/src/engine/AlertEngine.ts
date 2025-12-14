/**
 * Smart Alert Engine for Industrial Elevator Simulation
 * 
 * Provides:
 * - Real-time monitoring alerts
 * - Predictive maintenance warnings
 * - AI-powered suggestions
 * - Fault simulation capabilities
 * 
 * @module engine/AlertEngine
 */

import { AdvancedTelemetry } from './PhysicsEngine';

// ============== TYPES ==============

export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertComponent = 'MOTOR' | 'BRAKE' | 'CABLE' | 'ELECTRICAL' | 'GENERAL';

/**
 * Alert structure
 */
export interface Alert {
    id: string;
    level: AlertLevel;
    component: AlertComponent;
    code: string;
    title: string;
    message: string;
    suggestion: string;
    timestamp: Date;
    acknowledged: boolean;
    value?: number;
    threshold?: number;
}

/**
 * Predictive maintenance indicator
 */
export interface MaintenanceIndicator {
    component: string;
    healthPercent: number;
    estimatedLifeRemaining: string;
    nextServiceDate: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

/**
 * Alert thresholds configuration
 */
export interface AlertThresholds {
    motor: {
        tempWarning: number;
        tempCritical: number;
        vibrationWarning: number;
        vibrationCritical: number;
        efficiencyWarning: number;
    };
    mechanical: {
        tensionImbalanceWarning: number;
        tensionImbalanceCritical: number;
        brakeWearWarning: number;
        brakeWearCritical: number;
        brakeTempWarning: number;
        brakeTempCritical: number;
    };
    electrical: {
        voltageDropWarning: number;
        voltageDropCritical: number;
        currentOverloadWarning: number;
        currentOverloadCritical: number;
        powerFactorWarning: number;
    };
}

// ============== DEFAULT THRESHOLDS ==============

export const DEFAULT_THRESHOLDS: AlertThresholds = {
    motor: {
        tempWarning: 75,
        tempCritical: 90,
        vibrationWarning: 4.5,
        vibrationCritical: 7.0,
        efficiencyWarning: 80,
    },
    mechanical: {
        tensionImbalanceWarning: 8,
        tensionImbalanceCritical: 15,
        brakeWearWarning: 70,
        brakeWearCritical: 90,
        brakeTempWarning: 100,
        brakeTempCritical: 150,
    },
    electrical: {
        voltageDropWarning: 10,
        voltageDropCritical: 20,
        currentOverloadWarning: 110,
        currentOverloadCritical: 130,
        powerFactorWarning: 0.75,
    },
};

// ============== ALERT ENGINE ==============

/**
 * Generate unique alert ID
 */
function generateAlertId(): string {
    return `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

/**
 * Check motor alerts
 */
export function checkMotorAlerts(
    telemetry: AdvancedTelemetry,
    thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Alert[] {
    const alerts: Alert[] = [];
    const motor = telemetry.motor;

    // Temperature checks
    if (motor.temperature >= thresholds.motor.tempCritical) {
        alerts.push({
            id: generateAlertId(),
            level: 'CRITICAL',
            component: 'MOTOR',
            code: 'MOT-TEMP-CRIT',
            title: 'Motor Overheating',
            message: `Motor temperature ${motor.temperature.toFixed(1)}°C exceeds critical threshold`,
            suggestion: 'Immediate shutdown recommended. Check cooling system and reduce load.',
            timestamp: new Date(),
            acknowledged: false,
            value: motor.temperature,
            threshold: thresholds.motor.tempCritical,
        });
    } else if (motor.temperature >= thresholds.motor.tempWarning) {
        alerts.push({
            id: generateAlertId(),
            level: 'WARNING',
            component: 'MOTOR',
            code: 'MOT-TEMP-WARN',
            title: 'Motor Temperature High',
            message: `Motor temperature ${motor.temperature.toFixed(1)}°C approaching limit`,
            suggestion: 'Monitor closely. Consider reducing duty cycle.',
            timestamp: new Date(),
            acknowledged: false,
            value: motor.temperature,
            threshold: thresholds.motor.tempWarning,
        });
    }

    // Vibration checks
    if (motor.vibration >= thresholds.motor.vibrationCritical) {
        alerts.push({
            id: generateAlertId(),
            level: 'CRITICAL',
            component: 'MOTOR',
            code: 'MOT-VIB-CRIT',
            title: 'Excessive Vibration Detected',
            message: `Vibration level ${motor.vibration.toFixed(2)} mm/s exceeds safe limit`,
            suggestion: 'Stop elevator immediately. Check bearings and alignment.',
            timestamp: new Date(),
            acknowledged: false,
            value: motor.vibration,
            threshold: thresholds.motor.vibrationCritical,
        });
    } else if (motor.vibration >= thresholds.motor.vibrationWarning) {
        alerts.push({
            id: generateAlertId(),
            level: 'WARNING',
            component: 'MOTOR',
            code: 'MOT-VIB-WARN',
            title: 'Vibration Level Elevated',
            message: `Vibration level ${motor.vibration.toFixed(2)} mm/s above normal`,
            suggestion: 'Schedule bearing inspection.',
            timestamp: new Date(),
            acknowledged: false,
            value: motor.vibration,
            threshold: thresholds.motor.vibrationWarning,
        });
    }

    // Efficiency check
    if (motor.efficiency > 0 && motor.efficiency < thresholds.motor.efficiencyWarning) {
        alerts.push({
            id: generateAlertId(),
            level: 'WARNING',
            component: 'MOTOR',
            code: 'MOT-EFF-LOW',
            title: 'Low Motor Efficiency',
            message: `Motor efficiency ${motor.efficiency.toFixed(1)}% below optimal`,
            suggestion: 'Check load balance and drive parameters.',
            timestamp: new Date(),
            acknowledged: false,
            value: motor.efficiency,
            threshold: thresholds.motor.efficiencyWarning,
        });
    }

    return alerts;
}

/**
 * Check mechanical system alerts
 */
export function checkMechanicalAlerts(
    telemetry: AdvancedTelemetry,
    thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Alert[] {
    const alerts: Alert[] = [];
    const mech = telemetry.mechanical;

    // Cable tension imbalance
    if (mech.tensionImbalance >= thresholds.mechanical.tensionImbalanceCritical) {
        alerts.push({
            id: generateAlertId(),
            level: 'CRITICAL',
            component: 'CABLE',
            code: 'CBL-IMBAL-CRIT',
            title: 'Critical Cable Tension Imbalance',
            message: `Tension imbalance ${mech.tensionImbalance.toFixed(1)}% - rope failure risk`,
            suggestion: 'Immediate inspection required. Do not operate until resolved.',
            timestamp: new Date(),
            acknowledged: false,
            value: mech.tensionImbalance,
            threshold: thresholds.mechanical.tensionImbalanceCritical,
        });
    } else if (mech.tensionImbalance >= thresholds.mechanical.tensionImbalanceWarning) {
        alerts.push({
            id: generateAlertId(),
            level: 'WARNING',
            component: 'CABLE',
            code: 'CBL-IMBAL-WARN',
            title: 'Cable Tension Imbalance',
            message: `Tension imbalance ${mech.tensionImbalance.toFixed(1)}% detected`,
            suggestion: 'Schedule rope adjustment within 48 hours.',
            timestamp: new Date(),
            acknowledged: false,
            value: mech.tensionImbalance,
            threshold: thresholds.mechanical.tensionImbalanceWarning,
        });
    }

    // Brake wear
    if (mech.brakeWear >= thresholds.mechanical.brakeWearCritical) {
        alerts.push({
            id: generateAlertId(),
            level: 'CRITICAL',
            component: 'BRAKE',
            code: 'BRK-WEAR-CRIT',
            title: 'Brake Pads Critically Worn',
            message: `Brake wear ${mech.brakeWear.toFixed(0)}% - safety compromised`,
            suggestion: 'Replace brake pads immediately.',
            timestamp: new Date(),
            acknowledged: false,
            value: mech.brakeWear,
            threshold: thresholds.mechanical.brakeWearCritical,
        });
    } else if (mech.brakeWear >= thresholds.mechanical.brakeWearWarning) {
        alerts.push({
            id: generateAlertId(),
            level: 'WARNING',
            component: 'BRAKE',
            code: 'BRK-WEAR-WARN',
            title: 'Brake Pads Wearing',
            message: `Brake wear ${mech.brakeWear.toFixed(0)}% - approaching service limit`,
            suggestion: 'Schedule brake pad replacement.',
            timestamp: new Date(),
            acknowledged: false,
            value: mech.brakeWear,
            threshold: thresholds.mechanical.brakeWearWarning,
        });
    }

    // Brake temperature
    if (mech.brakeTemperature >= thresholds.mechanical.brakeTempCritical) {
        alerts.push({
            id: generateAlertId(),
            level: 'CRITICAL',
            component: 'BRAKE',
            code: 'BRK-TEMP-CRIT',
            title: 'Brake Overheating',
            message: `Brake temperature ${mech.brakeTemperature.toFixed(0)}°C - fade risk`,
            suggestion: 'Allow cooling period. Check for dragging.',
            timestamp: new Date(),
            acknowledged: false,
            value: mech.brakeTemperature,
            threshold: thresholds.mechanical.brakeTempCritical,
        });
    }

    return alerts;
}

/**
 * Check electrical system alerts
 */
export function checkElectricalAlerts(
    telemetry: AdvancedTelemetry,
    thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Alert[] {
    const alerts: Alert[] = [];
    const elec = telemetry.electrical;
    const ratedVoltage = 380;
    const ratedCurrent = 30; // Approximate rated current

    // Voltage drop
    const voltageDrop = ((ratedVoltage - elec.voltage) / ratedVoltage) * 100;
    if (voltageDrop >= thresholds.electrical.voltageDropCritical) {
        alerts.push({
            id: generateAlertId(),
            level: 'CRITICAL',
            component: 'ELECTRICAL',
            code: 'ELC-VOLT-CRIT',
            title: 'Severe Voltage Drop',
            message: `Supply voltage ${elec.voltage.toFixed(0)}V - ${voltageDrop.toFixed(1)}% below rated`,
            suggestion: 'Check power supply and connections immediately.',
            timestamp: new Date(),
            acknowledged: false,
            value: elec.voltage,
            threshold: ratedVoltage * (1 - thresholds.electrical.voltageDropCritical / 100),
        });
    } else if (voltageDrop >= thresholds.electrical.voltageDropWarning) {
        alerts.push({
            id: generateAlertId(),
            level: 'WARNING',
            component: 'ELECTRICAL',
            code: 'ELC-VOLT-WARN',
            title: 'Low Supply Voltage',
            message: `Supply voltage ${elec.voltage.toFixed(0)}V below optimal`,
            suggestion: 'Monitor and check building supply.',
            timestamp: new Date(),
            acknowledged: false,
            value: elec.voltage,
        });
    }

    // Current overload
    const currentPercent = (elec.current / ratedCurrent) * 100;
    if (currentPercent >= thresholds.electrical.currentOverloadCritical) {
        alerts.push({
            id: generateAlertId(),
            level: 'CRITICAL',
            component: 'ELECTRICAL',
            code: 'ELC-CURR-CRIT',
            title: 'Severe Current Overload',
            message: `Motor current ${elec.current.toFixed(1)}A (${currentPercent.toFixed(0)}% of rated)`,
            suggestion: 'Reduce load immediately. Check for mechanical binding.',
            timestamp: new Date(),
            acknowledged: false,
            value: elec.current,
        });
    } else if (currentPercent >= thresholds.electrical.currentOverloadWarning) {
        alerts.push({
            id: generateAlertId(),
            level: 'WARNING',
            component: 'ELECTRICAL',
            code: 'ELC-CURR-WARN',
            title: 'Current Overload',
            message: `Motor current ${elec.current.toFixed(1)}A exceeds rated`,
            suggestion: 'Monitor temperature and reduce duty cycle.',
            timestamp: new Date(),
            acknowledged: false,
            value: elec.current,
        });
    }

    // Power factor
    if (elec.powerFactor > 0 && elec.powerFactor < thresholds.electrical.powerFactorWarning) {
        alerts.push({
            id: generateAlertId(),
            level: 'WARNING',
            component: 'ELECTRICAL',
            code: 'ELC-PF-LOW',
            title: 'Low Power Factor',
            message: `Power factor ${elec.powerFactor.toFixed(2)} indicates poor efficiency`,
            suggestion: 'Check capacitor bank and drive settings.',
            timestamp: new Date(),
            acknowledged: false,
            value: elec.powerFactor,
            threshold: thresholds.electrical.powerFactorWarning,
        });
    }

    return alerts;
}

/**
 * Run all alert checks
 */
export function runAlertChecks(
    telemetry: AdvancedTelemetry,
    thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Alert[] {
    return [
        ...checkMotorAlerts(telemetry, thresholds),
        ...checkMechanicalAlerts(telemetry, thresholds),
        ...checkElectricalAlerts(telemetry, thresholds),
    ];
}

/**
 * Generate predictive maintenance indicators
 */
export function generateMaintenanceIndicators(
    telemetry: AdvancedTelemetry
): MaintenanceIndicator[] {
    const indicators: MaintenanceIndicator[] = [];

    // Motor bearings (based on vibration and running hours)
    const bearingHealth = Math.max(0, 100 - telemetry.motor.vibration * 10 - telemetry.motor.runningHours * 0.001);
    indicators.push({
        component: 'Motor Bearings',
        healthPercent: bearingHealth,
        estimatedLifeRemaining: `${Math.round(bearingHealth * 100)} hours`,
        nextServiceDate: bearingHealth > 50 ? 'In 6 months' : 'Within 30 days',
        priority: bearingHealth < 30 ? 'URGENT' : bearingHealth < 50 ? 'HIGH' : bearingHealth < 70 ? 'MEDIUM' : 'LOW',
    });

    // Brake pads
    const brakeHealth = 100 - telemetry.mechanical.brakeWear;
    indicators.push({
        component: 'Brake Pads',
        healthPercent: brakeHealth,
        estimatedLifeRemaining: `${Math.round(brakeHealth * 50)} stops`,
        nextServiceDate: brakeHealth > 30 ? 'In 3 months' : 'This week',
        priority: brakeHealth < 10 ? 'URGENT' : brakeHealth < 30 ? 'HIGH' : brakeHealth < 50 ? 'MEDIUM' : 'LOW',
    });

    // Wire ropes (based on tension imbalance and average tension)
    const ropeHealth = Math.max(0, 100 - telemetry.mechanical.tensionImbalance * 3);
    indicators.push({
        component: 'Wire Ropes',
        healthPercent: ropeHealth,
        estimatedLifeRemaining: ropeHealth > 80 ? '2+ years' : ropeHealth > 50 ? '6-12 months' : 'Inspect immediately',
        nextServiceDate: 'Annual inspection due',
        priority: ropeHealth < 50 ? 'HIGH' : ropeHealth < 70 ? 'MEDIUM' : 'LOW',
    });

    // Drive electronics (based on temperature cycles)
    const driveHealth = Math.max(0, 100 - (telemetry.motor.temperature - 25) * 0.5);
    indicators.push({
        component: 'Drive Electronics',
        healthPercent: driveHealth,
        estimatedLifeRemaining: driveHealth > 80 ? '5+ years' : '1-2 years',
        nextServiceDate: 'Annual checkup',
        priority: driveHealth < 70 ? 'MEDIUM' : 'LOW',
    });

    return indicators;
}
