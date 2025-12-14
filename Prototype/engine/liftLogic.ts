
import { LiftState, BuildingState, SimulationStats, SystemMode, ApprovalRequest, LiftStatus, Passenger, SensorReadings, SafetyStatus, ControlPanelState } from '../types/index';
import { LIFT_MAX_SPEED_MPS, TICK_RATE, FLOOR_HEIGHT_METERS, LIFT_CAPACITY_KG, INITIAL_COMPONENTS, IDLE_RETURN_TIMEOUT_MS } from '../constants/index';
import { readSensors } from './Sensors';
import { checkSafetySystem } from './SafetySystem';

export interface TickResult {
    lift: LiftState;
    building: BuildingState;
    stats: SimulationStats;
    logs: string[];
    approvalRequest?: ApprovalRequest;
}

const initialSensors: SensorReadings = {
    position: 1, velocity: 0, load: 0, doorState: 'CLOSED', levelingSensor: true, cableTension: 10000, temperature: 24
};

const initialSafety: SafetyStatus = {
    emergencyBrakeEngaged: false, doorInterlockClosed: true, overSpeedGovernorTripped: false, limitSwitchTop: false, limitSwitchBottom: true, systemHealthy: true
};

const initialPanel: ControlPanelState = {
    cabinDisplay: 'L1 - READY', activeButtons: [], serviceLight: false, fireModeLight: false
};

export const initialLiftState = (id: 'A' | 'B', startFloor: number): LiftState => ({
    id,
    currentFloor: startFloor,
    targetFloor: null,
    status: 'IDLE',
    direction: 'IDLE',
    passengers: [],
    doorOpenProgress: 0,
    totalWeight: 0,
    energyConsumed: 0,
    components: JSON.parse(JSON.stringify(INITIAL_COMPONENTS)),
    totalDistanceTraveled: 0,
    batteryLevel: 100,
    lastMoveTime: 0,
    doorOpenTimeRemaining: 0,
    // New Hardware Abstractions
    sensors: { ...initialSensors, position: startFloor },
    safety: { ...initialSafety, limitSwitchBottom: startFloor === 1 },
    panel: initialPanel
});

export const processLiftTick = (
    lift: LiftState,
    otherLift: LiftState,
    buildingState: BuildingState,
    currentStats: SimulationStats,
    systemMode: SystemMode,
    fireFloor: number | null,
    mainsSpeedMultiplier: number,
    hasMainsPower: boolean,
    isCableSnapped: boolean,
    snapTimerRef: { current: number },
    approvalRequests: ApprovalRequest[],
    simTime: number,
    timeScale: number 
): TickResult => {
    let nextLift = { ...lift };
    const nextBuilding = buildingState;
    let nextStats = { ...currentStats };
    const logs: string[] = [];
    let newApprovalRequest: ApprovalRequest | undefined = undefined;

    // --- 1. READ VIRTUAL SENSORS ---
    nextLift.sensors = readSensors(nextLift, timeScale);

    // --- 2. UPDATE SAFETY SYSTEM ---
    nextLift.safety = checkSafetySystem(nextLift.sensors, systemMode, isCableSnapped);

    // --- 3. SAFETY OVERRIDES (Hardware Interlocks) ---
    // If safety chain is broken (brakes engaged), motor power is cut.
    if (nextLift.safety.emergencyBrakeEngaged && nextLift.status !== 'MAINTENANCE') {
        // Physical stop happens here
        nextLift.status = 'EMERGENCY_HALT';
        // Force velocity to 0 effectively in physics (handled below in movement)
    }

    // --- UPDATE TOTAL WEIGHT (Physics Truth) ---
    nextLift.totalWeight = nextLift.passengers.reduce((sum, p) => sum + p.weight, 0);

    // --- UPDATE PASSENGER STATS (PEAK/MIN) ---
    const currentPaxCount = nextLift.passengers.length;
    nextStats.peakPassengers = Math.max(nextStats.peakPassengers, currentPaxCount);
    if (currentPaxCount > 0) {
        if (nextStats.minPassengers === 0) nextStats.minPassengers = currentPaxCount;
        else nextStats.minPassengers = Math.min(nextStats.minPassengers, currentPaxCount);
    }

    // --- UPDATE CONTROL PANEL STATE ---
    nextLift.panel.cabinDisplay = `${nextLift.direction === 'UP' ? '▲' : nextLift.direction === 'DOWN' ? '▼' : '●'} L${Math.round(nextLift.sensors.position)}`;
    nextLift.panel.fireModeLight = systemMode === 'FIRE_ALARM';
    nextLift.panel.serviceLight = nextLift.status === 'MAINTENANCE' || !nextLift.safety.systemHealthy;
    // Map passengers to active buttons
    nextLift.panel.activeButtons = nextLift.passengers.map(p => p.destinationFloor);


    // --- CABLE HEALTH DEGRADATION ---
    if (nextLift.status === 'MOVING') {
         const loadRatio = nextLift.totalWeight / LIFT_CAPACITY_KG;
         if (loadRatio > 0.8) {
             const degradation = 0.05 * (loadRatio - 0.7) * timeScale; 
             const cableComp = nextLift.components.find(c => c.name === 'Cable Tension');
             if (cableComp) {
                 cableComp.health = Math.max(0, cableComp.health - degradation);
                 if (cableComp.health < 50) cableComp.status = 'WARNING';
                 if (cableComp.health < 20) cableComp.status = 'CRITICAL';
             }
         }
    }
    
    // Treat 0 health as snapped
    if (nextLift.components.find(c => c.name === 'Cable Tension')?.health === 0) {
        isCableSnapped = true;
    }

    // --- 0. WAITING FOR APPROVAL STATE ---
    if (nextLift.status === 'WAITING_APPROVAL') {
         return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // --- 1. CABLE SNAP LOGIC ---
    if (isCableSnapped) {
        if ((nextLift.status as LiftStatus) === 'MAINTENANCE') {
            return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
        }

        const nearestFloor = Math.round(nextLift.currentFloor);
        const distance = Math.abs(nextLift.currentFloor - nearestFloor);

        if (distance < 0.05 && nextLift.status !== 'DOOR_OPEN') {
            nextLift.currentFloor = nearestFloor;
            nextLift.status = 'DOOR_OPEN';
            nextLift.doorOpenProgress = 1;
            nextLift.doorOpenTimeRemaining = 3.0; 
            snapTimerRef.current = 3.0; 
            logs.push(`LIFT ${nextLift.id} DARURAT: Pintu terbuka untuk evakuasi. Menunggu 3 detik...`);

        } else if (nextLift.status === 'DOOR_OPEN') {
            if (snapTimerRef.current > 0) {
                snapTimerRef.current -= (TICK_RATE / 1000) * timeScale;
            } else {
                 if (nextLift.passengers.length > 0) {
                     logs.push(`LIFT ${nextLift.id} EVAKUASI: Penumpang telah keluar.`);
                     nextLift.passengers = [];
                     nextLift.totalWeight = 0;
                 }
                 nextLift.doorOpenProgress = 0;
                 nextLift.status = 'MAINTENANCE';
                 logs.push(`LIFT ${nextLift.id} OUT OF SERVICE.`);
            }
        } else {
            nextLift.status = 'EMERGENCY_HALT';
            const direction = nearestFloor > nextLift.currentFloor ? 1 : -1;
            nextLift.currentFloor += direction * 0.02 * timeScale; 
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // --- 2. POWER OUTAGE / BATTERY LOGIC ---
    if (!hasMainsPower) {
        if (nextLift.batteryLevel > 0) {
            if (Math.abs(nextLift.currentFloor - 1) < 0.05) {
                nextLift.currentFloor = 1;
                nextLift.status = 'DOOR_OPEN';
                nextLift.doorOpenProgress = 1;
                if (nextLift.passengers.length > 0) {
                    logs.push(`LIFT ${nextLift.id} (Battery): Evakuasi Penumpang di Lantai 1.`);
                    nextStats.totalPassengersDelivered += nextLift.passengers.length;
                    nextLift.passengers = [];
                }
            } else {
                nextLift.status = 'BATTERY_MODE';
                nextLift.currentFloor -= 0.03 * timeScale;
                nextLift.batteryLevel -= 0.1 * timeScale;
                if (nextLift.currentFloor < 1) nextLift.currentFloor = 1;
            }
        } else {
            nextLift.status = 'IDLE';
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // --- 3. STANDARD OPERATIONS ---

    // Door Operations
    if (nextLift.status === 'DOOR_OPEN') {
        if (systemMode === 'EARTHQUAKE' && nextLift.currentFloor === 1) {
            // Keep open
        } else {
            // --- OVERLOAD CHECK (Hardware Sensor Based) ---
            // Use sensor load instead of perfect weight for realism logic
            if (nextLift.sensors.load > LIFT_CAPACITY_KG) {
                 const passengers = [...nextLift.passengers];
                 if (passengers.length > 0) {
                     passengers.sort((a, b) => b.weight - a.weight);
                     const heaviest = passengers[0];
                     
                     nextLift.passengers = passengers.slice(1);
                     
                     const currentFloor = Math.round(nextLift.currentFloor);
                     nextBuilding.floors[currentFloor].waitingPassengers.push(heaviest);
                     
                     logs.push(`OVERLOAD SENSOR (${Math.round(nextLift.sensors.load)}kg): ${heaviest.name} diminta keluar.`);
                     
                     nextLift.doorOpenProgress = 1;
                     nextLift.doorOpenTimeRemaining = 1.0; 
                     const cable = nextLift.components.find(c => c.name === 'Cable Tension');
                     if (cable) cable.health -= 2;
                     
                     return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
                 }
            }

            if (nextLift.doorOpenTimeRemaining > 0) {
                nextLift.doorOpenTimeRemaining -= (TICK_RATE / 1000) * timeScale;
            } else {
                nextLift.status = 'DOOR_CLOSING';
            }
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }
    
    if (nextLift.status === 'DOOR_OPENING') {
        nextLift.doorOpenProgress += 0.1 * Math.max(0.5, mainsSpeedMultiplier) * timeScale;
        if (nextLift.doorOpenProgress >= 1) {
            nextLift.doorOpenProgress = 1;
            nextLift.status = 'DOOR_OPEN';
            nextLift.doorOpenTimeRemaining = 0.5; 
            
            const currentFloor = Math.round(nextLift.currentFloor);
            
            // --- UPDATE FLOOR VISITS STATS ---
            if (!nextStats.floorVisits[currentFloor]) nextStats.floorVisits[currentFloor] = 0;
            nextStats.floorVisits[currentFloor]++;

            logs.push(`LIFT ${nextLift.id}: Pintu Terbuka di L${currentFloor}`);

            const isFireHere = systemMode === 'FIRE_ALARM' && currentFloor === fireFloor;

            if (systemMode === 'FIRE_ALARM') {
                 const riskyPax = nextLift.passengers.filter(p => p.destinationFloor === fireFloor);
                 if (riskyPax.length > 0) {
                     logs.push(`SAFETY: Penumpang tujuan L${fireFloor} dipaksa keluar karena berbahaya.`);
                     nextLift.passengers = nextLift.passengers.filter(p => p.destinationFloor !== fireFloor);
                 }
            }

            if (!isFireHere) {
                const liftPassengers = [...nextLift.passengers];
                const leaving = liftPassengers.filter(p => p.destinationFloor === currentFloor);
                const staying = liftPassengers.filter(p => p.destinationFloor !== currentFloor);

                if (leaving.length > 0) {
                    nextStats.totalPassengersDelivered += leaving.length;
                    logs.push(`LIFT ${nextLift.id}: ${leaving.length} Penumpang turun di Lantai ${currentFloor}`);
                }

                const waiting = nextBuilding.floors[currentFloor].waitingPassengers;
                const liftDir = nextLift.direction;
                const boarding: Passenger[] = [];
                const leftBehind: Passenger[] = [];

                let effectiveDirection = liftDir;
                if (staying.length === 0) effectiveDirection = 'IDLE';

                for (const p of waiting) {
                    const pDir = p.destinationFloor > p.startFloor ? 'UP' : 'DOWN';
                    const canBoard = (effectiveDirection === 'IDLE') || (effectiveDirection === pDir);
                    
                    if (canBoard) {
                        boarding.push(p);
                        
                        // --- UPDATE WAIT TIME STATS ---
                        const waitTime = simTime - p.requestTime;
                        nextStats.totalWaitTime += waitTime;
                        nextStats.totalBoarded++;
                        // Simple average update
                        if (nextStats.totalBoarded > 0) {
                            nextStats.avgWaitTime = nextStats.totalWaitTime / nextStats.totalBoarded;
                        }

                        if (effectiveDirection === 'IDLE') {
                            effectiveDirection = pDir;
                            nextLift.direction = pDir; 
                        }
                    } else {
                        leftBehind.push(p);
                    }
                }
                
                nextLift.passengers = [...staying, ...boarding];
                nextBuilding.floors[currentFloor].waitingPassengers = leftBehind;

                if (boarding.length > 0) {
                    const buttons = [...new Set(boarding.map(p => p.destinationFloor))].sort();
                    buttons.forEach(floor => {
                        logs.push(`LIFT ${nextLift.id}: Tombol L${floor} ditekan.`);
                    });
                }

            } else {
                logs.push(`FIRE ALARM: Pintu terbuka di L${currentFloor} tetapi boarding dilarang!`, 'WARNING');
            }
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }
    if (nextLift.status === 'DOOR_CLOSING') {
        nextLift.doorOpenProgress -= 0.1 * Math.max(0.5, mainsSpeedMultiplier) * timeScale;
        if (nextLift.doorOpenProgress <= 0) {
            nextLift.doorOpenProgress = 0;
            const currentFloor = Math.round(nextLift.currentFloor);
            logs.push(`LIFT ${nextLift.id}: Pintu Tertutup di L${currentFloor}`);
            
            if (nextLift.passengers.length > 0) {
                const riskyDestinations = nextLift.passengers.filter(p => 
                    (systemMode === 'FIRE_ALARM' && p.destinationFloor === fireFloor) ||
                    (systemMode === 'FLOOD' && p.destinationFloor === 1)
                );

                if (riskyDestinations.length > 0) {
                    const targetFloor = riskyDestinations[0].destinationFloor;
                    const existingReq = approvalRequests.find(r => r.liftId === nextLift.id);
                    if (!existingReq) {
                         const hazard = systemMode === 'FIRE_ALARM' ? 'KEBAKARAN' : 'BANJIR';
                         logs.push(`INTERSEPSI: Permintaan ke L${targetFloor} yang berbahaya (${hazard}). Menunggu persetujuan User.`);
                         
                         newApprovalRequest = {
                             liftId: nextLift.id,
                             targetFloor: targetFloor,
                             reason: `${hazard} di Lantai ${targetFloor}`
                         };
                    }
                    
                    nextLift.status = 'WAITING_APPROVAL';
                    return { lift: nextLift, building: nextBuilding, stats: nextStats, logs, approvalRequest: newApprovalRequest };
                }
            }

            nextLift.status = 'IDLE';
            nextLift.lastMoveTime = simTime;
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // Movement
    if (nextLift.status === 'MOVING' && nextLift.targetFloor !== null) {
        // Safety Check: Limit Switch
        if ((nextLift.direction === 'UP' && nextLift.safety.limitSwitchTop) || 
            (nextLift.direction === 'DOWN' && nextLift.safety.limitSwitchBottom)) {
            nextLift.status = 'IDLE'; // Hard stop at limits
            nextLift.targetFloor = null;
        } else {
            nextLift.lastMoveTime = simTime;
            
            const dist = Math.abs(nextLift.targetFloor - nextLift.currentFloor);
            const dir = Math.sign(nextLift.targetFloor - nextLift.currentFloor);
            let speed = LIFT_MAX_SPEED_MPS * Math.max(0.2, mainsSpeedMultiplier);
            if (dist < 0.8) speed = Math.max(0.5, speed * dist);

            const step = (speed * (TICK_RATE / 1000) * timeScale) / FLOOR_HEIGHT_METERS;

            if (dist < step) {
                nextLift.currentFloor = nextLift.targetFloor;
                
                const target = nextLift.targetFloor;
                const waitingHere = nextBuilding.floors[target].waitingPassengers.length > 0;
                const dropOffHere = nextLift.passengers.some(p => p.destinationFloor === target);
                
                if (waitingHere || dropOffHere) {
                    nextLift.status = 'DOOR_OPENING';
                } else {
                    nextLift.status = 'IDLE';
                    nextLift.targetFloor = null; 
                }
            } else {
                nextLift.currentFloor += dir * step;
                nextLift.direction = dir > 0 ? 'UP' : 'DOWN';
            }
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // Idle / Decision (SCAN)
    if (nextLift.status === 'IDLE') {
        if (nextLift.passengers.length === 0 && nextLift.currentFloor !== 1) {
            if (simTime - nextLift.lastMoveTime > (IDLE_RETURN_TIMEOUT_MS / 1000)) {
                nextLift.targetFloor = 1;
                nextLift.status = 'MOVING';
                nextLift.direction = 'DOWN';
                logs.push(`AI PREDICTIVE: Lift ${nextLift.id} kembali ke Lobby (L1) untuk antisipasi demand.`);
                return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
            }
        }

        if (systemMode === 'EARTHQUAKE' && Math.abs(nextLift.currentFloor - 1) > 0.05) {
            nextLift.targetFloor = 1;
            nextLift.status = 'MOVING';
            return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
        }

        const otherLiftBusy = otherLift.status !== 'IDLE';
        const otherLiftTarget = otherLift.targetFloor;

        const floorCalls = Object.keys(nextBuilding.floors).map(Number).filter(f => {
            if (systemMode === 'FIRE_ALARM' && f === fireFloor) return false;
            const hasPax = nextBuilding.floors[f].waitingPassengers.length > 0;
            if (!hasPax) return false;
            if (otherLiftBusy && otherLiftTarget === f) return false;
            if (systemMode === 'FLOOD' && f === 1) return false;
            
            if (!otherLiftBusy) {
                const myDist = Math.abs(f - nextLift.currentFloor);
                const otherDist = Math.abs(f - otherLift.currentFloor);
                
                if (otherDist < myDist) return false;
                if (otherDist === myDist && otherLift.id < nextLift.id) return false;
            }

            return true;
        });

        const cabinDestinations = nextLift.passengers.map(p => p.destinationFloor);
        const allTargets = new Set([...floorCalls, ...cabinDestinations]);

        if (allTargets.size === 0) {
            nextLift.direction = 'IDLE';
        } else {
            const closest = Array.from(allTargets).reduce((prev, curr) =>
                Math.abs(curr - nextLift.currentFloor) < Math.abs(prev - nextLift.currentFloor) ? curr : prev
            );
            if (Math.abs(closest - nextLift.currentFloor) < 0.1) {
                nextLift.status = 'DOOR_OPENING';
            } else {
                nextLift.targetFloor = closest;
                nextLift.status = 'MOVING';
                nextLift.direction = closest > nextLift.currentFloor ? 'UP' : 'DOWN';
            }
        }
    }

    return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
};
