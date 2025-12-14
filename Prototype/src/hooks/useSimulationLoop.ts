import { useEffect, useRef } from 'react';
import { LiftState, BuildingState, SimulationStats, SystemMode, ApprovalRequest, Scenario, LogEntry } from '../types/index';
import { TICK_RATE } from '../constants/index';
import { processLiftTick } from '../engine/liftLogic';

/**
 * Configuration for the simulation loop hook.
 */
export interface SimulationConfig {
    isRunning: boolean;
    timeScale: number;
    systemMode: SystemMode;
    fireFloor: number | null;
    snapTarget: 'A' | 'B' | 'BOTH' | null;
    powerScope: 'ALL' | 'A' | 'B' | null;
    bootSequence: number;
}

/**
 * Callbacks for simulation state updates.
 */
export interface SimulationCallbacks {
    setLiftA: (fn: (prev: LiftState) => LiftState) => void;
    setLiftB: (fn: (prev: LiftState) => LiftState) => void;
    setBuilding: (state: BuildingState) => void;
    setStats: (stats: SimulationStats) => void;
    setSimTime: (fn: (prev: number) => number) => void;
    addLog: (message: string, type?: LogEntry['type']) => void;
    setApprovalRequests: (fn: (prev: ApprovalRequest[]) => ApprovalRequest[]) => void;
}

/**
 * Custom hook that manages the simulation loop.
 * Handles the core tick-based simulation logic for both elevators.
 * 
 * @param config - Configuration options for the simulation
 * @param liftA - Current state of lift A
 * @param liftB - Current state of lift B
 * @param building - Current building state
 * @param stats - Current simulation statistics
 * @param approvalRequests - Current pending approval requests
 * @param callbacks - State update callbacks
 * 
 * @example
 * useSimulationLoop(
 *   config,
 *   liftA, liftB, building, stats, approvalRequests,
 *   { setLiftA, setLiftB, setBuilding, setStats, setSimTime, addLog }
 * );
 */
export const useSimulationLoop = (
    config: SimulationConfig,
    liftA: LiftState,
    liftB: LiftState,
    building: BuildingState,
    stats: SimulationStats,
    approvalRequests: ApprovalRequest[],
    callbacks: SimulationCallbacks
): void => {
    const simTimeRef = useRef(0);
    const snapTimerA = useRef(0);
    const snapTimerB = useRef(0);

    useEffect(() => {
        if (!config.isRunning) return;

        const interval = setInterval(() => {
            // Update simulation time
            callbacks.setSimTime(prev => {
                const next = prev + (TICK_RATE / 1000) * config.timeScale;
                simTimeRef.current = next;
                return next;
            });

            const currentSimTime = simTimeRef.current;

            // Determine power status for each lift
            const liftAHasPower = config.systemMode !== 'POWER_OUTAGE' ||
                (config.powerScope !== 'ALL' && config.powerScope !== 'A');
            const liftBHasPower = config.systemMode !== 'POWER_OUTAGE' ||
                (config.powerScope !== 'ALL' && config.powerScope !== 'B');

            const globalSpeedMult = Math.max(0.2, config.bootSequence / 100);

            // Process Lift A
            const resultA = processLiftTick(
                liftA,
                liftB,
                building,
                stats,
                config.systemMode,
                config.fireFloor,
                liftAHasPower ? globalSpeedMult : 0,
                liftAHasPower,
                config.snapTarget === 'A' || config.snapTarget === 'BOTH',
                snapTimerA,
                approvalRequests,
                currentSimTime,
                config.timeScale
            );

            // Process Lift B with updated building from A
            const resultB = processLiftTick(
                liftB,
                resultA.lift,
                resultA.building,
                resultA.stats,
                config.systemMode,
                config.fireFloor,
                liftBHasPower ? globalSpeedMult : 0,
                liftBHasPower,
                config.snapTarget === 'B' || config.snapTarget === 'BOTH',
                snapTimerB,
                approvalRequests,
                currentSimTime,
                config.timeScale
            );

            // Process logs
            resultA.logs?.forEach(l => callbacks.addLog(l, l.includes('DARURAT') ? 'ERROR' : 'INFO'));
            resultB.logs?.forEach(l => callbacks.addLog(l, l.includes('DARURAT') ? 'ERROR' : 'INFO'));

            // Process approval requests
            if (resultA.approvalRequest) {
                callbacks.setApprovalRequests(prev => [...prev, resultA.approvalRequest!]);
            }
            if (resultB.approvalRequest) {
                callbacks.setApprovalRequests(prev => [...prev, resultB.approvalRequest!]);
            }

            // Update states
            callbacks.setLiftA(() => resultA.lift);
            callbacks.setLiftB(() => resultB.lift);
            callbacks.setBuilding(resultB.building);
            callbacks.setStats(resultB.stats);
        }, TICK_RATE);

        return () => clearInterval(interval);
    }, [
        config.isRunning,
        config.timeScale,
        config.systemMode,
        config.fireFloor,
        config.snapTarget,
        config.powerScope,
        config.bootSequence,
        liftA,
        liftB,
        building,
        stats,
        approvalRequests
    ]);
};
