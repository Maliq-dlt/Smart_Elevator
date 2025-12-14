/**
 * AI Dispatching Suggestions Engine
 * 
 * Provides intelligent recommendations for elevator dispatching
 * based on current state, passenger distribution, and efficiency metrics.
 * 
 * @module engine/AIDispatcher
 */

import { LiftState, Passenger } from '../types/index';
import { AdvancedTelemetry } from './PhysicsEngine';

// ============== TYPES ==============

export type SuggestionPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type SuggestionCategory = 'EFFICIENCY' | 'SAFETY' | 'MAINTENANCE' | 'LOAD_BALANCE';

export interface DispatchSuggestion {
    id: string;
    category: SuggestionCategory;
    priority: SuggestionPriority;
    title: string;
    description: string;
    action: string;
    reasoning: string;
    estimatedImpact: string;
}

interface DispatchContext {
    liftA: LiftState;
    liftB: LiftState;
    telemetryA: AdvancedTelemetry;
    telemetryB: AdvancedTelemetry;
    waitingPassengers: { floor: number; count: number }[];
}

// ============== SUGGESTION GENERATORS ==============

/**
 * Generate load balancing suggestions
 */
function generateLoadBalanceSuggestions(ctx: DispatchContext): DispatchSuggestion[] {
    const suggestions: DispatchSuggestion[] = [];

    const loadA = ctx.liftA.sensors.load;
    const loadB = ctx.liftB.sensors.load;
    const loadDiff = Math.abs(loadA - loadB);

    if (loadDiff >= 3) {
        const heavierLift = loadA > loadB ? 'A' : 'B';
        const lighterLift = loadA > loadB ? 'B' : 'A';

        suggestions.push({
            id: `lb-${Date.now()}`,
            category: 'LOAD_BALANCE',
            priority: loadDiff >= 5 ? 'HIGH' : 'MEDIUM',
            title: 'Load Imbalance Detected',
            description: `Lift ${heavierLift} has ${loadDiff} more passengers than Lift ${lighterLift}.`,
            action: `Route next hall calls to Lift ${lighterLift}`,
            reasoning: 'Even load distribution improves wait times and reduces wear.',
            estimatedImpact: `${Math.round(loadDiff * 5)}% faster avg response`,
        });
    }

    return suggestions;
}

/**
 * Generate efficiency suggestions
 */
function generateEfficiencySuggestions(ctx: DispatchContext): DispatchSuggestion[] {
    const suggestions: DispatchSuggestion[] = [];

    // Check for idle lift near waiting passengers
    const idleA = ctx.liftA.status === 'IDLE';
    const idleB = ctx.liftB.status === 'IDLE';

    ctx.waitingPassengers.forEach(({ floor, count }) => {
        if (count > 0) {
            if (idleA && Math.abs(ctx.liftA.sensors.floor - floor) <= 1) {
                suggestions.push({
                    id: `eff-a-${floor}-${Date.now()}`,
                    category: 'EFFICIENCY',
                    priority: 'MEDIUM',
                    title: 'Nearby Idle Lift',
                    description: `Lift A is idle near floor ${floor} with ${count} waiting.`,
                    action: `Dispatch Lift A to floor ${floor}`,
                    reasoning: 'Minimize passenger wait time with nearby lift.',
                    estimatedImpact: '~5 second faster response',
                });
            }
            if (idleB && Math.abs(ctx.liftB.sensors.floor - floor) <= 1) {
                suggestions.push({
                    id: `eff-b-${floor}-${Date.now()}`,
                    category: 'EFFICIENCY',
                    priority: 'MEDIUM',
                    title: 'Nearby Idle Lift',
                    description: `Lift B is idle near floor ${floor} with ${count} waiting.`,
                    action: `Dispatch Lift B to floor ${floor}`,
                    reasoning: 'Minimize passenger wait time with nearby lift.',
                    estimatedImpact: '~5 second faster response',
                });
            }
        }
    });

    // Regenerative braking opportunity
    const regenA = ctx.telemetryA.electrical.regeneration;
    const regenB = ctx.telemetryB.electrical.regeneration;

    if (regenA > 2 || regenB > 2) {
        suggestions.push({
            id: `regen-${Date.now()}`,
            category: 'EFFICIENCY',
            priority: 'LOW',
            title: 'Regenerative Braking Active',
            description: `${regenA > 2 ? 'Lift A' : 'Lift B'} is recovering ${Math.max(regenA, regenB).toFixed(1)} kW.`,
            action: 'Prioritize downward trips with load for energy recovery',
            reasoning: 'Maximize energy regeneration during descent.',
            estimatedImpact: '10-15% energy savings',
        });
    }

    return suggestions;
}

/**
 * Generate safety suggestions
 */
function generateSafetySuggestions(ctx: DispatchContext): DispatchSuggestion[] {
    const suggestions: DispatchSuggestion[] = [];

    // High temperature warning
    if (ctx.telemetryA.motor.temperature > 70) {
        suggestions.push({
            id: `safe-temp-a-${Date.now()}`,
            category: 'SAFETY',
            priority: ctx.telemetryA.motor.temperature > 80 ? 'HIGH' : 'MEDIUM',
            title: 'Motor Temperature Elevated',
            description: `Lift A motor at ${ctx.telemetryA.motor.temperature.toFixed(0)}°C.`,
            action: 'Reduce duty cycle for Lift A, route calls to Lift B',
            reasoning: 'Prevent motor overheating and extend equipment life.',
            estimatedImpact: 'Prevent potential shutdown',
        });
    }

    if (ctx.telemetryB.motor.temperature > 70) {
        suggestions.push({
            id: `safe-temp-b-${Date.now()}`,
            category: 'SAFETY',
            priority: ctx.telemetryB.motor.temperature > 80 ? 'HIGH' : 'MEDIUM',
            title: 'Motor Temperature Elevated',
            description: `Lift B motor at ${ctx.telemetryB.motor.temperature.toFixed(0)}°C.`,
            action: 'Reduce duty cycle for Lift B, route calls to Lift A',
            reasoning: 'Prevent motor overheating and extend equipment life.',
            estimatedImpact: 'Prevent potential shutdown',
        });
    }

    // Vibration warning
    if (ctx.telemetryA.motor.vibration > 4 || ctx.telemetryB.motor.vibration > 4) {
        const affectedLift = ctx.telemetryA.motor.vibration > 4 ? 'A' : 'B';
        suggestions.push({
            id: `safe-vib-${Date.now()}`,
            category: 'SAFETY',
            priority: 'MEDIUM',
            title: 'Increased Vibration Detected',
            description: `Lift ${affectedLift} showing elevated vibration levels.`,
            action: 'Schedule bearing inspection',
            reasoning: 'Early detection prevents bearing failure.',
            estimatedImpact: 'Avoid unplanned downtime',
        });
    }

    return suggestions;
}

/**
 * Generate maintenance suggestions
 */
function generateMaintenanceSuggestions(ctx: DispatchContext): DispatchSuggestion[] {
    const suggestions: DispatchSuggestion[] = [];

    // Brake wear
    if (ctx.telemetryA.mechanical.brakeWear > 60) {
        suggestions.push({
            id: `maint-brake-a-${Date.now()}`,
            category: 'MAINTENANCE',
            priority: ctx.telemetryA.mechanical.brakeWear > 80 ? 'HIGH' : 'MEDIUM',
            title: 'Brake Wear - Lift A',
            description: `Brake pads at ${ctx.telemetryA.mechanical.brakeWear.toFixed(0)}% wear.`,
            action: 'Schedule brake pad replacement within 2 weeks',
            reasoning: 'Preventive maintenance is cheaper than emergency repairs.',
            estimatedImpact: `~${100 - ctx.telemetryA.mechanical.brakeWear} stops remaining`,
        });
    }

    if (ctx.telemetryB.mechanical.brakeWear > 60) {
        suggestions.push({
            id: `maint-brake-b-${Date.now()}`,
            category: 'MAINTENANCE',
            priority: ctx.telemetryB.mechanical.brakeWear > 80 ? 'HIGH' : 'MEDIUM',
            title: 'Brake Wear - Lift B',
            description: `Brake pads at ${ctx.telemetryB.mechanical.brakeWear.toFixed(0)}% wear.`,
            action: 'Schedule brake pad replacement within 2 weeks',
            reasoning: 'Preventive maintenance is cheaper than emergency repairs.',
            estimatedImpact: `~${100 - ctx.telemetryB.mechanical.brakeWear} stops remaining`,
        });
    }

    return suggestions;
}

// ============== MAIN FUNCTION ==============

/**
 * Generate all AI dispatch suggestions
 */
export function generateDispatchSuggestions(
    liftA: LiftState,
    liftB: LiftState,
    telemetryA: AdvancedTelemetry,
    telemetryB: AdvancedTelemetry,
    waitingPassengers: { floor: number; count: number }[] = []
): DispatchSuggestion[] {
    const ctx: DispatchContext = {
        liftA,
        liftB,
        telemetryA,
        telemetryB,
        waitingPassengers,
    };

    const allSuggestions = [
        ...generateLoadBalanceSuggestions(ctx),
        ...generateEfficiencySuggestions(ctx),
        ...generateSafetySuggestions(ctx),
        ...generateMaintenanceSuggestions(ctx),
    ];

    // Sort by priority
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return allSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
